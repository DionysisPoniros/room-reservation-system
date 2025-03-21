import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  Timestamp,
  orderBy,
  limit,
  startAfter
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Collection references
const roomsCollection = collection(db, 'rooms');
const reservationsCollection = collection(db, 'reservations');

// Get all rooms with optional filtering
export const getRooms = async (filters = {}) => {
  try {
    let roomQuery = roomsCollection;
    
    // Apply filters if provided
    if (filters.capacity) {
      roomQuery = query(roomQuery, where("capacity", ">=", parseInt(filters.capacity)));
    }
    
    if (filters.type) {
      roomQuery = query(roomQuery, where("type", "==", filters.type));
    }
    
    if (filters.building) {
      roomQuery = query(roomQuery, where("building", "==", filters.building));
    }
    
    if (filters.equipment && filters.equipment.length > 0) {
      roomQuery = query(roomQuery, where("equipment", "array-contains-any", filters.equipment));
    }
    
    const snapshot = await getDocs(roomQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting rooms:", error);
    throw error;
  }
};

// Get a specific room
export const getRoom = async (id) => {
  try {
    const roomDoc = doc(db, 'rooms', id);
    const roomSnapshot = await getDoc(roomDoc);
    
    if (roomSnapshot.exists()) {
      return {
        id: roomSnapshot.id,
        ...roomSnapshot.data()
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting room:", error);
    throw error;
  }
};

// Create a reservation
export const createReservation = async (reservationData) => {
  try {
    // Convert Date objects to Firestore Timestamps
    const data = {
      ...reservationData,
      startTime: Timestamp.fromDate(new Date(reservationData.startTime)),
      endTime: Timestamp.fromDate(new Date(reservationData.endTime)),
      createdAt: Timestamp.now()
    };
    
    return await addDoc(reservationsCollection, data);
  } catch (error) {
    console.error("Error creating reservation:", error);
    throw error;
  }
};

// Get reservations for a room
export const getRoomReservations = async (roomId) => {
  try {
    const q = query(
      reservationsCollection, 
      where("roomId", "==", roomId),
      where("status", "!=", "cancelled"),
      orderBy("status"),
      orderBy("startTime")
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting room reservations:", error);
    throw error;
  }
};

// Get reservations for a user
export const getUserReservations = async (userId) => {
  try {
    const q = query(
      reservationsCollection, 
      where("userId", "==", userId),
      orderBy("startTime", "desc")
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting user reservations:", error);
    throw error;
  }
};

// Cancel a reservation
export const cancelReservation = async (reservationId) => {
  try {
    const reservationRef = doc(db, 'reservations', reservationId);
    await updateDoc(reservationRef, {
      status: 'cancelled',
      cancelledAt: Timestamp.now()
    });
  } catch (error) {
    console.error("Error cancelling reservation:", error);
    throw error;
  }
};

// Check room availability
export const checkRoomAvailability = async (roomId, startTime, endTime) => {
  try {
    const start = Timestamp.fromDate(new Date(startTime));
    const end = Timestamp.fromDate(new Date(endTime));
    
    // Query for any overlapping reservations that are not cancelled
    const q = query(
      reservationsCollection,
      where("roomId", "==", roomId),
      where("status", "!=", "cancelled")
    );
    
    const snapshot = await getDocs(q);
    const reservations = snapshot.docs.map(doc => doc.data());
    
    // Check if there are any overlapping reservations
    const overlapping = reservations.filter(reservation => {
      return (
        (start.seconds >= reservation.startTime.seconds && start.seconds < reservation.endTime.seconds) || // Start time is within an existing reservation
        (end.seconds > reservation.startTime.seconds && end.seconds <= reservation.endTime.seconds) || // End time is within an existing reservation
        (start.seconds <= reservation.startTime.seconds && end.seconds >= reservation.endTime.seconds) // New reservation completely encompasses an existing one
      );
    });
    
    return overlapping.length === 0;
  } catch (error) {
    console.error("Error checking room availability:", error);
    throw error;
  }
};

// Search for available rooms
export const searchAvailableRooms = async (startTime, endTime, filters = {}) => {
  try {
    // First get all rooms matching the filters
    const rooms = await getRooms(filters);
    
    // Then check availability for each room
    const availabilityPromises = rooms.map(async room => {
      const isAvailable = await checkRoomAvailability(room.id, startTime, endTime);
      return { ...room, available: isAvailable };
    });
    
    const roomsWithAvailability = await Promise.all(availabilityPromises);
    
    // Filter to only available rooms
    return roomsWithAvailability.filter(room => room.available);
  } catch (error) {
    console.error("Error searching available rooms:", error);
    throw error;
  }
};

// Get popular rooms (most booked)
export const getPopularRooms = async (limit = 5) => {
  try {
    // This is a more complex query that requires aggregation
    // For now, we'll just get all reservations and do the counting in JS
    const snapshot = await getDocs(reservationsCollection);
    
    const reservations = snapshot.docs.map(doc => doc.data());
    
    // Count reservations by roomId
    const roomCounts = {};
    reservations.forEach(reservation => {
      if (reservation.status !== 'cancelled') {
        roomCounts[reservation.roomId] = (roomCounts[reservation.roomId] || 0) + 1;
      }
    });
    
    // Convert to array and sort
    const popularRoomIds = Object.entries(roomCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(entry => entry[0]);
    
    // Get room details for each popular room
    const popularRooms = await Promise.all(
      popularRoomIds.map(async roomId => {
        const room = await getRoom(roomId);
        return { ...room, bookingCount: roomCounts[roomId] };
      })
    );
    
    return popularRooms;
  } catch (error) {
    console.error("Error getting popular rooms:", error);
    throw error;
  }
};

// Get room utilization stats
export const getRoomUtilizationStats = async (roomId, startDate, endDate) => {
  try {
    const start = Timestamp.fromDate(new Date(startDate));
    const end = Timestamp.fromDate(new Date(endDate));
    
    const q = query(
      reservationsCollection,
      where("roomId", "==", roomId),
      where("startTime", ">=", start),
      where("startTime", "<=", end),
      where("status", "!=", "cancelled")
    );
    
    const snapshot = await getDocs(q);
    const reservations = snapshot.docs.map(doc => doc.data());
    
    // Calculate total hours booked
    let totalHoursBooked = 0;
    reservations.forEach(reservation => {
      const durationHours = (reservation.endTime.seconds - reservation.startTime.seconds) / 3600;
      totalHoursBooked += durationHours;
    });
    
    // Calculate utilization percentage (assuming 12 operating hours per day)
    const totalDays = Math.ceil((end.seconds - start.seconds) / (86400)); // 86400 seconds in a day
    const totalAvailableHours = totalDays * 12;
    const utilizationPercentage = (totalHoursBooked / totalAvailableHours) * 100;
    
    return {
      totalReservations: reservations.length,
      totalHoursBooked: totalHoursBooked,
      utilizationPercentage: utilizationPercentage,
      averageReservationLength: totalHoursBooked / reservations.length || 0
    };
  } catch (error) {
    console.error("Error getting room utilization stats:", error);
    throw error;
  }
};
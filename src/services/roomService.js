// src/services/roomService.js - Performance optimized
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

// Get all rooms with optional filtering (optimized version)
export const getRooms = async (filters = {}) => {
  try {
    // Use a single query instead of fetching all rooms and filtering client-side
    // when possible
    let roomQuery = roomsCollection;
    
    // Only add where clauses for database-indexed fields to keep queries efficient
    // For non-indexed fields, we'll filter client-side
    
    // Check if there are indexed filters to apply
    const hasIndexedFilters = filters.building && filters.building !== '';
    
    if (hasIndexedFilters) {
      console.log("Using server-side filtering");
      if (filters.building) {
        roomQuery = query(roomQuery, where("building", "==", filters.building));
      }
    }
    
    // Always order by name for consistent results
    roomQuery = query(roomQuery, orderBy("name"));
    
    // Execute the query
    const snapshot = await getDocs(roomQuery);
    let rooms = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Apply client-side filters for non-indexed fields
    if (filters.capacity) {
      const minCapacity = parseInt(filters.capacity);
      rooms = rooms.filter(room => room.capacity >= minCapacity);
    }
    
    if (!hasIndexedFilters && filters.type && filters.type !== '') {
      rooms = rooms.filter(room => room.type === filters.type);
    }
    
    if (filters.equipment && filters.equipment.length > 0) {
      rooms = rooms.filter(room => {
        return room.equipment && filters.equipment.some(item => 
          room.equipment.includes(item)
        );
      });
    }
    
    console.log(`Found ${rooms.length} rooms matching filters`);
    return rooms;
  } catch (error) {
    console.error("Error getting rooms:", error);
    throw error;
  }
};

// Get a specific room (with caching)
const roomCache = new Map();
export const getRoom = async (id) => {
  try {
    // Check cache first
    if (roomCache.has(id)) {
      return roomCache.get(id);
    }
    
    const roomDoc = doc(db, 'rooms', id);
    const roomSnapshot = await getDoc(roomDoc);
    
    if (roomSnapshot.exists()) {
      const roomData = {
        id: roomSnapshot.id,
        ...roomSnapshot.data()
      };
      
      // Update cache
      roomCache.set(id, roomData);
      return roomData;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting room:", error);
    throw error;
  }
};

// Get all reservations for a specific date range (more efficient)
export const getReservationsForDate = async (startDate, endDate) => {
  try {
    const startTimestamp = Timestamp.fromDate(new Date(startDate));
    const endTimestamp = Timestamp.fromDate(new Date(endDate));
    
    // Query for any reservations that overlap with this date range
    const q = query(
      reservationsCollection,
      where("status", "!=", "cancelled"),
      where("startTime", "<=", endTimestamp),
      where("endTime", ">=", startTimestamp),
      orderBy("startTime")
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting reservations for date:", error);
    throw error;
  }
};

// Create a reservation
export const createReservation = async (reservationData) => {
  try {
    console.log("Creating reservation with data:", reservationData);
    
    // Ensure startTime and endTime are properly formatted Date objects
    const startTime = reservationData.startTime instanceof Date 
      ? reservationData.startTime 
      : new Date(reservationData.startTime);
    
    const endTime = reservationData.endTime instanceof Date 
      ? reservationData.endTime 
      : new Date(reservationData.endTime);
    
    console.log(`Normalized times: ${startTime.toLocaleString()} to ${endTime.toLocaleString()}`);
    
    // Convert Date objects to Firestore Timestamps
    const data = {
      ...reservationData,
      startTime: Timestamp.fromDate(startTime),
      endTime: Timestamp.fromDate(endTime),
      createdAt: Timestamp.now()
    };
    
    const docRef = await addDoc(reservationsCollection, data);
    console.log(`Created reservation with ID: ${docRef.id}`);
    
    return docRef;
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

// Get user's daily bookings for tracking 5-hour limit
export const getUserDailyBookings = async (userId, startDate, endDate) => {
  try {
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);
    
    const q = query(
      reservationsCollection,
      where("userId", "==", userId),
      where("status", "!=", "cancelled"),
      where("startTime", ">=", startTimestamp),
      where("startTime", "<", endTimestamp)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting user daily bookings:", error);
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

// Check room availability (optimized)
export const checkRoomAvailability = async (roomId, startTime, endTime) => {
  try {
    // Convert to timestamps for comparison
    const start = Timestamp.fromDate(new Date(startTime));
    const end = Timestamp.fromDate(new Date(endTime));
    
    // Get all active reservations for this room that might overlap
    // This query is more efficient by using Firebase's query capabilities
    const q = query(
      reservationsCollection,
      where("roomId", "==", roomId),
      where("status", "!=", "cancelled"),
      where("startTime", "<=", end),  // Reservation starts before our end time
      where("endTime", ">=", start)   // Reservation ends after our start time
    );
    
    const snapshot = await getDocs(q);
    
    // If any reservations match, the room is unavailable
    return snapshot.empty;
  } catch (error) {
    console.error("Error checking room availability:", error);
    throw error;
  }
};

// Search for available rooms (optimized)
export const searchAvailableRooms = async (startTime, endTime, filters = {}) => {
  try {
    console.log(`Searching for available rooms from ${new Date(startTime).toLocaleString()} to ${new Date(endTime).toLocaleString()}`);
    
    // Convert times to timestamps
    const start = Timestamp.fromDate(new Date(startTime));
    const end = Timestamp.fromDate(new Date(endTime));
    
    // First get all rooms matching the filters
    const rooms = await getRooms(filters);
    console.log(`Found ${rooms.length} rooms matching filters, checking availability...`);
    
    if (rooms.length === 0) return [];
    
    // Get all reservations that might conflict with our time range
    // This is more efficient than checking each room individually
    const reservationsQuery = query(
      reservationsCollection,
      where("status", "!=", "cancelled"),
      where("startTime", "<=", end),
      where("endTime", ">=", start)
    );
    
    const reservationsSnapshot = await getDocs(reservationsQuery);
    const reservations = reservationsSnapshot.docs.map(doc => doc.data());
    
    // Group reservations by roomId for quick lookup
    const reservationsByRoom = {};
    reservations.forEach(res => {
      if (!reservationsByRoom[res.roomId]) {
        reservationsByRoom[res.roomId] = [];
      }
      reservationsByRoom[res.roomId].push(res);
    });
    
    // Filter out rooms that have conflicting reservations
    const availableRooms = rooms.filter(room => {
      const roomReservations = reservationsByRoom[room.id] || [];
      return roomReservations.length === 0;
    });
    
    console.log(`Found ${availableRooms.length} available rooms for the requested time period`);
    return availableRooms;
  } catch (error) {
    console.error("Error searching available rooms:", error);
    throw error;
  }
};

// Get popular rooms (most booked) with caching
let cachedPopularRooms = null;
let popularRoomsCacheTime = null;
const POPULAR_ROOMS_CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export const getPopularRooms = async (limit = 5) => {
  try {
    const now = Date.now();
    
    // Check if we have valid cached data
    if (cachedPopularRooms && popularRoomsCacheTime && now - popularRoomsCacheTime < POPULAR_ROOMS_CACHE_EXPIRY) {
      console.log('Using cached popular rooms data');
      return cachedPopularRooms.slice(0, limit);
    }
    
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
      .map(entry => entry[0]);
    
    // Get room details for each popular room
    const popularRooms = await Promise.all(
      popularRoomIds.map(async roomId => {
        const room = await getRoom(roomId);
        return { ...room, bookingCount: roomCounts[roomId] };
      })
    );
    
    // Update cache
    cachedPopularRooms = popularRooms;
    popularRoomsCacheTime = now;
    
    return popularRooms.slice(0, limit);
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
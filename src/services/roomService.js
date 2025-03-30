// src/services/roomService.js - Fixed filtering logic
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
import { roomOverlays } from '../data/roomOverlays';
// Collection references
const roomsCollection = collection(db, 'rooms');
const reservationsCollection = collection(db, 'reservations');
const normalizeRoomId = (id) => {
  // Remove any invalid characters for Firestore
  return id.replace(/[/\\#$.\[\]]/g, "-");
};
// Fixed getRooms function for roomService.js
export const getRooms = async (filters = {}) => {
  try {
    console.log("Getting rooms with filters:", JSON.stringify(filters, null, 2));
    
    // Create base query
    let roomQuery = roomsCollection;
    
    // Build query
    if (filters.building && filters.building !== '') {
      console.log(`Creating building query for "${filters.building}"`);
      roomQuery = query(roomQuery, where("building", "==", filters.building));
    }
    
    // Always order by name for consistent results
    roomQuery = query(roomQuery, orderBy("name"));
    
    // Execute the query
    const snapshot = await getDocs(roomQuery);
    
    let rooms = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`Initial query returned ${rooms.length} rooms`);
    
    // Apply client-side filters for other fields
    
    // Filter by room type
    if (filters.type && filters.type !== '') {
      console.log(`Filtering for room type: "${filters.type}"`);
      rooms = rooms.filter(room => {
        const result = room.type === filters.type;
        if (!result) console.log(`Room ${room.name} filtered out - has type ${room.type}, not ${filters.type}`);
        return result;
      });
      console.log(`After type filter: ${rooms.length} rooms`);
    }
    
    // Filter by capacity
    if (filters.capacity && parseInt(filters.capacity) > 0) {
      const minCapacity = parseInt(filters.capacity);
      console.log(`Filtering for rooms with capacity >= ${minCapacity}`);
      rooms = rooms.filter(room => {
        const hasCapacity = room.capacity >= minCapacity;
        if (!hasCapacity) console.log(`Room ${room.name} filtered out - capacity ${room.capacity} < ${minCapacity}`);
        return hasCapacity;
      });
      console.log(`After capacity filter: ${rooms.length} rooms`);
    }
    
    // Filter by equipment
    if (filters.equipment && Array.isArray(filters.equipment) && filters.equipment.length > 0) {
      console.log(`Filtering for equipment:`, filters.equipment);
      rooms = rooms.filter(room => {
        if (!room.equipment || !Array.isArray(room.equipment)) {
          console.log(`Room ${room.name} filtered out - no equipment data`);
          return false;
        }
        
        // Check if ALL required equipment is available in the room
        const hasAllEquipment = filters.equipment.every(item => room.equipment.includes(item));
        
        if (!hasAllEquipment) {
          console.log(`Room ${room.name} filtered out - missing required equipment`);
          console.log(`Room has: ${room.equipment.join(', ')}`);
          console.log(`Required: ${filters.equipment.join(', ')}`);
        }
        
        return hasAllEquipment;
      });
      console.log(`After equipment filter: ${rooms.length} rooms`);
    }
    
    console.log(`Final filtered result: ${rooms.length} rooms`);
    return rooms;
  } catch (error) {
    console.error("Error getting rooms:", error);
    throw error;
  }
}

// Get a specific room (with caching)
const roomCache = new Map();
// Modify getRoom function in src/services/roomService.js
export const getRoom = async (id) => {
  try {
    console.log(`Getting room with ID: ${id}`);
    
    // First, try direct lookup by ID (probably won't work but try anyway)
    try {
      const roomDoc = doc(db, 'rooms', id);
      const roomSnapshot = await getDoc(roomDoc);
      
      if (roomSnapshot.exists()) {
        return {
          id: roomSnapshot.id,
          ...roomSnapshot.data()
        };
      }
    } catch (err) {
      console.log(`Direct lookup failed for ${id}, trying name search`);
    }
    
    // If direct lookup fails, search by name containing the ID
    const roomsQuery = query(collection(db, 'rooms'));
    const roomsSnapshot = await getDocs(roomsQuery);
    
    // Find the first room where the name contains the ID (like "LOW-3059")
    const matchingRoom = roomsSnapshot.docs.find(doc => {
      const roomData = doc.data();
      return roomData.name && roomData.name.includes(id);
    });
    
    if (matchingRoom) {
      console.log(`Found room by name match: ${matchingRoom.data().name}`);
      return {
        id: matchingRoom.id,
        ...matchingRoom.data()
      };
    }
    
    // If still not found, fall back to roomOverlays
    console.log(`Room not found in database, checking roomOverlays`);
    
    // [existing roomOverlays fallback logic]
    
    console.log(`Room ${id} not found anywhere`);
    return null;
  } catch (error) {
    console.error("Error getting room:", error);
    throw error;
  }
};

// Get all reservations for a specific date range (more efficient)
export const getReservationsForDate = async (startDate, endDate) => {
  try {
    console.log(`Getting reservations from ${startDate} to ${endDate}`);
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
    const reservations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`Found ${reservations.length} reservations for the date range`);
    return reservations;
  } catch (error) {
    console.error("Error getting reservations for date:", error);
    throw error;
  }
};

// Create a reservation
// Enhanced createReservation function with better error handling
export const createReservation = async (reservationData) => {
  try {
    console.log("Creating reservation with data:", JSON.stringify(reservationData, (key, value) => {
      // Handle Date objects in logging
      if (value instanceof Date) return value.toISOString();
      return value;
    }, 2));
    
    // Validate required fields
    const requiredFields = ['roomId', 'userId', 'startTime', 'endTime', 'status'];
    const missingFields = requiredFields.filter(field => !reservationData[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    // Ensure startTime and endTime are properly formatted Date objects
    let startTime, endTime;
    
    try {
      startTime = reservationData.startTime instanceof Date 
        ? reservationData.startTime 
        : new Date(reservationData.startTime);
      
      endTime = reservationData.endTime instanceof Date 
        ? reservationData.endTime 
        : new Date(reservationData.endTime);
      
      // Check if dates are valid
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        throw new Error("Invalid date format for startTime or endTime");
      }
      
      // Check that start time is before end time
      if (startTime >= endTime) {
        throw new Error("Start time must be before end time");
      }
      
      console.log(`Normalized times: ${startTime.toLocaleString()} to ${endTime.toLocaleString()}`);
    } catch (dateError) {
      console.error("Date conversion error:", dateError);
      throw new Error(`Date conversion failed: ${dateError.message}`);
    }
    
    // Convert Date objects to Firestore Timestamps
    const data = {
      ...reservationData,
      startTime: Timestamp.fromDate(startTime),
      endTime: Timestamp.fromDate(endTime),
      createdAt: Timestamp.now()
    };
    
    // Double-check we have valid Timestamps before proceeding
    if (!data.startTime || !data.startTime.seconds || !data.endTime || !data.endTime.seconds) {
      throw new Error("Failed to create valid Firestore Timestamps");
    }
    
    // Log the final data being sent to Firestore
    console.log("Sending to Firestore:", {
      ...data,
      startTime: `Timestamp(${data.startTime.seconds})`,
      endTime: `Timestamp(${data.endTime.seconds})`,
      createdAt: `Timestamp(${data.createdAt.seconds})`
    });
    
    // Attempt to add the document
    try {
      const docRef = await addDoc(reservationsCollection, data);
      console.log(`Created reservation with ID: ${docRef.id}`);
      return docRef;
    } catch (firestoreError) {
      console.error("Firestore error:", firestoreError);
      
      // Check for common Firestore errors
      if (firestoreError.code === 'permission-denied') {
        throw new Error("You don't have permission to create reservations");
      } else if (firestoreError.code === 'unavailable') {
        throw new Error("Database is currently unavailable. Please try again later");
      } else if (firestoreError.code === 'invalid-argument') {
        throw new Error("Invalid data format for reservation");
      } else {
        throw new Error(`Database error: ${firestoreError.message}`);
      }
    }
  } catch (error) {
    console.error("Error creating reservation:", error);
    // Re-throw with more information if needed
    if (error.message.startsWith("Error")) {
      throw error; // Already has a descriptive message
    } else {
      throw new Error(`Reservation creation failed: ${error.message}`);
    }
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
// Improved getUserDailyBookings function
export const getUserDailyBookings = async (userId, startDate, endDate) => {
  try {
    // Ensure we have proper Date objects
    const startDay = new Date();
    startDay.setHours(0, 0, 0, 0); // Start of today
        
    const endDay = new Date();
    endDay.setHours(23, 59, 59, 999); // End of today
    
    const startTimestamp = Timestamp.fromDate(startDay);
    const endTimestamp = Timestamp.fromDate(endDay);
    const now = Timestamp.now();
    const userAllowanceRef = doc(db, 'userAllowances', userId);
    const userAllowanceSnap = await getDoc(userAllowanceRef);
    const dailyLimit = userAllowanceSnap.exists() ? 
    userAllowanceSnap.data().dailyHours : 5;
    
    console.log(`Getting bookings for ${userId} from ${startDay.toLocaleString()} to ${endDay.toLocaleString()}`);
    
    // Find reservations that:
    // 1. Belong to this user
    // 2. Are not cancelled
    // 3. EITHER: Start within the date range OR End within the date range OR Span across the date range
    const q = query(
      reservationsCollection,
      where("userId", "==", userId),
      where("status", "!=", "cancelled")
    );
    
    const snapshot = await getDocs(q);
    
    // Filter the results to include only bookings that overlap with the specified date range
    // and exclude reservations that have already ended
    const filteredBookings = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(booking => {
        const bookingStart = booking.startTime;
        const bookingEnd = booking.endTime;
        
        // Keep only bookings that overlap with the date range
        const overlapsWithDateRange = (
          // Starts within date range
          (bookingStart.seconds >= startTimestamp.seconds && 
           bookingStart.seconds <= endTimestamp.seconds) ||
          // Ends within date range
          (bookingEnd.seconds >= startTimestamp.seconds && 
           bookingEnd.seconds <= endTimestamp.seconds) ||
          // Spans across date range
          (bookingStart.seconds <= startTimestamp.seconds && 
           bookingEnd.seconds >= endTimestamp.seconds)
        );
        
        // Exclude reservations that have already ended
        const hasNotEnded = bookingEnd.seconds >= now.seconds;
        
        return overlapsWithDateRange && hasNotEnded;
      });
    
    console.log(`Found ${filteredBookings.length} active bookings for today`);
    
    // Calculate the exact hours booked for today
    const bookingsWithHours = filteredBookings.map(booking => {
      // Convert timestamps to Date objects
      const bookingStart = new Date(booking.startTime.seconds * 1000);
      const bookingEnd = new Date(booking.endTime.seconds * 1000);
      
      // Clamp the start and end times to today's boundaries if they cross day boundaries
      const effectiveStart = new Date(Math.max(bookingStart.getTime(), startDay.getTime()));
      const effectiveEnd = new Date(Math.min(bookingEnd.getTime(), endDay.getTime()));
      
      // Calculate duration in hours
      const durationMs = effectiveEnd.getTime() - effectiveStart.getTime();
      const durationHours = durationMs / (1000 * 60 * 60);
      
      return {
        ...booking,
        effectiveStart,
        effectiveEnd,
        durationHours
      };
    });
    const bookingsWithRooms = await Promise.all(bookingsWithHours.map(async (booking) => {
      try {
        const roomData = await getRoom(booking.roomId);
        return { ...booking, room: roomData };
      } catch (err) {
        console.error(`Error fetching room for booking ${booking.id}:`, err);
        return booking;
      }
    }));
    const totalHoursBooked = bookingsWithHours.reduce((total, booking) => total + booking.durationHours, 0);
    console.log(`Total hours booked for today: ${totalHoursBooked.toFixed(2)}`);
    
    return {
      bookings: bookingsWithRooms,
      totalHoursBooked,
      dailyLimit
    };
  } catch (error) {
    console.error("Error getting user daily bookings:", error);
    throw error;
  }
};

// Get reservations for a user
export const getUserReservations = async (userId) => {
  try {
    // Create an array to store all reservations
    let allReservations = [];
    
    // Query 1: Get reservations where the user is the primary booker
    const primaryQuery = query(
      reservationsCollection, 
      where("userId", "==", userId),
      orderBy("startTime", "desc")
    );
    
    const primarySnapshot = await getDocs(primaryQuery);
    const primaryReservations = primarySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      isPrimaryBooker: true // Add a flag to indicate this user is the primary booker
    }));
    
    allReservations = [...primaryReservations];
    
    // Query 2: Get reservations where the user is a collaborator
    const collaboratorQuery = query(
      reservationsCollection,
      where("collaborators", "array-contains", {
        userId: userId,
        email: currentUser.email, // Add this field
        status: "pending"
      }),
      orderBy("startTime", "desc")
    );
    
    try {
      const collaboratorSnapshot = await getDocs(collaboratorQuery);
      const collaboratorReservations = collaboratorSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        isPrimaryBooker: false, // User is a collaborator, not the primary booker
        collaborationStatus: "invited" // Status of the collaboration
      }));
      
      allReservations = [...allReservations, ...collaboratorReservations];
    } catch (err) {
      // If this query fails, it might be due to missing index or field structure
      // We can still return the primary reservations
      console.error("Error fetching collaborative reservations:", err);
    }
    
    // Sort all reservations by start time (most recent first)
    allReservations.sort((a, b) => {
      const aTime = a.startTime?.seconds || 0;
      const bTime = b.startTime?.seconds || 0;
      return bTime - aTime; // Descending order
    });
    
    return allReservations;
  } catch (error) {
    console.error("Error getting user reservations:", error);
    throw error;
  }
};


export const respondToCollaboration = async (reservationId, userId, response) => {
  try {
    // Valid responses are: 'accepted', 'declined'
    if (!['accepted', 'declined'].includes(response)) {
      throw new Error("Invalid response. Must be 'accepted' or 'declined'");
    }
    
    // Get the reservation
    const reservationRef = doc(db, 'reservations', reservationId);
    const reservationSnap = await getDoc(reservationRef);
    
    if (!reservationSnap.exists()) {
      throw new Error("Reservation not found");
    }
    
    const reservationData = reservationSnap.data();
    
    // Find the collaborator and update their status
    const updatedCollaborators = (reservationData.collaborators || []).map(collab => {
      if (collab.userId === userId) {
        return { ...collab, status: response };
      }
      return collab;
    });
    
    // Update the reservation with the new collaborator statuses
    await updateDoc(reservationRef, {
      collaborators: updatedCollaborators,
      updatedAt: Timestamp.now()
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error responding to collaboration:", error);
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

// Fixed searchAvailableRooms function for roomService.js
export const searchAvailableRooms = async (startTime, endTime, filters = {}) => {
  try {
    console.log(`Searching for available rooms from ${new Date(startTime).toLocaleString()} to ${new Date(endTime).toLocaleString()}`);
    console.log("With filters:", JSON.stringify(filters, null, 2));
    
    // Convert times to timestamps
    const start = Timestamp.fromDate(new Date(startTime));
    const end = Timestamp.fromDate(new Date(endTime));
    
    // First get all rooms matching the filters
    const allRooms = await getRooms(filters);
    console.log(`Found ${allRooms.length} rooms matching filters, checking availability...`);
    
    if (allRooms.length === 0) return [];
    
    // Get all reservations that might conflict with our time range
    const reservationsQuery = query(
      reservationsCollection,
      where("status", "!=", "cancelled"),
      where("startTime", "<=", end),
      where("endTime", ">=", start)
    );
    
    const reservationsSnapshot = await getDocs(reservationsQuery);
    const reservations = reservationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`Found ${reservations.length} reservations in the requested time period`);
    
    // Group reservations by roomId for quick lookup
    const reservationsByRoom = {};
    reservations.forEach(res => {
      if (!reservationsByRoom[res.roomId]) {
        reservationsByRoom[res.roomId] = [];
      }
      reservationsByRoom[res.roomId].push(res);
    });
    
    // Filter out rooms that have conflicting reservations
    const availableRooms = allRooms.filter(room => {
      // Get reservations for this room
      const roomReservations = reservationsByRoom[room.id] || [];
      
      // Check if any reservation conflicts with the requested time range
      const hasConflict = roomReservations.some(reservation => {
        const resStart = reservation.startTime;
        const resEnd = reservation.endTime;
        
        // Check for overlap
        return (
          (start.seconds <= resEnd.seconds && end.seconds >= resStart.seconds)
        );
      });
      
      // Return rooms that don't have conflicts
      return !hasConflict;
    });
    
    console.log(`After availability filtering: ${availableRooms.length} available rooms`);
    return availableRooms;
  } catch (error) {
    console.error("Error searching available rooms:", error);
    throw error;
  }
}

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
// Enhanced version of getRoomUtilizationStats function for src/services/roomService.js
export const getRoomUtilizationStats = async (roomId, startDate, endDate) => {
  try {
    console.log(`Getting utilization stats for room ${roomId} from ${startDate} to ${endDate}`);
    
    // Ensure we have proper Date objects
    const start = startDate instanceof Date ? startDate : new Date(startDate);
    const end = endDate instanceof Date ? endDate : new Date(endDate);
    
    // Convert to Firestore timestamps
    const startTimestamp = Timestamp.fromDate(start);
    const endTimestamp = Timestamp.fromDate(end);
    
    // Get room details first
    const roomData = await getRoom(roomId);
    if (!roomData) {
      console.error(`Room with ID ${roomId} not found`);
      throw new Error(`Room with ID ${roomId} not found`);
    }
    
    console.log(`Found room: ${roomData.name}`);
    
    // First, try to get reservations that start within our date range
    let q = query(
      reservationsCollection,
      where("roomId", "==", roomId),
      where("startTime", ">=", startTimestamp),
      where("startTime", "<=", endTimestamp)
    );
    
    let snapshot = await getDocs(q);
    let reservations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`Found ${reservations.length} reservations starting in date range`);
    
    // Now get any reservations that end within our range but might start before it
    q = query(
      reservationsCollection,
      where("roomId", "==", roomId),
      where("endTime", ">=", startTimestamp),
      where("endTime", "<=", endTimestamp),
      where("startTime", "<", startTimestamp)
    );
    
    const endingInRangeSnapshot = await getDocs(q);
    const endingInRange = endingInRangeSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`Found ${endingInRange.length} additional reservations ending in date range`);
    
    // Combine and remove duplicates
    const allReservations = [...reservations];
    endingInRange.forEach(res => {
      if (!allReservations.some(r => r.id === res.id)) {
        allReservations.push(res);
      }
    });
    
    // Filter out cancelled reservations
    const activeReservations = allReservations.filter(r => r.status !== 'cancelled');
    console.log(`Found ${activeReservations.length} active reservations for this room in the date range`);
    
    // Calculate total hours booked
    let totalHoursBooked = 0;
    activeReservations.forEach(reservation => {
      try {
        const startTime = reservation.startTime.toDate();
        const endTime = reservation.endTime.toDate();
        
        // Calculate overlapping time with our date range
        const overlapStart = new Date(Math.max(startTime.getTime(), start.getTime()));
        const overlapEnd = new Date(Math.min(endTime.getTime(), end.getTime()));
        
        // Calculate hours in the overlap
        const overlapHours = (overlapEnd - overlapStart) / (1000 * 60 * 60);
        totalHoursBooked += overlapHours;
        
        console.log(`Reservation ${reservation.id} adds ${overlapHours.toFixed(2)} hours`);
      } catch (err) {
        console.error(`Error calculating hours for reservation ${reservation.id}:`, err);
      }
    });
    
    // Calculate utilization percentage (assuming 12 operating hours per day)
    const totalDays = Math.ceil((end - start) / (86400 * 1000)); // 86400 seconds in a day
    const totalAvailableHours = totalDays * 12;
    const utilizationPercentage = (totalHoursBooked / totalAvailableHours) * 100;
    
    console.log(`Total days: ${totalDays}, available hours: ${totalAvailableHours}, booked hours: ${totalHoursBooked}, utilization: ${utilizationPercentage.toFixed(2)}%`);
    
    // Calculate attendance stats if available
    let totalAttendees = 0;
    activeReservations.forEach(reservation => {
      totalAttendees += reservation.attendees || 1;
    });
    
    const capacityUtilization = activeReservations.length > 0 && roomData.capacity
      ? (totalAttendees / (activeReservations.length * roomData.capacity)) * 100
      : 0;
    
    return {
      totalReservations: activeReservations.length,
      totalHoursBooked: totalHoursBooked,
      utilizationPercentage: utilizationPercentage,
      averageReservationLength: activeReservations.length > 0 ? totalHoursBooked / activeReservations.length : 0,
      capacityUtilization: capacityUtilization,
      roomDetails: roomData,
      reservations: activeReservations
    };
  } catch (error) {
    console.error("Error getting room utilization stats:", error);
    throw error;
  }
};

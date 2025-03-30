// src/services/mapService.js
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getRooms } from './roomService';

// Map building names to their canonical forms
export const normalizeBuilding = (buildingName) => {
  if (!buildingName) return '';
  
  const name = buildingName.toLowerCase();
  
  if (name.includes('lowenthal') || name.includes('low')) {
    return 'Max Lowenthal Hall';
  }
  
  if (name.includes('wallace') || name.includes('library') || name.includes('wal')) {
    return 'Wallace Library';
  }
  
  return buildingName;
};

// Extract floor from room name or number
export const extractFloor = (roomName) => {
  if (!roomName) return '';
  
  // Check patterns like "LOW-1234" where the first digit is the floor
  const matches = roomName.match(/^(LOW|WAL)-([A1234])\d+/i);
  
  if (matches && matches.length >= 3) {
    const floorCode = matches[2].toUpperCase();
    
    // Map floor codes to floor names
    const floorMap = {
      '1': '1st Floor',
      '2': '2nd Floor',
      '3': '3rd Floor',
      '4': '4th Floor',
      'A': 'A-Level'
    };
    
    return floorMap[floorCode] || '';
  }
  
  return '';
};

// Get rooms grouped by building and floor
export const getRoomsByBuildingAndFloor = async () => {
  try {
    const roomsData = await getRooms();
    const buildingFloorMap = {};
    
    roomsData.forEach(room => {
      // Determine building
      let building = 'Unknown';
      if (room.building) {
        building = normalizeBuilding(room.building);
      } else if (room.location) {
        // Try to extract building from location
        const locationParts = room.location.split(',');
        if (locationParts.length > 0) {
          building = normalizeBuilding(locationParts[0].trim());
        }
      } else if (room.name && room.name.startsWith('LOW-')) {
        building = 'Max Lowenthal Hall';
      } else if (room.name && room.name.startsWith('WAL-')) {
        building = 'Wallace Library';
      }
      
      // Determine floor
      let floor = 'Unknown';
      if (room.floor) {
        // If floor is explicitly provided
        floor = room.floor;
      } else if (room.name) {
        // Extract floor from room name
        floor = extractFloor(room.name);
      } else if (room.location) {
        // Try to extract floor from location
        const locationParts = room.location.split(',');
        if (locationParts.length > 1) {
          const floorPart = locationParts[1].trim().toLowerCase();
          if (floorPart.includes('floor') || floorPart.includes('level')) {
            floor = locationParts[1].trim();
          }
        }
      }
      
      // Convert floor formats
      if (floor === '1' || floor === 'first floor' || floor === 'floor 1') {
        floor = '1st Floor';
      } else if (floor === '2' || floor === 'second floor' || floor === 'floor 2') {
        floor = '2nd Floor';
      } else if (floor === '3' || floor === 'third floor' || floor === 'floor 3') {
        floor = '3rd Floor';
      } else if (floor === '4' || floor === 'fourth floor' || floor === 'floor 4') {
        floor = '4th Floor';
      } else if (floor.toLowerCase() === 'a' || floor.toLowerCase() === 'a level' || floor.toLowerCase() === 'basement') {
        floor = 'A-Level';
      }
      
      // Initialize building in map if needed
      if (!buildingFloorMap[building]) {
        buildingFloorMap[building] = {};
      }
      
      // Initialize floor in building if needed
      if (!buildingFloorMap[building][floor]) {
        buildingFloorMap[building][floor] = [];
      }
      
      // Add room to the appropriate group
      buildingFloorMap[building][floor].push(room);
    });
    
    return buildingFloorMap;
  } catch (error) {
    console.error("Error grouping rooms by building and floor:", error);
    throw error;
  }
};

// Get room reservations for a specific time
export const getRoomReservationsForTime = async (roomId, date, hour) => {
  try {
    // Create a date object for the specified hour
    const startTime = new Date(date);
    startTime.setHours(hour, 0, 0, 0);
    
    const endTime = new Date(startTime);
    endTime.setHours(hour + 1, 0, 0, 0);
    
    // Convert to Firestore timestamps
    const startTimestamp = Timestamp.fromDate(startTime);
    const endTimestamp = Timestamp.fromDate(endTime);
    
    // Query for reservations that overlap with this time period
    const q = query(
      collection(db, 'reservations'),
      where('roomId', '==', roomId),
      where('status', '!=', 'cancelled'),
      where('startTime', '<=', endTimestamp),
      where('endTime', '>', startTimestamp)
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting room reservations for time:", error);
    throw error;
  }
};

// Get all reservations for a building and floor on a specific date
export const getReservationsForBuildingAndFloor = async (building, floor, date) => {
  try {
    // Get rooms for the building and floor
    const roomsByBuilding = await getRoomsByBuildingAndFloor();
    const rooms = roomsByBuilding[building]?.[floor] || [];
    
    // If no rooms found, return empty result
    if (!rooms.length) {
      return {};
    }
    
    // Create a map of room IDs
    const roomIds = rooms.map(room => room.id);
    
    // Get start and end of the selected date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Convert to Firestore timestamps
    const startTimestamp = Timestamp.fromDate(startOfDay);
    const endTimestamp = Timestamp.fromDate(endOfDay);
    
    // Query for all reservations for these rooms on this date
    const q = query(
      collection(db, 'reservations'),
      where('roomId', 'in', roomIds),
      where('status', '!=', 'cancelled'),
      where('startTime', '<=', endTimestamp),
      where('endTime', '>=', startTimestamp)
    );
    
    const snapshot = await getDocs(q);
    
    // Group reservations by room ID
    const reservationsByRoom = {};
    
    snapshot.docs.forEach(doc => {
      const reservation = {
        id: doc.id,
        ...doc.data()
      };
      
      if (!reservationsByRoom[reservation.roomId]) {
        reservationsByRoom[reservation.roomId] = [];
      }
      
      reservationsByRoom[reservation.roomId].push(reservation);
    });
    
    return reservationsByRoom;
  } catch (error) {
    console.error("Error getting reservations for building and floor:", error);
    throw error;
  }
};

// Check if a room is available at a specific time
export const isRoomAvailableAtTime = async (roomId, date, hour) => {
  try {
    const reservations = await getRoomReservationsForTime(roomId, date, hour);
    return reservations.length === 0;
  } catch (error) {
    console.error("Error checking room availability:", error);
    throw error;
  }
};

// Generate room availability map for all hours in a day
export const generateRoomAvailabilityMap = async (roomId, date) => {
  try {
    // Get start and end of the selected date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Convert to Firestore timestamps
    const startTimestamp = Timestamp.fromDate(startOfDay);
    const endTimestamp = Timestamp.fromDate(endOfDay);
    
    // Query for all reservations for this room on this date
    const q = query(
      collection(db, 'reservations'),
      where('roomId', '==', roomId),
      where('status', '!=', 'cancelled'),
      where('startTime', '<=', endTimestamp),
      where('endTime', '>=', startTimestamp)
    );
    
    const snapshot = await getDocs(q);
    
    const reservations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Initialize availability map (hours 0-23)
    const availabilityMap = Array(24).fill(true);
    
    // Mark hours as unavailable based on reservations
    reservations.forEach(reservation => {
      const startTime = new Date(reservation.startTime.seconds * 1000);
      const endTime = new Date(reservation.endTime.seconds * 1000);
      
      // Only consider the portion of the reservation that falls on this date
      const reservationStartHour = startTime.getDate() === startOfDay.getDate() ? 
        startTime.getHours() : 0;
      
      const reservationEndHour = endTime.getDate() === endOfDay.getDate() ? 
        endTime.getHours() : 23;
      
      // Mark all hours in the reservation as unavailable
      for (let hour = reservationStartHour; hour <= reservationEndHour; hour++) {
        availabilityMap[hour] = false;
      }
    });
    
    return availabilityMap;
  } catch (error) {
    console.error("Error generating room availability map:", error);
    throw error;
  }
};

// Export map configuration
export const MAP_CONFIG = {
  // Available buildings
  buildings: [
    'Max Lowenthal Hall',
    'Wallace Library'
  ],
  
  // Available floors for each building
  floors: {
    'Max Lowenthal Hall': [
      '1st Floor',
      '2nd Floor',
      '3rd Floor',
      '4th Floor',
      'A-Level'
    ],
    'Wallace Library': [
      '1st Floor',
      '2nd Floor',
      '3rd Floor',
      '4th Floor',
      'A-Level'
    ]
  },
  
  // Floor plan paths
  floorPlans: {
    "Max Lowenthal Hall": {
      "1st Floor": "/images/floor-plans/LOW-1.svg",
      "2nd Floor": "/images/floor-plans/LOW-2.svg",
      "3rd Floor": "/images/floor-plans/LOW-3.svg",
      "4th Floor": "/images/floor-plans/LOW-4.svg",
      "A-Level": "/images/floor-plans/LOW-A.svg"
    },
    "Wallace Library": {
      "1st Floor": "/images/floor-plans/WAL-1.svg",
      "2nd Floor": "/images/floor-plans/WAL-2.svg",
      "3rd Floor": "/images/floor-plans/WAL-3.svg",
      "4th Floor": "/images/floor-plans/WAL-4.svg",
      "A-Level": "/images/floor-plans/WAL-A.svg"
    }
  }
};
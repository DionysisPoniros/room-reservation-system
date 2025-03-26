// src/services/mapService.js
import { collection, getDocs, query, where } from 'firebase/firestore';
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

// Generate map coordinates for a room
export const generateRoomCoordinates = (roomName, building, floor) => {
  // In a real implementation, this would use actual coordinates
  // For now, we'll return some default values
  return {
    x: 100,
    y: 100,
    width: 50,
    height: 30
  };
};

// Check if a room is in a specific building and floor
export const isRoomInBuildingAndFloor = (room, building, floor) => {
  // Check building
  let roomBuilding = '';
  if (room.building) {
    roomBuilding = normalizeBuilding(room.building);
  } else if (room.location) {
    const locationParts = room.location.split(',');
    if (locationParts.length > 0) {
      roomBuilding = normalizeBuilding(locationParts[0].trim());
    }
  }
  
  // Check floor
  let roomFloor = '';
  if (room.floor) {
    roomFloor = room.floor;
  } else if (room.name) {
    roomFloor = extractFloor(room.name);
  }
  
  return roomBuilding === building && roomFloor === floor;
};

// Normalize coordinates if needed
export const normalizeCoordinates = (x, y, width, height, containerWidth, containerHeight) => {
  const normalizedX = Math.max(0, Math.min(x, containerWidth - width));
  const normalizedY = Math.max(0, Math.min(y, containerHeight - height));
  
  return {
    x: normalizedX,
    y: normalizedY,
    width,
    height
  };
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
      "1st Floor": "/images/floor-plans/12-MAX-LOWENTHAL-HALL-1ST-FLOOR.pdf",
      "2nd Floor": "/images/floor-plans/12-MAX-LOWENTHAL-HALL-2ND-FLOOR.pdf",
      "3rd Floor": "/images/floor-plans/12-MAX-LOWENTHAL-HALL-3RD-FLOOR.pdf",
      "4th Floor": "/images/floor-plans/12-MAX-LOWENTHAL-HALL-4TH-FLOOR.pdf",
      "A-Level": "/images/floor-plans/12-MAX-LOWENTHAL-HALL-A-LEVEL.pdf"
    },
    "Wallace Library": {
      "1st Floor": "/images/floor-plans/05-WALLACE-LIBRARY-1ST-FLOOR.pdf",
      "2nd Floor": "/images/floor-plans/05-WALLACE-LIBRARY-2ND-FLOOR.pdf",
      "3rd Floor": "/images/floor-plans/05-WALLACE-LIBRARY-3RD-FLOOR.pdf",
      "4th Floor": "/images/floor-plans/05-WALLACE-LIBRARY-4TH-FLOOR.pdf",
      "A-Level": "/images/floor-plans/05-WALLACE-LIBRARY-A-LEVEL.pdf"
    }
  }
};
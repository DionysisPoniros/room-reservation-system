// src/utils/floorPlanUtils.js
import { roomOverlays } from '../data/roomOverlays';

/**
 * Find room at specific coordinates on a floor plan
 * 
 * @param {string} building - Building name
 * @param {string} floor - Floor name
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {Object|null} - Room data or null if not found
 */
export const findRoomAtCoordinates = (building, floor, x, y) => {
  if (!roomOverlays[building] || !roomOverlays[building][floor]) return null;
  
  const rooms = roomOverlays[building][floor];
  
  for (const roomId in rooms) {
    const room = rooms[roomId];
    if (x >= room.x && x <= room.x + room.width && 
        y >= room.y && y <= room.y + room.height) {
      return {
        id: roomId,
        ...room
      };
    }
  }
  
  return null;
};

/**
 * Extract building and floor information from room data
 * 
 * @param {Object} room - Room data object
 * @returns {Object} - Object with building and floor information
 */
export const extractRoomLocation = (room) => {
  let building = null;
  let floor = null;
  
  // Try to extract from building property
  if (room.building) {
    building = normalizeBuilding(room.building);
  } 
  // Try to extract from location property
  else if (room.location) {
    const locationParts = room.location.split(',');
    if (locationParts.length > 0) {
      building = normalizeBuilding(locationParts[0].trim());
      
      if (locationParts.length > 1) {
        floor = normalizeFloor(locationParts[1].trim());
      }
    }
  }
  
  // Try to extract from name
  if (!building && room.name) {
    if (room.name.startsWith('LOW-')) {
      building = 'Max Lowenthal Hall';
      
      // Try to extract floor from room number
      const floorCode = room.name.charAt(4);
      floor = extractFloorFromCode(floorCode);
    } else if (room.name.startsWith('WAL-')) {
      building = 'Wallace Library';
      
      // Try to extract floor from room number
      const floorCode = room.name.charAt(4);
      floor = extractFloorFromCode(floorCode);
    }
  }
  
  // Try to extract from floor property
  if (!floor && room.floor) {
    floor = normalizeFloor(room.floor);
  }
  
  return { building, floor };
};

/**
 * Normalize building names to standard format
 * 
 * @param {string} buildingName - Building name to normalize
 * @returns {string} - Normalized building name
 */
export const normalizeBuilding = (buildingName) => {
  if (!buildingName) return null;
  
  const name = buildingName.toLowerCase();
  
  if (name.includes('lowenthal') || name.includes('low-') || name.match(/^low$/)) {
    return 'Max Lowenthal Hall';
  }
  
  if (name.includes('wallace') || name.includes('library') || name.match(/^wal-/) || name.match(/^wal$/)) {
    return 'Wallace Library';
  }
  
  return buildingName;
};

/**
 * Normalize floor names to standard format
 * 
 * @param {string} floorName - Floor name to normalize
 * @returns {string} - Normalized floor name
 */
export const normalizeFloor = (floorName) => {
  if (!floorName) return null;
  
  const name = floorName.toLowerCase().trim();
  
  if (name === '1' || name === 'first floor' || name === 'floor 1' || name === '1st floor' || name === '1st') {
    return '1st Floor';
  }
  
  if (name === '2' || name === 'second floor' || name === 'floor 2' || name === '2nd floor' || name === '2nd') {
    return '2nd Floor';
  }
  
  if (name === '3' || name === 'third floor' || name === 'floor 3' || name === '3rd floor' || name === '3rd') {
    return '3rd Floor';
  }
  
  if (name === '4' || name === 'fourth floor' || name === 'floor 4' || name === '4th floor' || name === '4th') {
    return '4th Floor';
  }
  
  if (name === 'a' || name === 'a level' || name === 'basement' || name === 'a-level') {
    return 'A-Level';
  }
  
  return floorName;
};

/**
 * Extract floor name from floor code
 * 
 * @param {string} floorCode - Single character floor code (1, 2, 3, 4, A)
 * @returns {string} - Floor name
 */
export const extractFloorFromCode = (floorCode) => {
  if (!floorCode) return null;
  
  switch (floorCode.toUpperCase()) {
    case '1': return '1st Floor';
    case '2': return '2nd Floor';
    case '3': return '3rd Floor';
    case '4': return '4th Floor';
    case 'A': return 'A-Level';
    default: return null;
  }
};

/**
 * Generate room coordinates for a specific floor
 * 
 * @param {Array} rooms - Array of room objects
 * @param {string} building - Building name
 * @param {string} floor - Floor name
 * @returns {Array} - Array of room objects with coordinates
 */
export const generateRoomCoordinates = (rooms, building, floor) => {
  if (!rooms || !rooms.length || !building || !floor) return [];
  
  const buildingKey = normalizeBuilding(building);
  const floorKey = normalizeFloor(floor);
  
  if (!roomOverlays[buildingKey] || !roomOverlays[buildingKey][floorKey]) {
    return [];
  }
  
  const floorOverlays = roomOverlays[buildingKey][floorKey];
  const result = [];
  
  rooms.forEach(room => {
    const roomName = room.name;
    
    // Check if we have predefined coordinates for this room
    if (floorOverlays[roomName]) {
      result.push({
        ...room,
        ...floorOverlays[roomName],
        hasCoordinates: true
      });
    } else {
      // Try to match room by similar names
      const similarRoom = findSimilarRoom(roomName, floorOverlays);
      
      if (similarRoom) {
        result.push({
          ...room,
          ...floorOverlays[similarRoom],
          approximateMatch: true,
          hasCoordinates: true
        });
      } else {
        // No coordinates found
        result.push({
          ...room,
          hasCoordinates: false
        });
      }
    }
  });
  
  return result;
};

/**
 * Find similar room in overlay data
 * 
 * @param {string} roomName - Room name to find
 * @param {Object} overlays - Room overlays for a specific floor
 * @returns {string|null} - Similar room name or null if not found
 */
const findSimilarRoom = (roomName, overlays) => {
  if (!roomName || !overlays) return null;
  
  // First try direct match
  if (overlays[roomName]) return roomName;
  
  // Try to match by partial prefix
  const prefix = roomName.split('-')[0];
  const number = roomName.match(/\d+/);
  
  if (prefix && number) {
    const candidates = Object.keys(overlays).filter(name => 
      name.startsWith(prefix) && name.includes(number[0])
    );
    
    if (candidates.length > 0) {
      return candidates[0];
    }
  }
  
  return null;
};

/**
 * Get floor plan URL
 * 
 * @param {string} building - Building name
 * @param {string} floor - Floor name
 * @returns {string|null} - URL to floor plan or null if not found
 */
export const getFloorPlanUrl = (building, floor) => {
  const buildingKey = normalizeBuilding(building);
  const floorKey = normalizeFloor(floor);
  
  // Standard floor plan paths
  const floorPlans = {
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
  };
  
  if (floorPlans[buildingKey] && floorPlans[buildingKey][floorKey]) {
    return floorPlans[buildingKey][floorKey];
  }
  
  return null;
};

/**
 * Get list of available buildings
 * 
 * @returns {Array} - Array of building names
 */
export const getAvailableBuildings = () => {
  return Object.keys(roomOverlays || {});
};

/**
 * Get list of available floors for a building
 * 
 * @param {string} building - Building name
 * @returns {Array} - Array of floor names
 */
export const getAvailableFloors = (building) => {
  const buildingKey = normalizeBuilding(building);
  if (roomOverlays[buildingKey]) {
    return Object.keys(roomOverlays[buildingKey]);
  }
  return [];
};

/**
 * Room Overlays Data Structure:
 * This should be moved to a separate data file in a production environment
 */
export const getRoomOverlays = () => {
  return roomOverlays;
};
// src/utils/mapUtils.js
import { MAP_CONFIG } from '../services/mapService';

/**
 * Finds room position data for a specific building and floor
 * 
 * @param {string} building - Building name
 * @param {string} floor - Floor name
 * @param {string} roomId - Room ID or name
 * @returns {Object|null} - Room position data or null if not found
 */
export const findRoomPosition = (building, floor, roomId) => {
  if (!MAP_CONFIG.roomOverlays || 
      !MAP_CONFIG.roomOverlays[building] || 
      !MAP_CONFIG.roomOverlays[building][floor]) {
    return null;
  }
  
  return MAP_CONFIG.roomOverlays[building][floor][roomId] || null;
};

/**
 * Extracts building and floor from room information
 * 
 * @param {Object} room - Room data object
 * @returns {Object} - Object with building and floor
 */
export const extractRoomLocation = (room) => {
  let building = 'Unknown';
  let floor = 'Unknown';
  
  // Try to extract from building property
  if (room.building) {
    building = room.building;
  } 
  // Try to extract from location property
  else if (room.location) {
    const locationParts = room.location.split(',');
    if (locationParts.length > 0) {
      building = locationParts[0].trim();
      
      if (locationParts.length > 1) {
        floor = locationParts[1].trim();
      }
    }
  }
  // Try to extract from name (e.g., "LOW-1234" for Lowenthal Hall, 1st floor)
  else if (room.name) {
    if (room.name.startsWith('LOW-')) {
      building = 'Max Lowenthal Hall';
      
      // Try to extract floor from room number
      const floorCode = room.name.charAt(4);
      switch (floorCode) {
        case '1': floor = '1st Floor'; break;
        case '2': floor = '2nd Floor'; break;
        case '3': floor = '3rd Floor'; break;
        case '4': floor = '4th Floor'; break;
        case 'A': floor = 'A-Level'; break;
      }
    } else if (room.name.startsWith('WAL-')) {
      building = 'Wallace Library';
      
      // Try to extract floor from room number
      const floorCode = room.name.charAt(4);
      switch (floorCode) {
        case '1': floor = '1st Floor'; break;
        case '2': floor = '2nd Floor'; break;
        case '3': floor = '3rd Floor'; break;
        case '4': floor = '4th Floor'; break;
        case 'A': floor = 'A-Level'; break;
      }
    }
  }
  
  return { building, floor };
};

/**
 * Gets room coordinates for visualizing on a map
 * 
 * @param {Array} rooms - Array of room objects
 * @returns {Object} - Grouped object of room coordinates by building and floor
 */
export const getRoomCoordinates = (rooms) => {
  const result = {};
  
  rooms.forEach(room => {
    const { building, floor } = extractRoomLocation(room);
    
    // Initialize building and floor in result if needed
    if (!result[building]) {
      result[building] = {};
    }
    
    if (!result[building][floor]) {
      result[building][floor] = [];
    }
    
    // Try to find room position in map config
    const position = findRoomPosition(building, floor, room.name);
    
    if (position) {
      // Add room with position to result
      result[building][floor].push({
        ...position,
        id: room.id,
        name: room.name,
        roomData: room
      });
    } else {
      // If position not found, generate a placeholder position
      // This would be improved in a real implementation with proper positioning
      result[building][floor].push({
        x: 100, // Placeholder X
        y: 100, // Placeholder Y
        width: 50,
        height: 30,
        id: room.id,
        name: room.name,
        roomData: room,
        isPlaceholder: true
      });
    }
  });
  
  return result;
};
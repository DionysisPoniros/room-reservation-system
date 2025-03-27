// src/utils/populateRoomOverlays.js

/**
 * Utility functions for populating and maintaining room overlay data
 * This helps map rooms to their visual representations on SVG floor plans
 */

// Import the existing room overlay data
import { roomOverlays } from '../data/roomOverlays';

/**
 * Creates an empty room overlay template for a new building or floor
 * 
 * @param {string} building - Building name
 * @param {string} floor - Floor name
 * @returns {Object} - Empty room overlay template
 */
export const createEmptyOverlayTemplate = (building, floor) => {
  // Create a deep copy of the existing overlays
  const newOverlays = JSON.parse(JSON.stringify(roomOverlays));
  
  // Check if building exists
  if (!newOverlays[building]) {
    newOverlays[building] = {};
  }
  
  // Check if floor exists
  if (!newOverlays[building][floor]) {
    newOverlays[building][floor] = {};
  }
  
  return newOverlays;
};

/**
 * Adds a new room to the overlay data
 * 
 * @param {string} building - Building name
 * @param {string} floor - Floor name
 * @param {string} roomId - Room ID
 * @param {Object} roomData - Room overlay data (x, y, width, height, label)
 * @returns {Object} - Updated room overlays
 */
export const addRoomToOverlays = (building, floor, roomId, roomData) => {
  // Create a deep copy of the existing overlays
  const newOverlays = JSON.parse(JSON.stringify(roomOverlays));
  
  // Check if building exists
  if (!newOverlays[building]) {
    newOverlays[building] = {};
  }
  
  // Check if floor exists
  if (!newOverlays[building][floor]) {
    newOverlays[building][floor] = {};
  }
  
  // Add the room data
  newOverlays[building][floor][roomId] = {
    x: roomData.x,
    y: roomData.y,
    width: roomData.width,
    height: roomData.height,
    label: roomData.label || roomId
  };
  
  return newOverlays;
};

/**
 * Batch adds multiple rooms to the overlay data
 * 
 * @param {string} building - Building name
 * @param {string} floor - Floor name
 * @param {Array} rooms - Array of room objects with id, x, y, width, height, label
 * @returns {Object} - Updated room overlays
 */
export const batchAddRooms = (building, floor, rooms) => {
  // Create a deep copy of the existing overlays
  const newOverlays = JSON.parse(JSON.stringify(roomOverlays));
  
  // Check if building exists
  if (!newOverlays[building]) {
    newOverlays[building] = {};
  }
  
  // Check if floor exists
  if (!newOverlays[building][floor]) {
    newOverlays[building][floor] = {};
  }
  
  // Add all rooms
  rooms.forEach(room => {
    const roomId = room.id;
    newOverlays[building][floor][roomId] = {
      x: room.x,
      y: room.y,
      width: room.width, 
      height: room.height,
      label: room.label || roomId
    };
  });
  
  return newOverlays;
};

/**
 * Removes a room from the overlay data
 * 
 * @param {string} building - Building name
 * @param {string} floor - Floor name
 * @param {string} roomId - Room ID to remove
 * @returns {Object} - Updated room overlays
 */
export const removeRoomFromOverlays = (building, floor, roomId) => {
  // Create a deep copy of the existing overlays
  const newOverlays = JSON.parse(JSON.stringify(roomOverlays));
  
  // Check if building, floor, and room exist
  if (newOverlays[building] && 
      newOverlays[building][floor] && 
      newOverlays[building][floor][roomId]) {
    // Remove the room
    delete newOverlays[building][floor][roomId];
  }
  
  return newOverlays;
};

/**
 * Extracts room information from room names
 * Helps automatically generate basic room data
 * 
 * @param {Array} rooms - Array of room objects from the database
 * @returns {Object} - Rooms grouped by building and floor
 */
export const extractRoomInfo = (rooms) => {
  const result = {};
  
  rooms.forEach(room => {
    let building = 'Unknown';
    let floor = 'Unknown';
    
    // Extract building from room data
    if (room.building) {
      building = room.building;
    } else if (room.location) {
      // Try to extract from location (e.g., "Max Lowenthal Hall, Floor 1")
      const locationParts = room.location.split(',');
      if (locationParts.length > 0) {
        building = locationParts[0].trim();
      }
    } else if (room.name) {
      // Try to extract from name prefix (e.g., "LOW-1234")
      if (room.name.startsWith('LOW-')) {
        building = 'Max Lowenthal Hall';
      } else if (room.name.startsWith('WAL-')) {
        building = 'Wallace Library';
      }
    }
    
    // Extract floor from room data
    if (room.floor) {
      floor = normalizeFloor(room.floor);
    } else if (room.location) {
      // Try to extract from location
      const locationParts = room.location.split(',');
      if (locationParts.length > 1) {
        floor = normalizeFloor(locationParts[1].trim());
      }
    } else if (room.name) {
      // Try to extract floor from room number (e.g., "LOW-1234" => 1st floor)
      if (room.name.match(/^(LOW|WAL)-[1-4A]\d+/i)) {
        const floorChar = room.name.charAt(4).toUpperCase();
        floor = floorFromCode(floorChar);
      }
    }
    
    // Initialize building and floor in result
    if (!result[building]) {
      result[building] = {};
    }
    
    if (!result[building][floor]) {
      result[building][floor] = [];
    }
    
    // Add room to result
    result[building][floor].push(room);
  });
  
  return result;
};

/**
 * Normalize floor names
 * 
 * @param {string} floor - Floor name to normalize
 * @returns {string} - Normalized floor name
 */
const normalizeFloor = (floor) => {
  if (!floor) return 'Unknown';
  
  // Convert to lowercase for comparison
  const floorLower = floor.toLowerCase().trim();
  
  if (floorLower === '1' || floorLower === 'first' || floorLower === 'first floor' || 
      floorLower === '1st' || floorLower === '1st floor' || floorLower === 'floor 1') {
    return '1st Floor';
  }
  
  if (floorLower === '2' || floorLower === 'second' || floorLower === 'second floor' || 
      floorLower === '2nd' || floorLower === '2nd floor' || floorLower === 'floor 2') {
    return '2nd Floor';
  }
  
  if (floorLower === '3' || floorLower === 'third' || floorLower === 'third floor' || 
      floorLower === '3rd' || floorLower === '3rd floor' || floorLower === 'floor 3') {
    return '3rd Floor';
  }
  
  if (floorLower === '4' || floorLower === 'fourth' || floorLower === 'fourth floor' || 
      floorLower === '4th' || floorLower === '4th floor' || floorLower === 'floor 4') {
    return '4th Floor';
  }
  
  if (floorLower === 'a' || floorLower === 'a level' || floorLower === 'basement' || 
      floorLower === 'a-level') {
    return 'A-Level';
  }
  
  return floor;
};

/**
 * Convert floor code to floor name
 * 
 * @param {string} code - Single character floor code (1, 2, 3, 4, A)
 * @returns {string} - Floor name
 */
const floorFromCode = (code) => {
  switch (code) {
    case '1': return '1st Floor';
    case '2': return '2nd Floor';
    case '3': return '3rd Floor';
    case '4': return '4th Floor';
    case 'A': return 'A-Level';
    default: return 'Unknown';
  }
};

/**
 * Generates a code string from room overlays
 * This can be used to update the roomOverlays.js file
 * 
 * @param {Object} overlays - Room overlay data
 * @returns {string} - JavaScript code string for roomOverlays.js
 */
export const generateOverlayCode = (overlays) => {
  let code = '// src/data/roomOverlays.js\n';
  code += 'export const roomOverlays = {\n';
  
  // Generate code for each building
  Object.keys(overlays).forEach(building => {
    code += `  "${building}": {\n`;
    
    // Generate code for each floor
    Object.keys(overlays[building]).forEach(floor => {
      code += `    "${floor}": {\n`;
      
      // Generate code for each room
      Object.keys(overlays[building][floor]).forEach(roomId => {
        const room = overlays[building][floor][roomId];
        code += `      "${roomId}": { x: ${room.x}, y: ${room.y}, width: ${room.width}, height: ${room.height}, label: "${room.label}" },\n`;
      });
      
      code += '    },\n';
    });
    
    code += '  },\n';
  });
  
  code += '};';
  
  return code;
};

/**
 * Auto-generate estimated room positions when we don't have exact coordinates
 * This can be used as a starting point before manual refinement
 * 
 * @param {Array} rooms - Array of room objects
 * @param {number} canvasWidth - Width of the SVG canvas
 * @param {number} canvasHeight - Height of the SVG canvas
 * @returns {Object} - Estimated room positions
 */
export const estimateRoomPositions = (rooms, canvasWidth = 800, canvasHeight = 600) => {
  if (!rooms || !rooms.length) return {};
  
  const result = {};
  
  // Sort rooms by name to group similar rooms together
  const sortedRooms = [...rooms].sort((a, b) => {
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
  });
  
  // Calculate approximate grid dimensions based on room count
  const roomCount = sortedRooms.length;
  const gridColumns = Math.ceil(Math.sqrt(roomCount));
  const gridRows = Math.ceil(roomCount / gridColumns);
  
  // Calculate cell dimensions
  const cellWidth = canvasWidth / gridColumns;
  const cellHeight = canvasHeight / gridRows;
  
  // Default room dimensions (adjust as needed)
  const defaultWidth = Math.min(cellWidth * 0.8, 80);
  const defaultHeight = Math.min(cellHeight * 0.8, 60);
  
  // Place rooms in a grid layout
  sortedRooms.forEach((room, index) => {
    // Calculate grid position
    const col = index % gridColumns;
    const row = Math.floor(index / gridColumns);
    
    // Calculate pixel position (centered in cell)
    const x = col * cellWidth + (cellWidth - defaultWidth) / 2;
    const y = row * cellHeight + (cellHeight - defaultHeight) / 2;
    
    // Create room overlay
    result[room.id || room.name] = {
      x: Math.round(x),
      y: Math.round(y),
      width: Math.round(defaultWidth),
      height: Math.round(defaultHeight),
      label: room.name,
      estimated: true // Flag to indicate this is an estimate
    };
  });
  
  return result;
};
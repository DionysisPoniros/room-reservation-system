import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  Button
} from '@mui/material';
import { getRooms, getRoomReservations } from '../../services/roomService';

// Mock building data - in a real app, you'd fetch this from your backend
const buildingData = {
  "Science Building": {
    floors: [1, 2, 3],
    rooms: {
      "101": { x: 10, y: 10, width: 80, height: 60 },
      "102": { x: 100, y: 10, width: 50, height: 60 },
      "103": { x: 160, y: 10, width: 90, height: 60 },
      "104": { x: 10, y: 80, width: 120, height: 70 },
      "105": { x: 140, y: 80, width: 110, height: 70 },
      "201": { x: 10, y: 10, width: 100, height: 80 },
      "202": { x: 120, y: 10, width: 120, height: 50 },
      "203": { x: 10, y: 100, width: 70, height: 60 },
      "204": { x: 90, y: 100, width: 150, height: 60 },
      "301": { x: 10, y: 10, width: 240, height: 80 },
      "302": { x: 10, y: 100, width: 110, height: 60 },
      "303": { x: 130, y: 100, width: 110, height: 60 }
    }
  },
  "Liberal Arts": {
    floors: [1, 2],
    rooms: {
      "101": { x: 20, y: 20, width: 100, height: 70 },
      "102": { x: 130, y: 20, width: 80, height: 70 },
      "103": { x: 20, y: 100, width: 190, height: 60 },
      "201": { x: 20, y: 20, width: 80, height: 80 },
      "202": { x: 110, y: 20, width: 80, height: 80 },
      "203": { x: 20, y: 110, width: 80, height: 70 },
      "204": { x: 110, y: 110, width: 80, height: 70 }
    }
  }
};

function RoomVisualizer() {
  const [building, setBuilding] = useState('Science Building');
  const [floor, setFloor] = useState(1);
  const [timeFrame, setTimeFrame] = useState('now');
  const [rooms, setRooms] = useState([]);
  const [reservations, setReservations] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        const roomsData = await getRooms();
        setRooms(roomsData);
        
        // Fetch reservations for all rooms
        const reservationsMap = {};
        for (const room of roomsData) {
          const roomReservations = await getRoomReservations(room.id);
          reservationsMap[room.id] = roomReservations;
        }
        setReservations(reservationsMap);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching room data:", error);
        setLoading(false);
      }
    };
    
    fetchRooms();
  }, []);
  
  // Check if a room is currently occupied
  const isRoomOccupied = (roomId) => {
    if (!reservations[roomId]) return false;
    
    const now = new Date();
    
    // If timeFrame is 'now', check if there's an active reservation
    if (timeFrame === 'now') {
      return reservations[roomId].some(reservation => {
        const startTime = new Date(reservation.startTime.seconds * 1000);
        const endTime = new Date(reservation.endTime.seconds * 1000);
        return now >= startTime && now <= endTime;
      });
    }
    
    // If timeFrame is 'today', check if there's any reservation today
    if (timeFrame === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      return reservations[roomId].some(reservation => {
        const startTime = new Date(reservation.startTime.seconds * 1000);
        return startTime >= today && startTime < tomorrow;
      });
    }
    
    return false;
  };
  
  // Get room color based on availability
  const getRoomColor = (roomId) => {
    if (!roomId) return '#d3d3d3'; // Default gray
    
    const room = rooms.find(r => r.id === roomId);
    if (!room) return '#d3d3d3';
    
    const occupied = isRoomOccupied(roomId);
    return occupied ? '#ff6b6b' : '#4caf50'; // Red if occupied, green if available
  };
  
  // Handle building selection change
  const handleBuildingChange = (event) => {
    setBuilding(event.target.value);
    setFloor(buildingData[event.target.value].floors[0]);
  };
  
  // Handle floor selection change
  const handleFloorChange = (event) => {
    setFloor(event.target.value);
  };
  
  // Handle time frame selection change
  const handleTimeFrameChange = (event, newTimeFrame) => {
    if (newTimeFrame !== null) {
      setTimeFrame(newTimeFrame);
    }
  };
  
  // Find the corresponding room ID from the database
  const getRoomIdFromNumber = (roomNumber) => {
    // This is a simplified approach - in a real app you'd need a more robust mapping
    // between building map coordinates and actual room IDs in the database
    const roomPrefix = building.substring(0, 3).toUpperCase();
    const roomKey = `${roomPrefix}${floor}${roomNumber.padStart(2, '0')}`;
    
    return rooms.find(room => room.name === roomKey)?.id;
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Room Availability Map
      </Typography>
      
      <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {/* Building Selection */}
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="building-select-label">Building</InputLabel>
          <Select
            labelId="building-select-label"
            value={building}
            label="Building"
            onChange={handleBuildingChange}
          >
            {Object.keys(buildingData).map((buildingName) => (
              <MenuItem key={buildingName} value={buildingName}>
                {buildingName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {/* Floor Selection */}
        <FormControl sx={{ minWidth: 100 }}>
          <InputLabel id="floor-select-label">Floor</InputLabel>
          <Select
            labelId="floor-select-label"
            value={floor}
            label="Floor"
            onChange={handleFloorChange}
          >
            {buildingData[building].floors.map((floorNum) => (
              <MenuItem key={floorNum} value={floorNum}>
                {floorNum}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {/* Time Frame Selection */}
        <ToggleButtonGroup
          value={timeFrame}
          exclusive
          onChange={handleTimeFrameChange}
          aria-label="time frame"
        >
          <ToggleButton value="now" aria-label="current availability">
            Current
          </ToggleButton>
          <ToggleButton value="today" aria-label="today's availability">
            Today
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      
      {/* Room Availability Legend */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ width: 16, height: 16, bgcolor: '#4caf50', mr: 1 }}></Box>
          <Typography variant="body2">Available</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ width: 16, height: 16, bgcolor: '#ff6b6b', mr: 1 }}></Box>
          <Typography variant="body2">Occupied</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ width: 16, height: 16, bgcolor: '#d3d3d3', mr: 1 }}></Box>
          <Typography variant="body2">Unknown</Typography>
        </Box>
      </Box>
      
      {/* 2D Map Visualization */}
      <Box 
        sx={{ 
          position: 'relative', 
          width: '100%', 
          height: 300, 
          border: '1px solid #ccc', 
          backgroundColor: '#f5f5f5',
          overflow: 'hidden'
        }}
      >
        {/* Building Floor Map */}
        {Object.entries(buildingData[building].rooms)
          .filter(([roomNumber]) => roomNumber.startsWith(floor.toString()))
          .map(([roomNumber, dimensions]) => {
            const roomId = getRoomIdFromNumber(roomNumber.substring(1));
            
            return (
              <Box
                key={roomNumber}
                sx={{
                  position: 'absolute',
                  left: dimensions.x,
                  top: dimensions.y,
                  width: dimensions.width,
                  height: dimensions.height,
                  bgcolor: getRoomColor(roomId),
                  border: '1px solid #000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    opacity: 0.8,
                    transform: 'scale(1.02)'
                  }
                }}
              >
                <Typography variant="body2" sx={{ color: '#fff', fontWeight: 'bold' }}>
                  {roomNumber}
                </Typography>
              </Box>
            );
          })}
      </Box>
      
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
        <Button variant="contained" color="primary">
          Switch to 3D View
        </Button>
      </Box>
    </Paper>
  );
}

export default RoomVisualizer;
// src/components/rooms/EnhancedRoomVisualizer.js
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Drawer,
  IconButton,
  Button,
  Divider,
  CircularProgress,
  Alert,
  useTheme,
  Grid,
  Chip
} from '@mui/material';
import { Link } from 'react-router-dom';

// Import your new InteractiveFloorMap component
import InteractiveFloorMap from './InteractiveFloorMap';

// Import other components and services
import { getRooms, getRoomReservations, getRoom } from '../../services/roomService';

// Icons
import CloseIcon from '@mui/icons-material/Close';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PeopleIcon from '@mui/icons-material/People';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

// Available buildings and floors
const BUILDINGS = ["Max Lowenthal Hall", "Wallace Library"];
const FLOORS = {
  "Max Lowenthal Hall": ["1st Floor", "2nd Floor", "3rd Floor", "4th Floor", "A-Level"],
  "Wallace Library": ["1st Floor", "2nd Floor", "3rd Floor", "4th Floor", "A-Level"]
};

function EnhancedRoomVisualizer() {
  const theme = useTheme();
  const [building, setBuilding] = useState("Max Lowenthal Hall");
  const [floor, setFloor] = useState("1st Floor");
  const [rooms, setRooms] = useState([]);
  const [reservations, setReservations] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Room detail drawer state
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [roomDetails, setRoomDetails] = useState(null);
  const [loadingRoom, setLoadingRoom] = useState(false);
  
  // Fetch rooms and reservations when building or floor changes
  useEffect(() => {
    const fetchRoomsAndReservations = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get all rooms with matching building
        const roomsData = await getRooms({ building: building });
        setRooms(roomsData);
        
        // For each room, get its reservations
        const reservationsMap = {};
        for (const room of roomsData) {
          try {
            const roomReservations = await getRoomReservations(room.id);
            reservationsMap[room.id] = roomReservations;
          } catch (err) {
            console.error(`Error fetching reservations for room ${room.id}:`, err);
          }
        }
        
        setReservations(reservationsMap);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching rooms and reservations:", err);
        setError("Failed to load room data. Please try again.");
        setLoading(false);
      }
    };
    
    fetchRoomsAndReservations();
  }, [building, floor]);
  
  // Handle building selection change
  const handleBuildingChange = (event) => {
    const newBuilding = event.target.value;
    setBuilding(newBuilding);
    // Set the floor to the first available floor for the new building
    setFloor(FLOORS[newBuilding][0]);
  };
  
  // Handle floor selection change
  const handleFloorChange = (event) => {
    setFloor(event.target.value);
  };
  
  // Handle room selection
  const handleRoomSelection = useCallback(async (roomId) => {
    try {
      // Find room in our loaded rooms
      const roomData = rooms.find(r => r.name === roomId);
      
      if (roomData) {
        setSelectedRoom(roomData);
        setDrawerOpen(true);
        
        // Show loading state
        setRoomDetails(null);
        setLoadingRoom(true);
        
        // Fetch detailed room information
        try {
          const details = await getRoom(roomData.id);
          setRoomDetails(details);
        } catch (detailsError) {
          console.error("Error fetching room details:", detailsError);
          // Still show the room but with a warning
          setRoomDetails({...roomData, fetchError: true});
        }
        
        setLoadingRoom(false);
      } else {
        console.log(`Room ${roomId} not found in database`);
        setError(`Room information for ${roomId} not found in database`);
      }
    } catch (error) {
      console.error("Error selecting room:", error);
      setError("Error selecting room. Please try again.");
    }
  }, [rooms]);
  
  // Format time for display
  const formatTime = useCallback((timestamp) => {
    if (!timestamp || !timestamp.seconds) return 'N/A';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);
  
  // Format date for display
  const formatDate = useCallback((timestamp) => {
    if (!timestamp || !timestamp.seconds) return 'N/A';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
  }, []);
  
  // Check if a room is currently occupied
  const isRoomOccupied = useCallback((roomId) => {
    if (!reservations[roomId]) return false;
    
    const now = new Date();
    
    return reservations[roomId].some(reservation => {
      if (reservation.status === 'cancelled') return false;
      
      const startTime = new Date(reservation.startTime.seconds * 1000);
      const endTime = new Date(reservation.endTime.seconds * 1000);
      return now >= startTime && now <= endTime;
    });
  }, [reservations]);
  
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        Interactive Building Map
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        {/* Building Selection */}
        <FormControl sx={{ minWidth: 200, flexGrow: 1 }}>
          <InputLabel id="building-select-label">Building</InputLabel>
          <Select
            labelId="building-select-label"
            value={building}
            label="Building"
            onChange={handleBuildingChange}
          >
            {BUILDINGS.map((buildingName) => (
              <MenuItem key={buildingName} value={buildingName}>
                {buildingName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {/* Floor Selection */}
        <FormControl sx={{ minWidth: 120, flexGrow: 1 }}>
          <InputLabel id="floor-select-label">Floor</InputLabel>
          <Select
            labelId="floor-select-label"
            value={floor}
            label="Floor"
            onChange={handleFloorChange}
          >
            {FLOORS[building].map((floorName) => (
              <MenuItem key={floorName} value={floorName}>
                {floorName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      
      {/* Instructions */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Use your mouse or touch screen to navigate the map:
          <Box component="ul" sx={{ pl: 2, mt: 1, mb: 0 }}>
            <li>Click and drag to pan</li>
            <li>Scroll or pinch to zoom</li>
            <li>Click on a room to view details</li>
          </Box>
        </Typography>
      </Alert>
      
      {/* Interactive Map Component */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <InteractiveFloorMap
          building={building}
          floor={floor}
          onBuildingChange={handleBuildingChange}
          onFloorChange={handleFloorChange}
          onRoomSelect={handleRoomSelection}
          rooms={rooms}
          reservations={reservations}
        />
      )}
      
      {/* Room Details Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '100%', sm: 400 },
            p: 0
          }
        }}
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Room Details</Typography>
            <IconButton onClick={() => setDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          {selectedRoom && (
            <>
              <Typography variant="h5" gutterBottom>
                {selectedRoom.name}
              </Typography>
              
              {/* Loading state for room details */}
              {loadingRoom ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : roomDetails ? (
                <>
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <LocationOnIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                      <Typography variant="body1">
                        {roomDetails?.location || selectedRoom.location || 'Location not specified'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PeopleIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                      <Typography variant="body1">
                        Capacity: {roomDetails?.capacity || selectedRoom.capacity || 'Not specified'} people
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <MeetingRoomIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                      <Typography variant="body1">
                        Type: {roomDetails?.type || selectedRoom.type || 'Not specified'}
                      </Typography>
                    </Box>
                    
                    {roomDetails.description && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          {roomDetails.description}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  
                  <Typography variant="h6" gutterBottom>
                    Equipment
                  </Typography>
                  
                  <Box sx={{ mb: 3 }}>
                    {roomDetails?.equipment?.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {roomDetails.equipment.map((item, index) => (
                          <Chip key={index} label={item} variant="outlined" size="small" />
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No equipment specified
                      </Typography>
                    )}
                  </Box>
                  
                  <Typography variant="h6" gutterBottom>
                    Current Status
                  </Typography>
                  
                  <Box sx={{ mb: 3 }}>
                    {isRoomOccupied(selectedRoom.id) ? (
                      <Chip 
                        icon={<CancelIcon />} 
                        label="Currently Occupied" 
                        color="error" 
                        variant="outlined"
                        sx={{ mb: 1 }}
                      />
                    ) : (
                      <Chip 
                        icon={<CheckCircleIcon />} 
                        label="Available" 
                        color="success" 
                        variant="outlined"
                        sx={{ mb: 1 }}
                      />
                    )}
                    
                    {reservations[selectedRoom.id] && reservations[selectedRoom.id].length > 0 ? (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Today's Schedule:
                        </Typography>
                        
                        {reservations[selectedRoom.id]
                          .filter(res => res.status !== 'cancelled')
                          .sort((a, b) => a.startTime.seconds - b.startTime.seconds)
                          .map((res, index) => (
                            <Box key={index} sx={{ mb: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #eee' }}>
                              <Typography variant="body2">
                                {formatDate(res.startTime)}
                              </Typography>
                              <Typography variant="body2" fontWeight="bold">
                                {formatTime(res.startTime)} - {formatTime(res.endTime)}
                              </Typography>
                            </Box>
                          ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        No reservations today
                      </Typography>
                    )}
                  </Box>
                </>
              ) : (
                <Alert severity="error">
                  Failed to load room details. Please try again.
                </Alert>
              )}
              
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button 
                  variant="outlined" 
                  component={Link}
                  to={`/rooms/${selectedRoom.id}`}
                  fullWidth
                >
                  View Details
                </Button>
                
                <Button 
                  variant="contained" 
                  color="primary"
                  component={Link}
                  to={`/rooms/${selectedRoom.id}/book`}
                  fullWidth
                  disabled={roomDetails && isRoomOccupied(selectedRoom.id)}
                >
                  {!roomDetails ? 'Loading...' : 
                   (isRoomOccupied(selectedRoom.id) ? 'Currently Unavailable' : 'Book Now')}
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Drawer>
    </Paper>
  );
}

export default EnhancedRoomVisualizer;
// src/components/rooms/EnhancedRoomVisualizer.js
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Chip,
  Card,
  CardContent,
  CardActions,
  Button,
  Slider,
  Paper,
  Drawer,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Link } from 'react-router-dom';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { format, addHours, setHours, setMinutes, setSeconds, setMilliseconds } from 'date-fns';

// Import our custom RoomOverlay component
import RoomOverlay from './RoomOverlay';

// Import room overlay data
import { roomOverlays } from '../../data/roomOverlays';

// Import services
import { getRoom, getRoomReservations } from '../../services/roomService';

// Icons
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import GroupIcon from '@mui/icons-material/Group';
import InfoIcon from '@mui/icons-material/Info';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CloseIcon from '@mui/icons-material/Close';
import PeopleIcon from '@mui/icons-material/People';
import ComputerIcon from '@mui/icons-material/Computer';
import VideocamIcon from '@mui/icons-material/Videocam';
import TvIcon from '@mui/icons-material/Tv';

// Map config with floor plan paths
const FLOOR_PLANS = {
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
};

// Business hours for room bookings (7AM - 11PM)
const BUSINESS_HOURS = Array.from({ length: 17 }, (_, i) => i + 7);

/**
 * Enhanced Interactive Floor Map Component
 * Shows room availability by time of day with interactive selection
 */
const EnhancedRoomVisualizer = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Building and floor state
  const [building, setBuilding] = useState("Max Lowenthal Hall");
  const [floor, setFloor] = useState("1st Floor");
  
  // Room and reservation data
  const [rooms, setRooms] = useState([]);
  const [reservations, setReservations] = useState({});
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedRoomData, setSelectedRoomData] = useState(null);
  const [selectedRoomReservations, setSelectedRoomReservations] = useState([]);
  
  // Time selection
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedHour, setSelectedHour] = useState(new Date().getHours());
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [svgContent, setSvgContent] = useState(null);
  const [svgLoaded, setSvgLoaded] = useState(false);

  // Format hour for display
  const formatHour = (hour) => {
    if (hour < 12) return `${hour}:00 AM`;
    if (hour === 12) return '12:00 PM';
    return `${hour - 12}:00 PM`;
  };

  // Fetch SVG content
  useEffect(() => {
    let isMounted = true;
    
    const fetchSvgContent = async () => {
      try {
        if (!isMounted) return;
        
        setLoading(true);
        setError(null);
        setSvgLoaded(false);
        
        // Get the SVG URL for the current building and floor
        const svgUrl = FLOOR_PLANS[building]?.[floor];
        
        if (!svgUrl) {
          throw new Error(`No floor plan found for ${building}, ${floor}`);
        }
        
        // Fetch the SVG content
        const response = await fetch(svgUrl);
        if (!response.ok) {
          throw new Error(`Failed to load floor plan: ${response.statusText}`);
        }
        
        const svgText = await response.text();
        
        if (!isMounted) return;
        
        setSvgContent(svgText);
        setLoading(false);
        
        // Add a small delay before declaring SVG as loaded
        setTimeout(() => {
          if (isMounted) {
            setSvgLoaded(true);
          }
        }, 100);
      } catch (err) {
        if (isMounted) {
          console.error("Error loading floor plan:", err);
          setError(err.message);
          setLoading(false);
          setSvgLoaded(false);
        }
      }
    };
    
    fetchSvgContent();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [building, floor]);
  
  // Fetch rooms for the current building
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        // In a real implementation, you would fetch rooms from the database
        // For now, let's use the room IDs from the overlay data
        const roomOverlayData = roomOverlays[building]?.[floor] || {};
        const roomIds = Object.keys(roomOverlayData);
        
        // Array to store room data
        const roomsData = [];
        
        // Fetch each room's data
        for (const roomId of roomIds) {
          try {
            // For now, we'll just use the overlay data and add placeholders
            // In a real app, you would fetch this from the database
            const roomData = {
              id: roomId,
              name: roomId,
              type: "Room",
              capacity: 10,
              building: building,
              location: `${building}, ${floor}`,
              equipment: [],
              ...roomOverlayData[roomId]
            };
            
            roomsData.push(roomData);
          } catch (roomError) {
            console.error(`Error fetching room ${roomId}:`, roomError);
          }
        }
        
        setRooms(roomsData);
      } catch (err) {
        console.error("Error fetching rooms:", err);
        setError("Failed to load room data");
      }
    };
    
    if (building && floor) {
      fetchRooms();
    }
  }, [building, floor]);
  
  // Fetch room data when a room is selected
  useEffect(() => {
    const fetchRoomData = async () => {
      if (!selectedRoom) return;
      
      try {
        // Get detailed room data
        const roomData = await getRoom(selectedRoom);
        setSelectedRoomData(roomData);
        
        // Get reservations for this room
        const roomReservations = await getRoomReservations(selectedRoom);
        setSelectedRoomReservations(roomReservations);
      } catch (err) {
        console.error("Error fetching selected room data:", err);
        // If we can't fetch the room from the database, use the overlay data
        // with placeholder details
        const roomOverlay = roomOverlays[building]?.[floor]?.[selectedRoom];
        if (roomOverlay) {
          setSelectedRoomData({
            id: selectedRoom,
            name: roomOverlay.label || selectedRoom,
            capacity: 10, // Placeholder
            location: `${building}, ${floor}`,
            type: "Room", // Placeholder
            building,
            equipment: ["Whiteboard"] // Placeholder
          });
        }
      }
    };
    
    fetchRoomData();
  }, [selectedRoom, building, floor]);
  
  // Handle room click
  const handleRoomClick = useCallback((roomId) => {
    console.log("Room clicked:", roomId);
    setSelectedRoom(roomId);
    setDrawerOpen(true);
  }, []);
  
  // Check if a room is occupied at the selected hour
  const isRoomOccupiedAtHour = useCallback((roomId) => {
    if (!reservations[roomId]) return false;
    
    // Set the selected hour to the selected date
    const selectedDateTime = new Date(selectedDate);
    selectedDateTime.setHours(selectedHour, 0, 0, 0);
    
    return reservations[roomId].some(reservation => {
      if (reservation.status === 'cancelled') return false;
      
      const startTime = new Date(reservation.startTime.seconds * 1000);
      const endTime = new Date(reservation.endTime.seconds * 1000);
      
      // Check if the selected hour falls within the reservation time range
      return selectedDateTime >= startTime && selectedDateTime < endTime;
    });
  }, [reservations, selectedDate, selectedHour]);

  // Get room overlays for the current building and floor
  const getRoomOverlaysData = useCallback(() => {
    // Check if we have overlay data for this building and floor
    if (!roomOverlays[building] || !roomOverlays[building][floor]) {
      return [];
    }
    
    const overlays = roomOverlays[building][floor];
    const result = [];
    
    // Convert overlays object to array with room data and occupation status
    Object.keys(overlays).forEach(roomId => {
      const overlay = overlays[roomId];
      
      result.push({
        id: roomId,
        name: roomId,
        label: overlay.label || roomId,
        x: overlay.x,
        y: overlay.y,
        width: overlay.width,
        height: overlay.height,
        isOccupied: isRoomOccupiedAtHour(roomId)
      });
    });
    
    return result;
  }, [building, floor, isRoomOccupiedAtHour]);

  // Handle hour slider change
  const handleHourChange = (event, newValue) => {
    setSelectedHour(newValue);
  };

  // Handle building/floor change
  const handleBuildingChange = (newBuilding) => {
    setBuilding(newBuilding);
    setSelectedRoom(null);
    setDrawerOpen(false);
  };

  const handleFloorChange = (newFloor) => {
    setFloor(newFloor);
    setSelectedRoom(null);
    setDrawerOpen(false);
  };

  // Format equipment icons
  const getEquipmentIcons = (equipment = []) => {
    if (!equipment || !equipment.length) return null;
    
    return (
      <Box sx={{ display: 'flex', mt: 1, gap: 1 }}>
        {equipment.includes('Computer') && (
          <Tooltip title="Computer">
            <ComputerIcon fontSize="small" color="action" />
          </Tooltip>
        )}
        {equipment.includes('Video Conference') && (
          <Tooltip title="Video Conference">
            <VideocamIcon fontSize="small" color="action" />
          </Tooltip>
        )}
        {equipment.includes('TV Screen') && (
          <Tooltip title="TV Screen">
            <TvIcon fontSize="small" color="action" />
          </Tooltip>
        )}
        {equipment.includes('Whiteboard') && (
          <Tooltip title="Whiteboard">
            <InfoIcon fontSize="small" color="action" />
          </Tooltip>
        )}
      </Box>
    );
  };

  // Room Details Card
  const RoomDetailsCard = () => {
    if (!selectedRoomData) return null;
    
    return (
      <Card sx={{ width: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Typography variant="h6" component="h2" gutterBottom>
              {selectedRoomData.name}
            </Typography>
            {isRoomOccupiedAtHour(selectedRoomData.id) ? (
              <Chip label="Occupied" color="error" size="small" />
            ) : (
              <Chip label="Available" color="success" size="small" />
            )}
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <LocationOnIcon fontSize="small" color="action" sx={{ mr: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {selectedRoomData.location || `${building}, ${floor}`}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <PeopleIcon fontSize="small" color="action" sx={{ mr: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Capacity: {selectedRoomData.capacity || 'Unknown'} people
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <MeetingRoomIcon fontSize="small" color="action" sx={{ mr: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Type: {selectedRoomData.type || 'Room'}
            </Typography>
          </Box>
          
          {getEquipmentIcons(selectedRoomData.equipment)}
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle2" gutterBottom>
            Availability for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
            {BUSINESS_HOURS.map(hour => {
              // Check if this hour is occupied
              const hourDate = new Date(selectedDate);
              hourDate.setHours(hour, 0, 0, 0);
              
              const isOccupied = selectedRoomReservations.some(res => {
                if (res.status === 'cancelled') return false;
                const start = new Date(res.startTime.seconds * 1000);
                const end = new Date(res.endTime.seconds * 1000);
                return hourDate >= start && hourDate < end;
              });
              
              return (
                <Chip
                  key={hour}
                  label={formatHour(hour)}
                  size="small"
                  color={isOccupied ? "error" : "success"}
                  variant={selectedHour === hour ? "filled" : "outlined"}
                  onClick={() => setSelectedHour(hour)}
                  sx={{ minWidth: 75 }}
                />
              );
            })}
          </Box>
        </CardContent>
        
        <CardActions>
          <Button 
            size="small"
            component={Link}
            to={`/rooms/${selectedRoomData.id}`}
          >
            Details
          </Button>
          <Button 
            size="small" 
            color="primary" 
            variant="contained"
            component={Link}
            to={`/rooms/${selectedRoomData.id}/book?time=${encodeURIComponent(
              new Date(selectedDate).setHours(selectedHour, 0, 0, 0)
            )}`}
            disabled={isRoomOccupiedAtHour(selectedRoomData.id)}
          >
            {isRoomOccupiedAtHour(selectedRoomData.id) ? 'Unavailable' : 'Book Now'}
          </Button>
        </CardActions>
      </Card>
    );
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        Interactive Floor Map
      </Typography>
      
      <Typography paragraph color="text.secondary">
        Explore available rooms across campus with real-time availability. 
        Click on a room to view details and book instantly.
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {/* Building and Floor Selection */}
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {Object.keys(FLOOR_PLANS).map(buildingName => (
          <Chip
            key={buildingName}
            label={buildingName}
            color={building === buildingName ? "primary" : "default"}
            onClick={() => handleBuildingChange(buildingName)}
            sx={{ mb: 1 }}
          />
        ))}
      </Box>
      
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {FLOOR_PLANS[building] && Object.keys(FLOOR_PLANS[building]).map(floorName => (
          <Chip
            key={floorName}
            label={floorName}
            color={floor === floorName ? "primary" : "default"}
            onClick={() => handleFloorChange(floorName)}
          />
        ))}
      </Box>
      
      {/* Time Selector Slider */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.paper' }}>
        <Typography variant="subtitle1" gutterBottom>
          {format(selectedDate, 'EEEE, MMMM d, yyyy')} - {formatHour(selectedHour)}
        </Typography>
        
        <Box sx={{ px: 2 }}>
          <Slider
            value={selectedHour}
            onChange={handleHourChange}
            step={1}
            marks={BUSINESS_HOURS.map(hour => ({ value: hour, label: hour === 7 || hour === 23 || hour % 3 === 1 ? formatHour(hour) : '' }))}
            min={7}
            max={23}
            valueLabelDisplay="auto"
            valueLabelFormat={formatHour}
            aria-labelledby="time-slider"
          />
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="caption" color="text.secondary">7:00 AM</Typography>
          <Typography variant="caption" color="text.secondary">11:00 PM</Typography>
        </Box>
      </Paper>
      
      {/* Map Legend */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ width: 16, height: 16, borderRadius: 1, bgcolor: 'rgba(76, 175, 80, 0.7)', mr: 1 }}></Box>
          <Typography variant="body2">Available</Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ width: 16, height: 16, borderRadius: 1, bgcolor: 'rgba(244, 67, 54, 0.7)', mr: 1 }}></Box>
          <Typography variant="body2">Occupied</Typography>
        </Box>
      </Box>
      
      {/* Room Count */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {getRoomOverlaysData().length} rooms available on this floor
      </Typography>
      
      {/* Interactive Map */}
      <Box 
        sx={{ 
          border: '1px solid #ccc',
          borderRadius: 1,
          overflow: 'hidden',
          width: '100%',
          height: 600,
          position: 'relative',
          backgroundColor: '#f5f5f5',
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : svgLoaded ? (
          <TransformWrapper
            initialScale={1}
            minScale={0.5}
            maxScale={3}
            wheel={{ step: 0.1 }}
            centerOnInit={true}
            limitToBounds={false}
            doubleClick={{ disabled: true }}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                {/* Map Controls */}
                <Box sx={{ 
                  position: 'absolute', 
                  top: 10, 
                  right: 10, 
                  zIndex: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  bgcolor: 'rgba(255, 255, 255, 0.7)',
                  p: 1,
                  borderRadius: 1,
                  boxShadow: 1
                }}>
                  <Tooltip title="Zoom In">
                    <IconButton onClick={() => zoomIn()} size="small">
                      <ZoomInIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Zoom Out">
                    <IconButton onClick={() => zoomOut()} size="small">
                      <ZoomOutIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Reset View">
                    <IconButton onClick={() => resetTransform()} size="small">
                      <RestartAltIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
                
                <TransformComponent
                  wrapperStyle={{ width: '100%', height: '100%' }}
                  contentStyle={{ width: '100%', height: '100%' }}
                >
                  <Box 
                    sx={{ 
                      width: '100%', 
                      height: '100%', 
                      position: 'relative',
                      backgroundColor: '#f5f5f5',
                    }}
                  >
                    {/* SVG Floor Plan */}
                    {svgContent ? (
                      <Box 
                        sx={{ width: '100%', height: '100%' }}
                        dangerouslySetInnerHTML={{ __html: svgContent }}
                      />
                    ) : (
                      <Box 
                        sx={{ 
                          width: '100%', 
                          height: '100%', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center' 
                        }}
                      >
                        <Typography variant="body1" color="text.secondary">
                          No floor plan available
                        </Typography>
                      </Box>
                    )}
                    
                    {/* Room Overlays */}
                    {svgContent && getRoomOverlaysData().map((overlay) => (
                      <RoomOverlay
                        key={overlay.id}
                        room={overlay}
                        x={overlay.x}
                        y={overlay.y}
                        width={overlay.width}
                        height={overlay.height}
                        label={overlay.label}
                        isOccupied={overlay.isOccupied}
                        onClick={() => handleRoomClick(overlay.id)}
                      />
                    ))}
                  </Box>
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography variant="body1" color="text.secondary">
              No floor plan available
            </Typography>
          </Box>
        )}
        
        {/* Current Location Indicator */}
        <Box sx={{ 
          position: 'absolute', 
          bottom: 10, 
          left: 10, 
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          bgcolor: 'rgba(255, 255, 255, 0.7)',
          p: 1,
          borderRadius: 1,
          boxShadow: 1
        }}>
          <LocationOnIcon fontSize="small" color="primary" />
          <Typography variant="body2">
            {building}, {floor}
          </Typography>
        </Box>
      </Box>
      
      {/* Room Details Drawer */}
      <Drawer
        anchor={isMobile ? "bottom" : "right"}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: isMobile ? '100%' : 350,
            p: 2
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Room Details</Typography>
          <IconButton onClick={() => setDrawerOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        
        {selectedRoomData ? (
          <RoomDetailsCard />
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        )}
      </Drawer>
    </Paper>
  );
};

export default EnhancedRoomVisualizer;
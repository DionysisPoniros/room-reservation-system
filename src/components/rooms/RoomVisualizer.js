// src/components/rooms/RoomVisualizer.js
import React, { useState, useEffect, useRef } from 'react';
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
  Button,
  Tooltip,
  Zoom,
  Slider,
  IconButton,
  Drawer,
  Divider,
  Card,
  CardContent,
  CardActions,
  Chip,
  useTheme,
  useMediaQuery,
  Alert
} from '@mui/material';
import { Link } from 'react-router-dom';
import { getRooms, getRoomReservations, getRoom } from '../../services/roomService';
import { MAP_CONFIG } from '../../services/mapService';
import * as pdfjs from 'pdfjs-dist';

// Configure PDF.js worker
if (typeof window !== 'undefined' && 'pdfjs' in window) {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

// Icons
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import FitScreenIcon from '@mui/icons-material/FitScreen';
import PeopleIcon from '@mui/icons-material/People';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ComputerIcon from '@mui/icons-material/Computer';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';

// Room overlay data - pre-defined coordinates for rooms on each floor
// These would be dynamically generated in a production environment
const roomOverlays = {
  "Max Lowenthal Hall": {
    "1st Floor": {
      "LOW-1050": { x: 130, y: 85, width: 130, height: 90, label: "Gueldenpfennig Auditorium" },
      "LOW-1060": { x: 50, y: 150, width: 30, height: 40, label: "Bruce May Room" },
      "LOW-1064": { x: 50, y: 200, width: 30, height: 40, label: "Green Room" },
      "LOW-1100": { x: 505, y: 235, width: 80, height: 60, label: "Study Lounge" },
      "LOW-1105": { x: 200, y: 85, width: 80, height: 60, label: "Active Learning Classroom" },
      "LOW-1110": { x: 200, y: 155, width: 80, height: 60, label: "Active Learning Classroom" },
      "LOW-1115": { x: 200, y: 225, width: 80, height: 60, label: "REDCOM Collaboratory" },
      "LOW-1125": { x: 590, y: 310, width: 50, height: 100, label: "Business Analytics Center" },
      "LOW-1135": { x: 435, y: 440, width: 80, height: 60, label: "Lecture Hall" }
    },
    "2nd Floor": {
      "LOW-2312": { x: 435, y: 155, width: 50, height: 40, label: "EMBA Conference Room" }
    },
    "3rd Floor": {
      "LOW-3000": { x: 505, y: 285, width: 65, height: 55, label: "Dean's Conference Room" },
      "LOW-3010": { x: 130, y: 115, width: 80, height: 60, label: "Tech Lab" },
      "LOW-3015": { x: 220, y: 115, width: 80, height: 60, label: "Business Case Lab" },
      "LOW-3025": { x: 435, y: 340, width: 80, height: 60, label: "Board Room" },
      "LOW-3105": { x: 435, y: 270, width: 80, height: 60, label: "Classroom" },
      "LOW-3115": { x: 435, y: 440, width: 80, height: 60, label: "Classroom" },
      "LOW-3215": { x: 435, y: 530, width: 80, height: 60, label: "Lecture Hall" }
    },
    "4th Floor": {
      "LOW-4050": { x: 400, y: 215, width: 100, height: 90, label: "Susan R. Holliday Center" }
    },
    "A-Level": {
      "LOW-A071": { x: 435, y: 430, width: 40, height: 25, label: "Team Room" },
      "LOW-A073": { x: 435, y: 460, width: 40, height: 25, label: "Team Room" },
      "LOW-A075": { x: 435, y: 490, width: 40, height: 25, label: "Team Room" },
      "LOW-A076": { x: 435, y: 520, width: 40, height: 25, label: "Team Room" }
    }
  },
  "Wallace Library": {
    "1st Floor": {
      "WAL-1545": { x: 535, y: 340, width: 40, height: 25, label: "Group Study Room" },
      "WAL-1624": { x: 600, y: 400, width: 100, height: 80, label: "Circulation Lobby" }
    },
    "2nd Floor": {
      "WAL-2470": { x: 100, y: 150, width: 30, height: 25, label: "Individual Study Room" },
      "WAL-2472": { x: 100, y: 180, width: 30, height: 25, label: "Individual Study Room" },
      "WAL-2474": { x: 100, y: 210, width: 30, height: 25, label: "Individual Study Room" },
      "WAL-2476": { x: 100, y: 240, width: 30, height: 25, label: "Individual Study Room" }
    },
    "3rd Floor": {
      "WAL-3420": { x: 160, y: 150, width: 80, height: 60, label: "Classroom" },
      "WAL-3430": { x: 250, y: 150, width: 80, height: 60, label: "Classroom" },
      "WAL-3440": { x: 340, y: 150, width: 80, height: 60, label: "Classroom" },
      "WAL-3470": { x: 630, y: 245, width: 50, height: 35, label: "Group Study Room" }
    },
    "4th Floor": {
      "WAL-4480": { x: 250, y: 250, width: 80, height: 60, label: "Classroom" },
      "WAL-4510": { x: 250, y: 320, width: 80, height: 60, label: "Classroom" }
    },
    "A-Level": {
      "WAL-A400": { x: 210, y: 150, width: 80, height: 60, label: "Classroom" },
      "WAL-A600": { x: 210, y: 430, width: 80, height: 60, label: "Faculty Commons" }
    }
  }
};

// Find room ID from coordinates
const findRoomAtCoordinates = (building, floor, x, y) => {
  if (!roomOverlays[building] || !roomOverlays[building][floor]) return null;
  
  const rooms = roomOverlays[building][floor];
  
  for (const roomId in rooms) {
    const room = rooms[roomId];
    if (x >= room.x && x <= room.x + room.width && 
        y >= room.y && y <= room.y + room.height) {
      return roomId;
    }
  }
  
  return null;
};

function RoomVisualizer() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const mapRef = useRef(null);
  const canvasRef = useRef(null);
  
  // State for UI controls
  const [building, setBuilding] = useState("Max Lowenthal Hall");
  const [floor, setFloor] = useState("1st Floor");
  const [timeFrame, setTimeFrame] = useState('now');
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [rooms, setRooms] = useState([]);
  const [reservations, setReservations] = useState({});
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Room info drawer
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [roomDetails, setRoomDetails] = useState(null);
  
  // PDF State
  const [pdfDimensions, setPdfDimensions] = useState({ width: 0, height: 0 });
  
  // Fetch all rooms
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        const roomsData = await getRooms();
        
        // Filter rooms by building
        const filteredRooms = roomsData.filter(room => {
          // Match by building name
          if (room.building && room.building.includes(building)) {
            return true;
          }
          
          // Or try to extract building from location
          if (room.location && room.location.includes(building)) {
            return true;
          }
          
          return false;
        });
        
        setRooms(filteredRooms);
        
        // Fetch reservations for all rooms
        const reservationsMap = {};
        
        // Get current date
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // For each room, fetch reservations
        for (const room of filteredRooms) {
          try {
            const roomReservations = await getRoomReservations(room.id);
            reservationsMap[room.id] = roomReservations;
          } catch (error) {
            console.error(`Error fetching reservations for room ${room.id}:`, error);
          }
        }
        
        setReservations(reservationsMap);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching room data:", error);
        setError("Failed to load rooms. Please try again.");
        setLoading(false);
      }
    };
    
    fetchRooms();
  }, [building]);
  
  // Handle building selection change
  const handleBuildingChange = (event) => {
    const newBuilding = event.target.value;
    setBuilding(newBuilding);
    
    // Reset floor to first floor when building changes
    const floors = Object.keys(floorPlans[newBuilding]);
    setFloor(floors[0]);
    
    // Reset zoom and position
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };
  
  // Handle floor selection change
  const handleFloorChange = (event) => {
    setFloor(event.target.value);
    
    // Reset zoom and position
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };
  
  // Handle time frame selection change
  const handleTimeFrameChange = (event, newTimeFrame) => {
    if (newTimeFrame !== null) {
      setTimeFrame(newTimeFrame);
    }
  };
  
  // Zoom handlers
  const handleZoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.25, 3));
  };
  
  const handleZoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.25, 0.5));
  };
  
  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };
  
  // Handle zoom with slider
  const handleZoomChange = (event, newValue) => {
    setScale(newValue);
  };
  
  // Dragging handlers
  const handleMouseDown = (e) => {
    e.preventDefault();
    
    if (e.button === 0) { // Left mouse button
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };
  
  const handleMouseMove = (e) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      setPosition({
        x: newX,
        y: newY
      });
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // Touch handlers for mobile
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      });
    }
  };
  
  const handleTouchMove = (e) => {
    if (isDragging && e.touches.length === 1) {
      const newX = e.touches[0].clientX - dragStart.x;
      const newY = e.touches[0].clientY - dragStart.y;
      
      setPosition({
        x: newX,
        y: newY
      });
    }
  };
  
  const handleTouchEnd = () => {
    setIsDragging(false);
  };
  
  // Handle click on map
  const handleMapClick = (e) => {
    if (!mapRef.current) return;
    
    // Get click coordinates relative to the map
    const rect = mapRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - position.x) / scale;
    const y = (e.clientY - rect.top - position.y) / scale;
    
    // Find room at these coordinates
    const roomId = findRoomAtCoordinates(building, floor, x, y);
    
    if (roomId) {
      handleRoomSelection(roomId);
    }
  };
  
  // Room selection handler
  const handleRoomSelection = async (roomId) => {
    try {
      // Find room in our loaded rooms
      const roomData = rooms.find(r => r.name === roomId);
      
      if (roomData) {
        setSelectedRoom(roomData);
        setDrawerOpen(true);
        
        // Fetch detailed room information if needed
        const details = await getRoom(roomData.id);
        setRoomDetails(details);
      } else {
        console.log(`Room ${roomId} found in overlay but not in database`);
      }
    } catch (error) {
      console.error("Error selecting room:", error);
    }
  };
  
  // Check if a room is currently occupied
  const isRoomOccupied = (roomId) => {
    if (!reservations[roomId]) return false;
    
    const now = new Date();
    
    // If timeFrame is 'now', check if there's an active reservation
    if (timeFrame === 'now') {
      return reservations[roomId].some(reservation => {
        if (reservation.status === 'cancelled') return false;
        
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
        if (reservation.status === 'cancelled') return false;
        
        const startTime = new Date(reservation.startTime.seconds * 1000);
        return startTime >= today && startTime < tomorrow;
      });
    }
    
    return false;
  };
  
  // Find DB room ID from room name
  const findRoomId = (roomName) => {
    const roomData = rooms.find(r => r.name === roomName);
    return roomData ? roomData.id : null;
  };
  
  // Format time for display
  const formatTime = (timestamp) => {
    if (!timestamp || !timestamp.seconds) return 'N/A';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.seconds) return 'N/A';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
  };
  
  // Get equipment icons
  const getEquipmentIcons = (equipment = []) => {
    const icons = [];
    
    if (equipment.includes('Computer')) {
      icons.push(
        <Tooltip key="computer" title="Computer">
          <ComputerIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
        </Tooltip>
      );
    }
    
    if (equipment.includes('Video Conference') || equipment.includes('Video Conferencing')) {
      icons.push(
        <Tooltip key="video" title="Video Conferencing">
          <VideoCallIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
        </Tooltip>
      );
    }
    
    if (equipment.includes('Smart Board') || equipment.includes('Projector') || equipment.includes('TV Screen')) {
      icons.push(
        <Tooltip key="display" title="Display">
          <DesktopWindowsIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
        </Tooltip>
      );
    }
    
    return icons;
  };
  
  // Render room rectangles
  const renderRooms = () => {
    if (!roomOverlays[building] || !roomOverlays[building][floor]) {
      return null;
    }
    
    return Object.entries(roomOverlays[building][floor]).map(([roomName, roomData]) => {
      const roomId = findRoomId(roomName);
      const isOccupied = roomId ? isRoomOccupied(roomId) : false;
      const color = isOccupied ? 'rgba(244, 67, 54, 0.7)' : 'rgba(76, 175, 80, 0.7)';
      
      return (
        <Tooltip 
          key={roomName}
          title={`${roomData.label} (${isOccupied ? 'Occupied' : 'Available'})`}
          arrow
          TransitionComponent={Zoom}
        >
          <div
            style={{
              position: 'absolute',
              left: roomData.x,
              top: roomData.y,
              width: roomData.width,
              height: roomData.height,
              backgroundColor: color,
              border: '2px solid rgba(0, 0, 0, 0.3)',
              borderRadius: '5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              color: 'white',
              textShadow: '0 0 2px black',
              fontWeight: 'bold',
              overflow: 'hidden',
              transition: 'all 0.2s ease-in-out',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              '&:hover': {
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                transform: 'translateY(-1px)'
              }
            }}
            onClick={() => handleRoomSelection(roomName)}
          >
            {roomData.width > 60 && roomData.height > 20 ? roomName : ''}
          </div>
        </Tooltip>
      );
    });
  };

  // PDF Loading Function
  useEffect(() => {
    let isMounted = true;
    let renderTask = null;
    let pdfDocument = null;

    const renderPDF = async () => {
      // Skip if we don't have a canvas reference yet
      if (!canvasRef.current) return;
      
      try {
        setPdfLoading(true);
        
        // Get the floor plan path
        const pdfPath = floorPlans[building][floor];
        
        if (!pdfPath) {
          throw new Error("Floor plan not found");
        }
        
        // Load the PDF
        const loadingTask = pdfjs.getDocument(pdfPath);
        pdfDocument = await loadingTask.promise;
        
        if (!isMounted) return;
        
        // Get the first page
        const page = await pdfDocument.getPage(1);
        if (!isMounted) return;
        
        // Get viewport for rendering
        const viewport = page.getViewport({ scale: 1 });
        const canvas = canvasRef.current;
        
        // Set canvas dimensions to match viewport
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        setPdfDimensions({
          width: viewport.width, 
          height: viewport.height
        });
        
        // Render the PDF page to the canvas
        const context = canvas.getContext('2d');
        renderTask = page.render({
          canvasContext: context,
          viewport
        });
        
        await renderTask.promise;
        
        if (!isMounted) return;
        
        setPdfLoading(false);
      } catch (err) {
        console.error("Error rendering PDF:", err);
        if (isMounted) {
          setError(`Failed to render floor plan: ${err.message}`);
          setPdfLoading(false);
        }
      }
    };
    
    renderPDF();
    
    // Cleanup function
    return () => {
      isMounted = false;
      if (renderTask) {
        renderTask.cancel();
      }
      if (pdfDocument) {
        pdfDocument.destroy();
      }
    };
  }, [building, floor]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Interactive Building Map
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
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
            {Object.keys(floorPlans).map((buildingName) => (
              <MenuItem key={buildingName} value={buildingName}>
                {buildingName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {/* Floor Selection */}
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel id="floor-select-label">Floor</InputLabel>
          <Select
            labelId="floor-select-label"
            value={floor}
            label="Floor"
            onChange={handleFloorChange}
          >
            {floorPlans[building] && Object.keys(floorPlans[building]).map((floorName) => (
              <MenuItem key={floorName} value={floorName}>
                {floorName}
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
      
      {/* Zoom controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={handleZoomOut} disabled={scale <= 0.5}>
          <ZoomOutIcon />
        </IconButton>
        
        <Slider
          value={scale}
          min={0.5}
          max={3}
          step={0.25}
          onChange={handleZoomChange}
          aria-labelledby="zoom-slider"
          sx={{ mx: 2, width: 200 }}
        />
        
        <IconButton onClick={handleZoomIn} disabled={scale >= 3}>
          <ZoomInIcon />
        </IconButton>
        
        <IconButton onClick={handleResetZoom} sx={{ ml: 1 }}>
          <FitScreenIcon />
        </IconButton>
      </Box>
      
      {/* Map Legend */}
      <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ 
            width: 16, 
            height: 16, 
            bgcolor: 'rgba(76, 175, 80, 0.7)', 
            mr: 1,
            borderRadius: '3px' 
          }}></Box>
          <Typography variant="body2">Available</Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ 
            width: 16, 
            height: 16, 
            bgcolor: 'rgba(244, 67, 54, 0.7)', 
            mr: 1,
            borderRadius: '3px'
          }}></Box>
          <Typography variant="body2">Occupied</Typography>
        </Box>
        
        <Typography variant="caption" color="text.secondary">
          Click on a room to view details and book
        </Typography>
      </Box>
      
      {/* Instructions for mobile */}
      {isMobile && (
        <Typography variant="caption" display="block" sx={{ mb: 2 }}>
          Drag to pan, pinch to zoom. Tap on a room for details.
        </Typography>
      )}
      
      {/* Map Container */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: 600,
          border: '1px solid #ccc',
          overflow: 'hidden',
          bgcolor: '#f5f5f5',
          userSelect: 'none',
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleMapClick}
        ref={mapRef}
      >
        {/* Floor Plan Image */}
        <Box
          sx={{
            position: 'absolute',
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            width: '100%',
            height: '100%'
          }}
        >
          {pdfLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress sx={{ mr: 2 }} />
              <Typography>Loading floor plan...</Typography>
            </Box>
          ) : (
            <>
              <canvas 
                ref={canvasRef}
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '100%',
                  display: 'block'
                }}
              />
              {/* Room Overlays */}
              {renderRooms()}
            </>
          )}
        </Box>
      </Box>
      
      {/* Room Details Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '100%', sm: 400 },
            p: 2
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Room Details</Typography>
          <IconButton onClick={() => setDrawerOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        {selectedRoom ? (
          <>
            <Typography variant="h5" gutterBottom>
              {selectedRoom.name}
            </Typography>
            
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
                  No equipment listed
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
                disabled={isRoomOccupied(selectedRoom.id)}
              >
                {isRoomOccupied(selectedRoom.id) ? 'Currently Unavailable' : 'Book Now'}
              </Button>
            </Box>
          </>
        ) : (
          <Typography>Select a room to view details</Typography>
        )}
      </Drawer>
    </Paper>
  );
}

// Floor plan paths
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

export default RoomVisualizer;
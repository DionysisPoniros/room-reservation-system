// src/components/rooms/EnhancedRoomVisualizer.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Alert,
  Skeleton,
  Fade,
  Snackbar
} from '@mui/material';
import { Link } from 'react-router-dom';
import { getRooms, getRoomReservations, getRoom } from '../../services/roomService';
import { MAP_CONFIG } from '../../services/mapService';
import { extractRoomLocation } from '../../utils/mapUtils';
import * as pdfjs from 'pdfjs-dist';

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
import RefreshIcon from '@mui/icons-material/Refresh';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WifiIcon from '@mui/icons-material/Wifi';
import RateReviewIcon from '@mui/icons-material/RateReview';
import ImageSearchIcon from '@mui/icons-material/ImageSearch';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

// Configure PDF.js worker
if (typeof window !== 'undefined' && 'pdfjs' in window) {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
} else {
  // Fallback worker path
  const pdfjsWorker = process.env.PUBLIC_URL + '/pdf.worker.min.js';
  pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

// Room overlay data - pre-defined coordinates for rooms on each floor
// These would ideally come from a database or API in a production environment
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

// PDFViewer Component - Separated for clarity
const PDFViewer = ({ pdfUrl, scale, onRenderComplete }) => {
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  useEffect(() => {
    if (!pdfUrl) {
      setError("No PDF file provided");
      setLoading(false);
      return;
    }

    let isMounted = true;
    let renderTask = null;
    let pdfDocument = null;

    const renderPDF = async () => {
      if (!canvasRef.current) return;
      
      try {
        setLoading(true);
        setError(null);
        
        console.log(`Rendering PDF: ${pdfUrl} at scale ${scale}`);
        
        // Load the PDF
        const loadingTask = pdfjs.getDocument(pdfUrl);
        pdfDocument = await loadingTask.promise;
        
        if (!isMounted) return;
        
        // Get the first page
        const page = await pdfDocument.getPage(1);
        if (!isMounted) return;
        
        // Get viewport for rendering
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        
        // Set canvas dimensions to match viewport
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        // Render the PDF page to the canvas
        const context = canvas.getContext('2d');
        renderTask = page.render({
          canvasContext: context,
          viewport
        });
        
        await renderTask.promise;
        
        if (!isMounted) return;
        
        setLoading(false);
        
        // Notify parent that rendering is complete
        if (onRenderComplete) {
          onRenderComplete({
            width: viewport.width,
            height: viewport.height
          });
        }

      } catch (err) {
        console.error("Error rendering PDF:", err);
        if (isMounted) {
          setError(`Failed to render floor plan: ${err.message}`);
          setLoading(false);
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
  }, [pdfUrl, scale, onRenderComplete, retryCount]);

  // Handle retry
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  // Handle fallback to image if needed
  const handleImageFallback = () => {
    if (!pdfUrl) return;
    
    // Try to use a PNG version of the floor plan instead
    const imagePath = pdfUrl.replace('.pdf', '.png');
    alert(`Attempting to load image fallback: ${imagePath}\n\nNote: In a production environment, this would automatically try to load an image version of the floor plan.`);
  };

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Loading indicator */}
      {loading && (
        <Box 
          sx={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(255, 255, 255, 0.8)',
            zIndex: 10
          }}
        >
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography>Loading floor plan...</Typography>
        </Box>
      )}
      
      {/* Error message */}
      {error && (
        <Box 
          sx={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
            zIndex: 10
          }}
        >
          <Alert 
            severity="error" 
            sx={{ 
              width: '100%', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'flex-start'
            }}
          >
            <Typography paragraph>{error}</Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={handleRetry}
                startIcon={<RefreshIcon />}
              >
                Try Again
              </Button>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={handleImageFallback}
                startIcon={<ImageSearchIcon />}
              >
                Try Image Fallback
              </Button>
            </Box>
          </Alert>
        </Box>
      )}
      
      {/* PDF Canvas */}
      <canvas 
        ref={canvasRef} 
        style={{ 
          display: loading ? 'none' : 'block'
        }}
      />
    </Box>
  );
};

function EnhancedRoomVisualizer() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const mapRef = useRef(null);
  
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
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // Room info drawer
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [roomDetails, setRoomDetails] = useState(null);
  
  // PDF State
  const [pdfDimensions, setPdfDimensions] = useState({ width: 0, height: 0 });
  
  // Help dialog state
  const [helpOpen, setHelpOpen] = useState(false);
  
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
          
          // Match by room name prefix
          if (building === 'Max Lowenthal Hall' && room.name && room.name.startsWith('LOW-')) {
            return true;
          }
          
          if (building === 'Wallace Library' && room.name && room.name.startsWith('WAL-')) {
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
    
    // Show snackbar notification
    setSnackbarMessage(`Switched to ${newBuilding}`);
    setSnackbarOpen(true);
  };
  
  // Handle floor selection change
  const handleFloorChange = (event) => {
    setFloor(event.target.value);
    
    // Reset zoom and position
    setScale(1);
    setPosition({ x: 0, y: 0 });
    
    // Show snackbar notification
    setSnackbarMessage(`Switched to ${event.target.value}`);
    setSnackbarOpen(true);
  };
  
  // Handle time frame selection change
  const handleTimeFrameChange = (event, newTimeFrame) => {
    if (newTimeFrame !== null) {
      setTimeFrame(newTimeFrame);
      
      // Show snackbar notification
      setSnackbarMessage(`Showing ${newTimeFrame === 'now' ? 'current' : 'today\'s'} availability`);
      setSnackbarOpen(true);
    }
  };
  
  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setScale(prevScale => Math.min(prevScale + 0.25, 3));
  }, []);
  
  const handleZoomOut = useCallback(() => {
    setScale(prevScale => Math.max(prevScale - 0.25, 0.5));
  }, []);
  
  const handleResetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    
    // Show snackbar notification
    setSnackbarMessage('View reset');
    setSnackbarOpen(true);
  }, []);
  
  // Handle zoom with slider
  const handleZoomChange = useCallback((event, newValue) => {
    setScale(newValue);
  }, []);
  
  // Dragging handlers with improved mobile support
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    
    if (e.button === 0) { // Left mouse button
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  }, [position]);
  
  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      setPosition({
        x: newX,
        y: newY
      });
    }
  }, [isDragging, dragStart]);
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  // Touch handlers for mobile with better multi-touch support
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      });
    }
  }, [position]);
  
  const handleTouchMove = useCallback((e) => {
    if (isDragging && e.touches.length === 1) {
      const newX = e.touches[0].clientX - dragStart.x;
      const newY = e.touches[0].clientY - dragStart.y;
      
      setPosition({
        x: newX,
        y: newY
      });
    }
  }, [isDragging, dragStart]);
  
  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  // Handle PDF render complete
  const handleRenderComplete = useCallback((dimensions) => {
    setPdfDimensions(dimensions);
    setPdfLoading(false);
    console.log("PDF render complete:", dimensions);
  }, []);
  
  // Handle click on map
  const handleMapClick = useCallback((e) => {
    if (!mapRef.current || isDragging) return;
    
    // Get click coordinates relative to the map
    const rect = mapRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - position.x) / scale;
    const y = (e.clientY - rect.top - position.y) / scale;
    
    console.log(`Click at scaled coordinates: (${x}, ${y})`);
    
    // Find room at these coordinates
    const roomId = findRoomAtCoordinates(building, floor, x, y);
    
    if (roomId) {
      console.log(`Found room: ${roomId}`);
      handleRoomSelection(roomId);
    } else {
      console.log('No room found at click coordinates');
    }
  }, [mapRef, isDragging, position, scale, building, floor]);
  
  // Room selection handler
  const handleRoomSelection = useCallback(async (roomId) => {
    try {
      // Find room in our loaded rooms
      const roomData = rooms.find(r => r.name === roomId);
      
      if (roomData) {
        setSelectedRoom(roomData);
        setDrawerOpen(true);
        
        // Show loading state
        setRoomDetails(null);
        
        // Fetch detailed room information with a small delay to show loading state
        setTimeout(async () => {
          try {
            const details = await getRoom(roomData.id);
            setRoomDetails(details);
          } catch (detailsError) {
            console.error("Error fetching room details:", detailsError);
            // Still show the room but with a warning
            setRoomDetails({...roomData, fetchError: true});
          }
        }, 300);
      } else {
        console.log(`Room ${roomId} found in overlay but not in database`);
        
        // Show a message to the user
        setSnackbarMessage(`Room information for ${roomId} not found in database`);
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error("Error selecting room:", error);
      setSnackbarMessage("Error selecting room. Please try again.");
      setSnackbarOpen(true);
    }
  }, [rooms]);
  
  // Check if a room is currently occupied
  const isRoomOccupied = useCallback((roomId) => {
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
  }, [reservations, timeFrame]);
  
  // Find DB room ID from room name
  const findRoomId = useCallback((roomName) => {
    const roomData = rooms.find(r => r.name === roomName);
    return roomData ? roomData.id : null;
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
  
  // Get equipment icons
  const getEquipmentIcons = useCallback((equipment = []) => {
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
    
    if (equipment.includes('Whiteboard')) {
      icons.push(
        <Tooltip key="whiteboard" title="Whiteboard">
          <RateReviewIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
        </Tooltip>
      );
    }
    
    if (equipment.includes('Audio System')) {
      icons.push(
        <Tooltip key="audio" title="Audio System">
          <WifiIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
        </Tooltip>
      );
    }
    
    return icons;
  }, []);
  
  // Room UI state - for animations and better feedback
  const [roomUIState, setRoomUIState] = useState({});
  
  // Set initial room UI state
  useEffect(() => {
    const initialState = {};
    if (roomOverlays[building] && roomOverlays[building][floor]) {
      Object.keys(roomOverlays[building][floor]).forEach(roomId => {
        initialState[roomId] = { isHovered: false, isSelected: false };
      });
    }
    setRoomUIState(initialState);
  }, [building, floor]);
  
  // Handle room hover
  const handleRoomHover = useCallback((roomId, isHovered) => {
    setRoomUIState(prevState => ({
      ...prevState,
      [roomId]: { 
        ...prevState[roomId],
        isHovered
      }
    }));
  }, []);
  
  // Handle room click for the overlay
  const handleRoomClick = useCallback((roomId) => {
    // Update UI state
    setRoomUIState(prevState => {
      const newState = {};
      // Reset all rooms
      Object.keys(prevState).forEach(id => {
        newState[id] = { ...prevState[id], isSelected: false };
      });
      // Set clicked room to selected
      newState[roomId] = { ...prevState[roomId], isSelected: true };
      return newState;
    });
    
    // Handle actual selection
    handleRoomSelection(roomId);
  }, [handleRoomSelection]);
  
  // Render room rectangles with improved visual feedback
  const renderRooms = useCallback(() => {
    if (!roomOverlays[building] || !roomOverlays[building][floor]) {
      return null;
    }
    
    return Object.entries(roomOverlays[building][floor]).map(([roomName, roomData]) => {
      const roomId = findRoomId(roomName);
      const isOccupied = roomId ? isRoomOccupied(roomId) : false;
      const baseColor = isOccupied ? 'rgba(244, 67, 54, 0.7)' : 'rgba(76, 175, 80, 0.7)';
      const hoverColor = isOccupied ? 'rgba(244, 67, 54, 0.85)' : 'rgba(76, 175, 80, 0.85)';
      const selectedColor = isOccupied ? 'rgba(244, 67, 54, 1)' : 'rgba(76, 175, 80, 1)';
      
      const isHovered = roomUIState[roomName]?.isHovered || false;
      const isSelected = roomUIState[roomName]?.isSelected || false;
      
      const color = isSelected ? selectedColor : (isHovered ? hoverColor : baseColor);
      const borderWidth = isSelected ? 3 : (isHovered ? 2 : 1);
      const elevation = isSelected ? 8 : (isHovered ? 4 : 2);
      
      return (
        <Tooltip 
          key={roomName}
          title={`${roomData.label || roomName} (${isOccupied ? 'Occupied' : 'Available'})`}
          arrow
          placement="top"
        >
          <Box
            sx={{
              position: 'absolute',
              left: roomData.x,
              top: roomData.y,
              width: roomData.width,
              height: roomData.height,
              backgroundColor: color,
              border: `${borderWidth}px solid rgba(0, 0, 0, 0.4)`,
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
              boxShadow: `0 ${elevation/2}px ${elevation}px rgba(0,0,0,0.2)`,
              zIndex: isSelected ? 10 : (isHovered ? 5 : 1),
              transform: isSelected || isHovered ? 'translateY(-2px)' : 'none',
              '&:hover': {
                boxShadow: `0 6px 12px rgba(0,0,0,0.3)`,
                transform: 'translateY(-2px)'
              }
            }}
            onClick={() => handleRoomClick(roomName)}
            onMouseEnter={() => handleRoomHover(roomName, true)}
            onMouseLeave={() => handleRoomHover(roomName, false)}
          >
            {roomData.width > 50 && roomData.height > 20 ? (
              <Typography 
                variant="caption" 
                sx={{ 
                  fontSize: roomData.width > 100 ? '0.75rem' : '0.65rem',
                  lineHeight: 1,
                  fontWeight: 'bold',
                  color: 'white',
                  textShadow: '0px 1px 2px rgba(0,0,0,0.7)'
                }}
              >
                {roomData.label || roomName}
              </Typography>
            ) : null}
          </Box>
        </Tooltip>
      );
    });
  }, [building, floor, roomOverlays, roomUIState, findRoomId, isRoomOccupied, handleRoomClick, handleRoomHover]);
  
  // Handle close snackbar
  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };
  
  // Render help dialog
  const renderHelpDialog = () => {
    return (
      <Dialog open={helpOpen} onClose={() => setHelpOpen(false)} maxWidth="sm" fullWidth>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>How to Use the Interactive Map</Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Typography paragraph>
            <strong>Navigation:</strong> Select a building and floor from the dropdown menus.
          </Typography>
          
          <Typography paragraph>
            <strong>Pan:</strong> Click and drag to move around the floor plan.
          </Typography>
          
          <Typography paragraph>
            <strong>Zoom:</strong> Use the zoom slider or zoom buttons to increase or decrease zoom level.
          </Typography>
          
          <Typography paragraph>
            <strong>Room Selection:</strong> Click on a colored room to view its details and availability.
          </Typography>
          
          <Typography paragraph>
            <strong>Color Coding:</strong>
            <br />
            <span style={{ color: 'rgb(76, 175, 80)' }}>■</span> Green - Room is available
            <br />
            <span style={{ color: 'rgb(244, 67, 54)' }}>■</span> Red - Room is occupied
          </Typography>
          
          <Typography paragraph>
            <strong>Time View:</strong> Toggle between "Now" (current availability) and "Today" (any bookings today).
          </Typography>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" onClick={() => setHelpOpen(false)}>
              Got it
            </Button>
          </Box>
        </Box>
      </Dialog>
    );
  };

  // Loading placeholder
  if (loading && !rooms.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3, overflowX: 'hidden' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Interactive Building Map
        </Typography>
        <IconButton 
          onClick={() => setHelpOpen(true)}
          sx={{ 
            color: theme.palette.primary.main, 
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1
          }}
        >
          <HelpOutlineIcon />
        </IconButton>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {/* Building Selection */}
        <FormControl sx={{ minWidth: 200, flexGrow: 1 }}>
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
        <FormControl sx={{ minWidth: 120, flexGrow: 1 }}>
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
          sx={{ height: 40, alignSelf: 'center' }}
        >
          <ToggleButton value="now" aria-label="current availability">
            <AccessTimeIcon fontSize="small" sx={{ mr: 0.5 }} />
            Now
          </ToggleButton>
          <ToggleButton value="today" aria-label="today's availability">
            <EventAvailableIcon fontSize="small" sx={{ mr: 0.5 }} />
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
          sx={{ mx: 2, flexGrow: 1, maxWidth: 200 }}
        />
        
        <IconButton onClick={handleZoomIn} disabled={scale >= 3}>
          <ZoomInIcon />
        </IconButton>
        
        <Tooltip title="Reset View">
          <IconButton onClick={handleResetZoom} sx={{ ml: 1 }}>
            <FitScreenIcon />
          </IconButton>
        </Tooltip>
        
        <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
          Zoom: {scale.toFixed(2)}x
        </Typography>
      </Box>
      
      {/* Map Legend */}
      <Box sx={{ display: 'flex', gap: 3, mb: 2, flexWrap: 'wrap' }}>
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
        <Fade in>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Drag to pan, pinch to zoom. Tap on a room for details.
              <Button 
                size="small" 
                variant="text" 
                onClick={() => setHelpOpen(true)}
                sx={{ ml: 1 }}
              >
                Help
              </Button>
            </Typography>
          </Alert>
        </Fade>
      )}
      
      {/* Map Container with improved styling */}
      <Paper 
        elevation={3}
        sx={{
          position: 'relative',
          width: '100%',
          height: 600,
          overflow: 'hidden',
          bgcolor: '#f5f5f5',
          userSelect: 'none',
          cursor: isDragging ? 'grabbing' : 'grab',
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }
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
        <Fade in={!pdfLoading} timeout={500}>
          <Box
            sx={{
              position: 'absolute',
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: '0 0',
              width: '100%',
              height: '100%'
            }}
          >
            {/* PDF Viewer Component */}
            <PDFViewer
              pdfUrl={floorPlans[building][floor]}
              scale={1} // Base scale, we're handling zooming with CSS transform
              onRenderComplete={handleRenderComplete}
            />
            
            {/* Room Overlays with improved visual feedback */}
            {renderRooms()}
          </Box>
        </Fade>
      </Paper>
      
      {/* Room Details Drawer - Enhanced with loading states and better UX */}
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
          
          {selectedRoom ? (
            <>
              <Typography variant="h5" gutterBottom>
                {selectedRoom.name}
              </Typography>
              
              {/* Show loading state for room details */}
              {!roomDetails ? (
                <>
                  <Box sx={{ mb: 3 }}>
                    <Skeleton variant="text" width="70%" height={24} sx={{ mb: 1 }} />
                    <Skeleton variant="text" width="60%" height={24} sx={{ mb: 1 }} />
                    <Skeleton variant="text" width="80%" height={24} sx={{ mb: 1 }} />
                  </Box>
                  
                  <Typography variant="h6" gutterBottom>
                    <Skeleton variant="text" width="40%" />
                  </Typography>
                  
                  <Box sx={{ mb: 3 }}>
                    <Skeleton variant="rectangular" width="100%" height={60} />
                  </Box>
                  
                  <Typography variant="h6" gutterBottom>
                    <Skeleton variant="text" width="40%" />
                  </Typography>
                  
                  <Box sx={{ mb: 3 }}>
                    <Skeleton variant="rectangular" width="100%" height={80} />
                  </Box>
                </>
              ) : (
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
          ) : (
            <Typography>Select a room to view details</Typography>
          )}
        </Box>
      </Drawer>
      
      {/* Info Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
      />
      
      {/* Help Dialog */}
      {renderHelpDialog()}
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

export default EnhancedRoomVisualizer;
// src/components/rooms/InteractiveFloorMap.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Chip,
  Slider,
  useTheme
} from '@mui/material';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

// Import Icons
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';

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

// Room overlay data - defines where rooms are on each floor
// This could be loaded from your existing room overlay data
const ROOM_OVERLAYS = {
  "Max Lowenthal Hall": {
    "1st Floor": {
      "LOW-1050": { x: 130, y: 85, width: 130, height: 90, label: "Gueldenpfennig Auditorium" },
      "LOW-1060": { x: 50, y: 150, width: 30, height: 40, label: "Bruce May Room" },
      // Add more rooms here
    }
    // Add more floors here
  },
  "Wallace Library": {
    "1st Floor": {
      "WAL-1545": { x: 535, y: 340, width: 40, height: 25, label: "Group Study Room" },
      "WAL-1624": { x: 600, y: 400, width: 100, height: 80, label: "Circulation Lobby" },
      // Add more rooms here
    }
    // Add more floors here
  }
};

/**
 * Interactive Floor Map Component
 * 
 * A fully interactive map with pan and zoom capabilities
 * for navigating building floor plans.
 */
const InteractiveFloorMap = ({ 
  building = "Max Lowenthal Hall", 
  floor = "1st Floor",
  onBuildingChange,
  onFloorChange,
  onRoomSelect,
  rooms = [],
  reservations = {}
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [svgContent, setSvgContent] = useState(null);
  const svgRef = useRef(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [hoveredRoom, setHoveredRoom] = useState(null);
  
  // Add state for manual pan and zoom (if not using react-zoom-pan-pinch)
  const [scale, setScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  
  // Fetch SVG content
  useEffect(() => {
    const fetchSvgContent = async () => {
      try {
        setLoading(true);
        setError(null);
        
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
        setSvgContent(svgText);
        setLoading(false);
      } catch (err) {
        console.error("Error loading floor plan:", err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchSvgContent();
  }, [building, floor]);
  
  // Check if a room is occupied
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
  
  // Handle room click
  const handleRoomClick = useCallback((roomId) => {
    if (!roomId) return;
    
    setSelectedRoom(roomId);
    
    // Notify parent component
    if (onRoomSelect) {
      onRoomSelect(roomId);
    }
  }, [onRoomSelect]);
  
  // Render room overlays
  const renderRoomOverlays = useCallback(() => {
    if (!ROOM_OVERLAYS[building] || !ROOM_OVERLAYS[building][floor]) {
      return null;
    }
    
    return Object.entries(ROOM_OVERLAYS[building][floor]).map(([roomId, roomData]) => {
      const isOccupied = isRoomOccupied(roomId);
      const isSelected = selectedRoom === roomId;
      const isHovered = hoveredRoom === roomId;
      
      // Room colors based on state
      const baseColor = isOccupied ? 'rgba(244, 67, 54, 0.5)' : 'rgba(76, 175, 80, 0.5)';
      const hoverColor = isOccupied ? 'rgba(244, 67, 54, 0.7)' : 'rgba(76, 175, 80, 0.7)';
      const selectedColor = isOccupied ? 'rgba(244, 67, 54, 0.9)' : 'rgba(76, 175, 80, 0.9)';
      
      const color = isSelected ? selectedColor : (isHovered ? hoverColor : baseColor);
      const borderWidth = isSelected ? 3 : (isHovered ? 2 : 1);
      
      return (
        <g key={roomId}>
          <Tooltip 
            title={`${roomData.label || roomId} (${isOccupied ? 'Occupied' : 'Available'})`}
            arrow
            placement="top"
          >
            <rect
              x={roomData.x}
              y={roomData.y}
              width={roomData.width}
              height={roomData.height}
              fill={color}
              stroke="rgba(0, 0, 0, 0.4)"
              strokeWidth={borderWidth}
              rx={5}
              ry={5}
              style={{ 
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
              }}
              onClick={() => handleRoomClick(roomId)}
              onMouseEnter={() => setHoveredRoom(roomId)}
              onMouseLeave={() => setHoveredRoom(null)}
            />
          </Tooltip>
          
          {/* Room label - show for larger rooms */}
          {roomData.width > 60 && roomData.height > 30 && (
            <text
              x={roomData.x + roomData.width / 2}
              y={roomData.y + roomData.height / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize="10"
              fontWeight="bold"
              style={{ 
                pointerEvents: 'none',
                textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
              }}
            >
              {roomData.label || roomId}
            </text>
          )}
        </g>
      );
    });
  }, [building, floor, hoveredRoom, selectedRoom, isRoomOccupied, handleRoomClick]);
  
  // Fallback content when SVG is not loaded
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }
  
  return (
    <Paper sx={{ p: 2, position: 'relative', height: 600, overflow: 'hidden' }}>
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
        <TransformWrapper>
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
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
            </>
          )}
        </TransformWrapper>
      </Box>
      
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
      
      {/* Legend */}
      <Box sx={{ 
        position: 'absolute', 
        bottom: 10, 
        right: 10, 
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        bgcolor: 'rgba(255, 255, 255, 0.7)',
        p: 1,
        borderRadius: 1,
        boxShadow: 1
      }}>
        <Chip 
          icon={<MeetingRoomIcon />} 
          label="Available" 
          size="small" 
          sx={{ bgcolor: 'rgba(76, 175, 80, 0.7)', color: 'white' }} 
        />
        <Chip 
          icon={<MeetingRoomIcon />} 
          label="Occupied" 
          size="small" 
          sx={{ bgcolor: 'rgba(244, 67, 54, 0.7)', color: 'white' }} 
        />
      </Box>
      
      {/* Interactive Map with Pan and Zoom */}
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={3}
        initialPositionX={0}
        initialPositionY={0}
        centerZoomedOut={true}
        centerOnInit={true}
        wheel={{ step: 0.1 }}
      >
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
            ref={svgRef}
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
            <svg 
              width="100%" 
              height="100%" 
              style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                pointerEvents: 'none',
                zIndex: 5
              }}
            >
              <g style={{ pointerEvents: 'all' }}>
                {renderRoomOverlays()}
              </g>
            </svg>
          </Box>
        </TransformComponent>
      </TransformWrapper>
    </Paper>
  );
};

export default InteractiveFloorMap;
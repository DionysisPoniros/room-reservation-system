// src/components/rooms/UpdatedInteractiveFloorMap.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Chip,
  useTheme
} from '@mui/material';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

// Import our custom RoomOverlay component
import RoomOverlay from './RoomOverlay';

// Import room overlay data
import { roomOverlays } from '../../data/roomOverlays';

// Icons
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';

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

/**
 * Updated Interactive Floor Map Component
 * Displays SVG floor plans with room overlays
 */
const UpdatedInteractiveFloorMap = ({ 
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
  const [svgLoaded, setSvgLoaded] = useState(false);
  
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
        
        // Add a small delay to ensure DOM is ready before setting content
        setTimeout(() => {
          if (isMounted) {
            setSvgContent(svgText);
            setLoading(false);
            
            // Add another small delay before declaring SVG as loaded
            // This helps prevent react-zoom-pan-pinch from calculating bounds too early
            setTimeout(() => {
              if (isMounted) {
                setSvgLoaded(true);
              }
            }, 100);
          }
        }, 10);
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
  const handleRoomClick = useCallback((roomData) => {
    if (!roomData) return;
    
    setSelectedRoom(roomData);
    
    // Notify parent component
    if (onRoomSelect) {
      onRoomSelect(roomData.id || roomData.name);
    }
  }, [onRoomSelect]);
  
  // Get room overlays for the current building and floor
  const getRoomOverlays = useCallback(() => {
    // Check if we have overlay data for this building and floor
    if (!roomOverlays[building] || !roomOverlays[building][floor]) {
      console.log(`No room overlays found for ${building}, ${floor}`);
      return [];
    }
    
    const overlays = roomOverlays[building][floor];
    const result = [];
    
    // Convert overlays object to array with room data
    Object.keys(overlays).forEach(roomId => {
      const overlay = overlays[roomId];
      
      // Find room data from the rooms prop
      const roomData = rooms.find(r => r.id === roomId || r.name === roomId);
      
      result.push({
        id: roomId,
        name: roomId,
        ...overlay,
        roomData: roomData || { name: roomId }
      });
    });
    
    return result;
  }, [building, floor, rooms]);
  
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
  
  // Get room overlays
  const roomOverlayData = getRoomOverlays();
  
  return (
    <Box sx={{ position: 'relative', height: 600, overflow: 'hidden', border: '1px solid #e0e0e0', borderRadius: 1 }}>
      {svgLoaded ? (
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
                  {roomOverlayData.map((overlay) => (
                    <RoomOverlay
                      key={overlay.id}
                      room={overlay.roomData}
                      x={overlay.x}
                      y={overlay.y}
                      width={overlay.width}
                      height={overlay.height}
                      label={overlay.label || overlay.name || overlay.id}
                      isOccupied={isRoomOccupied(overlay.id)}
                      onClick={() => handleRoomClick(overlay.roomData)}
                    />
                  ))}
                </Box>
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      ) : (
        <Box 
          sx={{ 
            width: '100%', 
            height: '100%', 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: '#f5f5f5',
          }}
        >
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography>Preparing interactive map...</Typography>
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
      
      {/* Room Count */}
      {roomOverlayData.length > 0 && (
        <Box sx={{ 
          position: 'absolute', 
          top: 10, 
          left: 10, 
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          bgcolor: 'rgba(255, 255, 255, 0.7)',
          p: 1,
          borderRadius: 1,
          boxShadow: 1
        }}>
          <Typography variant="body2">
            {roomOverlayData.length} rooms mapped
          </Typography>
        </Box>
      )}
      
      {/* When no rooms are mapped yet */}
      {roomOverlayData.length === 0 && !loading && !error && (
        <Box sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          zIndex: 5,
          bgcolor: 'rgba(255, 255, 255, 0.8)',
          p: 2,
          borderRadius: 1,
          boxShadow: 1,
          textAlign: 'center'
        }}>
          <Typography variant="subtitle1" gutterBottom>
            No room data available for this floor
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Use the Room Mapping Tool to add rooms to this floor plan
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default UpdatedInteractiveFloorMap;
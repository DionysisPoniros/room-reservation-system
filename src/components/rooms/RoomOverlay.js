// src/components/rooms/RoomOverlay.js
import React, { useState } from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';

/**
 * RoomOverlay Component
 * Renders an interactive overlay for a room on the floor plan
 * 
 * @param {Object} props
 * @param {Object} props.room - Room data object
 * @param {number} props.x - X coordinate on SVG
 * @param {number} props.y - Y coordinate on SVG
 * @param {number} props.width - Width of room on SVG
 * @param {number} props.height - Height of room on SVG
 * @param {string} props.label - Room label to display
 * @param {boolean} props.isOccupied - Whether room is currently occupied
 * @param {function} props.onClick - Click handler for room selection
 */
const RoomOverlay = ({ 
  room, 
  x, 
  y, 
  width, 
  height, 
  label, 
  isOccupied = false, 
  onClick 
}) => {
  const theme = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  
  // Determine colors based on room state
  const baseColor = isOccupied 
    ? 'rgba(244, 67, 54, 0.5)' // Red for occupied
    : 'rgba(76, 175, 80, 0.5)'; // Green for available
    
  const hoverColor = isOccupied 
    ? 'rgba(244, 67, 54, 0.7)' 
    : 'rgba(76, 175, 80, 0.7)';
    
  const borderColor = isOccupied 
    ? theme.palette.error.main 
    : theme.palette.success.main;
    
  // Apply visual effects based on state
  const boxStyles = {
    position: 'absolute',
    left: x,
    top: y,
    width: width,
    height: height,
    backgroundColor: isHovered ? hoverColor : baseColor,
    border: `2px solid ${borderColor}`,
    borderRadius: '3px',
    transition: 'all 0.2s ease-in-out',
    cursor: 'pointer',
    zIndex: isHovered ? 100 : 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: isHovered ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    }
  };
  
  // Only show label for larger rooms
  const showLabel = width > 50 && height > 25;
  
  const handleClick = () => {
    if (onClick && room) {
      onClick(room.id || room.name);
    }
  };
  
  const tooltipTitle = () => {
    if (!room) return label || 'Unknown Room';
    
    return (
      <Box sx={{ p: 1 }}>
        <Typography variant="subtitle2">{room.name || label}</Typography>
        <Typography variant="body2">{room.type || 'Room'}</Typography>
        <Typography variant="body2">Capacity: {room.capacity || 'Unknown'}</Typography>
        <Typography variant="body2" color={isOccupied ? "error.main" : "success.main"} fontWeight="bold">
          Status: {isOccupied ? 'Occupied' : 'Available'}
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
          Click for details
        </Typography>
      </Box>
    );
  };
  
  return (
    <Tooltip
      title={tooltipTitle()}
      placement="top"
      arrow
      enterDelay={300}
      leaveDelay={100}
    >
      <Box
        sx={boxStyles}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {showLabel && (
          <Typography
            variant="caption"
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.85)',
              p: 0.5,
              borderRadius: 1,
              fontWeight: 500,
              fontSize: '0.7rem',
              pointerEvents: 'none',
              maxWidth: '90%',
              textAlign: 'center',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
              border: `1px solid ${isOccupied ? theme.palette.error.light : theme.palette.success.light}`
            }}
          >
            {label}
          </Typography>
        )}
      </Box>
    </Tooltip>
  );
};

export default RoomOverlay;
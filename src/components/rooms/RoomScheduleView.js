// src/components/rooms/RoomScheduleView.js
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Chip,
  Grid,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Alert
} from '@mui/material';
import { Link } from 'react-router-dom';
import { format, addDays, isSameDay, parseISO, addHours, isWithinInterval } from 'date-fns';

// Icons
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import PeopleIcon from '@mui/icons-material/People';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import InfoIcon from '@mui/icons-material/Info';
import ComputerIcon from '@mui/icons-material/Computer';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';

function RoomScheduleView({ rooms, reservations, date, onDateChange, loading = false }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  // Time slots to display (7:00 AM - 11:00 PM)
  const [timeSlots, setTimeSlots] = useState([]);
  
  // Selected date (default to today)
  const [selectedDate, setSelectedDate] = useState(date || new Date());
  
  // Error state
  const [error, setError] = useState(null);
  
  // Set default values if props are undefined
  const safeRooms = rooms || [];
  const safeReservations = reservations || {};
  
  useEffect(() => {
    try {
      // Generate time slots
      const slots = [];
      const startHour = 7;  // 7:00 AM
      const endHour = 23;  // 11:00 PM
      
      const dateToUse = selectedDate || new Date();
      
      for (let hour = startHour; hour <= endHour; hour++) {
        const slotDate = new Date(dateToUse);
        slotDate.setHours(hour, 0, 0, 0);
        slots.push(slotDate.getTime());
      }
      
      setTimeSlots(slots);
      setError(null);
    } catch (err) {
      console.error("Error generating time slots:", err);
      setError("Could not generate schedule. Please try again.");
    }
  }, [selectedDate]);
  
  useEffect(() => {
    if (date && !isSameDay(date, selectedDate)) {
      setSelectedDate(date);
    }
  }, [date, selectedDate]);
  
  // Handle date change and propagate to parent
  const handleDateChange = (newDate) => {
    try {
      setSelectedDate(newDate);
      if (onDateChange) {
        onDateChange(newDate);
      }
      setError(null);
    } catch (err) {
      console.error("Error changing date:", err);
      setError("Could not change date. Please try again.");
    }
  };
  
  // Navigate to previous day
  const goToPrevDay = () => {
    const prevDay = addDays(selectedDate, -1);
    handleDateChange(prevDay);
  };
  
  // Navigate to next day
  const goToNextDay = () => {
    const nextDay = addDays(selectedDate, 1);
    handleDateChange(nextDay);
  };
  
// Fixed isRoomBooked function for more intuitive time slot display
// In src/components/rooms/RoomScheduleView.js

// Modify the isRoomBooked function to properly check time slot availability
const isRoomBooked = (roomId, timeSlot) => {
    try {
      if (!safeReservations || !safeReservations[roomId]) return false;
      
      const slotStart = new Date(timeSlot);
      const slotEnd = addHours(new Date(timeSlot), 1);
      
      return safeReservations[roomId].some(reservation => {
        if (!reservation.startTime || !reservation.endTime) return false;
        
        try {
          const resStart = new Date(reservation.startTime.seconds * 1000);
          const resEnd = new Date(reservation.endTime.seconds * 1000);
          
          // Check if reservation overlaps with this time slot
          return (
            // Either the reservation starts during this hour slot
            (resStart >= slotStart && resStart < slotEnd) ||
            // Or the hour slot falls entirely within the reservation period
            (resStart <= slotStart && resEnd >= slotEnd)
          );
        } catch (reservationTimeError) {
          console.error("Error with reservation time:", reservationTimeError);
          return false;
        }
      });
    } catch (err) {
      console.error("Error checking if room is booked:", err, { roomId, timeSlot });
      return false;
    }
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
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 3, flexDirection: 'column', alignItems: 'center' }}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography>Loading room schedule...</Typography>
      </Box>
    );
  }
  
  if (error) {
    console.warn("Error in RoomScheduleView:", error);
    // Don't show the error directly here
    // Just log it to console to avoid duplicate error messages
  }
  
  if (!safeRooms || safeRooms.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6">No rooms available for scheduling</Typography>
      </Paper>
    );
  }
  
  return (
    <Paper sx={{ p: 2, overflowX: 'auto', width: '100%', maxWidth: '100%' }}>
      {/* Date navigation */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <IconButton onClick={goToPrevDay}>
          <KeyboardArrowLeftIcon />
        </IconButton>
        
        <Typography variant="h6" component="h2">
          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </Typography>
        
        <IconButton onClick={goToNextDay}>
          <KeyboardArrowRightIcon />
        </IconButton>
      </Box>
      
      {/* Schedule Table - Updated with larger sizing */}
      <TableContainer 
        component={Paper} 
        sx={{ 
          maxHeight: 'calc(100vh - 250px)', // Larger height to show more rooms
          border: '1px solid #e0e0e0',
          width: '100%',
          maxWidth: '100%'
        }}
      >
        <Table stickyHeader size={isMobile ? "small" : "medium"} sx={{ width: '100%' }}>
          <TableHead>
            <TableRow>
              <TableCell 
                sx={{ 
                  width: isTablet ? 100 : 180, // Slightly smaller to allow more horizontal space
                  borderRight: '1px solid #e0e0e0',
                  fontWeight: 'bold',
                  bgcolor: theme.palette.primary.main,
                  color: 'white',
                  position: 'sticky',
                  left: 0,
                  zIndex: 3
                }}
              >
                Room
              </TableCell>
              
              {timeSlots.map((timeSlot) => (
                <TableCell 
                  key={timeSlot} 
                  align="center"
                  sx={{ 
                    minWidth: isMobile ? 40 : 58, // Slightly smaller cells
                    width: isMobile ? 40 : 58,
                    fontWeight: 'bold',
                    bgcolor: theme.palette.primary.main,
                    color: 'white',
                    p: isMobile ? 0.5 : 1 // Smaller padding
                  }}
                >
                  {format(timeSlot, 'h a')}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          
          <TableBody>
            {safeRooms.map((room) => (
              <TableRow key={room.id} hover>
                <TableCell 
                  component="th" 
                  scope="row"
                  sx={{ 
                    borderRight: '1px solid #e0e0e0',
                    position: 'sticky',
                    left: 0,
                    bgcolor: 'background.paper',
                    zIndex: 1,
                    p: 1 // Reduced padding
                  }}
                >
                  <Box sx={{ mb: 0.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {room.name}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.25 }}>
                      <LocationOnIcon fontSize="small" sx={{ mr: 0.25, color: 'text.secondary', fontSize: '0.8rem' }} />
                      <Typography variant="body2" color="text.secondary" noWrap sx={{ fontSize: '0.8rem' }}>
                        {room.location || 'No location'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.25 }}>
                      <PeopleIcon fontSize="small" sx={{ mr: 0.25, color: 'text.secondary', fontSize: '0.8rem' }} />
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                        {room.capacity} {room.capacity === 1 ? 'person' : 'people'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.25 }}>
                      {getEquipmentIcons(room.equipment)}
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', mt: 0.5 }}>
                    <Button 
                      variant="outlined" 
                      size="small" 
                      component={Link} 
                      to={`/rooms/${room.id}`}
                      sx={{ mr: 0.5, fontSize: '0.7rem', py: 0.25, minWidth: 'unset', px: 1 }}
                    >
                      Details
                    </Button>
                    <Button 
                      variant="contained" 
                      size="small" 
                      component={Link} 
                      to={`/rooms/${room.id}/book`}
                      sx={{ fontSize: '0.7rem', py: 0.25, minWidth: 'unset', px: 1 }}
                    >
                      Book
                    </Button>
                  </Box>
                </TableCell>
                
                {timeSlots.map((timeSlot) => {
                  const isBooked = isRoomBooked(room.id, timeSlot);
                  
                  return (
                    <TableCell 
                      key={`${room.id}-${timeSlot}`} 
                      align="center"
                      sx={{ 
                        bgcolor: isBooked ? 'rgba(244, 67, 54, 0.1)' : 'rgba(76, 175, 80, 0.1)',
                        borderRight: '1px solid #f0f0f0',
                        p: 0.75 // Reduced padding for more compact view
                      }}
                    >
                      {isBooked ? (
                        <Chip 
                          label="Booked" 
                          size="small" 
                          color="error"
                          sx={{ 
                            height: 20, 
                            fontSize: '0.65rem' // Smaller text
                          }} 
                        />
                      ) : (
                        <Button 
                          variant="outlined"
                          size="small"
                          color="success"
                          component={Link}
                          to={`/rooms/${room.id}/book?time=${encodeURIComponent(new Date(timeSlot).toISOString())}`}
                          sx={{ 
                            height: 20, 
                            fontSize: '0.65rem',
                            minWidth: 'auto',
                            p: '2px 8px' // Smaller padding
                          }}
                        >
                          Available
                        </Button>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Legend */}
      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ width: 16, height: 16, bgcolor: 'rgba(76, 175, 80, 0.1)', border: '1px solid #ccc', mr: 1 }}></Box>
          <Typography variant="body2">Available</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ width: 16, height: 16, bgcolor: 'rgba(244, 67, 54, 0.1)', border: '1px solid #ccc', mr: 1 }}></Box>
          <Typography variant="body2">Booked</Typography>
        </Box>
      </Box>
    </Paper>
  );
}

export default RoomScheduleView;
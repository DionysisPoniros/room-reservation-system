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
  CircularProgress
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
  
  // Time slots to display (8:00 AM - 11:00 PM)
  const [timeSlots, setTimeSlots] = useState([]);
  
  // Selected date (default to today)
  const [selectedDate, setSelectedDate] = useState(date || new Date());
  
  useEffect(() => {
    // Generate time slots
    const slots = [];
    const startHour = 7;  // 7:00 AM
    const endHour = 23;  // 11:00 PM
    
    for (let hour = startHour; hour <= endHour; hour++) {
      slots.push(
        new Date(selectedDate).setHours(hour, 0, 0, 0)
      );
    }
    
    setTimeSlots(slots);
  }, [selectedDate]);
  
  useEffect(() => {
    if (date && !isSameDay(date, selectedDate)) {
      setSelectedDate(date);
    }
  }, [date]);
  
  // Handle date change and propagate to parent
  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    if (onDateChange) {
      onDateChange(newDate);
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
  
  // Function to determine if a room is booked during a time slot
  const isRoomBooked = (roomId, timeSlot) => {
    if (!reservations || !reservations[roomId]) return false;
    
    const slotStart = new Date(timeSlot);
    const slotEnd = addHours(new Date(timeSlot), 1);
    
    return reservations[roomId].some(reservation => {
      const resStart = new Date(reservation.startTime.seconds * 1000);
      const resEnd = new Date(reservation.endTime.seconds * 1000);
      
      return isWithinInterval(slotStart, { start: resStart, end: resEnd }) ||
             isWithinInterval(slotEnd, { start: resStart, end: resEnd }) ||
             (slotStart <= resStart && slotEnd >= resEnd);
    });
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
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Paper sx={{ p: 2, overflowX: 'auto' }}>
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
      
      {/* Schedule Table */}
      <TableContainer component={Paper} sx={{ maxHeight: 600, border: '1px solid #e0e0e0' }}>
        <Table stickyHeader size={isMobile ? "small" : "medium"}>
          <TableHead>
            <TableRow>
              <TableCell 
                sx={{ 
                  width: isTablet ? 120 : 200, 
                  borderRight: '1px solid #e0e0e0',
                  fontWeight: 'bold',
                  bgcolor: theme.palette.primary.main,
                  color: 'white'
                }}
              >
                Room
              </TableCell>
              
              {timeSlots.map((timeSlot) => (
                <TableCell 
                  key={timeSlot} 
                  align="center"
                  sx={{ 
                    minWidth: isMobile ? 40 : 60,
                    fontWeight: 'bold',
                    bgcolor: theme.palette.primary.main,
                    color: 'white'
                  }}
                >
                  {format(timeSlot, 'h a')}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          
          <TableBody>
            {rooms.map((room) => (
              <TableRow key={room.id} hover>
                <TableCell 
                  component="th" 
                  scope="row"
                  sx={{ 
                    borderRight: '1px solid #e0e0e0',
                    position: 'sticky',
                    left: 0,
                    bgcolor: 'background.paper',
                    zIndex: 1
                  }}
                >
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {room.name}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                      <LocationOnIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {room.location || 'No location'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                      <PeopleIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {room.capacity} {room.capacity === 1 ? 'person' : 'people'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                      {getEquipmentIcons(room.equipment)}
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', mt: 1 }}>
                    <Button 
                      variant="outlined" 
                      size="small" 
                      component={Link} 
                      to={`/rooms/${room.id}`}
                      sx={{ mr: 1, fontSize: '0.75rem', py: 0.5 }}
                    >
                      Details
                    </Button>
                    <Button 
                      variant="contained" 
                      size="small" 
                      component={Link} 
                      to={`/rooms/${room.id}/book`}
                      sx={{ fontSize: '0.75rem', py: 0.5 }}
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
                        p: 1
                      }}
                    >
                      {isBooked ? (
                        <Chip 
                          label="Booked" 
                          size="small" 
                          color="error"
                          sx={{ 
                            height: 24, 
                            fontSize: '0.7rem'
                          }} 
                        />
                      ) : (
                        <Button 
                          variant="outlined"
                          size="small"
                          color="success"
                          component={Link}
                          to={`/rooms/${room.id}/book`}
                          sx={{ 
                            height: 24, 
                            fontSize: '0.7rem',
                            minWidth: 'auto'
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
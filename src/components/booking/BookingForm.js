import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  TextField, 
  Button, 
  Paper, 
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Slider,
  InputAdornment
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAuth } from '../../contexts/AuthContext';
import { getRoom, createReservation, checkRoomAvailability, getUserDailyBookings } from '../../services/roomService';
import { addHours, setMinutes, setSeconds, setMilliseconds, format } from 'date-fns';

function BookingForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  
  const [room, setRoom] = useState(null);
  const [startTime, setStartTime] = useState(roundToHour(new Date()));
  const [duration, setDuration] = useState(1); // In hours
  const [endTime, setEndTime] = useState(addHours(roundToHour(new Date()), 1));
  const [purpose, setPurpose] = useState('');
  const [attendees, setAttendees] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [dailyBookingHours, setDailyBookingHours] = useState(0);
  const [hoursRemaining, setHoursRemaining] = useState(5);
  
  // Function to round time to the nearest hour
  function roundToHour(date) {
    return setMilliseconds(setSeconds(setMinutes(new Date(date), 0), 0), 0);
  }

  // Parse time from URL if provided
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const timeParam = params.get('time');
    
    if (timeParam) {
      try {
        const parsedTime = new Date(timeParam);
        setStartTime(roundToHour(parsedTime));
        setEndTime(addHours(roundToHour(parsedTime), 1));
      } catch (err) {
        console.error("Error parsing time parameter:", err);
      }
    }
  }, [location]);
  
  useEffect(() => {
    const fetchRoomAndUserData = async () => {
      try {
        setLoading(true);
        
        // Fetch room data
        const roomData = await getRoom(id);
        if (roomData) {
          setRoom(roomData);
        } else {
          setError("Room not found");
        }
        
        // Fetch user's daily bookings if user is logged in
        if (currentUser) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          const bookings = await getUserDailyBookings(currentUser.uid, today, tomorrow);
          
          // Calculate total hours booked today
          let totalHours = 0;
          bookings.forEach(booking => {
            const start = booking.startTime.toDate();
            const end = booking.endTime.toDate();
            const durationHours = (end - start) / (1000 * 60 * 60);
            totalHours += durationHours;
          });
          
          setDailyBookingHours(totalHours);
          setHoursRemaining(5 - totalHours);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please try again.");
        setLoading(false);
      }
    };

    fetchRoomAndUserData();
  }, [id, currentUser]);

  // Update end time when start time or duration changes
  useEffect(() => {
    const newEndTime = addHours(startTime, duration);
    setEndTime(newEndTime);
  }, [startTime, duration]);

  const handleDurationChange = (event, newValue) => {
    // Make sure we don't exceed the remaining hours
    const maxAllowedDuration = Math.min(5, hoursRemaining);
    const actualDuration = Math.min(newValue, maxAllowedDuration);
    setDuration(actualDuration);
  };

  const handleStartTimeChange = (newTime) => {
    // Round to the nearest hour
    const roundedTime = roundToHour(newTime);
    setStartTime(roundedTime);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError("You must be logged in to book a room");
      return;
    }
    
    // Check if user has exceeded daily limit
    if (dailyBookingHours + duration > 5) {
      setError(`You can only book up to 5 hours per day. You already have ${dailyBookingHours.toFixed(1)} hours booked.`);
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Check if room is available for the selected time period
      const isAvailable = await checkRoomAvailability(id, startTime, endTime);
      
      if (!isAvailable) {
        setError("This room is not available for the selected time period");
        setSubmitting(false);
        return;
      }
      
      // Create reservation
      await createReservation({
        roomId: id,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        startTime: startTime,
        endTime: endTime,
        purpose: purpose,
        attendees: attendees,
        status: 'confirmed'
      });
      
      setSuccess(true);
      // Reset form
      setPurpose('');
      setAttendees(1);
      
      // Redirect to user reservations after a delay
      setTimeout(() => {
        navigate('/my-reservations');
      }, 2000);
      
    } catch (err) {
      console.error("Error creating reservation:", err);
      setError("Failed to create reservation. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSuccess(false);
  };

  if (loading) return <Typography>Loading room details...</Typography>;
  if (error && !room) return <Typography color="error">{error}</Typography>;
  if (!room) return <Typography>Room not found</Typography>;

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Book {room.name}
        </Typography>
        
        <Paper sx={{ p: 3 }}>
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6">Room Details</Typography>
                <Typography>Location: {room.location}</Typography>
                <Typography>Capacity: {room.capacity} people</Typography>
                <Typography>Type: {room.type}</Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateTimePicker
                    label="Start Time"
                    value={startTime}
                    onChange={handleStartTimeChange}
                    renderInput={(params) => <TextField {...params} fullWidth required />}
                    minDateTime={new Date()}
                    views={['year', 'month', 'day', 'hours']}
                    ampm={true}
                    minutesStep={60}
                    helperText="Time will be rounded to the nearest hour"
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box>
                  <Typography id="duration-slider" gutterBottom>
                    Duration: {duration} {duration === 1 ? 'hour' : 'hours'}
                  </Typography>
                  <Typography variant="caption" color="textSecondary" gutterBottom sx={{ display: 'block' }}>
                    You have {hoursRemaining.toFixed(1)} hours remaining today (5 hour daily limit)
                  </Typography>
                  <Slider
                    value={duration}
                    onChange={handleDurationChange}
                    aria-labelledby="duration-slider"
                    valueLabelDisplay="auto"
                    step={1}
                    marks
                    min={1}
                    max={5}
                    disabled={hoursRemaining < 1}
                  />
                </Box>
                <Typography variant="body2" color="textSecondary">
                  End time: {format(endTime, 'h:mm a EEEE, MMMM d, yyyy')}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Purpose of Reservation"
                  fullWidth
                  required
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Number of Attendees</InputLabel>
                  <Select
                    value={attendees}
                    label="Number of Attendees"
                    onChange={(e) => setAttendees(e.target.value)}
                  >
                    {[...Array(room.capacity)].map((_, i) => (
                      <MenuItem key={i + 1} value={i + 1}>{i + 1}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {dailyBookingHours > 0 && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    You have already booked {dailyBookingHours.toFixed(1)} hours today. Daily limit is 5 hours.
                  </Alert>
                </Grid>
              )}
              
              {error && (
                <Grid item xs={12}>
                  <Alert severity="error">{error}</Alert>
                </Grid>
              )}
              
              <Grid item xs={12}>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                  disabled={submitting || hoursRemaining < 1}
                  fullWidth
                >
                  {submitting ? 'Processing...' : 'Confirm Booking'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>
      
      <Snackbar open={success} autoHideDuration={6000} onClose={handleClose}>
        <Alert onClose={handleClose} severity="success" sx={{ width: '100%' }}>
          Reservation created successfully!
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default BookingForm;
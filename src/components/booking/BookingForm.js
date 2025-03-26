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
  InputAdornment,
  CircularProgress,
  Tooltip,
  LinearProgress,
  useTheme,
  Chip  
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAuth } from '../../contexts/AuthContext';

import { addHours, setMinutes, setSeconds, setMilliseconds, format } from 'date-fns';
import { 
  getRoom, 
  createReservation, 
  checkRoomAvailability, 
  getUserDailyBookings 
} from '../../services/roomService';

// Icons - you can add these if you want to enhance the UI further
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

function BookingForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const theme = useTheme();
  
  // Room and booking details
  const [room, setRoom] = useState(null);
  const [startTime, setStartTime] = useState(roundToHour(new Date()));
  const [duration, setDuration] = useState(1); // In hours
  const [endTime, setEndTime] = useState(addHours(roundToHour(new Date()), 1));
  const [purpose, setPurpose] = useState('');
  const [attendees, setAttendees] = useState(1);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Daily booking tracking
  const [dailyBookingHours, setDailyBookingHours] = useState(0);
  const [hoursRemaining, setHoursRemaining] = useState(5);
  const [todayBookings, setTodayBookings] = useState([]);
  const [dailyLimit, setDailyLimit] = useState(5); // Add this state for custom limit
  
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
        if (!isNaN(parsedTime.getTime())) {
          setStartTime(roundToHour(parsedTime));
          setEndTime(addHours(roundToHour(parsedTime), 1));
        }
      } catch (err) {
        console.error("Error parsing time parameter:", err);
      }
    }
  }, [location]);
  
  // Fetch room details and user's daily bookings
// Fetch room details and user's daily bookings
  useEffect(() => {
    const fetchRoomAndUserData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Create today and tomorrow date objects first
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        
        const tomorrowDate = new Date(todayDate);
        tomorrowDate.setDate(tomorrowDate.getDate() + 1);
        
        // Fetch room data
        const roomData = await getRoom(id);
        if (roomData) {
          setRoom(roomData);
        } else {
          setError("Room not found");
          setLoading(false);
          return;
        }
        
        // Fetch user's daily bookings if user is logged in
        if (currentUser) {
          try {
            const result = await getUserDailyBookings(currentUser.uid, todayDate, tomorrowDate);
            
            const customDailyLimit = result.dailyLimit || 5;
            setDailyLimit(customDailyLimit); // Store the custom limit in state
            
            // Set daily booking info
            setTodayBookings(result.bookings || []);
            setDailyBookingHours(result.totalHoursBooked || 0);
            
            // Check against custom limit
            if (duration > customDailyLimit) {
              setError(`You can only book up to ${customDailyLimit} hours per day.`);
              setLoading(false);
              return;
            }
            
            // Calculate remaining hours, ensuring it's not negative
            const remaining = Math.max(0, customDailyLimit - result.totalHoursBooked);
            setHoursRemaining(remaining);
            
            // If the current selected duration is greater than remaining hours,
            // adjust it to the maximum available (but keep at least 1)
            if (duration > remaining && remaining > 0) {
              setDuration(Math.floor(remaining)); // Floor to get a whole number
            } else if (remaining <= 0) {
              setDuration(1); // Keep at minimum 1 hour but disable booking
            }
            
            console.log(`User has booked ${result.totalHoursBooked.toFixed(1)} hours today, ${remaining.toFixed(1)} hours remaining.`);
          } catch (bookingError) {
            console.error("Error fetching user's daily bookings:", bookingError);
            // Don't set an error for this, just log it, as it's not critical
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please try again.");
        setLoading(false);
      }
    };

  fetchRoomAndUserData();
}, [id, currentUser, duration]);

  // Update end time when start time or duration changes
  useEffect(() => {
    const newEndTime = addHours(startTime, duration);
    setEndTime(newEndTime);
  }, [startTime, duration]);

  // Handle duration slider change
  const handleDurationChange = (event, newValue) => {
    try {
      // Make sure we don't exceed the remaining hours
      const maxAllowedDuration = Math.min(5, Math.floor(hoursRemaining));
      
      // Don't allow setting duration to 0
      const actualDuration = Math.min(newValue, maxAllowedDuration);
      
      // If there's less than 1 hour remaining, keep the minimum at 1
      // This prevents setting a duration of 0 if the user has just under 1 hour left
      const finalDuration = (maxAllowedDuration >= 1) ? Math.max(1, actualDuration) : 1;
      
      console.log(`Setting duration to ${finalDuration} (requested: ${newValue}, max allowed: ${maxAllowedDuration})`);
      setDuration(finalDuration);
    } catch (err) {
      console.error("Error updating duration:", err);
    }
  };

  // Handle start time changes
  const handleStartTimeChange = (newTime) => {
    try {
      if (!newTime || isNaN(newTime.getTime())) {
        console.error("Invalid date provided to handleStartTimeChange");
        return;
      }
      
      // Round to the nearest hour
      const roundedTime = roundToHour(newTime);
      setStartTime(roundedTime);
    } catch (err) {
      console.error("Error updating start time:", err);
    }
  };

  // Daily Booking Display Component
  const DailyBookingDisplay = () => {
    // Calculate percentage of daily limit used
    const percentUsed = (dailyBookingHours / dailyLimit) * 100;
    
    return (
      <Box sx={{ mt: 1, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Daily Booking Limit ({dailyLimit} hours)
          {dailyLimit > 5 && (
            <Chip 
              label="Extended" 
              size="small" 
              color="success" 
              variant="outlined"
              sx={{ ml: 1, height: 20 }}
            />
          )}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Tooltip title={`${dailyBookingHours.toFixed(1)} hours used out of ${dailyLimit} hour daily limit`}>
            <Box sx={{ flexGrow: 1, mr: 1 }}>
              <LinearProgress 
                variant="determinate" 
                value={Math.min(percentUsed, 100)} 
                color={percentUsed > 80 ? "error" : "primary"}
                sx={{ height: 8, borderRadius: 4 }} 
              />
            </Box>
          </Tooltip>
          <Typography variant="body2" color="textSecondary">
            {dailyBookingHours.toFixed(1)}/{dailyLimit} hrs
          </Typography>
        </Box>
        
        <Typography 
          variant="body2" 
          color={hoursRemaining < 1 ? "error.main" : "textSecondary"}
          sx={{ fontWeight: hoursRemaining < 1 ? 'bold' : 'normal' }}
        >
          {hoursRemaining < 1 
            ? "You've reached your daily booking limit. Need more? Request additional hours." 
            : `You can book ${hoursRemaining.toFixed(1)} more hours today`}
        </Typography>
        
        {/* Rest of your existing component... */}
      </Box>
    );
  };
  

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError("You must be logged in to book a room");
      return;
    }
    
    // Basic validation
    if (!purpose.trim()) {
      setError("Please provide a purpose for your reservation");
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Define date variables here so they're in scope
      const currentDate = new Date();
      const todayDate = new Date(currentDate);
      todayDate.setHours(0, 0, 0, 0);
      
      const tomorrowDate = new Date(todayDate);
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);
      
      // Get user's daily bookings with custom allowance
      const userDailyData = await getUserDailyBookings(currentUser.uid, todayDate, tomorrowDate);
      const customDailyLimit = userDailyData.dailyLimit || 5;
      const currentDailyUsage = userDailyData.totalHoursBooked || 0;
      
      // Check if user has exceeded their daily limit (custom or default)
      if (currentDailyUsage + duration > customDailyLimit) {
        setError(`You can only book up to ${customDailyLimit} hours per day. You already have ${currentDailyUsage.toFixed(1)} hours booked.`);
        setSubmitting(false);
        return;
      }
      
      // Proceed with room availability check
      console.log("Checking room availability...");
      
      // Check if room is available for the selected time period
      const isAvailable = await checkRoomAvailability(id, startTime, endTime);
      
      if (!isAvailable) {
        setError("This room is not available for the selected time period");
        setSubmitting(false);
        return;
      }
  
      // Continue with the rest of your existing code...
      
      console.log("Room is available, creating reservation...");
      
      // Create reservation with a cleaner structure
      const reservationData = {
        roomId: id,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        startTime: startTime,
        endTime: endTime,
        purpose: purpose.trim(),
        attendees: attendees,
        status: 'confirmed',
        durationHours: duration, // Add duration for easier tracking
        createdAt: new Date()
      };
      
      // Create the reservation
      const docRef = await createReservation(reservationData);
      console.log("Reservation created successfully with ID:", docRef.id);
      
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
      const errorMessage = err.message || "Failed to create reservation. Please try again.";
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle snackbar close
  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSuccess(false);
  };

  // Main render
  if (loading) return (
    <Container maxWidth="md">
      <Box sx={{ my: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography>Loading room details...</Typography>
      </Box>
    </Container>
  );
  
  if (error && !room) return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button 
          variant="outlined" 
          sx={{ mt: 2 }}
          onClick={() => navigate('/rooms')}
        >
          Back to Rooms
        </Button>
      </Box>
    </Container>
  );
  
  if (!room) return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Alert severity="error">Room not found</Alert>
        <Button 
          variant="outlined" 
          sx={{ mt: 2 }}
          onClick={() => navigate('/rooms')}
        >
          Back to Rooms
        </Button>
      </Box>
    </Container>
  );

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Book {room.name}
        </Typography>
        
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Room Details Section */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 1 }}>Room Details</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography><strong>Location:</strong> {room.location}</Typography>
                  <Typography><strong>Capacity:</strong> {room.capacity} {room.capacity === 1 ? 'person' : 'people'}</Typography>
                  <Typography><strong>Type:</strong> {room.type}</Typography>
                </Box>
              </Grid>
              
              {/* Daily Booking Quota Section */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2, mb: 2, bgcolor: '#f8f9fa' }}>
                  <Typography variant="h6" gutterBottom>
                    Your Daily Booking Quota
                  </Typography>
                  
                  {/* Display the daily booking progress */}
                  <DailyBookingDisplay />
                  
                  {dailyBookingHours >= 5 && (
                    <Alert severity="warning" sx={{ mt: 1 }}>
                      You've reached your daily booking limit of {dailyLimit}  hours. You cannot make any more bookings today.
                    </Alert>
                  )}
                </Paper>
              </Grid>
              
              {/* Start Time Picker */}
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
                    disabled={dailyBookingHours >= 5}
                  />
                </LocalizationProvider>
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                  Time will be rounded to the nearest hour
                </Typography>
              </Grid>
              
              {/* Duration Slider */}
              <Grid item xs={12} md={6}>
                <Box>
                  <Typography id="duration-slider" gutterBottom>
                    Duration: {duration} {duration === 1 ? 'hour' : 'hours'}
                  </Typography>
                  <Slider
                    value={duration}
                    onChange={handleDurationChange}
                    aria-labelledby="duration-slider"
                    valueLabelDisplay="auto"
                    step={1}
                    marks
                    min={1}
                    max={hoursRemaining < 1 ? 1 : Math.min(5, Math.ceil(hoursRemaining))}
                    disabled={dailyBookingHours >= 5}
                    sx={{
                      '& .MuiSlider-markLabel': {
                        fontSize: '0.75rem',
                      },
                      '& .MuiSlider-valueLabel': {
                        backgroundColor: theme.palette.primary.main,
                      }
                    }}
                  />
                </Box>
                <Typography variant="body2" color="textSecondary">
                  End time: {format(endTime, 'h:mm a EEEE, MMMM d, yyyy')}
                </Typography>
                
                {/* Add explanation about daily limit */}
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                  A user can book up to 5 hours total per day across all rooms.
                </Typography>
              </Grid>
              
              {/* Booking Purpose */}
              <Grid item xs={12}>
                <TextField
                  label="Purpose of Reservation"
                  fullWidth
                  required
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  disabled={dailyBookingHours >= 5}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <InfoOutlinedIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                  placeholder="E.g., Team meeting, Study group, Presentation preparation"
                />
              </Grid>
              
              {/* Number of Attendees */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="attendees-label">Number of Attendees</InputLabel>
                  <Select
                    labelId="attendees-label"
                    value={attendees}
                    label="Number of Attendees"
                    onChange={(e) => setAttendees(e.target.value)}
                    disabled={dailyBookingHours >= 5}
                  >
                    {[...Array(room.capacity)].map((_, i) => (
                      <MenuItem key={i + 1} value={i + 1}>{i + 1}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Error Message Display */}
              {error && (
                <Grid item xs={12}>
                  <Alert severity="error" onClose={() => setError(null)}>
                    {error}
                  </Alert>
                </Grid>
              )}
              
              {/* Submit Button */}
              <Grid item xs={12}>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                  disabled={submitting || dailyBookingHours >= 5}
                  fullWidth
                  startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : null}
                  sx={{ py: 1.5 }}
                >
                  {submitting 
                    ? 'Processing...' 
                    : (dailyBookingHours >= 5 
                        ? 'Daily Limit Reached' 
                        : 'Confirm Booking')}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
        
        {/* Recommended Rooms section could be added here */}
        
      </Box>
      
      {/* Success message */}
      <Snackbar open={success} autoHideDuration={6000} onClose={handleClose}>
        <Alert onClose={handleClose} severity="success" sx={{ width: '100%' }}>
          Reservation created successfully!
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default BookingForm;
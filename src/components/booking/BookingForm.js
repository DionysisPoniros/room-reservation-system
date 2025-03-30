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
import { getUserHourAllowance } from '../../services/userService';
import { addHours, setMinutes, setSeconds, setMilliseconds, format } from 'date-fns';
import { 
  getRoom, 
  createReservation, 
  checkRoomAvailability, 
  getUserDailyBookings 
} from '../../services/roomService';
import { 
  Autocomplete, 
  Stack,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
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
  const [initialLoading, setInitialLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);

  const [invitedUsers, setInvitedUsers] = useState([]);
  const [userQuery, setUserQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  
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
        setInitialLoading(true); // Only use this for the initial room fetch
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
          setInitialLoading(false);
          return;
        }
        
        // Fetch user's daily bookings if user is logged in
        if (currentUser) {
          try {
            const result = await getUserDailyBookings(currentUser.uid, todayDate, tomorrowDate);
            
            // Use the user's custom allowance
            const allowance = await getUserHourAllowance(currentUser.uid);
            const userDailyLimit = allowance.dailyHours || 5;
            setDailyLimit(userDailyLimit);
            
            // Set daily booking info
            setTodayBookings(result.bookings || []);
            setDailyBookingHours(result.totalHoursBooked || 0);
            
            // Calculate remaining hours using the custom limit
            const remaining = Math.max(0, userDailyLimit - result.totalHoursBooked);
            setHoursRemaining(remaining);
            
            // Adjust duration if needed based on the custom limit
            if (duration > remaining && remaining > 0) {
              setDuration(Math.floor(remaining));
            } else if (remaining <= 0) {
              setDuration(1);
            }
          } catch (bookingError) {
            console.error("Error fetching user's daily bookings:", bookingError);
          }
        }
        
        setInitialLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please try again.");
        setInitialLoading(false);
      }
    };

    fetchRoomAndUserData();
  }, [id, currentUser]); // Only depend on id and currentUser, not time-related states

  
  // Update end time when start time or duration changes
  useEffect(() => {
    const newEndTime = addHours(startTime, duration);
    setEndTime(newEndTime);
  }, [startTime, duration]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (userQuery) {
        searchUsers(userQuery);
      }
    }, 500); // Debounce search
    
    return () => clearTimeout(timer);
  }, [userQuery]);
  

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

  const searchUsers = async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }
    
    try {
      setSearchingUsers(true);
      
      // Query Firebase for users with email starting with the search query
      // Note: This requires an index on the 'email' field
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('email', '>=', searchQuery),
        where('email', '<=', searchQuery + '\uf8ff'),
        limit(5)
      );
      
      const snapshot = await getDocs(q);
      
      // Filter out the current user
      const users = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => user.email !== currentUser.email);
      
      setSearchResults(users);
    } catch (err) {
      console.error("Error searching users:", err);
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleAddUser = (user) => {
    // Check if user is already invited
    if (!invitedUsers.some(u => u.id === user.id)) {
      // Check if maximum occupancy would be exceeded
      if (invitedUsers.length + 1 >= room.capacity) {
        setError(`Cannot invite more users. Room capacity is ${room.capacity} people.`);
        return;
      }
      
      setInvitedUsers([...invitedUsers, user]);
    }
    
    // Clear search
    setUserQuery('');
    setSearchResults([]);
  };
  
  const handleRemoveUser = (userId) => {
    setInvitedUsers(invitedUsers.filter(user => user.id !== userId));
  };

  // Add this function to handle removing a user from invites

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
      let collaborators = [];
      if (invitedUsers.length > 0) {
        collaborators = invitedUsers.map(user => ({
          userId: user.id,
          email: user.email,
          status: 'pending' // Status can be 'pending', 'accepted', 'declined'
        }));
      }
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
        durationHours: duration,
        collaborators: collaborators, // Add this line
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
  if (initialLoading) return (
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
              {/* Invited Users Section */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Invite Other Users (Optional)
                </Typography>
                <Autocomplete
                  freeSolo
                  options={searchResults}
                  getOptionLabel={(option) => typeof option === 'string' ? option : option.email}
                  loading={searchingUsers}
                  inputValue={userQuery}
                  onInputChange={(event, newValue) => setUserQuery(newValue)}
                  onChange={(event, value) => {
                    if (value && typeof value !== 'string') {
                      handleAddUser(value);
                    }
                  }}
                  filterOptions={(options) => options}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Search users by email"
                      variant="outlined"
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>  
                            <InputAdornment position="start">
                              <PersonAddIcon color="action" />
                            </InputAdornment>
                            {params.InputProps.startAdornment}
                          </>
                        ),
                        endAdornment: (
                          <>
                            {searchingUsers ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                      helperText="Type at least 3 characters to search"
                    />
                  )}
                  renderOption={(props, option) => (
                    <ListItem {...props}>
                      <ListItemIcon>
                        <Avatar>{option.email.charAt(0).toUpperCase()}</Avatar>
                      </ListItemIcon>
                      <ListItemText 
                        primary={option.email} 
                        secondary={option.displayName || 'User'}
                      />
                    </ListItem>
                  )}
                />
                
                {/* Display invited users */}
                {invitedUsers.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Invited Users ({invitedUsers.length})
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {invitedUsers.map((user) => (
                        <Chip
                          key={user.id}
                          avatar={<Avatar>{user.email.charAt(0).toUpperCase()}</Avatar>}
                          label={user.email}
                          onDelete={() => handleRemoveUser(user.id)}
                          sx={{ my: 0.5 }}
                        />
                      ))}
                    </Stack>
                  </Box>
                )}
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
                  disabled={submitting || dailyBookingHours >= dailyLimit}
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
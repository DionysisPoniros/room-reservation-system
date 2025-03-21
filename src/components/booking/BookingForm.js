import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Snackbar
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAuth } from '../../contexts/AuthContext';
import { getRoom, createReservation, checkRoomAvailability } from '../../services/roomService';

function BookingForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [room, setRoom] = useState(null);
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date(new Date().setHours(new Date().getHours() + 1)));
  const [purpose, setPurpose] = useState('');
  const [attendees, setAttendees] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        setLoading(true);
        const roomData = await getRoom(id);
        if (roomData) {
          setRoom(roomData);
        } else {
          setError("Room not found");
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching room:", err);
        setError("Failed to load room details");
        setLoading(false);
      }
    };

    fetchRoom();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError("You must be logged in to book a room");
      return;
    }
    
    if (startTime >= endTime) {
      setError("End time must be after start time");
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Check if room is available
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
                    onChange={setStartTime}
                    renderInput={(params) => <TextField {...params} fullWidth required />}
                    minDateTime={new Date()}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateTimePicker
                    label="End Time"
                    value={endTime}
                    onChange={setEndTime}
                    renderInput={(params) => <TextField {...params} fullWidth required />}
                    minDateTime={startTime}
                  />
                </LocalizationProvider>
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
                  disabled={submitting}
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
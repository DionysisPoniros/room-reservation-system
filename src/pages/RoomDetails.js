import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Typography, Box, Button, Paper, Grid, Chip } from '@mui/material';
import { getRoom, getRoomReservations } from '../services/roomService';

function RoomDetails() {
  const { id } = useParams();
  const [room, setRoom] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRoomDetails = async () => {
      try {
        setLoading(true);
        const roomData = await getRoom(id);
        if (roomData) {
          setRoom(roomData);
          
          // Get reservations for this room
          const reservationsData = await getRoomReservations(id);
          setReservations(reservationsData);
        } else {
          setError("Room not found");
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching room details:", err);
        setError("Failed to load room details. Please try again.");
        setLoading(false);
      }
    };

    fetchRoomDetails();
  }, [id]);

  if (loading) return <Typography>Loading room details...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!room) return <Typography>Room not found</Typography>;

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {room.name}
        </Typography>
        
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6">Details</Typography>
              <Typography>Location: {room.location}</Typography>
              <Typography>Capacity: {room.capacity} people</Typography>
              <Typography>Type: {room.type}</Typography>
              
              <Typography variant="h6" sx={{ mt: 2 }}>Equipment</Typography>
              <Box>
                {(room.equipment || []).map((item, index) => (
                  <Chip 
                    key={index} 
                    label={item} 
                    variant="outlined" 
                    sx={{ mr: 0.5, mb: 0.5 }} 
                  />
                ))}
                {(room.equipment?.length || 0) === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No equipment specified
                  </Typography>
                )}
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6">Availability</Typography>
              {reservations.length > 0 ? (
                <Box>
                  <Typography variant="subtitle2">Upcoming Reservations:</Typography>
                  {reservations.map((reservation) => (
                    <Paper key={reservation.id} sx={{ p: 1, mb: 1 }}>
                      <Typography>
                        {new Date(reservation.startTime.seconds * 1000).toLocaleString()} - 
                        {new Date(reservation.endTime.seconds * 1000).toLocaleString()}
                      </Typography>
                      <Typography variant="body2">{reservation.purpose}</Typography>
                    </Paper>
                  ))}
                </Box>
              ) : (
                <Typography>No upcoming reservations</Typography>
              )}
            </Grid>
          </Grid>
        </Paper>
        
        <Button variant="contained" color="primary">
          Book This Room
        </Button>
      </Box>
    </Container>
  );
}

export default RoomDetails;
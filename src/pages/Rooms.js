import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Typography, Box, Grid, Card, CardContent, CardActions, Button, Chip } from '@mui/material';
import { getRooms } from '../services/roomService';

function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        const roomsData = await getRooms();
        setRooms(roomsData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching rooms:", err);
        setError("Failed to load rooms. Please try again.");
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  if (loading) return <Typography>Loading rooms...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Available Rooms
        </Typography>
        
        <Grid container spacing={3}>
          {rooms.map((room) => (
            <Grid item xs={12} md={4} key={room.id}>
              <Card>
                <CardContent>
                  <Typography variant="h5" component="h2">
                    {room.name}
                  </Typography>
                  <Typography color="text.secondary">
                    {room.location}
                  </Typography>
                  <Typography variant="body2">
                    Capacity: {room.capacity} people
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    {room.equipment.map((item, index) => (
                      <Chip 
                        key={index} 
                        label={item} 
                        variant="outlined" 
                        size="small" 
                        sx={{ mr: 0.5, mb: 0.5 }} 
                      />
                    ))}
                  </Box>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    component={Link} 
                    to={`/rooms/${room.id}`}
                  >
                    View Details
                  </Button>
                  <Button 
                    size="small" 
                    variant="contained" 
                    color="primary"
                    component={Link} 
                    to={`/rooms/${room.id}/book`}
                  >
                    Book Now
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
}

export default Rooms;
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Paper
} from '@mui/material';
import RoomSearch from '../components/rooms/RoomSearch';
import { getRooms, searchAvailableRooms, getPopularRooms } from '../services/roomService';

function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [popularRooms, setPopularRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useState(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        // Load all rooms initially
        const roomsData = await getRooms();
        setRooms(roomsData);
        
        // Load popular rooms
        const popularRoomsData = await getPopularRooms(3);
        setPopularRooms(popularRoomsData);
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching rooms:", err);
        setError("Failed to load rooms. Please try again.");
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const handleSearch = async (searchParams) => {
    try {
      setSearching(true);
      setSearchParams(searchParams);
      setError(null);
      
      // Search for available rooms
      const availableRooms = await searchAvailableRooms(
        searchParams.startTime,
        searchParams.endTime,
        searchParams.filters
      );
      
      setRooms(availableRooms);
      setSearching(false);
    } catch (err) {
      console.error("Error searching rooms:", err);
      setError("Failed to search for available rooms. Please try again.");
      setSearching(false);
    }
  };

  const clearSearch = async () => {
    try {
      setSearching(true);
      setSearchParams(null);
      
      // Load all rooms again
      const roomsData = await getRooms();
      setRooms(roomsData);
      
      setSearching(false);
    } catch (err) {
      console.error("Error clearing search:", err);
      setError("Failed to reset room list. Please try again.");
      setSearching(false);
    }
  };

  if (loading) return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    </Container>
  );

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Room Finder
        </Typography>
        
        {/* Search Component */}
        <RoomSearch onSearch={handleSearch} />
        
        {/* Search Results */}
        {searchParams && (
          <Box sx={{ mb: 3 }}>
            <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body1">
                Showing {rooms.length} available room{rooms.length !== 1 ? 's' : ''} for{' '}
                {new Date(searchParams.startTime).toLocaleString()} to{' '}
                {new Date(searchParams.endTime).toLocaleString()}
              </Typography>
              <Button onClick={clearSearch} variant="outlined" size="small">
                Clear Search
              </Button>
            </Paper>
          </Box>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {searching ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Popular Rooms (show only when not searching) */}
            {!searchParams && popularRooms.length > 0 && (
              <>
                <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
                  Popular Rooms
                </Typography>
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  {popularRooms.map((room) => (
                    <Grid item xs={12} md={4} key={room.id}>
                      <Card sx={{ borderTop: '3px solid #1976d2' }}>
                        <CardContent>
                          <Typography variant="h5" component="h2">
                            {room.name}
                          </Typography>
                          <Typography color="text.secondary">
                            {room.location}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            Booked {room.bookingCount} times
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            {room.equipment.slice(0, 3).map((item, index) => (
                              <Chip 
                                key={index} 
                                label={item} 
                                variant="outlined" 
                                size="small" 
                                sx={{ mr: 0.5, mb: 0.5 }} 
                              />
                            ))}
                            {room.equipment.length > 3 && (
                              <Chip 
                                label={`+${room.equipment.length - 3} more`} 
                                size="small" 
                                sx={{ mb: 0.5 }} 
                              />
                            )}
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
                <Divider sx={{ mb: 4 }} />
              </>
            )}
            
            {/* All Rooms or Search Results */}
            <Typography variant="h5" sx={{ mb: 2 }}>
              {searchParams ? 'Available Rooms' : 'All Rooms'}
            </Typography>
            
            {rooms.length === 0 ? (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6">
                  {searchParams 
                    ? 'No rooms available for the selected criteria' 
                    : 'No rooms found in the system'}
                </Typography>
                {searchParams && (
                  <Button 
                    variant="outlined" 
                    color="primary"
                    sx={{ mt: 2 }}
                    onClick={clearSearch}
                  >
                    Clear Search Filters
                  </Button>
                )}
              </Paper>
            ) : (
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
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          Capacity: {room.capacity} people
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          {room.equipment && room.equipment.map((item, index) => (
                            <Chip 
                              key={index} 
                              label={item} 
                              variant="outlined" 
                              size="small" 
                              sx={{ mr: 0.5, mb: 0.5 }} 
                            />
                          ))}
                          {room.equipment.length > 3 && (
                            <Chip 
                              label={`+${room.equipment.length - 3} more`} 
                              size="small" 
                              sx={{ mb: 0.5 }} 
                            />
                          )}
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
            )}
          </>
        )}
      </Box>
    </Container>
  );
}

export default Rooms;
// src/pages/Rooms.js
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
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  useTheme
} from '@mui/material';
import RoomSearch from '../components/rooms/RoomSearch';
import RoomScheduleView from '../components/rooms/RoomScheduleView';
import RoomCard from '../components/rooms/RoomCard';
import { getRooms, searchAvailableRooms, getPopularRooms, getRoomReservations } from '../services/roomService';
// Icons
import ViewListIcon from '@mui/icons-material/ViewList';
import CalendarViewDayIcon from '@mui/icons-material/CalendarViewDay';
import MapIcon from '@mui/icons-material/Map';

function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [popularRooms, setPopularRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'schedule', or 'map'
  const [reservations, setReservations] = useState({});
  const [scheduleDate, setScheduleDate] = useState(new Date());
  const theme = useTheme();

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
        
        // Load reservations for all rooms for schedule view
        await fetchReservationsForRooms(roomsData);
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching rooms:", err);
        setError("Failed to load rooms. Please try again.");
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Fetch reservations for all rooms
  const fetchReservationsForRooms = async (roomsData) => {
    try {
      const reservationsMap = {};
      for (const room of roomsData) {
        const roomReservations = await getRoomReservations(room.id);
        reservationsMap[room.id] = roomReservations;
      }
      setReservations(reservationsMap);
    } catch (err) {
      console.error("Error fetching reservations:", err);
    }
  };

  const handleSearch = async (searchParams) => {
    try {
      setSearching(true);
      setSearchParams(searchParams);
      setError(null);
      
      // If date is provided in search params, update schedule date
      if (searchParams.startTime) {
        setScheduleDate(new Date(searchParams.startTime));
      }
      
      // Search for available rooms
      const availableRooms = await searchAvailableRooms(
        searchParams.startTime,
        searchParams.endTime,
        searchParams.filters
      );
      
      setRooms(availableRooms);
      
      // Update reservations for schedule view
      await fetchReservationsForRooms(availableRooms);
      
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
      
      // Update reservations for schedule view
      await fetchReservationsForRooms(roomsData);
      
      setSearching(false);
    } catch (err) {
      console.error("Error clearing search:", err);
      setError("Failed to reset room list. Please try again.");
      setSearching(false);
    }
  };

  const handleViewChange = (event, newView) => {
    if (newView !== null) {
      setViewMode(newView);
    }
  };

  const handleScheduleDateChange = (newDate) => {
    setScheduleDate(newDate);
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
        
        {/* Search Results Controls */}
        <Box sx={{ mb: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}>
          {searchParams ? (
            <Paper sx={{ p: 2, display: 'flex', flexGrow: 1, justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body1">
                Showing {rooms.length} available room{rooms.length !== 1 ? 's' : ''} for{' '}
                {new Date(searchParams.startTime).toLocaleString()} to{' '}
                {new Date(searchParams.endTime).toLocaleString()}
              </Typography>
              <Button onClick={clearSearch} variant="outlined" size="small">
                Clear Search
              </Button>
            </Paper>
          ) : (
            <Box></Box>
          )}
          
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewChange}
            aria-label="view mode"
            sx={{ justifySelf: 'flex-end' }}
          >
            <ToggleButton value="list" aria-label="list view">
              <ViewListIcon />
            </ToggleButton>
            <ToggleButton value="schedule" aria-label="schedule view">
              <CalendarViewDayIcon />
            </ToggleButton>
            <ToggleButton value="map" aria-label="map view">
              <MapIcon />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
        
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
            {/* Popular Rooms (show only when not searching and in list view) */}
            {!searchParams && viewMode === 'list' && popularRooms.length > 0 && (
              <>
                <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
                  Popular Rooms
                </Typography>
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  {popularRooms.map((room) => (
                    <Grid item xs={12} md={4} key={room.id}>
                      <RoomCard room={room} isPopular={true} />
                    </Grid>
                  ))}
                </Grid>
                <Divider sx={{ mb: 4 }} />
              </>
            )}
            
            {/* View Mode Content */}
            {viewMode === 'list' && (
              <>
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
                        <RoomCard room={room} />
                      </Grid>
                    ))}
                  </Grid>
                )}
              </>
            )}
            
            {viewMode === 'schedule' && (
              <>
                <Typography variant="h5" sx={{ mb: 2 }}>
                  Room Schedule
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
                  <RoomScheduleView 
                    rooms={rooms} 
                    reservations={reservations}
                    date={scheduleDate}
                    onDateChange={handleScheduleDateChange}
                  />
                )}
              </>
            )}
            
            {viewMode === 'map' && (
              <>
                <Typography variant="h5" sx={{ mb: 2 }}>
                  Room Map
                </Typography>
                
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="h6">
                    3D Map visualization is under development
                  </Typography>
                  <Typography paragraph sx={{ my: 2 }}>
                    Check back soon for an interactive 3D map of our campus rooms
                  </Typography>
                  <Button 
                    variant="outlined" 
                    color="primary"
                    onClick={() => setViewMode('schedule')}
                  >
                    View Schedule Instead
                  </Button>
                </Paper>
              </>
            )}
          </>
        )}
      </Box>
    </Container>
  );
}

export default Rooms;
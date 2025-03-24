// src/pages/Rooms.js - Performance Optimized
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  useTheme,
  Skeleton,
  LinearProgress
} from '@mui/material';
import RoomSearch from '../components/rooms/RoomSearch';
import RoomScheduleView from '../components/rooms/RoomScheduleView';
import RoomCard from '../components/rooms/RoomCard';
import { getRooms, searchAvailableRooms, getPopularRooms, getRoomReservations, getReservationsForDate } from '../services/roomService';
// Icons
import ViewListIcon from '@mui/icons-material/ViewList';
import CalendarViewDayIcon from '@mui/icons-material/CalendarViewDay';
import MapIcon from '@mui/icons-material/Map';

// Number of rooms to display initially in the schedule view
const INITIAL_ROOM_LIMIT = 10;

function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [displayedRooms, setDisplayedRooms] = useState([]);
  const [popularRooms, setPopularRooms] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [reservationsLoading, setReservationsLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useState(null);
  const [viewMode, setViewMode] = useState('schedule'); 
  const [reservations, setReservations] = useState({});
  const [scheduleDate, setScheduleDate] = useState(new Date());
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [cachedData, setCachedData] = useState({
    rooms: null,
    lastFetched: null
  });
  const theme = useTheme();

  // Cache key for localStorage
  const CACHE_KEY = 'roomFinderCache';
  const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

  // Load data from localStorage cache on component mount
  useEffect(() => {
    const cachedDataStr = localStorage.getItem(CACHE_KEY);
    if (cachedDataStr) {
      try {
        const cached = JSON.parse(cachedDataStr);
        const now = Date.now();
        // Check if cache is still valid (less than 5 minutes old)
        if (cached.lastFetched && now - cached.lastFetched < CACHE_EXPIRY) {
          console.log('Using cached room data');
          setCachedData(cached);
          if (cached.rooms) {
            setRooms(cached.rooms);
            // Only display first N rooms initially for better performance
            setDisplayedRooms(cached.rooms.slice(0, INITIAL_ROOM_LIMIT));
            setRoomsLoading(false);
          }
        }
      } catch (err) {
        console.error('Error parsing cached data:', err);
        // Invalid cache, we'll fetch fresh data
      }
    }
  }, []);

  // Fetch room data, with optimized loading
  const fetchRooms = useCallback(async () => {
    try {
      setRoomsLoading(true);
      // Fetch all rooms
      const roomsData = await getRooms();
      setRooms(roomsData);
      
      // Only display first N rooms initially for better performance
      setDisplayedRooms(roomsData.slice(0, INITIAL_ROOM_LIMIT));
      
      // Update cache
      const cacheData = {
        rooms: roomsData,
        lastFetched: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      setCachedData(cacheData);
      
      setRoomsLoading(false);
      return roomsData;
    } catch (err) {
      console.error("Error fetching rooms:", err);
      setError("Failed to load rooms. Please try again.");
      setRoomsLoading(false);
      return [];
    }
  }, []);

  // Load more rooms (for pagination)
  const loadMoreRooms = useCallback(() => {
    setLoadingMore(true);
    // Add another batch of rooms to the displayed list
    const currentLength = displayedRooms.length;
    const newRooms = rooms.slice(currentLength, currentLength + INITIAL_ROOM_LIMIT);
    setDisplayedRooms(prev => [...prev, ...newRooms]);
    setLoadingMore(false);
  }, [rooms, displayedRooms]);

  // Fetch reservations for the current date only (more efficient)
  const fetchReservationsForCurrentDate = useCallback(async (roomsToCheck) => {
    try {
      setReservationsLoading(true);
      
      // Get start and end of current date
      const dateStart = new Date(scheduleDate);
      dateStart.setHours(0, 0, 0, 0);
      
      const dateEnd = new Date(scheduleDate);
      dateEnd.setHours(23, 59, 59, 999);
      
      // Get all reservations for this date range (single query)
      const allReservations = await getReservationsForDate(dateStart, dateEnd);
      
      // Group by roomId
      const reservationsByRoom = {};
      allReservations.forEach(res => {
        if (!reservationsByRoom[res.roomId]) {
          reservationsByRoom[res.roomId] = [];
        }
        reservationsByRoom[res.roomId].push(res);
      });
      
      setReservations(reservationsByRoom);
      setReservationsLoading(false);
    } catch (err) {
      console.error("Error fetching reservations:", err);
      setReservationsLoading(false);
    }
  }, [scheduleDate]);

  // Fetch popular rooms
  const fetchPopularRooms = useCallback(async () => {
    try {
      const popularRoomsData = await getPopularRooms(3);
      setPopularRooms(popularRoomsData);
    } catch (err) {
      console.error("Error fetching popular rooms:", err);
    }
  }, []);

  // Main data fetching effect
  useEffect(() => {
    async function loadInitialData() {
      setInitialLoading(true);
      
      // If we have cached rooms, fetch reservations first for faster loading
      if (cachedData.rooms && cachedData.rooms.length > 0) {
        await fetchReservationsForCurrentDate(cachedData.rooms);
        await fetchPopularRooms();
        // Then fetch fresh room data in the background
        fetchRooms();
      } else {
        // Otherwise fetch everything sequentially
        const roomsData = await fetchRooms();
        await fetchReservationsForCurrentDate(roomsData);
        await fetchPopularRooms();
      }
      
      setInitialLoading(false);
    }
    
    loadInitialData();
  }, [lastRefresh, scheduleDate, fetchRooms, fetchReservationsForCurrentDate, fetchPopularRooms, cachedData.rooms]);

  // Handler for search - optimized to avoid unnecessary re-renders
  const handleSearch = useCallback(async (searchParams) => {
    try {
      setSearching(true);
      setSearchParams(searchParams);
      setError(null);
      
      // If date is provided in search params, update schedule date
      if (searchParams.startTime) {
        setScheduleDate(new Date(searchParams.startTime));
      }
      
      // Search for available rooms with fresh data
      const availableRooms = await searchAvailableRooms(
        searchParams.startTime,
        searchParams.endTime,
        searchParams.filters
      );
      
      setRooms(availableRooms);
      setDisplayedRooms(availableRooms.slice(0, INITIAL_ROOM_LIMIT));
      
      // Update reservations for schedule view
      await fetchReservationsForCurrentDate(availableRooms);
      
      setSearching(false);
    } catch (err) {
      console.error("Error searching rooms:", err);
      setError("Failed to search for available rooms. Please try again.");
      setSearching(false);
    }
  }, [fetchReservationsForCurrentDate]);

  // Clear search handler
  const clearSearch = useCallback(async () => {
    try {
      setSearching(true);
      setSearchParams(null);
      
      // Refresh data when clearing search
      setLastRefresh(Date.now());
      
      setSearching(false);
    } catch (err) {
      console.error("Error clearing search:", err);
      setError("Failed to reset room list. Please try again.");
      setSearching(false);
    }
  }, []);

  // View mode change handler
  const handleViewChange = useCallback((event, newView) => {
    if (newView !== null) {
      setViewMode(newView);
    }
  }, []);

  // Schedule date change handler
  const handleScheduleDateChange = useCallback((newDate) => {
    setScheduleDate(newDate);
  }, []);

  // Loading placeholders
  const renderLoadingPlaceholders = useMemo(() => {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
        <Box sx={{ mt: 4 }}>
          {[1, 2, 3].map((item) => (
            <Paper key={item} sx={{ p: 2, mb: 2 }}>
              <Skeleton variant="text" width="60%" height={40} />
              <Skeleton variant="text" width="40%" height={20} sx={{ mb: 1 }} />
              <Skeleton variant="rectangular" width="100%" height={120} />
            </Paper>
          ))}
        </Box>
      </Box>
    );
  }, []);

  // Show main loading state
  if (initialLoading && !cachedData.rooms) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Room Finder
          </Typography>
          {renderLoadingPlaceholders}
        </Box>
      </Container>
    );
  }

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
        
        {/* Show loading indicator for searches */}
        {searching && (
          <Box sx={{ width: '100%', mb: 3 }}>
            <LinearProgress />
          </Box>
        )}
        
        {/* Main Content Area */}
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
                roomsLoading ? (
                  renderLoadingPlaceholders
                ) : (
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
                )
              ) : (
                <>
                  <Grid container spacing={3}>
                    {displayedRooms.map((room) => (
                      <Grid item xs={12} md={4} key={room.id}>
                        <RoomCard room={room} />
                      </Grid>
                    ))}
                  </Grid>
                  
                  {/* Load more button */}
                  {displayedRooms.length < rooms.length && (
                    <Box sx={{ mt: 3, textAlign: 'center' }}>
                      <Button 
                        variant="outlined" 
                        onClick={loadMoreRooms}
                        disabled={loadingMore}
                        endIcon={loadingMore ? <CircularProgress size={20} /> : null}
                      >
                        {loadingMore ? 'Loading...' : `Load More (Showing ${displayedRooms.length} of ${rooms.length})`}
                      </Button>
                    </Box>
                  )}
                </>
              )}
            </>
          )}
          
          {viewMode === 'schedule' && (
            <>
              <Typography variant="h5" sx={{ mb: 2 }}>
                Room Schedule
              </Typography>
              
              {/* Show reservation loading indicator */}
              {reservationsLoading && (
                <Box sx={{ width: '100%', mb: 3 }}>
                  <LinearProgress />
                </Box>
              )}
              
              {rooms.length === 0 ? (
                roomsLoading ? (
                  renderLoadingPlaceholders
                ) : (
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
                )
              ) : (
                <RoomScheduleView 
                  rooms={displayedRooms} 
                  reservations={reservations}
                  date={scheduleDate}
                  onDateChange={handleScheduleDateChange}
                  loading={roomsLoading || reservationsLoading}
                />
              )}
              
              {/* Load more button for schedule view */}
              {displayedRooms.length < rooms.length && (
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Button 
                    variant="outlined" 
                    onClick={loadMoreRooms}
                    disabled={loadingMore}
                    endIcon={loadingMore ? <CircularProgress size={20} /> : null}
                  >
                    {loadingMore ? 'Loading...' : `Load More Rooms (Showing ${displayedRooms.length} of ${rooms.length})`}
                  </Button>
                </Box>
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
      </Box>
    </Container>
  );
}

export default Rooms;
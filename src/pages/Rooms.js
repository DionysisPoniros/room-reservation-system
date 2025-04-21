// src/pages/Rooms.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Button, 
  Chip,
  CircularProgress,
  LinearProgress,
  Alert,
  Divider,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  useTheme,
  Skeleton,
  Fade,
  Collapse,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Badge
} from '@mui/material';
import RoomSearch from '../components/rooms/RoomSearch';
import RoomScheduleView from '../components/rooms/RoomScheduleView';
import RoomCard from '../components/rooms/RoomCard';
import EnhancedRoomVisualizer from '../components/rooms/EnhancedRoomVisualizer';
import { getRooms, searchAvailableRooms, getPopularRooms, getRoomReservations, getReservationsForDate } from '../services/roomService';
import { useLocation, useNavigate } from 'react-router-dom';

// Icons
import ViewListIcon from '@mui/icons-material/ViewList';
import CalendarViewDayIcon from '@mui/icons-material/CalendarViewDay';
import MapIcon from '@mui/icons-material/Map';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import TuneIcon from '@mui/icons-material/Tune';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import SearchIcon from '@mui/icons-material/Search';
import AppRegistrationIcon from '@mui/icons-material/AppRegistration';

// Number of rooms to display initially in the schedule view
const INITIAL_ROOM_LIMIT = 10;

function Rooms() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Room data states
  const [rooms, setRooms] = useState([]);
  const [displayedRooms, setDisplayedRooms] = useState([]);
  const [popularRooms, setPopularRooms] = useState([]);
  const [reservations, setReservations] = useState({});
  
  // Loading states
  const [initialLoading, setInitialLoading] = useState(true);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [reservationsLoading, setReservationsLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // UI states
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useState(null);
  const [scheduleDate, setScheduleDate] = useState(new Date());
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [sortAnchorEl, setSortAnchorEl] = useState(null);
  const [sortMethod, setSortMethod] = useState('recommended');
  
  // Cache related
  const [cachedData, setCachedData] = useState({
    rooms: null,
    lastFetched: null
  });
  
  // Get view mode from URL or default to list
  const initialViewMode = new URLSearchParams(location.search).get('view') || 'list';
  const [viewMode, setViewMode] = useState(
    ['list', 'schedule', 'map'].includes(initialViewMode) ? initialViewMode : 'list'
  );
  
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

  // Fix any duplicate error message issues
  useEffect(() => {
    // When rooms are successfully loaded, clear any errors that might be showing
    if (rooms.length > 0 && !roomsLoading && !reservationsLoading) {
      // Clear errors after a short delay to ensure UI transitions are complete
      const timer = setTimeout(() => {
        setError(null);
      }, 500);
      
      // Clean up timer
      return () => clearTimeout(timer);
    }
  }, [rooms.length, roomsLoading, reservationsLoading]);
  
  // Add this effect to handle URL changes after initial render
  useEffect(() => {
    const urlViewParam = new URLSearchParams(location.search).get('view');
    
    if (urlViewParam && ['list', 'schedule', 'map'].includes(urlViewParam)) {
      console.log(`Setting view mode to ${urlViewParam} from URL parameter`);
      setViewMode(urlViewParam);
    }
  }, [location.search]);

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
    try {
      setLoadingMore(true);
      
      // Add another batch of rooms to the displayed list
      const currentLength = displayedRooms.length;
      const nextBatch = rooms.slice(currentLength, currentLength + INITIAL_ROOM_LIMIT);
      
      if (nextBatch.length > 0) {
        // Use functional update to ensure we're using the latest state
        setDisplayedRooms(prevRooms => [...prevRooms, ...nextBatch]);
        console.log(`Added ${nextBatch.length} more rooms to display`);
      } else {
        console.log("No more rooms to load");
      }
    } catch (error) {
      console.error("Error loading more rooms:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [rooms, displayedRooms]);

  // Fetch reservations for the current date only (more efficient)
  const fetchReservationsForCurrentDate = useCallback(async (roomsToCheck) => {
    try {
      console.log("Fetching reservations for date:", scheduleDate);
      setReservationsLoading(true);
      
      // Get all reservations for the current date, not filtering by availability
      const reservationsData = await getReservationsForDate(
        new Date(scheduleDate.setHours(0, 0, 0, 0)),
        new Date(scheduleDate.setHours(23, 59, 59, 999))
      );
      
      // Group by roomId
      const reservationsByRoom = {};
      reservationsData.forEach(res => {
        if (!reservationsByRoom[res.roomId]) {
          reservationsByRoom[res.roomId] = [];
        }
        reservationsByRoom[res.roomId].push(res);
      });
      
      setReservations(reservationsByRoom);
      setReservationsLoading(false);
    } catch (err) {
      console.error("Error fetching reservations:", err);
      setReservations({});
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
    // Prevent multiple simultaneous data fetches
    let isMounted = true;
    
    async function loadInitialData() {
      if (!isMounted) return;
      setInitialLoading(true);
      
      try {
        console.log("Starting initial data load...");
        
        // First load rooms - always need this data
        const roomsData = await fetchRooms();
        
        if (!isMounted) return;
        
        // After rooms are loaded, fetch reservations directly
        console.log(`Fetched ${roomsData.length} rooms, now loading reservations...`);
        
        try {
          await fetchReservationsForCurrentDate(roomsData);
        } catch (reservationError) {
          console.error("Error fetching reservations:", reservationError);
          // Don't fail the whole flow if just reservations fail
        }
        
        if (!isMounted) return;
        
        // Finally, fetch popular rooms
        await fetchPopularRooms();
      } catch (error) {
        if (!isMounted) return;
        console.error("Error loading initial data:", error);
        setError("Failed to load data. Please try again.");
      } finally {
        if (isMounted) {
          console.log("Finished loading initial data");
          setInitialLoading(false);
          setRoomsLoading(false);
          setReservationsLoading(false);
        }
      }
    }
    
    loadInitialData();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [lastRefresh, fetchRooms, fetchReservationsForCurrentDate, fetchPopularRooms]);
  
  // Separate effect for when schedule date changes
  useEffect(() => {
    // Skip on first render and only run when rooms are loaded
    if (rooms.length > 0) {
      fetchReservationsForCurrentDate(rooms);
    }
  }, [scheduleDate, rooms, fetchReservationsForCurrentDate]);

  // Handler for search
  const handleSearch = useCallback(async (searchParams) => {
    try {
      setSearching(true);
      setSearchParams(searchParams);
      setError(null);
      
      console.log("Search params:", searchParams);
      
      // If date is provided in search params, update schedule date
      if (searchParams.startTime) {
        setScheduleDate(new Date(searchParams.startTime));
      }
      
      // Get all rooms that match the filter criteria (regardless of availability)
      const filteredRooms = await getRooms(searchParams.filters);
      
      // Get all reservations for the date
      const startOfDay = new Date(searchParams.startTime);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(searchParams.startTime);
      endOfDay.setHours(23, 59, 59, 999);
      
      const allReservations = await getReservationsForDate(startOfDay, endOfDay);
      
      // Group by roomId
      const reservationsByRoom = {};
      allReservations.forEach(res => {
        if (!reservationsByRoom[res.roomId]) {
          reservationsByRoom[res.roomId] = [];
        }
        reservationsByRoom[res.roomId].push(res);
      });
      
      // Update state with all rooms (available and booked)
      setRooms(filteredRooms);
      setDisplayedRooms(filteredRooms.slice(0, INITIAL_ROOM_LIMIT));
      setReservations(reservationsByRoom);
      
      setError(null);
    } catch (err) {
      console.error("Error in handleSearch:", err);
      setError("Failed to search for rooms. Please try again.");
    } finally {
      setSearching(false);
    }
  }, []);

  // Clear search handler
  const clearSearch = useCallback(async () => {
    try {
      console.log("Clearing search and resetting to all rooms");
      setSearching(true);
      setSearchParams(null);
      
      // Reset room data
      const allRooms = await fetchRooms();
      
      // Reset reservations for the current date
      await fetchReservationsForCurrentDate(allRooms);
    } catch (err) {
      console.error("Error clearing search:", err);
      setError("Failed to reset room list. Please try again.");
    } finally {
      setSearching(false);
    }
  }, [fetchRooms, fetchReservationsForCurrentDate]);

  // View mode change handler
  const handleViewChange = useCallback((newView) => {
    if (newView) {
      setViewMode(newView);
      
      // Update URL without full page reload
      const searchParams = new URLSearchParams(location.search);
      searchParams.set('view', newView);
      navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
    }
  }, [location, navigate]);

  // Schedule date change handler
  const handleScheduleDateChange = useCallback((newDate) => {
    setScheduleDate(newDate);
  }, []);
  
  // Open sort menu
  const handleSortClick = (event) => {
    setSortAnchorEl(event.currentTarget);
  };

  // Close sort menu
  const handleSortClose = () => {
    setSortAnchorEl(null);
  };
  
  // Handle sort change
  const handleSortChange = (sortType) => {
    setSortMethod(sortType);
    
    // Sort the rooms accordingly
    let sortedRooms = [...rooms];
    
    switch (sortType) {
      case 'capacity-high':
        sortedRooms.sort((a, b) => (b.capacity || 0) - (a.capacity || 0));
        break;
      case 'capacity-low':
        sortedRooms.sort((a, b) => (a.capacity || 0) - (b.capacity || 0));
        break;
      case 'name-asc':
        sortedRooms.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        sortedRooms.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'popularity':
        sortedRooms.sort((a, b) => (b.bookingCount || 0) - (a.bookingCount || 0));
        break;
      case 'recommended':
      default:
        // No specific sorting, keep as is
        break;
    }
    
    setRooms(sortedRooms);
    setDisplayedRooms(sortedRooms.slice(0, INITIAL_ROOM_LIMIT));
    
    setSortAnchorEl(null);
  };

  // Loading placeholders
  const renderLoadingPlaceholders = useMemo(() => {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress sx={{ mb: 4 }} />
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item}>
              <Paper sx={{ p: 0, height: '100%', borderRadius: 2, overflow: 'hidden' }}>
                <Skeleton variant="rectangular" width="100%" height={140} animation="wave" />
                <Box sx={{ p: 2 }}>
                  <Skeleton variant="text" width="70%" height={32} animation="wave" />
                  <Skeleton variant="text" width="50%" height={24} animation="wave" />
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Skeleton variant="rectangular" width={80} height={32} animation="wave" />
                    <Skeleton variant="rectangular" width={80} height={32} animation="wave" />
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
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

  // Split reservations into categories based on time
  const getAvailabilityStatus = (roomId) => {
    if (!reservations[roomId] || reservations[roomId].length === 0) {
      return 'available';
    }
    
    const now = new Date();
    
    // Check if the room is currently occupied
    const isCurrentlyOccupied = reservations[roomId].some(res => {
      if (res.status === 'cancelled') return false;
      
      const startTime = new Date(res.startTime.seconds * 1000);
      const endTime = new Date(res.endTime.seconds * 1000);
      
      return now >= startTime && now <= endTime;
    });
    
    if (isCurrentlyOccupied) return 'occupied';
    
    // Check if the room has upcoming bookings today
    const hasUpcomingToday = reservations[roomId].some(res => {
      if (res.status === 'cancelled') return false;
      
      const startTime = new Date(res.startTime.seconds * 1000);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      
      return startTime > now && startTime <= today;
    });
    
    return hasUpcomingToday ? 'upcoming' : 'available';
  };

  return (
    <Box sx={{ 
      bgcolor: theme.palette.mode === 'dark' ? 'background.default' : '#f8f9fa',
      minHeight: 'calc(100vh - 64px)',
      pb: 8
    }}>
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          {/* Header with animated gradient background */}
          <Box 
            sx={{ 
              position: 'relative',
              borderRadius: 4,
              overflow: 'hidden',
              p: 4,
              mb: 4,
              color: 'white',
              background: 'linear-gradient(135deg, #F76902 0%, #513127 100%)',
              backgroundSize: '200% 200%',
              animation: 'gradientBG 15s ease infinite',
              '@keyframes gradientBG': {
                '0%': { backgroundPosition: '0% 50%' },
                '50%': { backgroundPosition: '100% 50%' },
                '100%': { backgroundPosition: '0% 50%' }
              },
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}
          >
            <Typography 
              variant="h3" 
              component="h1" 
              sx={{ 
                fontWeight: 800,
                mb: 1
              }}
            >
              Room Finder
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 400, mb: 2, opacity: 0.9 }}>
              {searchParams 
                ? 'Find the perfect space for your needs' 
                : 'Browse all available rooms across campus'}
            </Typography>
            
            {/* Quick Control Buttons */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
              <Button 
                variant="contained" 
                color="secondary" 
                startIcon={<TuneIcon />}
                onClick={() => document.getElementById('search-section').scrollIntoView({ behavior: 'smooth' })}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.15)', 
                  backdropFilter: 'blur(10px)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
                  fontWeight: 500
                }}
              >
                Refine Search
              </Button>
              
              <Button 
                variant="contained" 
                color="secondary" 
                startIcon={<ViewListIcon />}
                onClick={() => handleViewChange('list')}
                sx={{ 
                  bgcolor: viewMode === 'list' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.15)', 
                  backdropFilter: 'blur(10px)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
                  fontWeight: viewMode === 'list' ? 600 : 500
                }}
              >
                List View
              </Button>
              
              <Button 
                variant="contained" 
                color="secondary" 
                startIcon={<CalendarViewDayIcon />}
                onClick={() => handleViewChange('schedule')}
                sx={{ 
                  bgcolor: viewMode === 'schedule' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.15)', 
                  backdropFilter: 'blur(10px)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
                  fontWeight: viewMode === 'schedule' ? 600 : 500
                }}
              >
                Schedule View
              </Button>
              
              <Button 
                variant="contained" 
                color="secondary" 
                startIcon={<MapIcon />}
                onClick={() => handleViewChange('map')}
                sx={{ 
                  bgcolor: viewMode === 'map' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.15)', 
                  backdropFilter: 'blur(10px)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
                  fontWeight: viewMode === 'map' ? 600 : 500
                }}
              >
                Map View
              </Button>
            </Box>
            
            {/* Decorative Elements */}
            <Box 
              sx={{ 
                position: 'absolute',
                top: -100,
                right: -100,
                width: 300,
                height: 300,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
                zIndex: 0
              }}
            />
          </Box>
          
          {/* Search Component - Only show when NOT in map view */}
          <Box id="search-section">
            {viewMode !== 'map' && (
              <Paper 
                elevation={3} 
                sx={{ 
                  p: 3, 
                  mb: 4, 
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <RoomSearch 
                  onSearch={handleSearch} 
                  onViewModeChange={handleViewChange}
                  currentViewMode={viewMode} 
                />
              </Paper>
            )}
          </Box>
          
          {/* Search Results Controls - Only show when NOT in map view */}
          {viewMode !== 'map' && searchParams && (
            <Fade in={true}>
              <Paper 
                sx={{ 
                  mb: 4, 
                  p: 3, 
                  display: 'flex', 
                  flexDirection: { xs: 'column', sm: 'row' }, 
                  gap: 2, 
                  alignItems: { xs: 'stretch', sm: 'center' }, 
                  justifyContent: 'space-between',
                  borderRadius: 3,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  border: '1px solid rgba(0,0,0,0.05)'
                }}
              >
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Search Results
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Showing {rooms.length} available room{rooms.length !== 1 ? 's' : ''} for{' '}
                    {new Date(searchParams.startTime).toLocaleString()} to{' '}
                    {new Date(searchParams.endTime).toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button 
                    variant="outlined" 
                    startIcon={<FilterAltOffIcon />}
                    onClick={clearSearch}
                    sx={{ 
                      borderRadius: '20px',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                      }
                    }}
                  >
                    Clear Filters
                  </Button>
                  <Button 
                    variant="outlined" 
                    startIcon={<RefreshIcon />}
                    onClick={() => setLastRefresh(Date.now())}
                    sx={{ 
                      borderRadius: '20px',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                      }
                    }}
                  >
                    Refresh
                  </Button>
                </Box>
              </Paper>
            </Fade>
          )}
          
          {/* Show loading indicator for searches - Only when NOT in map view */}
          {viewMode !== 'map' && searching && (
            <Box sx={{ width: '100%', mb: 3 }}>
              <LinearProgress sx={{ height: 6, borderRadius: 3 }} />
            </Box>
          )}
          
          {/* Main Content Area */}
          <Box>
            {/* Show any errors at the top level only once */}
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 4,
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                }} 
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            )}
            
            {/* View Mode Content */}
            {viewMode === 'list' && (
              <Fade in={true} timeout={500}>
                <Box>
                  {/* Action bar with filters/sorting */}
                  <Paper 
                    sx={{ 
                      p: 2, 
                      mb: 3, 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderRadius: 3,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                    }}
                  >
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        fontWeight: 600
                      }}
                    >
                      <AppRegistrationIcon sx={{ mr: 1 }} />
                      {searchParams ? 'Available Rooms' : 'All Rooms'}
                      <Chip 
                        label={`${rooms.length} rooms`} 
                        size="small" 
                        sx={{ ml: 2 }}
                      />
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        startIcon={<SortIcon />}
                        endIcon={<KeyboardArrowDownIcon />}
                        onClick={handleSortClick}
                        sx={{ 
                          borderRadius: '20px',
                          '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }
                        }}
                      >
                        Sort
                      </Button>
                      <Menu
                        id="sort-menu"
                        anchorEl={sortAnchorEl}
                        open={Boolean(sortAnchorEl)}
                        onClose={handleSortClose}
                        anchorOrigin={{
                          vertical: 'bottom',
                          horizontal: 'right',
                        }}
                        transformOrigin={{
                          vertical: 'top',
                          horizontal: 'right',
                        }}
                      >
                        <MenuItem 
                          onClick={() => handleSortChange('recommended')}
                          selected={sortMethod === 'recommended'}
                        >
                          Recommended
                        </MenuItem>
                        <MenuItem 
                          onClick={() => handleSortChange('popularity')}
                          selected={sortMethod === 'popularity'}
                        >
                          Most Popular
                        </MenuItem>
                        <MenuItem 
                          onClick={() => handleSortChange('capacity-high')}
                          selected={sortMethod === 'capacity-high'}
                        >
                          Capacity (High to Low)
                        </MenuItem>
                        <MenuItem 
                          onClick={() => handleSortChange('capacity-low')}
                          selected={sortMethod === 'capacity-low'}
                        >
                          Capacity (Low to High)
                        </MenuItem>
                        <MenuItem 
                          onClick={() => handleSortChange('name-asc')}
                          selected={sortMethod === 'name-asc'}
                        >
                          Name (A-Z)
                        </MenuItem>
                        <MenuItem 
                          onClick={() => handleSortChange('name-desc')}
                          selected={sortMethod === 'name-desc'}
                        >
                          Name (Z-A)
                        </MenuItem>
                      </Menu>
                    </Box>
                  </Paper>
                  
                  {/* Room Listing */}
                  {rooms.length === 0 ? (
                    roomsLoading ? (
                      renderLoadingPlaceholders
                    ) : (
                      <Paper 
                        sx={{ 
                          p: 5, 
                          textAlign: 'center',
                          borderRadius: 3,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                        }}
                      >
                        <Box 
                          sx={{ 
                            width: 120, 
                            height: 120, 
                            borderRadius: '50%', 
                            bgcolor: 'rgba(247, 105, 2, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mx: 'auto',
                            mb: 3
                          }}
                        >
                          <SearchIcon sx={{ fontSize: 50, color: theme.palette.primary.main }} />
                        </Box>
                        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                          {searchParams 
                            ? 'No rooms available for the selected criteria' 
                            : 'No rooms found in the system'}
                        </Typography>
                        <Typography color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
                          {searchParams 
                            ? 'Try adjusting your search filters to find more available rooms.' 
                            : 'The room database appears to be empty. Please contact the administrator.'}
                        </Typography>
                        {searchParams && (
                          <Button 
                            variant="contained" 
                            color="primary"
                            sx={{ 
                              mt: 2,
                              borderRadius: 30,
                              px: 4,
                              py: 1.5,
                              boxShadow: '0 4px 12px rgba(247, 105, 2, 0.3)',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 6px 16px rgba(247, 105, 2, 0.4)'
                              }
                            }}
                            onClick={clearSearch}
                          >
                            Clear Search Filters
                          </Button>
                        )}
                      </Paper>
                    )
                  ) : (
                    <>
                      {!searchParams && popularRooms.length > 0 && (
                        <Box sx={{ mb: 4 }}>
                          <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                            Popular Rooms
                          </Typography>
                          <Grid container spacing={3}>
                            {popularRooms.map((room) => (
                              <Grid item xs={12} md={4} key={room.id}>
                                <RoomCard 
                                  room={room} 
                                  isPopular={true}
                                  availabilityStatus={getAvailabilityStatus(room.id)}
                                />
                              </Grid>
                            ))}
                          </Grid>
                          <Divider sx={{ my: 4 }} />
                        </Box>
                      )}
                      
                      <Grid container spacing={3}>
                        {displayedRooms.map((room) => (
                          <Grid item xs={12} sm={6} md={4} key={room.id}>
                            <RoomCard 
                              room={room}
                              availabilityStatus={getAvailabilityStatus(room.id)}
                            />
                          </Grid>
                        ))}
                      </Grid>
                      
                      {/* Load more button */}
                      {displayedRooms.length < rooms.length && (
                        <Box sx={{ mt: 5, textAlign: 'center' }}>
                          <Button 
                            variant="outlined" 
                            onClick={loadMoreRooms}
                            disabled={loadingMore}
                            endIcon={loadingMore ? <CircularProgress size={20} /> : null}
                            sx={{ 
                              py: 1.5,
                              px: 4,
                              borderRadius: 30,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                              }
                            }}
                          >
                            {loadingMore ? 'Loading...' : `Load More (Showing ${displayedRooms.length} of ${rooms.length})`}
                          </Button>
                        </Box>
                      )}
                    </>
                  )}
                </Box>
              </Fade>
            )}
            
            {viewMode === 'schedule' && (
              <Fade in={true} timeout={500}>
                <Box>
                  <Paper 
                    sx={{ 
                      p: 2, 
                      mb: 3, 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderRadius: 3,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                    }}
                  >
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        fontWeight: 600
                      }}
                    >
                      <CalendarViewDayIcon sx={{ mr: 1 }} />
                      Room Schedule
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={() => setLastRefresh(Date.now())}
                        sx={{ 
                          borderRadius: '20px',
                          '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }
                        }}
                      >
                        Refresh
                      </Button>
                    </Box>
                  </Paper>
                  
                  {/* Show reservation loading indicator */}
                  {reservationsLoading && (
                    <Box sx={{ width: '100%', mb: 3 }}>
                      <LinearProgress sx={{ height: 6, borderRadius: 3 }} />
                    </Box>
                  )}
                  
                  {rooms.length === 0 ? (
                    roomsLoading ? (
                      renderLoadingPlaceholders
                    ) : (
                      <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 3 }}>
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
                      reservations={reservations || {}}
                      date={scheduleDate}
                      onDateChange={handleScheduleDateChange}
                      loading={roomsLoading || reservationsLoading}
                    />
                  )}
                  
                  {/* Load more button for schedule view */}
                  {displayedRooms.length < rooms.length && (
                    <Box sx={{ mt: 4, textAlign: 'center' }}>
                      <Button 
                        variant="outlined" 
                        onClick={loadMoreRooms}
                        disabled={loadingMore}
                        endIcon={loadingMore ? <CircularProgress size={20} /> : null}
                        sx={{ 
                          py: 1.5,
                          px: 4,
                          borderRadius: 30,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                          }
                        }}
                      >
                        {loadingMore ? 'Loading...' : `Load More Rooms (Showing ${displayedRooms.length} of ${rooms.length})`}
                      </Button>
                    </Box>
                  )}
                </Box>
              </Fade>
            )}
            
            {viewMode === 'map' && (
              <Fade in={true} timeout={500}>
                <Box>
                  <Paper 
                    sx={{ 
                      p: 2, 
                      mb: 3, 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderRadius: 3,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                    }}
                  >
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        fontWeight: 600
                      }}
                    >
                      <MapIcon sx={{ mr: 1 }} />
                      Interactive Map
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={() => setLastRefresh(Date.now())}
                        sx={{ 
                          borderRadius: '20px',
                          '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }
                        }}
                      >
                        Refresh
                      </Button>
                    </Box>
                  </Paper>
                  
                  {roomsLoading ? (
                    <Box sx={{ width: '100%', mb: 3 }}>
                      <LinearProgress sx={{ height: 6, borderRadius: 3, mb: 4 }} />
                      <Skeleton variant="rectangular" width="100%" height={600} sx={{ borderRadius: 3 }} />
                    </Box>
                  ) : (
                    <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                      <EnhancedRoomVisualizer 
                        rooms={rooms}
                        reservations={reservations}
                        selectedDate={searchParams?.startTime ? new Date(searchParams.startTime) : new Date()}
                      />
                    </Paper>
                  )}
                </Box>
              </Fade>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

export default Rooms;
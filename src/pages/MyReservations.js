import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  CardActions,
  Chip,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  LinearProgress,
  Tooltip,
  Alert,
  Tab,
  Tabs,
  useTheme
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { getUserReservations, cancelReservation, getRoom, getUserDailyBookings } from '../services/roomService';

// Icons
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GroupIcon from '@mui/icons-material/Group';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import CancelIcon from '@mui/icons-material/Cancel';
import AddIcon from '@mui/icons-material/Add';
import RequestHoursForm from '../components/booking/RequestHoursForm';
import { getUserHourRequests, getUserHourAllowance } from '../services/userService';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import { respondToCollaboration } from '../services/roomService';

function MyReservations() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  
  // Reservations data
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  
  // Daily booking tracking
  const [todayBookings, setTodayBookings] = useState([]);
  const [dailyHoursUsed, setDailyHoursUsed] = useState(0);
  const [dailyHoursRemaining, setDailyHoursRemaining] = useState(5);
  
  // UI state
  const [activeTab, setActiveTab] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  //HoursRequest
  const [requestFormOpen, setRequestFormOpen] = useState(false);
  const [hourRequests, setHourRequests] = useState([]);
  const [dailyLimit, setDailyLimit] = useState(5);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const [invitedReservations, setInvitedReservations] = useState([]);
  const [respondingToInvite, setRespondingToInvite] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
  
    const fetchReservations = async () => {
      try {
        setLoading(true);
        setError(null);

        // Ensure currentUser and currentUser.email are available before proceeding
        if (!currentUser || !currentUser.email) {
          console.log("User not logged in or email unavailable.");
          setLoading(false);
          // Optionally, redirect to login or show a message
          // navigate('/login');
          return;
        }

        // Get all user reservations (primary and collaborative)
        // Pass both userId (currentUser.uid) and userEmail (currentUser.email)
        const reservationsData = await getUserReservations(currentUser.uid, currentUser.email);

        // Separate into owned and invited reservations
        const ownedReservations = reservationsData.filter(res => res.isPrimaryBooker);
        const invited = reservationsData.filter(res => !res.isPrimaryBooker);

        // Fetch room details for each reservation
        const processReservations = async (reservationsList) => {
          return await Promise.all(
            reservationsList.map(async (reservation) => {
              try {
                // Make sure roomId exists before fetching
                if (!reservation.roomId) {
                    console.warn(`Reservation ${reservation.id} is missing roomId.`);
                    return reservation; // Return reservation without room data
                }
                const roomData = await getRoom(reservation.roomId);
                return { ...reservation, room: roomData };
              } catch (err) {
                console.error(`Error fetching room (${reservation.roomId}) for reservation ${reservation.id}:`, err);
                return reservation; // Return reservation even if room fetch fails
              }
            })
          );
        };

        const reservationsWithRooms = await processReservations(ownedReservations);
        const invitedWithRooms = await processReservations(invited);

        setReservations(reservationsWithRooms);
        setInvitedReservations(invitedWithRooms);

        // Get today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1); // Start of tomorrow

        // Set loading state for requests/allowance
        setLoading(false); // Indicate main loading is done
        setLoadingRequests(true); // Start loading requests/allowance

        try {
          // Get user hour requests and allowance
          const requests = await getUserHourRequests(currentUser.uid);
          setHourRequests(requests);

          const allowance = await getUserHourAllowance(currentUser.uid);
          const userDailyLimit = allowance.dailyHours || 5; // Default to 5 if not set
          setDailyLimit(userDailyLimit);

          // Get today's bookings using the correct daily limit
          const result = await getUserDailyBookings(currentUser.uid, today, tomorrow);
          setTodayBookings(result.bookings || []);
          setDailyHoursUsed(result.totalHoursBooked || 0);

          const remaining = Math.max(0, userDailyLimit - (result.totalHoursBooked || 0));
          setDailyHoursRemaining(remaining);

          setLoadingRequests(false); // Finish loading requests/allowance
        } catch (requestErr) {
          console.error("Error fetching hour requests or allowance:", requestErr);
          setError("Failed to load daily booking limits."); // Set specific error
          setLoadingRequests(false);
        }

      } catch (err) {
        console.error("Error fetching reservations data:", err);
        setError("Failed to load reservations. Please try again.");
        setLoading(false); // Ensure loading stops on error
        setLoadingRequests(false); // Ensure this stops too
      }
    };
  
    fetchReservations();
  }, [currentUser, navigate, refreshTrigger]);


  const handleRespondToInvite = async (reservationId, response) => {
    try {
      setRespondingToInvite(true);
      
      await respondToCollaboration(reservationId, currentUser.uid, response);
      
      // Refresh the reservations
      setRefreshTrigger(prev => prev + 1);
      
      setRespondingToInvite(false);
    } catch (err) {
      console.error("Error responding to invitation:", err);
      setError("Failed to respond to invitation. Please try again.");
      setRespondingToInvite(false);
    }
  };
  
  const handleCancelReservation = async () => {
    if (!selectedReservation) return;
    
    try {
      await cancelReservation(selectedReservation.id);
      
      // Update the local state by setting status to cancelled
      setReservations(reservations.map(reservation => 
        reservation.id === selectedReservation.id 
          ? { ...reservation, status: 'cancelled' } 
          : reservation
      ));
      
      // Trigger a refresh to update daily hours
      setRefreshTrigger(prev => prev + 1);
      
      setCancelDialogOpen(false);
      setSelectedReservation(null);
    } catch (err) {
      console.error("Error cancelling reservation:", err);
      setError("Failed to cancel reservation. Please try again.");
    }
  };

  const openCancelDialog = (reservation) => {
    setSelectedReservation(reservation);
    setCancelDialogOpen(true);
  };

  // Helper function to get status chip - moved inside the component
  const getStatusChip = (status) => {
    switch (status) {
      case 'confirmed':
        return <Chip label="Confirmed" color="success" size="small" />;
      case 'pending':
        return <Chip label="Pending" color="warning" size="small" />;
      case 'cancelled':
        return <Chip label="Cancelled" color="error" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  const isUpcoming = (startTimeSeconds) => {
    const startTime = new Date(startTimeSeconds * 1000);
    return startTime > new Date();
  };
  
  const isPast = (endTimeSeconds) => {
    const endTime = new Date(endTimeSeconds * 1000);
    return endTime < new Date();
  };

  const isToday = (startTimeSeconds) => {
    const startTime = new Date(startTimeSeconds * 1000);
    const today = new Date();
    return startTime.getDate() === today.getDate() && 
           startTime.getMonth() === today.getMonth() && 
           startTime.getFullYear() === today.getFullYear();
  };
  
  const formatTimeRange = (startTime, endTime) => {
    const start = new Date(startTime.seconds * 1000);
    const end = new Date(endTime.seconds * 1000);
    
    const startFormat = start.toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'});
    const endFormat = end.toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'});
    
    return `${startFormat} - ${endFormat}`;
  };
  
  const formatDate = (timestamp) => {
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString([], {weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'});
  };

  // Daily Booking Summary Component
  const DailyBookingSummary = () => {
    const percentUsed = (dailyHoursUsed / dailyLimit) * 100;
    
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Today's Booking Summary
          </Typography>
          <Button 
            variant="contained" 
            size="small"
            startIcon={dailyHoursRemaining > 0 ? <AddIcon /> : null}
            onClick={dailyHoursRemaining > 0 ? () => navigate('/rooms') : () => setRequestFormOpen(true)}
            color={dailyHoursRemaining > 0 ? "primary" : "warning"}
          >
            {dailyHoursRemaining > 0 ? "Book Another Room" : "Request More Hours"}
          </Button>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle2">
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
          <Button 
            variant="outlined"
            size="small"
            onClick={() => setRequestFormOpen(true)}
          >
            Request More Hours
          </Button>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box sx={{ flexGrow: 1, mr: 1 }}>
            <Tooltip title={`${dailyHoursUsed.toFixed(1)} hours used out of ${dailyLimit} hour daily limit`}>
              <LinearProgress 
                variant="determinate" 
                value={Math.min(percentUsed, 100)} 
                color={percentUsed > 80 ? "error" : "primary"}
                sx={{ height: 10, borderRadius: 5 }} 
              />
            </Tooltip>
          </Box>
          <Typography variant="body2" color="textSecondary" sx={{ minWidth: 70, textAlign: 'right' }}>
            {dailyHoursUsed.toFixed(1)}/{dailyLimit} hrs
          </Typography>
        </Box>
        
        <Typography 
          variant="body2" 
          color={dailyHoursRemaining <= 0 ? "error.main" : "textSecondary"}
          sx={{ fontWeight: dailyHoursRemaining <= 0 ? 'medium' : 'normal', mb: 2 }}
        >
          {dailyHoursRemaining <= 0 
            ? "You've reached your daily booking limit. Request more Hours" 
            : `You can book ${dailyHoursRemaining.toFixed(1)} more hours today (${dailyHoursUsed.toFixed(1)}/${dailyLimit} hours used)`}
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        {todayBookings.length > 0 ? (
          <>
            <Typography variant="subtitle2" gutterBottom>
              Your bookings for today:
            </Typography>
            {todayBookings.map((booking, index) => (
              <Box 
                key={index} 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  borderBottom: index < todayBookings.length - 1 ? '1px solid #eee' : 'none',
                  py: 1
                }}
              >
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {booking.room?.name || 'Unknown Room'}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {formatTimeRange(booking.startTime, booking.endTime)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Chip 
                    label={`${booking.durationHours?.toFixed(1) || '1.0'} hrs`} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                    sx={{ mr: 1 }}
                  />
                  {booking.status !== 'cancelled' && isUpcoming(booking.startTime.seconds) && (
                    <Button 
                      size="small" 
                      color="error" 
                      variant="outlined"
                      onClick={() => openCancelDialog(booking)}
                    >
                      Cancel
                    </Button>
                  )}
                </Box>
              </Box>
            ))}
          </>
        ) : (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
              You don't have any bookings for today
            </Typography>
            <Button 
              variant="outlined" 
              startIcon={<AddIcon />}
              sx={{ mt: 2 }}
              onClick={() => navigate('/rooms')}
            >
              Book a Room
            </Button>
          </Box>
        )}
        
        {/* Hour requests section - shows pending requests */}
        {hourRequests.some(req => req.status === 'pending') && (
          <Box sx={{ mt: 3, pt: 2, borderTop: '1px dashed #ddd' }}>
            <Typography variant="subtitle2" gutterBottom>
              Pending hour extension requests:
            </Typography>
            {hourRequests
              .filter(req => req.status === 'pending')
              .map((request, index) => (
                <Box 
                  key={index}
                  sx={{ 
                    p: 1.5, 
                    bgcolor: 'rgba(255, 152, 0, 0.1)', 
                    borderRadius: 1,
                    mt: 1
                  }}
                >
                  <Typography variant="body2">
                    <strong>+{request.hoursRequested} hours</strong> - {request.reason.substring(0, 80)}
                    {request.reason.length > 80 ? '...' : ''}
                  </Typography>
                  <Chip 
                    label="Pending approval" 
                    size="small" 
                    color="warning" 
                    sx={{ mt: 1, height: 20, fontSize: '0.65rem' }}
                  />
                </Box>
            ))}
          </Box>
        )}
      </Paper>
    );
  };
  
  
  // Tab change handler
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography>Loading your reservations...</Typography>
      </Box>
    </Container>
  );

  if (error) return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          color="primary"
          sx={{ mt: 2 }}
          onClick={() => setRefreshTrigger(prev => prev + 1)}
        >
          Try Again
        </Button>
      </Box>
    </Container>
  );

  // Split reservations into categories
  const upcomingReservations = reservations.filter(res => 
    isUpcoming(res.startTime.seconds) && res.status !== 'cancelled'
  );
  
  const todayReservations = reservations.filter(res => 
    isToday(res.startTime.seconds) && res.status !== 'cancelled'
  );
  
  const pastReservations = reservations.filter(res => 
    isPast(res.endTime.seconds) || res.status === 'cancelled'
  );

  // Reservation Card Component
  const ReservationCard = ({ reservation, onCancel, isPast, isToday }) => {
    const isUpcomingRes = !isPast && reservation.status !== 'cancelled';
    
    // Calculate if reservation is happening now
    const now = new Date();
    const startTime = new Date(reservation.startTime.seconds * 1000);
    const endTime = new Date(reservation.endTime.seconds * 1000);
    const isHappeningNow = now >= startTime && now <= endTime;
    
    // Format date and time
    const formatTime = (timestamp) => {
      const date = new Date(timestamp.seconds * 1000);
      return date.toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'});
    };
    
    const formatDay = (timestamp) => {
      const date = new Date(timestamp.seconds * 1000);
      return date.toLocaleDateString([], {weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'});
    };
    
    return (
      <Card sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative',
        opacity: reservation.status === 'cancelled' ? 0.7 : 1,
        border: isHappeningNow ? `2px solid ${theme.palette.success.main}` : 'none'
      }}>
        {isHappeningNow && (
          <Box 
            sx={{ 
              position: 'absolute', 
              top: 12, 
              right: 0,
              bgcolor: theme.palette.success.main,
              color: 'white',
              py: 0.5,
              px: 2,
              borderRadius: '4px 0 0 4px',
              fontWeight: 600,
              fontSize: '0.75rem',
              zIndex: 1,
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}
          >
            Happening Now
          </Box>
        )}
        
        <CardContent sx={{ flexGrow: 1, p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Typography variant="h6" component="h2">
              {reservation.room?.name || 'Unknown Room'}
            </Typography>
            {getStatusChip(reservation.status)}
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <LocationOnIcon fontSize="small" color="action" sx={{ mr: 1 }} />
            <Typography variant="body2" color="text.secondary" noWrap>
              {reservation.room?.location || 'Unknown Location'}
            </Typography>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <EventIcon fontSize="small" color="action" sx={{ mr: 1 }} />
            <Typography variant="body2">
              {formatDay(reservation.startTime)}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <AccessTimeIcon fontSize="small" color="action" sx={{ mr: 1 }} />
            <Typography variant="body2">
              {formatTime(reservation.startTime)} - {formatTime(reservation.endTime)}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
            <GroupIcon fontSize="small" color="action" sx={{ mr: 1, mt: 0.5 }} />
            <Box>
              <Typography variant="body2">
                {reservation.attendees} {reservation.attendees === 1 ? 'person' : 'people'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {reservation.purpose}
              </Typography>
            </Box>
          </Box>
          {reservation.collaborators && reservation.collaborators.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Collaborators
              </Typography>
              {reservation.collaborators.map((collab, index) => (
                <Chip
                  key={index}
                  size="small"
                  label={collab.email}
                  icon={<PeopleIcon />}
                  color={
                    collab.status === 'accepted' ? 'success' :
                    collab.status === 'declined' ? 'error' :
                    'default'
                  }
                  variant="outlined"
                  sx={{ mr: 0.5, mb: 0.5 }}
                />
              ))}
            </Box>
          )}
        </CardContent>
        
        <CardActions sx={{ p: 2, pt: 0 }}>
          {isUpcomingRes && (
            <Button 
              size="small" 
              color="error" 
              onClick={() => onCancel(reservation)}
              startIcon={<CancelIcon />}
            >
              Cancel
            </Button>
          )}
          <Button 
            size="small" 
            onClick={() => window.location.href = `/rooms/${reservation.roomId}`}
            sx={{ ml: 'auto' }}
          >
            View Room
          </Button>
        </CardActions>
      </Card>
    );
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Reservations
        </Typography>
        
        {/* Daily Booking Summary */}
        {currentUser && <DailyBookingSummary />}
        
        {/* Reservations Content */}
        {reservations.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>You don't have any reservations yet</Typography>
            <Typography color="textSecondary" sx={{ mb: 3 }}>
              Book a room to see your reservations here
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => navigate('/rooms')}
            >
              Find a Room to Book
            </Button>
          </Paper>
        ) : (
          <>
            {/* Tabs Navigation */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs 
                value={activeTab} 
                onChange={handleTabChange} 
                aria-label="reservation tabs"
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab 
                  label={<Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <EventAvailableIcon sx={{ mr: 1 }} fontSize="small" />
                    Upcoming ({upcomingReservations.length})
                  </Box>} 
                  id="tab-0" 
                />
                <Tab 
                  label={<Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccessTimeIcon sx={{ mr: 1 }} fontSize="small" />
                    Today ({todayReservations.length})
                  </Box>} 
                  id="tab-1" 
                />
                <Tab 
                  label={<Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <EventIcon sx={{ mr: 1 }} fontSize="small" />
                    Past & Cancelled ({pastReservations.length})
                  </Box>} 
                  id="tab-2" 
                />
                <Tab 
                  label={<Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PersonAddIcon sx={{ mr: 1 }} fontSize="small" />
                    Invitations ({invitedReservations.length})
                  </Box>} 
                  id="tab-3" 
                />
              </Tabs>
            </Box>
            
            {/* Tab Content */}
            <Box role="tabpanel" hidden={activeTab !== 0}>
              {activeTab === 0 && (
                <Grid container spacing={3}>
                  {upcomingReservations.length > 0 ? (
                    upcomingReservations.map((reservation) => (
                      <Grid item xs={12} md={6} key={reservation.id}>
                        <ReservationCard 
                          reservation={reservation}
                          onCancel={openCancelDialog}
                        />
                      </Grid>
                    ))
                  ) : (
                    <Grid item xs={12}>
                      <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ mb: 1 }}>
                          No upcoming reservations
                        </Typography>
                        <Typography color="textSecondary" sx={{ mb: 2 }}>
                          You don't have any upcoming room bookings
                        </Typography>
                        <Button 
                          variant="contained" 
                          color="primary"
                          onClick={() => navigate('/rooms')}
                        >
                          Book a Room
                        </Button>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              )}
            </Box>
            
            <Box role="tabpanel" hidden={activeTab !== 1}>
              {activeTab === 1 && (
                <Grid container spacing={3}>
                  {todayReservations.length > 0 ? (
                    todayReservations.map((reservation) => (
                      <Grid item xs={12} md={6} key={reservation.id}>
                        <ReservationCard 
                          reservation={reservation}
                          onCancel={openCancelDialog}
                          isToday
                        />
                      </Grid>
                    ))
                  ) : (
                    <Grid item xs={12}>
                      <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ mb: 1 }}>
                          No reservations for today
                        </Typography>
                        <Typography color="textSecondary" sx={{ mb: 2 }}>
                          You don't have any bookings scheduled for today
                        </Typography>
                        <Button 
                          variant="contained" 
                          color="primary"
                          onClick={() => navigate('/rooms')}
                          disabled={dailyHoursRemaining <= 0}
                        >
                          {dailyHoursRemaining > 0 
                            ? "Book a Room Today" 
                            : "Daily Limit Reached"}
                        </Button>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              )}
            </Box>
            
            <Box role="tabpanel" hidden={activeTab !== 2}>
              {activeTab === 2 && (
                <Grid container spacing={3}>
                  {pastReservations.length > 0 ? (
                    pastReservations.map((reservation) => (
                      <Grid item xs={12} md={6} key={reservation.id}>
                        <ReservationCard 
                          reservation={reservation}
                          isPast
                        />
                      </Grid>
                    ))
                  ) : (
                    <Grid item xs={12}>
                      <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h6">
                          No past reservations
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              )}
            </Box>
            <Box role="tabpanel" hidden={activeTab !== 3}>
              {activeTab === 3 && (
                <Grid container spacing={3}>
                  {invitedReservations.length > 0 ? (
                    invitedReservations.map((reservation) => (
                      <Grid item xs={12} md={6} key={reservation.id}>
                        <Card sx={{ 
                          height: '100%', 
                          display: 'flex', 
                          flexDirection: 'column',
                          position: 'relative',
                          border: '2px dashed #f0c14b'
                        }}>
                          <Box 
                            sx={{ 
                              position: 'absolute', 
                              top: 12, 
                              right: 0,
                              bgcolor: '#f0c14b',
                              color: 'white',
                              py: 0.5,
                              px: 2,
                              borderRadius: '4px 0 0 4px',
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              zIndex: 1,
                              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            }}
                          >
                            Invitation
                          </Box>
                          
                          <CardContent sx={{ flexGrow: 1, p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                              <Typography variant="h6" component="h2">
                                {reservation.room?.name || 'Unknown Room'}
                              </Typography>
                              {getStatusChip(reservation.status)}
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                              <LocationOnIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                              <Typography variant="body2" color="text.secondary" noWrap>
                                {reservation.room?.location || 'Unknown Location'}
                              </Typography>
                            </Box>
                            
                            <Divider sx={{ my: 2 }} />
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <EventIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                              <Typography variant="body2">
                                {formatDate(reservation.startTime)}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <AccessTimeIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                              <Typography variant="body2">
                                {formatTimeRange(reservation.startTime, reservation.endTime)}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                              <PeopleIcon fontSize="small" color="action" sx={{ mr: 1, mt: 0.5 }} />
                              <Box>
                                <Typography variant="body2">
                                  Invited by: {reservation.userEmail || 'Unknown'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                  {reservation.purpose || 'No purpose specified'}
                                </Typography>
                              </Box>
                            </Box>
                          </CardContent>
                          
                          <CardActions sx={{ p: 2, pt: 0 }}>
                            <Button 
                              size="small" 
                              color="success" 
                              onClick={() => handleRespondToInvite(reservation.id, 'accepted')}
                              startIcon={<ThumbUpIcon />}
                              disabled={respondingToInvite || reservation.collaborationStatus === 'accepted'}
                            >
                              {reservation.collaborationStatus === 'accepted' ? 'Accepted' : 'Accept'}
                            </Button>
                            
                            <Button 
                              size="small" 
                              color="error" 
                              onClick={() => handleRespondToInvite(reservation.id, 'declined')}
                              startIcon={<ThumbDownIcon />}
                              disabled={respondingToInvite || reservation.collaborationStatus === 'declined'}
                            >
                              {reservation.collaborationStatus === 'declined' ? 'Declined' : 'Decline'}
                            </Button>
                            
                            <Button 
                              size="small" 
                              onClick={() => window.location.href = `/rooms/${reservation.roomId}`}
                              sx={{ ml: 'auto' }}
                            >
                              View Room
                            </Button>
                          </CardActions>
                        </Card>
                      </Grid>
                    ))
                  ) : (
                    <Grid item xs={12}>
                      <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ mb: 1 }}>
                          No invitations
                        </Typography>
                        <Typography color="textSecondary" sx={{ mb: 2 }}>
                          You don't have any pending room invitations
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              )}
            </Box>
          </>
        )}
      </Box>
      
      
      {/* Confirmation Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
      >
        <DialogTitle>Cancel Reservation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel this reservation? This action cannot be undone.
          </DialogContentText>
          {selectedReservation && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: 1 }}>
              <Typography variant="subtitle2">
                {selectedReservation.room?.name || 'Unknown Room'}
              </Typography>
              <Typography variant="body2">
                {formatDate(selectedReservation.startTime)}
              </Typography>
              <Typography variant="body2">
                {formatTimeRange(selectedReservation.startTime, selectedReservation.endTime)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>No, Keep It</Button>
          <Button 
            onClick={handleCancelReservation} 
            color="error" 
            variant="contained"
            startIcon={<CancelIcon />}
          >
            Yes, Cancel Reservation
          </Button>
        </DialogActions>
      </Dialog>
      
      <RequestHoursForm 
        open={requestFormOpen}
        onClose={() => setRequestFormOpen(false)}
        onSuccess={() => setRefreshTrigger(prev => prev + 1)}
      />
    </Container>
  );
}

export default MyReservations;
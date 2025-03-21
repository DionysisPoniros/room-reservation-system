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
  DialogTitle
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { getUserReservations, cancelReservation, getRoom } from '../services/roomService';

function MyReservations() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const fetchReservations = async () => {
      try {
        setLoading(true);
        const reservationsData = await getUserReservations(currentUser.uid);
        
        // Fetch room details for each reservation
        const reservationsWithRooms = await Promise.all(
          reservationsData.map(async (reservation) => {
            const roomData = await getRoom(reservation.roomId);
            return { ...reservation, room: roomData };
          })
        );
        
        // Sort by start time (most recent first)
        reservationsWithRooms.sort((a, b) => b.startTime.seconds - a.startTime.seconds);
        
        setReservations(reservationsWithRooms);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching reservations:", err);
        setError("Failed to load reservations. Please try again.");
        setLoading(false);
      }
    };

    fetchReservations();
  }, [currentUser, navigate]);

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

  if (loading) return <Typography>Loading your reservations...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Reservations
        </Typography>
        
        {reservations.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6">You don't have any reservations yet</Typography>
            <Button 
              variant="contained" 
              color="primary"
              sx={{ mt: 2 }}
              onClick={() => navigate('/rooms')}
            >
              Find a Room to Book
            </Button>
          </Paper>
        ) : (
          <>
            <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
              Upcoming Reservations
            </Typography>
            <Grid container spacing={3}>
              {reservations
                .filter(res => isUpcoming(res.startTime.seconds) && res.status !== 'cancelled')
                .map((reservation) => (
                  <Grid item xs={12} md={6} key={reservation.id}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography variant="h6" component="h2">
                            {reservation.room?.name || 'Unknown Room'}
                          </Typography>
                          {getStatusChip(reservation.status)}
                        </Box>
                        
                        <Typography color="text.secondary">
                          {reservation.room?.location || 'Unknown Location'}
                        </Typography>
                        
                        <Divider sx={{ my: 1 }} />
                        
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Date:</strong> {new Date(reservation.startTime.seconds * 1000).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Time:</strong> {new Date(reservation.startTime.seconds * 1000).toLocaleTimeString()} - {new Date(reservation.endTime.seconds * 1000).toLocaleTimeString()}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Purpose:</strong> {reservation.purpose}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Attendees:</strong> {reservation.attendees}
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button 
                          size="small" 
                          color="error" 
                          onClick={() => openCancelDialog(reservation)}
                        >
                          Cancel Reservation
                        </Button>
                        <Button 
                          size="small" 
                          onClick={() => navigate(`/rooms/${reservation.roomId}`)}
                        >
                          View Room
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
            </Grid>
            
            <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
              Past & Cancelled Reservations
            </Typography>
            <Grid container spacing={3}>
              {reservations
                .filter(res => !isUpcoming(res.startTime.seconds) || res.status === 'cancelled')
                .map((reservation) => (
                  <Grid item xs={12} md={6} key={reservation.id}>
                    <Card sx={{ opacity: 0.7 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography variant="h6" component="h2">
                            {reservation.room?.name || 'Unknown Room'}
                          </Typography>
                          {getStatusChip(reservation.status)}
                        </Box>
                        
                        <Typography color="text.secondary">
                          {reservation.room?.location || 'Unknown Location'}
                        </Typography>
                        
                        <Divider sx={{ my: 1 }} />
                        
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Date:</strong> {new Date(reservation.startTime.seconds * 1000).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Time:</strong> {new Date(reservation.startTime.seconds * 1000).toLocaleTimeString()} - {new Date(reservation.endTime.seconds * 1000).toLocaleTimeString()}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Purpose:</strong> {reservation.purpose}
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button 
                          size="small" 
                          onClick={() => navigate(`/rooms/${reservation.roomId}`)}
                        >
                          View Room
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
            </Grid>
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>No, Keep It</Button>
          <Button onClick={handleCancelReservation} color="error">
            Yes, Cancel Reservation
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default MyReservations;
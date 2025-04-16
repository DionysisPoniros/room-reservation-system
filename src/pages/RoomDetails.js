// src/pages/RoomDetails.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Paper, 
  Grid, 
  Chip,
  Card,
  CardMedia,
  Skeleton,
  Divider,
  useTheme,
  Alert
} from '@mui/material';
import { getRoom, getRoomReservations } from '../services/roomService';

// Icons
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import PeopleIcon from '@mui/icons-material/People';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EventIcon from '@mui/icons-material/Event';
import ComputerIcon from '@mui/icons-material/Computer';
import VideocamIcon from '@mui/icons-material/Videocam';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import WbIncandescentIcon from '@mui/icons-material/WbIncandescent';

function RoomDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [room, setRoom] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);
  
  const filterUpcomingReservations = (reservations) => {
    const now = new Date();
    return reservations.filter(reservation => {
      const endTime = new Date(reservation.endTime.seconds * 1000);
      return endTime >= now && reservation.status !== 'cancelled';
    });
  };
  
  useEffect(() => {
    const fetchRoomDetails = async () => {
      try {
        setLoading(true);
        const roomData = await getRoom(id);
        if (roomData) {
          setRoom(roomData);
          
          // Get reservations for this room
          const reservationsData = await getRoomReservations(id);
          // Filter to only show current and future reservations
          const upcomingReservations = filterUpcomingReservations(reservationsData);
          setReservations(upcomingReservations);
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

  const handleBookRoom = () => {
    navigate(`/rooms/${id}/book`);
  };
  
  // Function to get equipment icons
  const getEquipmentIcons = (equipment = []) => {
    if (!equipment || !equipment.length) return null;
    
    return (
      <Box sx={{ display: 'flex', mt: 1, gap: 1, flexWrap: 'wrap' }}>
        {equipment.includes('Computer') && (
          <Chip 
            icon={<ComputerIcon />} 
            label="Computer" 
            size="small" 
            variant="outlined" 
            sx={{ mb: 1 }}
          />
        )}
        {equipment.includes('Video Conference') && (
          <Chip
            icon={<VideocamIcon />}
            label="Video Conference"
            size="small"
            variant="outlined"
            sx={{ mb: 1 }}
          />
        )}
        {equipment.includes('Smart Board') && (
          <Chip
            icon={<DesktopWindowsIcon />}
            label="Smart Board"
            size="small"
            variant="outlined"
            sx={{ mb: 1 }}
          />
        )}
        {equipment.includes('Projector') && (
          <Chip
            icon={<WbIncandescentIcon />}
            label="Projector"
            size="small"
            variant="outlined"
            sx={{ mb: 1 }}
          />
        )}
        {equipment.filter(item => 
          !['Computer', 'Video Conference', 'Smart Board', 'Projector'].includes(item)
        ).map((item, index) => (
          <Chip
            key={index}
            label={item}
            size="small"
            variant="outlined"
            sx={{ mb: 1 }}
          />
        ))}
      </Box>
    );
  };

  if (loading) return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Skeleton variant="text" width="60%" height={60} />
        <Skeleton variant="rectangular" width="100%" height={300} sx={{ mb: 3 }} />
        <Skeleton variant="rectangular" width="100%" height={200} sx={{ mb: 3 }} />
      </Box>
    </Container>
  );
  
  if (error) return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button 
          variant="contained" 
          color="primary"
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
          variant="contained" 
          color="primary"
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
          {room.name}
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            {/* Room Image */}
            <Card 
              sx={{ 
                width: '100%', 
                mb: 3,
                overflow: 'hidden',
                boxShadow: theme.shadows[2],
                borderRadius: 2
              }}
            >
              {room.imageUrl ? (
                <Box sx={{ position: 'relative' }}>
                  {imageLoading && (
                    <Skeleton 
                      variant="rectangular" 
                      width="100%" 
                      height={300} 
                      animation="wave" 
                    />
                  )}
                  <CardMedia
                    component="img"
                    height={300}
                    image={room.imageUrl}
                    alt={room.name}
                    sx={{ 
                      objectFit: 'cover',
                      display: imageLoading ? 'none' : 'block'
                    }}
                    onLoad={() => setImageLoading(false)}
                    onError={() => setImageLoading(false)}
                  />
                  {room.imageDescription && (
                    <Box 
                      sx={{ 
                        position: 'absolute', 
                        bottom: 0, 
                        left: 0, 
                        right: 0,
                        bgcolor: 'rgba(0, 0, 0, 0.5)',
                        color: 'white',
                        p: 2
                      }}
                    >
                      <Typography variant="body2">
                        {room.imageDescription}
                      </Typography>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box 
                  sx={{ 
                    width: '100%', 
                    height: 300, 
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: '#f5f5f5',
                    border: '1px dashed #cccccc'
                  }}
                >
                  <MeetingRoomIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    No room image available
                  </Typography>
                </Box>
              )}
            </Card>
          </Grid>
          
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>Details</Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                <LocationOnIcon color="action" sx={{ mr: 1, mt: 0.5 }} />
                <Box>
                  <Typography variant="subtitle2">Location</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {room.location || 'No location specified'}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                <PeopleIcon color="action" sx={{ mr: 1, mt: 0.5 }} />
                <Box>
                  <Typography variant="subtitle2">Capacity</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {room.capacity || 'Unknown'} {room.capacity === 1 ? 'person' : 'people'}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                <MeetingRoomIcon color="action" sx={{ mr: 1, mt: 0.5 }} />
                <Box>
                  <Typography variant="subtitle2">Room Type</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {room.type || 'Standard Room'}
                  </Typography>
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Equipment</Typography>
              {getEquipmentIcons(room.equipment)}
              
              {(!room.equipment || room.equipment.length === 0) && (
                <Typography variant="body2" color="text.secondary">
                  No equipment specified
                </Typography>
              )}
              
              {room.description && (
                <>
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>Description</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {room.description}
                  </Typography>
                </>
              )}
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>Availability</Typography>
              
              {reservations.length > 0 ? (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Upcoming Reservations
                  </Typography>
                  
                  {reservations.map((reservation) => (
                    <Paper 
                      key={reservation.id} 
                      sx={{ 
                        p: 2, 
                        mb: 2, 
                        bgcolor: '#f9f9f9',
                        border: '1px solid #eee',
                        borderRadius: 1
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <EventIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                        <Typography variant="body2">
                          {new Date(reservation.startTime.seconds * 1000).toLocaleDateString()} 
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(reservation.startTime.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                        {new Date(reservation.endTime.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    No upcoming reservations
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    This room is available for booking
                  </Typography>
                </Box>
              )}
              
              <Button 
                variant="contained" 
                color="primary"
                onClick={handleBookRoom}
                fullWidth
                size="large"
                sx={{ mt: 2 }}
              >
                Book This Room
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}

export default RoomDetails;
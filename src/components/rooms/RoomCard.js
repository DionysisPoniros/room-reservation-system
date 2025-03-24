// src/components/rooms/RoomCard.js
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardActions, 
  CardMedia,
  Typography, 
  Button, 
  Chip,
  Box,
  Grid,
  Divider,
  useTheme
} from '@mui/material';

// Icons
import PeopleIcon from '@mui/icons-material/People';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import PlaceIcon from '@mui/icons-material/Place';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

// Room image mapping based on building/type
const getRoomImage = (room) => {
  // In a real application, you would have a mapping of actual room images
  // This is a placeholder implementation that would be replaced with actual images
  
  // For demo purposes - in a real application, these would be environment variables or imported
  const campusImages = {
    campus1: "/campus-image-1.jpg", // Brick building with sculpture
    campus2: "/campus-image-2.jpg", // Aerial view of main buildings
    campus3: "/campus-image-3.jpg", // Modern glass building
    campus4: "/campus-image-4.jpg"  // Green campus space
  };
  
  // Determine which image to use based on room properties
  // This is just a simple example - in a real app, you'd use actual room images
  if (room.type === "Lecture Hall") {
    return campusImages.campus1;
  } else if (room.type === "Lab") {
    return campusImages.campus3;
  } else if (room.type === "Meeting Room") {
    return campusImages.campus2;
  } else {
    return campusImages.campus4;
  }
};

function RoomCard({ room, isPopular = false }) {
  const theme = useTheme();
  
  // Capitalize first letter of each word
  const formatRoomType = (type) => {
    if (!type) return 'Room';
    return type.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };
  
  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        borderRadius: 1,
        overflow: 'hidden',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 6px 12px rgba(0,0,0,0.15)',
        },
        position: 'relative',
        border: '1px solid #e0e0e0'
      }}
    >
      {/* Popular badge */}
      {isPopular && (
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            right: 0,
            bgcolor: theme.palette.primary.main,
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
          Popular
        </Box>
      )}
      
      <CardMedia
        component="img"
        height="140"
        image={getRoomImage(room)}
        alt={room.name}
      />
      
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        <Typography 
          variant="h6" 
          component="h2" 
          gutterBottom
          sx={{ fontWeight: 600, color: theme.palette.primary.main }}
        >
          {room.name}
        </Typography>
        
        <Grid container spacing={1} sx={{ mb: 2 }}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <PlaceIcon fontSize="small" color="action" sx={{ mr: 1, fontSize: '1rem' }} />
              <Typography variant="body2" color="text.secondary" noWrap>
                {room.location || 'No location'}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <MeetingRoomIcon fontSize="small" color="action" sx={{ mr: 1, fontSize: '1rem' }} />
              <Typography variant="body2" color="text.secondary">
                {formatRoomType(room.type)}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PeopleIcon fontSize="small" color="action" sx={{ mr: 1, fontSize: '1rem' }} />
              <Typography variant="body2" color="text.secondary">
                {room.capacity} {room.capacity === 1 ? 'person' : 'people'}
              </Typography>
            </Box>
          </Grid>
          
          {room.bookingCount && (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccessTimeIcon fontSize="small" color="action" sx={{ mr: 1, fontSize: '1rem' }} />
                <Typography variant="body2" color="text.secondary">
                  Booked {room.bookingCount} times
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
        
        <Divider sx={{ mb: 2 }} />
        
        <Typography variant="subtitle2" gutterBottom>
          Equipment
        </Typography>
        <Box sx={{ minHeight: 40 }}>
          {(room.equipment && room.equipment.length > 0) ? (
            room.equipment.slice(0, 3).map((item, index) => (
              <Chip 
                key={index} 
                label={item} 
                variant="outlined" 
                size="small" 
                sx={{ mr: 0.5, mb: 0.5 }} 
              />
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              No equipment listed
            </Typography>
          )}
          {(room.equipment?.length || 0) > 3 && (
            <Chip 
              label={`+${(room.equipment?.length || 0) - 3} more`} 
              size="small" 
              sx={{ mb: 0.5 }} 
            />
          )}
        </Box>
      </CardContent>
      
      <Box sx={{ p: 2, pt: 0 }}>
        <Grid container spacing={1}>
          <Grid item xs={6}>
            <Button 
              size="medium" 
              component={Link} 
              to={`/rooms/${room.id}`}
              fullWidth
              variant="outlined"
            >
              Details
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button 
              size="medium" 
              variant="contained" 
              color="primary"
              component={Link} 
              to={`/rooms/${room.id}/book`}
              fullWidth
            >
              Book
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Card>
  );
}

export default RoomCard;
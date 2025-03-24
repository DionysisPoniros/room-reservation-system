// src/components/rooms/RoomCard.js
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardActions, 
  CardMedia,
  CardActionArea,
  Typography, 
  Button, 
  Chip,
  Box,
  Grid,
  Divider,
  useTheme,
  alpha
} from '@mui/material';

// Icons
import PeopleIcon from '@mui/icons-material/People';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import PlaceIcon from '@mui/icons-material/Place';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

// Placeholder room images by type
const getRoomImage = (type) => {
  // In a real app, you'd use actual room images from your database
  const placeholderWidth = 600;
  const placeholderHeight = 400;
  
  return `/api/placeholder/${placeholderWidth}/${placeholderHeight}`;
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
        borderRadius: 3,
        overflow: 'hidden',
        transition: 'all 0.3s ease-in-out',
        boxShadow: isPopular 
          ? `0 8px 24px ${alpha(theme.palette.primary.main, 0.12)}`
          : '0 4px 12px rgba(0,0,0,0.05)',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: isPopular 
            ? `0 12px 28px ${alpha(theme.palette.primary.main, 0.18)}`
            : '0 8px 24px rgba(0,0,0,0.09)',
        },
        position: 'relative'
      }}
    >
      {/* Popular badge */}
      {isPopular && (
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            right: 0,
            bgcolor: theme.palette.secondary.main,
            color: 'white',
            py: 0.5,
            px: 2,
            borderRadius: '4px 0 0 4px',
            fontWeight: 600,
            fontSize: '0.75rem',
            zIndex: 1,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          Popular
        </Box>
      )}
      
      <CardActionArea component={Link} to={`/rooms/${room.id}`}>
        <CardMedia
          component="img"
          height="160"
          image={getRoomImage(room.type)}
          alt={room.name}
        />
        
        <CardContent sx={{ flexGrow: 1, p: 3 }}>
          <Typography 
            variant="h5" 
            component="h2" 
            gutterBottom
            sx={{ fontWeight: 600 }}
          >
            {room.name}
          </Typography>
          
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PlaceIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary" noWrap>
                  {room.location || 'No location'}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <MeetingRoomIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  {formatRoomType(room.type)}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PeopleIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  {room.capacity} {room.capacity === 1 ? 'person' : 'people'}
                </Typography>
              </Box>
              
              {room.bookingCount && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AccessTimeIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Booked {room.bookingCount} times
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>
          
          <Divider sx={{ mb: 2 }} />
          
          <Typography variant="subtitle2" gutterBottom>
            Equipment
          </Typography>
          <Box sx={{ height: 40, overflow: 'hidden' }}>
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
      </CardActionArea>
      
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
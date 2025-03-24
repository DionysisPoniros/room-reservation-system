// src/pages/Home.js
import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Button, 
  Box, 
  Grid, 
  Paper,
  Card,
  CardContent,
  CardMedia,
  Divider,
  useTheme,
  useMediaQuery,
  alpha
} from '@mui/material';
import { Link } from 'react-router-dom';

// Icons
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PeopleIcon from '@mui/icons-material/People';
import SearchIcon from '@mui/icons-material/Search';
import MapIcon from '@mui/icons-material/Map';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

// Placeholder for the room image - replace with actual images in production
const roomImage = "/api/placeholder/800/500";

function Home() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isMedium = useMediaQuery(theme.breakpoints.down('md'));
  
  const [animatedItems, setAnimatedItems] = useState(false);
  
  // Trigger animations after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedItems(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);
  
  const boxShadow = '0px 8px 24px rgba(0, 0, 0, 0.12)';
  
  return (
    <Box>
      {/* Hero Section */}
      <Box 
        sx={{ 
          bgcolor: alpha(theme.palette.primary.main, 0.05),
          pt: { xs: 8, md: 12 },
          pb: { xs: 10, md: 14 },
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Background pattern */}
        <Box 
          sx={{
            position: 'absolute',
            right: -100,
            top: -100,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: alpha(theme.palette.secondary.main, 0.05),
            zIndex: 0
          }}
        />
        <Box 
          sx={{
            position: 'absolute',
            left: -80,
            bottom: -120,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: alpha(theme.palette.primary.main, 0.08),
            zIndex: 0
          }}
        />
        
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6} 
              sx={{ 
                transform: animatedItems ? 'translateY(0)' : 'translateY(20px)',
                opacity: animatedItems ? 1 : 0,
                transition: 'all 0.6s ease-out',
              }}
            >
              <Typography 
                variant="h1" 
                component="h1" 
                gutterBottom
                sx={{ 
                  fontWeight: 800,
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  backgroundClip: 'text',
                  textFillColor: 'transparent',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 2
                }}
              >
                Find Your Perfect Space
              </Typography>
              <Typography 
                variant="h5" 
                component="p" 
                color="text.secondary"
                sx={{ mb: 4, fontWeight: 400, maxWidth: 500 }}
              >
                Book university rooms instantly with our dynamic reservation system
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  size="large"
                  component={Link}
                  to="/rooms"
                  startIcon={<SearchIcon />}
                  sx={{
                    py: 1.5,
                    px: 3,
                    fontSize: '1rem'
                  }}
                >
                  Find Available Rooms
                </Button>
                <Button 
                  variant="outlined" 
                  color="primary"
                  size="large"
                  component={Link}
                  to="/my-reservations"
                  sx={{
                    py: 1.5,
                    px: 3,
                    fontSize: '1rem'
                  }}
                >
                  My Reservations
                </Button>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}
              sx={{ 
                transform: animatedItems ? 'translateY(0)' : 'translateY(20px)',
                opacity: animatedItems ? 1 : 0,
                transition: 'all 0.6s ease-out',
                transitionDelay: '0.2s'
              }}
            >
              <Box 
                component="img"
                src={roomImage}
                alt="Modern university room"
                sx={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: 4,
                  boxShadow,
                  transform: 'perspective(1000px) rotateY(-5deg) rotateX(5deg)',
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>
      
      {/* Feature Highlights */}
      <Container maxWidth="lg">
        <Box sx={{ py: { xs: 6, md: 10 } }}>
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography 
              variant="h2" 
              component="h2" 
              gutterBottom
              sx={{ 
                fontWeight: 700,
                mb: 2
              }}
            >
              Find, Book, and Manage Spaces
            </Typography>
            <Typography 
              variant="h6" 
              color="text.secondary"
              sx={{ maxWidth: 700, mx: 'auto', fontWeight: 400 }}
            >
              Our platform makes it easy to find the perfect space for your needs
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            {[
              {
                icon: <SearchIcon fontSize="large" color="primary" />,
                title: "Smart Search",
                description: "Filter rooms by capacity, equipment, and other criteria to find your perfect match."
              },
              {
                icon: <CalendarMonthIcon fontSize="large" color="primary" />,
                title: "Real-Time Availability",
                description: "See exactly when rooms are available and book them instantly."
              },
              {
                icon: <MeetingRoomIcon fontSize="large" color="primary" />,
                title: "Room Details",
                description: "Access comprehensive information about each room, including features and photos."
              },
              {
                icon: <PeopleIcon fontSize="large" color="primary" />,
                title: "Collaborative Booking",
                description: "Easily reserve spaces for groups and manage team bookings."
              },
              {
                icon: <MapIcon fontSize="large" color="primary" />,
                title: "Visual Navigation",
                description: "Find rooms with our intuitive 2D/3D map visualization."
              },
              {
                icon: <TrendingUpIcon fontSize="large" color="primary" />,
                title: "Personalized Recommendations",
                description: "Get suggestions based on your booking history and preferences."
              }
            ].map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}
                sx={{ 
                  transform: animatedItems ? 'translateY(0)' : 'translateY(20px)',
                  opacity: animatedItems ? 1 : 0,
                  transition: 'all 0.5s ease-out',
                  transitionDelay: `${0.1 + index * 0.1}s`
                }}
              >
                <Card 
                  elevation={0}
                  sx={{ 
                    p: 3, 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    '&:hover': {
                      boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`,
                      transform: 'translateY(-5px)',
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                  <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                    {feature.title}
                  </Typography>
                  <Typography color="text.secondary" paragraph>
                    {feature.description}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
        
        {/* User Categories Section */}
        <Box sx={{ py: { xs: 6, md: 10 } }}>
          <Divider sx={{ mb: 8 }} />
          
          <Typography 
            variant="h3" 
            component="h2" 
            align="center"
            gutterBottom
            sx={{ mb: 6 }}
          >
            For Everyone on Campus
          </Typography>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}
              sx={{ 
                transform: animatedItems ? 'translateY(0)' : 'translateY(20px)',
                opacity: animatedItems ? 1 : 0,
                transition: 'all 0.5s ease-out',
                transitionDelay: '0.3s'
              }}
            >
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <CardMedia
                  component="img"
                  height="180"
                  image="/api/placeholder/600/400"
                  alt="Students studying"
                />
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                    For Students
                  </Typography>
                  <Typography paragraph>
                    Book study rooms, collaboration spaces, and project areas for individual or group work.
                  </Typography>
                  <Button 
                    variant="outlined" 
                    component={Link}
                    to="/rooms"
                    sx={{ mt: 2 }}
                    fullWidth
                  >
                    Find Study Spaces
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}
              sx={{ 
                transform: animatedItems ? 'translateY(0)' : 'translateY(20px)',
                opacity: animatedItems ? 1 : 0,
                transition: 'all 0.5s ease-out',
                transitionDelay: '0.4s'
              }}
            >
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <CardMedia
                  component="img"
                  height="180"
                  image="/api/placeholder/600/400"
                  alt="Faculty meeting"
                />
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                    For Faculty
                  </Typography>
                  <Typography paragraph>
                    Book lecture halls, meeting rooms, and office spaces for academic sessions and research.
                  </Typography>
                  <Button 
                    variant="outlined" 
                    component={Link}
                    to="/rooms"
                    sx={{ mt: 2 }}
                    fullWidth
                  >
                    Find Meeting Spaces
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}
              sx={{ 
                transform: animatedItems ? 'translateY(0)' : 'translateY(20px)',
                opacity: animatedItems ? 1 : 0,
                transition: 'all 0.5s ease-out',
                transitionDelay: '0.5s'
              }}
            >
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <CardMedia
                  component="img"
                  height="180"
                  image="/api/placeholder/600/400"
                  alt="Admin dashboard"
                />
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                    For Administrators
                  </Typography>
                  <Typography paragraph>
                    Manage room scheduling, monitor usage, and analyze space utilization across campus.
                  </Typography>
                  <Button 
                    variant="outlined" 
                    sx={{ mt: 2 }}
                    fullWidth
                  >
                    Admin Dashboard
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Container>
      
      {/* Call to Action */}
      <Box 
        sx={{ 
          bgcolor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          py: { xs: 6, md: 10 },
          mt: 6,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Background elements */}
        <Box 
          sx={{
            position: 'absolute',
            right: '5%',
            top: '10%',
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: alpha('#fff', 0.1),
            zIndex: 0
          }}
        />
        <Box 
          sx={{
            position: 'absolute',
            left: '10%',
            bottom: '15%',
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: alpha('#fff', 0.1),
            zIndex: 0
          }}
        />
        
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <Typography
            variant="h3"
            component="h2"
            gutterBottom
            sx={{ 
              fontWeight: 700,
              mb: 3
            }}
          >
            Ready to find your perfect space?
          </Typography>
          <Typography
            variant="h6"
            paragraph
            sx={{ 
              mb: 4,
              opacity: 0.9,
              maxWidth: 700,
              mx: 'auto'
            }}
          >
            Start booking rooms instantly with our easy-to-use platform
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            size="large"
            component={Link}
            to="/rooms"
            sx={{
              py: 1.5,
              px: 4,
              fontSize: '1.1rem',
              bgcolor: '#fff',
              color: theme.palette.primary.main,
              '&:hover': {
                bgcolor: alpha('#fff', 0.9)
              }
            }}
          >
            Get Started Now
          </Button>
        </Container>
      </Box>
    </Box>
  );
}

export default Home;
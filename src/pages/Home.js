// src/pages/Home.js
import React from 'react';
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
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Link } from 'react-router-dom';

// Icons
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PeopleIcon from '@mui/icons-material/People';
import SearchIcon from '@mui/icons-material/Search';

function Home() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // For demo purposes only - in a real application, these would be environment variables or imported
  // These are references to the campus images you provided
  const campusImages = {
    ritCampus1: "/campus-image-1.jpg", // Path to Image 1 of brick buildings
    ritCampus2: "/campus-image-2.jpg", // Path to Image 2 aerial view
    ritCampus3: "/campus-image-3.jpg", // Path to Image 3 modern glass building
    ritCampus4: "/campus-image-4.jpg", // Path to Image 4 campus paths and greenery
  };
  
  return (
    <Box>
      {/* Hero Section with Campus Image */}
      <Box 
        sx={{ 
          position: 'relative',
          height: { xs: '50vh', md: '70vh' },
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1
          }
        }}
      >
        {/* Background image would be one of the campus photos */}
        <Box 
          component="img"
          src={campusImages.ritCampus1} // Replace with actual path to the image
          alt="RIT Campus"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2, textAlign: 'center', color: 'white' }}>
          <Typography 
            variant="h2" 
            component="h1" 
            gutterBottom
            sx={{ 
              fontWeight: 700,
              mb: 3,
              textShadow: '0px 2px 4px rgba(0,0,0,0.5)'
            }}
          >
            RIT Room Reservation System
          </Typography>
          <Typography 
            variant="h5" 
            component="p" 
            sx={{ 
              mb: 4, 
              maxWidth: 700, 
              mx: 'auto', 
              textShadow: '0px 1px 2px rgba(0,0,0,0.5)'
            }}
          >
            Find and book rooms across campus efficiently with our dynamic reservation platform
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            size="large"
            component={Link}
            to="/rooms"
            startIcon={<SearchIcon />}
            sx={{
              py: 1.5,
              px: 4,
              fontSize: '1.1rem',
              bgcolor: theme.palette.primary.main,
              '&:hover': {
                bgcolor: theme.palette.primary.dark
              }
            }}
          >
            Find Available Rooms
          </Button>
        </Container>
      </Box>
      
      {/* Features Section */}
      <Container maxWidth="lg">
        <Box sx={{ py: { xs: 6, md: 8 } }}>
          <Typography 
            variant="h3" 
            component="h2" 
            align="center"
            gutterBottom
            sx={{ 
              fontWeight: 700,
              mb: 6
            }}
          >
            Room Reservation Made Simple
          </Typography>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Paper 
                sx={{ 
                  p: 3, 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  borderTop: `4px solid ${theme.palette.primary.main}`,
                  borderRadius: '4px'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <SearchIcon sx={{ fontSize: 36, color: theme.palette.primary.main, mr: 2 }} />
                  <Typography variant="h5" component="h3" sx={{ fontWeight: 600 }}>
                    Find Rooms
                  </Typography>
                </Box>
                <Typography paragraph color="text.secondary">
                  Search for available rooms based on time, capacity, equipment, and other specific needs.
                </Typography>
                <Button 
                  variant="outlined" 
                  component={Link}
                  to="/rooms"
                  sx={{ mt: 'auto', alignSelf: 'flex-start' }}
                >
                  Browse Rooms
                </Button>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper 
                sx={{ 
                  p: 3, 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  borderTop: `4px solid ${theme.palette.primary.main}`,
                  borderRadius: '4px'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CalendarMonthIcon sx={{ fontSize: 36, color: theme.palette.primary.main, mr: 2 }} />
                  <Typography variant="h5" component="h3" sx={{ fontWeight: 600 }}>
                    Book Instantly
                  </Typography>
                </Box>
                <Typography paragraph color="text.secondary">
                  Reserve rooms with real-time availability checking to avoid scheduling conflicts.
                </Typography>
                <Button 
                  variant="outlined" 
                  component={Link}
                  to="/rooms"
                  sx={{ mt: 'auto', alignSelf: 'flex-start' }}
                >
                  Book Now
                </Button>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper 
                sx={{ 
                  p: 3, 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  borderTop: `4px solid ${theme.palette.primary.main}`,
                  borderRadius: '4px'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PeopleIcon sx={{ fontSize: 36, color: theme.palette.primary.main, mr: 2 }} />
                  <Typography variant="h5" component="h3" sx={{ fontWeight: 600 }}>
                    Manage Reservations
                  </Typography>
                </Box>
                <Typography paragraph color="text.secondary">
                  Keep track of your bookings, receive notifications, and make changes when needed.
                </Typography>
                <Button 
                  variant="outlined" 
                  component={Link}
                  to="/my-reservations"
                  sx={{ mt: 'auto', alignSelf: 'flex-start' }}
                >
                  My Reservations
                </Button>
              </Paper>
            </Grid>
          </Grid>
        </Box>
        
        {/* User Categories Section */}
        <Box sx={{ py: { xs: 6, md: 8 } }}>
          <Typography 
            variant="h3" 
            component="h2" 
            align="center"
            gutterBottom
            sx={{ mb: 6, fontWeight: 700 }}
          >
            For Everyone at RIT
          </Typography>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <CardMedia
                  component="img"
                  height="180"
                  image={campusImages.ritCampus2} // Path to campus image 2
                  alt="RIT Students"
                />
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                    For Students
                  </Typography>
                  <Typography paragraph>
                    Book study spaces, collaboration rooms, and project areas for individual or group work.
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary"
                    component={Link}
                    to="/rooms"
                    fullWidth
                  >
                    Find Study Spaces
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <CardMedia
                  component="img"
                  height="180"
                  image={campusImages.ritCampus3} // Path to campus image 3
                  alt="RIT Faculty"
                />
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                    For Faculty
                  </Typography>
                  <Typography paragraph>
                    Book lecture halls, meeting rooms, and office spaces for academic sessions and research.
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary"
                    component={Link}
                    to="/rooms"
                    fullWidth
                  >
                    Find Meeting Spaces
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <CardMedia
                  component="img"
                  height="180"
                  image={campusImages.ritCampus4} // Path to campus image 4
                  alt="RIT Staff"
                />
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                    For Staff
                  </Typography>
                  <Typography paragraph>
                    Manage room scheduling, monitor usage, and analyze space utilization across campus.
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary"
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
          py: { xs: 6, md: 8 },
          mt: 6
        }}
      >
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
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
              bgcolor: 'white',
              color: theme.palette.primary.main,
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.9)'
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
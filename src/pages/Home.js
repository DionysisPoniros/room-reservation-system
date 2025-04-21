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
  TextField,
  MenuItem,
  useTheme,
  useMediaQuery,
  Divider
} from '@mui/material';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Icons
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PeopleIcon from '@mui/icons-material/People';
import SearchIcon from '@mui/icons-material/Search';
import MapIcon from '@mui/icons-material/Map';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import EventIcon from '@mui/icons-material/Event';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import LocationOnIcon from '@mui/icons-material/LocationOn';

function Home() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const { currentUser } = useAuth();
  
  // For demo purposes only - in a real application, these would be environment variables or imported
  // These are references to the campus images
  const campusImages = {
    ritCampus1: "/images/campus-image-1.jpg", // Path to Image 1 of brick buildings
    ritCampus2: "/images/campus-image-2.jpg", // Path to Image 2 aerial view
    ritCampus3: "/images/campus-image-3.jpg", // Path to Image 3 modern glass building
    ritCampus4: "/images/campus-image-4.jpg", // Path to Image 4 campus paths and greenery
  };
  
  return (
    <Box sx={{ overflow: 'hidden' }}>
      {/* Hero Section with Campus Image */}
      <Box 
        sx={{ 
          position: 'relative',
          height: { xs: '70vh', md: '80vh' },
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
        {/* Background image with subtle Ken Burns effect */}
        <Box
          component="div"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            animation: 'kenBurns 20s infinite alternate ease-in-out',
            '@keyframes kenBurns': {
              '0%': { transform: 'scale(1.0) translate(0%, 0%)' },
              '100%': { transform: 'scale(1.1) translate(-1%, -1%)' }
            },
          }}
        >
          <Box 
            component="img"
            src={campusImages.ritCampus1}
            alt="RIT Campus"
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </Box>
        
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2, textAlign: 'center', color: 'white' }}>
          <Typography 
            variant="h1" 
            component="h1" 
            gutterBottom
            sx={{ 
              fontWeight: 800,
              mb: 3,
              textShadow: '0px 2px 8px rgba(0,0,0,0.6)',
              fontSize: { xs: '2.5rem', md: '4rem' },
              letterSpacing: '-0.5px',
              animation: 'fadeInUp 1s ease-out',
              '@keyframes fadeInUp': {
                '0%': { opacity: 0, transform: 'translateY(20px)' },
                '100%': { opacity: 1, transform: 'translateY(0)' }
              }
            }}
          >
            Dynamic Room Reservation
          </Typography>
          <Typography 
            variant="h5" 
            component="p" 
            sx={{ 
              mb: 6, 
              maxWidth: 700, 
              mx: 'auto', 
              textShadow: '0px 1px 3px rgba(0,0,0,0.6)',
              animation: 'fadeInUp 1s ease-out 0.3s both',
              fontWeight: 300,
              lineHeight: 1.5
            }}
          >
            Book rooms across RIT campus instantly with our intuitive reservation platform
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            size="large"
            component={Link}
            to={currentUser ? "/rooms" : "/login"}
            startIcon={currentUser ? <SearchIcon /> : null}
            sx={{
              py: 2,
              px: 6,
              fontSize: '1.1rem',
              borderRadius: '30px',
              boxShadow: '0 4px 14px rgba(247, 105, 2, 0.4)',
              background: 'linear-gradient(45deg, #F76902 30%, #FF8A33 90%)',
              animation: 'fadeInUp 1s ease-out 0.6s both',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: '0 6px 20px rgba(247, 105, 2, 0.5)',
              }
            }}
          >
            {currentUser ? "Find Available Rooms" : "Sign In To Get Started"}
          </Button>
        </Container>
      </Box>
      
      {/* Quick Search Component (shown only if logged in) */}
      {currentUser && (
        <Container maxWidth="lg">
          <Paper 
            elevation={3} 
            sx={{ 
              p: 4, 
              borderRadius: 3, 
              mt: -10, 
              mb: 8, 
              position: 'relative',
              zIndex: 10,
              boxShadow: '0 15px 50px rgba(0,0,0,0.1)'
            }}
          >
            <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
              Quick Search
            </Typography>
            
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="When do you need a room?"
                  type="datetime-local"
                  InputLabelProps={{ shrink: true }}
                  defaultValue={new Date().toISOString().slice(0, 16)}
                  sx={{ bgcolor: 'white' }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="How many people?"
                  type="number"
                  defaultValue={1}
                  InputProps={{ inputProps: { min: 1, max: 100 } }}
                  sx={{ bgcolor: 'white' }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  select
                  label="Room Type"
                  defaultValue=""
                  sx={{ bgcolor: 'white' }}
                >
                  <MenuItem value="">Any Type</MenuItem>
                  <MenuItem value="classroom">Classroom</MenuItem>
                  <MenuItem value="meeting">Meeting Room</MenuItem>
                  <MenuItem value="lab">Lab</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={2}>
                <Button 
                  variant="contained" 
                  fullWidth 
                  size="large" 
                  component={Link}
                  to="/rooms"
                  sx={{ 
                    height: '56px',
                    boxShadow: '0 4px 10px rgba(247, 105, 2, 0.3)',
                  }}
                >
                  Search
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Container>
      )}
      
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
                  p: 4, 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  overflow: 'hidden',
                  position: 'relative',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: '0 12px 20px rgba(0,0,0,0.1)',
                    '& .feature-icon': {
                      transform: 'scale(1.1)',
                    }
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '4px',
                    background: 'linear-gradient(90deg, #F76902 0%, #FF8A33 100%)',
                  }
                }}
              >
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 3 
                }}>
                  <Box
                    className="feature-icon"
                    sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      bgcolor: 'rgba(247, 105, 2, 0.1)',
                      color: theme.palette.primary.main,
                      mr: 2,
                      transition: 'transform 0.3s ease'
                    }}
                  >
                    <SearchIcon sx={{ fontSize: 30 }} />
                  </Box>
                  <Typography variant="h5" component="h3" sx={{ fontWeight: 700 }}>
                    Find Rooms
                  </Typography>
                </Box>
                <Typography paragraph color="text.secondary" sx={{ mb: 4, flex: 1 }}>
                  Quickly search for available rooms based on time, capacity, equipment, and other specific needs with our intuitive filtering system.
                </Typography>
                <Button 
                  variant="outlined" 
                  component={Link}
                  to="/rooms"
                  sx={{ 
                    mt: 'auto', 
                    alignSelf: 'flex-start',
                    borderRadius: '30px',
                    px: 3,
                    py: 1,
                    '&:hover': {
                      bgcolor: 'rgba(247, 105, 2, 0.05)'
                    }
                  }}
                  endIcon={<ArrowForwardIcon />}
                >
                  Browse Rooms
                </Button>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper 
                sx={{ 
                  p: 4, 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  overflow: 'hidden',
                  position: 'relative',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: '0 12px 20px rgba(0,0,0,0.1)',
                    '& .feature-icon': {
                      transform: 'scale(1.1)',
                    }
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '4px',
                    background: 'linear-gradient(90deg, #F76902 0%, #FF8A33 100%)',
                  }
                }}
              >
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 3 
                }}>
                  <Box
                    className="feature-icon"
                    sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      bgcolor: 'rgba(247, 105, 2, 0.1)',
                      color: theme.palette.primary.main,
                      mr: 2,
                      transition: 'transform 0.3s ease'
                    }}
                  >
                    <MapIcon sx={{ fontSize: 30 }} />
                  </Box>
                  <Typography variant="h5" component="h3" sx={{ fontWeight: 700 }}>
                    Interactive Map
                  </Typography>
                </Box>
                <Typography paragraph color="text.secondary" sx={{ mb: 4, flex: 1 }}>
                  Visualize room locations and check availability in real-time with our interactive campus map. See which rooms are available at a glance.
                </Typography>
                <Button 
                  variant="outlined" 
                  component={Link}
                  to="/rooms?view=map"
                  sx={{ 
                    mt: 'auto', 
                    alignSelf: 'flex-start',
                    borderRadius: '30px',
                    px: 3,
                    py: 1,
                    '&:hover': {
                      bgcolor: 'rgba(247, 105, 2, 0.05)'
                    }
                  }}
                  endIcon={<ArrowForwardIcon />}
                >
                  View Map
                </Button>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper 
                sx={{ 
                  p: 4, 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  overflow: 'hidden',
                  position: 'relative',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: '0 12px 20px rgba(0,0,0,0.1)',
                    '& .feature-icon': {
                      transform: 'scale(1.1)',
                    }
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '4px',
                    background: 'linear-gradient(90deg, #F76902 0%, #FF8A33 100%)',
                  }
                }}
              >
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 3 
                }}>
                  <Box
                    className="feature-icon"
                    sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      bgcolor: 'rgba(247, 105, 2, 0.1)',
                      color: theme.palette.primary.main,
                      mr: 2,
                      transition: 'transform 0.3s ease'
                    }}
                  >
                    <CalendarMonthIcon sx={{ fontSize: 30 }} />
                  </Box>
                  <Typography variant="h5" component="h3" sx={{ fontWeight: 700 }}>
                    Manage Reservations
                  </Typography>
                </Box>
                <Typography paragraph color="text.secondary" sx={{ mb: 4, flex: 1 }}>
                  Keep track of your bookings, receive notifications, and make changes when needed. View all your upcoming reservations in one place.
                </Typography>
                <Button 
                  variant="outlined" 
                  component={Link}
                  to="/my-reservations"
                  sx={{ 
                    mt: 'auto', 
                    alignSelf: 'flex-start',
                    borderRadius: '30px',
                    px: 3,
                    py: 1,
                    '&:hover': {
                      bgcolor: 'rgba(247, 105, 2, 0.05)'
                    }
                  }}
                  endIcon={<ArrowForwardIcon />}
                >
                  My Reservations
                </Button>
              </Paper>
            </Grid>
          </Grid>
        </Box>
        
        {/* Popular Rooms Showcase */}
        <Box sx={{ py: { xs: 6, md: 8 } }}>
          <Typography 
            variant="h3" 
            component="h2" 
            align="center"
            gutterBottom
            sx={{ 
              fontWeight: 700,
              mb: 2
            }}
          >
            Featured Spaces
          </Typography>
          
          <Typography 
            variant="h6" 
            component="p" 
            align="center"
            color="text.secondary"
            sx={{ mb: 6, maxWidth: 700, mx: 'auto' }}
          >
            Discover our top rooms and learning spaces across campus
          </Typography>
          
          <Grid container spacing={3}>
            {[
              {
                id: 1,
                name: "Sklarsky Center for Business Analytics",
                location: "Max Lowenthal Hall, 1st Floor",
                capacity: 30,
                image: campusImages.ritCampus1,
                type: "Computer Lab"
              },
              {
                id: 2,
                name: "Gelsomino Student Learning Center",
                location: "Max Lowenthal Hall, 3rd Floor",
                capacity: 50,
                image: campusImages.ritCampus3,
                type: "Classroom"
              },
              {
                id: 3,
                name: "Wallace Library Interactive Space",
                location: "Wallace Library, 3rd Floor",
                capacity: 24,
                image: campusImages.ritCampus2,
                type: "Collaboration Space"
              }
            ].map((room) => (
              <Grid item xs={12} md={4} key={room.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
                    }
                  }}
                >
                  <Box sx={{ position: 'relative', height: 200, overflow: 'hidden' }}>
                    <CardMedia
                      component="img"
                      height="200"
                      image={room.image}
                      alt={room.name}
                      sx={{ 
                        transition: 'transform 0.5s ease',
                        '&:hover': {
                          transform: 'scale(1.05)'
                        }
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 16,
                        right: 0,
                        bgcolor: theme.palette.primary.main,
                        color: 'white',
                        py: 0.5,
                        px: 2,
                        borderRadius: '4px 0 0 4px',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      }}
                    >
                      {room.type}
                    </Box>
                  </Box>
                  <CardContent sx={{ p: 3, flexGrow: 1 }}>
                    <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                      {room.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <LocationOnIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        {room.location}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <PeopleIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Capacity: {room.capacity} people
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      component={Link}
                      to={`/rooms/${room.id}`}
                      sx={{
                        mt: 2,
                        py: 1,
                        borderRadius: '30px',
                        boxShadow: '0 4px 8px rgba(247, 105, 2, 0.2)',
                        '&:hover': {
                          boxShadow: '0 6px 12px rgba(247, 105, 2, 0.3)'
                        }
                      }}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Button
              variant="outlined"
              color="primary"
              component={Link}
              to="/rooms"
              size="large"
              endIcon={<KeyboardArrowRightIcon />}
              sx={{
                borderRadius: '30px',
                py: 1.5,
                px: 4,
                '&:hover': {
                  bgcolor: 'rgba(247, 105, 2, 0.05)'
                }
              }}
            >
              View All Rooms
            </Button>
          </Box>
        </Box>
        
        {/* Usage Statistics Section */}
        <Box 
          sx={{ 
            py: { xs: 6, md: 8 },
            bgcolor: '#f8f9fa',
            borderRadius: 4,
            mb: 8
          }}
        >
          <Container maxWidth="lg">
            <Typography 
              variant="h3" 
              component="h2" 
              align="center"
              gutterBottom
              sx={{ mb: 6, fontWeight: 700 }}
            >
              RIT DRRS By The Numbers
            </Typography>
            
            <Grid container spacing={4} justifyContent="center">
              {[
                { number: '5,000+', label: 'Bookings per month', icon: EventIcon },
                { number: '120+', label: 'Available rooms', icon: MeetingRoomIcon },
                { number: '2,400+', label: 'Active users', icon: PeopleIcon },
                { number: '95%', label: 'Satisfaction rate', icon: ThumbUpIcon }
              ].map((stat, index) => (
                <Grid item xs={6} md={3} key={index}>
                  <Box 
                    sx={{ 
                      textAlign: 'center',
                      p: 3,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2,
                        bgcolor: 'rgba(247, 105, 2, 0.1)',
                        color: theme.palette.primary.main,
                      }}
                    >
                      <stat.icon sx={{ fontSize: 40 }} />
                    </Box>
                    <Typography 
                      variant="h3" 
                      sx={{ 
                        fontWeight: 800, 
                        mb: 1,
                        color: theme.palette.primary.main,
                        fontSize: { xs: '2rem', md: '3rem' }
                      }}
                    >
                      {stat.number}
                    </Typography>
                    <Typography 
                      variant="body1" 
                      color="text.secondary"
                      sx={{ fontWeight: 500 }}
                    >
                      {stat.label}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Container>
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
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                overflow: 'hidden',
                borderRadius: 3,
                boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                }
              }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={campusImages.ritCampus2}
                  alt="RIT Students"
                />
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 700 }}>
                    For Students
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography paragraph>
                    Book study spaces, collaboration rooms, and project areas for individual or group work. Find the perfect space to prepare for exams or work on team projects.
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary"
                    component={Link}
                    to="/rooms"
                    fullWidth
                    sx={{
                      py: 1.5,
                      borderRadius: 30,
                      mt: 2
                    }}
                  >
                    Find Study Spaces
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                overflow: 'hidden',
                borderRadius: 3,
                boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                }
              }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={campusImages.ritCampus3}
                  alt="RIT Faculty"
                />
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 700 }}>
                    For Faculty
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography paragraph>
                    Book lecture halls, meeting rooms, and office spaces for academic sessions and research. Schedule spaces for office hours, department meetings, or special events.
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary"
                    component={Link}
                    to="/rooms"
                    fullWidth
                    sx={{
                      py: 1.5,
                      borderRadius: 30,
                      mt: 2
                    }}
                  >
                    Find Meeting Spaces
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                overflow: 'hidden',
                borderRadius: 3,
                boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                }
              }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={campusImages.ritCampus4}
                  alt="RIT Staff"
                />
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 700 }}>
                    For Staff
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography paragraph>
                    Manage room scheduling, monitor usage, and analyze space utilization across campus. Access detailed analytics and generate reports on room usage patterns.
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary"
                    component={Link}
                    to="/admin"
                    fullWidth
                    sx={{
                      py: 1.5,
                      borderRadius: 30,
                      mt: 2
                    }}
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
          py: { xs: 8, md: 10 },
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `linear-gradient(135deg, rgba(247, 105, 2, 0.95) 0%, rgba(81, 49, 39, 0.9) 100%), url(${campusImages.ritCampus4})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: -1
          }
        }}
      >
        <Container maxWidth="md" sx={{ textAlign: 'center', color: 'white' }}>
          <Typography
            variant="h2"
            component="h2"
            gutterBottom
            sx={{ 
              fontWeight: 800,
              mb: 3,
              textShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            Ready to find your perfect space?
          </Typography>
          <Typography
            variant="h6"
            paragraph
            sx={{ 
              mb: 6,
              opacity: 0.9,
              maxWidth: 700,
              mx: 'auto',
              fontWeight: 300
            }}
          >
            Join thousands of RIT students, faculty, and staff who are already using our platform to effortlessly reserve spaces across campus.
          </Typography>
          <Button
            variant="contained"
            size="large"
            component={Link}
            to={currentUser ? "/rooms" : "/login"}
            sx={{
              py: 2,
              px: 6,
              fontSize: '1.2rem',
              bgcolor: 'white',
              color: theme.palette.primary.main,
              borderRadius: '30px',
              boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
                transform: 'translateY(-3px)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            {currentUser ? "Find Available Rooms" : "Get Started Now"}
          </Button>
          {!currentUser && (
            <Typography variant="body2" sx={{ mt: 3, opacity: 0.8 }}>
              No registration required for RIT students and faculty. Login with your RIT credentials.
            </Typography>
          )}
        </Container>
      </Box>
    </Box>
  );
}

export default Home;
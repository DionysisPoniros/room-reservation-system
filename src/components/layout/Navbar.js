// src/components/layout/Navbar.js
import React, { useState, useEffect } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  IconButton, 
  Menu, 
  MenuItem, 
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useMediaQuery,
  useTheme,
  useScrollTrigger,
  Container,
  alpha,
  Slide
} from '@mui/material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import HomeIcon from '@mui/icons-material/Home';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { useAuth } from '../../contexts/AuthContext';

// Logo component
const Logo = () => {
  const theme = useTheme();
  
  return (
    <Typography 
      variant="h5" 
      component="div" 
      sx={{ 
        fontWeight: 700,
        letterSpacing: 1,
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        backgroundClip: 'text',
        textFillColor: 'transparent',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}
    >
      DRRS
    </Typography>
  );
};

// Hide navbar on scroll down, show on scroll up
function HideOnScroll(props) {
  const { children } = props;
  const trigger = useScrollTrigger({
    threshold: 300, // Only hide after scrolling down 300px
  });

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // For user menu
  const [anchorEl, setAnchorEl] = useState(null);
  
  // For mobile drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Determine if navbar should be transparent (only on homepage)
  const isHomePage = location.pathname === '/';
  const [scrolled, setScrolled] = useState(false);
  
  // Track scroll position for transparency effect on homepage
  useEffect(() => {
    if (!isHomePage) return;
    
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setScrolled(scrollPosition > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomePage]);
  
  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Logout failed", error);
    }
    handleClose();
  };
  
  // Navbar styling based on scroll position and page
  const navbarStyle = {
    boxShadow: isHomePage && !scrolled ? 'none' : '0px 2px 8px rgba(0, 0, 0, 0.08)',
    bgcolor: isHomePage && !scrolled ? 'transparent' : 'background.paper',
    transition: 'all 0.3s ease',
  };
  
  // Active link indicator
  const isLinkActive = (path) => {
    return location.pathname === path;
  };
  
  // Drawer content
  const drawerContent = (
    <Box 
      sx={{ 
        width: 280,
        pt: 2
      }} 
      role="presentation" 
      onClick={() => setDrawerOpen(false)}
    >
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
          <Logo />
        </Link>
      </Box>
      <Divider sx={{ mb: 2 }} />
      
      <List>
        <ListItem 
          component={Link} 
          to="/"
          sx={{ 
            borderLeft: isLinkActive('/') ? `4px solid ${theme.palette.primary.main}` : '4px solid transparent',
            bgcolor: isLinkActive('/') ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.05)
            }
          }}
        >
          <ListItemIcon>
            <HomeIcon color={isLinkActive('/') ? 'primary' : 'inherit'} />
          </ListItemIcon>
          <ListItemText 
            primary="Home" 
            primaryTypographyProps={{ 
              fontWeight: isLinkActive('/') ? 600 : 400 
            }}
          />
        </ListItem>
        
        <ListItem 
          component={Link} 
          to="/rooms"
          sx={{ 
            borderLeft: isLinkActive('/rooms') ? `4px solid ${theme.palette.primary.main}` : '4px solid transparent',
            bgcolor: isLinkActive('/rooms') ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.05)
            }
          }}
        >
          <ListItemIcon>
            <MeetingRoomIcon color={isLinkActive('/rooms') ? 'primary' : 'inherit'} />
          </ListItemIcon>
          <ListItemText 
            primary="Rooms" 
            primaryTypographyProps={{ 
              fontWeight: isLinkActive('/rooms') ? 600 : 400 
            }}
          />
        </ListItem>
        
        {currentUser && (
          <ListItem 
            component={Link} 
            to="/my-reservations"
            sx={{ 
              borderLeft: isLinkActive('/my-reservations') ? `4px solid ${theme.palette.primary.main}` : '4px solid transparent',
              bgcolor: isLinkActive('/my-reservations') ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.05)
              }
            }}
          >
            <ListItemIcon>
              <CalendarMonthIcon color={isLinkActive('/my-reservations') ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText 
              primary="My Reservations" 
              primaryTypographyProps={{ 
                fontWeight: isLinkActive('/my-reservations') ? 600 : 400 
              }}
            />
          </ListItem>
        )}
      </List>
      
      <Divider sx={{ my: 2 }} />
      
      <List>
        {currentUser ? (
          <>
            <ListItem>
              <ListItemIcon>
                <PersonIcon />
              </ListItemIcon>
              <ListItemText 
                primary={currentUser.email} 
                primaryTypographyProps={{ noWrap: true, fontSize: '0.9rem' }}
              />
            </ListItem>
            <ListItem 
              button 
              onClick={handleLogout}
              sx={{
                '&:hover': {
                  bgcolor: alpha(theme.palette.error.main, 0.08)
                }
              }}
            >
              <ListItemIcon>
                <LogoutIcon color="error" />
              </ListItemIcon>
              <ListItemText 
                primary="Logout" 
                primaryTypographyProps={{ color: 'error.main' }}
              />
            </ListItem>
          </>
        ) : (
          <ListItem 
            component={Link} 
            to="/login"
            sx={{ 
              borderLeft: isLinkActive('/login') ? `4px solid ${theme.palette.primary.main}` : '4px solid transparent',
              bgcolor: isLinkActive('/login') ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.05)
              }
            }}
          >
            <ListItemIcon>
              <LoginIcon color={isLinkActive('/login') ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText 
              primary="Login" 
              primaryTypographyProps={{ 
                fontWeight: isLinkActive('/login') ? 600 : 400 
              }}
            />
          </ListItem>
        )}
      </List>
    </Box>
  );

  return (
    <HideOnScroll>
      <AppBar 
        position="sticky" 
        sx={navbarStyle}
        elevation={0}
      >
        <Container maxWidth="lg">
          <Toolbar sx={{ px: { xs: 1, sm: 2 } }}>
            {isMobile && (
              <IconButton
                color={isHomePage && !scrolled ? 'inherit' : 'default'}
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
              <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
                <Logo />
              </Link>
            </Box>
            
            {!isMobile && (
              <Box sx={{ display: 'flex' }}>
                <Button 
                  color={isHomePage && !scrolled ? 'inherit' : 'primary'} 
                  component={Link} 
                  to="/"
                  sx={{ 
                    mx: 1,
                    position: 'relative',
                    '&::after': isLinkActive('/') ? {
                      content: '""',
                      position: 'absolute',
                      bottom: 0,
                      left: '20%',
                      width: '60%',
                      height: '3px',
                      bgcolor: 'primary.main',
                      borderRadius: '2px'
                    } : {}
                  }}
                >
                  Home
                </Button>
                <Button 
                  color={isHomePage && !scrolled ? 'inherit' : 'primary'} 
                  component={Link} 
                  to="/rooms"
                  sx={{ 
                    mx: 1,
                    position: 'relative',
                    '&::after': isLinkActive('/rooms') ? {
                      content: '""',
                      position: 'absolute',
                      bottom: 0,
                      left: '20%',
                      width: '60%',
                      height: '3px',
                      bgcolor: 'primary.main',
                      borderRadius: '2px'
                    } : {}
                  }}
                >
                  Rooms
                </Button>
                {currentUser && (
                  <Button 
                    color={isHomePage && !scrolled ? 'inherit' : 'primary'} 
                    component={Link} 
                    to="/my-reservations"
                    sx={{ 
                      mx: 1,
                      position: 'relative',
                      '&::after': isLinkActive('/my-reservations') ? {
                        content: '""',
                        position: 'absolute',
                        bottom: 0,
                        left: '20%',
                        width: '60%',
                        height: '3px',
                        bgcolor: 'primary.main',
                        borderRadius: '2px'
                      } : {}
                    }}
                  >
                    My Reservations
                  </Button>
                )}
              </Box>
            )}
            
            {currentUser ? (
              <Box>
                <IconButton
                  aria-label="account of current user"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  onClick={handleMenu}
                  color={isHomePage && !scrolled ? 'inherit' : 'default'}
                  sx={{ ml: 2 }}
                >
                  <Avatar sx={{ 
                    width: 40, 
                    height: 40, 
                    bgcolor: 'primary.main',
                    fontWeight: 600,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                    }
                  }}>
                    {currentUser.email.charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>
                <Menu
                  id="menu-appbar"
                  anchorEl={anchorEl}
                  keepMounted
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                  PaperProps={{
                    elevation: 2,
                    sx: {
                      borderRadius: 2,
                      minWidth: 200,
                      mt: 1.5,
                      '& .MuiMenuItem-root': {
                        px: 2,
                        py: 1.5
                      }
                    }
                  }}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <MenuItem disabled>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                      {currentUser.email}
                    </Typography>
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                    <ListItemIcon>
                      <LogoutIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    Logout
                  </MenuItem>
                </Menu>
              </Box>
            ) : (
              <Button 
                color={isHomePage && !scrolled ? 'inherit' : 'primary'} 
                variant={isHomePage && !scrolled ? 'outlined' : 'contained'}
                component={Link} 
                to="/login"
                sx={{ 
                  ml: 2,
                  px: 3,
                  borderColor: isHomePage && !scrolled ? 'white' : undefined,
                }}
              >
                Login
              </Button>
            )}
          </Toolbar>
        </Container>
        
        {/* Mobile Drawer */}
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={handleDrawerToggle}
          PaperProps={{
            sx: {
              borderRadius: '0 12px 12px 0'
            }
          }}
        >
          {drawerContent}
        </Drawer>
      </AppBar>
    </HideOnScroll>
  );
}

export default Navbar;
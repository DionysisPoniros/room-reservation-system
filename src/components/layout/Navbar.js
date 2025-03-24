// src/components/layout/Navbar.js
import React, { useState } from 'react';
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
  Container
} from '@mui/material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import HomeIcon from '@mui/icons-material/Home';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import { useAuth } from '../../contexts/AuthContext';

// RIT Logo component
const RITLogo = () => {
  return (
    <Typography 
      variant="h5" 
      component="div" 
      sx={{ 
        fontWeight: 700,
        letterSpacing: 1,
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {/* You can replace this with an actual image of the RIT logo */}
      {/* <img src="/rit-logo.png" alt="RIT Logo" height="32" /> */}
      <span style={{ marginLeft: '8px' }}>RIT DRRS</span>
    </Typography>
  );
};

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
  
  // Active link indicator
  const isLinkActive = (path) => {
    return location.pathname === path;
  };
  
  // Drawer content
  const drawerContent = (
    <Box 
      sx={{ 
        width: 250,
        pt: 2
      }} 
      role="presentation" 
      onClick={() => setDrawerOpen(false)}
    >
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 700,
              color: theme.palette.primary.main
            }}
          >
            RIT DRRS
          </Typography>
        </Link>
      </Box>
      <Divider sx={{ mb: 2 }} />
      
      <List>
        <ListItem 
          component={Link} 
          to="/"
          sx={{ 
            bgcolor: isLinkActive('/') ? `rgba(247, 105, 2, 0.08)` : 'transparent',
            '&:hover': {
              bgcolor: `rgba(247, 105, 2, 0.05)`
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
            bgcolor: isLinkActive('/rooms') ? `rgba(247, 105, 2, 0.08)` : 'transparent',
            '&:hover': {
              bgcolor: `rgba(247, 105, 2, 0.05)`
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
              bgcolor: isLinkActive('/my-reservations') ? `rgba(247, 105, 2, 0.08)` : 'transparent',
              '&:hover': {
                bgcolor: `rgba(247, 105, 2, 0.05)`
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
                  bgcolor: `rgba(244, 67, 54, 0.08)`
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
              bgcolor: isLinkActive('/login') ? `rgba(247, 105, 2, 0.08)` : 'transparent',
              '&:hover': {
                bgcolor: `rgba(247, 105, 2, 0.05)`
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
    <AppBar 
      position="sticky" 
      sx={{ bgcolor: theme.palette.primary.main }}
      elevation={0}
    >
      <Container maxWidth="lg">
        <Toolbar sx={{ px: { xs: 1, sm: 2 } }}>
          {isMobile && (
            <IconButton
              color="inherit"
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
              <RITLogo />
            </Link>
          </Box>
          
          {!isMobile && (
            <Box sx={{ display: 'flex' }}>
              <Button 
                color="inherit" 
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
                    bgcolor: 'white',
                    borderRadius: '2px'
                  } : {}
                }}
              >
                Home
              </Button>
              <Button 
                color="inherit" 
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
                    bgcolor: 'white',
                    borderRadius: '2px'
                  } : {}
                }}
              >
                Rooms
              </Button>
              {currentUser && (
                <Button 
                  color="inherit" 
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
                      bgcolor: 'white',
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
                color="inherit"
                sx={{ ml: 2 }}
              >
                <Avatar sx={{ 
                  width: 36, 
                  height: 36, 
                  bgcolor: 'white',
                  color: theme.palette.primary.main,
                  fontWeight: 600,
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
                    minWidth: 200,
                    mt: 1.5,
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
              color="inherit" 
              variant="outlined"
              component={Link} 
              to="/login"
              sx={{ 
                ml: 2,
                px: 3,
                borderColor: 'white',
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
      >
        {drawerContent}
      </Drawer>
    </AppBar>
  );
}

export default Navbar;
// src/components/auth/Login.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Container, 
  TextField, 
  Button, 
  Typography, 
  Box, 
  Alert, 
  Paper,
  Grid,
  InputAdornment,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

// Icons
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Campus image path - this would be imported or loaded from environment in a real app
  const campusImagePath = "/images/campus-image-1.jpg"; // Use one of the uploaded campus images

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/');
    } catch (error) {
      setError('Failed to log in. Please check your credentials.');
      console.error(error);
    }

    setLoading(false);
  }

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box 
      sx={{ 
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        alignItems: 'center',
        py: 8,
        bgcolor: '#f5f5f5'
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={0} justifyContent="center">
          <Grid item xs={12} md={10} lg={8}>
            <Paper 
              elevation={2} 
              sx={{ 
                borderRadius: 1,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' }
              }}
            >
              {/* Left side with campus image */}
              {!isMobile && (
                <Box 
                  sx={{ 
                    flex: '0 0 50%',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <Box 
                    component="img"
                    src={campusImagePath}
                    alt="RIT Campus"
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                  <Box 
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      bgcolor: 'rgba(0, 0, 0, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      p: 4,
                      color: 'white'
                    }}
                  >
                    <Typography 
                      variant="h4" 
                      component="h1" 
                      sx={{ 
                        fontWeight: 700, 
                        mb: 2,
                        textAlign: 'center'
                      }}
                    >
                      Welcome to RIT
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        textAlign: 'center',
                        maxWidth: 300,
                        mb: 4
                      }}
                    >
                      Log in to access the Dynamic Room Reservation System
                    </Typography>
                    
                    {/* RIT logo or branding element could go here */}
                    <Box 
                      sx={{ 
                        p: 2, 
                        borderRadius: 1, 
                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                        color: theme.palette.primary.main,
                        fontWeight: 800,
                        fontSize: '2rem'
                      }}
                    >
                      RIT
                    </Box>
                  </Box>
                </Box>
              )}
              
              {/* Right side with login form */}
              <Box 
                sx={{ 
                  flex: '0 0 50%',
                  p: { xs: 3, md: 4 }, 
                  display: 'flex', 
                  flexDirection: 'column'
                }}
              >
                <Box 
                  sx={{ 
                    mb: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}
                >
                  <Typography 
                    component="h1" 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 700, 
                      mb: 1,
                      color: theme.palette.primary.main
                    }}
                  >
                    Login
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    align="center"
                  >
                    Enter your RIT credentials to access your account
                  </Typography>
                </Box>
                
                {error && (
                  <Alert 
                    severity="error" 
                    sx={{ 
                      width: '100%', 
                      mb: 3
                    }}
                  >
                    {error}
                  </Alert>
                )}
                
                <Box 
                  component="form" 
                  onSubmit={handleSubmit} 
                  sx={{ width: '100%' }}
                >
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 3 }}
                  />
                  
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleClickShowPassword}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                    sx={{ mb: 4 }}
                  />
                  
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    sx={{ 
                      py: 1.5,
                      mb: 3,
                      fontWeight: 600
                    }}
                    disabled={loading}
                  >
                    {loading ? 'Signing In...' : 'Sign In'}
                  </Button>
                  
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      Don't have an account? Contact IT Services
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <Link to="/" style={{ color: theme.palette.primary.main, textDecoration: 'none', fontWeight: 600 }}>
                        Forgot Password?
                      </Link>
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default Login;
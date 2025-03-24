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
  useMediaQuery,
  alpha
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

// Icons
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import SchoolIcon from '@mui/icons-material/School';

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
        bgcolor: alpha(theme.palette.primary.main, 0.03)
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={3} justifyContent="center">
          <Grid item xs={12} md={6} lg={5}>
            <Paper 
              elevation={3} 
              sx={{ 
                borderRadius: 3,
                overflow: 'hidden',
                boxShadow: '0 8px 40px rgba(0,0,0,0.12)'
              }}
            >
              <Grid container>
                {!isMobile && (
                  <Grid 
                    item 
                    xs={4}
                    sx={{ 
                      bgcolor: theme.palette.primary.main,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      p: 3,
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Background pattern */}
                    <Box 
                      sx={{
                        position: 'absolute',
                        right: -40,
                        top: -40,
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
                        left: -20,
                        bottom: -20,
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        background: alpha('#fff', 0.1),
                        zIndex: 0
                      }}
                    />
                    
                    <SchoolIcon sx={{ fontSize: 45, mb: 2, position: 'relative', zIndex: 1 }} />
                    <Typography 
                      variant="h5" 
                      component="h2" 
                      sx={{ 
                        fontWeight: 700,
                        textAlign: 'center',
                        mb: 2,
                        position: 'relative',
                        zIndex: 1
                      }}
                    >
                      Welcome Back
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        textAlign: 'center',
                        opacity: 0.8,
                        position: 'relative',
                        zIndex: 1
                      }}
                    >
                      Log in to continue managing your room reservations
                    </Typography>
                  </Grid>
                )}
                
                <Grid item xs={12} sm={isMobile ? 12 : 8}>
                  <Box 
                    sx={{ 
                      p: { xs: 3, sm: 4 }, 
                      display: 'flex', 
                      flexDirection: 'column'
                    }}
                  >
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center',
                        mb: 4
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
                        Enter your credentials to access your account
                      </Typography>
                    </Box>
                    
                    {error && (
                      <Alert 
                        severity="error" 
                        sx={{ 
                          width: '100%', 
                          mb: 3,
                          borderRadius: 2
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
                          borderRadius: 2,
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
                          Don't have an account?{' '}
                          <Link to="/" style={{ color: theme.palette.primary.main, textDecoration: 'none', fontWeight: 600 }}>
                            Register Here
                          </Link>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <Link to="/" style={{ color: theme.palette.primary.main, textDecoration: 'none', fontWeight: 600 }}>
                            Forgot Password?
                          </Link>
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default Login;
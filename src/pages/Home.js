import React from 'react';
import { Container, Typography, Button, Box, Grid, Paper } from '@mui/material';
import { Link } from 'react-router-dom';
function Home() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Dynamic Room Reservation System
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          A simple way to book university rooms for students, faculty, and staff
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          size="large"
          component = {Link}
          to = "/rooms"
          sx={{ mt: 2 }}
        >
          Find Available Rooms
        </Button>
      </Box>
      
      <Grid container spacing={4} sx={{ mt: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h5" component="h2" gutterBottom>
              For Students
            </Typography>
            <Typography paragraph>
              Book study rooms, group collaboration spaces, and event halls for your activities.
            </Typography>
            <Button variant="outlined" sx={{ mt: 'auto' }}>
              Find Study Rooms
            </Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h5" component="h2" gutterBottom>
              For Faculty
            </Typography>
            <Typography paragraph>
              Book lecture halls, meeting rooms, and office spaces for academic sessions.
            </Typography>
            <Button variant="outlined" sx={{ mt: 'auto' }}>
              Find Meeting Rooms
            </Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h5" component="h2" gutterBottom>
              For Staff
            </Typography>
            <Typography paragraph>
              Manage room scheduling and monitor room usage throughout the campus.
            </Typography>
            <Button variant="outlined" sx={{ mt: 'auto' }}>
              Admin Dashboard
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Home;
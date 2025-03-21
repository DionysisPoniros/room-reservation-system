import React from 'react';
import { Container, Typography, Box } from '@mui/material';

function Rooms() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Available Rooms
        </Typography>
        <Typography variant="body1">
          This page will show a list of available rooms for booking.
        </Typography>
      </Box>
    </Container>
  );
}

export default Rooms;
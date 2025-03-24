// src/components/admin/AdminRoomLoader.js
import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Alert, 
  Paper, 
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider
} from '@mui/material';
import { populateRoomsInFirebase } from '../../data/rooms-data';

function AdminRoomLoader() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handlePopulateRooms = async () => {
    if (window.confirm('Are you sure you want to populate the database with RIT rooms? This may add duplicate rooms if run multiple times.')) {
      try {
        setLoading(true);
        setError(null);
        
        const result = await populateRoomsInFirebase();
        
        if (result.success) {
          setResult(result);
        } else {
          setError(result.error);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error populating rooms:", err);
        setError(err.message);
        setLoading(false);
      }
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        Admin Tools: Load RIT Rooms
      </Typography>
      
      <Typography paragraph color="text.secondary">
        This tool will populate your Firebase database with RIT rooms from Max Lowenthal Hall and Wallace Library.
        Use this only for initial setup or if you need to restore the room data.
      </Typography>
      
      <Divider sx={{ my: 2 }} />
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Room Data Summary
        </Typography>
        
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Building</TableCell>
                <TableCell>Room Count</TableCell>
                <TableCell>Types</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>Max Lowenthal Hall</TableCell>
                <TableCell>52</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    <Chip label="Classroom" size="small" />
                    <Chip label="Lecture Hall" size="small" />
                    <Chip label="Lab" size="small" />
                    <Chip label="Team Room" size="small" />
                    <Chip label="Conference Room" size="small" />
                    <Chip label="Outdoor Space" size="small" />
                    <Chip label="Atrium" size="small" />
                  </Box>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Wallace Library</TableCell>
                <TableCell>48</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    <Chip label="Classroom" size="small" />
                    <Chip label="Group Study Room" size="small" />
                    <Chip label="Individual Study Room" size="small" />
                    <Chip label="Lounge" size="small" />
                  </Box>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handlePopulateRooms} 
          disabled={loading}
          sx={{ minWidth: 200 }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Populate RIT Rooms'}
        </Button>
        
        {result && (
          <Alert severity="success" sx={{ ml: 2, flexGrow: 1 }}>
            Successfully added {result.count} rooms to the database!
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ ml: 2, flexGrow: 1 }}>
            Error: {error}
          </Alert>
        )}
      </Box>
    </Paper>
  );
}

export default AdminRoomLoader;
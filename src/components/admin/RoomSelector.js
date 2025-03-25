// src/components/admin/RoomSelector.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  TextField,
  Grid,
  Autocomplete,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import { getRooms } from '../../services/roomService';

function RoomSelector({ onChange, initialRoomId }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState('');

  // Fetch rooms data
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const roomsData = await getRooms();
        setRooms(roomsData);
        
        // Extract unique buildings
        const uniqueBuildings = new Set();
        roomsData.forEach(room => {
          if (room.building) {
            uniqueBuildings.add(room.building);
          }
        });
        
        setBuildings(Array.from(uniqueBuildings).sort());
        
        // If initialRoomId is provided, select that room
        if (initialRoomId) {
          const initialRoom = roomsData.find(room => room.id === initialRoomId);
          if (initialRoom) {
            setSelectedRoom(initialRoom);
            if (initialRoom.building) {
              setSelectedBuilding(initialRoom.building);
            }
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching rooms:", err);
        setError("Failed to load rooms data. Please try again.");
        setLoading(false);
      }
    };
    
    fetchRooms();
  }, [initialRoomId]);

  const handleBuildingChange = (event) => {
    setSelectedBuilding(event.target.value);
    setSelectedRoom(null);
    
    // Notify parent component
    if (onChange) {
      onChange(null);
    }
  };

  const handleRoomChange = (event, newValue) => {
    setSelectedRoom(newValue);
    
    // Notify parent component
    if (onChange) {
      onChange(newValue ? newValue.id : null);
    }
  };

  // Filter rooms by selected building
  const filteredRooms = selectedBuilding 
    ? rooms.filter(room => room.building === selectedBuilding)
    : rooms;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={20} />
        <Typography>Loading rooms...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel id="building-select-label">Building</InputLabel>
            <Select
              labelId="building-select-label"
              value={selectedBuilding}
              label="Building"
              onChange={handleBuildingChange}
            >
              <MenuItem value="">All Buildings</MenuItem>
              {buildings.map((building) => (
                <MenuItem key={building} value={building}>
                  {building}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Autocomplete
            value={selectedRoom}
            onChange={handleRoomChange}
            options={filteredRooms}
            getOptionLabel={(option) => option.name}
            groupBy={(option) => option.type || 'Other'}
            renderInput={(params) => (
              <TextField 
                {...params} 
                label="Select Room" 
                fullWidth 
              />
            )}
            renderOption={(props, option) => (
              <li {...props}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography>{option.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.location} • Capacity: {option.capacity}
                  </Typography>
                </Box>
              </li>
            )}
            noOptionsText="No rooms found"
          />
        </Grid>
      </Grid>
      
      {selectedRoom && (
        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip 
            label={`Type: ${selectedRoom.type || 'Not specified'}`} 
            variant="outlined" 
            size="small" 
          />
          <Chip 
            label={`Capacity: ${selectedRoom.capacity}`} 
            variant="outlined" 
            size="small" 
          />
          <Chip 
            label={`Building: ${selectedRoom.building || 'Not specified'}`}
            variant="outlined" 
            size="small" 
          />
        </Box>
      )}
    </Box>
  );
}

export default RoomSelector;
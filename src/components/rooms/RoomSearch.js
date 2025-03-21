import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Grid, 
  TextField, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Chip,
  Autocomplete,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Slider
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Equipment options
const equipmentOptions = [
  "Projector",
  "Whiteboard",
  "Computer",
  "Video Conference",
  "Smart Board",
  "TV Screen",
  "Audio System",
  "Document Camera"
];

// Room types
const roomTypes = [
  "Lecture Hall",
  "Classroom",
  "Lab",
  "Meeting Room",
  "Study Room",
  "Conference Room",
  "Office",
  "Auditorium"
];

// Buildings
const buildings = [
  "Liberal Arts",
  "Science Building",
  "Engineering Hall",
  "Business Center",
  "Student Center",
  "Library"
];

function RoomSearch({ onSearch }) {
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date(new Date().setHours(new Date().getHours() + 1)));
  const [capacity, setCapacity] = useState(1);
  const [selectedEquipment, setSelectedEquipment] = useState([]);
  const [roomType, setRoomType] = useState('');
  const [building, setBuilding] = useState('');
  const [advanced, setAdvanced] = useState(false);

  const handleSearch = () => {
    onSearch({
      startTime,
      endTime,
      filters: {
        capacity,
        equipment: selectedEquipment,
        type: roomType,
        building
      }
    });
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Find Available Rooms
      </Typography>
      
      <Box component="form" noValidate>
        <Grid container spacing={3}>
          {/* Date and Time Selection */}
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                label="Start Time"
                value={startTime}
                onChange={setStartTime}
                renderInput={(params) => <TextField {...params} fullWidth />}
                minDateTime={new Date()}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                label="End Time"
                value={endTime}
                onChange={setEndTime}
                renderInput={(params) => <TextField {...params} fullWidth />}
                minDateTime={startTime}
              />
            </LocalizationProvider>
          </Grid>
          
          {/* Capacity Slider */}
          <Grid item xs={12}>
            <Typography id="capacity-slider" gutterBottom>
              Capacity: {capacity} {capacity === 1 ? 'person' : 'people'}
            </Typography>
            <Slider
              value={capacity}
              onChange={(e, newValue) => setCapacity(newValue)}
              aria-labelledby="capacity-slider"
              valueLabelDisplay="auto"
              min={1}
              max={100}
              marks={[
                { value: 1, label: '1' },
                { value: 10, label: '10' },
                { value: 50, label: '50' },
                { value: 100, label: '100+' }
              ]}
            />
          </Grid>
          
          {/* Advanced Options Toggle */}
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox 
                  checked={advanced} 
                  onChange={(e) => setAdvanced(e.target.checked)} 
                />
              }
              label="Show Advanced Options"
            />
          </Grid>
          
          {advanced && (
            <>
              {/* Room Type */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="room-type-label">Room Type</InputLabel>
                  <Select
                    labelId="room-type-label"
                    value={roomType}
                    label="Room Type"
                    onChange={(e) => setRoomType(e.target.value)}
                  >
                    <MenuItem value="">Any</MenuItem>
                    {roomTypes.map((type) => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Building */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="building-label">Building</InputLabel>
                  <Select
                    labelId="building-label"
                    value={building}
                    label="Building"
                    onChange={(e) => setBuilding(e.target.value)}
                  >
                    <MenuItem value="">Any</MenuItem>
                    {buildings.map((building) => (
                      <MenuItem key={building} value={building}>{building}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Equipment */}
              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  id="equipment-tags"
                  options={equipmentOptions}
                  value={selectedEquipment}
                  onChange={(event, newValue) => {
                    setSelectedEquipment(newValue);
                  }}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip 
                        variant="outlined" 
                        label={option} 
                        {...getTagProps({ index })} 
                      />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      variant="outlined"
                      label="Required Equipment"
                      placeholder="Select Equipment"
                    />
                  )}
                />
              </Grid>
            </>
          )}
          
          {/* Search Button */}
          <Grid item xs={12}>
            <Button 
              variant="contained" 
              color="primary" 
              fullWidth
              onClick={handleSearch}
            >
              Search Available Rooms
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
}

export default RoomSearch;
// src/components/rooms/RoomSearch.js - Fixed
import React, { useState, useEffect } from 'react';
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
  Slider,
  IconButton,
  Collapse,
  useTheme,
  CircularProgress,
  Alert
} from '@mui/material';
import { DateTimePicker, DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { set, addHours } from 'date-fns';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';

// Icons
import FilterListIcon from '@mui/icons-material/FilterList';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SearchIcon from '@mui/icons-material/Search';

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

function RoomSearch({ onSearch }) {
  const theme = useTheme();
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(addHours(new Date(), 1));
  const [capacity, setCapacity] = useState(1);
  const [selectedEquipment, setSelectedEquipment] = useState([]);
  const [roomType, setRoomType] = useState('');
  const [building, setBuilding] = useState('');
  const [advanced, setAdvanced] = useState(false);
  const [searchMode, setSearchMode] = useState('specific'); // 'specific' or 'day'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [roomTypes, setRoomTypes] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [error, setError] = useState(null);
  
  // Fetch room types and buildings from database
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        setLoadingFilters(true);
        setError(null);
        
        // Fetch all rooms
        const roomsCollection = collection(db, 'rooms');
        const roomsSnapshot = await getDocs(query(roomsCollection, orderBy('name')));
        
        // Extract unique room types and buildings
        const types = new Set();
        const buildingNames = new Set();
        
        roomsSnapshot.forEach(doc => {
          const roomData = doc.data();
          if (roomData.type) types.add(roomData.type);
          
          // Extract building from location or a dedicated field if available
          if (roomData.building) {
            buildingNames.add(roomData.building);
          } else if (roomData.location) {
            // Try to extract building from location (this is just an example approach)
            const locationParts = roomData.location.split(',');
            if (locationParts.length > 0) {
              buildingNames.add(locationParts[0].trim());
            }
          }
        });
        
        setRoomTypes(Array.from(types).sort());
        setBuildings(Array.from(buildingNames).sort());
        setLoadingFilters(false);
        
        console.log("Room types loaded:", Array.from(types));
        console.log("Buildings loaded:", Array.from(buildingNames));
      } catch (error) {
        console.error("Error fetching filter options:", error);
        setError("Failed to load filter options. Please refresh the page.");
        setLoadingFilters(false);
      }
    };
    
    fetchFilterOptions();
  }, []);

  const handleSearch = () => {
    try {
      // In day search mode, set start and end times to cover the whole day
      let searchStartTime = startTime;
      let searchEndTime = endTime;
      
      if (searchMode === 'day') {
        // Set start time to 7:00 AM of selected date
        searchStartTime = set(selectedDate, { hours: 7, minutes: 0, seconds: 0, milliseconds: 0 });
        // Set end time to 11:00 PM of selected date
        searchEndTime = set(selectedDate, { hours: 23, minutes: 0, seconds: 0, milliseconds: 0 });
      }
      
      const searchParams = {
        startTime: searchStartTime,
        endTime: searchEndTime,
        filters: {
          capacity: capacity || 1,
          equipment: selectedEquipment || [],
          type: roomType || '',
          building: building || ''
        }
      };
      
      console.log("Search parameters:", searchParams);
      
      // Call parent's onSearch function
      onSearch(searchParams);
      
    } catch (err) {
      console.error("Error preparing search:", err);
      setError("Failed to prepare search. Please try again.");
    }
  };

  // Update end time when start time changes
  const handleStartTimeChange = (newStartTime) => {
    try {
      setStartTime(newStartTime);
      // Ensure end time is at least 1 hour after start time
      if (endTime <= newStartTime) {
        setEndTime(addHours(newStartTime, 1));
      }
    } catch (err) {
      console.error("Error updating start time:", err);
    }
  };

  const handleSearchTypeChange = (newMode) => {
    if (searchMode !== newMode) {
      setSearchMode(newMode);
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
          Find Available Rooms
        </Typography>
        
        <FormControl component="fieldset">
          <FormGroup row>
            <FormControlLabel
              control={
                <Checkbox 
                  checked={advanced} 
                  onChange={(e) => setAdvanced(e.target.checked)} 
                  icon={<FilterListIcon />}
                  checkedIcon={<FilterListIcon />}
                />
              }
              label={advanced ? "Hide Filters" : "Show Filters"}
            />
          </FormGroup>
        </FormControl>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Box component="form" noValidate>
        <Grid container spacing={3}>
          {/* Search Type Selection */}
          <Grid item xs={12}>
            <FormControl component="fieldset">
              <FormGroup row>
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={searchMode === 'specific'} 
                      onChange={() => handleSearchTypeChange('specific')} 
                    />
                  }
                  label="Search for Specific Time Range"
                />
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={searchMode === 'day'} 
                      onChange={() => handleSearchTypeChange('day')} 
                    />
                  }
                  label="Search Availability for Full Day"
                />
              </FormGroup>
            </FormControl>
          </Grid>
          
          {/* Date and Time Selection */}
          {searchMode === 'specific' ? (
            <>
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateTimePicker
                    label="Start Time"
                    value={startTime}
                    onChange={handleStartTimeChange}
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
            </>
          ) : (
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Select Date"
                  value={selectedDate}
                  onChange={setSelectedDate}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                  minDate={new Date()}
                />
              </LocalizationProvider>
            </Grid>
          )}
          
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
              max={10}
              marks={[
                { value: 1, label: '1' },
                { value: 2, label: '2' },
                { value: 4, label: '4' },
                { value: 6, label: '6' },
                { value: 8, label: '8' },
                { value: 10, label: '10+' }
              ]}
            />
          </Grid>
          
          {/* Advanced Options */}
          <Collapse in={advanced} sx={{ width: '100%' }}>
            <Grid container spacing={3} sx={{ mt: 0 }}>
              {/* Room Type */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="room-type-label">Room Type</InputLabel>
                  <Select
                    labelId="room-type-label"
                    value={roomType}
                    label="Room Type"
                    onChange={(e) => {
                      console.log("Room type selected:", e.target.value);
                      setRoomType(e.target.value);
                    }}
                    disabled={loadingFilters}
                  >
                    <MenuItem value="">Any</MenuItem>
                    {loadingFilters ? (
                      <MenuItem disabled>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CircularProgress size={20} sx={{ mr: 1 }} />
                          Loading room types...
                        </Box>
                      </MenuItem>
                    ) : (
                      roomTypes.map((type) => (
                        <MenuItem key={type} value={type}>{type}</MenuItem>
                      ))
                    )}
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
                    onChange={(e) => {
                      console.log("Building selected:", e.target.value);
                      setBuilding(e.target.value);
                    }}
                    disabled={loadingFilters}
                  >
                    <MenuItem value="">Any</MenuItem>
                    {loadingFilters ? (
                      <MenuItem disabled>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CircularProgress size={20} sx={{ mr: 1 }} />
                          Loading buildings...
                        </Box>
                      </MenuItem>
                    ) : (
                      buildings.map((buildingName) => (
                        <MenuItem key={buildingName} value={buildingName}>{buildingName}</MenuItem>
                      ))
                    )}
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
                    console.log("Equipment selected:", newValue);
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
            </Grid>
          </Collapse>
          
          {/* Search Button */}
          <Grid item xs={12}>
            <Button 
              variant="contained" 
              color="primary" 
              fullWidth
              onClick={handleSearch}
              startIcon={<SearchIcon />}
              size="large"
              sx={{ py: 1.5 }}
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
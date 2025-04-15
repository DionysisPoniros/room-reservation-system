// src/components/admin/EnhancedRoomManager.js
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Grid, 
  Divider, 
  Tab, 
  Tabs, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  IconButton, 
  Chip, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Snackbar, 
  Alert, 
  CircularProgress,
  Autocomplete
} from '@mui/material';

// Icons
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import RefreshIcon from '@mui/icons-material/Refresh';

import { collection, addDoc, updateDoc, deleteDoc, getDocs, doc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';

// Room types and equipment options
const ROOM_TYPES = [
  "Classroom",
  "Lecture Hall",
  "Lab",
  "Team Room",
  "Conference Room",
  "Group Study Room",
  "Individual Study Room",
  "Lounge",
  "Atrium",
  "Outdoor Space"
];

const EQUIPMENT_OPTIONS = [
  "Projector",
  "Whiteboard",
  "Computer",
  "Video Conference",
  "Smart Board",
  "TV Screen",
  "Audio System",
  "Document Camera"
];

const BUILDINGS = [
  "Max Lowenthal Hall",
  "Wallace Library"
];

const FLOORS = [
  "1st Floor",
  "2nd Floor",
  "3rd Floor",
  "4th Floor",
  "A-Level"
];

// Default room template
const DEFAULT_ROOM = {
  name: '',
  building: '',
  location: '',
  floor: '',
  type: '',
  capacity: 1,
  equipment: [],
  description: ''
};

function EnhancedRoomManager() {
  // State for the overall component
  const [activeTab, setActiveTab] = useState(0);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Queue of rooms to be added
  const [roomQueue, setRoomQueue] = useState([]);
  
  // State for manual room entry
  const [newRoom, setNewRoom] = useState({ ...DEFAULT_ROOM });
  
  // State for JSON import
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState(null);
  
  // State for room editing
  const [editRoom, setEditRoom] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // State for room deletion
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  
  // State for room filtering
  const [filterBuilding, setFilterBuilding] = useState('');
  const [filterFloor, setFilterFloor] = useState('');
  const [filterType, setFilterType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredRooms, setFilteredRooms] = useState([]);
  
  // Fetch existing rooms on component mount
  useEffect(() => {
    fetchRooms();
  }, []);
  
  // Apply filters when rooms or filter criteria change
  useEffect(() => {
    applyFilters();
  }, [rooms, filterBuilding, filterFloor, filterType, searchTerm]);
  
  // Fetch all rooms from Firestore
  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Create query with ordering
      let roomsQuery = query(collection(db, 'rooms'), orderBy('name'));
      
      const snapshot = await getDocs(roomsQuery);
      const roomsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`Fetched ${roomsData.length} rooms from Firestore`);
      setRooms(roomsData);
      setFilteredRooms(roomsData);
    } catch (err) {
      console.error("Error fetching rooms:", err);
      setError("Failed to load rooms. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  // Apply filters to rooms
  const applyFilters = () => {
    let filtered = [...rooms];
    
    // Apply building filter
    if (filterBuilding) {
      filtered = filtered.filter(room => room.building === filterBuilding);
    }
    
    // Apply floor filter
    if (filterFloor) {
      filtered = filtered.filter(room => room.floor === filterFloor);
    }
    
    // Apply type filter
    if (filterType) {
      filtered = filtered.filter(room => room.type === filterType);
    }
    
    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(room => 
        (room.name && room.name.toLowerCase().includes(term)) ||
        (room.location && room.location.toLowerCase().includes(term)) ||
        (room.description && room.description.toLowerCase().includes(term))
      );
    }
    
    setFilteredRooms(filtered);
  };
  
  // Clear all filters
  const clearFilters = () => {
    setFilterBuilding('');
    setFilterFloor('');
    setFilterType('');
    setSearchTerm('');
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Handle form field changes for manual entry
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewRoom({
      ...newRoom,
      [name]: value
    });
  };
  
  // Handle equipment selection
  const handleEquipmentChange = (event, newValue) => {
    setNewRoom({
      ...newRoom,
      equipment: newValue
    });
  };
  
  // Add room to queue (from manual entry)
  const addToQueue = () => {
    // Validate the room data
    if (!newRoom.name) {
      setError("Room name is required");
      return;
    }
    
    if (!newRoom.building) {
      setError("Building is required");
      return;
    }
    
    // Add location based on building and floor if not provided
    let roomToAdd = { ...newRoom };
    if (!roomToAdd.location && roomToAdd.building && roomToAdd.floor) {
      roomToAdd.location = `${roomToAdd.building}, ${roomToAdd.floor}`;
    }
    
    // Add the room to the queue with a temporary ID
    setRoomQueue([...roomQueue, { ...roomToAdd, tempId: Date.now().toString() }]);
    
    // Reset the form
    setNewRoom({ ...DEFAULT_ROOM });
    
    // Show success message
    setSuccess("Room added to queue successfully");
    
    // Switch to the queue tab
    setActiveTab(2);
  };
  
  // Remove room from queue
  const removeFromQueue = (tempId) => {
    setRoomQueue(roomQueue.filter(room => room.tempId !== tempId));
    setSuccess("Room removed from queue");
  };
  
  // Edit room in queue
  const editQueueItem = (tempId) => {
    const roomToEdit = roomQueue.find(room => room.tempId === tempId);
    if (roomToEdit) {
      setEditRoom(roomToEdit);
      setEditDialogOpen(true);
    }
  };
  
  // Handle JSON input change
  const handleJsonChange = (e) => {
    setJsonInput(e.target.value);
    setJsonError(null);
  };
  
  // Parse and validate JSON input
  const parseJson = () => {
    try {
      if (!jsonInput.trim()) {
        setJsonError("Please enter JSON data");
        return;
      }
      
      // Try to parse the JSON
      let parsedData;
      
      try {
        parsedData = JSON.parse(jsonInput);
      } catch (err) {
        setJsonError(`Invalid JSON: ${err.message}`);
        return;
      }
      
      // Check if it's an array or object
      if (Array.isArray(parsedData)) {
        // Process array of rooms
        processRoomArray(parsedData);
      } else if (typeof parsedData === 'object' && parsedData !== null) {
        // Process single room
        processRoomObject(parsedData);
      } else {
        setJsonError("Invalid JSON format. Expected an array of rooms or a single room object.");
        return;
      }
      
      // Clear the JSON input on success
      setJsonInput('');
      
      // Show success message
      setSuccess("Rooms from JSON added to queue");
      
      // Switch to the queue tab
      setActiveTab(2);
    } catch (err) {
      console.error("Error parsing JSON:", err);
      setJsonError(`Error processing JSON: ${err.message}`);
    }
  };
  
  // Process an array of rooms from JSON
  const processRoomArray = (roomsArray) => {
    if (!Array.isArray(roomsArray)) {
      setJsonError("Expected an array of rooms");
      return;
    }
    
    const validRooms = [];
    const invalidRooms = [];
    
    roomsArray.forEach((room, index) => {
      if (!validateRoomObject(room)) {
        invalidRooms.push({ index, room });
        return;
      }
      
      // Add location based on building and floor if not provided
      let roomToAdd = { ...room };
      if (!roomToAdd.location && roomToAdd.building && roomToAdd.floor) {
        roomToAdd.location = `${roomToAdd.building}, ${roomToAdd.floor}`;
      }
      
      // Add the room to the valid rooms with a temporary ID
      validRooms.push({
        ...roomToAdd,
        tempId: `json-${Date.now()}-${index}`
      });
    });
    
    if (invalidRooms.length > 0) {
      // If there are invalid rooms, show error but still add the valid ones
      setJsonError(`${invalidRooms.length} rooms have invalid format and were skipped`);
    }
    
    // Add valid rooms to the queue
    if (validRooms.length > 0) {
      setRoomQueue([...roomQueue, ...validRooms]);
    }
  };
  
  // Process a single room object from JSON
  const processRoomObject = (roomObject) => {
    if (!validateRoomObject(roomObject)) {
      setJsonError("Invalid room object format");
      return;
    }
    
    // Add location based on building and floor if not provided
    let roomToAdd = { ...roomObject };
    if (!roomToAdd.location && roomToAdd.building && roomToAdd.floor) {
      roomToAdd.location = `${roomToAdd.building}, ${roomToAdd.floor}`;
    }
    
    // Add the room to the queue with a temporary ID
    setRoomQueue([...roomQueue, { ...roomToAdd, tempId: `json-${Date.now()}` }]);
  };
  
  // Validate a room object
  const validateRoomObject = (room) => {
    // Basic validation: must have name and building
    if (!room || typeof room !== 'object') return false;
    
    if (!room.name || typeof room.name !== 'string') return false;
    
    if (!room.building || typeof room.building !== 'string') return false;
    
    // Ensure capacity is a number
    if (room.capacity && isNaN(Number(room.capacity))) return false;
    
    // Ensure equipment is an array if provided
    if (room.equipment && !Array.isArray(room.equipment)) return false;
    
    return true;
  };
  
  // Save the queue to the database
  const saveQueue = async () => {
    if (roomQueue.length === 0) {
      setError("No rooms in the queue to save");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Process each room in the queue
      const results = await Promise.all(roomQueue.map(async (room) => {
        // Remove temporary ID before saving
        const { tempId, ...roomData } = room;
        
        try {
          // Add room to Firestore
          console.log(`Adding room to Firestore:`, roomData);
          const docRef = await addDoc(collection(db, 'rooms'), roomData);
          console.log(`Room added with ID: ${docRef.id}`);
          return { success: true, id: docRef.id, name: room.name };
        } catch (err) {
          console.error(`Error adding room ${room.name}:`, err);
          return { success: false, name: room.name, error: err.message };
        }
      }));
      
      // Count successes and failures
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      // Refresh the room list
      await fetchRooms();
      
      // Clear the queue on success
      setRoomQueue([]);
      
      // Show success message
      setSuccess(`Added ${successful} rooms successfully. ${failed > 0 ? `${failed} rooms failed.` : ''}`);
      
      // Switch to the rooms list tab
      setActiveTab(3);
    } catch (err) {
      console.error("Error saving queue:", err);
      setError(`Failed to save rooms: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle edit room dialog close
  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setEditRoom(null);
  };
  
  // Save edited room
  const saveEditedRoom = () => {
    if (!editRoom) return;
    
    // Validate the room data
    if (!editRoom.name) {
      setError("Room name is required");
      return;
    }
    
    if (!editRoom.building) {
      setError("Building is required");
      return;
    }
    
    // Add location based on building and floor if not provided
    let roomToSave = { ...editRoom };
    if (!roomToSave.location && roomToSave.building && roomToSave.floor) {
      roomToSave.location = `${roomToSave.building}, ${roomToSave.floor}`;
    }
    
    if (roomToSave.tempId) {
      // Update room in queue
      setRoomQueue(roomQueue.map(room => 
        room.tempId === roomToSave.tempId ? roomToSave : room
      ));
      setSuccess("Room updated in queue");
    } else {
      // Update room in database
      updateRoomInDatabase(roomToSave);
    }
    
    // Close the dialog
    handleEditDialogClose();
  };
  
  // Update room in Firebase
  const updateRoomInDatabase = async (room) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get a reference to the room document
      const roomRef = doc(db, 'rooms', room.id);
      
      // Remove the id field before updating
      const { id, ...roomData } = room;
      
      // Update the document
      console.log(`Updating room ${id} in Firestore:`, roomData);
      await updateDoc(roomRef, roomData);
      console.log(`Room ${id} updated successfully`);
      
      // Refresh the room list
      await fetchRooms();
      
      // Show success message
      setSuccess(`Room ${room.name} updated successfully`);
    } catch (err) {
      console.error(`Error updating room ${room.name}:`, err);
      setError(`Failed to update room: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Open edit dialog for existing room
  const openEditDialog = (room) => {
    setEditRoom({ ...room });
    setEditDialogOpen(true);
  };
  
  // Open delete confirmation dialog
  const openDeleteDialog = (room) => {
    setRoomToDelete(room);
    setDeleteConfirmOpen(true);
  };
  
  // Delete room from database
  const deleteRoom = async () => {
    if (!roomToDelete) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Deleting room ${roomToDelete.id} from Firestore`);
      
      // Delete the room document
      await deleteDoc(doc(db, 'rooms', roomToDelete.id));
      
      console.log(`Room ${roomToDelete.id} deleted successfully`);
      
      // Refresh the room list
      await fetchRooms();
      
      // Show success message
      setSuccess(`Room ${roomToDelete.name} deleted successfully`);
      
      // Close the dialog
      setDeleteConfirmOpen(false);
      setRoomToDelete(null);
    } catch (err) {
      console.error(`Error deleting room ${roomToDelete.name}:`, err);
      setError(`Failed to delete room: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle input change in edit dialog
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditRoom({
      ...editRoom,
      [name]: value
    });
  };
  
  // Handle equipment change in edit dialog
  const handleEditEquipmentChange = (event, newValue) => {
    setEditRoom({
      ...editRoom,
      equipment: newValue
    });
  };
  
  // Handle Snackbar close
  const handleSnackbarClose = () => {
    setSuccess(null);
    setError(null);
  };
  
  // Get unique values for filters
  const getUniqueBuildings = () => {
    const buildings = new Set();
    rooms.forEach(room => {
      if (room.building) buildings.add(room.building);
    });
    return Array.from(buildings).sort();
  };
  
  const getUniqueFloors = () => {
    const floors = new Set();
    rooms.forEach(room => {
      if (room.floor) floors.add(room.floor);
    });
    return Array.from(floors).sort();
  };
  
  const getUniqueTypes = () => {
    const types = new Set();
    rooms.forEach(room => {
      if (room.type) types.add(room.type);
    });
    return Array.from(types).sort();
  };
  
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Enhanced Room Management
      </Typography>
      
      <Paper>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="room management tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Manual Entry" />
          <Tab label="JSON Import" />
          <Tab label={`Queue (${roomQueue.length})`} />
          <Tab label="Room Management" />
        </Tabs>
        
        {/* Manual Entry Tab */}
        <Box hidden={activeTab !== 0} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Add a New Room
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                name="name"
                label="Room Name"
                value={newRoom.name}
                onChange={handleInputChange}
                fullWidth
                required
                helperText="Example: LOW-1050"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel id="building-label">Building</InputLabel>
                <Select
                  labelId="building-label"
                  name="building"
                  value={newRoom.building}
                  onChange={handleInputChange}
                  label="Building"
                >
                  {BUILDINGS.map((building) => (
                    <MenuItem key={building} value={building}>{building}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="location"
                label="Location"
                value={newRoom.location}
                onChange={handleInputChange}
                fullWidth
                helperText="Example: Max Lowenthal Hall, 1st Floor"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="floor-label">Floor</InputLabel>
                <Select
                  labelId="floor-label"
                  name="floor"
                  value={newRoom.floor}
                  onChange={handleInputChange}
                  label="Floor"
                >
                  {FLOORS.map((floor) => (
                    <MenuItem key={floor} value={floor}>{floor}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="type-label">Room Type</InputLabel>
                <Select
                  labelId="type-label"
                  name="type"
                  value={newRoom.type}
                  onChange={handleInputChange}
                  label="Room Type"
                >
                  {ROOM_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="capacity"
                label="Capacity"
                value={newRoom.capacity}
                onChange={handleInputChange}
                fullWidth
                type="number"
                inputProps={{ min: 1 }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Autocomplete
                multiple
                id="equipment-tags"
                options={EQUIPMENT_OPTIONS}
                value={newRoom.equipment || []}
                onChange={handleEquipmentChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Equipment"
                    placeholder="Select equipment"
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Description"
                value={newRoom.description || ''}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={3}
                helperText="Optional room description"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Button 
                variant="contained" 
                color="primary"
                onClick={addToQueue}
                startIcon={<AddIcon />}
                sx={{ mt: 2 }}
              >
                Add to Queue
              </Button>
            </Grid>
          </Grid>
        </Box>
        
        {/* JSON Import Tab */}
        <Box hidden={activeTab !== 1} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Import Rooms from JSON
          </Typography>
          
          <TextField
            label="JSON Data"
            multiline
            rows={10}
            value={jsonInput}
            onChange={handleJsonChange}
            fullWidth
            error={!!jsonError}
            helperText={jsonError || "Paste JSON data here. Can be a single room object or array of rooms."}
            sx={{ mb: 2 }}
          />
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Example Format:
            </Typography>
            <Typography variant="body2" component="pre" sx={{ 
              bgcolor: 'background.paper', 
              p: 2, 
              borderRadius: 1,
              border: '1px solid #e0e0e0',
              fontSize: '0.875rem',
              overflowX: 'auto'
            }}>
              {JSON.stringify([
                {
                  name: "LOW-1050",
                  building: "Max Lowenthal Hall",
                  location: "Max Lowenthal Hall, 1st Floor",
                  floor: "1st Floor",
                  type: "Lecture Hall",
                  capacity: 120,
                  equipment: ["Projector", "Computer", "Audio System"],
                  description: "Gueldenpfennig Auditorium"
                }
              ], null, 2)}
            </Typography>
          </Box>
          
          <Button 
            variant="contained" 
            color="primary"
            onClick={parseJson}
            startIcon={<ContentPasteIcon />}
          >
            Parse and Add to Queue
          </Button>
        </Box>
        
        {/* Queue Tab */}
        <Box hidden={activeTab !== 2} sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Room Queue ({roomQueue.length})
            </Typography>
            
            <Box>
              <Button 
                variant="contained" 
                color="primary"
                onClick={saveQueue}
                disabled={roomQueue.length === 0 || loading}
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              >
                Save All to Database
              </Button>
            </Box>
          </Box>
          
          {roomQueue.length === 0 ? (
            <Typography variant="body1" sx={{ textAlign: 'center', my: 4, color: 'text.secondary' }}>
              No rooms in the queue. Add rooms using Manual Entry or JSON Import.
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Building</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Capacity</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {roomQueue.map((room) => (
                    <TableRow key={room.tempId}>
                      <TableCell>{room.name}</TableCell>
                      <TableCell>{room.building}</TableCell>
                      <TableCell>{room.type}</TableCell>
                      <TableCell>{room.capacity}</TableCell>
                      <TableCell>
                        <IconButton 
                          size="small" 
                          onClick={() => editQueueItem(room.tempId)}
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => removeFromQueue(room.tempId)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
        
        {/* Room Management Tab */}
        <Box hidden={activeTab !== 3} sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Room Management ({filteredRooms.length} of {rooms.length})
            </Typography>
            
            <Button 
              variant="outlined" 
              onClick={fetchRooms}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
            >
              Refresh
            </Button>
          </Box>
          
          {/* Filters */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField 
                  label="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  fullWidth
                  InputProps={{
                    startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel id="filter-building-label">Building</InputLabel>
                  <Select
                    labelId="filter-building-label"
                    value={filterBuilding}
                    onChange={(e) => setFilterBuilding(e.target.value)}
                    label="Building"
                  >
                    <MenuItem value="">All Buildings</MenuItem>
                    {getUniqueBuildings().map((building) => (
                      <MenuItem key={building} value={building}>{building}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel id="filter-floor-label">Floor</InputLabel>
                  <Select
                    labelId="filter-floor-label"
                    value={filterFloor}
                    onChange={(e) => setFilterFloor(e.target.value)}
                    label="Floor"
                  >
                    <MenuItem value="">All Floors</MenuItem>
                    {getUniqueFloors().map((floor) => (
                      <MenuItem key={floor} value={floor}>{floor}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel id="filter-type-label">Type</InputLabel>
                  <Select
                    labelId="filter-type-label"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    label="Type"
                  >
                    <MenuItem value="">All Types</MenuItem>
                    {getUniqueTypes().map((type) => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={2}>
                <Button 
                  variant="outlined" 
                  onClick={clearFilters}
                  startIcon={<ClearIcon />}
                  fullWidth
                >
                  Clear Filters
                </Button>
              </Grid>
            </Grid>
          </Paper>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredRooms.length === 0 ? (
            <Typography variant="body1" sx={{ textAlign: 'center', my: 4, color: 'text.secondary' }}>
              No rooms match the current filters.
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Building</TableCell>
                    <TableCell>Floor</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Capacity</TableCell>
                    <TableCell>Equipment</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRooms.map((room) => (
                    <TableRow key={room.id}>
                      <TableCell>{room.name}</TableCell>
                      <TableCell>{room.building}</TableCell>
                      <TableCell>{room.floor}</TableCell>
                      <TableCell>{room.type}</TableCell>
                      <TableCell>{room.capacity}</TableCell>
                      <TableCell>
                        {room.equipment && room.equipment.length > 0 ? (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {room.equipment.map((item, index) => (
                              <Chip 
                                key={index} 
                                label={item} 
                                size="small" 
                                variant="outlined" 
                              />
                            ))}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            None
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <IconButton 
                          size="small" 
                          onClick={() => openEditDialog(room)}
                          color="primary"
                          title="Edit Room"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => openDeleteDialog(room)}
                          color="error"
                          title="Delete Room"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Paper>
      
      {/* Edit Room Dialog */}
      <Dialog open={editDialogOpen} onClose={handleEditDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editRoom && editRoom.tempId ? 'Edit Queued Room' : 'Edit Room'}
        </DialogTitle>
        <DialogContent>
          {editRoom && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  name="name"
                  label="Room Name"
                  value={editRoom.name}
                  onChange={handleEditInputChange}
                  fullWidth
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel id="edit-building-label">Building</InputLabel>
                  <Select
                    labelId="edit-building-label"
                    name="building"
                    value={editRoom.building}
                    onChange={handleEditInputChange}
                    label="Building"
                  >
                    {BUILDINGS.map((building) => (
                      <MenuItem key={building} value={building}>{building}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  name="location"
                  label="Location"
                  value={editRoom.location}
                  onChange={handleEditInputChange}
                  fullWidth
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="edit-floor-label">Floor</InputLabel>
                  <Select
                    labelId="edit-floor-label"
                    name="floor"
                    value={editRoom.floor}
                    onChange={handleEditInputChange}
                    label="Floor"
                  >
                    {FLOORS.map((floor) => (
                      <MenuItem key={floor} value={floor}>{floor}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="edit-type-label">Room Type</InputLabel>
                  <Select
                    labelId="edit-type-label"
                    name="type"
                    value={editRoom.type}
                    onChange={handleEditInputChange}
                    label="Room Type"
                  >
                    {ROOM_TYPES.map((type) => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  name="capacity"
                  label="Capacity"
                  value={editRoom.capacity}
                  onChange={handleEditInputChange}
                  fullWidth
                  type="number"
                  inputProps={{ min: 1 }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  id="edit-equipment-tags"
                  options={EQUIPMENT_OPTIONS}
                  value={editRoom.equipment || []}
                  onChange={handleEditEquipmentChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Equipment"
                      placeholder="Select equipment"
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="description"
                  label="Description"
                  value={editRoom.description || ''}
                  onChange={handleEditInputChange}
                  fullWidth
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditDialogClose}>Cancel</Button>
          <Button onClick={saveEditedRoom} variant="contained" color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          {roomToDelete && (
            <Typography>
              Are you sure you want to delete the room "{roomToDelete.name}"? This action cannot be undone.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={deleteRoom} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Success/Error Snackbars */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
      
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default EnhancedRoomManager;
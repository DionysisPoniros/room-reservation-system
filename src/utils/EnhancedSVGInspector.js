// src/utils/EnhancedSVGInspector.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField,
  Button,
  Alert,
  Stack,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  useTheme
} from '@mui/material';

// Icons
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import UndoIcon from '@mui/icons-material/Undo';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import InfoIcon from '@mui/icons-material/Info';
import CropFreeIcon from '@mui/icons-material/CropFree';

// Import our Room Overlay component
import RoomOverlay from '../components/rooms/RoomOverlay';

/**
 * Enhanced SVG Inspection Tool
 * 
 * This component helps map room coordinates on SVG floor plans
 * with improved UX and additional features:
 * - Multi-room selection
 * - Room data import/export
 * - Room data validation
 * - Batch operations
 * - Better visualization
 */
const EnhancedSVGInspector = () => {
  const theme = useTheme();
  const [svgUrl, setSvgUrl] = useState('');
  const [svgContent, setSvgContent] = useState(null);
  const [error, setError] = useState(null);
  const [scale, setScale] = useState(1);
  const svgRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState({
    id: '',
    label: '',
    x: 0,
    y: 0,
    width: 0,
    height: 0
  });
  const [buildings] = useState([
    "Max Lowenthal Hall",
    "Wallace Library"
  ]);
  const [floors] = useState([
    "1st Floor",
    "2nd Floor",
    "3rd Floor",
    "4th Floor",
    "A-Level"
  ]);
  const [selectedBuilding, setSelectedBuilding] = useState("Max Lowenthal Hall");
  const [selectedFloor, setSelectedFloor] = useState("1st Floor");
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
  const [successes, setSuccesses] = useState([]);
  const [bulkRoomData, setBulkRoomData] = useState('');
  
  // Load SVG file
  const loadSvg = async () => {
    try {
      setError(null);
      
      if (!svgUrl) {
        setError("Please enter an SVG URL");
        return;
      }
      
      const response = await fetch(svgUrl);
      if (!response.ok) {
        throw new Error(`Failed to load SVG: ${response.statusText}`);
      }
      
      const svgText = await response.text();
      setSvgContent(svgText);
      
      // Show success message
      setSuccesses([...successes, `SVG loaded successfully: ${svgUrl}`]);
      
      // Auto-clear success messages after 3 seconds
      setTimeout(() => {
        setSuccesses(s => s.filter(msg => msg !== `SVG loaded successfully: ${svgUrl}`));
      }, 3000);
    } catch (err) {
      console.error("Error loading SVG:", err);
      setError(err.message);
    }
  };
  
  // Handle mouse move on SVG
  const handleMouseMove = (e) => {
    if (!svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) / scale);
    const y = Math.round((e.clientY - rect.top) / scale);
    
    setMousePos({ x, y });
    
    // Update current room dimensions if drawing
    if (isDrawing) {
      // Calculate width and height based on start position and current position
      const width = Math.abs(x - drawStart.x);
      const height = Math.abs(y - drawStart.y);
      
      // Calculate the top-left coordinates (in case user draws from bottom-right to top-left)
      const newX = Math.min(x, drawStart.x);
      const newY = Math.min(y, drawStart.y);
      
      setCurrentRoom(prev => ({
        ...prev,
        x: newX,
        y: newY,
        width,
        height
      }));
    }
  };
  
  // Handle mouse down (start drawing)
  const handleMouseDown = (e) => {
    if (!svgRef.current || e.button !== 0) return; // Only proceed with left mouse button
    
    const rect = svgRef.current.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) / scale);
    const y = Math.round((e.clientY - rect.top) / scale);
    
    setDrawStart({ x, y });
    setIsDrawing(true);
    
    // Set initial position
    setCurrentRoom(prev => ({
      ...prev,
      x,
      y,
      width: 0,
      height: 0
    }));
  };
  
  // Handle mouse up (finish drawing)
  const handleMouseUp = (e) => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    
    // If the room is too small, reset it
    if (currentRoom.width < 10 || currentRoom.height < 10) {
      setCurrentRoom(prev => ({
        ...prev,
        width: 0,
        height: 0
      }));
    }
  };
  
  // Add current room to the list
  const addRoom = () => {
    if (!currentRoom.id || !currentRoom.label) {
      setError("Please provide Room ID and Label");
      return;
    }
    
    if (currentRoom.width <= 0 || currentRoom.height <= 0) {
      setError("Width and Height must be positive values");
      return;
    }
    
    const roomExists = rooms.some(room => room.id === currentRoom.id);
    if (roomExists) {
      setError("A room with this ID already exists");
      return;
    }
    
    setRooms([...rooms, { ...currentRoom }]);
    
    // Clear the current room's ID and label but keep position for next room
    setCurrentRoom({
      id: '',
      label: '',
      x: currentRoom.x,
      y: currentRoom.y,
      width: currentRoom.width,
      height: currentRoom.height
    });
    
    setError(null);
    
    // Show success message
    setSuccesses([...successes, `Room ${currentRoom.id} added successfully`]);
    
    // Auto-clear success message after 3 seconds
    setTimeout(() => {
      setSuccesses(s => s.filter(msg => msg !== `Room ${currentRoom.id} added successfully`));
    }, 3000);
  };
  
  // Generate room overlay code
  const generateCode = () => {
    if (rooms.length === 0) {
      setError("No rooms have been added yet");
      return;
    }
    
    // Create room entries
    const roomEntries = rooms.map(room => 
      `      "${room.id}": { x: ${room.x}, y: ${room.y}, width: ${room.width}, height: ${room.height}, label: "${room.label}" }`
    ).join(",\n");
    
    // Create JSON structure to match roomOverlays.js format
    const codeOutput = `  "${selectedBuilding}": {
    "${selectedFloor}": {
${roomEntries}
    }
  }`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(codeOutput)
      .then(() => {
        setSuccesses([...successes, "Code copied to clipboard!"]);
        
        // Auto-clear success message after 3 seconds
        setTimeout(() => {
          setSuccesses(s => s.filter(msg => msg !== "Code copied to clipboard!"));
        }, 3000);
      })
      .catch(err => {
        console.error("Failed to copy code to clipboard:", err);
        setError("Failed to copy code. See console for generated code.");
        console.log(codeOutput);
      });
      
    return codeOutput;
  };
  
  // Remove a room
  const removeRoom = (roomId) => {
    setRooms(rooms.filter(room => room.id !== roomId));
    
    // Show success message
    setSuccesses([...successes, `Room ${roomId} removed`]);
    
    // Auto-clear success message after 3 seconds
    setTimeout(() => {
      setSuccesses(s => s.filter(msg => msg !== `Room ${roomId} removed`));
    }, 3000);
  };
  
  // Handle preset SVG URLs for buildings and floors
  const handleBuildingFloorChange = () => {
    let url = '';
    
    // Map building and floor to SVG URLs
    const buildingCode = selectedBuilding === "Max Lowenthal Hall" ? "LOW" : "WAL";
    const floorCode = selectedFloor === "1st Floor" ? "1" : 
                      selectedFloor === "2nd Floor" ? "2" :
                      selectedFloor === "3rd Floor" ? "3" :
                      selectedFloor === "4th Floor" ? "4" : "A";
    
    url = `/images/floor-plans/${buildingCode}-${floorCode}.svg`;
    setSvgUrl(url);
  };
  
  // Automatically update SVG URL when building or floor changes
  useEffect(() => {
    handleBuildingFloorChange();
  }, [selectedBuilding, selectedFloor]);
  
  // Parse and import room data from bulk text input
  const importRoomData = () => {
    try {
      // Check if input is valid
      if (!bulkRoomData.trim()) {
        setError("Please enter room data to import");
        return;
      }
      
      // Try to parse as JSON if it looks like JSON
      if (bulkRoomData.trim().startsWith('{') || bulkRoomData.trim().startsWith('[')) {
        try {
          const jsonData = JSON.parse(bulkRoomData);
          
          // Handle different JSON formats
          let newRooms = [];
          
          // Single room format: {id: "ROOM-123", x: 10, y: 20, ...}
          if (jsonData.id && typeof jsonData.x === 'number') {
            newRooms = [jsonData];
          } 
          // Array of rooms: [{id: "ROOM-1"...}, {id: "ROOM-2"...}]
          else if (Array.isArray(jsonData)) {
            newRooms = jsonData;
          }
          // Building/floor structure: {"Building": {"Floor": {"ROOM-1": {...}}}}
          else {
            // Try to extract rooms from building/floor structure
            const buildingKey = Object.keys(jsonData)[0];
            if (buildingKey && jsonData[buildingKey]) {
              const floorKey = Object.keys(jsonData[buildingKey])[0];
              if (floorKey && jsonData[buildingKey][floorKey]) {
                const roomData = jsonData[buildingKey][floorKey];
                newRooms = Object.keys(roomData).map(roomId => ({
                  id: roomId,
                  ...roomData[roomId]
                }));
              }
            }
          }
          
          if (newRooms.length === 0) {
            throw new Error("No valid room data found in JSON");
          }
          
          // Validate each room has required properties
          newRooms.forEach(room => {
            if (!room.id || typeof room.x !== 'number' || typeof room.y !== 'number' ||
                typeof room.width !== 'number' || typeof room.height !== 'number') {
              throw new Error(`Room is missing required properties: ${JSON.stringify(room)}`);
            }
            
            // Add label if missing
            if (!room.label) {
              room.label = room.id;
            }
          });
          
          // Add to existing rooms, but check for duplicates
          const existingIds = rooms.map(r => r.id);
          const filteredNewRooms = newRooms.filter(r => !existingIds.includes(r.id));
          
          if (filteredNewRooms.length === 0) {
            setError("All imported rooms already exist");
            return;
          }
          
          setRooms([...rooms, ...filteredNewRooms]);
          setBulkRoomData(''); // Clear the input
          
          // Show success message
          setSuccesses([...successes, `Imported ${filteredNewRooms.length} rooms successfully`]);
          
          // Auto-clear success message after 3 seconds
          setTimeout(() => {
            setSuccesses(s => s.filter(msg => msg !== `Imported ${filteredNewRooms.length} rooms successfully`));
          }, 3000);
        } catch (jsonError) {
          console.error("JSON parsing error:", jsonError);
          setError(`Failed to parse JSON: ${jsonError.message}`);
          return;
        }
      } else {
        // Try to parse as CSV or line-based format
        const lines = bulkRoomData.split('\n').filter(line => line.trim());
        
        const newRooms = [];
        for (const line of lines) {
          const parts = line.split(',').map(p => p.trim());
          
          if (parts.length < 5) {
            setError(`Invalid line format: ${line}`);
            return;
          }
          
          const [id, x, y, width, height, ...labelParts] = parts;
          const label = labelParts.join(','); // Rejoin any label parts with commas
          
          newRooms.push({
            id,
            label: label || id,
            x: parseInt(x),
            y: parseInt(y),
            width: parseInt(width),
            height: parseInt(height)
          });
        }
        
        // Add to existing rooms, but check for duplicates
        const existingIds = rooms.map(r => r.id);
        const filteredNewRooms = newRooms.filter(r => !existingIds.includes(r.id));
        
        if (filteredNewRooms.length === 0) {
          setError("All imported rooms already exist");
          return;
        }
        
        setRooms([...rooms, ...filteredNewRooms]);
        setBulkRoomData(''); // Clear the input
        
        // Show success message
        setSuccesses([...successes, `Imported ${filteredNewRooms.length} rooms successfully`]);
        
        // Auto-clear success message after 3 seconds
        setTimeout(() => {
          setSuccesses(s => s.filter(msg => msg !== `Imported ${filteredNewRooms.length} rooms successfully`));
        }, 3000);
      }
    } catch (err) {
      console.error("Error importing room data:", err);
      setError(`Failed to import room data: ${err.message}`);
    }
  };
  
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        Enhanced SVG Room Mapping Tool
      </Typography>
      
      <Typography paragraph color="text.secondary">
        This tool helps you map room coordinates on your SVG floor plans.
        Click and drag on the SVG to draw room boundaries, then input room details.
      </Typography>
      
      {/* Success and Error messages */}
      <Stack spacing={1} sx={{ mb: 2 }}>
        {successes.map((message, index) => (
          <Alert key={`success-${index}`} severity="success" onClose={() => {
            setSuccesses(s => s.filter((_, i) => i !== index));
          }}>
            {message}
          </Alert>
        ))}
        
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
      </Stack>
      
      <Stack spacing={3} direction="column" sx={{ mb: 3 }}>
        <Stack spacing={2} direction={{ xs: 'column', md: 'row' }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="building-select-label">Building</InputLabel>
            <Select
              labelId="building-select-label"
              value={selectedBuilding}
              label="Building"
              onChange={(e) => setSelectedBuilding(e.target.value)}
            >
              {buildings.map((b) => (
                <MenuItem key={b} value={b}>{b}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="floor-select-label">Floor</InputLabel>
            <Select
              labelId="floor-select-label"
              value={selectedFloor}
              label="Floor"
              onChange={(e) => setSelectedFloor(e.target.value)}
            >
              {floors.map((f) => (
                <MenuItem key={f} value={f}>{f}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
        
        <TextField
          label="SVG URL"
          value={svgUrl}
          onChange={(e) => setSvgUrl(e.target.value)}
          fullWidth
          helperText="Enter the URL of your SVG floor plan"
          InputProps={{
            endAdornment: (
              <Button 
                variant="contained" 
                onClick={loadSvg}
                size="small"
                sx={{ ml: 1 }}
              >
                Load SVG
              </Button>
            )
          }}
        />
      </Stack>
      
      <Divider sx={{ mb: 3 }} />
      
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
        {/* SVG Display Area */}
        <Box 
          sx={{ 
            border: '1px solid #ccc',
            borderRadius: 1,
            p: 1,
            overflow: 'auto',
            width: '100%',
            height: 600,
            position: 'relative',
            backgroundColor: '#f5f5f5',
          }}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          ref={svgRef}
        >
          {svgContent ? (
            <Box 
              sx={{ width: '100%', height: '100%' }}
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          ) : (
            <Box 
              sx={{ 
                width: '100%', 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}
            >
              <Typography variant="body1" color="text.secondary">
                No SVG loaded yet
              </Typography>
            </Box>
          )}
          
          {/* Room preview */}
          {svgContent && currentRoom.width > 0 && currentRoom.height > 0 && (
            <RoomOverlay
              room={currentRoom}
              x={currentRoom.x}
              y={currentRoom.y}
              width={currentRoom.width}
              height={currentRoom.height}
              label={currentRoom.id || 'New Room'}
              isOccupied={false}
            />
          )}
          
          {/* Existing rooms */}
          {svgContent && rooms.map((room) => (
            <RoomOverlay
              key={room.id}
              room={room}
              x={room.x}
              y={room.y}
              width={room.width}
              height={room.height}
              label={room.label || room.id}
              isOccupied={false}
              onClick={() => {
                // Pre-fill the form with this room's data for editing
                setCurrentRoom({...room});
              }}
            />
          ))}
          
          {/* Mouse coordinates */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 10,
              right: 10,
              bgcolor: 'rgba(255, 255, 255, 0.7)',
              p: 1,
              borderRadius: 1,
              zIndex: 1000,
            }}
          >
            <Typography variant="caption">
              X: {mousePos.x}, Y: {mousePos.y}
            </Typography>
            {isDrawing && (
              <Typography variant="caption" sx={{ display: 'block' }}>
                W: {currentRoom.width}, H: {currentRoom.height}
              </Typography>
            )}
          </Box>
        </Box>
        
        {/* Room Details Form */}
        <Box sx={{ width: { xs: '100%', md: 300 } }}>
          <Typography variant="h6" gutterBottom>
            Room Details
          </Typography>
          
          <Stack spacing={2}>
            <TextField
              label="Room ID"
              value={currentRoom.id}
              onChange={(e) => setCurrentRoom(prev => ({ ...prev, id: e.target.value }))}
              fullWidth
              placeholder="e.g., LOW-1050"
            />
            
            <TextField
              label="Room Label"
              value={currentRoom.label}
              onChange={(e) => setCurrentRoom(prev => ({ ...prev, label: e.target.value }))}
              fullWidth
              placeholder="e.g., Gueldenpfennig Auditorium"
            />
            
            <Stack direction="row" spacing={1}>
              <TextField
                label="X"
                value={currentRoom.x}
                onChange={(e) => setCurrentRoom(prev => ({ ...prev, x: parseInt(e.target.value) || 0 }))}
                type="number"
                fullWidth
                helperText="Draw on SVG to set"
              />
              
              <TextField
                label="Y"
                value={currentRoom.y}
                onChange={(e) => setCurrentRoom(prev => ({ ...prev, y: parseInt(e.target.value) || 0 }))}
                type="number"
                fullWidth
              />
            </Stack>
            
            <Stack direction="row" spacing={1}>
              <TextField
                label="Width"
                value={currentRoom.width}
                onChange={(e) => setCurrentRoom(prev => ({ ...prev, width: parseInt(e.target.value) || 0 }))}
                type="number"
                fullWidth
              />
              
              <TextField
                label="Height"
                value={currentRoom.height}
                onChange={(e) => setCurrentRoom(prev => ({ ...prev, height: parseInt(e.target.value) || 0 }))}
                type="number"
                fullWidth
              />
            </Stack>
            
            <Button 
              variant="contained" 
              onClick={addRoom}
              fullWidth
              startIcon={<AddIcon />}
            >
              Add Room
            </Button>
            
            <Divider />
            
            {/* Bulk Room Data Import */}
            <Typography variant="subtitle2" gutterBottom>
              Bulk Import Rooms
            </Typography>
            
            <TextField
              label="Room Data"
              multiline
              rows={4}
              value={bulkRoomData}
              onChange={(e) => setBulkRoomData(e.target.value)}
              fullWidth
              placeholder="Paste JSON or CSV data"
              helperText="Format: ROOM-ID,X,Y,WIDTH,HEIGHT,LABEL"
            />
            
            <Button
              variant="outlined"
              onClick={importRoomData}
              fullWidth
              startIcon={<UploadFileIcon />}
            >
              Import Rooms
            </Button>
            
            <Divider />
            
            <Typography variant="h6" gutterBottom>
              Added Rooms ({rooms.length})
            </Typography>
            
            <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
              <List dense>
                {rooms.map((room) => (
                  <ListItem 
                    key={room.id} 
                    sx={{ 
                      p: 1, 
                      border: '1px solid #eee', 
                      borderRadius: 1, 
                      mb: 1,
                    }}
                  >
                    <ListItemText
                      primary={room.id}
                      secondary={`${room.label} (${room.width}x${room.height})`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton 
                        edge="end" 
                        aria-label="delete"
                        onClick={() => removeRoom(room.id)}
                        size="small"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Box>
            
            <Button 
              variant="contained" 
              color="success" 
              onClick={generateCode}
              disabled={rooms.length === 0}
              fullWidth
              startIcon={<ContentCopyIcon />}
            >
              Generate & Copy Code
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
};

export default EnhancedSVGInspector;
// src/utils/SVGInspector.js
import React, { useState, useEffect, useRef } from 'react';
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
  MenuItem
} from '@mui/material';

/**
 * SVG Inspection Tool
 * 
 * This component helps you identify coordinates in an SVG file
 * by allowing you to click on the SVG and see the coordinates.
 * It also lets you create room overlay data for your floor plans.
 */
const SVGInspector = () => {
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
  };
  
  // Handle mouse click (set start position of a room)
  const handleSvgClick = (e) => {
    if (!svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) / scale);
    const y = Math.round((e.clientY - rect.top) / scale);
    
    setCurrentRoom(prev => ({
      ...prev,
      x,
      y
    }));
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
    setCurrentRoom({
      id: '',
      label: '',
      x: currentRoom.x,
      y: currentRoom.y,
      width: currentRoom.width,
      height: currentRoom.height
    });
    setError(null);
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
    
    // Create JSON structure
    const codeOutput = `  "${selectedBuilding}": {
    "${selectedFloor}": {
${roomEntries}
    }
  }`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(codeOutput)
      .then(() => {
        alert("Code copied to clipboard!");
      })
      .catch(err => {
        console.error("Failed to copy code to clipboard:", err);
        alert("Failed to copy to clipboard. See console for the generated code.");
        console.log(codeOutput);
      });
  };
  
  // Remove a room
  const removeRoom = (roomId) => {
    setRooms(rooms.filter(room => room.id !== roomId));
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
  
  useEffect(() => {
    handleBuildingFloorChange();
  }, [selectedBuilding, selectedFloor]);
  
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        SVG Room Mapping Tool
      </Typography>
      
      <Typography paragraph color="text.secondary">
        This tool helps you map room coordinates on your SVG floor plans.
        Click on the SVG to set the starting coordinates, then input dimensions and add rooms.
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
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
        />
        
        <Button variant="contained" onClick={loadSvg}>
          Load SVG
        </Button>
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
          onClick={handleSvgClick}
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
            <Box
              sx={{
                position: 'absolute',
                left: currentRoom.x,
                top: currentRoom.y,
                width: currentRoom.width,
                height: currentRoom.height,
                border: '2px dashed #F76902',
                backgroundColor: 'rgba(247, 105, 2, 0.3)',
                zIndex: 999,
                pointerEvents: 'none',
              }}
            >
              <Typography 
                variant="caption" 
                sx={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  p: 0.5,
                  borderRadius: 1 
                }}
              >
                {currentRoom.id || 'New Room'}
              </Typography>
            </Box>
          )}
          
          {/* Existing rooms */}
          {svgContent && rooms.map((room, index) => (
            <Box
              key={room.id}
              sx={{
                position: 'absolute',
                left: room.x,
                top: room.y,
                width: room.width,
                height: room.height,
                border: '2px solid green',
                backgroundColor: 'rgba(0, 128, 0, 0.2)',
                zIndex: 998,
                pointerEvents: 'none',
              }}
            >
              <Typography 
                variant="caption" 
                sx={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  p: 0.5,
                  borderRadius: 1 
                }}
              >
                {room.id}
              </Typography>
            </Box>
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
            X: {mousePos.x}, Y: {mousePos.y}
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
                helperText="Click on SVG to set"
              />
              
              <TextField
                label="Y"
                value={currentRoom.y}
                onChange={(e) => setCurrentRoom(prev => ({ ...prev, y: parseInt(e.target.value) || 0 }))}
                type="number"
                fullWidth
                helperText="Click on SVG to set"
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
            >
              Add Room
            </Button>
            
            <Divider />
            
            <Typography variant="h6" gutterBottom>
              Added Rooms ({rooms.length})
            </Typography>
            
            <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
              {rooms.map((room) => (
                <Box 
                  key={room.id} 
                  sx={{ 
                    p: 1, 
                    border: '1px solid #eee', 
                    borderRadius: 1, 
                    mb: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Typography variant="body2">
                    {room.id}: {room.label}
                  </Typography>
                  <Button 
                    size="small" 
                    color="error" 
                    onClick={() => removeRoom(room.id)}
                  >
                    Remove
                  </Button>
                </Box>
              ))}
            </Box>
            
            <Button 
              variant="contained" 
              color="success" 
              onClick={generateCode}
              disabled={rooms.length === 0}
              fullWidth
            >
              Generate & Copy Code
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
};

export default SVGInspector;
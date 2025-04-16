// src/components/admin/RoomImageManager.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Grid, 
  TextField, 
  CircularProgress,
  Alert,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  Divider,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress
} from '@mui/material';

// Icons
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CancelIcon from '@mui/icons-material/Cancel';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import ViewListIcon from '@mui/icons-material/ViewList';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import { useTheme } from '@mui/material/styles';

// Firebase imports
import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject,
  listAll
} from 'firebase/storage';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../../firebase/config';

/**
 * Room Image Manager Component
 * 
 * This component allows administrators to:
 * 1. Upload images for rooms
 * 2. View all room images
 * 3. Assign images to rooms
 * 4. Delete images
 */
function RoomImageManager() {
  // State for room and image data
  const [rooms, setRooms] = useState([]);
  const [images, setImages] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  
  // State for image upload
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [roomForUpload, setRoomForUpload] = useState(null);
  const [imageDescription, setImageDescription] = useState('');
  
  // State for image assignment
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [imageToAssign, setImageToAssign] = useState(null);
  const [roomToAssign, setRoomToAssign] = useState(null);
  
  // State for image preview
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  
  // State for loading and errors
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Refs
  const fileInputRef = useRef(null);
  
  // Load rooms and images when component mounts
  useEffect(() => {
    fetchRoomsAndImages();
  }, []);
  
  // Apply search filter when rooms or search term changes
  useEffect(() => {
    if (rooms.length > 0) {
      const filtered = rooms.filter(room => 
        room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (room.location && room.location.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredRooms(filtered);
    }
  }, [rooms, searchTerm]);
  
  /**
   * Fetch rooms and images from Firebase
   */
  const fetchRoomsAndImages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch rooms from Firestore
      const roomsQuery = query(collection(db, 'rooms'), orderBy('name'));
      const roomsSnapshot = await getDocs(roomsQuery);
      const roomsData = roomsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setRooms(roomsData);
      setFilteredRooms(roomsData);
      
      // Fetch images from Firebase Storage
      const storage = getStorage();
      const imagesRef = ref(storage, 'room-images');
      
      try {
        const imagesList = await listAll(imagesRef);
        
        // Get download URLs and metadata for each image
        const imageData = await Promise.all(
          imagesList.items.map(async (imageRef) => {
            const url = await getDownloadURL(imageRef);
            // Extract filename from full path
            const filename = imageRef.name;
            
            return {
              name: filename,
              url: url,
              ref: imageRef,
              // Extract room ID if filename starts with room ID pattern
              roomId: filename.split('_')[0] || null
            };
          })
        );
        
        setImages(imageData);
      } catch (storageError) {
        console.error("Error fetching images from storage:", storageError);
        // Don't fail completely if images can't be fetched
        setImages([]);
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Error fetching rooms and images:", err);
      setError("Failed to load rooms and images. Please try again.");
      setLoading(false);
    }
  };
  
  /**
   * Handle file selection for upload
   */
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError("Please select a valid image file (JPEG, PNG, GIF, or WebP)");
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image file size must be less than 5MB");
      return;
    }
    
    setSelectedFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setFilePreview(e.target.result);
    };
    reader.readAsDataURL(file);
    
    // Clear any previous errors
    setError(null);
  };
  
  /**
   * Upload image to Firebase Storage
   */
  const uploadImage = async () => {
    if (!selectedFile || !roomForUpload) {
      setError("Please select a file and a room");
      return;
    }
    
    try {
      setUploading(true);
      setUploadProgress(0);
      
      const storage = getStorage();
      
      // Create a filename that includes the room ID
      const filename = `${roomForUpload.id}_${Date.now()}_${selectedFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const storageRef = ref(storage, `room-images/${filename}`);
      
      // Create upload task
      const uploadTask = uploadBytesResumable(storageRef, selectedFile);
      
      // Listen for upload progress
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Upload error:", error);
          setError("Failed to upload image. Please try again.");
          setUploading(false);
        },
        async () => {
          // Upload complete
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Update the room document with the image URL
          try {
            const roomRef = doc(db, 'rooms', roomForUpload.id);
            await updateDoc(roomRef, {
              imageUrl: downloadUrl,
              imageDescription: imageDescription || '',
              imageFilename: filename
            });
            
            // Add the new image to the images array
            setImages([...images, {
              name: filename,
              url: downloadUrl,
              ref: uploadTask.snapshot.ref,
              roomId: roomForUpload.id
            }]);
            
            // Update the rooms array with the new image URL
            setRooms(rooms.map(room => 
              room.id === roomForUpload.id 
                ? {...room, imageUrl: downloadUrl, imageDescription: imageDescription, imageFilename: filename} 
                : room
            ));
            
            setSuccess(`Image uploaded successfully for ${roomForUpload.name}`);
            
            // Reset the upload state
            setUploading(false);
            setSelectedFile(null);
            setFilePreview(null);
            setRoomForUpload(null);
            setImageDescription('');
            setUploadOpen(false);
            
            // Refresh the data
            fetchRoomsAndImages();
          } catch (updateError) {
            console.error("Error updating room with image URL:", updateError);
            setError("Failed to update room with image URL. Please try again.");
            setUploading(false);
          }
        }
      );
    } catch (err) {
      console.error("Error starting upload:", err);
      setError("Failed to start upload. Please try again.");
      setUploading(false);
    }
  };
  
  /**
   * Open the assign dialog for an image
   */
  const openAssignDialog = (image) => {
    setImageToAssign(image);
    setRoomToAssign(null);
    setAssignDialogOpen(true);
  };
  
  /**
   * Assign an image to a room
   */
  const assignImageToRoom = async () => {
    if (!imageToAssign || !roomToAssign) {
      setError("Please select a room to assign the image to");
      return;
    }
    
    try {
      setLoading(true);
      
      // Update the room document with the image URL
      const roomRef = doc(db, 'rooms', roomToAssign.id);
      await updateDoc(roomRef, {
        imageUrl: imageToAssign.url,
        imageFilename: imageToAssign.name
      });
      
      // Update the local state
      setRooms(rooms.map(room => 
        room.id === roomToAssign.id 
          ? {...room, imageUrl: imageToAssign.url, imageFilename: imageToAssign.name} 
          : room
      ));
      
      setSuccess(`Image assigned to ${roomToAssign.name}`);
      
      // Close the dialog
      setAssignDialogOpen(false);
      setImageToAssign(null);
      setRoomToAssign(null);
      
      // Refresh the data
      fetchRoomsAndImages();
    } catch (err) {
      console.error("Error assigning image to room:", err);
      setError("Failed to assign image to room. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Delete an image from Firebase Storage
   */
  const deleteImage = async (image) => {
    if (!window.confirm(`Are you sure you want to delete this image? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setLoading(true);
      
      const storage = getStorage();
      const imageRef = ref(storage, `room-images/${image.name}`);
      
      // Delete the image from storage
      await deleteObject(imageRef);
      
      // Find rooms that use this image and update them
      const roomsUsingImage = rooms.filter(room => room.imageFilename === image.name);
      
      if (roomsUsingImage.length > 0) {
        await Promise.all(roomsUsingImage.map(async (room) => {
          const roomRef = doc(db, 'rooms', room.id);
          await updateDoc(roomRef, {
            imageUrl: null,
            imageFilename: null,
            imageDescription: null
          });
        }));
        
        // Update local state
        setRooms(rooms.map(room => 
          room.imageFilename === image.name 
            ? {...room, imageUrl: null, imageFilename: null, imageDescription: null} 
            : room
        ));
      }
      
      // Remove the image from the images array
      setImages(images.filter(img => img.name !== image.name));
      
      setSuccess("Image deleted successfully");
      
      // Refresh the data
      fetchRoomsAndImages();
    } catch (err) {
      console.error("Error deleting image:", err);
      setError("Failed to delete image. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Open the preview dialog for an image
   */
  const openPreviewDialog = (image) => {
    setPreviewImage(image);
    setPreviewDialogOpen(true);
  };
  
  /**
   * Render the image grid view
   */
  const renderImageGrid = () => {
    return (
      <Grid container spacing={3}>
        {images.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No images have been uploaded yet.
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<AddPhotoAlternateIcon />} 
                sx={{ mt: 2 }}
                onClick={() => setUploadOpen(true)}
              >
                Upload Images
              </Button>
            </Paper>
          </Grid>
        ) : (
          images.map((image) => {
            // Find the room that uses this image
            const room = rooms.find(r => r.imageFilename === image.name);
            
            return (
              <Grid item xs={12} sm={6} md={4} key={image.name}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardMedia
                    component="img"
                    height="180"
                    image={image.url}
                    alt={image.name}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      {image.name.split('_').slice(2).join('_')}
                    </Typography>
                    {room ? (
                      <Typography variant="body2" color="text.secondary">
                        Assigned to: {room.name}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Not assigned to any room
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions>
                    <IconButton 
                      color="primary" 
                      onClick={() => openPreviewDialog(image)}
                      title="Preview"
                    >
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton 
                      color="secondary" 
                      onClick={() => openAssignDialog(image)}
                      title="Assign to Room"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      color="error" 
                      onClick={() => deleteImage(image)}
                      title="Delete"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            );
          })
        )}
      </Grid>
    );
  };
  
  /**
   * Render the image list view
   */
  const renderImageList = () => {
    return (
      <Paper>
        {images.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No images have been uploaded yet.
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AddPhotoAlternateIcon />} 
              sx={{ mt: 2 }}
              onClick={() => setUploadOpen(true)}
            >
              Upload Images
            </Button>
          </Box>
        ) : (
          <Box>
            {images.map((image) => {
              // Find the room that uses this image
              const room = rooms.find(r => r.imageFilename === image.name);
              
              return (
                <Box 
                  key={image.name} 
                  sx={{ 
                    p: 2, 
                    borderBottom: '1px solid #eee',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <Box 
                    sx={{ 
                      width: 60, 
                      height: 60, 
                      borderRadius: 1, 
                      mr: 2, 
                      overflow: 'hidden',
                      flexShrink: 0
                    }}
                  >
                    <img 
                      src={image.url} 
                      alt={image.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle2">
                      {image.name.split('_').slice(2).join('_')}
                    </Typography>
                    {room ? (
                      <Typography variant="body2" color="text.secondary">
                        Assigned to: {room.name}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Not assigned to any room
                      </Typography>
                    )}
                  </Box>
                  <Box>
                    <IconButton 
                      color="primary" 
                      size="small"
                      onClick={() => openPreviewDialog(image)}
                      title="Preview"
                    >
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton 
                      color="secondary" 
                      size="small"
                      onClick={() => openAssignDialog(image)}
                      title="Assign to Room"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      color="error" 
                      size="small"
                      onClick={() => deleteImage(image)}
                      title="Delete"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Paper>
    );
  };
  
  /**
   * Render the rooms with images list
   */
  const renderRoomsWithImages = () => {
    const roomsWithImages = rooms.filter(room => room.imageUrl);
    const roomsWithoutImages = rooms.filter(room => !room.imageUrl);
    
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Rooms with Images ({roomsWithImages.length})
        </Typography>
        
        {roomsWithImages.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center', mb: 3 }}>
            <Typography variant="body1" color="text.secondary">
              No rooms have images assigned yet.
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AddPhotoAlternateIcon />} 
              sx={{ mt: 2 }}
              onClick={() => setUploadOpen(true)}
            >
              Upload Images
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {roomsWithImages.map((room) => (
              <Grid item xs={12} sm={6} md={4} key={room.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardMedia
                    component="img"
                    height="180"
                    image={room.imageUrl}
                    alt={room.name}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      {room.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {room.location || ''}
                    </Typography>
                    {room.imageDescription && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {room.imageDescription}
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      color="primary"
                      onClick={() => {
                        const image = images.find(img => img.name === room.imageFilename);
                        if (image) {
                          openPreviewDialog(image);
                        }
                      }}
                    >
                      Preview
                    </Button>
                    <Button 
                      size="small" 
                      color="error"
                      onClick={() => {
                        if (window.confirm(`Remove image from ${room.name}?`)) {
                          // Only remove the reference, don't delete the image
                          updateDoc(doc(db, 'rooms', room.id), {
                            imageUrl: null,
                            imageFilename: null,
                            imageDescription: null
                          }).then(() => {
                            setRooms(rooms.map(r => 
                              r.id === room.id 
                                ? {...r, imageUrl: null, imageFilename: null, imageDescription: null} 
                                : r
                            ));
                            setSuccess(`Image removed from ${room.name}`);
                          }).catch(err => {
                            console.error("Error removing image from room:", err);
                            setError("Failed to remove image from room. Please try again.");
                          });
                        }
                      }}
                    >
                      Remove
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
        
        <Typography variant="h6" gutterBottom>
          Rooms without Images ({roomsWithoutImages.length})
        </Typography>
        
        <Paper sx={{ p: 2 }}>
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {roomsWithoutImages.map((room) => (
              <Box 
                key={room.id} 
                sx={{ 
                  p: 2, 
                  borderBottom: '1px solid #eee',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle2">
                    {room.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {room.location || ''} • {room.type || 'Room'} • Capacity: {room.capacity || 'Unknown'}
                  </Typography>
                </Box>
                <Button 
                  variant="outlined" 
                  size="small"
                  startIcon={<AddPhotoAlternateIcon />}
                  onClick={() => {
                    setRoomForUpload(room);
                    setUploadOpen(true);
                  }}
                >
                  Add Image
                </Button>
              </Box>
            ))}
          </Box>
        </Paper>
      </Box>
    );
  };
  
  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">Room Image Management</Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="contained" 
            startIcon={<AddPhotoAlternateIcon />}
            onClick={() => setUploadOpen(true)}
          >
            Upload New Image
          </Button>
          
          <Button 
            variant={viewMode === 'grid' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('grid')}
            startIcon={<PhotoLibraryIcon />}
          >
            Grid
          </Button>
          
          <Button 
            variant={viewMode === 'list' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('list')}
            startIcon={<ViewListIcon />}
          >
            List
          </Button>
          
          <Button 
            variant={viewMode === 'rooms' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('rooms')}
            startIcon={<MeetingRoomIcon />}
          >
            Rooms
          </Button>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Snackbar 
          open={!!success} 
          autoHideDuration={6000} 
          onClose={() => setSuccess(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert severity="success" onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        </Snackbar>
      )}
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Image Library Statistics
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h4" color="primary">
                {images.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Images
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h4" color="primary">
                {rooms.filter(room => room.imageUrl).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Rooms with Images
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h4" color="primary">
                {rooms.filter(room => !room.imageUrl).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Rooms without Images
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search images or rooms..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
          }}
        />
      </Box>
      
      {loading ? (
        <CircularProgress sx={{ display: 'block', mx: 'auto', my: 4 }} />
      ) : (
        <Box>
          {viewMode === 'grid' && renderImageGrid()}
          {viewMode === 'list' && renderImageList()}
          {viewMode === 'rooms' && renderRoomsWithImages()}
        </Box>
      )}
      
      {/* Upload Dialog */}
      <Dialog 
        open={uploadOpen} 
        onClose={() => !uploading && setUploadOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Upload Room Image</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="room-select-label">Select Room</InputLabel>
                <Select
                  labelId="room-select-label"
                  value={roomForUpload?.id || ''}
                  onChange={(e) => {
                    const selected = rooms.find(room => room.id === e.target.value);
                    setRoomForUpload(selected || null);
                  }}
                  label="Select Room"
                  disabled={uploading}
                >
                  <MenuItem value="">
                    <em>Select a room</em>
                  </MenuItem>
                  {rooms.map((room) => (
                    <MenuItem key={room.id} value={room.id}>
                      {room.name} - {room.location || ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                label="Image Description (optional)"
                fullWidth
                multiline
                rows={3}
                value={imageDescription}
                onChange={(e) => setImageDescription(e.target.value)}
                disabled={uploading}
                sx={{ mb: 3 }}
              />
              
              <Box>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="image-upload-button"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  disabled={uploading}
                />
                <label htmlFor="image-upload-button">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUploadIcon />}
                    disabled={uploading}
                    fullWidth
                  >
                    Select Image File
                  </Button>
                </label>
                
                {selectedFile && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                    </Typography>
                    
                    {uploading && (
                      <Box sx={{ width: '100%', mt: 2 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={uploadProgress} 
                          sx={{ height: 10, borderRadius: 5 }}
                        />
                        <Typography variant="caption" align="center" display="block" sx={{ mt: 1 }}>
                          Uploading: {Math.round(uploadProgress)}%
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Image Preview
              </Typography>
              
              <Box 
                sx={{ 
                  width: '100%', 
                  height: 300, 
                  bgcolor: '#f5f5f5', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  border: '1px dashed #ccc',
                  borderRadius: 1,
                  overflow: 'hidden'
                }}
              >
                {filePreview ? (
                  <img 
                    src={filePreview} 
                    alt="Preview" 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '100%', 
                      objectFit: 'contain' 
                    }} 
                  />
                ) : (
                  <Typography color="text.secondary">
                    No image selected
                  </Typography>
                )}
              </Box>
              
              {roomForUpload && roomForUpload.imageUrl && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="warning.main" gutterBottom>
                    Warning: This room already has an image assigned
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Uploading a new image will replace the existing one.
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setUploadOpen(false);
              setSelectedFile(null);
              setFilePreview(null);
              setRoomForUpload(null);
              setImageDescription('');
            }} 
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button 
            onClick={uploadImage} 
            variant="contained" 
            color="primary"
            disabled={!selectedFile || !roomForUpload || uploading}
            startIcon={uploading ? <CircularProgress size={20} /> : null}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Assign Dialog */}
      <Dialog 
        open={assignDialogOpen} 
        onClose={() => !loading && setAssignDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Assign Image to Room</DialogTitle>
        <DialogContent>
          {imageToAssign && (
            <Box sx={{ mt: 2 }}>
              <Box 
                sx={{ 
                  width: '100%',
                  height: 200,
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: '#f5f5f5',
                  border: '1px solid #eee',
                  borderRadius: 1,
                  overflow: 'hidden'
                }}
              >
                <img 
                  src={imageToAssign.url} 
                  alt={imageToAssign.name} 
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              </Box>
              
              <Autocomplete
                options={rooms}
                getOptionLabel={(option) => `${option.name} - ${option.location || ''}`}
                value={roomToAssign}
                onChange={(event, newValue) => {
                  setRoomToAssign(newValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Room"
                    fullWidth
                    required
                  />
                )}
                disabled={loading}
              />
              
              {roomToAssign && roomToAssign.imageUrl && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  This room already has an image assigned. Assigning this image will replace the existing one.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setAssignDialogOpen(false);
              setImageToAssign(null);
              setRoomToAssign(null);
            }} 
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            onClick={assignImageToRoom} 
            variant="contained" 
            color="primary"
            disabled={!roomToAssign || loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Assigning...' : 'Assign'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Preview Dialog */}
      <Dialog 
        open={previewDialogOpen} 
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Image Preview
          <IconButton
            aria-label="close"
            onClick={() => setPreviewDialogOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CancelIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {previewImage && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <img 
                src={previewImage.url} 
                alt={previewImage.name} 
                style={{ maxWidth: '100%', maxHeight: '70vh' }}
              />
              
              <Typography variant="subtitle1" sx={{ mt: 2 }}>
                {previewImage.name.split('_').slice(2).join('_')}
              </Typography>
              
              {rooms.find(room => room.imageFilename === previewImage.name) && (
                <Typography variant="body2" color="text.secondary">
                  Assigned to: {rooms.find(room => room.imageFilename === previewImage.name)?.name}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default RoomImageManager;
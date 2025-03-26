// src/components/booking/RequestHoursForm.js
import React, { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, Button, CircularProgress, FormControl, 
  InputLabel, Select, MenuItem, Box, Typography, Alert
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { requestAdditionalHours } from '../../services/userService';

function RequestHoursForm({ open, onClose, onSuccess }) {
  const { currentUser } = useAuth();
  const [reason, setReason] = useState('');
  const [hoursRequested, setHoursRequested] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      setError("Please provide a reason for your request");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      await requestAdditionalHours({
        userId: currentUser.uid,
        userEmail: currentUser.email,
        hoursRequested,
        reason,
        status: 'pending',
        createdAt: new Date()
      });
      
      setLoading(false);
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error submitting hour request:", err);
      setError("Failed to submit request. Please try again.");
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Request Additional Booking Hours</DialogTitle>
      
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Typography variant="body2" color="text.secondary" paragraph>
            You can request additional booking hours beyond the daily limit.
            Please provide a valid reason for your request.
          </Typography>
          
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="hours-requested-label">Hours Requested</InputLabel>
            <Select
              labelId="hours-requested-label"
              value={hoursRequested}
              label="Hours Requested"
              onChange={(e) => setHoursRequested(e.target.value)}
            >
              {[1, 2, 3, 4, 5].map((hours) => (
                <MenuItem key={hours} value={hours}>{hours} {hours === 1 ? 'hour' : 'hours'}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            label="Reason for Request"
            multiline
            rows={4}
            fullWidth
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            placeholder="Please explain why you need additional booking hours"
          />
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Submitting...' : 'Submit Request'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default RequestHoursForm;
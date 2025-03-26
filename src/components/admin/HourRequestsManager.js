// src/components/admin/HourRequestsManager.js
import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, Button, TextField, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, CircularProgress, Alert, useTheme
} from '@mui/material';
import { 
  getAllHourRequests, 
  updateHourRequestStatus, 
  setUserHourAllowance 
} from '../../services/userService';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';

function HourRequestsManager() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState('view'); // 'view', 'approve', 'reject'
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const requestsData = await getAllHourRequests();
      setRequests(requestsData);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching hour requests:", err);
      setError("Failed to load requests. Please try again.");
      setLoading(false);
    }
  };

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setDialogAction('view');
    setAdminNotes(request.adminNotes || '');
    setDialogOpen(true);
  };

  const handleApproveRequest = (request) => {
    setSelectedRequest(request);
    setDialogAction('approve');
    setAdminNotes('');
    setDialogOpen(true);
  };

  const handleRejectRequest = (request) => {
    setSelectedRequest(request);
    setDialogAction('reject');
    setAdminNotes('');
    setDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedRequest) return;
    
    try {
      setProcessing(true);
      
      if (dialogAction === 'approve') {
        // Update request status
        await updateHourRequestStatus(
          selectedRequest.id, 'approved', adminNotes
        );
        
        // Set user's custom allowance (default 5 + requested hours)
        const newAllowance = 5 + selectedRequest.hoursRequested;
        await setUserHourAllowance(
          selectedRequest.userId, newAllowance
        );
        
      } else if (dialogAction === 'reject') {
        // Just update status to rejected
        await updateHourRequestStatus(
          selectedRequest.id, 'rejected', adminNotes
        );
      }
      
      // Refresh requests list
      await fetchRequests();
      
      setProcessing(false);
      setDialogOpen(false);
    } catch (err) {
      console.error(`Error ${dialogAction}ing request:`, err);
      setError(`Failed to ${dialogAction} request. Please try again.`);
      setProcessing(false);
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        Hour Extension Requests
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      {loading ? (
        <CircularProgress />
      ) : requests.length === 0 ? (
        <Typography variant="body1" sx={{ my: 4, textAlign: 'center' }}>
          No hour extension requests found.
        </Typography>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Hours</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id} hover>
                  <TableCell>{request.userEmail}</TableCell>
                  <TableCell>{request.hoursRequested}</TableCell>
                  <TableCell sx={{ maxWidth: 300 }}>
                    {request.reason.length > 60 
                      ? `${request.reason.substring(0, 60)}...` 
                      : request.reason}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={request.status} 
                      color={
                        request.status === 'approved' ? 'success' : 
                        request.status === 'rejected' ? 'error' : 
                        'warning'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <IconButton 
                        size="small"
                        onClick={() => handleViewRequest(request)}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      
                      {request.status === 'pending' && (
                        <>
                          <IconButton 
                            size="small"
                            onClick={() => handleApproveRequest(request)}
                            color="success"
                            sx={{ ml: 1 }}
                          >
                            <CheckCircleIcon fontSize="small" />
                          </IconButton>
                          
                          <IconButton 
                            size="small"
                            onClick={() => handleRejectRequest(request)}
                            color="error"
                            sx={{ ml: 1 }}
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Action Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {dialogAction === 'view' ? 'Request Details' : 
           dialogAction === 'approve' ? 'Approve Request' : 
           'Reject Request'}
        </DialogTitle>
        
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ mt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">User</Typography>
                  <Typography variant="body1">{selectedRequest.userEmail}</Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Request</Typography>
                  <Typography variant="body1">
                    {selectedRequest.hoursRequested} additional hours
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Reason</Typography>
                  <Typography variant="body1">
                    {selectedRequest.reason}
                  </Typography>
                </Grid>
                
                {dialogAction !== 'view' && (
                  <Grid item xs={12} sx={{ mt: 2 }}>
                    <TextField
                      label="Admin Notes"
                      multiline
                      rows={3}
                      fullWidth
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Explain why you're approving/rejecting this request"
                    />
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            {dialogAction === 'view' ? 'Close' : 'Cancel'}
          </Button>
          
          {dialogAction !== 'view' && (
            <Button 
              variant="contained" 
              color={dialogAction === 'approve' ? 'success' : 'error'}
              onClick={handleConfirmAction}
              disabled={processing}
            >
              {processing 
                ? 'Processing...' 
                : dialogAction === 'approve' 
                  ? 'Approve Request' 
                  : 'Reject Request'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

export default HourRequestsManager;
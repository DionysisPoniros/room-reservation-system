// src/components/admin/EnhancedSettings.js
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  TextField, 
  Button, 
  Divider, 
  Switch, 
  FormControlLabel, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Alert,
  Snackbar,
  CircularProgress,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';

// Icons
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SaveIcon from '@mui/icons-material/Save';
import SettingsIcon from '@mui/icons-material/Settings';
import SecurityIcon from '@mui/icons-material/Security';
import GroupIcon from '@mui/icons-material/Group';
import EmailIcon from '@mui/icons-material/Email';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import InfoIcon from '@mui/icons-material/Info';
import LockIcon from '@mui/icons-material/Lock';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SyncIcon from '@mui/icons-material/Sync';
import HelpIcon from '@mui/icons-material/Help';

// Import Firebase services
import { db } from '../../firebase/config';
import { collection, doc, getDoc, setDoc, getDocs, updateDoc, arrayUnion, arrayRemove, Timestamp, deleteDoc } from 'firebase/firestore';
// Sample admin users
const INITIAL_ADMINS = [
  { email: 'admin@rit.edu', role: 'super_admin', dateAdded: new Date() },
  { email: 'faculty@rit.edu', role: 'admin', dateAdded: new Date() }
];

function EnhancedSettings() {
  // System Settings
  const [systemName, setSystemName] = useState('RIT Room Reservation System');
  const [maxDailyHours, setMaxDailyHours] = useState(5);
  const [maxBookingDays, setMaxBookingDays] = useState(30);
  const [defaultBookingDuration, setDefaultBookingDuration] = useState(1);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [requireApproval, setRequireApproval] = useState(false);
  
  // Email Settings
  const [enableEmails, setEnableEmails] = useState(true);
  const [adminEmail, setAdminEmail] = useState('roomreservations@rit.edu');
  const [emailFooter, setEmailFooter] = useState('This is an automated message from the RIT Room Reservation System.');
  
  // Notification Settings
  const [notifyOnBooking, setNotifyOnBooking] = useState(true);
  const [notifyOnCancellation, setNotifyOnCancellation] = useState(true);
  const [notifyAdminsOnRequest, setNotifyAdminsOnRequest] = useState(true);
  const [reminderHours, setReminderHours] = useState(2);
  
  // Admin Users
  const [admins, setAdmins] = useState(INITIAL_ADMINS);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState('admin');
  
  // Settings Data Status
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Load settings from database
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get system settings
        const systemSettingsRef = doc(db, 'settings', 'system');
        const systemSettingsSnap = await getDoc(systemSettingsRef);
        
        if (systemSettingsSnap.exists()) {
          const data = systemSettingsSnap.data();
          
          // Set state from database values or use defaults
          setSystemName(data.systemName || 'RIT Room Reservation System');
          setMaxDailyHours(data.maxDailyHours || 5);
          setMaxBookingDays(data.maxBookingDays || 30);
          setDefaultBookingDuration(data.defaultBookingDuration || 1);
          setMaintenanceMode(data.maintenanceMode || false);
          setRequireApproval(data.requireApproval || false);
        }
        
        // Get email settings
        const emailSettingsRef = doc(db, 'settings', 'email');
        const emailSettingsSnap = await getDoc(emailSettingsRef);
        
        if (emailSettingsSnap.exists()) {
          const data = emailSettingsSnap.data();
          
          setEnableEmails(data.enableEmails !== undefined ? data.enableEmails : true);
          setAdminEmail(data.adminEmail || 'roomreservations@rit.edu');
          setEmailFooter(data.emailFooter || 'This is an automated message from the RIT Room Reservation System.');
        }
        
        // Get notification settings
        const notificationSettingsRef = doc(db, 'settings', 'notifications');
        const notificationSettingsSnap = await getDoc(notificationSettingsRef);
        
        if (notificationSettingsSnap.exists()) {
          const data = notificationSettingsSnap.data();
          
          setNotifyOnBooking(data.notifyOnBooking !== undefined ? data.notifyOnBooking : true);
          setNotifyOnCancellation(data.notifyOnCancellation !== undefined ? data.notifyOnCancellation : true);
          setNotifyAdminsOnRequest(data.notifyAdminsOnRequest !== undefined ? data.notifyAdminsOnRequest : true);
          setReminderHours(data.reminderHours || 2);
        }
        
        // Get admin users
        const adminsCollection = collection(db, 'admin');
        const adminsSnapshot = await getDocs(adminsCollection);
        
        if (!adminsSnapshot.empty) {
          const adminUsers = [];
          
          adminsSnapshot.forEach(doc => {
            const adminData = doc.data();
            adminUsers.push({
              email: doc.id,
              role: adminData.role || 'admin',
              dateAdded: adminData.dateAdded?.toDate() || new Date()
            });
          });
          
          setAdmins(adminUsers);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error loading settings:", err);
        setError("Failed to load settings. Please try again.");
        setLoading(false);
      }
    };
    
    loadSettings();
  }, []);
  
  // Save all settings
  const saveAllSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Save system settings
      const systemSettingsRef = doc(db, 'settings', 'system');
      await setDoc(systemSettingsRef, {
        systemName,
        maxDailyHours,
        maxBookingDays,
        defaultBookingDuration,
        maintenanceMode,
        requireApproval,
        updatedAt: Timestamp.now()
      });
      
      // Save email settings
      const emailSettingsRef = doc(db, 'settings', 'email');
      await setDoc(emailSettingsRef, {
        enableEmails,
        adminEmail,
        emailFooter,
        updatedAt: Timestamp.now()
      });
      
      // Save notification settings
      const notificationSettingsRef = doc(db, 'settings', 'notifications');
      await setDoc(notificationSettingsRef, {
        notifyOnBooking,
        notifyOnCancellation,
        notifyAdminsOnRequest,
        reminderHours,
        updatedAt: Timestamp.now()
      });
      
      setSaving(false);
      setSuccess("All settings saved successfully");
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error("Error saving settings:", err);
      setError(`Failed to save settings: ${err.message}`);
      setSaving(false);
    }
  };
  
  // Add new admin
  const addAdmin = async () => {
    if (!newAdminEmail.trim()) {
      setError("Admin email is required");
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      // Check if already an admin
      if (admins.some(admin => admin.email === newAdminEmail)) {
        setError("This user is already an admin");
        setSaving(false);
        return;
      }
      
      // Add to admin collection
      const adminRef = doc(db, 'admin', newAdminEmail);
      await setDoc(adminRef, {
        role: newAdminRole,
        dateAdded: Timestamp.now()
      });
      
      // Update local state
      const newAdmin = {
        email: newAdminEmail,
        role: newAdminRole,
        dateAdded: new Date()
      };
      
      setAdmins([...admins, newAdmin]);
      
      // Reset form
      setNewAdminEmail('');
      setNewAdminRole('admin');
      
      setSaving(false);
      setSuccess(`Admin ${newAdminEmail} added successfully`);
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error("Error adding admin:", err);
      setError(`Failed to add admin: ${err.message}`);
      setSaving(false);
    }
  };
  
  // Remove admin
  const removeAdmin = async (email) => {
    try {
      setSaving(true);
      setError(null);
      
      // Delete from admin collection
      const adminRef = doc(db, 'admin', email);
      await deleteDoc(adminRef);
      
      // Update local state
      setAdmins(admins.filter(admin => admin.email !== email));
      
      setSaving(false);
      setSuccess(`Admin ${email} removed successfully`);
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error("Error removing admin:", err);
      setError(`Failed to remove admin: ${err.message}`);
      setSaving(false);
    }
  };
  
  // Handle maintenance mode toggle
  const handleMaintenanceToggle = (event) => {
    setMaintenanceMode(event.target.checked);
  };
  
  // Handle approval requirement toggle
  const handleApprovalToggle = (event) => {
    setRequireApproval(event.target.checked);
  };
  
  // Handle email notification toggle
  const handleEmailToggle = (event) => {
    setEnableEmails(event.target.checked);
  };
  
  // Handle booking notification toggle
  const handleBookingNotifyToggle = (event) => {
    setNotifyOnBooking(event.target.checked);
  };
  
  // Handle cancellation notification toggle
  const handleCancellationNotifyToggle = (event) => {
    setNotifyOnCancellation(event.target.checked);
  };
  
  // Handle admin request notification toggle
  const handleAdminNotifyToggle = (event) => {
    setNotifyAdminsOnRequest(event.target.checked);
  };
  
  // Format date for display
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Handle Snackbar close
  const handleSnackbarClose = () => {
    setSuccess(null);
    setError(null);
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <SettingsIcon sx={{ mr: 1 }} />
        System Settings
      </Typography>
      
      {/* Main Settings Container */}
      <Box sx={{ mb: 4 }}>
        {/* General System Settings */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
              <SettingsIcon sx={{ mr: 1 }} />
              General Settings
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="System Name"
                  fullWidth
                  value={systemName}
                  onChange={(e) => setSystemName(e.target.value)}
                  helperText="The name displayed in the header and email notifications"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={maintenanceMode}
                      onChange={handleMaintenanceToggle}
                      color="warning"
                    />
                  }
                  label="Maintenance Mode"
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  When enabled, only admins can access the system
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  label="Maximum Daily Hours"
                  value={maxDailyHours}
                  onChange={(e) => setMaxDailyHours(Number(e.target.value))}
                  type="number"
                  fullWidth
                  InputProps={{ 
                    inputProps: { min: 1, max: 24 },
                    endAdornment: <AccessTimeIcon color="action" />
                  }}
                  helperText="Maximum hours a user can book per day"
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  label="Maximum Booking Days in Advance"
                  value={maxBookingDays}
                  onChange={(e) => setMaxBookingDays(Number(e.target.value))}
                  type="number"
                  fullWidth
                  InputProps={{ 
                    inputProps: { min: 1, max: 365 },
                    endAdornment: <AccessTimeIcon color="action" />
                  }}
                  helperText="How far in advance users can make bookings"
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  label="Default Booking Duration"
                  value={defaultBookingDuration}
                  onChange={(e) => setDefaultBookingDuration(Number(e.target.value))}
                  type="number"
                  fullWidth
                  InputProps={{ 
                    inputProps: { min: 0.5, max: 8, step: 0.5 },
                    endAdornment: <AccessTimeIcon color="action" />
                  }}
                  helperText="Default booking length in hours"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={requireApproval}
                      onChange={handleApprovalToggle}
                      color="primary"
                    />
                  }
                  label="Require Admin Approval for Bookings"
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  When enabled, all reservations will require admin approval before being confirmed
                </Typography>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
        
        {/* Email Settings */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
              <EmailIcon sx={{ mr: 1 }} />
              Email Settings
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={enableEmails}
                      onChange={handleEmailToggle}
                      color="primary"
                    />
                  }
                  label="Enable Email Notifications"
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  When disabled, no emails will be sent from the system
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Admin Email Address"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  fullWidth
                  disabled={!enableEmails}
                  InputProps={{ 
                    endAdornment: <EmailIcon color="action" />
                  }}
                  helperText="Email used for system notifications"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Email Footer"
                  value={emailFooter}
                  onChange={(e) => setEmailFooter(e.target.value)}
                  fullWidth
                  multiline
                  rows={2}
                  disabled={!enableEmails}
                  helperText="Text added to the bottom of all email notifications"
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
        
        {/* Notification Settings */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
              <NotificationsIcon sx={{ mr: 1 }} />
              Notification Settings
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notifyOnBooking}
                      onChange={handleBookingNotifyToggle}
                      color="primary"
                    />
                  }
                  label="Notify on New Bookings"
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notifyOnCancellation}
                      onChange={handleCancellationNotifyToggle}
                      color="primary"
                    />
                  }
                  label="Notify on Cancellations"
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notifyAdminsOnRequest}
                      onChange={handleAdminNotifyToggle}
                      color="primary"
                    />
                  }
                  label="Notify Admins on Requests"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Booking Reminder Hours"
                  value={reminderHours}
                  onChange={(e) => setReminderHours(Number(e.target.value))}
                  type="number"
                  fullWidth
                  InputProps={{ 
                    inputProps: { min: 0, max: 48 },
                    endAdornment: <AccessTimeIcon color="action" />
                  }}
                  helperText="Hours before booking to send a reminder (0 to disable)"
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
        
        {/* Admin Users */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
              <GroupIcon sx={{ mr: 1 }} />
              Admin Users
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Add New Admin
              </Typography>
              
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={5}>
                  <TextField
                    label="Admin Email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    fullWidth
                    placeholder="email@rit.edu"
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Role</InputLabel>
                    <Select
                      value={newAdminRole}
                      onChange={(e) => setNewAdminRole(e.target.value)}
                      label="Role"
                    >
                      <MenuItem value="admin">Admin</MenuItem>
                      <MenuItem value="super_admin">Super Admin</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    fullWidth
                    onClick={addAdmin}
                    disabled={!newAdminEmail.trim() || saving}
                    startIcon={saving ? <CircularProgress size={20} /> : <AddIcon />}
                  >
                    Add Admin
                  </Button>
                </Grid>
              </Grid>
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="subtitle1" gutterBottom>
              Current Admins
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              {admins.length === 0 ? (
                <Typography variant="body2" color="text.secondary" align="center">
                  No admins found
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {admins.map((admin) => (
                    <Grid item xs={12} md={6} key={admin.email}>
                      <Card variant="outlined" sx={{ display: 'flex' }}>
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle2">
                            {admin.email}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                            <Chip 
                              size="small" 
                              label={admin.role === 'super_admin' ? 'Super Admin' : 'Admin'} 
                              color={admin.role === 'super_admin' ? 'secondary' : 'primary'}
                              variant="outlined"
                            />
                            <Typography variant="caption" color="text.secondary">
                              Added: {formatDate(admin.dateAdded)}
                            </Typography>
                          </Box>
                        </CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', pr: 1 }}>
                          <Tooltip title="Remove Admin">
                            <IconButton 
                              color="error" 
                              onClick={() => removeAdmin(admin.email)}
                              disabled={saving}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>
      </Box>
      
      {/* Save Button */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <Button 
          variant="contained" 
          color="primary" 
          size="large"
          onClick={saveAllSettings}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={24} /> : <SaveIcon />}
          sx={{ px: 4, py: 1.5 }}
        >
          {saving ? 'Saving...' : 'Save All Settings'}
        </Button>
      </Box>
      
      {/* Help Card */}
      <Paper sx={{ p: 3, mb: 4, bgcolor: '#f8f9fa' }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <HelpIcon sx={{ mr: 1 }} />
          Settings Information
        </Typography>
        
        <Typography paragraph>
          These settings control how the RIT Room Reservation System functions. Changes will take effect immediately after saving.
        </Typography>
        
        <Typography paragraph>
          <strong>Maintenance Mode:</strong> When enabled, only admin users can access the system. Users will see a maintenance message.
        </Typography>
        
        <Typography paragraph>
          <strong>Admin Approval:</strong> When enabled, bookings will be placed in a "pending" state until approved by an admin.
        </Typography>
        
        <Typography>
          <strong>Admin Users:</strong> Admins can manage rooms, view analytics, and change system settings. Super Admins have additional capabilities.
        </Typography>
      </Paper>
      
      {/* Snackbars for Success/Error messages */}
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

export default EnhancedSettings;
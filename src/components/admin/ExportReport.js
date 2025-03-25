// src/components/admin/ExportReport.js

import { format } from 'date-fns';

import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  FormControl,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  Divider,
  Alert,
  CircularProgress,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme
} from '@mui/material';
import React, { useState } from 'react';
// Icons
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableChartIcon from '@mui/icons-material/TableChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import PieChartIcon from '@mui/icons-material/PieChart';
import RoomIcon from '@mui/icons-material/Room';
import GroupIcon from '@mui/icons-material/Group';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// Import export utilities
import { 
  exportRoomUtilizationData,
  exportReservationData,
  generatePdfReport
} from '../../utils/analyticsExport';

function ExportReport({ analyticsData, startDate, endDate, roomId = null }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [exportType, setExportType] = useState('pdf');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [selectedData, setSelectedData] = useState({
    roomUtilization: true,
    buildingUtilization: true,
    timeDistribution: true,
    userBookings: true,
    reservations: true
  });

  const handleOpen = () => {
    setOpen(true);
    setSuccess(false);
    setError(null);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleExportTypeChange = (e) => {
    setExportType(e.target.value);
  };

  const handleSelectedDataChange = (e) => {
    setSelectedData({
      ...selectedData,
      [e.target.name]: e.target.checked
    });
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      setSuccess(false);
      setError(null);

      // Collect the data to be exported based on user selection
      const dataToExport = {};
      
      if (selectedData.roomUtilization) {
        dataToExport.roomUtilization = analyticsData.roomUtilization || [];
      }
      
      if (selectedData.buildingUtilization) {
        dataToExport.buildingUtilization = analyticsData.buildingUtilization || [];
      }
      
      if (selectedData.timeDistribution) {
        dataToExport.hourlyDistribution = analyticsData.hourlyDistribution || [];
        dataToExport.dailyDistribution = analyticsData.dailyDistribution || [];
      }
      
      if (selectedData.userBookings) {
        dataToExport.userBookings = analyticsData.userBookings || [];
      }
      
      if (selectedData.reservations) {
        dataToExport.reservations = analyticsData.reservationsData || [];
      }

      let fileName;
      
      // Handle different export types
      if (exportType === 'csv') {
        // Export room utilization data
        if (selectedData.roomUtilization) {
          fileName = exportRoomUtilizationData(
            dataToExport.roomUtilization,
            startDate,
            endDate
          );
        }
        
        // Export reservation data
        if (selectedData.reservations) {
          fileName = exportReservationData(
            dataToExport.reservations,
            startDate,
            endDate
          );
        }
      } else if (exportType === 'pdf') {
        // Generate PDF report with all selected data
        fileName = generatePdfReport(dataToExport, startDate, endDate);
      }

      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
      }, 2000);
    } catch (err) {
      console.error("Error exporting data:", err);
      setError("Failed to export data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Export Button */}
      <Button
        variant="outlined"
        startIcon={<DownloadIcon />}
        onClick={handleOpen}
        sx={{ ml: 'auto' }}
      >
        Export Report
      </Button>

      {/* Export Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Export Analytics Report</DialogTitle>
        
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Export successful! Your download should begin shortly.
            </Alert>
          )}
          
          <Typography variant="subtitle1" gutterBottom>
            Export Format
          </Typography>
          
          <RadioGroup
            value={exportType}
            onChange={handleExportTypeChange}
            row
            sx={{ mb: 2 }}
          >
            <FormControlLabel 
              value="pdf" 
              control={<Radio />} 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PictureAsPdfIcon sx={{ mr: 1 }} />
                  PDF Report
                </Box>
              } 
            />
            <FormControlLabel 
              value="csv" 
              control={<Radio />} 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TableChartIcon sx={{ mr: 1 }} />
                  CSV Data
                </Box>
              } 
            />
          </RadioGroup>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle1" gutterBottom>
            Include Data
          </Typography>
          
          {exportType === 'pdf' ? (
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <FormControl component="fieldset" sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedData.roomUtilization}
                        onChange={handleSelectedDataChange}
                        name="roomUtilization"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <BarChartIcon sx={{ mr: 1 }} />
                        Room Utilization
                      </Box>
                    }
                  />
                  
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedData.buildingUtilization}
                        onChange={handleSelectedDataChange}
                        name="buildingUtilization"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PieChartIcon sx={{ mr: 1 }} />
                        Building Utilization
                      </Box>
                    }
                  />
                  
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedData.timeDistribution}
                        onChange={handleSelectedDataChange}
                        name="timeDistribution"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AccessTimeIcon sx={{ mr: 1 }} />
                        Time Distribution
                      </Box>
                    }
                  />
                  
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedData.userBookings}
                        onChange={handleSelectedDataChange}
                        name="userBookings"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <GroupIcon sx={{ mr: 1 }} />
                        User Bookings
                      </Box>
                    }
                  />
                  
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedData.reservations}
                        onChange={handleSelectedDataChange}
                        name="reservations"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <RoomIcon sx={{ mr: 1 }} />
                        Reservations Data
                      </Box>
                    }
                  />
                </Box>
              </FormControl>
            </Paper>
          ) : (
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                Select which data to export as CSV:
              </Typography>
              
              <List dense>
                <ListItem 
                  button 
                  selected={selectedData.roomUtilization}
                  onClick={() => setSelectedData({
                    ...selectedData,
                    roomUtilization: true,
                    buildingUtilization: false,
                    timeDistribution: false,
                    userBookings: false,
                    reservations: false
                  })}
                >
                  <ListItemIcon>
                    <BarChartIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Room Utilization Data" 
                    secondary="Export data about room usage statistics" 
                  />
                  {selectedData.roomUtilization && <CheckCircleIcon color="primary" />}
                </ListItem>
                
                <ListItem 
                  button 
                  selected={selectedData.reservations}
                  onClick={() => setSelectedData({
                    ...selectedData,
                    roomUtilization: false,
                    buildingUtilization: false,
                    timeDistribution: false,
                    userBookings: false,
                    reservations: true
                  })}
                >
                  <ListItemIcon>
                    <RoomIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Reservations Data" 
                    secondary="Export detailed data for all reservations" 
                  />
                  {selectedData.reservations && <CheckCircleIcon color="primary" />}
                </ListItem>
              </List>
              
              <Typography variant="caption" color="text.secondary">
                Note: CSV exports are provided as separate files for each data type.
              </Typography>
            </Paper>
          )}
          
          <Typography variant="subtitle1" gutterBottom>
            Export Details
          </Typography>
          
          <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="body2">
              <strong>Date Range:</strong> {startDate ? format(startDate, 'MMM d, yyyy') : 'N/A'} - {endDate ? format(endDate, 'MMM d, yyyy') : 'N/A'}
            </Typography>
            
            {roomId && (
              <Typography variant="body2">
                <strong>Room:</strong> {roomId}
              </Typography>
            )}
            
            <Typography variant="body2">
              <strong>Format:</strong> {exportType === 'pdf' ? 'PDF Report' : 'CSV Data Files'}
            </Typography>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleExport}
            disabled={loading || (!selectedData.roomUtilization && !selectedData.buildingUtilization && 
                    !selectedData.timeDistribution && !selectedData.userBookings && !selectedData.reservations)}
            startIcon={loading ? <CircularProgress size={20} /> : <DownloadIcon />}
            color="primary"
          >
            {loading ? 'Exporting...' : 'Export Data'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default ExportReport;
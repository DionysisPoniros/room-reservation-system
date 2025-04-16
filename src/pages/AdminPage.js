// src/pages/AdminPage.js
import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Divider, 
  Tab, 
  Tabs, 
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
  useTheme
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getDashboardSummary } from '../services/analyticsService';

// Admin Components
import AdminRoomLoader from '../components/admin/AdminRoomLoader';
import AdminAnalytics from '../components/admin/AdminAnalytics';
import EnhancedSVGInspector from '../utils/EnhancedSVGInspector';
import EnhancedRoomManager from '../components/admin/EnhancedRoomManager';
import RoomImageManager from '../components/admin/RoomImageManager';
import HourRequestsManager from '../components/admin/HourRequestsManager';
import EnhancedSettings from '../components/admin/EnhancedSettings';
// Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import BarChartIcon from '@mui/icons-material/BarChart';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import SettingsIcon from '@mui/icons-material/Settings';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PeopleIcon from '@mui/icons-material/People';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MapIcon from '@mui/icons-material/Map';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';

function AdminPage() {
  const { currentUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [summaryData, setSummaryData] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme();
 
  useEffect(() => {
    const checkAdmin = async () => {
      console.log("Checking admin status...");
      
      if (!currentUser) {
        console.log("No user is signed in");
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      
      console.log("Current user email:", currentUser.email);
      
      try {
        // Make email lowercase to handle case sensitivity
        const adminEmail = currentUser.email.toLowerCase();
        console.log("Looking for admin document with ID:", adminEmail);
        
        // Check if user is in admins collection
        const adminRef = doc(db, 'admin', adminEmail);
        const adminSnap = await getDoc(adminRef);
        
        console.log("Admin document exists:", adminSnap.exists());
        
        setIsAdmin(adminSnap.exists());
        setLoading(false);
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
        setLoading(false);
      }
    };
    
    checkAdmin();
  }, [currentUser]);
  
  // Fetch dashboard summary data
  useEffect(() => {
    const fetchSummaryData = async () => {
      if (!isAdmin) return;
      
      try {
        setSummaryLoading(true);
        setError(null);
        
        const summary = await getDashboardSummary();
        setSummaryData(summary);
        
        setSummaryLoading(false);
      } catch (err) {
        console.error("Error fetching dashboard summary:", err);
        setError("Failed to load dashboard summary. Please try again.");
        setSummaryLoading(false);
      }
    };
    
    if (isAdmin) {
      fetchSummaryData();
    }
  }, [isAdmin]);
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
 
  if (loading) return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    </Container>
  );
 
  if (!isAdmin) {
    return <Navigate to="/" />;
  }
  
  // Dashboard Summary Component
  const DashboardSummary = () => {
    if (summaryLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (error) {
      return (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      );
    }
    
    if (!summaryData) {
      return (
        <Alert severity="info">
          No summary data available.
        </Alert>
      );
    }
    
    return (
      <Box>
        <Typography variant="h5" gutterBottom>
          Dashboard Overview
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', borderLeft: `4px solid ${theme.palette.primary.main}` }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Today's Bookings
                </Typography>
                <Typography variant="h3" color="primary">
                  {summaryData.today.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {summaryData.today.active} Active, {summaryData.today.cancelled} Cancelled
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', borderLeft: `4px solid ${theme.palette.secondary.main}` }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Monthly Bookings
                </Typography>
                <Typography variant="h3" color="secondary">
                  {summaryData.month.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  By {summaryData.month.uniqueUsers} unique users
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', borderLeft: `4px solid ${theme.palette.info.main}` }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Total Rooms
                </Typography>
                <Typography variant="h3" color="info.main">
                  {summaryData.roomCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Available for booking
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', borderLeft: `4px solid ${theme.palette.success.main}` }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Average Utilization
                </Typography>
                <Typography variant="h3" color="success.main">
                  {summaryData.month.averageUtilization.toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Last 30 days
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                System Status
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                <Typography>Reservations system is online</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                <Typography>Database connections are healthy</Typography>
              </Box>
              
              {summaryData.month.cancellationRate > 20 && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <WarningIcon color="warning" sx={{ mr: 1 }} />
                  <Typography>High cancellation rate detected ({summaryData.month.cancellationRate.toFixed(1)}%)</Typography>
                </Box>
              )}
              
              {summaryData.month.averageUtilization < 20 && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <WarningIcon color="warning" sx={{ mr: 1 }} />
                  <Typography>Low room utilization detected ({summaryData.month.averageUtilization.toFixed(1)}%)</Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };
 
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            aria-label="admin tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <DashboardIcon sx={{ mr: 1 }} fontSize="small" />
                  Dashboard
                </Box>
              } 
              id="tab-0" 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <BarChartIcon sx={{ mr: 1 }} fontSize="small" />
                  Analytics
                </Box>
              } 
              id="tab-1" 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <MeetingRoomIcon sx={{ mr: 1 }} fontSize="small" />
                  Rooms Management
                </Box>
              } 
              id="tab-2" 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <SettingsIcon sx={{ mr: 1 }} fontSize="small" />
                  Settings
                </Box>
              } 
              id="tab-3" 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AccessTimeIcon sx={{ mr: 1 }} fontSize="small" />
                  Hour Requests
                </Box>
              } 
              id="tab-4" 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <MapIcon sx={{ mr: 1 }} fontSize="small" />
                  SVG Mapping
                </Box>
              } 
              id="tab-5" 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PhotoLibraryIcon sx={{ mr: 1 }} fontSize="small" />
                  Room Images
                </Box>
              } 
              id="tab-6" 
            />
          </Tabs>
        </Box>
        
        {/* Tab Panels */}
        <Box role="tabpanel" hidden={activeTab !== 0}>
          {activeTab === 0 && <DashboardSummary />}
        </Box>
        
        <Box role="tabpanel" hidden={activeTab !== 1}>
          {activeTab === 1 && <AdminAnalytics />}
        </Box>
        
        <Box role="tabpanel" hidden={activeTab !== 2}>
          {activeTab === 2 && <EnhancedRoomManager />}
        </Box>
        
        <Box role="tabpanel" hidden={activeTab !== 3}>
          {activeTab === 3 && <EnhancedSettings />}
        </Box>
        
        <Box role="tabpanel" hidden={activeTab !== 4}>
          {activeTab === 4 && <HourRequestsManager />}
        </Box>
        
        <Box role="tabpanel" hidden={activeTab !== 5}>
          {activeTab === 5 && <EnhancedSVGInspector />}
        </Box>
        
        <Box role="tabpanel" hidden={activeTab !== 6}>
          {activeTab === 6 && <RoomImageManager />}
        </Box>
      </Box>
    </Container>
  );
}

export default AdminPage;

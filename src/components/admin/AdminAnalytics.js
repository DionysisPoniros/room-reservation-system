// src/components/admin/AdminAnalytics.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Divider,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  useTheme
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, isSameDay } from 'date-fns';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

// Components
import RoomSelector from './RoomSelector';
import RoomAnalytics from './RoomAnalytics';
import ExportReport from './ExportReport';

// Import Firebase services and custom service functions
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { getRooms, getReservationsForDate, getRoomUtilizationStats } from '../../services/roomService';

function AdminAnalytics() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [timeRange, setTimeRange] = useState('week');
  const [startDate, setStartDate] = useState(startOfWeek(new Date()));
  const [endDate, setEndDate] = useState(endOfWeek(new Date()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  
  // Analytics data states
  const [reservationsData, setReservationsData] = useState([]);
  const [roomUtilization, setRoomUtilization] = useState([]);
  const [buildingUtilization, setBuildingUtilization] = useState([]);
  const [hourlyDistribution, setHourlyDistribution] = useState([]);
  const [dailyDistribution, setDailyDistribution] = useState([]);
  const [userBookings, setUserBookings] = useState([]);
  const [cancelledBookings, setCancelledBookings] = useState(0);
  const [totalBookings, setTotalBookings] = useState(0);
  
  // Colors for charts
  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    '#2196F3',
    '#4CAF50',
    '#FFC107',
    '#FF5722',
    '#9C27B0',
    '#607D8B'
  ];
  
  // When time range changes, update date range
  useEffect(() => {
    const now = new Date();
    let newStartDate, newEndDate;
    
    switch (timeRange) {
      case 'today':
        newStartDate = new Date(now.setHours(0, 0, 0, 0));
        newEndDate = new Date(now.setHours(23, 59, 59, 999));
        break;
      case 'week':
        newStartDate = startOfWeek(now);
        newEndDate = endOfWeek(now);
        break;
      case 'month':
        newStartDate = startOfMonth(now);
        newEndDate = endOfMonth(now);
        break;
      case 'custom':
        // Don't change dates for custom range
        return;
      default:
        newStartDate = startOfWeek(now);
        newEndDate = endOfWeek(now);
    }
    
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  }, [timeRange]);
  
  // Fetch analytics data when date range changes
  useEffect(() => {
    const fetchAnalyticsData = async () => {
        try {
          setLoading(true);
          setError(null);
          
          // Get all rooms
          const rooms = await getRooms();
          
          // Convert dates to timestamps for Firestore queries
          const startTimestamp = Timestamp.fromDate(startDate);
          const endTimestamp = Timestamp.fromDate(endDate);
          
          // Query for reservations in the selected date range
          const reservationsQuery = query(
            collection(db, 'reservations'),
            where('startTime', '>=', startTimestamp),
            where('startTime', '<=', endTimestamp)
          );
          
          const reservationsSnapshot = await getDocs(reservationsQuery);
          const reservations = reservationsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          setTotalBookings(reservations.length);
          
          // Calculate cancelled bookings
          const cancelled = reservations.filter(r => r.status === 'cancelled').length;
          setCancelledBookings(cancelled);
          
          // Process room utilization data
          const roomStats = {};
          const buildingStats = {};
          const hourlyStats = Array(24).fill(0);
          const dailyStats = Array(7).fill(0);
          const userStats = {};
          
          reservations.forEach(reservation => {
            // Skip cancelled reservations for some metrics
            const isCancelled = reservation.status === 'cancelled';
            
            // Get room details
            const room = rooms.find(r => r.id === reservation.roomId);
            if (!room) return;
            
            // Extract building from room data
            let building = 'Unknown';
            if (room.building) {
              building = room.building;
            } else if (room.location) {
              // Try to extract building from location (e.g., "Max Lowenthal Hall, Floor 1")
              const locationParts = room.location.split(',');
              if (locationParts.length > 0) {
                building = locationParts[0].trim();
              }
            }
            
            // Room utilization (count all reservations for total stats)
            if (!roomStats[reservation.roomId]) {
              roomStats[reservation.roomId] = {
                id: reservation.roomId,
                name: room.name,
                type: room.type || 'Unknown',
                building: building, // Use the extracted building
                capacity: room.capacity || 0,
                bookingCount: 0,
                activeBookings: 0,
                cancelledBookings: 0,
                hoursBooked: 0
              };
            }
            
            roomStats[reservation.roomId].bookingCount += 1;
            
            if (isCancelled) {
              roomStats[reservation.roomId].cancelledBookings += 1;
            } else {
              roomStats[reservation.roomId].activeBookings += 1;
              
              // Calculate hours booked (only for active bookings)
              const startTime = reservation.startTime.toDate();
              const endTime = reservation.endTime.toDate();
              const hoursBooked = (endTime - startTime) / (1000 * 60 * 60);
              roomStats[reservation.roomId].hoursBooked += hoursBooked;
              
              // Building utilization
              if (!buildingStats[building]) {
                buildingStats[building] = {
                  name: building,
                  bookingCount: 0,
                  hoursBooked: 0
                };
              }
              buildingStats[building].bookingCount += 1;
              buildingStats[building].hoursBooked += hoursBooked;
              
              // Hourly distribution
              const hour = startTime.getHours();
              hourlyStats[hour] += 1;
              
              // Daily distribution
              const day = startTime.getDay();
              dailyStats[day] += 1;
            }
            
            // User bookings (count all for user stats)
            if (!userStats[reservation.userId]) {
              userStats[reservation.userId] = {
                id: reservation.userId,
                email: reservation.userEmail || reservation.userId,
                bookingCount: 0,
                activeBookings: 0,
                cancelledBookings: 0,
                hoursBooked: 0
              };
            }
            
            userStats[reservation.userId].bookingCount += 1;
            
            if (isCancelled) {
              userStats[reservation.userId].cancelledBookings += 1;
            } else {
              userStats[reservation.userId].activeBookings += 1;
              
              // Calculate hours (only for active bookings)
              const startTime = reservation.startTime.toDate();
              const endTime = reservation.endTime.toDate();
              const hoursBooked = (endTime - startTime) / (1000 * 60 * 60);
              userStats[reservation.userId].hoursBooked += hoursBooked;
            }
          });
          
          // Convert to arrays for charts
          const roomUtilizationData = Object.values(roomStats)
            .sort((a, b) => b.bookingCount - a.bookingCount)
            .slice(0, 10); // Top 10 rooms
          
          const buildingUtilizationData = Object.values(buildingStats)
            .sort((a, b) => b.bookingCount - a.bookingCount);
          
          const hourlyDistributionData = hourlyStats.map((count, hour) => ({
            hour: `${hour}:00`,
            count
          }));
          
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const dailyDistributionData = dailyStats.map((count, day) => ({
            day: dayNames[day],
            count
          }));
          
          const userBookingsData = Object.values(userStats)
            .sort((a, b) => b.bookingCount - a.bookingCount)
            .slice(0, 10); // Top 10 users
          
          // Update state with processed data
          setReservationsData(reservations);
          setRoomUtilization(roomUtilizationData);
          setBuildingUtilization(buildingUtilizationData);
          setHourlyDistribution(hourlyDistributionData);
          setDailyDistribution(dailyDistributionData);
          setUserBookings(userBookingsData);
          
          setLoading(false);
        } catch (err) {
          console.error("Error fetching analytics data:", err);
          setError("Failed to load analytics data. Please try again.");
          setLoading(false);
        }
      
    };
    
    fetchAnalyticsData();
  }, [startDate, endDate]);
  
  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };
  
  const handleStartDateChange = (newDate) => {
    setTimeRange('custom');
    setStartDate(newDate);
  };
  
  const handleEndDateChange = (newDate) => {
    setTimeRange('custom');
    setEndDate(newDate);
  };
  
  // Format date for display
  const formatDate = (date) => {
    return format(date, 'MMM d, yyyy');
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Handle room selection
  const handleRoomChange = (roomId) => {
    setSelectedRoomId(roomId);
  };
  
  // Loading indicator
  if (loading && activeTab === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        Room Reservation Analytics
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        View analytics and insights about room usage across the campus
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="analytics tabs">
          <Tab label="Overview" id="tab-0" />
          <Tab label="Room Analytics" id="tab-1" />
        </Tabs>
      </Box>
      
      {/* Overview Tab */}
      <Box role="tabpanel" hidden={activeTab !== 0}>
        {activeTab === 0 && (
          <>
            {/* Time range controls */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3, alignItems: 'center' }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel id="time-range-label">Time Range</InputLabel>
                <Select
                  labelId="time-range-label"
                  value={timeRange}
                  onChange={handleTimeRangeChange}
                  label="Time Range"
                >
                  <MenuItem value="today">Today</MenuItem>
                  <MenuItem value="week">This Week</MenuItem>
                  <MenuItem value="month">This Month</MenuItem>
                  <MenuItem value="custom">Custom Range</MenuItem>
                </Select>
              </FormControl>
              
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={handleStartDateChange}
                  disabled={timeRange !== 'custom'}
                  slotProps={{ textField: { sx: { minWidth: 180 } } }}
                />
                
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={handleEndDateChange}
                  disabled={timeRange !== 'custom'}
                  slotProps={{ textField: { sx: { minWidth: 180 } } }}
                />
              </LocalizationProvider>
              
              <Typography variant="body2" color="text.secondary">
                {formatDate(startDate)} - {formatDate(endDate)}
              </Typography>
            </Box>
            
            {/* Key metrics */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Total Bookings
                    </Typography>
                    <Typography variant="h3" color="primary">
                      {totalBookings}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Active Bookings
                    </Typography>
                    <Typography variant="h3" color="success.main">
                      {totalBookings - cancelledBookings}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Cancelled Bookings
                    </Typography>
                    <Typography variant="h3" color="error.main">
                      {cancelledBookings}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Cancellation Rate
                    </Typography>
                    <Typography variant="h3" color={cancelledBookings / Math.max(1, totalBookings) > 0.2 ? "error.main" : "text.primary"}>
                      {totalBookings ? Math.round((cancelledBookings / totalBookings) * 100) : 0}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            {/* Charts row 1 */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {/* Room Utilization */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    Top 10 Most Booked Rooms
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={roomUtilization}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="bookingCount" name="Bookings" fill={theme.palette.primary.main} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Grid>
              
              {/* Building Utilization */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    Building Utilization
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={buildingUtilization}
                          dataKey="bookingCount"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {buildingUtilization.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name, props) => [value, props.payload.name]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
            
            {/* Charts row 2 */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {/* Hourly Distribution */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    Bookings by Hour of Day
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={hourlyDistribution}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="count" name="Bookings" stroke={theme.palette.primary.main} />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Grid>
              
              {/* Daily Distribution */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    Bookings by Day of Week
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={dailyDistribution}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" name="Bookings" fill={theme.palette.primary.main} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
            
            {/* User bookings */}
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Top 10 Users by Booking Count
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={userBookings}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="email" type="category" width={150} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="bookingCount" name="Bookings" fill={theme.palette.primary.main} />
                        <Bar dataKey="hoursBooked" name="Hours Booked" fill={theme.palette.secondary.main} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
            
            {/* Export data button */}
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <ExportReport 
                analyticsData={{
                  roomUtilization,
                  buildingUtilization,
                  hourlyDistribution,
                  dailyDistribution,
                  userBookings,
                  reservationsData
                }}
                startDate={startDate}
                endDate={endDate}
              />
            </Box>
          </>
        )}
      </Box>
      
      {/* Room Analytics Tab */}
      <Box role="tabpanel" hidden={activeTab !== 1}>
        {activeTab === 1 && (
          <>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Select a Room
              </Typography>
              <RoomSelector onChange={handleRoomChange} initialRoomId={selectedRoomId} />
            </Box>
            
            {selectedRoomId ? (
              <RoomAnalytics roomId={selectedRoomId} />
            ) : (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  Please select a room above to view detailed analytics
                </Typography>
              </Paper>
            )}
          </>
        )}
      </Box>
    </Paper>
  );
}

export default AdminAnalytics;
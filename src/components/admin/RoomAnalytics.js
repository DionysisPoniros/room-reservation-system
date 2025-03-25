// src/components/admin/RoomAnalytics.js
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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, isSameDay, parseISO } from 'date-fns';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

// Components
import ExportReport from './ExportReport';

// Icons
import EventIcon from '@mui/icons-material/Event';
import PeopleIcon from '@mui/icons-material/People';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssessmentIcon from '@mui/icons-material/Assessment';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import GroupIcon from '@mui/icons-material/Group';
import BusinessIcon from '@mui/icons-material/Business';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import EventBusyIcon from '@mui/icons-material/EventBusy';

// Import Firebase services and custom service functions
import { collection, query, where, getDocs, Timestamp, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { getRoom, getRoomReservations, getRoomUtilizationStats } from '../../services/roomService';

function RoomAnalytics({ roomId }) {
  const theme = useTheme();
  const [room, setRoom] = useState(null);
  const [timeRange, setTimeRange] = useState('week');
  const [startDate, setStartDate] = useState(startOfWeek(new Date()));
  const [endDate, setEndDate] = useState(endOfWeek(new Date()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Analytics data states
  const [utilization, setUtilization] = useState(null);
  const [dailyStats, setDailyStats] = useState([]);
  const [hourlyStats, setHourlyStats] = useState([]);
  const [userStats, setUserStats] = useState([]);
  const [recentReservations, setRecentReservations] = useState([]);
  const [capacityUtilization, setCapacityUtilization] = useState(0);
  
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
  
  // Fetch room data when roomId changes
  useEffect(() => {
    const fetchInitialRoomData = async () => {
      try {
        console.log("Fetching initial room data for:", roomId);
        
        setLoading(true);
        setError(null);
        
        if (!roomId) {
          setError("No room selected");
          setLoading(false);
          return;
        }
        
        // Get room details
        const roomData = await getRoom(roomId);
        if (roomData) {
          console.log("Found room:", roomData);
          setRoom(roomData);
        } else {
          setError("Room not found");
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching initial room data:", err);
        setError("Failed to load room data. Please try again.");
        setLoading(false);
      }
    };
    
    fetchInitialRoomData();
  }, [roomId]);
  
  // Fetch analytics data when room, startDate, or endDate changes
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        if (!roomId || !startDate || !endDate) return;
        
        console.log("Fetching analytics data for:", roomId);
        console.log("Date range:", startDate, "to", endDate);
        
        setLoading(true);
        setError(null);
        
        try {
          // Get room utilization stats
          console.log("Getting utilization stats...");
          const stats = await getRoomUtilizationStats(roomId, startDate, endDate);
          console.log("Received stats:", stats);
          
          // Set utilization data
          setUtilization(stats);
          
          // If we don't have room data yet but stats has room details, use them
          if (!room && stats.roomDetails) {
            console.log("Setting room from stats:", stats.roomDetails);
            setRoom(stats.roomDetails);
          }
          
          // If room doesn't have a building but can be extracted from location
          if (room && !room.building && room.location) {
            const locationParts = room.location.split(',');
            if (locationParts.length > 0) {
              const buildingFromLocation = locationParts[0].trim();
              // Create a new room object with the extracted building
              const updatedRoom = {
                ...room,
                building: buildingFromLocation
              };
              setRoom(updatedRoom);
            }
          }
          
          // Process the reservations if provided in stats
          if (stats.reservations && stats.reservations.length > 0) {
            processReservationsData(stats.reservations);
          } else {
            // Fallback to separate query if reservations aren't included in stats
            await fetchReservationsData();
          }
        } catch (statsError) {
          console.error("Error getting room utilization:", statsError);
          setError("Failed to load utilization data: " + statsError.message);
          
          // Try to fetch reservations separately if utilization stats failed
          await fetchReservationsData();
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error in fetchAnalyticsData:", err);
        setError("Failed to load analytics data: " + err.message);
        setLoading(false);
      }
    };
    
    // Helper function to fetch and process reservations separately
    const fetchReservationsData = async () => {
      try {
        if (!roomId || !startDate || !endDate || !room) return;
        
        // Convert dates to timestamps for Firestore queries
        const startTimestamp = Timestamp.fromDate(startDate);
        const endTimestamp = Timestamp.fromDate(endDate);
        
        // Query for reservations for this room in the selected date range
        const reservationsQuery = query(
          collection(db, 'reservations'),
          where('roomId', '==', roomId),
          where('startTime', '>=', startTimestamp),
          where('startTime', '<=', endTimestamp),
          orderBy('startTime')
        );
        
        const reservationsSnapshot = await getDocs(reservationsQuery);
        const reservations = reservationsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Process the reservations
        processReservationsData(reservations);
      } catch (err) {
        console.error("Error fetching reservations data:", err);
      }
    };
    
    // Helper function to process reservations into stats
    const processReservationsData = (reservations) => {
      try {
        // Process daily stats
        const dailyData = {};
        
        // Calculate day difference
        const dayDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        
        // Initialize all days in the range
        for (let i = 0; i < dayDiff; i++) {
          const currentDate = addDays(startDate, i);
          const dateKey = format(currentDate, 'yyyy-MM-dd');
          
          dailyData[dateKey] = {
            date: dateKey,
            formattedDate: format(currentDate, 'MMM d'),
            total: 0,
            confirmed: 0,
            cancelled: 0,
            hours: 0
          };
        }
        
        // Process hourly stats
        const hourlyData = Array(24).fill(0).map((_, hour) => ({
          hour: `${hour}:00`,
          count: 0
        }));
        
        // Process user stats
        const userData = {};
        
        // Total attendees and capacity for capacity utilization calculation
        let totalAttendees = 0;
        let totalCapacity = 0;
        
        // Process reservations
        for (const reservation of reservations) {
          if (!reservation.startTime || !reservation.endTime) continue;
          
          // Get reservation date and hour
          const resDate = reservation.startTime.toDate();
          const dateKey = format(resDate, 'yyyy-MM-dd');
          const hour = resDate.getHours();
          
          // Calculate hours booked
          const startTime = reservation.startTime.toDate();
          const endTime = reservation.endTime.toDate();
          const hoursBooked = (endTime - startTime) / (1000 * 60 * 60);
          
          // Update daily stats
          if (dailyData[dateKey]) {
            dailyData[dateKey].total += 1;
            dailyData[dateKey].hours += hoursBooked;
            
            if (reservation.status === 'cancelled') {
              dailyData[dateKey].cancelled += 1;
            } else {
              dailyData[dateKey].confirmed += 1;
            }
          }
          
          // Update hourly stats (only for confirmed reservations)
          if (reservation.status !== 'cancelled') {
            hourlyData[hour].count += 1;
          }
          
          // Update user stats
          const userId = reservation.userId;
          const userEmail = reservation.userEmail || userId;
          
          if (!userData[userId]) {
            userData[userId] = {
              id: userId,
              email: userEmail,
              bookingCount: 0,
              hoursBooked: 0
            };
          }
          
          userData[userId].bookingCount += 1;
          userData[userId].hoursBooked += hoursBooked;
          
          // Update capacity utilization stats
          if (reservation.status !== 'cancelled' && room) {
            const attendees = reservation.attendees || 1;
            totalAttendees += attendees;
            totalCapacity += room.capacity * 1; // Multiply by 1 to ensure numeric value
          }
        }
        
        // Calculate capacity utilization percentage
        const avgCapacityUtilization = totalCapacity > 0 
          ? (totalAttendees / totalCapacity) * 100 
          : 0;
        
        // Convert to arrays and sort
        const sortedDailyStats = Object.values(dailyData).sort((a, b) => 
          a.date.localeCompare(b.date)
        );
        
        const sortedUserStats = Object.values(userData)
          .sort((a, b) => b.bookingCount - a.bookingCount)
          .slice(0, 5); // Top 5 users
        
        setDailyStats(sortedDailyStats);
        setHourlyStats(hourlyData);
        setUserStats(sortedUserStats);
        setCapacityUtilization(avgCapacityUtilization);
        
        // Fetch recent reservations (not limited to date range)
        fetchRecentReservations();
      } catch (err) {
        console.error("Error processing reservations data:", err);
      }
    };
    
    // Helper function to fetch recent reservations
    const fetchRecentReservations = async () => {
      try {
        if (!roomId) return;
        
        // Get recent reservations
        const recentQuery = query(
          collection(db, 'reservations'),
          where('roomId', '==', roomId),
          orderBy('startTime', 'desc'),
          limit(5)
        );
        
        const recentSnapshot = await getDocs(recentQuery);
        const recentReservationsData = recentSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setRecentReservations(recentReservationsData);
      } catch (err) {
        console.error("Error fetching recent reservations:", err);
      }
    };
    
    fetchAnalyticsData();
  }, [roomId, startDate, endDate, room]);
  
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
    if (!date) return '';
    return format(new Date(date), 'MMM d, yyyy');
  };
  
  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    if (!timestamp || !timestamp.seconds) return '';
    return format(new Date(timestamp.seconds * 1000), 'MMM d, yyyy h:mm a');
  };
  
  // Calculate utilization trend
  const calculateUtilizationTrend = () => {
    if (!dailyStats || dailyStats.length < 2) return "steady";
    
    // Calculate average hours in first half and second half
    const middleIndex = Math.floor(dailyStats.length / 2);
    
    let firstHalfHours = 0;
    let secondHalfHours = 0;
    
    for (let i = 0; i < middleIndex; i++) {
      firstHalfHours += dailyStats[i].hours;
    }
    
    for (let i = middleIndex; i < dailyStats.length; i++) {
      secondHalfHours += dailyStats[i].hours;
    }
    
    const firstHalfAvg = firstHalfHours / Math.max(1, middleIndex);
    const secondHalfAvg = secondHalfHours / Math.max(1, dailyStats.length - middleIndex);
    
    // Calculate percentage change
    const percentChange = firstHalfAvg === 0 ? 0 : ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
    
    if (percentChange > 10) return "increasing";
    if (percentChange < -10) return "decreasing";
    return "steady";
  };
  
  if (loading && !room) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error && !room) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }
  
  if (!room) {
    return (
      <Alert severity="info">
        No room selected. Please select a room to view analytics.
      </Alert>
    );
  }
  
  const utilizationTrend = calculateUtilizationTrend();
  
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        Room Analytics: {room.name}
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        View detailed analytics and insights for this room
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Room details */}
      <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #e0e0e0' }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1">Room Details</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
              <Typography variant="body2"><strong>Location:</strong> {room.location}</Typography>
              <Typography variant="body2"><strong>Type:</strong> {room.type}</Typography>
              <Typography variant="body2"><strong>Capacity:</strong> {room.capacity} people</Typography>
              <Typography variant="body2">
                <strong>Equipment:</strong> {room.equipment ? room.equipment.join(', ') : 'None listed'}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1">Time Period</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1, alignItems: 'center' }}>
              <FormControl sx={{ minWidth: 150, flexGrow: 1 }}>
                <InputLabel id="time-range-label">Time Range</InputLabel>
                <Select
                  labelId="time-range-label"
                  value={timeRange}
                  onChange={handleTimeRangeChange}
                  label="Time Range"
                  size="small"
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
                  slotProps={{ textField: { size: 'small', sx: { width: 150 } } }}
                />
                
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={handleEndDateChange}
                  disabled={timeRange !== 'custom'}
                  slotProps={{ textField: { size: 'small', sx: { width: 150 } } }}
                />
              </LocalizationProvider>
            </Box>
          </Grid>
        </Grid>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Key metrics */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Total Bookings
                  </Typography>
                  <Typography variant="h3" color="primary">
                    {utilization ? utilization.totalReservations : 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(startDate)} - {formatDate(endDate)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Hours Booked
                  </Typography>
                  <Typography variant="h3" color="primary">
                    {utilization ? Math.round(utilization.totalHoursBooked) : 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total hours of usage
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Time Utilization
                  </Typography>
                  <Typography variant="h3" color="primary">
                    {utilization ? Math.round(utilization.utilizationPercentage) : 0}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Of available time
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Capacity Usage
                  </Typography>
                  <Typography variant="h3" color="primary">
                    {Math.round(capacityUtilization)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average attendees/capacity
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          {/* Charts row 1 */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Daily bookings chart */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Daily Bookings
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dailyStats}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="formattedDate" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="confirmed" name="Confirmed" fill={theme.palette.success.main} />
                      <Bar dataKey="cancelled" name="Cancelled" fill={theme.palette.error.main} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
            
            {/* Hourly distribution */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Bookings by Hour
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={hourlyStats}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="hour" type="category" width={40} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Bookings" fill={theme.palette.primary.main} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
          </Grid>
          
          {/* Charts row 2 */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Top users */}
            <Grid item xs={12} md={5}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Top Users
                </Typography>
                {userStats.length > 0 ? (
                  <List>
                    {userStats.map((user) => (
                      <ListItem key={user.id}>
                        <ListItemIcon>
                          <PeopleIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={user.email}
                          secondary={`${user.bookingCount} bookings, ${user.hoursBooked.toFixed(1)} hours`}
                        />
                        <Chip 
                          label={`${user.bookingCount} bookings`} 
                          variant="outlined" 
                          color="primary" 
                          size="small"
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                    No booking data available for the selected time period.
                  </Typography>
                )}
              </Paper>
            </Grid>
            
            {/* Recent Reservations */}
            <Grid item xs={12} md={7}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Recent Reservations
                </Typography>
                {recentReservations.length > 0 ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date & Time</TableCell>
                          <TableCell>User</TableCell>
                          <TableCell>Duration</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {recentReservations.map((reservation) => {
                          if (!reservation.startTime || !reservation.endTime) return null;
                          // Calculate duration in hours
                          const startTime = reservation.startTime.seconds * 1000;
                          const endTime = reservation.endTime.seconds * 1000;
                          const durationHours = ((endTime - startTime) / (1000 * 60 * 60)).toFixed(1);
                          
                          return (
                            <TableRow key={reservation.id}>
                              <TableCell>{formatTimestamp(reservation.startTime)}</TableCell>
                              <TableCell>{reservation.userEmail || 'Unknown'}</TableCell>
                              <TableCell>{durationHours} hrs</TableCell>
                              <TableCell>
                                {reservation.status === 'cancelled' ? (
                                  <Chip 
                                    label="Cancelled" 
                                    size="small" 
                                    color="error" 
                                    variant="outlined" 
                                  />
                                ) : (
                                  <Chip 
                                    label="Confirmed" 
                                    size="small" 
                                    color="success" 
                                    variant="outlined" 
                                  />
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                    No recent reservations found.
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
          
          {/* Recommendations section */}
          <Paper sx={{ p: 2, mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Insights and Recommendations
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    <TrendingUpIcon sx={{ verticalAlign: 'middle', mr: 1 }} color={
                      utilizationTrend === "increasing" ? "success" : 
                      utilizationTrend === "decreasing" ? "error" : 
                      "action"
                    } />
                    Utilization Trend
                  </Typography>
                  <Typography variant="body2">
                    {utilizationTrend === "increasing" && "This room's usage is trending upward during this period. Consider adding similar rooms to accommodate growing demand."}
                    {utilizationTrend === "decreasing" && "This room's usage is trending downward during this period. Consider investigating reasons for decreased demand."}
                    {utilizationTrend === "steady" && "This room has consistent usage during this period, indicating stable demand."}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    <AccessTimeIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                    Peak Usage Times
                  </Typography>
                  <Typography variant="body2">
                    {hourlyStats.length > 0
                      ? `Peak usage times for this room are around ${hourlyStats.sort((a, b) => b.count - a.count)[0].hour}.
                         Consider scheduling maintenance outside these hours.`
                      : "No peak usage data available."
                    }
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    <GroupIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                    Capacity Optimization
                  </Typography>
                  <Typography variant="body2">
                    {capacityUtilization > 80 
                      ? "This room is at or near capacity for most bookings. Consider adding more similar rooms or expanding capacity."
                      : capacityUtilization < 40
                        ? `This room is often underutilized at only ${Math.round(capacityUtilization)}% of capacity. Consider repurposing for smaller groups or dividing the space.`
                        : `The room is well-matched to its use at ${Math.round(capacityUtilization)}% average capacity utilization.`
                    }
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    <MeetingRoomIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                    Equipment Usage
                  </Typography>
                  <Typography variant="body2">
                    {room.equipment && room.equipment.length > 0
                      ? `This room is equipped with ${room.equipment.join(', ')}. Verify that all equipment remains functional and meets user needs.`
                      : "This room has no equipment listed. Consider adding equipment to improve functionality."
                    }
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
          
          {/* Export buttons */}
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <ExportReport 
              analyticsData={{
                roomUtilization: [room],
                hourlyDistribution: hourlyStats,
                dailyDistribution: dailyStats,
                userBookings: userStats,
                reservationsData: recentReservations
              }}
              startDate={startDate}
              endDate={endDate}
              roomId={roomId}
            />
          </Box>
        </>
      )}
    </Paper>
  );
}

export default RoomAnalytics;
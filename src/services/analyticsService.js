// src/services/analyticsService.js
import {
    collection,
    query,
    where,
    getDocs,
    Timestamp,
    orderBy,
    limit,
    startAfter,
    endBefore,
    getDoc,
    doc
  } from 'firebase/firestore';
  import { db } from '../firebase/config';
  import { startOfDay, endOfDay, addDays, subDays, format } from 'date-fns';
  
  // Get room utilization data
  export const getRoomUtilizationData = async (startDate, endDate) => {
    try {
      // Convert dates to timestamps for Firestore queries
      const startTimestamp = Timestamp.fromDate(new Date(startDate));
      const endTimestamp = Timestamp.fromDate(new Date(endDate));
      
      // Get all reservations within the date range
      const reservationsQuery = query(
        collection(db, 'reservations'),
        where('startTime', '>=', startTimestamp),
        where('startTime', '<=', endTimestamp),
        where('status', '!=', 'cancelled')
      );
      
      const reservationsSnapshot = await getDocs(reservationsQuery);
      const reservations = reservationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Get all rooms
      const roomsSnapshot = await getDocs(collection(db, 'rooms'));
      const rooms = roomsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Calculate room utilization
      const roomUtilization = {};
      
      for (const room of rooms) {
        roomUtilization[room.id] = {
          id: room.id,
          name: room.name,
          type: room.type,
          building: room.building,
          location: room.location,
          capacity: room.capacity,
          bookingCount: 0,
          totalHoursBooked: 0,
          utilizationPercentage: 0
        };
      }
      
      // Calculate the total available hours in the date range
      // Assuming rooms are available 12 hours per day (8am - 8pm)
      const dayDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      const totalAvailableHours = dayDiff * 12;
      
      // Process reservations
      for (const reservation of reservations) {
        if (!roomUtilization[reservation.roomId]) continue;
        
        // Increment booking count
        roomUtilization[reservation.roomId].bookingCount += 1;
        
        // Calculate hours booked
        const startTime = reservation.startTime.toDate();
        const endTime = reservation.endTime.toDate();
        const durationHours = (endTime - startTime) / (1000 * 60 * 60);
        
        roomUtilization[reservation.roomId].totalHoursBooked += durationHours;
      }
      
      // Calculate utilization percentage
      for (const roomId in roomUtilization) {
        const room = roomUtilization[roomId];
        room.utilizationPercentage = (room.totalHoursBooked / totalAvailableHours) * 100;
      }
      
      return Object.values(roomUtilization);
    } catch (error) {
      console.error("Error getting room utilization data:", error);
      throw error;
    }
  };
  
  // Get building utilization data
  export const getBuildingUtilizationData = async (startDate, endDate) => {
    try {
      // Get room utilization data
      const roomData = await getRoomUtilizationData(startDate, endDate);
      
      // Group by building
      const buildingUtilization = {};
      
      for (const room of roomData) {
        const building = room.building || 'Unknown';
        
        if (!buildingUtilization[building]) {
          buildingUtilization[building] = {
            name: building,
            bookingCount: 0,
            totalHoursBooked: 0,
            roomCount: 0,
            averageUtilization: 0
          };
        }
        
        buildingUtilization[building].bookingCount += room.bookingCount;
        buildingUtilization[building].totalHoursBooked += room.totalHoursBooked;
        buildingUtilization[building].roomCount += 1;
        buildingUtilization[building].averageUtilization += room.utilizationPercentage;
      }
      
      // Calculate average utilization
      for (const building in buildingUtilization) {
        if (buildingUtilization[building].roomCount > 0) {
          buildingUtilization[building].averageUtilization /= buildingUtilization[building].roomCount;
        }
      }
      
      return Object.values(buildingUtilization);
    } catch (error) {
      console.error("Error getting building utilization data:", error);
      throw error;
    }
  };
  
  // Get time distribution data (bookings by hour of day)
  export const getHourlyDistributionData = async (startDate, endDate) => {
    try {
      // Convert dates to timestamps for Firestore queries
      const startTimestamp = Timestamp.fromDate(new Date(startDate));
      const endTimestamp = Timestamp.fromDate(new Date(endDate));
      
      // Get all reservations within the date range
      const reservationsQuery = query(
        collection(db, 'reservations'),
        where('startTime', '>=', startTimestamp),
        where('startTime', '<=', endTimestamp),
        where('status', '!=', 'cancelled')
      );
      
      const reservationsSnapshot = await getDocs(reservationsQuery);
      const reservations = reservationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Initialize hourly data (0-23 hours)
      const hourlyData = Array(24).fill(0).map((_, hour) => ({
        hour: `${hour}:00`,
        count: 0
      }));
      
      // Process reservations
      for (const reservation of reservations) {
        const startTime = reservation.startTime.toDate();
        const hour = startTime.getHours();
        
        hourlyData[hour].count += 1;
      }
      
      return hourlyData;
    } catch (error) {
      console.error("Error getting hourly distribution data:", error);
      throw error;
    }
  };
  
  // Get daily distribution data (bookings by day of week)
  export const getDailyDistributionData = async (startDate, endDate) => {
    try {
      // Convert dates to timestamps for Firestore queries
      const startTimestamp = Timestamp.fromDate(new Date(startDate));
      const endTimestamp = Timestamp.fromDate(new Date(endDate));
      
      // Get all reservations within the date range
      const reservationsQuery = query(
        collection(db, 'reservations'),
        where('startTime', '>=', startTimestamp),
        where('startTime', '<=', endTimestamp),
        where('status', '!=', 'cancelled')
      );
      
      const reservationsSnapshot = await getDocs(reservationsQuery);
      const reservations = reservationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Initialize daily data (0-6, Sunday-Saturday)
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dailyData = dayNames.map((day, index) => ({
        day,
        dayIndex: index,
        count: 0
      }));
      
      // Process reservations
      for (const reservation of reservations) {
        const startTime = reservation.startTime.toDate();
        const day = startTime.getDay();
        
        dailyData[day].count += 1;
      }
      
      return dailyData;
    } catch (error) {
      console.error("Error getting daily distribution data:", error);
      throw error;
    }
  };
  
  // Get user booking data
  export const getUserBookingData = async (startDate, endDate, limit = 10) => {
    try {
      // Convert dates to timestamps for Firestore queries
      const startTimestamp = Timestamp.fromDate(new Date(startDate));
      const endTimestamp = Timestamp.fromDate(new Date(endDate));
      
      // Get all reservations within the date range
      const reservationsQuery = query(
        collection(db, 'reservations'),
        where('startTime', '>=', startTimestamp),
        where('startTime', '<=', endTimestamp),
        where('status', '!=', 'cancelled')
      );
      
      const reservationsSnapshot = await getDocs(reservationsQuery);
      const reservations = reservationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Group by user
      const userBookings = {};
      
      for (const reservation of reservations) {
        const userId = reservation.userId;
        
        if (!userBookings[userId]) {
          userBookings[userId] = {
            id: userId,
            email: reservation.userEmail || userId,
            bookingCount: 0,
            totalHoursBooked: 0,
            roomTypes: new Set(),
            buildings: new Set()
          };
        }
        
        // Increment booking count
        userBookings[userId].bookingCount += 1;
        
        // Calculate hours booked
        const startTime = reservation.startTime.toDate();
        const endTime = reservation.endTime.toDate();
        const durationHours = (endTime - startTime) / (1000 * 60 * 60);
        
        userBookings[userId].totalHoursBooked += durationHours;
        
        // Get room details if available
        if (reservation.room) {
          userBookings[userId].roomTypes.add(reservation.room.type);
          userBookings[userId].buildings.add(reservation.room.building);
        }
      }
      
      // Convert sets to arrays
      for (const userId in userBookings) {
        userBookings[userId].roomTypes = Array.from(userBookings[userId].roomTypes);
        userBookings[userId].buildings = Array.from(userBookings[userId].buildings);
      }
      
      // Sort by booking count and limit
      const sortedUsers = Object.values(userBookings)
        .sort((a, b) => b.bookingCount - a.bookingCount)
        .slice(0, limit);
      
      return sortedUsers;
    } catch (error) {
      console.error("Error getting user booking data:", error);
      throw error;
    }
  };
  
  // Get reservation trend data (bookings over time)
  export const getReservationTrendData = async (startDate, endDate) => {
    try {
      // Convert dates to timestamps for Firestore queries
      const startTimestamp = Timestamp.fromDate(new Date(startDate));
      const endTimestamp = Timestamp.fromDate(new Date(endDate));
      
      // Get all reservations within the date range
      const reservationsQuery = query(
        collection(db, 'reservations'),
        where('startTime', '>=', startTimestamp),
        where('startTime', '<=', endTimestamp),
        orderBy('startTime')
      );
      
      const reservationsSnapshot = await getDocs(reservationsQuery);
      const reservations = reservationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Calculate day difference
      const dayDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      
      // Group by date
      const dailyData = {};
      
      // Initialize all days in the range
      for (let i = 0; i < dayDiff; i++) {
        const currentDate = addDays(startDate, i);
        const dateKey = format(currentDate, 'yyyy-MM-dd');
        
        dailyData[dateKey] = {
          date: dateKey,
          formattedDate: format(currentDate, 'MMM d'),
          total: 0,
          confirmed: 0,
          cancelled: 0
        };
      }
      
      // Process reservations
      for (const reservation of reservations) {
        const reservationDate = reservation.startTime.toDate();
        const dateKey = format(reservationDate, 'yyyy-MM-dd');
        
        if (!dailyData[dateKey]) continue;
        
        dailyData[dateKey].total += 1;
        
        if (reservation.status === 'cancelled') {
          dailyData[dateKey].cancelled += 1;
        } else {
          dailyData[dateKey].confirmed += 1;
        }
      }
      
      // Convert to array sorted by date
      return Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error("Error getting reservation trend data:", error);
      throw error;
    }
  };
  
  // Get peak usage times
  export const getPeakUsageTimes = async (startDate, endDate) => {
    try {
      // Get hourly distribution
      const hourlyData = await getHourlyDistributionData(startDate, endDate);
      
      // Get daily distribution
      const dailyData = await getDailyDistributionData(startDate, endDate);
      
      // Find peak hour
      const peakHour = [...hourlyData].sort((a, b) => b.count - a.count)[0];
      
      // Find peak day
      const peakDay = [...dailyData].sort((a, b) => b.count - a.count)[0];
      
      // Combine hourly and daily data to find peak time slots
      const peakTimeSlots = [];
      
      // Calculate the top 3 busiest hour-day combinations
      // This would require more complex querying to be accurate
      // For simplicity, we'll return the top hours and days separately
      
      return {
        peakHour,
        peakDay,
        peakTimeSlots: hourlyData
          .filter(h => h.count > 0)
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
      };
    } catch (error) {
      console.error("Error getting peak usage times:", error);
      throw error;
    }
  };
  
  // Get room capacity utilization
  export const getRoomCapacityUtilization = async (startDate, endDate) => {
    try {
      // Convert dates to timestamps for Firestore queries
      const startTimestamp = Timestamp.fromDate(new Date(startDate));
      const endTimestamp = Timestamp.fromDate(new Date(endDate));
      
      // Get all reservations within the date range
      const reservationsQuery = query(
        collection(db, 'reservations'),
        where('startTime', '>=', startTimestamp),
        where('startTime', '<=', endTimestamp),
        where('status', '!=', 'cancelled')
      );
      
      const reservationsSnapshot = await getDocs(reservationsQuery);
      const reservations = reservationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Get all rooms
      const roomsSnapshot = await getDocs(collection(db, 'rooms'));
      const rooms = {};
      
      // Create lookup for rooms
      roomsSnapshot.docs.forEach(doc => {
        const room = {
          id: doc.id,
          ...doc.data()
        };
        rooms[room.id] = room;
      });
      
      // Calculate capacity utilization
      const capacityData = [];
      
      for (const reservation of reservations) {
        const room = rooms[reservation.roomId];
        if (!room) continue;
        
        const attendees = reservation.attendees || 1;
        const capacity = room.capacity || 1;
        
        capacityData.push({
          roomId: room.id,
          roomName: room.name,
          capacity,
          attendees,
          utilizationPercentage: (attendees / capacity) * 100
        });
      }
      
      // Calculate average utilization by room type
      const roomTypeUtilization = {};
      
      for (const data of capacityData) {
        const room = rooms[data.roomId];
        if (!room) continue;
        
        const roomType = room.type || 'Unknown';
        
        if (!roomTypeUtilization[roomType]) {
          roomTypeUtilization[roomType] = {
            type: roomType,
            reservationCount: 0,
            totalUtilization: 0,
            averageUtilization: 0
          };
        }
        
        roomTypeUtilization[roomType].reservationCount += 1;
        roomTypeUtilization[roomType].totalUtilization += data.utilizationPercentage;
      }
      
      // Calculate averages
      for (const type in roomTypeUtilization) {
        if (roomTypeUtilization[type].reservationCount > 0) {
          roomTypeUtilization[type].averageUtilization = 
            roomTypeUtilization[type].totalUtilization / roomTypeUtilization[type].reservationCount;
        }
      }
      
      return {
        capacityData,
        roomTypeUtilization: Object.values(roomTypeUtilization)
      };
    } catch (error) {
      console.error("Error getting room capacity utilization:", error);
      throw error;
    }
  };
  
  // Get dashboard summary data
  export const getDashboardSummary = async () => {
    try {
      // Get today's date
      const today = new Date();
      const startOfToday = startOfDay(today);
      const endOfToday = endOfDay(today);
      
      // Get last 30 days
      const thirtyDaysAgo = subDays(startOfToday, 30);
      
      // Get reservations for today
      const todayReservationsQuery = query(
        collection(db, 'reservations'),
        where('startTime', '>=', Timestamp.fromDate(startOfToday)),
        where('startTime', '<=', Timestamp.fromDate(endOfToday))
      );
      
      const todayReservationsSnapshot = await getDocs(todayReservationsQuery);
      const todayReservations = todayReservationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Get reservations for last 30 days
      const monthReservationsQuery = query(
        collection(db, 'reservations'),
        where('startTime', '>=', Timestamp.fromDate(thirtyDaysAgo)),
        where('startTime', '<=', Timestamp.fromDate(endOfToday))
      );
      
      const monthReservationsSnapshot = await getDocs(monthReservationsQuery);
      const monthReservations = monthReservationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Get room count
      const roomsSnapshot = await getDocs(collection(db, 'rooms'));
      const roomCount = roomsSnapshot.size;
      
      // Calculate active vs. cancelled reservations
      const todayActive = todayReservations.filter(r => r.status !== 'cancelled').length;
      const todayCancelled = todayReservations.filter(r => r.status === 'cancelled').length;
      
      const monthActive = monthReservations.filter(r => r.status !== 'cancelled').length;
      const monthCancelled = monthReservations.filter(r => r.status === 'cancelled').length;
      
      // Get unique user count for the month
      const uniqueUsers = new Set();
      monthReservations.forEach(r => uniqueUsers.add(r.userId));
      
      // Calculate utilization
      let totalHoursBooked = 0;
      let totalAvailableHours = 0;
      
      // Process active reservations
      monthReservations.filter(r => r.status !== 'cancelled').forEach(r => {
        const startTime = r.startTime.toDate();
        const endTime = r.endTime.toDate();
        const hours = (endTime - startTime) / (1000 * 60 * 60);
        totalHoursBooked += hours;
      });
      
      // Calculate available hours (12 hours per day per room)
      totalAvailableHours = roomCount * 30 * 12;
      
      // Average utilization
      const averageUtilization = totalAvailableHours > 0 
        ? (totalHoursBooked / totalAvailableHours) * 100
        : 0;
      
      return {
        today: {
          total: todayReservations.length,
          active: todayActive,
          cancelled: todayCancelled,
          cancellationRate: todayReservations.length > 0 ? (todayCancelled / todayReservations.length) * 100 : 0
        },
        month: {
          total: monthReservations.length,
          active: monthActive,
          cancelled: monthCancelled,
          uniqueUsers: uniqueUsers.size,
          cancellationRate: monthReservations.length > 0 ? (monthCancelled / monthReservations.length) * 100 : 0,
          averageUtilization,
          totalHoursBooked
        },
        roomCount
      };
    } catch (error) {
      console.error("Error getting dashboard summary:", error);
      throw error;
    }
  };
  
  /**
   * Utility function to get reservations for a date range
   */
  export const getReservationsForDate = async (startDate, endDate) => {
    try {
      console.log(`Getting reservations from ${startDate} to ${endDate}`);
      const startTimestamp = Timestamp.fromDate(new Date(startDate));
      const endTimestamp = Timestamp.fromDate(new Date(endDate));
      
      // Query for any reservations that overlap with this date range
      const q = query(
        collection(db, 'reservations'),
        where("startTime", "<=", endTimestamp),
        where("endTime", ">=", startTimestamp),
        orderBy("startTime")
      );
      
      const snapshot = await getDocs(q);
      const reservations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`Found ${reservations.length} reservations for the date range`);
      return reservations;
    } catch (error) {
      console.error("Error getting reservations for date:", error);
      throw error;
    }
  };
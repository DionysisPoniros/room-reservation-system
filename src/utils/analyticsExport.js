// src/utils/analyticsExport.js
import { format } from 'date-fns';

/**
 * Generates a CSV string from data
 * 
 * @param {Array} data - Array of objects to convert to CSV
 * @param {Array} headers - Array of header objects with 'label' and 'key' properties
 * @returns {String} CSV formatted string
 */
export const generateCsv = (data, headers) => {
  if (!data || !data.length || !headers || !headers.length) {
    return '';
  }

  // Create header row
  const headerRow = headers.map(header => `"${header.label}"`).join(',');
  
  // Create data rows
  const rows = data.map(item => {
    return headers.map(header => {
      const value = item[header.key] ?? '';
      // Ensure strings with commas are properly quoted
      return typeof value === 'string' && value.includes(',') 
        ? `"${value}"` 
        : `"${value}"`;
    }).join(',');
  });
  
  // Combine header and data rows
  return [headerRow, ...rows].join('\n');
};

/**
 * Downloads data as a CSV file
 * 
 * @param {String} csvContent - CSV content to download
 * @param {String} fileName - Name for the downloaded file
 */
export const downloadCsv = (csvContent, fileName) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Formats room utilization data for export
 * 
 * @param {Array} roomData - Array of room utilization data
 * @param {Date} startDate - Start date of the analytics period
 * @param {Date} endDate - End date of the analytics period
 * @returns {String} CSV formatted string
 */
export const exportRoomUtilizationData = (roomData, startDate, endDate) => {
  const formattedStartDate = format(startDate, 'yyyy-MM-dd');
  const formattedEndDate = format(endDate, 'yyyy-MM-dd');
  const fileName = `room-utilization-${formattedStartDate}-to-${formattedEndDate}.csv`;
  
  const headers = [
    { label: 'Room Name', key: 'name' },
    { label: 'Room Type', key: 'type' },
    { label: 'Building', key: 'building' },
    { label: 'Location', key: 'location' },
    { label: 'Capacity', key: 'capacity' },
    { label: 'Booking Count', key: 'bookingCount' },
    { label: 'Total Hours Booked', key: 'totalHoursBooked' },
    { label: 'Utilization Percentage', key: 'utilizationPercentage' },
  ];
  
  const csvContent = generateCsv(roomData, headers);
  downloadCsv(csvContent, fileName);
  
  return fileName;
};

/**
 * Formats reservation data for export
 * 
 * @param {Array} reservations - Array of reservation data
 * @param {Date} startDate - Start date of the analytics period
 * @param {Date} endDate - End date of the analytics period
 * @returns {String} CSV formatted string
 */
export const exportReservationData = (reservations, startDate, endDate) => {
  const formattedStartDate = format(startDate, 'yyyy-MM-dd');
  const formattedEndDate = format(endDate, 'yyyy-MM-dd');
  const fileName = `reservations-${formattedStartDate}-to-${formattedEndDate}.csv`;
  
  // Transform reservation data for export
  const formattedData = reservations.map(res => {
    // Format timestamps
    const startTime = res.startTime && res.startTime.seconds 
      ? format(new Date(res.startTime.seconds * 1000), 'yyyy-MM-dd HH:mm')
      : '';
      
    const endTime = res.endTime && res.endTime.seconds
      ? format(new Date(res.endTime.seconds * 1000), 'yyyy-MM-dd HH:mm')
      : '';
      
    const createdAt = res.createdAt && res.createdAt.seconds
      ? format(new Date(res.createdAt.seconds * 1000), 'yyyy-MM-dd HH:mm')
      : '';
    
    // Calculate duration in hours
    const durationHours = res.startTime && res.endTime 
      ? ((res.endTime.seconds - res.startTime.seconds) / 3600).toFixed(2)
      : res.durationHours || '';
    
    // Get room details if available
    const roomName = res.room ? res.room.name : '';
    const roomLocation = res.room ? res.room.location : '';
    
    return {
      id: res.id || '',
      roomId: res.roomId || '',
      roomName: roomName,
      roomLocation: roomLocation,
      userEmail: res.userEmail || '',
      userId: res.userId || '',
      startTime,
      endTime,
      durationHours,
      purpose: res.purpose || '',
      attendees: res.attendees || '',
      status: res.status || '',
      createdAt
    };
  });
  
  const headers = [
    { label: 'Reservation ID', key: 'id' },
    { label: 'Room ID', key: 'roomId' },
    { label: 'Room Name', key: 'roomName' },
    { label: 'Room Location', key: 'roomLocation' },
    { label: 'User Email', key: 'userEmail' },
    { label: 'User ID', key: 'userId' },
    { label: 'Start Time', key: 'startTime' },
    { label: 'End Time', key: 'endTime' },
    { label: 'Duration (hours)', key: 'durationHours' },
    { label: 'Purpose', key: 'purpose' },
    { label: 'Attendees', key: 'attendees' },
    { label: 'Status', key: 'status' },
    { label: 'Created At', key: 'createdAt' }
  ];
  
  const csvContent = generateCsv(formattedData, headers);
  downloadCsv(csvContent, fileName);
  
  return fileName;
};

/**
 * Generate PDF report of analytics data
 * Note: This is a placeholder. In a real implementation, you would use a PDF generation library
 * like jsPDF or react-pdf.
 * 
 * @param {Object} analyticsData - Object containing all analytics data
 * @param {Date} startDate - Start date of the analytics period
 * @param {Date} endDate - End date of the analytics period
 */
export const generatePdfReport = (analyticsData, startDate, endDate) => {
  console.log('PDF Report generation would happen here with data:', analyticsData);
  alert('PDF Report generation is not implemented in this demo. In a real application, this would generate and download a PDF report of the analytics data.');
  
  // A real implementation would:
  // 1. Create a PDF document using jsPDF or similar
  // 2. Add a title, date range, and other headers
  // 3. Add tables and charts from the analytics data
  // 4. Save and download the PDF

  return 'analytics-report.pdf';
};
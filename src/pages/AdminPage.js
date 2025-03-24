// src/pages/AdminPage.js
import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper, Divider } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import AdminRoomLoader from '../components/admin/AdminRoomLoader';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

function AdminPage() {
  const { currentUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
 
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
        // Add this right after your setIsAdmin line for testing
        
        setLoading(false);
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
        setLoading(false);
      }
    };
    
    checkAdmin();
  }, [currentUser]);
 
  if (loading) return <div>Loading...</div>;
 
  if (!isAdmin) {
    return <Navigate to="/" />;
  }
 
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>
       
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            System Management
          </Typography>
          <Typography paragraph>
            Welcome to the admin dashboard. Here you can manage system settings and data.
          </Typography>
        </Paper>
       
        {/* Room Data Loader */}
        <AdminRoomLoader />
       
        {/* You can add more admin tools here */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Coming Soon
          </Typography>
          <Typography paragraph>
            More admin tools will be added in future updates:
          </Typography>
          <ul>
            <li>User management</li>
            <li>Reservation reports</li>
            <li>Room usage analytics</li>
            <li>System settings</li>
          </ul>
        </Paper>
      </Box>
    </Container>
  );
}

export default AdminPage;
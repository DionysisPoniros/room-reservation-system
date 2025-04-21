// Modified App.js
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import theme from './theme';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import Rooms from './pages/Rooms';
import RoomDetails from './pages/RoomDetails';
import BookingForm from './components/booking/BookingForm';
import MyReservations from './pages/MyReservations';
import Login from './components/auth/Login';
import AdminPage from './pages/AdminPage';
import PrivateRoute from './components/auth/PrivateRoute';
import { AuthProvider } from './contexts/AuthContext';
import EnhancedSVGInspector from './utils/EnhancedSVGInspector';

function App() {
  return (
    <AuthProvider>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <BrowserRouter>
            <Navbar />
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              
              {/* You can keep the home page public if you want */}
              <Route path="/" element={<Home />} />
              
              {/* Protected routes */}
              <Route path="/rooms" element={
                <PrivateRoute>
                  <Rooms />
                </PrivateRoute>
              } />
              <Route path="/rooms/:id" element={
                <PrivateRoute>
                  <RoomDetails />
                </PrivateRoute>
              } />
              <Route path="/rooms/:id/book" element={
                <PrivateRoute>
                  <BookingForm />
                </PrivateRoute>
              } />
              <Route path="/my-reservations" element={
                <PrivateRoute>
                  <MyReservations />
                </PrivateRoute>
              } />
              <Route path="/admin" element={
                <PrivateRoute>
                  <AdminPage />
                </PrivateRoute>
              } />
              <Route path="/admin/svg-inspector" element={
                <PrivateRoute>
                  <EnhancedSVGInspector />
                </PrivateRoute>
              } />
            </Routes>
          </BrowserRouter>
        </ThemeProvider>
      </LocalizationProvider>
    </AuthProvider>
  );
}

export default App;
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import Rooms from './pages/Rooms';
import RoomDetails from './pages/RoomDetails';
import BookingForm from './components/booking/BookingForm';
import MyReservations from './pages/MyReservations';
import Login from './components/auth/Login';
import PrivateRoute from './components/auth/PrivateRoute';
import { AuthProvider } from './contexts/AuthContext';

// Create a theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <AuthProvider>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <BrowserRouter>
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/rooms" element={<Rooms />} />
              <Route path="/rooms/:id" element={<RoomDetails />} />
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
              <Route path="/login" element={<Login />} />
            </Routes>
          </BrowserRouter>
        </ThemeProvider>
      </LocalizationProvider>
    </AuthProvider>
  );
}

export default App;
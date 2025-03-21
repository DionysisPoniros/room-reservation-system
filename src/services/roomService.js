import { collection, getDocs, getDoc, doc, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

// Collection references
const roomsCollection = collection(db, 'rooms');
const reservationsCollection = collection(db, 'reservations');

// Get all rooms
export const getRooms = async () => {
  const snapshot = await getDocs(roomsCollection);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// Get a specific room
export const getRoom = async (id) => {
  const roomDoc = doc(db, 'rooms', id);
  const roomSnapshot = await getDoc(roomDoc);
  
  if (roomSnapshot.exists()) {
    return {
      id: roomSnapshot.id,
      ...roomSnapshot.data()
    };
  } else {
    return null;
  }
};

// Create a reservation
export const createReservation = async (reservationData) => {
  return await addDoc(reservationsCollection, {
    ...reservationData,
    createdAt: new Date()
  });
};

// Get reservations for a room
export const getRoomReservations = async (roomId) => {
  const q = query(reservationsCollection, where("roomId", "==", roomId));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// Check room availability
export const checkRoomAvailability = async (roomId, startTime, endTime) => {
  const reservations = await getRoomReservations(roomId);
  
  // Check if there are any overlapping reservations
  const overlapping = reservations.filter(reservation => {
    const resStart = reservation.startTime.toDate();
    const resEnd = reservation.endTime.toDate();
    
    return (
      (startTime >= resStart && startTime < resEnd) || // Start time is within an existing reservation
      (endTime > resStart && endTime <= resEnd) || // End time is within an existing reservation
      (startTime <= resStart && endTime >= resEnd) // New reservation completely encompasses an existing one
    );
  });
  
  return overlapping.length === 0;
};
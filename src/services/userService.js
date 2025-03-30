
import { 
    collection, addDoc, getDocs, getDoc, updateDoc, setDoc, doc,
    query, where, orderBy, Timestamp 
  } from 'firebase/firestore';
  import { db } from '../firebase/config';  // Add this import line!
  
  // Collection references
  const hourRequestsCollection = collection(db, 'hourRequests');
  const userAllowancesCollection = collection(db, 'userAllowances');
  
  
  
  // Request additional hours
  export const requestAdditionalHours = async (requestData) => {
    try {
      const data = {
        ...requestData,
        createdAt: Timestamp.now()
      };
      
      const docRef = await addDoc(hourRequestsCollection, data);
      return docRef;
    } catch (error) {
      console.error("Error creating hour request:", error);
      throw error;
    }
  };
  
  export const createOrUpdateUserDocument = async (user) => {
    try {
      if (!user || !user.uid || !user.email) {
        throw new Error("Invalid user data provided");
      }
      
      // Reference to user document
      const userRef = doc(db, 'users', user.uid);
      
      // Check if document exists
      const userSnap = await getDoc(userRef);
      
      // User data to store
      const userData = {
        id: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        lastLogin: Timestamp.now()
      };
      
      if (!userSnap.exists()) {
        // Create new user document
        await setDoc(userRef, {
          ...userData,
          createdAt: Timestamp.now()
        });
        console.log(`Created new user document for ${user.email}`);
      } else {
        // Update existing document
        await updateDoc(userRef, {
          ...userData
        });
        console.log(`Updated user document for ${user.email}`);
      }
      
      return userData;
    } catch (error) {
      console.error("Error creating/updating user document:", error);
      throw error;
    }
  };
  // Get user's hour requests
  export const getUserHourRequests = async (userId) => {
    try {
      const q = query(
        hourRequestsCollection,
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("Error getting user hour requests:", error);
      throw error;
    }
  };
  
  // Admin functions
  export const getAllHourRequests = async () => {
    try {
      const q = query(
        hourRequestsCollection,
        orderBy("createdAt", "desc")
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("Error getting all hour requests:", error);
      throw error;
    }
  };
  
  export const updateHourRequestStatus = async (requestId, status, adminNotes = '') => {
    try {
      const requestRef = doc(db, 'hourRequests', requestId);
      
      await updateDoc(requestRef, {
        status,
        adminNotes,
        updatedAt: Timestamp.now()
      });
      
      return { success: true };
    } catch (error) {
      console.error("Error updating hour request:", error);
      throw error;
    }
  };
  
  // User allowance functions
  export const getUserHourAllowance = async (userId) => {
    try {
      const userAllowanceRef = doc(db, 'userAllowances', userId);
      const userAllowanceSnap = await getDoc(userAllowanceRef);
      
      if (userAllowanceSnap.exists()) {
        return userAllowanceSnap.data();
      } else {
        // Return default allowance
        return { userId, dailyHours: 5, isCustom: false };
      }
    } catch (error) {
      console.error("Error getting user hour allowance:", error);
      throw error;
    }
  };
  
  export const setUserHourAllowance = async (userId, dailyHours) => {
    try {
      const userAllowanceRef = doc(db, 'userAllowances', userId);
      
      // Use setDoc instead of updateDoc to handle new documents
      await setDoc(userAllowanceRef, {
        userId,
        dailyHours,
        isCustom: true,
        updatedAt: Timestamp.now()
      }, { merge: true });
      
      return { success: true };
    } catch (error) {
      console.error("Error setting user hour allowance:", error);
      throw error;
    }
  };
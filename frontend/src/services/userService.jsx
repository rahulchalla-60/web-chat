import { collection, query, where, getDocs, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase.js';

export const fetchUser = async (searchTerm) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('keywords', 'array-contains', searchTerm.toLowerCase()));
    const querySnapshot = await getDocs(q);
    
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push(doc.data());
    });
    
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

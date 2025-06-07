import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase.js';

export const registerUser = async (name, email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Generate keywords for search
    const keywords = generateKeywords(name, email);
    
    // Store user details in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      name,
      email,
      keywords
    });
    
    return user;
  } catch (error) {
    throw error;
  }
};

export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};

const generateKeywords = (name, email) => {
  const keywords = [];
  const nameWords = name.toLowerCase().split(' ');
  const emailPrefix = email.toLowerCase().split('@')[0];
  
  // Add full name and email
  keywords.push(name.toLowerCase());
  keywords.push(emailPrefix);
  
  // Add partial matches for name
  nameWords.forEach(word => {
    for (let i = 1; i <= word.length; i++) {
      keywords.push(word.substring(0, i));
    }
  });
  
  // Add partial matches for email
  for (let i = 1; i <= emailPrefix.length; i++) {
    keywords.push(emailPrefix.substring(0, i));
  }
  
  return [...new Set(keywords)]; // Remove duplicates
};
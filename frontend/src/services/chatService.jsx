import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDoc,
  addDoc
} from 'firebase/firestore';
import { db } from '../firebase.js';

/**
 * Fetch all chats for the current user in real-time.
 */
export const fetchChats = (userId, callback) => {
  try {
    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('users', 'array-contains', userId));

    return onSnapshot(q, (querySnapshot) => {
      const chats = [];
      querySnapshot.forEach((doc) => {
        chats.push({ id: doc.id, ...doc.data() });
      });
      callback(chats);
    });
  } catch (error) {
    console.error('Error fetching chats:', error);
    throw error;
  }
};

/**
 * Creates or retrieves a 1-to-1 chat between currentUserId and otherUserId.
 */
export const createOrGetChat = async (currentUserId, otherUserId) => {
  try {
    const chatId = [currentUserId, otherUserId].sort().join('_');
    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);

    if (chatSnap.exists()) {
      return chatId;
    }

    // Create new chat
    await setDoc(chatRef, {
      users: [currentUserId, otherUserId],
      latestMessage: '',
      timestamp: serverTimestamp()
    });

    return chatId;
  } catch (error) {
    console.error('Error creating or getting chat:', error);
    throw error;
  }
};

/**
 * Fetch all messages in a chat (real-time updates).
 */
export const fetchMessages = (chatId, callback) => {
  try {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    return onSnapshot(q, (querySnapshot) => {
      const messages = [];
      querySnapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() });
      });
      callback(messages);
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};

/**
 * Send a message in a chat.
 */
export const sendMessage = async (chatId, senderId, content) => {
  try {
    // Add new message to subcollection
    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      sender: senderId,
      content,
      timestamp: serverTimestamp()
    });

    // Update chat preview (latest message)
    const chatRef = doc(db, 'chats', chatId);
    await setDoc(chatRef, {
      latestMessage: content,
      timestamp: serverTimestamp()
    }, { merge: true });

  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

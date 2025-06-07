import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchChats, createOrGetChat } from '../services/chatService';
import { fetchUser } from '../services/userService';
import { logoutUser } from '../services/authService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import '../styles/Sidebar.css';

const Sidebar = ({ onChatSelect, selectedChat }) => {
  const { currentUser } = useAuth();
  const [chats, setChats] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [chatUsers, setChatUsers] = useState({});

  useEffect(() => {
    if (currentUser) {
      // Fetch current user data
      const fetchCurrentUserData = async () => {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setCurrentUserData(userDoc.data());
        }
      };
      fetchCurrentUserData();

      // Subscribe to chats
      const unsubscribe = fetchChats(currentUser.uid, async (chatsData) => {
        setChats(chatsData);
        
        // Fetch user data for each chat
        const userMap = {};
        for (const chat of chatsData) {
          const otherUserId = chat.users.find(uid => uid !== currentUser.uid);
          if (otherUserId && !userMap[otherUserId]) {
            try {
              const userDoc = await getDoc(doc(db, 'users', otherUserId));
              if (userDoc.exists()) {
                userMap[otherUserId] = userDoc.data();
              }
            } catch (error) {
              console.error('Error fetching user data:', error);
            }
          }
        }
        setChatUsers(prev => ({ ...prev, ...userMap }));
      });

      return () => unsubscribe();
    }
  }, [currentUser]);

  const handleSearch = async (term) => {
    setSearchTerm(term);
    if (term.trim()) {
      setIsSearching(true);
      try {
        const users = await fetchUser(term);
        // Filter out current user
        const filteredUsers = users.filter(user => user.uid !== currentUser.uid);
        setSearchResults(filteredUsers);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  const handleUserSelect = async (user) => {
    try {
      const chatId = await createOrGetChat(currentUser.uid, user.uid);
      onChatSelect({ id: chatId, otherUser: user });
      setSearchTerm('');
      setSearchResults([]);
      setIsSearching(false);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const handleChatSelect = async (chat) => {
    // Get other user data
    const otherUserId = chat.users.find(uid => uid !== currentUser.uid);
    const otherUser = chatUsers[otherUserId] || null;
    
    onChatSelect({ id: chat.id, otherUser });
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return date.toLocaleDateString();
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="user-info">
          <div className="user-avatar">
            {currentUserData?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="user-details">
            <h3>{currentUserData?.name || 'User'}</h3>
            <p>{currentUserData?.email}</p>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      <div className="search-section">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="chats-list">
        {isSearching && searchResults.length > 0 && (
          <div className="search-results">
            <h4>Search Results</h4>
            {searchResults.map((user) => (
              <div
                key={user.uid}
                className="search-result-item"
                onClick={() => handleUserSelect(user)}
              >
                <div className="user-avatar">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="user-info">
                  <p className="user-name">{user.name}</p>
                  <p className="user-email">{user.email}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isSearching && (
          <div className="existing-chats">
            <h4>Chats</h4>
            {chats.length === 0 ? (
              <div className="no-chats">
                <p>No chats yet. Search for users to start chatting!</p>
              </div>
            ) : (
              chats.map((chat) => {
                const otherUserId = chat.users.find(uid => uid !== currentUser.uid);
                const otherUser = chatUsers[otherUserId];
                
                return (
                  <div
                    key={chat.id}
                    className={`chat-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
                    onClick={() => handleChatSelect(chat)}
                  >
                    <div className="chat-avatar">
                      {otherUser?.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="chat-info">
                      <div className="chat-header">
                        <p className="chat-name">{otherUser?.name || 'Unknown User'}</p>
                        <span className="chat-time">{formatTimestamp(chat.timestamp)}</span>
                      </div>
                      <p className="latest-message">
                        {chat.latestMessage || 'No messages yet'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;

import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { formatTime } from '../../utils/api';
import './Sidebar.css';

const Sidebar = () => {
  const { user } = useAuth();
  const { 
    chats, 
    selectedChat, 
    setSelectedChat, 
    users, 
    accessChat, 
    fetchMessages,
    loading 
  } = useChat();
  const [searchTerm, setSearchTerm] = useState('');
  const [showUsers, setShowUsers] = useState(false);

  const filteredChats = chats.filter(chat => {
    const chatName = chat.isGroupChat 
      ? chat.chatName 
      : chat.users.find(u => u._id !== user._id)?.name || '';
    return chatName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
    u._id !== user._id
  );

  const handleChatSelect = async (chat) => {
    setSelectedChat(chat);
    await fetchMessages(chat._id);
  };

  const handleUserSelect = async (selectedUser) => {
    try {
      const chat = await accessChat(selectedUser._id);
      await fetchMessages(chat._id);
      setShowUsers(false);
      setSearchTerm('');
    } catch (error) {
      console.error('Failed to access chat:', error);
    }
  };

  const getChatName = (chat) => {
    if (chat.isGroupChat) {
      return chat.chatName;
    }
    const otherUser = chat.users.find(u => u._id !== user._id);
    return otherUser?.name || 'Unknown User';
  };

  const getLastMessage = (chat) => {
    if (!chat.latestMessage) return 'No messages yet';
    return chat.latestMessage.content;
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3>Chats</h3>
        <div className="sidebar-tabs">
          <button 
            className={`tab-btn ${!showUsers ? 'active' : ''}`}
            onClick={() => setShowUsers(false)}
          >
            Chats
          </button>
          <button 
            className={`tab-btn ${showUsers ? 'active' : ''}`}
            onClick={() => setShowUsers(true)}
          >
            Users
          </button>
        </div>
      </div>

      <div className="search-container">
        <input
          type="text"
          placeholder={showUsers ? "Search users..." : "Search chats..."}
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="chat-list">
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : showUsers ? (
          filteredUsers.map(user => (
            <div 
              key={user._id} 
              className="chat-item user-item"
              onClick={() => handleUserSelect(user)}
            >
              <div className="chat-avatar">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="chat-info">
                <div className="chat-name">{user.name}</div>
                <div className="chat-message">{user.email}</div>
              </div>
            </div>
          ))
        ) : (
          filteredChats.map(chat => (
            <div 
              key={chat._id} 
              className={`chat-item ${selectedChat?._id === chat._id ? 'active' : ''}`}
              onClick={() => handleChatSelect(chat)}
            >
              <div className="chat-avatar">
                {chat.isGroupChat ? (
                  <span className="group-icon">👥</span>
                ) : (
                  getChatName(chat).charAt(0).toUpperCase()
                )}
              </div>
              <div className="chat-info">
                <div className="chat-name">{getChatName(chat)}</div>
                <div className="chat-message">{getLastMessage(chat)}</div>
              </div>
              <div className="chat-meta">
                {chat.latestMessage && (
                  <div className="chat-time">
                    {formatTime(chat.latestMessage.createdAt)}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        
        {!loading && ((showUsers && filteredUsers.length === 0) || (!showUsers && filteredChats.length === 0)) && (
          <div className="empty-state">
            <p>{showUsers ? 'No users found' : 'No chats found'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;

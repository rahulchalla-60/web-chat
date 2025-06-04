
import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { formatTime } from '../../utils/api';
import './ChatBox.css';

const ChatBox = () => {
  const { user } = useAuth();
  const { 
    selectedChat, 
    messages, 
    sendMessage, 
    deleteMessage,
    renameGroup,
    addToGroup,
    removeFromGroup,
    deleteGroup,
    users
  } = useChat();
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showChatInfo, setShowChatInfo] = useState(false);
  const [editingGroupName, setEditingGroupName] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (selectedChat && selectedChat.isGroupChat) {
      setNewGroupName(selectedChat.chatName);
    }
  }, [selectedChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    setLoading(true);
    try {
      await sendMessage(selectedChat._id, newMessage);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        await deleteMessage(messageId);
      } catch (error) {
        console.error('Failed to delete message:', error);
      }
    }
  };

  const handleRenameGroup = async () => {
    if (!newGroupName.trim()) return;
    
    try {
      await renameGroup(selectedChat._id, newGroupName);
      setEditingGroupName(false);
    } catch (error) {
      console.error('Failed to rename group:', error);
    }
  };

  const handleAddToGroup = async (userId) => {
    try {
      await addToGroup(selectedChat._id, userId);
    } catch (error) {
      console.error('Failed to add user to group:', error);
    }
  };

  const handleRemoveFromGroup = async (userId) => {
    if (window.confirm('Are you sure you want to remove this user from the group?')) {
      try {
        await removeFromGroup(selectedChat._id, userId);
      } catch (error) {
        console.error('Failed to remove user from group:', error);
      }
    }
  };

  const handleDeleteGroup = async () => {
    if (window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      try {
        await deleteGroup(selectedChat._id);
        setShowChatInfo(false);
      } catch (error) {
        console.error('Failed to delete group:', error);
      }
    }
  };

  const getChatName = () => {
    if (!selectedChat) return '';
    if (selectedChat.isGroupChat) {
      return selectedChat.chatName;
    }
    const otherUser = selectedChat.users.find(u => u._id !== user._id);
    return otherUser?.name || 'Unknown User';
  };

  const getAvailableUsers = () => {
    if (!selectedChat || !selectedChat.isGroupChat) return [];
    const groupUserIds = selectedChat.users.map(u => u._id);
    return users.filter(u => !groupUserIds.includes(u._id) && u._id !== user._id);
  };

  if (!selectedChat) {
    return (
      <div className="chatbox-empty">
        <div className="empty-content">
          <h3>Welcome to ChatApp</h3>
          <p>Select a chat from the sidebar to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chatbox">
      <div className="chatbox-header">
        <div className="chat-header-info">
          <div className="chat-header-avatar">
            {selectedChat.isGroupChat ? '👥' : getChatName().charAt(0).toUpperCase()}
          </div>
          <div>
            <h3>{getChatName()}</h3>
            {selectedChat.isGroupChat && (
              <p>{selectedChat.users.length} members</p>
            )}
          </div>
        </div>
        
        {selectedChat.isGroupChat && (
          <button 
            className="btn btn-secondary info-btn"
            onClick={() => setShowChatInfo(!showChatInfo)}
          >
            Info
          </button>
        )}
      </div>

      {showChatInfo && selectedChat.isGroupChat && (
        <div className="chat-info-panel">
          <div className="chat-info-section">
            <h4>Group Name</h4>
            {editingGroupName ? (
              <div className="edit-group-name">
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="form-control"
                />
                <button 
                  className="btn btn-primary"
                  onClick={handleRenameGroup}
                >
                  Save
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setEditingGroupName(false)}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="group-name-display">
                <span>{selectedChat.chatName}</span>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setEditingGroupName(true)}
                >
                  Edit
                </button>
              </div>
            )}
          </div>

          <div className="chat-info-section">
            <h4>Members ({selectedChat.users.length})</h4>
            <div className="members-list">
              {selectedChat.users.map(member => (
                <div key={member._id} className="member-item">
                  <div className="member-avatar">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="member-name">{member.name}</span>
                  {member._id !== user._id && (
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleRemoveFromGroup(member._id)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {getAvailableUsers().length > 0 && (
            <div className="chat-info-section">
              <h4>Add Members</h4>
              <div className="available-users">
                {getAvailableUsers().map(availableUser => (
                  <div key={availableUser._id} className="member-item">
                    <div className="member-avatar">
                      {availableUser.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="member-name">{availableUser.name}</span>
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => handleAddToGroup(availableUser._id)}
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="chat-info-section">
            <button 
              className="btn btn-danger"
              onClick={handleDeleteGroup}
            >
              Delete Group
            </button>
          </div>
        </div>
      )}

      <div className="chatbox-messages">
        {messages.map(message => (
          <div 
            key={message._id} 
            className={`message ${message.sender._id === user._id ? 'sent' : 'received'}`}
          >
            <div className="message-content">
              {message.sender._id !== user._id && selectedChat.isGroupChat && (
                <div className="message-sender">{message.sender.name}</div>
              )}
              <div className="message-text">{message.content}</div>
              <div className="message-time">
                {formatTime(message.createdAt)}
                {message.sender._id === user._id && (
                  <button 
                    className="delete-message-btn"
                    onClick={() => handleDeleteMessage(message._id)}
                    title="Delete message"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="chatbox-input">
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="message-input"
          disabled={loading}
        />
        <button 
          type="submit" 
          className="btn btn-primary send-btn"
          disabled={loading || !newMessage.trim()}
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default ChatBox;
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchMessages, sendMessage } from '../services/chatService.jsx';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase.js';
import { Trash2, X } from 'lucide-react';
import '../styles/ChatBox.css';

const ChatBox = ({ selectedChat }) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (selectedChat?.id) {
      const unsubscribe = fetchMessages(selectedChat.id, (messagesData) => {
        setMessages(messagesData);
      });

      return () => unsubscribe();
    } else {
      setMessages([]);
    }
  }, [selectedChat]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedChat?.id) return;
    
    try {
      setLoading(true);
      await sendMessage(selectedChat.id, currentUser.uid, newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await deleteDoc(doc(db, 'chats', selectedChat.id, 'messages', messageId));
      setShowDeleteModal(null);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateHeader = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const shouldShowDateHeader = (currentMessage, previousMessage) => {
    if (!currentMessage.timestamp) return false;
    if (!previousMessage) return true;
    
    const currentDate = currentMessage.timestamp.toDate ? currentMessage.timestamp.toDate() : new Date(currentMessage.timestamp);
    const previousDate = previousMessage.timestamp ? (previousMessage.timestamp.toDate ? previousMessage.timestamp.toDate() : new Date(previousMessage.timestamp)) : null;
    
    if (!previousDate) return true;
    
    return currentDate.toDateString() !== previousDate.toDateString();
  };

  if (!selectedChat) {
    return (
      <div className="chatbox">
        <div className="no-chat-selected">
          <h3>Welcome to Chat App</h3>
          <p>Select a chat to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chatbox">
      <div className="chatbox-header">
        <div className="chat-user-info">
          <div className="user-avatar">
            {selectedChat.otherUser?.name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="user-details">
            <h3>{selectedChat.otherUser?.name || 'Unknown User'}</h3>
            <p className="status">Online</p>
          </div>
        </div>
      </div>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const showDate = shouldShowDateHeader(message, messages[index - 1]);
            
            return (
              <React.Fragment key={message.id}>
                {showDate && (
                  <div className="date-header">
                    <span>{formatDateHeader(message.timestamp)}</span>
                  </div>
                )}
                <div
                  className={`message ${
                    message.sender === currentUser.uid ? 'sent' : 'received'
                  }`}
                >
                  <div className="message-content">
                    {message.content}
                    {message.sender === currentUser.uid && (
                      <button 
                        className="delete-message-btn"
                        onClick={() => setShowDeleteModal(message.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <div className="message-timestamp">
                    {formatTimestamp(message.timestamp)}
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {showDeleteModal && (
        <div className="delete-modal-overlay">
          <div className="delete-modal">
            <div className="delete-modal-header">
              <h3>Delete Message</h3>
              <button 
                className="close-modal-btn"
                onClick={() => setShowDeleteModal(null)}
              >
                <X size={20} />
              </button>
            </div>
            <p>Are you sure you want to delete this message? This action cannot be undone.</p>
            <div className="delete-modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setShowDeleteModal(null)}
              >
                Cancel
              </button>
              <button 
                className="delete-btn"
                onClick={() => handleDeleteMessage(showDeleteModal)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="message-input-container">
        <form onSubmit={handleSendMessage}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message ${selectedChat.otherUser?.name || 'user'}...`}
            disabled={loading}
            className="message-input"
          />
          <button type="submit" disabled={loading || !newMessage.trim()}>
            {loading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatBox;

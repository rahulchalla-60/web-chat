import React, { useState } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import ChatBox from '../components/ChatBox.jsx';
import '../styles/Chats.css';

const Chats = () => {
  const [selectedChat, setSelectedChat] = useState(null);

  return (
    <div className="chats-container">
      <Sidebar onChatSelect={setSelectedChat} selectedChat={selectedChat} />
      <ChatBox selectedChat={selectedChat} />
    </div>
  );
};

export default Chats;
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";

const getCurrentUserId = () => {
  try {
    return JSON.parse(atob(localStorage.getItem("token").split('.')[1])).id;
  } catch {
    return null;
  }
};

const Chats = () => {
  const [chats, setChats] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const socket = useRef(null);
  const navigate = useNavigate();
  const currentUserId = getCurrentUserId();

  // Socket.IO setup
  useEffect(() => {
    socket.current = io(SOCKET_URL);
    socket.current.emit("setup", { _id: currentUserId });
    socket.current.on("connected", () => setSocketConnected(true));
    return () => {
      socket.current.disconnect();
    };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const fetchChats = async () => {
      setLoadingChats(true);
      setError("");
      try {
        const res = await fetch("/api/chat/", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        let data;
        try {
          data = await res.json();
        } catch {
          data = [];
        }
        if (!res.ok) throw new Error(data.message || "Failed to fetch chats");
        setChats(data);
        if (data.length > 0) setSelectedChat(data[0]._id);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingChats(false);
      }
    };
    fetchChats();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      setError("");
      try {
        const res = await fetch("/api/user", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        let data;
        try {
          data = await res.json();
        } catch {
          data = [];
        }
        if (!res.ok) throw new Error(data.message || "Failed to fetch users");
        setUsers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  // Join chat room on chat select
  useEffect(() => {
    if (!selectedChat || !socket.current) return;
    socket.current.emit("join chat", selectedChat);
  }, [selectedChat]);

  useEffect(() => {
    if (!selectedChat) return;
    const fetchMessages = async () => {
      setLoadingMessages(true);
      setError("");
      try {
        const res = await fetch(`/api/message/${selectedChat}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        let data;
        try {
          data = await res.json();
        } catch {
          data = [];
        }
        if (!res.ok) throw new Error(data.message || "Failed to fetch messages");
        setMessages(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingMessages(false);
      }
    };
    fetchMessages();
  }, [selectedChat]);

  // Listen for real-time messages
  useEffect(() => {
    if (!socket.current) return;
    const handleMessageReceived = (newMessage) => {
      if (selectedChat && newMessage.chat._id === selectedChat) {
        setMessages((msgs) => [...msgs, newMessage]);
      }
    };
    socket.current.on("message received", handleMessageReceived);
    return () => {
      socket.current.off("message received", handleMessageReceived);
    };
  }, [selectedChat]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;
    try {
      const res = await fetch("/api/message/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ content: newMessage, chatId: selectedChat }),
      });
      let data;
      try {
        data = await res.json();
      } catch {
        data = null;
      }
      if (!res.ok) throw new Error(data?.message || "Failed to send message");
      setMessages((msgs) => [...msgs, data]);
      setNewMessage("");
      // Emit new message to Socket.IO
      if (socket.current && socketConnected) {
        socket.current.emit("new message", data);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUserClick = async (userId) => {
    setError("");
    try {
      const res = await fetch("/api/chat/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ userId }),
      });
      let data;
      try {
        data = await res.json();
      } catch {
        data = null;
      }
      if (!res.ok) throw new Error(data?.message || "Failed to create or fetch chat");
      if (!chats.find((c) => c._id === data._id)) {
        setChats((prev) => [data, ...prev]);
      }
      setSelectedChat(data._id);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f4f7fa" }}>
      <aside style={{ width: 260, background: "#fff", boxShadow: "2px 0 8px #e0e0e0", padding: 24, overflowY: "auto" }}>
        <h3 style={{ marginBottom: 16 }}>Users</h3>
        {loadingUsers ? (
          <div>Loading users...</div>
        ) : error ? (
          <div style={{ color: "#d32f2f" }}>{error}</div>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, marginBottom: 24 }}>
            {users.map((user) => (
              <li
                key={user._id}
                onClick={() => handleUserClick(user._id)}
                style={{
                  padding: "10px 16px",
                  marginBottom: 8,
                  borderRadius: 8,
                  background: "#f7fafd",
                  color: "#333",
                  cursor: "pointer",
                  fontWeight: 500,
                  transition: "background 0.2s, color 0.2s",
                }}
              >
                {user.name} <span style={{ color: "#aaa", fontSize: 13 }}>({user.email})</span>
              </li>
            ))}
          </ul>
        )}
        <h3 style={{ marginBottom: 16 }}>Chats</h3>
        {loadingChats ? (
          <div>Loading chats...</div>
        ) : error ? (
          <div style={{ color: "#d32f2f" }}>{error}</div>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {chats.map((chat) => (
              <li
                key={chat._id}
                onClick={() => setSelectedChat(chat._id)}
                style={{
                  padding: "12px 16px",
                  marginBottom: 8,
                  borderRadius: 8,
                  background: selectedChat === chat._id ? "#74ebd5" : "#f7fafd",
                  color: selectedChat === chat._id ? "#fff" : "#333",
                  cursor: "pointer",
                  fontWeight: selectedChat === chat._id ? 600 : 400,
                  transition: "background 0.2s, color 0.2s",
                }}
              >
                {chat.isGroupChat ? chat.chatName : chat.users.filter(u => u._id !== currentUserId)[0]?.name}
              </li>
            ))}
          </ul>
        )}
        <button
          onClick={handleLogout}
          style={{
            marginTop: 32,
            padding: "10px 20px",
            background: "#d32f2f",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: 600,
            width: "100%",
          }}
        >
          Logout
        </button>
      </aside>
      <main style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        <div style={{ width: 400, background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px #e0e0e0", padding: 24, minHeight: 400, display: "flex", flexDirection: "column" }}>
          <h4 style={{ marginBottom: 16 }}>
            {selectedChat && chats.length > 0
              ? `Chat with ${(() => {
                  const chat = chats.find((c) => c._id === selectedChat);
                  if (!chat) return "";
                  if (chat.isGroupChat) return chat.chatName;
                  const user = chat.users.filter(u => u._id !== currentUserId)[0];
                  return user?.name || "Unknown";
                })()}`
              : "Select a chat"}
          </h4>
          <div style={{ flex: 1, overflowY: "auto", marginBottom: 16, maxHeight: 250 }}>
            {loadingMessages ? (
              <div>Loading messages...</div>
            ) : error ? (
              <div style={{ color: "#d32f2f" }}>{error}</div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={msg._id || idx}
                  style={{
                    textAlign: msg.sender && msg.sender._id === currentUserId ? "right" : "left",
                    margin: "8px 0",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      background: msg.sender && msg.sender._id === currentUserId ? "#74ebd5" : "#eee",
                      color: msg.sender && msg.sender._id === currentUserId ? "#fff" : "#333",
                      borderRadius: 16,
                      padding: "8px 16px",
                      maxWidth: "70%",
                    }}
                  >
                    {msg.content || msg.text}
                  </span>
                </div>
              ))
            )}
          </div>
          {selectedChat && (
            <form onSubmit={handleSend} style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                style={{ flex: 1, padding: "10px", borderRadius: 6, border: "1.5px solid #e0e0e0", fontSize: 16 }}
              />
              <button
                type="submit"
                style={{
                  padding: "10px 18px",
                  background: "#74ebd5",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Send
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};

export default Chats; 
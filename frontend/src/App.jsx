import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Chats from './pages/Chats.jsx';
import './App.css';

const AppContent = () => {
  const { currentUser } = useAuth();
  const [currentPage, setCurrentPage] = useState('login');

  if (currentUser) {
    return <Chats />;
  }

  switch (currentPage) {
    case 'login':
      return <Login onNavigate={setCurrentPage} />;
    case 'register':
      return <Register onNavigate={setCurrentPage} />;
    default:
      return <Login onNavigate={setCurrentPage} />;
  }
};

const App = () => {
  return (
    <AuthProvider>
      <div className="App">
        <AppContent />
      </div>
    </AuthProvider>
  );
};
export default App;
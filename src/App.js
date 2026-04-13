import React, { useState, useEffect } from "react";
import Board from "./components/Board/index"; 
import ToolBar from "./components/ToolBar/index"; 
import BoardProvider from "./store/BoardProvider";
import Signup from "./components/Signup";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard"; 

function App() {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");
      const token = localStorage.getItem("token");
      if (savedUser && token) return JSON.parse(savedUser);
    } catch (e) {}
    return null;
  });

  const [showLogin, setShowLogin] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedCanvas, setSelectedCanvas] = useState(null);

  // On mount: verify token is still valid
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const isExpired = payload.exp * 1000 < Date.now();
      if (isExpired) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      }
    } catch (e) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
    }
  }, []);

  const handleSetUser = (userData, token) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    if (token) localStorage.setItem("token", token);
  };

  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setIsEditorOpen(false);
    setSelectedCanvas(null);
  };

  // ✅ NEW: Called after saving a NEW project
  // Updates selectedCanvas with the real saved work object (including _id)
  // So the next save correctly hits update-canvas instead of creating a duplicate
  const handleAfterSave = (newWork) => {
    setSelectedCanvas(newWork);
  };

  if (!user) {
    return showLogin ? (
      <Login setUser={handleSetUser} switchToSignup={() => setShowLogin(false)} />
    ) : (
      <Signup setUser={handleSetUser} switchToLogin={() => setShowLogin(true)} />
    );
  }

  if (!isEditorOpen) {
    return (
      <Dashboard 
        user={user} 
        onUpdateUser={handleUpdateUser}
        onStartNew={() => { setSelectedCanvas(null); setIsEditorOpen(true); }} 
        onSelectWork={(workObject) => { setSelectedCanvas(workObject); setIsEditorOpen(true); }}
        handleLogout={handleLogout}
      />
    );
  }

  return (
    <BoardProvider>
      <nav style={{ 
        position: 'fixed', top: 0, left: 0, right: 0, height: '60px', 
        background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        padding: '0 20px', zIndex: 2000, borderBottom: '1px solid #eee'
      }}>
        <div style={{ fontWeight: '800', fontSize: '18px', color: '#333' }}>
          Cloud<span style={{ color: '#4dabf7' }}>Board</span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => { setIsEditorOpen(false); setSelectedCanvas(null); }}
            style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #ccc', cursor: 'pointer', background: 'white' }}
          >
            ← Back to Gallery
          </button>
          <button 
            onClick={handleLogout} 
            style={{ padding: '8px 16px', borderRadius: '8px', background: '#fa5252', color: 'white', border: 'none', cursor: 'pointer', fontWeight: '600' }}
          >
            Logout
          </button>
        </div>
      </nav>

      <ToolBar 
        currentWorkId={selectedCanvas?._id} 
        onUpdateUser={handleUpdateUser}
        onAfterSave={handleAfterSave} // ✅ NEW
      />

      <Board 
        initialImage={selectedCanvas?.dataUrl} 
        currentWorkId={selectedCanvas?._id}
        user={user}
      />
    </BoardProvider>
  );
}

export default App;
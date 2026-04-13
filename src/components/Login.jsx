import { useState } from "react";

function Login({ setUser, switchToSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setMessage("All fields are required");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message);
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user, data.token); // ✅ FIXED: pass token as second argument
    } catch {
      setMessage("Server error");
    }
  };

  const styles = {
    container: {
      height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#f8f9fa",
      fontFamily: "'Inter', sans-serif",
      color: "#212529"
    },
    card: {
      width: "360px",
      padding: "40px",
      backgroundColor: "#ffffff",
      borderRadius: "12px",
      border: "1px solid #dee2e6",
      boxShadow: "0 8px 30px rgba(0,0,0,0.05)",
      textAlign: "center"
    },
    title: {
      fontSize: "26px",
      fontWeight: "800",
      marginBottom: "8px",
      color: "#111",
      letterSpacing: "-0.5px"
    },
    subtitle: {
      color: "#6c757d", 
      marginBottom: "25px", 
      fontSize: "14px"
    },
    input: {
      width: "100%",
      padding: "12px",
      marginBottom: "16px",
      backgroundColor: "#fff",
      border: "1px solid #ced4da",
      borderRadius: "6px",
      color: "#212529",
      fontSize: "14px",
      boxSizing: "border-box",
      outline: "none",
      transition: "all 0.2s ease"
    },
    buttonPrimary: {
      width: "100%",
      padding: "12px",
      backgroundColor: "#228be6", 
      color: "white",
      border: "none",
      borderRadius: "6px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      marginTop: "10px"
    },
    linkButton: {
      background: "none",
      border: "none",
      color: "#228be6",
      fontSize: "13px",
      marginTop: "20px",
      cursor: "pointer",
      fontWeight: "500"
    },
    error: {
      color: "#fa5252",
      fontSize: "13px",
      marginTop: "15px"
    }
  };

  const inputFocus = (e) => {
    e.target.style.borderColor = "#228be6";
    e.target.style.boxShadow = "0 0 0 3px rgba(34, 139, 230, 0.1)";
  };

  const inputBlur = (e) => {
    e.target.style.borderColor = "#ced4da";
    e.target.style.boxShadow = "none";
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>CloudBoard App</h2>
        <p style={styles.subtitle}>Sign in to start drawing</p>
        
        <form onSubmit={handleLogin}>
          <input 
            style={styles.input}
            placeholder="Email address" 
            type="email"
            onChange={e => setEmail(e.target.value)} 
            onFocus={inputFocus}
            onBlur={inputBlur}
          />
          <input 
            style={styles.input}
            type="password" 
            placeholder="Password" 
            onChange={e => setPassword(e.target.value)} 
            onFocus={inputFocus}
            onBlur={inputBlur}
          />
          <button type="submit" style={styles.buttonPrimary}>Login</button>
        </form>

        <div style={styles.error}>{message}</div>
        <button style={styles.linkButton} onClick={switchToSignup}>
          New user? Create an account
        </button>
      </div>
    </div>
  );
}

export default Login;

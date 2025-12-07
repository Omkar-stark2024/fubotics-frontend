import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authMode, setAuthMode] = useState("login"); // "login" or "register"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [currentUser, setCurrentUser] = useState(
    localStorage.getItem("username") || ""
  );
  const [token, setToken] = useState(localStorage.getItem("token") || "");

  // Fetch messages only if logged in
  useEffect(() => {
    if (!token) return;

    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/messages`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setMessages(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load chat history.");
      }
    };
    fetchHistory();
  }, [token]);

  const handleAuth = async () => {
    setError("");
    if (!username.trim() || !password.trim()) {
      setError("Username and password are required.");
      return;
    }

    try {
      const endpoint =
        authMode === "login" ? "/api/login" : "/api/register";

      const res = await axios.post(`${BACKEND_URL}${endpoint}`, {
        username: username.trim(),
        password: password.trim(),
      });

      const { token: newToken, username: nameFromServer } = res.data;
      setToken(newToken);
      setCurrentUser(nameFromServer);
      localStorage.setItem("token", newToken);
      localStorage.setItem("username", nameFromServer);

      // Clear fields
      setPassword("");
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error || "Authentication failed. Please try again."
      );
    }
  };

  const handleLogout = () => {
    setToken("");
    setCurrentUser("");
    setMessages([]);
    localStorage.removeItem("token");
    localStorage.removeItem("username");
  };

  const handleSend = async () => {
    if (!input.trim() || !token) return;

    setError("");
    setLoading(true);

    try {
      const res = await axios.post(
        `${BACKEND_URL}/api/messages`,
        { text: input.trim() },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessages(res.data);
      setInput("");
    } catch (err) {
      console.error(err);
      setError("Failed to send message.");
    } finally {
      setLoading(false);
    }
  };

  // Press Enter to send
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // If not logged in: show auth card
  if (!token) {
    return (
      <div className="app-container">
        <div className="auth-card">
          <h1>Fubotics AI Chat</h1>
          <p className="subtitle">Login or Register to continue</p>

          <div className="auth-tabs">
            <button
              className={authMode === "login" ? "active" : ""}
              onClick={() => setAuthMode("login")}
            >
              Login
            </button>
            <button
              className={authMode === "register" ? "active" : ""}
              onClick={() => setAuthMode("register")}
            >
              Register
            </button>
          </div>

          <div className="auth-form">
            <label>Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
            />

            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />

            <button onClick={handleAuth}>
              {authMode === "login" ? "Login" : "Create account"}
            </button>
          </div>

          {error && <div className="error-banner">{error}</div>}
        </div>
      </div>
    );
  }

  // Logged in: show dashboard + chat
  return (
    <div className="app-container">
      <div className="chat-card">
        <header className="chat-header">
          <div>
            <h1>Fubotics AI Chat</h1>
            <p className="subtitle">
              Logged in as <strong>{currentUser}</strong>
            </p>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </header>

        <div className="chat-window">
          {messages.length === 0 && (
            <div className="empty-state">
              <p>Start the conversation by typing a message 👋</p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`message-row ${
                msg.sender === "user" ? "user-row" : "ai-row"
              }`}
            >
              <div
                className={`message-bubble ${
                  msg.sender === "user" ? "user-bubble" : "ai-bubble"
                }`}
              >
                <div className="sender-label">
                  {msg.sender === "user" ? "You" : "AI"}
                </div>
                <div className="message-text">{msg.text}</div>
                <div className="timestamp">
                  {new Date(msg.created_at).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="input-row">
          <textarea
            rows="2"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message and press Enter..."
          />
          <button onClick={handleSend} disabled={loading || !input.trim()}>
            {loading ? "Thinking..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;

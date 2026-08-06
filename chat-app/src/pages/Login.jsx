import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    navigate("/");
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">💬</div>
          <span style={{ fontSize: "22px", fontWeight: 700, color: "#f1f5f9" }}>ChatWave</span>
        </div>
        <h1>Welcome back</h1>
        <p>Sign in to continue chatting</p>
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <span className="input-icon">✉️</span>
            <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <span className="input-icon">🔒</span>
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign In →"}
          </button>
        </form>
        {error && <p className="auth-error">{error}</p>}
        <p className="auth-switch">Don't have an account? <Link to="/register">Create one</Link></p>
      </div>
    </div>
  );
}
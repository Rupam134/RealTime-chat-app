import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Please enter your name"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: name.trim() } }
    });
    if (signUpError) { setError(signUpError.message); setLoading(false); return; }
    if (data?.user) {
      await supabase.from("users").upsert({ email, name: name.trim() });
    }
    setLoading(false);
    navigate("/login");
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">💬</div>
          <span style={{ fontSize: "22px", fontWeight: 700, color: "#f1f5f9" }}>ChatWave</span>
        </div>
        <h1>Create account</h1>
        <p>Join ChatWave today — it's free</p>
        <form onSubmit={handleRegister}>
          <div className="input-group">
            <span className="input-icon">👤</span>
            <input type="text" placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="input-group">
            <span className="input-icon">✉️</span>
            <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <span className="input-icon">🔒</span>
            <input type="password" placeholder="Password (min 6 chars)" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <div className="input-group">
            <span className="input-icon">🔒</span>
            <input type="password" placeholder="Confirm password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
          </div>
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "Creating account…" : "Create Account →"}
          </button>
        </form>
        {error && <p className="auth-error">{error}</p>}
        <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
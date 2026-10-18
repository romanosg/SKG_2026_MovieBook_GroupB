import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import formStyles from "./formStyles";
import { isValidEmail, isValidPassword } from "../utils/validation";

const styles = {
  inputWrap: { position: "relative" },
  toggle: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    padding: 0,
    color: "#8ab4f8",
    fontSize: 12,
    cursor: "pointer",
  },
  forgotRow: { display: "flex", justifyContent: "flex-end" },
  forgotButton: {
    background: "none",
    border: "none",
    padding: 0,
    color: "#8ab4f8",
    fontSize: 14,
    cursor: "pointer",
  },
};

export default function SignInPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Empty or not meeting the sign-up criteria: clear both fields
    if (!isValidEmail(email) || !isValidPassword(password)) {
      setEmail("");
      setPassword("");
      setError("Sign in information set up incorrectly. Please try again!");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // stilvoume email + password sto backend
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login failed. Please try again.");
        setPassword("");
        return;
      }

      // apothikevoume token + user sto localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("authChange"));
      navigate("/");
    } catch (err) {
      setError("Could not connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={formStyles.page}>
      {/* Hides the browser's built-in "reveal password" icon (Edge) */}
      <style>{`
        .pw-input::-ms-reveal,
        .pw-input::-ms-clear {
          display: none;
        }
      `}</style>
      <h1 style={formStyles.authTitle}>Sign in</h1>
      <form style={formStyles.authForm} onSubmit={handleSubmit} noValidate>
        <label style={formStyles.label}>
          Email
          <input
            style={formStyles.input}
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
          />
        </label>
        <div style={formStyles.label}>
          <label htmlFor="signin-password">Password</label>
          <div style={styles.inputWrap}>
            <input
              id="signin-password"
              className="pw-input"
              style={{ ...formStyles.input, width: "100%", paddingRight: 56 }}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
            />
            <button
              type="button"
              style={styles.toggle}
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {error && <span style={formStyles.error}>{error}</span>}

        <button style={formStyles.button} type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <div style={styles.forgotRow}>
          <button
            type="button"
            style={styles.forgotButton}
            onClick={() => {
              // TODO: go to your "forgot password" page
              console.log("Forgot password clicked");
            }}
          >
            Forgot password?
          </button>
        </div>
      </form>
    </main>
  );
}

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import formStyles from "./formStyles";
import { isValidEmail, isValidPassword } from "../utils/validation";

const styles = {
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
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    // Empty or not meeting the sign-up criteria: clear both fields
    if (!isValidEmail(email) || !isValidPassword(password)) {
      setEmail("");
      setPassword("");
      setError("Sign in information set up incorrectly. Please try again!");
      return;
    }

    // TODO: check { email, password } against your backend
    console.log("Sign in:", { email, password });
    navigate("/"); // go to the homepage
  };

  return (
    <main style={formStyles.page}>
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
        <label style={formStyles.label}>
          Password
          <input
            style={formStyles.input}
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
          />
        </label>

        {error && <span style={formStyles.error}>{error}</span>}

        <button style={formStyles.button} type="submit">
          Sign in
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

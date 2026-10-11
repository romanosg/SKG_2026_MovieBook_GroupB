import React, { useState } from "react";
import formStyles from "./formStyles";

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: send { email, password } to your backend
    console.log("Sign in:", { email, password });
  };

  return (
    <main style={formStyles.page}>
      <h1 style={formStyles.authTitle}>Sign in</h1>
      <form style={formStyles.authForm} onSubmit={handleSubmit}>
        <label style={formStyles.label}>
          Email
          <input
            style={formStyles.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label style={formStyles.label}>
          Password
          <input
            style={formStyles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
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

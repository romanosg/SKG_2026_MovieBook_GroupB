import React, { useState } from "react";
import formStyles from "./formStyles";

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
      <h1 style={formStyles.title}>Sign in</h1>
      <form style={formStyles.form} onSubmit={handleSubmit}>
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
      </form>
    </main>
  );
}

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import { isValidEmail, isValidPassword } from "../utils/validation";

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
    <PageLayout page="signIn">
      <h1 className="mb-5 text-center text-2xl font-semibold">Sign in</h1>
      <form
        className="mx-auto flex w-[360px] max-w-full flex-col gap-3.5"
        onSubmit={handleSubmit}
        noValidate
      >
        <label className="field">
          Email
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
          />
        </label>

        <div className="field">
          <label htmlFor="signin-password">Password</label>
          <div className="relative">
            <input
              id="signin-password"
              className="input pw-input w-full pr-14"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
            />
            <button
              type="button"
              className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer text-xs text-brand"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {error && <span className="error">{error}</span>}

        <button className="btn" type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <div className="flex justify-end">
          <button
            type="button"
            className="cursor-pointer text-sm text-brand"
            onClick={() => {
              // TODO: go to your "forgot password" page
              console.log("Forgot password clicked");
            }}
          >
            Forgot password?
          </button>
        </div>
      </form>
    </PageLayout>
  );
}

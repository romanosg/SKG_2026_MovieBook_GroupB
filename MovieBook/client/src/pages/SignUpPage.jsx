import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import formStyles from "./formStyles";
import { isValidEmail, getPasswordRules, isValidPassword } from "../utils/validation";

const COLORS = { neutral: "#4a4a4a", red: "#e5534b", green: "#3fb950", gray: "#9a9a9a" };

const styles = {
  dateRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  dateInput: { ...formStyles.input, textAlign: "center", padding: "10px 4px" },
  slash: { fontSize: 18, color: COLORS.gray },
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
  rules: { listStyle: "none", margin: 0, padding: 0, fontSize: 12 },
};

// Checks day/month/year form a real date that isn't in the future
const isValidBirthdate = (day, month, year) => {
  if (!/^\d{2}$/.test(day) || !/^\d{2}$/.test(month) || !/^\d{4}$/.test(year)) {
    return false;
  }
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);
  const date = new Date(y, m - 1, d);
  const isRealDate =
    date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
  return isRealDate && y >= 1900 && date <= new Date();
};

export default function SignUpPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const dayRef = useRef(null);
  const monthRef = useRef(null);
  const yearRef = useRef(null);

  // Keep digits only, and jump to the next box once this one is full
  const handleDatePart = (setter, maxLength, nextRef) => (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, maxLength);
    setter(value);
    if (value.length === maxLength) nextRef?.current?.focus();
  };

  // Backspace on an empty box moves back to the previous one
  const handleBackspace = (value, prevRef) => (e) => {
    if (e.key === "Backspace" && value === "") prevRef?.current?.focus();
  };

  // Password field colours
  const rules = getPasswordRules(password);
  const passwordIsValid = rules.every((r) => r.met);
  const passwordBorder =
    password === ""
      ? COLORS.neutral
      : passwordIsValid
      ? COLORS.green
      : COLORS.red;
  const passwordStyle = {
    ...formStyles.input,
    width: "100%",
    paddingRight: 56,
    borderColor: passwordBorder,
  };
  const confirmStyle = { ...formStyles.input, width: "100%", paddingRight: 56 };

  // Unmet rules are gray on an untouched form, red once there is a problem
  const showUnmetInRed = password !== "" || Boolean(errors.password);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!isValidEmail(email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (!isValidBirthdate(day, month, year)) {
      newErrors.birthdate = "Enter a valid date as DD / MM / YYYY.";
    }
    if (!isValidPassword(password)) {
      newErrors.password = "Password does not meet the requirements.";
    } else if (confirmPassword !== password) {
      newErrors.confirmPassword = "Passwords do not match!";
      setConfirmPassword(""); // cleared even if other fields have errors
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    // metatrepoume se YYYY-MM-DD gia ton server
    const dateOfBirth = `${year}-${month}-${day}`;

    setLoading(true);

    try {
      const response = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, dateOfBirth, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // p.x. email idi yparxei
        if (response.status === 409) {
          setErrors({ email: data.message });
        } else {
          setErrors({ email: data.message });
        }
        return;
      }

      // epitixia, redirect sto sign-in
      navigate("/sign-in");
    } catch (err) {
      setErrors({ email: "Could not connect to the server. Please try again." });
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
      <h1 style={formStyles.authTitle}>Sign up</h1>
      <form style={formStyles.authForm} onSubmit={handleSubmit} noValidate>
        <label style={formStyles.label}>
          Email
          <input
            style={{
              ...formStyles.input,
              borderColor: errors.email ? COLORS.red : COLORS.neutral,
            }}
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            onBlur={() => {
              // Check when leaving the field (only if something was typed)
              if (email !== "" && !isValidEmail(email)) {
                setErrors((prev) => ({
                  ...prev,
                  email: "Please enter a valid email address.",
                }));
              }
            }}
            required
          />
          {errors.email && <span style={formStyles.error}>{errors.email}</span>}
        </label>

        <div style={formStyles.label} role="group" aria-labelledby="dob-label">
          <span id="dob-label">Date of birth</span>
          <div style={styles.dateRow}>
            <input
              ref={dayRef}
              style={{ ...styles.dateInput, width: 56 }}
              type="text"
              inputMode="numeric"
              placeholder="DD"
              aria-label="Day"
              value={day}
              onChange={handleDatePart(setDay, 2, monthRef)}
            />
            <span style={styles.slash}>/</span>
            <input
              ref={monthRef}
              style={{ ...styles.dateInput, width: 56 }}
              type="text"
              inputMode="numeric"
              placeholder="MM"
              aria-label="Month"
              value={month}
              onChange={handleDatePart(setMonth, 2, yearRef)}
              onKeyDown={handleBackspace(month, dayRef)}
            />
            <span style={styles.slash}>/</span>
            <input
              ref={yearRef}
              style={{ ...styles.dateInput, width: 80 }}
              type="text"
              inputMode="numeric"
              placeholder="YYYY"
              aria-label="Year"
              value={year}
              onChange={handleDatePart(setYear, 4, null)}
              onKeyDown={handleBackspace(year, monthRef)}
            />
          </div>
          {errors.birthdate && (
            <span style={formStyles.error}>{errors.birthdate}</span>
          )}
        </div>

        <div style={formStyles.label}>
          <label htmlFor="signup-password">Password</label>
          <div style={styles.inputWrap}>
            <input
              id="signup-password"
              className="pw-input"
              style={passwordStyle}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
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
          <ul style={styles.rules}>
            {rules.map((rule) => (
              <li
                key={rule.label}
                style={{
                  color: rule.met
                    ? COLORS.green
                    : showUnmetInRed
                    ? COLORS.red
                    : COLORS.gray,
                }}
              >
                {rule.met ? "✓" : "•"} {rule.label}
              </li>
            ))}
          </ul>
        </div>

        <div style={formStyles.label}>
          <label htmlFor="signup-confirm">Confirm password</label>
          <div style={styles.inputWrap}>
            <input
              id="signup-confirm"
              className="pw-input"
              style={confirmStyle}
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }}
              required
            />
            <button
              type="button"
              style={styles.toggle}
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? "Hide" : "Show"}
            </button>
          </div>
          {errors.confirmPassword && (
            <span style={formStyles.error}>{errors.confirmPassword}</span>
          )}
        </div>

        <button style={formStyles.button} type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
    </main>
  );
}

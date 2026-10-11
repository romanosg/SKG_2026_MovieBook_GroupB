import React, { useRef, useState } from "react";
import formStyles from "./formStyles";

const styles = {
  dateRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  dateInput: { ...formStyles.input, textAlign: "center", padding: "10px 4px" },
  slash: { fontSize: 18, color: "#9a9a9a" },
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

const isValidPassword = (value) => value.length >= 7 && /[A-Z]/.test(value);

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});

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

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!isValidBirthdate(day, month, year)) {
      newErrors.birthdate = "Enter a valid date as DD / MM / YYYY.";
    }
    if (!isValidPassword(password)) {
      newErrors.password =
        "Password must be at least 7 characters and include 1 capital letter.";
    }
    if (confirmPassword !== password) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const birthdate = `${day}/${month}/${year}`;
    // TODO: send { email, birthdate, password } to your backend
    console.log("Sign up:", { email, birthdate, password });
  };

  return (
    <main style={formStyles.page}>
      <h1 style={formStyles.authTitle}>Sign up</h1>
      <form style={formStyles.authForm} onSubmit={handleSubmit} noValidate>
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

        <label style={formStyles.label}>
          Password
          <input
            style={formStyles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <span style={errors.password ? formStyles.error : formStyles.hint}>
            Must be at least 7 characters long and include 1 capital letter.
          </span>
        </label>

        <label style={formStyles.label}>
          Confirm password
          <input
            style={formStyles.input}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {errors.confirmPassword && (
            <span style={formStyles.error}>{errors.confirmPassword}</span>
          )}
        </label>

        <button style={formStyles.button} type="submit">
          Create account
        </button>
      </form>
    </main>
  );
}

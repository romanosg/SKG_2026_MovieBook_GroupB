
import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import {
  isValidEmail,
  getPasswordRules,
  isValidPassword,
  isValidUsername,
} from "../utils/validation";
import { request } from "../utils/api";

// Checks day/month/year form a real date that isn't in the future
const isValidBirthdate = (day, month, year) => {
  if (
    !/^\d{2}$/.test(day) ||
    !/^\d{2}$/.test(month) ||
    !/^\d{4}$/.test(year)
  ) {
    return false;
  }

  const d = Number(day);
  const m = Number(month);
  const y = Number(year);

  const date = new Date(y, m - 1, d);

  const isRealDate =
    date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d;

  if (!isRealDate) return false;

  const today = new Date();
  let age = today.getFullYear() - y;

  if (
    today.getMonth() < m - 1 ||
    (today.getMonth() === m - 1 && today.getDate() < d)
  ) {
    age--;
  }

  return age >= 13 && age <= 120;
};

export default function SignUpPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
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

    if (value.length === maxLength) {
      nextRef?.current?.focus();
    }
  };

  // Backspace on an empty box moves back to the previous one
  const handleBackspace = (value, prevRef) => (e) => {
    if (e.key === "Backspace" && value === "") {
      prevRef?.current?.focus();
    }
  };

  // Password field: neutral border when empty, green when valid, red when not
  const rules = getPasswordRules(password);
  const passwordIsValid = rules.every((r) => r.met);

  const passwordBorderClass =
    password === ""
      ? "border-line"
      : passwordIsValid
      ? "border-success"
      : "border-danger";

  // Unmet rules are gray on an untouched form, red once there is a problem
  const showUnmetInRed = password !== "" || Boolean(errors.password);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!isValidEmail(email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!isValidUsername(username)) {
      newErrors.username =
        "Username must be 3–30 characters, start with a letter, and use only letters, numbers or underscores.";
    }

    if (!isValidBirthdate(day, month, year)) {
      newErrors.birthdate = "Enter a valid date as DD / MM / YYYY.";
    }

    if (!isValidPassword(password)) {
      newErrors.password = "Password does not meet the requirements.";
    } else if (confirmPassword !== password) {
      newErrors.confirmPassword = "Passwords do not match!";
      setConfirmPassword("");
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    // Convert to YYYY-MM-DD for the server
    const dateOfBirth = `${year}-${month}-${day}`;

    setLoading(true);

    try {
      const data = await request("/api/auth/register", {
        method: "POST",
        body: { email, username, dateOfBirth, password },
      });

      // Success: redirect to sign-in
      navigate("/sign-in");
    } catch (err) {
      // Show the server message for duplicate email or username
      const msg = err.message || "";

      if (msg.toLowerCase().includes("username")) {
        setErrors({ username: msg });
      } else {
        setErrors({ email: msg || "Could not connect to the server. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout page="signUp">
      <h1 className="mb-5 text-center text-2xl font-semibold">
        Sign up
      </h1>

      <form
        className="mx-auto flex w-[360px] max-w-full flex-col gap-3.5"
        onSubmit={handleSubmit}
        noValidate
      >
        <label className="field">
          Username
          <input
            className={`input ${errors.username ? "border-danger" : ""}`}
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setErrors((prev) => ({ ...prev, username: undefined }));
            }}
            onBlur={() => {
              if (username !== "" && !isValidUsername(username)) {
                setErrors((prev) => ({
                  ...prev,
                  username:
                    "Username must be 3–30 characters, start with a letter, and use only letters, numbers or underscores.",
                }));
              }
            }}
            required
          />
          {errors.username && (
            <span className="error">{errors.username}</span>
          )}
        </label>

        <label className="field">
          Email
          <input
            className={`input ${errors.email ? "border-danger" : ""}`}
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            onBlur={() => {
              if (email !== "" && !isValidEmail(email)) {
                setErrors((prev) => ({
                  ...prev,
                  email: "Please enter a valid email address.",
                }));
              }
            }}
            required
          />
          {errors.email && (
            <span className="error">{errors.email}</span>
          )}
        </label>

        <div className="field" role="group" aria-labelledby="dob-label">
          <span id="dob-label">Date of birth</span>

          <div className="flex items-center justify-center gap-2">
            <input
              ref={dayRef}
              className="input w-14 px-1 text-center"
              type="text"
              inputMode="numeric"
              placeholder="DD"
              aria-label="Day"
              value={day}
              onChange={handleDatePart(setDay, 2, monthRef)}
            />

            <span className="text-lg text-muted">/</span>

            <input
              ref={monthRef}
              className="input w-14 px-1 text-center"
              type="text"
              inputMode="numeric"
              placeholder="MM"
              aria-label="Month"
              value={month}
              onChange={handleDatePart(setMonth, 2, yearRef)}
              onKeyDown={handleBackspace(month, dayRef)}
            />

            <span className="text-lg text-muted">/</span>

            <input
              ref={yearRef}
              className="input w-20 px-1 text-center"
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
            <span className="error">{errors.birthdate}</span>
          )}
        </div>

        <div className="field">
          <label htmlFor="signup-password">Password</label>

          <div className="relative">
            <input
              id="signup-password"
              className={`input pw-input w-full pr-14 ${passwordBorderClass}`}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
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

          <ul className="text-xs">
            {rules.map((rule) => (
              <li
                key={rule.label}
                className={
                  rule.met
                    ? "text-success"
                    : showUnmetInRed
                    ? "text-danger"
                    : "text-muted"
                }
              >
                {rule.met ? "✓" : "•"} {rule.label}
              </li>
            ))}
          </ul>
        </div>

        <div className="field">
          <label htmlFor="signup-confirm">Confirm password</label>

          <div className="relative">
            <input
              id="signup-confirm"
              className="input pw-input w-full pr-14"
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrors((prev) => ({
                  ...prev,
                  confirmPassword: undefined,
                }));
              }}
              required
            />

            <button
              type="button"
              className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer text-xs text-brand"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? "Hide" : "Show"}
            </button>
          </div>

          {errors.confirmPassword && (
            <span className="error">{errors.confirmPassword}</span>
          )}
        </div>

        <button className="btn" type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
    </PageLayout>
  );
}

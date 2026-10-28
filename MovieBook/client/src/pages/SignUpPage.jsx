import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import { isValidEmail, getPasswordRules, isValidPassword } from "../utils/validation";

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
        // p.x. email idi yparxei (409): the server's message is shown under the email box
        setErrors({ email: data.message });
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
    <PageLayout page="signUp">
      <h1 className="mb-5 text-center text-2xl font-semibold">Sign up</h1>
      <form
        className="mx-auto flex w-[360px] max-w-full flex-col gap-3.5"
        onSubmit={handleSubmit}
        noValidate
      >
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
          {errors.email && <span className="error">{errors.email}</span>}
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
          {errors.birthdate && <span className="error">{errors.birthdate}</span>}
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
                  rule.met ? "text-success" : showUnmetInRed ? "text-danger" : "text-muted"
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
                setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
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
          {errors.confirmPassword && <span className="error">{errors.confirmPassword}</span>}
        </div>

        <button className="btn" type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
    </PageLayout>
  );
}

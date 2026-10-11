import React from "react";
import { NavLink } from "react-router-dom";

const styles = {
  bar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
    background: "#1b1b1b",
    borderBottom: "1px solid #3a3a3a",
    padding: "12px 24px",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
    fontSize: 14,
  },
  group: {
    display: "flex",
    alignItems: "center",
    gap: 20,
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  signUp: {
    color: "#1b1b1b",
    background: "#8ab4f8",
    padding: "6px 14px",
    borderRadius: 6,
    textDecoration: "none",
    fontWeight: 600,
  },
};

// NavLink tells us whether the link matches the current URL
const linkStyle = ({ isActive }) => ({
  color: isActive ? "#ffffff" : "#bdbdbd",
  textDecoration: "none",
  paddingBottom: 2,
  borderBottom: isActive ? "2px solid #8ab4f8" : "2px solid transparent",
});

export default function NavBar() {
  return (
    <nav style={styles.bar} aria-label="Main navigation">
      <ul style={styles.group}>
        <li>
          <NavLink to="/" end style={linkStyle}>
            Home
          </NavLink>
        </li>
        <li>
          <NavLink to="/profile" style={linkStyle}>
            Profile
          </NavLink>
        </li>
      </ul>

      <ul style={styles.group}>
        <li>
          <NavLink to="/sign-in" style={linkStyle}>
            Sign in
          </NavLink>
        </li>
        <li>
          <NavLink to="/sign-up" style={styles.signUp}>
            Sign up
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}

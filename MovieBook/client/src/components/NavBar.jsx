import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";

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
  logOut: {
    color: "#e5534b",
    background: "transparent",
    border: "1px solid #e5534b",
    padding: "6px 14px",
    borderRadius: 6,
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 14,
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
  },
  emailDisplay: {
    color: "#8ab4f8",
    fontSize: 13,
    maxWidth: 200,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
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
  const navigate = useNavigate();

  // diabazoume ton xristi apo localStorage
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  });

  // akoume authChange, navbar ananeonete xwris reload
  useEffect(() => {
    const handleAuth = () => {
      try {
        setUser(JSON.parse(localStorage.getItem("user")));
      } catch {
        setUser(null);
      }
    };
    window.addEventListener("authChange", handleAuth);
    return () => window.removeEventListener("authChange", handleAuth);
  }, []);

  const handleLogout = () => {
    // svhnoume token + user
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // stelnei authChange gia navbar
    window.dispatchEvent(new Event("authChange"));
    navigate("/");
  };

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
            George's Profile
          </NavLink>
        </li>
      </ul>

      <ul style={styles.group}>
        {user ? (
          // sindedemenos: email + logout
          <>
            <li>
              <span style={styles.emailDisplay}>{user.email}</span>
            </li>
            <li>
              <button style={styles.logOut} onClick={handleLogout}>
                Log out
              </button>
            </li>
          </>
        ) : (
          // mh sindedemenos: sign in + sign up
          <>
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
          </>
        )}
      </ul>
    </nav>
  );
}

import React, { useState, useEffect } from "react";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";

// Exhibition profile. Only this link knows about George: the profile page itself is generic.
const GEORGE_EMAIL = "georgerom1999@gmail.com";

// Header link: white with a blue underline when it matches the open page
const linkClass = (isActive) =>
  `border-b-2 pb-0.5 ${isActive ? "border-brand text-strong" : "border-transparent text-soft"}`;

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

  // Both profile links open /profile?email=... with a different email.
  // NavLink only looks at the path, so we work out the highlight ourselves.
  const location = useLocation();
  const onProfilePage = location.pathname === "/profile";
  const viewedEmail = new URLSearchParams(location.search).get("email");
  const viewed = viewedEmail?.toLowerCase();
  const viewingGeorge = onProfilePage && viewed === GEORGE_EMAIL;
  const viewingOwn =
    onProfilePage && Boolean(user) && viewed === user.email.toLowerCase();
  const cameFromGeorgeLink = Boolean(location.state?.viaGeorgeLink);

  // Logged in as George, both links open the same profile,
  // so highlight the one that was actually clicked
  const georgeProfileActive = viewingGeorge && (!viewingOwn || cameFromGeorgeLink);
  const myProfileActive = viewingOwn && !(viewingGeorge && cameFromGeorgeLink);

  return (
    <nav
      className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft bg-navbar px-6 py-3 text-sm"
      aria-label="Main navigation"
    >
      <ul className="flex items-center gap-5">
        <li>
          <NavLink to="/" end className={({ isActive }) => linkClass(isActive)}>
            Home
          </NavLink>
        </li>
        {/* Only when logged in: opens the profile page of the logged-in user */}
        {user && (
          <li>
            <Link
              to={`/profile?email=${encodeURIComponent(user.email)}`}
              className={linkClass(myProfileActive)}
              aria-current={myProfileActive ? "page" : undefined}
            >
              My Profile
            </Link>
          </li>
        )}
        {/* Exhibition link: shown to everyone, logged in or not (temporary).
            The state passes the display name "George" for the profile. */}
        <li>
          <Link
            to={`/profile?email=${encodeURIComponent(GEORGE_EMAIL)}`}
            state={{ name: "George", viaGeorgeLink: true }}
            className={linkClass(georgeProfileActive)}
            aria-current={georgeProfileActive ? "page" : undefined}
          >
            George's Profile
          </Link>
        </li>
      </ul>

      <ul className="flex items-center gap-5">
        {user ? (
          // sindedemenos: email + logout
          <>
            <li>
              <span className="block max-w-[200px] truncate text-[13px] text-email">
                {user.email}
              </span>
            </li>
            <li>
              <button
                type="button"
                className="cursor-pointer rounded-md border border-danger bg-transparent px-3.5 py-1.5 text-sm font-semibold text-danger"
                onClick={handleLogout}
              >
                Log out
              </button>
            </li>
          </>
        ) : (
          // mh sindedemenos: sign in + sign up
          <>
            <li>
              <NavLink to="/sign-in" className={({ isActive }) => linkClass(isActive)}>
                Sign in
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/sign-up"
                className="rounded-md bg-btn px-3.5 py-1.5 font-semibold text-on-btn"
              >
                Sign up
              </NavLink>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}

import React, { useState, useEffect } from "react";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";

// Header link: white with a blue underline when it matches the open page
const linkClass = (isActive) =>
  `border-b-2 pb-0.5 ${isActive ? "border-brand text-strong" : "border-transparent text-soft"}`;

const sameText = (a, b) => Boolean(a) && Boolean(b) && a.toLowerCase() === b.toLowerCase();

export default function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();

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

  // The name shown in the header: the username, exactly as it was registered.
  const username = user?.username;

  // Always parse ?username= if the username exists, otherwise fallback to base path
  const queryParam = username ? `?username=${encodeURIComponent(username)}` : "";
  const profilePath = `/profile${queryParam}`;
  const reviewsPath = `/reviews${queryParam}`;
  const watchedPath = `/watched${queryParam}`;

  // Check active states based on URL query parameters or matching paths
  const params = new URLSearchParams(location.search);
  const viewedUsername = params.get("username");
  const viewedEmail = params.get("email");

  const isUserMatch = (viewedUsername
    ? sameText(viewedUsername, username)
    : viewedEmail
    ? sameText(viewedEmail, user?.email)
    : true);

  const myProfileActive = location.pathname === "/profile" && Boolean(user) && isUserMatch;
  const myReviewsActive = location.pathname === "/reviews" && Boolean(user) && isUserMatch;
  const myWatchedActive = location.pathname === "/watched" && Boolean(user) && isUserMatch;

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
        <li>
          <NavLink to="/browse" className={({ isActive }) => linkClass(isActive)}>
            Browse
          </NavLink>
        </li>
        {/* Only when logged in: Profile, Reviews, and Watched Movies links with username query parameter */}
        {user && (
          <>
            <li>
              <Link
                to={profilePath}
                className={linkClass(myProfileActive)}
                aria-current={myProfileActive ? "page" : undefined}
              >
                My Profile
              </Link>
            </li>
            <li>
              <Link
                to={reviewsPath}
                className={linkClass(myReviewsActive)}
                aria-current={myReviewsActive ? "page" : undefined}
              >
                My Reviews
              </Link>
            </li>
            <li>
              <Link
                to={watchedPath}
                className={linkClass(myWatchedActive)}
                aria-current={myWatchedActive ? "page" : undefined}
              >
                My Watched Movies
              </Link>
            </li>
          </>
        )}
      </ul>

      <ul className="flex items-center gap-5">
        {user ? (
          // sindedemenos: username + logout
          <>
            <li>
              <span
                className="block max-w-[200px] truncate text-[13px] text-email"
                title={username ?? user.email}
              >
                {username ?? user.email}
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
import React, { useState, useEffect } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import Profile from "../components/Profile";
import formStyles from "./formStyles";

// Shows the profile of the email in the address: /profile?email=someone@example.com
// Without an email it shows the logged-in user's own profile.
export default function ProfilePage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // Who is logged in (read from localStorage)
  const [loggedUser, setLoggedUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  });

  // Listen for login/logout changes
  useEffect(() => {
    const handleAuth = () => {
      try {
        setLoggedUser(JSON.parse(localStorage.getItem("user")));
      } catch {
        setLoggedUser(null);
      }
    };
    window.addEventListener("authChange", handleAuth);
    return () => window.removeEventListener("authChange", handleAuth);
  }, []);

  // The email of the profile being viewed
  const profileEmail = searchParams.get("email") || loggedUser?.email;

  // The viewed profile's data from the server.
  // status: "loading" | "found" | "notfound" | "error"
  const [status, setStatus] = useState("loading");
  const [profileData, setProfileData] = useState(null); // { email, age }

  useEffect(() => {
    if (!profileEmail) return;
    let cancelled = false;

    setStatus("loading");
    setProfileData(null);

    const loadProfile = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/api/auth/user-info?email=${encodeURIComponent(profileEmail)}`
        );
        // The server answers in JSON. If it isn't JSON (e.g. the route is missing), data is null.
        const data = await response.json().catch(() => null);

        if (response.status === 404 && data) {
          if (!cancelled) setStatus("notfound"); // no user has this email
          return;
        }
        if (!response.ok || !data) throw new Error(`Request failed (${response.status})`);

        if (!cancelled) {
          setProfileData(data.user);
          setStatus("found");
        }
      } catch (err) {
        console.error("Could not load the profile:", err);
        if (!cancelled) setStatus("error");
      }
    };

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [profileEmail]);

  // The viewer can edit only if their email matches the email of the profile being viewed
  const canEdit =
    status === "found" &&
    Boolean(loggedUser?.email) &&
    loggedUser.email.toLowerCase() === profileData.email.toLowerCase();

  // No email in the address and nobody logged in
  if (!profileEmail) {
    return (
      <main style={{ ...formStyles.page, flex: 1 }}>
        <p style={{ color: "#9a9a9a" }}>No profile selected.</p>
      </main>
    );
  }

  // What to show for email and age in each situation
  let email = "Loading...";
  let age = null; // null hides the Age line
  if (status === "found") {
    email = profileData.email;
    age = profileData.age;
  } else if (status === "notfound") {
    email = "User not found";
    age = "Unknown";
  } else if (status === "error") {
    email = "Unavailable";
    age = "Unavailable";
  }

  // Users don't have a name yet: For now, we use a name passed by the link we came from,
  // otherwise the start of the email (used for the photo's letter)
  const name = location.state?.name || profileEmail.split("@")[0];

  return (
    <main style={{ ...formStyles.page, flex: 1, display: "flex" }}>
      {/* key: switching between profiles starts the card fresh */}
      <Profile
        key={profileEmail}
        name={name}
        email={email}
        age={age}
        canEdit={canEdit}
      />
    </main>
  );
}

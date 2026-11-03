import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useLocation, useNavigate } from "react-router-dom";
import Profile from "../components/Profile";
import PageLayout from "../components/PageLayout";
import { request, clearLogin } from "../utils/api";

// Shows a profile: /profile?username=anna or /profile?email=someone@example.com
// Without either it shows the logged-in user's own profile.
export default function ProfilePage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

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

  // Which profile is being viewed: a username, an email, or (nothing in the address) the logged-in user
  const usernameParam = searchParams.get("username");
  const profileEmail = searchParams.get("email") || (usernameParam ? null : loggedUser?.email);
  const profileKey = usernameParam || profileEmail; // identifies the profile

  // The viewer owns this profile when they are logged in as the very user being viewed
  const sameEmail = (a, b) =>
    Boolean(a) && Boolean(b) && a.trim().toLowerCase() === b.trim().toLowerCase();
  const isOwner = usernameParam
    ? Boolean(loggedUser?.username) && loggedUser.username === usernameParam
    : sameEmail(loggedUser?.email, profileEmail);

  // The viewed profile, from the server. status: "loading" | "found" | "notfound" | "error"
  const [status, setStatus] = useState("loading");
  const [profile, setProfile] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  // The login stopped being valid (the token lasts 1 hour)
  const expireSession = () => {
    clearLogin();
    setSessionExpired(true);
  };

  useEffect(() => {
    if (!profileKey) return;
    let cancelled = false;

    setStatus("loading");
    setProfile(null);

    const loadProfile = async () => {
      try {
        // The owner gets everything about themselves (even what is hidden from others).
        // Everyone else gets the public version, without what the owner chose to hide.
        const data = isOwner
          ? await request("/api/user/profile", { auth: true })
          : await request(
              `/api/user/user-info?${usernameParam ? "username" : "email"}=${encodeURIComponent(profileKey)}`
            );

        if (!cancelled) {
          setProfile(data.user);
          setStatus("found");
        }
      } catch (err) {
        if (cancelled) return;
        if (isOwner && err.status === 401) {
          expireSession(); // this reloads the page as a visitor
        } else if (err.status === 404 && err.hasMessage) {
          setStatus("notfound"); // no user has this email
        } else {
          console.error("Could not load the profile:", err);
          setStatus("error");
        }
      }
    };

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [profileKey, usernameParam, isOwner]);

  // The owner can edit once their data has loaded (the buttons act on that data)
  const canEdit = isOwner && status === "found";

  // ---- what the buttons on the profile do ----

  // Saves some profile fields, e.g. { aboutMe: "..." } or { hideAge: true }
  const saveProfile = async (fields) => {
    try {
      await request("/api/user/profile", { method: "PUT", auth: true, body: fields });
    } catch (err) {
      if (err.status === 401) {
        expireSession();
        throw new Error("Your session expired. Please sign in again.");
      }
      throw err;
    }
  };

  const handleSavePhoto = (photo) => saveProfile({ photo });
  const handleSaveAbout = (aboutMe) => saveProfile({ aboutMe });
  const handleChangeHide = (field, value) => saveProfile({ [field]: value });

  // Deletes the account, then logs out and goes to the homepage
  const handleDeleteAccount = async () => {
    try {
      await request("/api/user/account", { method: "DELETE", auth: true });
    } catch (err) {
      if (err.status === 401) {
        expireSession();
        throw new Error("Your session expired. Please sign in again.");
      }
      throw err;
    }
    clearLogin();
    navigate("/");
  };

  // "Go See My Reviews": opens the reviews page of the profile being viewed
  const handleSeeReviews = () => {
    if (loggedUser?.email) navigate(`/reviews?email=${encodeURIComponent(loggedUser.email)}`);
  };

  const sessionBanner = sessionExpired && (
    <p className="mb-4 text-danger-text">
      Your session expired. Please{" "}
      <Link to="/sign-in" className="underline">
        sign in
      </Link>{" "}
      again.
    </p>
  );

  // No email in the address and nobody logged in
  if (!profileKey) {
    return (
      <PageLayout page="profile">
        {sessionBanner}
        <p className="text-muted">No profile selected.</p>
      </PageLayout>
    );
  }

  // What to show in each situation. The server leaves out what a user chose to hide,
  // so a missing email / age / About me means "hidden".
  let email = "Loading...";
  let age = null; // null hides the Age line
  if (status === "found") {
    email = profile.email ?? "Hidden";
    age = profile.age ?? "Hidden";
  } else if (status === "notfound") {
    email = "User not found";
    age = "Unknown";
  } else if (status === "error") {
    email = "Unavailable";
    age = "Unavailable";
  }
  const found = status === "found";

  // The photo's letter: the username, else a name passed by the link we came from,
  // else the start of the email
  const name =
    profile?.username || usernameParam || location.state?.name || (profileEmail ?? "").split("@")[0];

  return (
    <PageLayout page="profile" className="flex">
      <div className="flex min-w-0 flex-1 flex-col">
        {sessionBanner}
        {/* key: a new profile, or the data arriving, starts the card fresh */}
        <Profile
          key={`${profileKey}-${status}`}
          name={name}
          email={email}
          age={age}
          photo={found ? profile.photo || "" : ""}
          about={found ? profile.aboutMe || "" : ""}
          aboutHidden={found && profile.aboutMe === undefined}
          hideEmail={Boolean(profile?.hideEmail)}
          hideAge={Boolean(profile?.hideAge)}
          hideAboutMe={Boolean(profile?.hideAboutMe)}
          canEdit={canEdit}
          onSavePhoto={handleSavePhoto}
          onSaveAbout={handleSaveAbout}
          onChangeHide={handleChangeHide}
          onDeleteAccount={handleDeleteAccount}
          onSeeReviews={handleSeeReviews}
        />
      </div>
    </PageLayout>
  );
}

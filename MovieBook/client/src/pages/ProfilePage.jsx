import React, { useState, useEffect } from "react";
import Profile from "../components/Profile";
import formStyles from "./formStyles";

// email tou Giorgiou, mono aftos kanei edit
const GEORGE_EMAIL = "georgerom1999@gmail.com";

// ypologismos ilikias apo dateOfBirth
function calculateAge(dateOfBirth) {
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  // an den exei perasei ta genethlia fetos, -1
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export default function ProfilePage() {
  // diabazoume loggedUser apo localStorage
  const [loggedUser, setLoggedUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  });

  // akoume login/logout alages
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

  // mono o Giorgos mporei na kanei edit
  const isGeorge = loggedUser?.email === GEORGE_EMAIL;

  // an einai o Giorgos, ypologizoume ilikia, alliws null
  const age = isGeorge && loggedUser?.dateOfBirth
    ? calculateAge(loggedUser.dateOfBirth)
    : null;

  return (
    <main style={{ ...formStyles.page, flex: 1, display: "flex" }}>
      <Profile
        name="Romanos Georgios"
        email={GEORGE_EMAIL}
        age={age}
        canEdit={isGeorge}
      />
    </main>
  );
}

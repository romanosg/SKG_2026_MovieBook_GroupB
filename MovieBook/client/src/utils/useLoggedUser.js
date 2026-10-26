import { useEffect, useState } from "react";

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};

// The logged-in user ({ id, email, dateOfBirth }) or null. Updates on login / logout.
export function useLoggedUser() {
  const [user, setUser] = useState(readUser);

  useEffect(() => {
    const update = () => setUser(readUser());
    window.addEventListener("authChange", update);
    return () => window.removeEventListener("authChange", update);
  }, []);

  return user;
}

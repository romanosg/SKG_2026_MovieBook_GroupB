import React from "react";
import Profile from "../components/Profile";
import formStyles from "./formStyles";

export default function ProfilePage() {
  return (
    <main style={{ ...formStyles.page, flex: 1, display: "flex" }}>
      <Profile name="Original" email="originalemail@gmail.com" age={44} />
    </main>
  );
}

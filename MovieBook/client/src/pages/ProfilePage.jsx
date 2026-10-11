import React from "react";
import Profile from "../components/Profile";
import formStyles from "./formStyles";

export default function ProfilePage() {
  return (
    <main style={{ ...formStyles.page, flex: 1, display: "flex" }}>
      <Profile name="Romanos Georgios" email="georgerom1999@gmail.com" age={27} />
    </main>
  );
}

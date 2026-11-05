import React from "react";
import PageLayout from "../components/PageLayout";

// The homepage. It is empty for now.
export default function HomePage() {
  return (
    <PageLayout page="home">
      {/* invisible, but read out by screen readers */}
      <h1 className="sr-only">Home</h1>
    </PageLayout>
  );
}

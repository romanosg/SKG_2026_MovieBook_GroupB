import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import NavBar from "./components/NavBar";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import MoviePage from "./pages/MoviePage";
import ReviewPage from "./pages/ReviewPage";

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-1 flex-col bg-page">
        <NavBar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />
          <Route path="/movies/:id" element={<MoviePage />} />
          <Route path="/reviews" element={<ReviewPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

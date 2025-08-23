import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/login";
import Home from "./pages/home";
import ProtectedRoute from "./ProtectedRoute";
import React from "react";
import CreateQuiz from "./pages/createqz";
import QuizDashboard from "./pages/quizDahboard";
import JoinQuiz from "./pages/joinQuiz";
import Quiz from "./pages/quiz";
import Profile from "./pages/profile";
import Quizinfo from "./pages/qzinfo"
import Quizanalysis from "./pages/Quizanalysis";

function App() {
  return (
    <Router>
      <Routes>
        {/* Default route to login */}
        <Route path="/" element={<Login />} />
        {/* Home page (protected later) */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-quiz"
          element={
            <ProtectedRoute>
              <CreateQuiz />
            </ProtectedRoute>
          }
        />
        <Route
          path="/join-quiz"
          element={
            <ProtectedRoute>
              <JoinQuiz />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz-dashboard"
          element={
            <ProtectedRoute>
              <QuizDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz"
          element={
            <ProtectedRoute>
              <Quiz />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/qzinfo"
          element={
            <ProtectedRoute>
              <Quizinfo />
            </ProtectedRoute>
          }
        />

        <Route
          path="/qzanalysis"
          element={
            <ProtectedRoute>
              <Quizanalysis/>
            </ProtectedRoute>
          }
        />
        {/* If no route matches, redirect */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;

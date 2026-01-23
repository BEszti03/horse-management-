import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import MainPage from "./pages/MainPage";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Horses from "./pages/Horses";
import Calendar from "./pages/Calendar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        <Route path="/" element={<MainPage />} />

        <Route path="/" element={<Navigate to="/home" replace />} />

        
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />


        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
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
          path="/horses"
          element={
            <ProtectedRoute>
              <Horses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <Calendar />
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<h1 style={{ padding: 24 }}>404 – Nincs ilyen oldal</h1>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

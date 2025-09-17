import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./components/home";
import Add from "./pages/add";
import LoginPage from "@/pages/auth/login";
import ResetPassword from "@/pages/auth/reset-password";
import Register from "./pages/auth/register";
import SetNewPassword from "@/pages/auth/set-new-password";
import InsuranceDetailsPage from "./pages/insurance/[id]";
import PortfolioScan from "./pages/portfolio-scan";

function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="/add" element={<Add />} />
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<Register />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />
        <Route path="/auth/set-new-password" element={<SetNewPassword />} />
        <Route path="/insurance/:id" element={<InsuranceDetailsPage />} />
        <Route path="/portfolio-scan" element={<PortfolioScan />} />
      </Routes>
    </Suspense>
  );
}

export default App;
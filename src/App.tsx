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
import Family from "./pages/family";
import Docs from "./pages/docs";
import Claims from "./pages/claims";
import ClaimWizard from "./pages/claim-wizard";
import ExplainPolicy from "./pages/explain-policy";

function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="/add" element={<Add />} />
        <Route path="/explain" element={<ExplainPolicy />} />
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<Register />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />
        <Route path="/auth/set-new-password" element={<SetNewPassword />} />
        <Route path="/insurance/:id" element={<InsuranceDetailsPage />} />
        <Route path="/portfolio-scan" element={<PortfolioScan />} />
        <Route path="/family" element={<Family />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/claims" element={<Claims />} />
        <Route path="/claims/new" element={<ClaimWizard />} />
      </Routes>
    </Suspense>
  );
}

export default App;
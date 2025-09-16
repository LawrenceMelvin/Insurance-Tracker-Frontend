import { Suspense } from "react";
import { Routes, Route, useRoutes, Navigate } from "react-router-dom";
import Home from "./components/home";
import Add from "./pages/add";
import routes from "tempo-routes";
import LoginPage from "@/pages/auth/login";
import ResetPassword from "@/pages/auth/reset-password";
import Register from "./pages/auth/register";
import SetNewPassword from "@/pages/auth/set-new-password";
import InsuranceDetailsPage from "./pages/insurance/[id]";
import PortfolioScan from "./pages/portfolio-scan";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/set-new-password" element={<SetNewPassword />} />
        <Route path="/add" element={<Add />} />
        <Route path="/add/:id" element={<Add />} />
        <Route path="/insurance/:id" element={<InsuranceDetails />} />
        <Route path="/portfolio-scan" element={<PortfolioScan />} />
      </Routes>
    </Router>
  );
}

export default App;
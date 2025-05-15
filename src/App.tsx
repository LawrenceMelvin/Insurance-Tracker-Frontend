import { Suspense } from "react";
import { Routes, Route, useRoutes, Navigate } from "react-router-dom";
import Home from "./components/home";
import Add from "./pages/add";
import routes from "tempo-routes";
import LoginPage from "@/pages/auth/login";
import ResetPassword from "@/pages/auth/reset-password";

function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="/add" element={<Add />} />
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />
      </Routes>
      {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
    </Suspense>
  );
}

export default App;

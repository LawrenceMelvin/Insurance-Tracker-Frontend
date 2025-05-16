import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import InsuranceCard from "./InsuranceCard";
import { Button } from "./ui/button";

interface Insurance {
  insuranceId: string;
  insuranceName: string;
  insuranceType: string;
  insurancePrice: number;
  insuranceTerm: string;
}

const Home = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null); // null = loading
  const [insurancePolicies, setInsurancePolicies] = useState<Insurance[]>([]);
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    fetch("http://localhost:8080/user", {
      credentials: "include",
    })
      .then(async (res) => {
        if (res.ok) {
          setIsAuthenticated(true);
          const user = await res.json();
          setUserName(user.name || user.username || "");
        } else {
          setIsAuthenticated(false);
          setUserName("");
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
        setUserName("");
      });
  }, [navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      fetch("http://localhost:8080/", {
        credentials: "include",
      })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            setInsurancePolicies(data);
          } else {
            setInsurancePolicies([]);
          }
        })
        .catch(() => setInsurancePolicies([]));
    }
  }, [isAuthenticated]);

  const handleAddInsurance = () => {
    navigate("/add");
  };

  const handleViewDetails = (id: string) => {
    // Navigate to details page or show details modal
    console.log(`View details for policy ${id}`);
  };

  const handleEdit = (id: string) => {
    navigate(`/add?edit=${id}`);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this policy?")) {
      setInsurancePolicies(
        insurancePolicies.filter((policy) => policy.insuranceId !== id),
      );
      // Here you would also make an API call to delete from the backend
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Insurance Tracker
          </h1>
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-gray-600">
                  Welcome, {userName || "User"}
                </span>
                <Button
                  variant="outline"
                  onClick={async () => {
                    // Call backend logout endpoint
                    await fetch("http://localhost:8080/auth/logout", {
                      method: "POST",
                      credentials: "include",
                    });
                    localStorage.removeItem("authToken");
                    setIsAuthenticated(false);
                    setUserName("");
                    // Double-check logout by calling /user
                    fetch("http://localhost:8080/user", { credentials: "include" })
                      .then(res => {
                        if (res.status === 401) {
                          navigate("/auth/login");
                        } else {
                          // fallback: force reload
                          window.location.href = "/auth/login";
                        }
                      });
                  }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => navigate("/auth/login")}
                >
                  Login
                </Button>
                <Button onClick={() => navigate("/auth/register")}>
                  Register
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-semibold text-gray-800">
            Your Insurance Policies
          </h2>
          {isAuthenticated && (
            <Button
              onClick={handleAddInsurance}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Insurance
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-6 justify-center p-6">
          {isAuthenticated ? (
            insurancePolicies.length === 0 ? (
              <div>No insurance policies found.</div>
            ) : (
              insurancePolicies.map((policy) => (
                <InsuranceCard
                  key={policy.insuranceId}
                  insuranceId={policy.insuranceId?.toString()}
                  insuranceName={policy.insuranceName}
                  insuranceType={policy.insuranceType}
                  insurancePrice={policy.insurancePrice}
                  insuranceTerm={
                    typeof policy.insuranceTerm === "number"
                      ? `${policy.insuranceTerm} Year${policy.insuranceTerm > 1 ? "s" : ""}`
                      : policy.insuranceTerm
                  }
                  onView={() => handleViewDetails(policy.insuranceId)}
                  onEdit={() => handleEdit(policy.insuranceId)}
                  onDelete={() => handleDelete(policy.insuranceId)}
                />
              ))
            )
          ) : (
            <div className="text-gray-500 text-lg mt-12">
              Please log in to view your insurance policies.
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Home;

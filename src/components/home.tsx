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
  insuranceFromDate?: string;
  insuranceToDate?: string;
  insuranceTerm?: string;
}

const Home = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null); // null = loading
  const [insurancePolicies, setInsurancePolicies] = useState<Insurance[]>([]);
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    fetch("/api/user", {
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
      fetch("/api/", {
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
    navigate(`/insurance/${id}`);
  };

  const handleEditInsurance = (insuranceId: string) => {
    navigate(`/add?edit=${insuranceId}`);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this policy?")) {
      try {
        const response = await fetch(`/api/insurance/delete/${id}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Failed to delete insurance");
        }
        setInsurancePolicies(
          insurancePolicies.filter((policy) => policy.insuranceId !== id),
        );
      } catch (error) {
        alert("Failed to delete insurance. Please try again.");
        console.error("Delete error:", error);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
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
                    await fetch("/api/auth/logout", {
                      method: "POST",
                      credentials: "include",
                    });
                    localStorage.removeItem("authToken");
                    setIsAuthenticated(false);
                    setUserName("");
                    window.location.href = "/auth/login";
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

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
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
                  insuranceId={policy.insuranceId}
                  insuranceName={policy.insuranceName}
                  insuranceType={policy.insuranceType}
                  insurancePrice={policy.insurancePrice}
                  insuranceToDate={policy.insuranceToDate} // <-- camelCase!
                  onView={() => handleViewDetails(policy.insuranceId)}
                  onEdit={() => handleEditInsurance(policy.insuranceId)}
                  onDelete={() => handleDelete(policy.insuranceId)}
                />
              ))
            )
          ) : (
            <div className="flex flex-col items-center space-y-8 py-6">
              <div className="text-center max-w-3xl mx-auto px-4">
                <h2 className="text-3xl font-bold text-primary mb-4">
                  Welcome to Insurance Tracker
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  Your all-in-one solution for managing insurance policies with
                  ease.
                </p>

                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Example Insurance Policies
                </h3>
                <div className="flex flex-wrap gap-6 justify-center mb-10">
                  <InsuranceCard
                    insuranceId="example-1"
                    insuranceName="HealthGuard Plus"
                    insuranceType="Health"
                    insurancePrice={1200}
                    insuranceToDate="2025-06-30"
                  />
                  <InsuranceCard
                    insuranceId="example-2"
                    insuranceName="LifeSecure Premium"
                    insuranceType="Life"
                    insurancePrice={2500}
                    insuranceToDate="2035-12-31"
                  />
                  <InsuranceCard
                    insuranceId="example-3"
                    insuranceName="AutoProtect Complete"
                    insuranceType="Auto"
                    insurancePrice={800}
                    insuranceToDate="2025-03-15"
                  />
                </div>

                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Key Features
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                    <div className="flex justify-center mb-4">
                      <img
                        src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&q=80"
                        alt="Track Policies"
                        className="rounded-lg h-40 w-full object-cover"
                      />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-800">
                      Track All Policies
                    </h3>
                    <p className="text-gray-600">
                      Keep all your insurance policies in one place for easy
                      access and management.
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                    <div className="flex justify-center mb-4">
                      <img
                        src="https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&q=80"
                        alt="Renewal Reminders"
                        className="rounded-lg h-40 w-full object-cover"
                      />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-800">
                      Renewal Reminders
                    </h3>
                    <p className="text-gray-600">
                      Never miss a renewal date with our automated reminder
                      system.
                    </p>
                  </div>
                </div>
                <div className="flex justify-center space-x-4 mt-8">
                  <Button
                    onClick={() => navigate("/auth/register")}
                    size="lg"
                    className="bg-primary hover:bg-primary/90"
                  >
                    Get Started
                  </Button>
                  <Button
                    onClick={() => navigate("/auth/login")}
                    variant="outline"
                    size="lg"
                  >
                    Sign In
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-3 mt-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="bg-primary rounded-full p-0.5 text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-700">
                Insurance Tracker
              </span>
            </div>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-gray-500 hover:text-primary transition-colors duration-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a
                href="#"
                className="text-gray-500 hover:text-primary transition-colors duration-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>
              <a
                href="#"
                className="text-gray-500 hover:text-primary transition-colors duration-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;

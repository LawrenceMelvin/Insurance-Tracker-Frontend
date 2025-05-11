import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import InsuranceCard from "./InsuranceCard";
import { Button } from "./ui/button";

interface Insurance {
  id: string;
  companyName: string;
  type: string;
  price: number;
  tenure: string;
}

const Home = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [insurancePolicies, setInsurancePolicies] = useState<Insurance[]>([
    {
      id: "1",
      companyName: "ABC Insurance",
      type: "Health",
      price: 5000,
      tenure: "1 Year",
    },
    {
      id: "2",
      companyName: "XYZ Insurance",
      type: "Life",
      price: 10000,
      tenure: "5 Years",
    },
    {
      id: "3",
      companyName: "PQR Insurance",
      type: "Auto",
      price: 3000,
      tenure: "1 Year",
    },
  ]);

  useEffect(() => {
    // Check if user is authenticated
    // This would typically involve checking for a token in localStorage or similar
    const token = localStorage.getItem("authToken");
    if (!token) {
      // Redirect to login if not authenticated
      // Commented out for development purposes
      // navigate('/auth/login');
      setIsAuthenticated(false);
    } else {
      setIsAuthenticated(true);
      // Here you would fetch the user's insurance policies from the API
      // For now we're using the mock data defined in state
    }
  }, [navigate]);

  const handleAddInsurance = () => {
    navigate("/add");
  };

  const handleViewDetails = (id: string) => {
    // Navigate to details page or show details modal
    console.log(`View details for policy ${id}`);
  };

  const handleEdit = (id: string) => {
    // Navigate to edit page with the policy ID
    navigate(`/add?edit=${id}`);
  };

  const handleDelete = (id: string) => {
    // Show confirmation dialog and delete if confirmed
    if (window.confirm("Are you sure you want to delete this policy?")) {
      setInsurancePolicies(
        insurancePolicies.filter((policy) => policy.id !== id),
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
                <span className="text-sm text-gray-600">Welcome, User</span>
                <Button
                  variant="outline"
                  onClick={() => {
                    localStorage.removeItem("authToken");
                    setIsAuthenticated(false);
                    navigate("/auth/login");
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
          <Button
            onClick={handleAddInsurance}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Insurance
          </Button>
        </div>

        {insurancePolicies.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">
              You don't have any insurance policies yet.
            </p>
            <Button
              onClick={handleAddInsurance}
              className="mt-4 bg-primary hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Your First Policy
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {insurancePolicies.map((policy) => (
              <InsuranceCard
                key={policy.id}
                insurance={policy}
                onView={() => handleViewDetails(policy.id)}
                onEdit={() => handleEdit(policy.id)}
                onDelete={() => handleDelete(policy.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;

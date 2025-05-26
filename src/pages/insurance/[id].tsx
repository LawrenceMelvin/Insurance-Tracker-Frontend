import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

interface Insurance {
  insuranceId: string;
  insuranceName: string;
  insuranceType: string;
  insurancePrice: number;
  insuranceFromDate?: string;
  insuranceToDate?: string;
}

const InsuranceDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [insurance, setInsurance] = useState<Insurance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [daysRemaining, setDaysRemaining] = useState<number>(0);

  useEffect(() => {
    const fetchInsuranceDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/insurance/${id}`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch insurance details");
        }

        const data = await response.json();
        setInsurance(data);

        // Calculate days remaining
        if (data.insuranceToDate) {
          const expiryDate = new Date(data.insuranceToDate);
          const today = new Date();
          const diffTime = expiryDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          setDaysRemaining(diffDays > 0 ? diffDays : 0);
        }
      } catch (error) {
        console.error("Error fetching insurance details:", error);
        setError("Failed to load insurance details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchInsuranceDetails();
  }, [id]);

  const getInsuranceTypeColor = (type: string = "") => {
    const types: Record<string, string> = {
      Health: "bg-green-100 text-green-800",
      Life: "bg-blue-100 text-blue-800",
      Auto: "bg-orange-100 text-orange-800",
      Home: "bg-purple-100 text-purple-800",
      Travel: "bg-yellow-100 text-yellow-800",
    };
    return types[type] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading insurance details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate("/")} className="w-full">
              Go Back Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!insurance) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Insurance Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The insurance policy you're looking for doesn't exist.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate("/")} className="w-full">
              Go Back Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6 flex items-center text-gray-600"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>

        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gray-50 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl font-bold">
                  {insurance.insuranceName}
                </CardTitle>
                <CardDescription className="text-sm text-gray-500 mt-1">
                  Policy ID: {insurance.insuranceId}
                </CardDescription>
              </div>
              <Badge className={getInsuranceTypeColor(insurance.insuranceType)}>
                {insurance.insuranceType}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold border-b pb-2">
                  Policy Details
                </h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Insurance Type:</span>
                    <span className="font-medium">
                      {insurance.insuranceType}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Premium Amount:</span>
                    <span className="font-medium">
                      ${insurance.insurancePrice?.toLocaleString()}
                    </span>
                  </div>

                  {insurance.insuranceFromDate && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Start Date:</span>
                      <span className="font-medium">
                        {new Date(
                          insurance.insuranceFromDate,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {insurance.insuranceToDate && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Expiry Date:</span>
                      <span className="font-medium">
                        {new Date(
                          insurance.insuranceToDate,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-center justify-center">
                <div className="relative w-48 h-48 rounded-full border-8 border-primary flex items-center justify-center bg-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl group">
                  <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-pulse"></div>
                  <div className="text-center transition-all duration-300 group-hover:transform group-hover:scale-110">
                    <div className="text-5xl font-extrabold text-primary">
                      {daysRemaining}
                    </div>
                    <div className="text-sm font-medium text-gray-600 mt-2">
                      Days Remaining
                    </div>
                  </div>
                </div>

                {daysRemaining <= 30 && (
                  <div className="mt-6 bg-red-50 text-red-700 px-6 py-3 rounded-full text-sm font-medium flex items-center shadow-md animate-pulse hover:bg-red-100 transition-all duration-300">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="font-semibold">Expiring soon!</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between border-t border-gray-100 pt-6">
            <Button
              variant="outline"
              onClick={() => navigate(`/add?edit=${insurance.insuranceId}`)}
            >
              Edit Policy
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (
                  window.confirm("Are you sure you want to delete this policy?")
                ) {
                  fetch(`/api/insurance/delete/${insurance.insuranceId}`, {
                    method: "DELETE",
                    credentials: "include",
                  })
                    .then((response) => {
                      if (response.ok) {
                        navigate("/");
                      } else {
                        throw new Error("Failed to delete insurance");
                      }
                    })
                    .catch((error) => {
                      console.error("Delete error:", error);
                      alert("Failed to delete insurance. Please try again.");
                    });
                }
              }}
            >
              Delete Policy
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default InsuranceDetailsPage;

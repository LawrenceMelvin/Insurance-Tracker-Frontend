import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const apiUrl = import.meta.env.VITE_APP_API_URL;

const AddInsurancePage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    companyName: "",
    insuranceType: "",
    price: "",
    coverageAmount: "",
    startDate: "",
    ExpiryDate: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [insuranceId, setInsuranceId] = useState("");
  const location = useLocation();

  useEffect(() => {
    fetch(`${apiUrl}/user`, {
      credentials: "include",
    })
      .then((res) => {
        if (res.ok) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      })
      .catch(() => setIsAuthenticated(false));
  }, []);

  useEffect(() => {
    // Check if we're in edit mode by looking for an id in the URL search params
    const searchParams = new URLSearchParams(location.search);
    const id = searchParams.get("edit");

    if (id) {
      setIsEditMode(true);
      setInsuranceId(id);

      // Fetch the insurance details to pre-fill the form
      fetch(`${apiUrl}/insurance/${id}`, {
        credentials: "include",
      })
        .then((res) => {
          if (res.ok) {
            return res.json();
          } else {
            throw new Error("Failed to fetch insurance details");
          }
        })
        .then((data) => {
          setFormData({
            companyName: data.insuranceName || "",
            insuranceType: data.insuranceType || "",
            price: data.insurancePrice?.toString() || "",
            coverageAmount: data.insuranceCoverage?.toString() || "",
            startDate: data.insuranceFromDate?.toString() || "",
            ExpiryDate: data.insuranceToDate?.toString() || "",
          });
        })
        .catch((error) => {
          console.error("Error fetching insurance details:", error);
          setSubmitError("Failed to load insurance details. Please try again.");
        });
    }
  }, [location]);

  useEffect(() => {
    if (isAuthenticated === false) {
      navigate("/auth/login");
    }
  }, [isAuthenticated, navigate]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span>Loading...</span>
      </div>
    );
  }

  const insuranceTypes = [
    { value: "health", label: "Health Insurance" },
    { value: "life", label: "Life Insurance" },
    { value: "auto", label: "Auto Insurance" },
    { value: "home", label: "Home Insurance" },
    { value: "travel", label: "Travel Insurance" },
  ];

  // const tenureOptions = [
  //   { value: "1", label: "1 Year" },
  //   { value: "2", label: "2 Years" },
  //   { value: "3", label: "3 Years" },
  //   { value: "5", label: "5 Years" },
  //   { value: "10", label: "10 Years" },
  // ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user selects an option
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = "Company name is required";
    }

    if (!formData.insuranceType) {
      newErrors.insuranceType = "Please select an insurance type";
    }

    if (!formData.price) {
      newErrors.price = "Price is required";
    } else if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = "Please enter a valid price";
    }

    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    }

    if (!formData.ExpiryDate) {
      newErrors.ExpiryDate = "Expiry date is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      // Prepare data for backend
      const payload = {
        insuranceName: formData.companyName,
        insuranceType: formData.insuranceType,
        insurancePrice: Number(formData.price),
        insuranceCoverage: formData.coverageAmount
          ? Number(formData.coverageAmount)
          : undefined,
        insuranceFromDate: formData.startDate,
        insuranceToDate: formData.ExpiryDate,
      };

      const endpoint = isEditMode
        ? `${apiUrl}/insurance/update/${insuranceId}`
        : `${apiUrl}/insurance/add`;

      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to add insurance");
      }

      // Navigate back to home page after successful submission
      navigate("/");
    } catch (error) {
      console.error("Error submitting insurance data:", error);
      setSubmitError("Failed to add insurance. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4 bg-background">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              {isEditMode ? "Edit" : "Add"} Insurance
            </CardTitle>
            <CardDescription>
              Enter the details of your new insurance policy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {submitError && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  name="companyName"
                  placeholder="Enter insurance company name"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className={errors.companyName ? "border-destructive" : ""}
                />
                {errors.companyName && (
                  <p className="text-sm text-destructive">
                    {errors.companyName}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="insuranceType">Insurance Type</Label>
                <Select
                  value={formData.insuranceType}
                  onValueChange={(value) =>
                    handleSelectChange("insuranceType", value)
                  }
                >
                  <SelectTrigger
                    id="insuranceType"
                    className={errors.insuranceType ? "border-destructive" : ""}
                  >
                    <SelectValue placeholder="Select insurance type" />
                  </SelectTrigger>
                  <SelectContent>
                    {insuranceTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.insuranceType && (
                  <p className="text-sm text-destructive">
                    {errors.insuranceType}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  placeholder="Enter insurance price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className={errors.price ? "border-destructive" : ""}
                />
                {errors.price && (
                  <p className="text-sm text-destructive">{errors.price}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="coverageAmount">Coverage Amount</Label>
                <Input
                  id="coverageAmount"
                  name="coverageAmount"
                  type="number"
                  placeholder="Enter coverage amount (optional)"
                  value={formData.coverageAmount}
                  onChange={handleInputChange}
                  className={errors.coverageAmount ? "border-destructive" : ""}
                />
                {errors.coverageAmount && (
                  <p className="text-sm text-destructive">
                    {errors.coverageAmount}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Insurance Start Date</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  placeholder="Select start date"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className={errors.startDate ? "border-destructive" : ""}
                />
                {errors.startDate && (
                  <p className="text-sm text-destructive">{errors.startDate}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ExpiryDate">Expiry Date</Label>
                <Input
                  id="ExpiryDate"
                  name="ExpiryDate"
                  type="date"
                  placeholder="Select expiry date"
                  value={formData.ExpiryDate}
                  onChange={handleInputChange}
                  className={errors.ExpiryDate ? "border-destructive" : ""}
                />
                {errors.ExpiryDate && (
                  <p className="text-sm text-destructive">
                    {errors.ExpiryDate}
                  </p>
                )}
              </div>

              <CardFooter className="flex justify-between px-0 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? isEditMode
                      ? "Updating..."
                      : "Adding..."
                    : isEditMode
                      ? "Update Insurance"
                      : "Add Insurance"}
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddInsurancePage;

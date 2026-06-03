import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, AlertCircle, CheckCircle2, Loader2, ArrowLeft, Download, ExternalLink, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const apiUrl = import.meta.env.VITE_APP_API_URL;

interface Claim {
  claimId: number;
  insuranceId: number;
  belongsToName?: string;
  insurerName: string;
  medicalEvent: string;
  admissionDate: string;
  dischargeDate: string;
  totalClaimedAmount: number;
  status: "DRAFT" | "SUBMITTED" | "REIMBURSED";
  gcsBundleUrl?: string;
  createdDate: string;
}

export default function Claims() {
  const navigate = useNavigate();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(() => {
    return localStorage.getItem("isLoggedIn") === "true" ? null : false;
  });

  useEffect(() => {
    fetch(`${apiUrl}/user`, { credentials: "include" })
      .then(async (res) => {
        if (res.ok) {
          const user = await res.json();
          if (user && user.authenticated === true) {
            setIsAuthenticated(true);
            localStorage.setItem("isLoggedIn", "true");
            return;
          }
        }
        setIsAuthenticated(false);
        localStorage.removeItem("isLoggedIn");
      })
      .catch(() => {
        setIsAuthenticated(false);
        localStorage.removeItem("isLoggedIn");
      });
  }, []);

  useEffect(() => {
    if (isAuthenticated === false) {
      navigate("/auth/login");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated !== true) return;

    fetch(`${apiUrl}/api/claims`, { credentials: "include" })
      .then(async (res) => {
        if (res.ok) {
          setClaims(await res.json());
        }
      })
      .catch((e) => console.error("Error fetching claims", e))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const deleteClaim = async (claimId: number) => {
    if (!window.confirm("Are you sure you want to delete this draft claim? This will remove all uploaded documents.")) {
      return;
    }
    try {
      const res = await fetch(`${apiUrl}/api/claims/${claimId}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (res.ok) {
        setClaims((prev) => prev.filter((c) => c.claimId !== claimId));
      } else {
        alert("Failed to delete draft claim.");
      }
    } catch (e) {
      console.error("Error deleting claim", e);
      alert("An error occurred while deleting the draft.");
    }
  };

  const getStatusBadge = (status: Claim["status"]) => {
    switch (status) {
      case "DRAFT":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Draft</Badge>;
      case "SUBMITTED":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Submitted</Badge>;
      case "REIMBURSED":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Reimbursed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium font-outfit">Loading your claims history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <h1 
              className="text-2xl font-bold text-gray-900 cursor-pointer"
              onClick={() => navigate("/")}
            >
              Insurance Tracker
            </h1>
            <span
              onClick={() => navigate("/claims")}
              className="text-sm font-medium text-indigo-600 cursor-pointer border-b-2 border-indigo-600 pb-0.5"
            >
              Claims
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Dashboard
          </Button>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Claims History</h2>
            <p className="text-gray-500 mt-1">Manage and file reimbursement claims for your family policies</p>
          </div>
          <Button 
            onClick={() => navigate("/claims/new")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="h-5 w-5" />
            File New Claim
          </Button>
        </div>

        {claims.length === 0 ? (
          <Card className="border-dashed border-2 border-gray-200 py-16 text-center">
            <CardContent className="space-y-4">
              <div className="bg-indigo-50 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto text-indigo-600">
                <FileText className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-800">No claims filed yet</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  When you have medical expenses that require reimbursement from your insurer, file a claim here to organize and pre-audit your documents.
                </p>
              </div>
              <Button 
                onClick={() => navigate("/claims/new")}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                File Your First Claim
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {claims.map((claim) => (
              <Card key={claim.claimId} className="shadow-sm border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-3 flex flex-row justify-between items-center gap-4 flex-wrap">
                  <div>
                    <CardTitle className="text-lg font-bold text-gray-900">{claim.medicalEvent}</CardTitle>
                    <CardDescription className="text-xs text-gray-500 mt-0.5">
                      Insurer: <strong className="text-gray-700">{claim.insurerName}</strong> | Patient: <strong className="text-gray-700">{claim.belongsToName || "Self"}</strong>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(claim.status)}
                    <span className="text-xs text-gray-400">Filed {new Date(claim.createdDate).toLocaleDateString()}</span>
                  </div>
                </CardHeader>
                <CardContent className="py-4 flex justify-between items-center flex-wrap gap-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-10">
                    <div>
                      <span className="text-xs text-gray-400 block uppercase font-semibold">Admission</span>
                      <span className="text-sm font-medium text-gray-800">{new Date(claim.admissionDate).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 block uppercase font-semibold">Discharge</span>
                      <span className="text-sm font-medium text-gray-800">{new Date(claim.dischargeDate).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 block uppercase font-semibold">Claimed Amount</span>
                      <span className="text-sm font-bold text-slate-800">
                        {claim.totalClaimedAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {claim.gcsBundleUrl ? (
                      <Button
                        onClick={() => window.open(claim.gcsBundleUrl, "_blank")}
                        variant="outline"
                        size="sm"
                        className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 flex items-center gap-1.5"
                      >
                        <Download className="h-4 w-4" /> Download PDF Bundle
                      </Button>
                    ) : (
                      <div className="flex gap-2 items-center">
                        <Button
                          onClick={() => deleteClaim(claim.claimId)}
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                          title="Delete Draft"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </Button>
                        <Button
                          onClick={() => navigate(`/claims/new?edit=${claim.claimId}`)}
                          variant="outline"
                          size="sm"
                          className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                        >
                          Continue Draft
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

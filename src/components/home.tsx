import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Users, Scan, UserPlus, Mail, FileText, Sparkles, Calculator } from "lucide-react";
import InsuranceCard from "./InsuranceCard";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface Insurance {
  insuranceId: string;
  insuranceName: string;
  insuranceType: string;
  insurancePrice: number;
  insuranceCoverage: number;
  insuranceFromDate?: string;
  insuranceToDate?: string;
  insuranceTerm?: string;
  belongsToName?: string;
  policyAnalysisJson?: string;
}

const apiUrl = import.meta.env.VITE_APP_API_URL;

const CardSkeleton = () => (
  <div className="w-[350px] h-[220px] bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between animate-pulse">
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div className="h-5 bg-gray-200 rounded-md w-1/2"></div>
        <div className="h-5 bg-gray-200 rounded-full w-16"></div>
      </div>
      <div className="h-4 bg-gray-200 rounded-md w-1/3"></div>
      <div className="space-y-2 pt-2">
        <div className="flex justify-between">
          <div className="h-3 bg-gray-200 rounded-md w-12"></div>
          <div className="h-3 bg-gray-200 rounded-md w-16"></div>
        </div>
        <div className="flex justify-between">
          <div className="h-3 bg-gray-200 rounded-md w-12"></div>
          <div className="h-3 bg-gray-200 rounded-md w-24"></div>
        </div>
      </div>
    </div>
    <div className="flex justify-between border-t border-gray-100 pt-3 mt-2">
      <div className="h-4 bg-gray-200 rounded-md w-12"></div>
      <div className="h-4 bg-gray-200 rounded-md w-12"></div>
      <div className="h-4 bg-gray-200 rounded-md w-12"></div>
    </div>
  </div>
);

const Home = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(() => {
    return localStorage.getItem("isLoggedIn") === "true" ? null : false;
  });
  const [myPolicies, setMyPolicies] = useState<Insurance[]>([]);
  const [familyPolicies, setFamilyPolicies] = useState<Insurance[]>([]);
  const [activeTab, setActiveTab] = useState<"my" | "family">("my");
  const [userName, setUserName] = useState<string>("");
  const [inFamily, setInFamily] = useState<boolean | null>(null);
  const [myPoliciesLoading, setMyPoliciesLoading] = useState(true);
  const [familyPoliciesLoading, setFamilyPoliciesLoading] = useState(true);

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      setIsInviting(true);
      setInviteError(null);
      setInviteSuccess(null);
      const res = await fetch(`${apiUrl}/family/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
        credentials: "include",
      });

      const data = await res.json();
      if (res.ok) {
        setInviteSuccess(`User ${inviteEmail} linked successfully!`);
        setInviteEmail("");
        // Reload family policies/members
        fetch(`${apiUrl}/family/insurance`, { credentials: "include" })
          .then(async (r) => {
            if (r.ok) setFamilyPolicies(await r.json());
          });
        setTimeout(() => {
          setIsInviteOpen(false);
          setInviteSuccess(null);
        }, 2000);
      } else {
        throw new Error(data.message || "Failed to invite user");
      }
    } catch (err: any) {
      setInviteError(err.message || "Something went wrong.");
    } finally {
      setIsInviting(false);
    }
  };

  useEffect(() => {
    fetch(`${apiUrl}/user`, { credentials: "include" })
      .then(async (res) => {
        if (res.ok) {
          const user = await res.json();
          if (user && user.authenticated === true) {
            setIsAuthenticated(true);
            setUserName(user.name || user.username || "");
            localStorage.setItem("isLoggedIn", "true");
            return;
          }
        }
        setIsAuthenticated(false);
        setUserName("");
        localStorage.removeItem("isLoggedIn");
      })
      .catch(() => {
        setIsAuthenticated(false);
        setUserName("");
        localStorage.removeItem("isLoggedIn");
      });
  }, [navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Fetch own policies
    setMyPoliciesLoading(true);
    fetch(`${apiUrl}/`, { credentials: "include" })
      .then(async (res) => {
        if (res.ok) setMyPolicies(await res.json());
        else setMyPolicies([]);
      })
      .catch(() => setMyPolicies([]))
      .finally(() => setMyPoliciesLoading(false));

    // Fetch family members status
    fetch(`${apiUrl}/family/members`, { credentials: "include" })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setInFamily(data.inFamily === true);
        }
      })
      .catch(() => setInFamily(false));
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || inFamily !== true) return;

    setFamilyPoliciesLoading(true);
    fetch(`${apiUrl}/family/insurance`, { credentials: "include" })
      .then(async (res) => {
        if (res.ok) setFamilyPolicies(await res.json());
        else setFamilyPolicies([]);
      })
      .catch(() => setFamilyPolicies([]))
      .finally(() => setFamilyPoliciesLoading(false));
  }, [isAuthenticated, inFamily]);

  const insurancePolicies = activeTab === "my" ? myPolicies : familyPolicies;
  const isTabLoading = activeTab === "my" ? myPoliciesLoading : familyPoliciesLoading;

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this policy?")) {
      try {
        const response = await fetch(`${apiUrl}/insurance/delete/${id}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to delete insurance");
        setMyPolicies(myPolicies.filter((p) => p.insuranceId !== id));
        setFamilyPolicies(familyPolicies.filter((p) => p.insuranceId !== id));
      } catch {
        alert("Failed to delete insurance. Please try again.");
      }
    }
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Insurance Tracker</h1>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-slate-600 font-medium">Loading your dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <h1 
              className="text-2xl font-bold text-gray-900 cursor-pointer"
              onClick={() => navigate("/")}
            >
              Insurance Tracker
            </h1>
            {!isAuthenticated && (
              <span
                onClick={() => navigate("/docs")}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 cursor-pointer transition-colors"
              >
                Docs
              </span>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-gray-600">
                  Welcome, {userName || "User"}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/family")}
                  className="flex items-center gap-1 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                >
                  <Users className="h-4 w-4" />
                  Family
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/claims")}
                  className="flex items-center gap-1 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                >
                  <FileText className="h-4 w-4" />
                  Claims
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/explain")}
                  className="flex items-center gap-1 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                >
                  <Sparkles className="h-4 w-4 text-indigo-500" />
                  AI Explainer
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/estimate")}
                  className="flex items-center gap-1 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                >
                  <Calculator className="h-4 w-4 text-indigo-500" />
                  Estimator
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await fetch(`${apiUrl}/auth/logout`, {
                      method: "POST",
                      credentials: "include",
                    });
                    localStorage.removeItem("authToken");
                    localStorage.removeItem("isLoggedIn");
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
                <Button variant="outline" onClick={() => navigate("/auth/login")}>
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
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {isAuthenticated ? (
          <>
            {/* Tab Bar + Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              {/* Tabs */}
              <div className="flex rounded-lg border border-gray-200 overflow-hidden w-fit bg-white shadow-sm">
                <button
                  onClick={() => setActiveTab("my")}
                  className={`px-5 py-2 text-sm font-medium transition-colors ${
                    activeTab === "my"
                      ? "bg-primary text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  My Policies
                  {myPolicies.length > 0 && (
                    <span className={`ml-2 text-xs rounded-full px-1.5 py-0.5 ${activeTab === "my" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                      {myPolicies.length}
                    </span>
                  )}
                </button>
                {inFamily && (
                  <button
                    onClick={() => setActiveTab("family")}
                    className={`px-5 py-2 text-sm font-medium transition-colors border-l border-gray-200 flex items-center gap-1.5 ${
                      activeTab === "family"
                        ? "bg-indigo-600 text-white"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Users className="h-4 w-4" />
                    Family Policies
                    {familyPolicies.length > 0 && (
                      <span className={`ml-1 text-xs rounded-full px-1.5 py-0.5 ${activeTab === "family" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                        {familyPolicies.length}
                      </span>
                    )}
                  </button>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                {activeTab === "family" && (
                  <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 flex items-center"
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Link Member
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <form onSubmit={handleInviteUser}>
                        <DialogHeader>
                          <DialogTitle>Link Family Member</DialogTitle>
                          <DialogDescription>
                            Invite an existing user of InsureTracks by email to join your family group and share insurance coverage views.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          {inviteError && (
                            <p className="text-sm text-red-600 bg-red-50 p-2.5 rounded border border-red-100">
                              {inviteError}
                            </p>
                          )}
                          {inviteSuccess && (
                            <p className="text-sm text-emerald-600 bg-emerald-50 p-2.5 rounded border border-emerald-100">
                              {inviteSuccess}
                            </p>
                          )}
                          <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                id="email"
                                type="email"
                                placeholder="spouse@email.com"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                className="pl-9"
                                required
                              />
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsInviteOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            disabled={isInviting}
                            className="bg-indigo-600 hover:bg-indigo-700"
                          >
                            {isInviting ? "Linking..." : "Link Member"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
                <Button
                  onClick={() =>
                    navigate("/portfolio-scan", {
                      state: { insurancePolicies },
                    })
                  }
                  className="bg-purple-600 hover:bg-purple-700 flex items-center"
                >
                  <Scan className="mr-2 h-4 w-4" />
                  Portfolio Scan
                </Button>
                <Button
                  onClick={() => navigate("/explain")}
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white flex items-center border-none shadow-md shadow-indigo-100 font-medium"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  AI Explainer
                </Button>
                <Button
                  onClick={() => navigate("/estimate")}
                  className="bg-teal-600 hover:bg-teal-700 text-white flex items-center shadow-md shadow-teal-100 font-medium"
                >
                  <Calculator className="mr-2 h-4 w-4" />
                  Estimator
                </Button>
                <Button
                  onClick={() => navigate("/add")}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Insurance
                </Button>
              </div>
            </div>

            {/* Family banner when no group exists */}
            {inFamily === false && (
              <div
                onClick={() => navigate("/family")}
                className="mb-6 flex items-center gap-3 p-4 rounded-lg border border-indigo-100 bg-indigo-50 cursor-pointer hover:bg-indigo-100 transition-colors"
              >
                <Users className="h-5 w-5 text-indigo-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-indigo-800">Set up your Family Insurance Workspace</p>
                  <p className="text-xs text-indigo-600">
                    Add family members, tag cards with them, and let everyone in the family see the pooled coverage.
                  </p>
                </div>
                <span className="ml-auto text-indigo-600 text-sm font-medium shrink-0">Set up →</span>
              </div>
            )}

            {/* Cards grid */}
            <div className="flex flex-wrap gap-6 justify-center p-2">
              {isTabLoading ? (
                <>
                  <CardSkeleton />
                  <CardSkeleton />
                  <CardSkeleton />
                </>
              ) : insurancePolicies.length === 0 ? (
                <div className="text-center py-16 text-gray-400 w-full">
                  <p className="text-lg font-medium">
                    {activeTab === "family"
                      ? "No family policies found."
                      : "No insurance policies found."}
                  </p>
                  <p className="text-sm mt-1">
                    {activeTab === "my"
                      ? 'Click "Add Insurance" to add your first policy.'
                      : "Policies added by any family member will appear here."}
                  </p>
                </div>
              ) : (
                insurancePolicies.map((policy) => (
                  <InsuranceCard
                    key={policy.insuranceId}
                    insuranceId={policy.insuranceId}
                    insuranceName={policy.insuranceName}
                    insuranceType={policy.insuranceType}
                    insurancePrice={policy.insurancePrice}
                    insuranceCoverage={policy.insuranceCoverage}
                    insuranceToDate={policy.insuranceToDate}
                    belongsToName={policy.belongsToName}
                    policyAnalysisJson={policy.policyAnalysisJson}
                    onView={() => navigate(`/insurance/${policy.insuranceId}`)}
                    onEdit={() => navigate(`/add?edit=${policy.insuranceId}`)}
                    onDelete={() => handleDelete(policy.insuranceId)}
                  />
                ))
              )}
            </div>
          </>
        ) : (
          /* Landing page for unauthenticated users */
          <div className="flex flex-col items-center space-y-8 py-6">
            <div className="text-center max-w-3xl mx-auto px-4">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">
                Welcome to InsureTrack
              </h1>

              <div className="flex justify-center gap-3 mb-6">
                <Button
                  onClick={() => navigate("/portfolio-scan")}
                  className="bg-purple-600 hover:bg-purple-700 flex items-center"
                >
                  <Scan className="mr-2 h-4 w-4" />
                  Portfolio Scan
                </Button>
                <Button
                  onClick={() => navigate("/explain")}
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white flex items-center border-none shadow-md shadow-indigo-100 font-medium animate-pulse"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  AI Explainer
                </Button>
                <Button
                  onClick={() => navigate("/add")}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Insurance
                </Button>
              </div>

              <p className="text-lg text-gray-600 mb-6">
                Your all-in-one solution for managing insurance policies with ease.
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
                  insuranceCoverage={500000}
                  insuranceToDate="2025-06-30"
                />
                <InsuranceCard
                  insuranceId="example-2"
                  insuranceName="LifeSecure Premium"
                  insuranceType="Life"
                  insurancePrice={2500}
                  insuranceCoverage={1000000}
                  insuranceToDate="2035-12-31"
                  belongsToName="Spouse"
                />
                <InsuranceCard
                  insuranceId="example-3"
                  insuranceName="AutoProtect Complete"
                  insuranceType="Auto"
                  insurancePrice={800}
                  insuranceCoverage={50000}
                  insuranceToDate="2025-03-15"
                />
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Key Features
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                    Keep all your insurance policies in one place for easy access and management.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                  <div className="flex justify-center mb-4">
                    <img
                      src="https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&q=80"
                      alt="Family Coverage"
                      className="rounded-lg h-40 w-full object-cover"
                    />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">
                    Family Coverage View
                  </h3>
                  <p className="text-gray-600">
                    See all your family's insurance coverage in one pooled view.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                  <div className="flex justify-center mb-4">
                    <img
                      src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&q=80"
                      alt="AI Profile Scan"
                      className="rounded-lg h-40 w-full object-cover"
                    />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">
                    AI Insurance Profile Scan
                  </h3>
                  <p className="text-gray-600">
                    Instantly scan your policies to detect coverage gaps, highlight strengths, and receive smart AI recommendations.
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
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-3 mt-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="bg-primary rounded-full p-0.5 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-700">Insurance Tracker</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
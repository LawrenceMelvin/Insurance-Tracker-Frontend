import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BookOpen,
  Heart,
  Activity,
  Car,
  Home as HomeIcon,
  ArrowLeft,
  Info,
  ShieldCheck
} from "lucide-react";

const apiUrl = import.meta.env.VITE_APP_API_URL;

export default function Docs() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(() => {
    return localStorage.getItem("isLoggedIn") === "true" ? null : false;
  });
  const [userName, setUserName] = useState("");
  const [activeSection, setActiveSection] = useState("health");

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
        localStorage.removeItem("isLoggedIn");
      })
      .catch(() => {
        setIsAuthenticated(false);
        localStorage.removeItem("isLoggedIn");
      });
  }, []);

  const handleLogout = async () => {
    await fetch(`${apiUrl}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    localStorage.removeItem("isLoggedIn");
    setIsAuthenticated(false);
    setUserName("");
    window.location.href = "/auth/login";
  };

  const sections = [
    { id: "health", label: "Health Insurance", icon: Activity },
    { id: "life", label: "Life Insurance", icon: Heart },
    { id: "auto", label: "Auto Insurance", icon: Car },
    { id: "home", label: "Home & Renters", icon: HomeIcon },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
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
                className="text-sm font-medium text-indigo-600 hover:text-indigo-800 cursor-pointer transition-colors border-b-2 border-indigo-600 pb-0.5"
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
                <Button variant="outline" size="sm" onClick={handleLogout}>
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

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white py-12 px-4 sm:px-6 lg:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto text-center">
          <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-90" />
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Insurance 101 Guide
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-indigo-100">
            A comprehensive primer on understanding core concepts, term types, and coverage targets for essential insurance policies.
          </p>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-grow flex flex-col md:flex-row gap-8">
        
        {/* Sticky Sidebar Navigation */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="sticky top-24 space-y-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="flex items-center text-gray-600 w-full justify-start hover:bg-gray-100"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
            </Button>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Policy Categories</span>
              </div>
              <nav className="p-2 space-y-1">
                {sections.map((s) => {
                  const Icon = s.icon;
                  const isActive = activeSection === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setActiveSection(s.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-indigo-50 text-indigo-700"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <Icon className={`h-4.5 w-4.5 ${isActive ? "text-indigo-600" : "text-gray-400"}`} />
                      <span>{s.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </aside>

        {/* Detailed Sections View */}
        <main className="flex-1 min-w-0">
          {activeSection === "health" && (
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="bg-indigo-50/20 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700">
                    <Activity className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900">Health Insurance</CardTitle>
                    <CardDescription>Understanding medical coverage, terms, and structures</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="prose max-w-none text-slate-600 space-y-4">
                  <p>
                    Health insurance protects you from high medical costs by sharing the expense of medical care. Understanding key financial terms is crucial for choosing and using a policy effectively.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
                    <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                      <span className="font-semibold text-gray-800 block mb-1">Premium</span>
                      <p className="text-sm">The amount you pay to your insurance company monthly or annually to keep your plan active, regardless of whether you receive care.</p>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                      <span className="font-semibold text-gray-800 block mb-1">Deductible</span>
                      <p className="text-sm">The amount you must pay out-of-pocket for medical services before your insurance company begins to pay its share.</p>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                      <span className="font-semibold text-gray-800 block mb-1">Copayment (Copay)</span>
                      <p className="text-sm">A flat fee you pay for a specific service or prescription (e.g., $20 for a doctor visit) at the time of care.</p>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                      <span className="font-semibold text-gray-800 block mb-1">Out-of-Pocket Maximum</span>
                      <p className="text-sm">The absolute limit on what you pay in a year for covered services. Once reached, the insurance covers 100% of costs.</p>
                    </div>
                  </div>

                  <AlertCard title="Pro Tip: Critical Illness Rider" description="Many standard plans cover hospitalization but don't cover loss of income during major illnesses (like cancer or stroke). Consider a Critical Illness Rider that pays out a lump sum upon diagnosis." />
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === "life" && (
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="bg-red-50/20 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-100 rounded-lg text-red-700">
                    <Heart className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900">Life Insurance</CardTitle>
                    <CardDescription>Securing financial protection for dependents and family</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="prose max-w-none text-slate-600 space-y-4">
                  <p>
                    Life insurance guarantees a financial payout (death benefit) to beneficiaries in the event of the insured's death. It acts as a safety net to replace income and cover obligations.
                  </p>

                  <h4 className="text-lg font-bold text-gray-800 mt-4 mb-2">Term Life vs. Whole Life</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border border-slate-100 shadow-sm bg-white">
                      <span className="font-bold text-slate-800 block mb-2">Term Life Insurance</span>
                      <ul className="text-sm space-y-1.5 list-disc list-inside">
                        <li>Covers you for a specific period (e.g., 10, 20, or 30 years).</li>
                        <li>Significantly cheaper premiums.</li>
                        <li>Pure protection with no savings or cash value component.</li>
                        <li>Ideal for coverage during high-expense years (mortgage, raising children).</li>
                      </ul>
                    </div>
                    <div className="p-4 rounded-lg border border-slate-100 shadow-sm bg-white">
                      <span className="font-bold text-slate-800 block mb-2">Whole Life (Permanent)</span>
                      <ul className="text-sm space-y-1.5 list-disc list-inside">
                        <li>Covers you for your entire lifetime.</li>
                        <li>Higher, locked-in premiums.</li>
                        <li>Accumulates a cash value component that grows over time.</li>
                        <li>Useful for estate planning or long-term wealth transfer.</li>
                      </ul>
                    </div>
                  </div>

                  <h4 className="text-lg font-bold text-gray-800 mt-6 mb-2">Key Recommendation Multipliers</h4>
                  <p className="text-sm">
                    A common benchmark is securing a death benefit equivalent to **10 to 12 times your annual income**. This helps dependents replace your earnings, cover major debts (like mortgages), and fund long-term goals (such as children's university fees).
                  </p>

                  <AlertCard title="Pro Tip: Beneficiary Review" description="Ensure your beneficiaries are clearly designated and reviewed after major life milestones (marriage, divorce, childbirth). The beneficiary designations on policies override directives in a last will." />
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === "auto" && (
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="bg-blue-50/20 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
                    <Car className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900">Auto Insurance</CardTitle>
                    <CardDescription>Navigating vehicular protection and liability</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="prose max-w-none text-slate-600 space-y-4">
                  <p>
                    Vehicle insurance covers damage to your vehicle, liability for injury or property damage to others, and medical costs resulting from accidents.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
                    <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                      <span className="font-semibold text-gray-800 block mb-1">Liability Coverage</span>
                      <p className="text-sm">Covers bodily injury and property damage to *other* parties if you cause an accident. Usually legally mandated.</p>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                      <span className="font-semibold text-gray-800 block mb-1">Collision Coverage</span>
                      <p className="text-sm">Covers repair costs for *your* vehicle after a collision with another car or object, regardless of fault.</p>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                      <span className="font-semibold text-gray-800 block mb-1">Comprehensive Coverage</span>
                      <p className="text-sm">Covers damage to your car caused by non-collision events (e.g., theft, fire, animal collisions, vandalism, weather).</p>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                      <span className="font-semibold text-gray-800 block mb-1">Uninsured Motorist</span>
                      <p className="text-sm">Protects you and your vehicle if you are hit by a driver who has no insurance or insufficient coverage.</p>
                    </div>
                  </div>

                  <AlertCard title="Pro Tip: Deductibles vs. Premiums" description="Raising your deductible (e.g., from $500 to $1,000) can lower your monthly premium significantly. Ensure you keep the deductible amount set aside in an emergency fund." />
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === "home" && (
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="bg-emerald-50/20 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
                    <HomeIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900">Home & Renters Insurance</CardTitle>
                    <CardDescription>Protecting your dwellings and personal belongings</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="prose max-w-none text-slate-600 space-y-4">
                  <p>
                    Home and Renters insurance protect your physical residence, the belongings inside, and provide liability coverage for accidents that occur on your property.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
                    <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                      <span className="font-semibold text-gray-800 block mb-1">Dwelling Coverage</span>
                      <p className="text-sm">Covers the physical structure of your home (walls, roof, foundation) against hazards like fire, windstorms, and lightning.</p>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                      <span className="font-semibold text-gray-800 block mb-1">Personal Property</span>
                      <p className="text-sm">Covers repair or replacement of personal items (furniture, electronics, clothing) whether damaged at home or stolen elsewhere.</p>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                      <span className="font-semibold text-gray-800 block mb-1">Personal Liability</span>
                      <p className="text-sm">Protects you if a guest is injured on your property and sues, covering legal defense fees and medical payouts.</p>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                      <span className="font-semibold text-gray-800 block mb-1">Loss of Use (ALE)</span>
                      <p className="text-sm">Covers temporary living expenses (hotel bills, food) if your home is rendered uninhabitable by a covered event.</p>
                    </div>
                  </div>

                  <AlertCard title="Pro Tip: Replacement Cost vs. Actual Cash Value" description="Always check if your policy pays 'Replacement Cost' or 'Actual Cash Value' (ACV). ACV deducts depreciation, meaning you won't get enough to buy new items of similar quality." />
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}

// Internal reusable helper component
function AlertCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-start space-x-3 p-4 bg-indigo-50/50 rounded-lg border border-indigo-100 text-indigo-900 mt-6">
      <Info className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
      <div>
        <h5 className="font-bold text-sm text-indigo-950 flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-indigo-600" />
          {title}
        </h5>
        <p className="text-xs text-indigo-800 mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

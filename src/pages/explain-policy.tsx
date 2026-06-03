import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  ArrowLeft,
  FileText,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  FileSearch,
  ChevronRight,
  ShieldCheck,
  Calendar,
  Sparkles,
  Info,
  Layers,
  Heart,
  User,
  Activity,
  Home as HomeIcon,
  ShieldAlert,
  Zap,
  Car
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

const apiUrl = import.meta.env.VITE_APP_API_URL;

interface HealthDetails {
  deductiblesIndividual?: number;
  deductiblesFamily?: number;
  coinsurancePercentage?: number;
  outOfPocketMaximum?: number;
  preExistingConditionsLimitations?: string;
  copaymentsSpecialist?: number;
}

interface LifeDetails {
  deathBenefitAmount?: number;
  beneficiaryRevocability?: string;
  suicideExclusionPeriodMonths?: number;
  contestabilityPeriodYears?: number;
  accidentalDeathRiderPayout?: number;
}

interface HomeDetails {
  dwellingLimit?: number;
  otherStructuresLimit?: number;
  personalPropertyLimit?: number;
  occupancyRestrictionClause?: string;
  hazardExclusions?: string[];
  deductibleWindHail?: number;
}

interface AutoDetails {
  deductibleIndividual?: number;
  deductibleCompulsory?: number;
  deductibleVoluntary?: number;
  zeroDepreciationCoverage?: string;
  noClaimBonusPercentage?: number;
  insuredDeclaredValueIdv?: number;
  exclusions?: string[];
}

interface DisabilityDetails {
  eliminationPeriodDays?: number;
  definitionOfDisability?: string;
  monthlyBenefitPercentage?: number;
  benefitDurationPeriod?: string;
  mentalHealthLimitationMonths?: number;
}

interface PolicyAnalysis {
  policyNumber?: string;
  insurerName?: string;
  policyholderName?: string;
  effectiveDate?: string;
  expirationDate?: string;
  insuranceType?: string; // health, life, home, disability, auto, travel
  healthDetails?: HealthDetails;
  lifeDetails?: LifeDetails;
  homeDetails?: HomeDetails;
  autoDetails?: AutoDetails;
  disabilityDetails?: DisabilityDetails;
  unusualExclusionsRedFlags?: string[];
  claimsSubmissionProcedure?: string;
}

const ExplainPolicy = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(() => {
    return localStorage.getItem("isLoggedIn") === "true" ? null : false;
  });
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<PolicyAnalysis | null>(null);
  const [redFlagsPage, setRedFlagsPage] = useState(0);

  useEffect(() => {
    setRedFlagsPage(0);
  }, [analysis]);

  const loadingSteps = [
    "Verifying PDF document integrity...",
    "Scanning text layers & font structures...",
    "Staging document temporarily via Google Files API...",
    "Consulting Gemini 2.5 Flash for deep clause extraction...",
    "Analyzing sub-limits, exclusions, & copay policies...",
    "Formatting structured analysis dashboard..."
  ];

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
    if (!isLoading) return;
    setLoadingStep(0);
    const interval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev < loadingSteps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 4500);
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const selectedFile = files[0];
      if (selectedFile.type !== "application/pdf") {
        setError("Only PDF files are supported.");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = e.target.files;
    if (files && files.length > 0) {
      const selectedFile = files[0];
      if (selectedFile.type !== "application/pdf") {
        setError("Only PDF files are supported.");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUploadSubmit = async () => {
    if (!file) return;
    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${apiUrl}/insurance/explain`, {
        method: "POST",
        credentials: "include",
        body: formData
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to analyze policy document.");
      }

      const result = await response.json();
      setAnalysis(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong during policy scanning.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToPolicies = () => {
    if (!analysis) return;
    // Map parsed analysis to prefilled form state in /add page
    const prefillData = {
      companyName: analysis.insurerName || "",
      insuranceType: (analysis.insuranceType || "health").toLowerCase(),
      price: "", // Price has to be entered manually by the user
      coverageAmount: getCoverageAmountFromAnalysis(analysis),
      startDate: analysis.effectiveDate || "",
      ExpiryDate: analysis.expirationDate || "",
      policyAnalysisJson: JSON.stringify(analysis)
    };
    navigate("/add", { state: { prefillData } });
  };

  const getCoverageAmountFromAnalysis = (data: PolicyAnalysis): string => {
    if (data.healthDetails?.outOfPocketMaximum) return String(data.healthDetails.outOfPocketMaximum);
    if (data.lifeDetails?.deathBenefitAmount) return String(data.lifeDetails.deathBenefitAmount);
    if (data.homeDetails?.dwellingLimit) return String(data.homeDetails.dwellingLimit);
    if (data.autoDetails?.insuredDeclaredValueIdv) return String(data.autoDetails.insuredDeclaredValueIdv);
    return "";
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16 font-sans">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="text-gray-500 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-500 fill-indigo-200" />
              AI Policy Explainer
            </h1>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/")}>
            Dashboard
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        {!analysis && !isLoading && (
          <div className="max-w-xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                Scan Your Policy Booklet
              </h2>
              <p className="text-gray-500 text-sm">
                Upload your insurance PDF document. Gemini will dissect co-pays, deductibles, waiting periods, and hidden clauses on the fly.
              </p>
            </div>

            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertTitle className="font-semibold">Analysis Failed</AlertTitle>
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            )}

            <Card
              className={`border-2 border-dashed rounded-2xl transition-all duration-300 p-8 flex flex-col items-center justify-center text-center cursor-pointer ${
                isDragging
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <input
                id="file-input"
                type="file"
                className="hidden"
                accept=".pdf"
                onChange={handleFileChange}
              />
              <div className="h-16 w-16 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4 shadow-inner">
                <Upload className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-gray-700">
                  {file ? file.name : "Drag & drop your policy PDF here"}
                </p>
                <p className="text-xs text-gray-400">
                  {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : "Supports PDF files up to 25MB"}
                </p>
              </div>
              {!file && (
                <Button variant="secondary" size="sm" className="mt-4 pointer-events-none">
                  Select File
                </Button>
              )}
            </Card>

            {file && (
              <div className="flex gap-3 justify-end">
                <Button variant="ghost" onClick={() => setFile(null)}>
                  Clear
                </Button>
                <Button
                  onClick={handleUploadSubmit}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 shadow-md shadow-indigo-100"
                >
                  Start AI Explainer
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="max-w-md mx-auto py-16 space-y-8 text-center">
            <div className="relative inline-flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-indigo-600 border-r-4 border-r-indigo-100"></div>
              <FileSearch className="absolute h-8 w-8 text-indigo-600 animate-pulse" />
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-bold text-gray-800">Analyzing Policy...</h3>
              <p className="text-sm text-indigo-600 font-semibold animate-pulse">
                {loadingSteps[loadingStep]}
              </p>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">
                Scanning complex clauses takes roughly 15-30 seconds depending on booklet length.
              </p>
            </div>

            <Progress
              value={((loadingStep + 1) / loadingSteps.length) * 100}
              className="h-2 w-full bg-indigo-50 [&>div]:bg-indigo-600"
            />
          </div>
        )}

        {/* Analysis Dashboard Result */}
        {analysis && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header Status Bar */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border border-indigo-100 capitalize">
                    {analysis.insuranceType} Policy
                  </Badge>
                  <span className="text-xs text-slate-400">Scan Complete</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {analysis.insurerName || "Unknown Insurer"} Explainer
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => { setAnalysis(null); setFile(null); }}>
                  Upload Another
                </Button>
                <Button
                  onClick={handleSaveToPolicies}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md shadow-indigo-100 flex items-center"
                >
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Save to My Policies
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Metadata & Core parameters */}
              <div className="lg:col-span-2 space-y-8">
                {/* 1. Policy Overview Card */}
                <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden">
                  <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Info className="h-4 w-4" />
                      Policy Metadata
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-400">Insured Person</p>
                        <p className="text-sm font-semibold text-slate-800">
                          {analysis.policyholderName || "Not Extracted"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-400">Policy Number</p>
                        <p className="text-sm font-mono font-semibold text-slate-800">
                          {analysis.policyNumber || "Not Extracted"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-400">Effective Date</p>
                        <p className="text-sm font-semibold text-slate-800">
                          {analysis.effectiveDate || "Not Extracted"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-400">Expiration Date</p>
                        <p className="text-sm font-semibold text-slate-800">
                          {analysis.expirationDate || "Not Extracted"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 2. Domain Details Breakdown */}
                {renderDomainDetailsCard(analysis)}

                {/* 3. Claims Submission Guide */}
                <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden">
                  <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      Claims Settlement Procedure
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {analysis.claimsSubmissionProcedure ? (
                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {analysis.claimsSubmissionProcedure}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-400 italic">No specific claim instructions found.</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Warnings, Exclusions, Verdict */}
              <div className="space-y-8">
                {/* AI Red Flags & Unusual Exclusions */}
                <Card className="rounded-2xl border-rose-100 shadow-sm overflow-hidden bg-rose-50/30">
                  <CardHeader className="bg-rose-50 border-b border-rose-100">
                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-rose-800 flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-rose-600" />
                      Fine Print Exclusions (Red Flags)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {analysis.unusualExclusionsRedFlags && analysis.unusualExclusionsRedFlags.length > 0 ? (
                      (() => {
                        const itemsPerPage = 3;
                        const totalPages = Math.ceil(analysis.unusualExclusionsRedFlags.length / itemsPerPage);
                        const startIndex = redFlagsPage * itemsPerPage;
                        const endIndex = startIndex + itemsPerPage;
                        const displayedFlags = analysis.unusualExclusionsRedFlags.slice(startIndex, endIndex);
                        return (
                          <div className="space-y-4">
                            <ul className="space-y-3 min-h-[160px]">
                              {displayedFlags.map((flag, idx) => (
                                <li key={idx} className="flex gap-2 text-sm text-slate-700 font-medium leading-relaxed">
                                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                                  <span>{flag}</span>
                                </li>
                              ))}
                            </ul>
                            {totalPages > 1 && (
                              <div className="flex items-center justify-between pt-3 border-t border-rose-100/50">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setRedFlagsPage(prev => Math.max(0, prev - 1))}
                                  disabled={redFlagsPage === 0}
                                  className="text-xs text-rose-700 hover:bg-rose-100/50 disabled:opacity-50 h-8"
                                >
                                  Previous
                                </Button>
                                <span className="text-xs text-rose-700 font-semibold">
                                  Page {redFlagsPage + 1} of {totalPages}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setRedFlagsPage(prev => Math.min(totalPages - 1, prev + 1))}
                                  disabled={redFlagsPage === totalPages - 1}
                                  className="text-xs text-rose-700 hover:bg-rose-100/50 disabled:opacity-50 h-8"
                                >
                                  Next
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })()
                    ) : (
                      <div className="text-center py-6 text-slate-400">
                        <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                        <p className="text-xs">No critical red flags or hidden sub-limits found.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// Domain specifics renderer helper
const renderDomainDetailsCard = (data: PolicyAnalysis) => {
  const type = (data.insuranceType || "health").toLowerCase();

  switch (type) {
    case "health":
      const health = data.healthDetails || {};
      return (
        <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden">
          <CardHeader className="bg-indigo-50/20 border-b border-indigo-50">
            <CardTitle className="text-sm font-bold text-indigo-900 flex items-center gap-2">
              <Heart className="h-4 w-4 text-rose-500" />
              Health Insurance Coverage Scope
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-indigo-50/50 p-4 rounded-xl text-center border border-indigo-50/20">
                <span className="text-xs text-slate-400">Indiv. Deductible</span>
                <p className="text-lg font-bold text-indigo-950 mt-1">
                  {health.deductiblesIndividual ? `$${health.deductiblesIndividual}` : "$0"}
                </p>
              </div>
              <div className="bg-indigo-50/50 p-4 rounded-xl text-center border border-indigo-50/20">
                <span className="text-xs text-slate-400">Family Deductible</span>
                <p className="text-lg font-bold text-indigo-950 mt-1">
                  {health.deductiblesFamily ? `$${health.deductiblesFamily}` : "$0"}
                </p>
              </div>
              <div className="bg-indigo-50/50 p-4 rounded-xl text-center border border-indigo-50/20">
                <span className="text-xs text-slate-400">Co-Pay / Co-insurance</span>
                <p className="text-lg font-bold text-indigo-950 mt-1">
                  {health.coinsurancePercentage ? `${health.coinsurancePercentage}%` : "0%"}
                </p>
              </div>
            </div>

            <Separator className="bg-slate-100" />

            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Out-of-Pocket Maximum</p>
                <p className="text-base font-bold text-slate-800 mt-0.5">
                  {health.outOfPocketMaximum ? `$${health.outOfPocketMaximum}` : "No Max Extracted"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Specialist Copayments</p>
                <p className="text-base font-bold text-slate-800 mt-0.5">
                  {health.copaymentsSpecialist ? `$${health.copaymentsSpecialist}` : "No Copay Extracted"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Pre-Existing Conditions & Waiting Periods</p>
                <p className="text-sm text-slate-600 mt-1 bg-slate-50 p-3 rounded-lg leading-relaxed border border-slate-100">
                  {health.preExistingConditionsLimitations || "No limitations found."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      );

    case "life":
      const life = data.lifeDetails || {};
      return (
        <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden">
          <CardHeader className="bg-indigo-50/20 border-b border-indigo-50">
            <CardTitle className="text-sm font-bold text-indigo-900 flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-500" />
              Life Coverage & Payout Terms
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-indigo-50/50 p-4 rounded-xl text-center border border-indigo-50/20">
                <span className="text-xs text-slate-400">Sum Assured / Death Benefit</span>
                <p className="text-xl font-bold text-indigo-950 mt-1">
                  {life.deathBenefitAmount ? `$${life.deathBenefitAmount.toLocaleString()}` : "Not Found"}
                </p>
              </div>
              <div className="bg-indigo-50/50 p-4 rounded-xl text-center border border-indigo-50/20">
                <span className="text-xs text-slate-400">Beneficiary Revocability</span>
                <p className="text-xl font-bold text-indigo-950 mt-1">
                  {life.beneficiaryRevocability || "Not Specified"}
                </p>
              </div>
            </div>

            <Separator className="bg-slate-100" />

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase">Suicide Exclusion Window</p>
                  <p className="text-sm font-bold text-slate-800 mt-1">
                    {life.suicideExclusionPeriodMonths ? `${life.suicideExclusionPeriodMonths} months` : "None"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase">Contestability Window</p>
                  <p className="text-sm font-bold text-slate-800 mt-1">
                    {life.contestabilityPeriodYears ? `${life.contestabilityPeriodYears} years` : "None"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Accidental Death Rider Benefit</p>
                <p className="text-sm text-slate-700 mt-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {life.accidentalDeathRiderPayout ? `Additional Payout: $${life.accidentalDeathRiderPayout.toLocaleString()}` : "No accidental death rider detected."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      );

    case "home":
      const home = data.homeDetails || {};
      return (
        <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden">
          <CardHeader className="bg-indigo-50/20 border-b border-indigo-50">
            <CardTitle className="text-sm font-bold text-indigo-900 flex items-center gap-2">
              <HomeIcon className="h-4 w-4 text-amber-500" />
              Property & Home Limits
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-indigo-50/50 p-4 rounded-xl text-center border border-indigo-50/20">
                <span className="text-xs text-slate-400">Dwelling Limit</span>
                <p className="text-lg font-bold text-indigo-950 mt-1">
                  {home.dwellingLimit ? `$${home.dwellingLimit.toLocaleString()}` : "Not Found"}
                </p>
              </div>
              <div className="bg-indigo-50/50 p-4 rounded-xl text-center border border-indigo-50/20">
                <span className="text-xs text-slate-400">Other Structures</span>
                <p className="text-lg font-bold text-indigo-950 mt-1">
                  {home.otherStructuresLimit ? `$${home.otherStructuresLimit.toLocaleString()}` : "$0"}
                </p>
              </div>
              <div className="bg-indigo-50/50 p-4 rounded-xl text-center border border-indigo-50/20">
                <span className="text-xs text-slate-400">Personal Property</span>
                <p className="text-lg font-bold text-indigo-950 mt-1">
                  {home.personalPropertyLimit ? `$${home.personalPropertyLimit.toLocaleString()}` : "Not Found"}
                </p>
              </div>
            </div>

            <Separator className="bg-slate-100" />

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase">Wind/Hail Deductible</p>
                  <p className="text-sm font-bold text-slate-800 mt-1">
                    {home.deductibleWindHail ? `$${home.deductibleWindHail.toLocaleString()}` : "Standard Deductible"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase">Occupancy Restriction Clause</p>
                  <p className="text-sm font-bold text-slate-800 mt-1">
                    {home.occupancyRestrictionClause || "None"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Hazard Exclusions</p>
                {home.hazardExclusions && home.hazardExclusions.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {home.hazardExclusions.map((ex, idx) => (
                      <Badge key={idx} variant="secondary" className="bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-100">
                        {ex}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 mt-1">No hazard exclusions listed.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      );

    case "auto":
      const auto = data.autoDetails || {};
      return (
        <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden">
          <CardHeader className="bg-indigo-50/20 border-b border-indigo-50">
            <CardTitle className="text-sm font-bold text-indigo-900 flex items-center gap-2">
              <Car className="h-4 w-4 text-blue-500" />
              Auto / Vehicle Coverage Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-indigo-50/50 p-4 rounded-xl text-center border border-indigo-50/20">
                <span className="text-xs text-slate-400">Insured Declared Value (IDV)</span>
                <p className="text-base font-bold text-indigo-950 mt-1">
                  {auto.insuredDeclaredValueIdv ? `$${auto.insuredDeclaredValueIdv.toLocaleString()}` : "Not Found"}
                </p>
              </div>
              <div className="bg-indigo-50/50 p-4 rounded-xl text-center border border-indigo-50/20">
                <span className="text-xs text-slate-400">No Claim Bonus (NCB)</span>
                <p className="text-base font-bold text-indigo-950 mt-1">
                  {auto.noClaimBonusPercentage ? `${auto.noClaimBonusPercentage}%` : "0%"}
                </p>
              </div>
              <div className="bg-indigo-50/50 p-4 rounded-xl text-center border border-indigo-50/20">
                <span className="text-xs text-slate-400">Zero Dep/Bumper-to-Bumper</span>
                <p className="text-sm font-bold text-indigo-950 mt-1 capitalize">
                  {auto.zeroDepreciationCoverage || "No"}
                </p>
              </div>
            </div>

            <Separator className="bg-slate-100" />

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase">Indiv. Deductible</p>
                  <p className="text-sm font-bold text-slate-800 mt-1">
                    {auto.deductibleIndividual ? `$${auto.deductibleIndividual}` : "$0"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase">Compulsory Deduct.</p>
                  <p className="text-sm font-bold text-slate-800 mt-1">
                    {auto.deductibleCompulsory ? `$${auto.deductibleCompulsory}` : "$0"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase">Voluntary Deduct.</p>
                  <p className="text-sm font-bold text-slate-800 mt-1">
                    {auto.deductibleVoluntary ? `$${auto.deductibleVoluntary}` : "$0"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Exclusions</p>
                {auto.exclusions && auto.exclusions.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {auto.exclusions.map((ex, idx) => (
                      <Badge key={idx} variant="secondary" className="bg-slate-100 text-slate-700 border border-slate-200">
                        {ex}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 mt-1">No custom vehicle exclusions listed.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      );

    case "disability":
      const disability = data.disabilityDetails || {};
      return (
        <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden">
          <CardHeader className="bg-indigo-50/20 border-b border-indigo-50">
            <CardTitle className="text-sm font-bold text-indigo-900 flex items-center gap-2">
              <Layers className="h-4 w-4 text-violet-500" />
              Disability Benefit Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-indigo-50/50 p-4 rounded-xl text-center border border-indigo-50/20">
                <span className="text-xs text-slate-400">Elimination/Waiting Period</span>
                <p className="text-xl font-bold text-indigo-950 mt-1">
                  {disability.eliminationPeriodDays ? `${disability.eliminationPeriodDays} Days` : "None"}
                </p>
              </div>
              <div className="bg-indigo-50/50 p-4 rounded-xl text-center border border-indigo-50/20">
                <span className="text-xs text-slate-400">Monthly Payout Benefit</span>
                <p className="text-xl font-bold text-indigo-950 mt-1">
                  {disability.monthlyBenefitPercentage ? `${disability.monthlyBenefitPercentage}%` : "Not Extracted"}
                </p>
              </div>
            </div>

            <Separator className="bg-slate-100" />

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase">Benefit Duration Period</p>
                  <p className="text-sm font-bold text-slate-800 mt-1">
                    {disability.benefitDurationPeriod || "Not Specified"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase">Mental Health Limit</p>
                  <p className="text-sm font-bold text-slate-800 mt-1">
                    {disability.mentalHealthLimitationMonths ? `${disability.mentalHealthLimitationMonths} months` : "No limit specified"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Definition of Disability</p>
                <p className="text-sm text-slate-600 mt-1 bg-slate-50 p-3 rounded-lg leading-relaxed border border-slate-100">
                  {disability.definitionOfDisability || "No specific definitions found (e.g. Own Occupation)."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      );

    default:
      return (
        <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-700">Policy Details</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-sm text-slate-500">Scan details are summarized under exclusions and claims submission guidelines.</p>
          </CardContent>
        </Card>
      );
  }
};

export default ExplainPolicy;

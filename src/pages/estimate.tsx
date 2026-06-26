import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  ArrowLeft,
  Calculator,
  Upload,
  Sparkles,
  Info,
  AlertTriangle,
  ShieldCheck,
  Lightbulb,
  FileSearch,
  Loader2,
  DollarSign
} from "lucide-react";

const apiUrl = import.meta.env.VITE_APP_API_URL;

interface InsurancePolicy {
  insuranceId: number;
  insuranceName: string;
  insuranceType: string;
  insurancePrice: number;
  insuranceCoverage: number;
  insuranceFromDate: string;
  insuranceToDate: string;
  dateOfBirth?: string;
  policyAnalysisJson?: string;
  familyMemberProfileId?: number;
  belongsToName?: string;
}

interface DeductionBreakdown {
  category: string;
  deductedAmount: number;
  reason: string;
}

interface EstimateResponse {
  estimatedInsurerCovered: number;
  estimatedUserOutOfPocket: number;
  deductionsBreakdown: DeductionBreakdown[];
  suggestions: string[];
}

export default function Estimate() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(() => {
    return localStorage.getItem("isLoggedIn") === "true" ? null : false;
  });

  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>("");
  const [selectedPolicy, setSelectedPolicy] = useState<InsurancePolicy | null>(null);

  // Form Fields
  const [roomRentPerDay, setRoomRentPerDay] = useState<string>("");
  const [numberOfDays, setNumberOfDays] = useState<string>("");
  const [expectedProcedureCost, setExpectedProcedureCost] = useState<string>("");
  const [otherCharges, setOtherCharges] = useState<string>("");

  // Manual fallback rules
  const [copayPercent, setCopayPercent] = useState<string>("0");
  const [roomRentLimit, setRoomRentLimit] = useState<string>("0");
  const [deductible, setDeductible] = useState<string>("0");

  // PDF upload on the spot
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgressStep, setUploadProgressStep] = useState(0);

  // Projection Results
  const [isLoadingEstimate, setIsLoadingEstimate] = useState(false);
  const [estimateResult, setEstimateResult] = useState<EstimateResponse | null>(null);
  const [estimateError, setEstimateError] = useState<string | null>(null);

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

    fetch(`${apiUrl}/family/insurance`, { credentials: "include" })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setPolicies(data);
          if (data.length > 0) {
            setSelectedPolicyId(String(data[0].insuranceId));
          }
        }
      })
      .catch((e) => console.error("Error fetching policies", e));
  }, [isAuthenticated]);

  useEffect(() => {
    if (!selectedPolicyId) {
      setSelectedPolicy(null);
      return;
    }
    const policy = policies.find((p) => String(p.insuranceId) === selectedPolicyId) || null;
    setSelectedPolicy(policy);
    setEstimateResult(null);

    if (policy) {
      // If AI parsed, pre-fill from JSON details if we can parse them, otherwise let user override
      if (policy.policyAnalysisJson) {
        try {
          const parsed = JSON.parse(policy.policyAnalysisJson);
          const health = parsed.healthDetails || {};
          setCopayPercent(String(health.coinsurancePercentage || 0));
          setDeductible(String(health.deductiblesIndividual || 0));
          // Search in exclusions/red flags for room rent limits
          const redFlags = parsed.unusualExclusionsRedFlags || [];
          let rentCap = "0";
          for (const flag of redFlags) {
            const match = flag.match(/room\s*rent.*?(\d+)/i);
            if (match) {
              rentCap = match[1];
              break;
            }
          }
          setRoomRentLimit(rentCap);
        } catch (e) {
          console.error("Error pre-filling fallback rules from JSON", e);
        }
      } else {
        // Reset manual values
        setCopayPercent("0");
        setRoomRentLimit("0");
        setDeductible("0");
      }
    }
  }, [selectedPolicyId, policies]);

  // Handle PDF Upload on the spot
  const handlePdfUpload = async () => {
    if (!uploadFile || !selectedPolicy) return;
    setIsUploading(true);
    setUploadError(null);
    setUploadProgressStep(0);

    const stepsInterval = setInterval(() => {
      setUploadProgressStep((prev) => (prev < 4 ? prev + 1 : prev));
    }, 4000);

    const formData = new FormData();
    formData.append("file", uploadFile);

    try {
      // 1. Explain PDF
      const explainRes = await fetch(`${apiUrl}/insurance/explain`, {
        method: "POST",
        credentials: "include",
        body: formData
      });

      if (!explainRes.ok) {
        throw new Error("Failed to extract policy rules from booklet.");
      }

      const analysisResult = await explainRes.json();

      // 2. Save/Update Policy with analysis JSON
      const updatePayload = {
        insuranceId: selectedPolicy.insuranceId,
        insuranceName: selectedPolicy.insuranceName,
        insuranceType: selectedPolicy.insuranceType,
        insurancePrice: selectedPolicy.insurancePrice,
        insuranceCoverage: selectedPolicy.insuranceCoverage,
        insuranceFromDate: selectedPolicy.insuranceFromDate,
        insuranceToDate: selectedPolicy.insuranceToDate,
        dateOfBirth: selectedPolicy.dateOfBirth,
        policyAnalysisJson: JSON.stringify(analysisResult),
        familyMemberProfileId: selectedPolicy.familyMemberProfileId
      };

      const updateRes = await fetch(`${apiUrl}/insurance/update/${selectedPolicy.insuranceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updatePayload)
      });

      if (!updateRes.ok) {
        throw new Error("Failed to update policy analysis on database.");
      }

      // Update local policies state
      setPolicies((prev) =>
        prev.map((p) =>
          p.insuranceId === selectedPolicy.insuranceId
            ? { ...p, policyAnalysisJson: JSON.stringify(analysisResult) }
            : p
        )
      );

      setUploadFile(null);
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "An error occurred during file ingestion.");
    } finally {
      clearInterval(stepsInterval);
      setIsUploading(false);
    }
  };

  // Generate Projection Estimate
  const handleCalculateEstimate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPolicyId) return;

    setIsLoadingEstimate(true);
    setEstimateError(null);
    setEstimateResult(null);

    const payload = {
      roomRentPerDay: parseFloat(roomRentPerDay) || 0.0,
      numberOfDays: parseInt(numberOfDays) || 0,
      expectedProcedureCost: parseFloat(expectedProcedureCost) || 0.0,
      otherCharges: parseFloat(otherCharges) || 0.0,
      manualPolicyRules: {
        copayPercent: parseInt(copayPercent) || 0,
        roomRentLimit: parseFloat(roomRentLimit) || 0.0,
        deductible: parseFloat(deductible) || 0.0
      }
    };

    try {
      const res = await fetch(`${apiUrl}/insurance/${selectedPolicyId}/estimate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to generate estimation.");
      }

      const result = await res.json();
      setEstimateResult(result);
    } catch (err: any) {
      console.error(err);
      setEstimateError(err.message || "Something went wrong generating your estimate.");
    } finally {
      setIsLoadingEstimate(false);
    }
  };

  const uploadSteps = [
    "Analyzing document geometry...",
    "Staging PDF file securely...",
    "Gemini dissecting clauses...",
    "Generating analysis rules...",
    "Saving results permanently..."
  ];

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin h-10 w-10 text-indigo-600" />
      </div>
    );
  }

  const isPolicyAiAnalyzed = selectedPolicy && !!selectedPolicy.policyAnalysisJson;
  const totalExpectedBill =
    (parseFloat(roomRentPerDay) || 0) * (parseInt(numberOfDays) || 0) +
    (parseFloat(expectedProcedureCost) || 0) +
    (parseFloat(otherCharges) || 0);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <h1
              className="text-2xl font-extrabold text-slate-900 cursor-pointer flex items-center gap-1.5"
              onClick={() => navigate("/")}
            >
              <Calculator className="h-6 w-6 text-indigo-600" />
              Insurance Tracker
            </h1>
            <span
              onClick={() => navigate("/estimate")}
              className="text-sm font-semibold text-indigo-600 cursor-pointer border-b-2 border-indigo-600 pb-0.5"
            >
              Cost Estimator
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Dashboard
          </Button>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Hospital Out-of-Pocket Estimator
          </h2>
          <p className="text-slate-500 mt-1">
            Calculate insurer coverage ratios and identify policy deductions before you check in.
          </p>
        </div>

        {policies.length === 0 ? (
          <Card className="border-dashed border-2 border-slate-200 py-16 text-center">
            <CardContent className="space-y-4">
              <div className="bg-indigo-50 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto text-indigo-600">
                <Calculator className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-slate-800">No active policies found</h3>
                <p className="text-slate-500 max-w-md mx-auto">
                  To estimate out-of-pocket expenses, you must first register an insurance policy.
                </p>
              </div>
              <Button onClick={() => navigate("/add")} className="bg-indigo-600 hover:bg-indigo-700">
                Add Your First Policy
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Form Section */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="rounded-2xl border-slate-100 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-900">Hospitalization Details</CardTitle>
                  <CardDescription>Select your policy and enter expected hospital bill line items</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCalculateEstimate} className="space-y-5">
                    {/* Policy Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="policy-select" className="font-semibold text-slate-700">
                        Choose Policy
                      </Label>
                      <select
                        id="policy-select"
                        value={selectedPolicyId}
                        onChange={(e) => setSelectedPolicyId(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                      >
                        {policies.map((p) => (
                          <option key={p.insuranceId} value={p.insuranceId}>
                            {p.insuranceName} ({p.belongsToName || "Self"})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* AI Policy Status Indicator */}
                    {selectedPolicy && (
                      <div className="rounded-xl border p-3.5 bg-slate-50/50 flex flex-col gap-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500 font-semibold uppercase">Rule Context</span>
                          {isPolicyAiAnalyzed ? (
                            <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-200 flex items-center gap-1">
                              <ShieldCheck className="h-3.5 w-3.5" /> AI Parsed
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50 border border-amber-200 flex items-center gap-1">
                              <AlertTriangle className="h-3.5 w-3.5" /> Manually Configured
                            </Badge>
                          )}
                        </div>

                        {/* On-the-spot PDF uploader if manually configured */}
                        {!isPolicyAiAnalyzed && (
                          <div className="space-y-3 mt-1.5 border-t border-slate-100 pt-3">
                            <div className="text-xs text-slate-500 leading-relaxed flex items-start gap-1">
                              <Info className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
                              <span>
                                Upload policy PDF booklet on-the-spot to let AI auto-parse deductible, copay, and roomrent limits.
                              </span>
                            </div>

                            {isUploading ? (
                              <div className="space-y-2 text-center py-2">
                                <Loader2 className="animate-spin h-6 w-6 text-indigo-600 mx-auto" />
                                <span className="text-xs text-indigo-600 font-medium block">
                                  {uploadSteps[uploadProgressStep]}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="file"
                                  accept=".pdf"
                                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                  className="h-9 text-xs py-1"
                                />
                                {uploadFile && (
                                  <Button
                                    type="button"
                                    onClick={handlePdfUpload}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 px-3 text-xs"
                                  >
                                    Parse
                                  </Button>
                                )}
                              </div>
                            )}
                            {uploadError && <p className="text-xs text-red-500 font-semibold">{uploadError}</p>}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Numeric Cost Inputs */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="room-rent" className="font-semibold text-slate-700">
                          Daily Room Rent ($)
                        </Label>
                        <Input
                          id="room-rent"
                          type="number"
                          placeholder="e.g. 6000"
                          value={roomRentPerDay}
                          onChange={(e) => setRoomRentPerDay(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="days" className="font-semibold text-slate-700">
                          Hospitalization Days
                        </Label>
                        <Input
                          id="days"
                          type="number"
                          placeholder="e.g. 4"
                          value={numberOfDays}
                          onChange={(e) => setNumberOfDays(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="procedure" className="font-semibold text-slate-700">
                          Procedure Cost ($)
                        </Label>
                        <Input
                          id="procedure"
                          type="number"
                          placeholder="e.g. 50000"
                          value={expectedProcedureCost}
                          onChange={(e) => setExpectedProcedureCost(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="other" className="font-semibold text-slate-700">
                          Other Expenses ($)
                        </Label>
                        <Input
                          id="other"
                          type="number"
                          placeholder="e.g. 10000"
                          value={otherCharges}
                          onChange={(e) => setOtherCharges(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Manual Policy rules fallback accordion */}
                    <Accordion type="single" collapsible className="w-full border-t border-slate-100">
                      <AccordionItem value="manual-rules" className="border-b-0">
                        <AccordionTrigger className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 py-3">
                          {isPolicyAiAnalyzed ? "Override Parsed Policy Limits" : "Configure Manual Limits"}
                        </AccordionTrigger>
                        <AccordionContent className="space-y-3 pt-1">
                          <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-1">
                              <Label htmlFor="manual-copay" className="text-xs text-slate-500">
                                Copay (%)
                              </Label>
                              <Input
                                id="manual-copay"
                                type="number"
                                value={copayPercent}
                                onChange={(e) => setCopayPercent(e.target.value)}
                                className="h-8 text-xs"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="manual-rent" className="text-xs text-slate-500">
                                Room Rent Cap ($)
                              </Label>
                              <Input
                                id="manual-rent"
                                type="number"
                                value={roomRentLimit}
                                onChange={(e) => setRoomRentLimit(e.target.value)}
                                className="h-8 text-xs"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="manual-deductible" className="text-xs text-slate-500">
                                Deductible ($)
                              </Label>
                              <Input
                                id="manual-deductible"
                                type="number"
                                value={deductible}
                                onChange={(e) => setDeductible(e.target.value)}
                                className="h-8 text-xs"
                              />
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    <Button
                      type="submit"
                      disabled={isLoadingEstimate}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-6 shadow-md shadow-indigo-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      {isLoadingEstimate ? (
                        <>
                          <Loader2 className="animate-spin h-5 w-5" /> Analyzing Policy & Costs...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-5 w-5 fill-indigo-200" /> Generate Out-of-Pocket Estimate
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Projections Section */}
            <div className="lg:col-span-7">
              {estimateError && (
                <Alert variant="destructive" className="bg-red-50 border-red-100 text-red-800 rounded-2xl p-5">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <AlertTitle className="font-bold text-sm">Estimation Error</AlertTitle>
                  <AlertDescription className="text-xs mt-1">{estimateError}</AlertDescription>
                </Alert>
              )}

              {!estimateResult && !isLoadingEstimate && !estimateError && (
                <Card className="rounded-2xl border-slate-100 border-dashed border-2 p-12 text-center flex flex-col items-center justify-center min-h-[450px] bg-white">
                  <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-4">
                    <FileSearch className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">Estimate Dashboard</h3>
                  <p className="text-slate-400 text-sm max-w-sm mt-1.5 leading-relaxed">
                    Fill out the hospitalization bill particulars on the left to estimate your copays, room deductions, and total out-of-pocket costs.
                  </p>
                </Card>
              )}

              {isLoadingEstimate && (
                <Card className="rounded-2xl border-slate-100 p-12 text-center flex flex-col items-center justify-center min-h-[450px] bg-white animate-pulse">
                  <Loader2 className="animate-spin h-10 w-10 text-indigo-600 mb-4" />
                  <h3 className="text-lg font-bold text-slate-700">Projecting Cost Ratios...</h3>
                  <p className="text-slate-400 text-xs mt-1">Applying sub-limits, deductibles and fine print copays</p>
                </Card>
              )}

              {estimateResult && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {/* Summary Metric Cards */}
                  <Card className="rounded-2xl border-slate-100 shadow-md overflow-hidden bg-white">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100/60 py-4">
                      <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">
                        Out-of-Pocket Projection Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                        <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-100">
                          <span className="text-xs font-semibold text-slate-500 block uppercase">Expected Total Bill</span>
                          <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
                            ${totalExpectedBill.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="bg-emerald-50/40 p-4.5 rounded-xl border border-emerald-100/50">
                          <span className="text-xs font-semibold text-emerald-800 block uppercase">Insurer Will Pay</span>
                          <span className="text-2xl font-extrabold text-emerald-700 mt-1 block">
                            ${estimateResult.estimatedInsurerCovered.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="bg-rose-50/40 p-4.5 rounded-xl border border-rose-100/50">
                          <span className="text-xs font-semibold text-rose-800 block uppercase">Your Cost Portion</span>
                          <span className="text-2xl font-extrabold text-rose-600 mt-1 block">
                            ${estimateResult.estimatedUserOutOfPocket.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      {/* Visual coverage ratio meter */}
                      <div className="mt-8 space-y-2">
                        <div className="flex justify-between items-center text-xs font-semibold">
                          <span className="text-emerald-700">Insurer Coverage: {totalExpectedBill > 0 ? Math.round((estimateResult.estimatedInsurerCovered / totalExpectedBill) * 100) : 0}%</span>
                          <span className="text-rose-600">Out-of-Pocket: {totalExpectedBill > 0 ? Math.round((estimateResult.estimatedUserOutOfPocket / totalExpectedBill) * 100) : 0}%</span>
                        </div>
                        <Progress
                          value={totalExpectedBill > 0 ? (estimateResult.estimatedInsurerCovered / totalExpectedBill) * 100 : 0}
                          className="h-3 bg-rose-200 [&>div]:bg-emerald-500"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Deduction Breakdown details */}
                  <Card className="rounded-2xl border-slate-100 shadow-md overflow-hidden bg-white">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100/60 py-4 flex flex-row items-center gap-2">
                      <DollarSign className="h-5 w-5 text-indigo-500" />
                      <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-600">
                        Itemized Deductions Explained
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {estimateResult.deductionsBreakdown.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-xs italic">
                          No deductions or cost limitations identified. Policy covers 100% of these expenses.
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {estimateResult.deductionsBreakdown.map((item, idx) => (
                            <div key={idx} className="p-5 flex justify-between items-start gap-4 hover:bg-slate-50/30 transition-colors">
                              <div className="space-y-1">
                                <span className="text-xs font-bold text-slate-800 uppercase block tracking-wide">{item.category}</span>
                                <span className="text-xs text-slate-500 leading-relaxed block">{item.reason}</span>
                              </div>
                              <span className="text-sm font-extrabold text-rose-600 shrink-0">
                                -${item.deductedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Actionable Advice & Savings Cards */}
                  {estimateResult.suggestions.length > 0 && (
                    <Card className="rounded-2xl border-indigo-100 shadow-sm overflow-hidden bg-indigo-50/20">
                      <CardHeader className="bg-indigo-50 border-b border-indigo-100/60 py-4 flex flex-row items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-indigo-600 fill-indigo-100 animate-bounce" />
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-indigo-900">
                          AI Cost-Cutting Suggestions
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-5 space-y-3.5">
                        {estimateResult.suggestions.map((advice, idx) => (
                          <div key={idx} className="flex gap-2.5 items-start text-sm text-indigo-950 font-medium">
                            <span className="h-2 w-2 rounded-full bg-indigo-600 mt-2 shrink-0 animate-ping" />
                            <span>{advice}</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

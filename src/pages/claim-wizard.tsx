import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Shield, 
  UploadCloud, 
  Loader2, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  FileText,
  FileCheck,
  Download,
  AlertOctagon,
  Sparkles
} from "lucide-react";

const apiUrl = import.meta.env.VITE_APP_API_URL;

interface Insurance {
  insuranceId: number;
  insuranceName: string;
  insuranceType: string;
  belongsToName?: string;
}

interface Profile {
  profileId: number;
  fullName: string;
  relationship: string;
}

interface UploadedDocument {
  documentId: number;
  fileName: string;
  gcsFileUrl: string;
  documentType: string;
  amount?: number;
  matched: boolean;
}

interface PreAuditReport {
  isValid: boolean;
  warnings: string[];
  strengths: string[];
}

export default function ClaimWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editClaimId = searchParams.get("edit");

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(() => {
    return localStorage.getItem("isLoggedIn") === "true" ? null : false;
  });

  // Form states
  const [policies, setPolicies] = useState<Insurance[]>([]);
  const [familyProfiles, setFamilyProfiles] = useState<Profile[]>([]);
  
  const [selectedPolicy, setSelectedPolicy] = useState("");
  const [insurerName, setInsurerName] = useState("");
  const [medicalEvent, setMedicalEvent] = useState("");
  const [patientName, setPatientName] = useState("Self");
  const [totalClaimedAmount, setTotalClaimedAmount] = useState("");
  const [admissionDate, setAdmissionDate] = useState("");
  const [dischargeDate, setDischargeDate] = useState("");

  // Claim process states
  const [claimId, setClaimId] = useState<number | null>(null);
  const [requiredChecklist, setRequiredChecklist] = useState<string[]>([]);
  const [checklistTips, setChecklistTips] = useState<string[]>([]);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  
  // Audit states
  const [auditing, setAuditing] = useState(false);
  const [auditReport, setAuditReport] = useState<PreAuditReport | null>(null);

  // Bundle states
  const [bundling, setBundling] = useState(false);
  const [bundleUrl, setBundleUrl] = useState<string | null>(null);

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

    // Load policies
    fetch(`${apiUrl}/`, { credentials: "include" })
      .then(async (res) => {
        if (res.ok) setPolicies(await res.json());
      })
      .catch((e) => console.error("Error fetching policies", e));

    // Load family profiles
    fetch(`${apiUrl}/family/members`, { credentials: "include" })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          if (data && data.profiles) {
            setFamilyProfiles(data.profiles);
          }
        }
      })
      .catch((e) => console.error("Error fetching family", e))
      .finally(() => setLoading(false));

    // If editing a draft
    if (editClaimId) {
      const id = parseInt(editClaimId);
      setClaimId(id);
      fetch(`${apiUrl}/api/claims/${id}`, { credentials: "include" })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            const claim = data.claim;
            setSelectedPolicy(String(claim.insuranceId));
            setInsurerName(claim.insurerName || "");
            setMedicalEvent(claim.medicalEvent || "");
            setPatientName(claim.belongsToName || "Self");
            setTotalClaimedAmount(String(claim.totalClaimedAmount || ""));
            setAdmissionDate(claim.admissionDate || "");
            setDischargeDate(claim.dischargeDate || "");
            setUploadedDocs(data.documents || []);
            setStep(2); // Jump directly to upload step
            
            // Re-generate checklist tips silently
            fetchChecklist(claim.insurerName, claim.medicalEvent);
          }
        })
        .catch((e) => console.error("Error fetching claim draft", e));
    }
  }, [isAuthenticated, editClaimId]);

  const fetchChecklist = (insurer: string, event: string) => {
    fetch(`${apiUrl}/api/claims/checklist?insurerName=${encodeURIComponent(insurer)}&medicalEvent=${encodeURIComponent(event)}`, {
      credentials: "include"
    })
      .then(async (res) => {
        if (res.ok) {
          const checklist = await res.json();
          setRequiredChecklist(checklist.requiredDocuments || []);
          setChecklistTips(checklist.tips || []);
        }
      });
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPolicy || !insurerName || !medicalEvent || !totalClaimedAmount || !admissionDate || !dischargeDate) {
      alert("Please fill in all details.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/claims/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claimId: claimId,
          insuranceId: parseInt(selectedPolicy),
          belongsToName: patientName,
          insurerName,
          medicalEvent,
          totalClaimedAmount: parseFloat(totalClaimedAmount),
          admissionDate,
          dischargeDate
        }),
        credentials: "include"
      });

      if (!response.ok) throw new Error("Failed to create claim draft");

      const data = await response.json();
      setClaimId(data.claim.claimId);
      setRequiredChecklist(data.checklist.requiredDocuments || []);
      setChecklistTips(data.checklist.tips || []);
      setStep(2);
    } catch (err: any) {
      alert(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !claimId) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(`${apiUrl}/api/claims/${claimId}/upload`, {
          method: "POST",
          body: formData,
          credentials: "include"
        });

        if (response.ok) {
          const newDoc = await response.json();
          setUploadedDocs((prev) => [...prev, newDoc]);
        }
      }
    } catch (err) {
      console.error("Error uploading document", err);
      alert("Failed to upload some documents. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const triggerAudit = async () => {
    if (!claimId) return;
    try {
      setAuditing(true);
      const response = await fetch(`${apiUrl}/api/claims/${claimId}/audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requiredChecklist),
        credentials: "include"
      });

      if (!response.ok) throw new Error("Failed to run AI audit");
      setAuditReport(await response.json());
      setStep(3);
    } catch (err) {
      alert("AI Audit failed. Please try again.");
    } finally {
      setAuditing(false);
    }
  };

  const triggerBundler = async () => {
    if (!claimId) return;
    try {
      setBundling(true);
      const response = await fetch(`${apiUrl}/api/claims/${claimId}/bundle`, {
        method: "POST",
        credentials: "include"
      });

      if (!response.ok) throw new Error("Failed to compile claim bundle");
      const data = await response.json();
      setBundleUrl(data.bundleUrl);
      setStep(4);
    } catch (err) {
      alert("PDF Stitching failed. Please try again.");
    } finally {
      setBundling(false);
    }
  };

  if (loading && step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin h-12 w-12 text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/claims")}
          className="mb-6 flex items-center text-gray-600"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Claims
        </Button>

        {/* Step Indicator */}
        <div className="mb-8 flex items-center justify-between text-xs text-gray-400 font-semibold uppercase tracking-wider max-w-xl mx-auto flex-wrap gap-2">
          <span className={step >= 1 ? "text-indigo-600" : ""}>1. Claim Info</span>
          <div className="flex-1 h-0.5 bg-gray-200 mx-2 min-w-8"></div>
          <span className={step >= 2 ? "text-indigo-600" : ""}>2. Upload Papers</span>
          <div className="flex-1 h-0.5 bg-gray-200 mx-2 min-w-8"></div>
          <span className={step >= 3 ? "text-indigo-600" : ""}>3. AI Pre-Audit</span>
          <div className="flex-1 h-0.5 bg-gray-200 mx-2 min-w-8"></div>
          <span className={step >= 4 ? "text-indigo-600" : ""}>4. Stitched PDF</span>
        </div>

        {/* STEP 1: Claim Information Setup */}
        {step === 1 && (
          <Card className="shadow-md">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Shield className="text-indigo-600 h-6 w-6" />
                Initialize Reimbursement Claim
              </CardTitle>
              <CardDescription>Enter details about the treatment, insurer, and patient to build a checklist</CardDescription>
            </CardHeader>
            <form onSubmit={handleStep1Submit}>
              <CardContent className="space-y-6 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Patient Name */}
                  <div className="space-y-2">
                    <Label htmlFor="patient">Patient Profile</Label>
                    <Select value={patientName} onValueChange={setPatientName}>
                      <SelectTrigger id="patient">
                        <SelectValue placeholder="Select patient" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Self">Self (Account Owner)</SelectItem>
                        {familyProfiles.map((p) => (
                          <SelectItem key={p.profileId} value={p.fullName}>{p.fullName} ({p.relationship})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Policy Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="policy">Insurance Policy</Label>
                    <Select value={selectedPolicy} onValueChange={setSelectedPolicy}>
                      <SelectTrigger id="policy">
                        <SelectValue placeholder="Select policy card" />
                      </SelectTrigger>
                      <SelectContent>
                        {policies.map((p) => (
                          <SelectItem key={p.insuranceId} value={String(p.insuranceId)}>{p.insuranceName} ({p.insuranceType})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Insurer Name */}
                  <div className="space-y-2">
                    <Label htmlFor="insurer">Insurer Name</Label>
                    <Input 
                      id="insurer" 
                      placeholder="e.g. Star Health, Care Health, Niva Bupa"
                      value={insurerName}
                      onChange={(e) => setInsurerName(e.target.value)}
                      required
                    />
                  </div>

                  {/* Diagnosis/Event */}
                  <div className="space-y-2">
                    <Label htmlFor="event">Medical Event / Diagnosis</Label>
                    <Input 
                      id="event" 
                      placeholder="e.g. Appendicitis Surgery, Pneumonia Treatment"
                      value={medicalEvent}
                      onChange={(e) => setMedicalEvent(e.target.value)}
                      required
                    />
                  </div>

                  {/* Total Expense */}
                  <div className="space-y-2">
                    <Label htmlFor="amount">Total Claim Amount</Label>
                    <Input 
                      id="amount" 
                      type="number"
                      placeholder="0.00"
                      value={totalClaimedAmount}
                      onChange={(e) => setTotalClaimedAmount(e.target.value)}
                      required
                    />
                  </div>

                  {/* Dates */}
                  <div className="space-y-2">
                    <Label htmlFor="admission">Admission Date</Label>
                    <DatePicker
                      value={admissionDate}
                      onChange={setAdmissionDate}
                      placeholder="Select admission date"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discharge">Discharge Date</Label>
                    <DatePicker
                      value={dischargeDate}
                      onChange={setDischargeDate}
                      placeholder="Select discharge date"
                    />
                  </div>
                </div>
              </CardContent>
              <div className="p-6 bg-gray-50 border-t flex justify-end">
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                  Generate Custom Checklist <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* STEP 2: Document Upload & AI Classification */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Checklist & Tips */}
            <Card className="border-indigo-100 bg-indigo-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-md font-bold text-indigo-900 flex items-center gap-1.5">
                  <Sparkles className="h-5 w-5 text-indigo-600" />
                  AI Intelligent Checklist: {medicalEvent} ({insurerName})
                </CardTitle>
                <CardDescription className="text-indigo-700">Recommended documents required by {insurerName} for successful reimbursement.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="text-sm text-indigo-950 space-y-1 list-disc list-inside">
                  {requiredChecklist.map((item, index) => (
                    <li key={index} className="font-medium">{item}</li>
                  ))}
                </ul>
                {checklistTips.length > 0 && (
                  <div className="bg-white p-3 rounded border border-indigo-100 mt-4 space-y-1 text-xs text-indigo-900 leading-relaxed">
                    <strong className="text-indigo-950 block">AI Tips to prevent claim rejection:</strong>
                    {checklistTips.map((tip, index) => (
                      <p key={index}>• {tip}</p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Document Uploading Area */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold">Upload Claims Papers</CardTitle>
                <CardDescription>Snap photos or upload PDFs of final bills, discharge summaries, lab reports, and prescriptions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={uploading}
                  />
                  <div className="flex flex-col items-center space-y-2">
                    <UploadCloud className="h-10 w-10 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-700">
                      {uploading ? "Uploading and Classifying with AI..." : "Click to select or drag and drop papers"}
                    </span>
                    <span className="text-xs text-gray-400">PDF, JPG, JPEG, PNG files accepted</span>
                  </div>
                </div>

                {/* Uploaded Documents List */}
                {uploadedDocs.length > 0 && (
                  <div className="space-y-3 pt-4 border-t">
                    <h4 className="text-sm font-bold text-gray-700">Uploaded Documents (AI Classified):</h4>
                    <div className="space-y-2">
                      {uploadedDocs.map((doc) => (
                        <div key={doc.documentId} className="flex items-center justify-between p-3 rounded border border-gray-100 bg-white text-sm shadow-sm flex-wrap gap-2">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 rounded text-indigo-600">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div>
                              <span className="font-semibold block text-gray-800">{doc.fileName}</span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Badge className="bg-indigo-100 text-indigo-800 text-xs">
                                  {doc.documentType}
                                </Badge>
                                {doc.amount && (
                                  <span className="text-xs text-gray-500 font-medium">
                                    Amount: {doc.amount.toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
              <div className="p-6 bg-gray-50 border-t flex justify-between items-center">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button 
                  onClick={triggerAudit} 
                  disabled={uploadedDocs.length === 0 || auditing}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                >
                  {auditing ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4" /> Auditing...
                    </>
                  ) : (
                    <>
                      Run AI Pre-Audit <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* STEP 3: AI Pre-Audit Results */}
        {step === 3 && auditReport && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-xl font-bold flex items-center justify-between flex-wrap gap-2">
                  <span>AI Claims Pre-Audit Scan</span>
                  {auditReport.isValid ? (
                    <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
                      <CheckCircle2 className="h-4.5 w-4.5 text-green-600" />
                      Audited Successfully
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800 border-red-200 flex items-center gap-1">
                      <AlertOctagon className="h-4.5 w-4.5 text-red-600" />
                      Discrepancies Found
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>Gemini cross-referenced your bills, prescriptions, and reports to identify potential rejection points.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                
                {/* Warnings Section */}
                {auditReport.warnings.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-red-600 flex items-center gap-1.5">
                      <AlertTriangle className="h-5 w-5" />
                      Warnings to Resolve (To avoid Insurer rejection):
                    </h4>
                    <div className="space-y-2.5">
                      {auditReport.warnings.map((warn, index) => (
                        <Alert key={index} className="border-red-200 bg-red-50/50">
                          <AlertTitle className="text-red-900 font-bold text-xs">Action Required</AlertTitle>
                          <AlertDescription className="text-red-800 text-sm leading-relaxed">{warn}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-lg flex items-center gap-3 text-emerald-900">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold block text-sm">Perfect Audit Score!</span>
                      <span className="text-xs">No missing files, document mismatches, or missing prescriptions were found.</span>
                    </div>
                  </div>
                )}

                {/* Strengths Section */}
                {auditReport.strengths.length > 0 && (
                  <div className="space-y-3 pt-4 border-t">
                    <h4 className="text-sm font-bold text-green-700 flex items-center gap-1.5">
                      <CheckCircle2 className="h-5 w-5" />
                      Audit Strengths:
                    </h4>
                    <ul className="text-sm text-green-900 space-y-1 list-disc list-inside">
                      {auditReport.strengths.map((str, index) => (
                        <li key={index} className="font-medium">{str}</li>
                      ))}
                    </ul>
                  </div>
                )}

              </CardContent>
              <div className="p-6 bg-gray-50 border-t flex justify-between items-center">
                <Button variant="ghost" onClick={() => setStep(2)}>
                  Upload More Papers
                </Button>
                <Button
                  onClick={triggerBundler}
                  disabled={bundling}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                >
                  {bundling ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4" /> Stitching Documents...
                    </>
                  ) : (
                    <>
                      Stitch PDF Bundle <FileCheck className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* STEP 4: PDF Bundle Download */}
        {step === 4 && bundleUrl && (
          <Card className="shadow-md border-indigo-100 bg-indigo-50/10">
            <CardHeader className="text-center pb-4 border-b border-indigo-50">
              <div className="bg-green-100 p-3 rounded-full w-14 h-14 flex items-center justify-center mx-auto text-green-600 mb-2">
                <FileCheck className="h-8 w-8" />
              </div>
              <CardTitle className="text-2xl font-bold text-slate-800">Stitched Claim Bundle Ready!</CardTitle>
              <CardDescription>We compiled and ordered all documents with an AI index cover sheet.</CardDescription>
            </CardHeader>
            <CardContent className="py-10 text-center space-y-6">
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Your finalized reimbursement claim package contains all final bills, discharge papers, prescriptions, and reports compiled in the precise format insurance companies prefer.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => window.open(bundleUrl, "_blank")}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center"
                >
                  <Download className="mr-2 h-5 w-5" /> Download Claims Bundle
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/claims")}
                >
                  Return to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}

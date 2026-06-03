import React from "react";
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
import { Eye, Pencil, Trash2, User, Sparkles, Heart, Activity, Home as HomeIcon, Car, Layers, ShieldAlert, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface InsuranceCardProps {
  insuranceId?: string;
  insuranceName?: string;
  insuranceType?: string;
  insurancePrice?: number;
  insuranceCoverage?: number;
  insuranceToDate?: string;
  belongsToName?: string;
  policyAnalysisJson?: string;
  onView?: (insuranceId: string) => void;
  onEdit?: (insuranceId: string) => void;
  onDelete?: (insuranceId: string) => void;
}

const InsuranceCard: React.FC<InsuranceCardProps> = ({
  insuranceId = "1",
  insuranceName = "ABC Insurance",
  insuranceType = "Health",
  insurancePrice = 1200,
  insuranceCoverage = 100000,
  insuranceToDate = "2025-12-31",
  belongsToName,
  policyAnalysisJson,
  onView = () => {},
  onEdit = () => {},
  onDelete = () => {},
}) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isAnalysisOpen, setIsAnalysisOpen] = React.useState(false);
  const [redFlagsPage, setRedFlagsPage] = React.useState(0);

  React.useEffect(() => {
    if (!isAnalysisOpen) {
      setRedFlagsPage(0);
    }
  }, [isAnalysisOpen]);

  const handleDelete = () => {
    onDelete(insuranceId);
    setIsDeleteDialogOpen(false);
  };

  // Check if policy is expired
  const isExpired = new Date(insuranceToDate) < new Date();

  const getInsuranceTypeColor = (type: string) => {
    const normalizedType =
      type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
    const types: Record<string, string> = {
      Health: "bg-green-100 text-green-800",
      Life: "bg-blue-100 text-blue-800",
      Auto: "bg-orange-100 text-orange-800",
      Home: "bg-purple-100 text-purple-800",
      Travel: "bg-yellow-100 text-gray-800",
    };
    return types[normalizedType] || "bg-gray-100 text-gray-800";
  };

  // Parse policy analysis JSON if present
  let parsedAnalysis: any = null;
  if (policyAnalysisJson) {
    try {
      parsedAnalysis = JSON.parse(policyAnalysisJson);
    } catch (e) {
      console.error("Failed to parse policy analysis JSON", e);
    }
  }

  // Dynamic card styling based on expiration status
  const cardClassName = isExpired 
    ? "w-[350px] h-[220px] bg-white shadow-md hover:shadow-lg transition-shadow duration-300 border-2 border-red-500 shadow-red-200"
    : "w-[350px] h-[220px] bg-white shadow-md hover:shadow-lg transition-shadow duration-300";

  return (
    <Card className={cardClassName}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold">{insuranceName}</CardTitle>
          <div className="flex gap-1.5 flex-wrap justify-end">
            {isExpired && (
              <Badge className="bg-red-100 text-red-800">
                Expired
              </Badge>
            )}
            <Badge className={`${getInsuranceTypeColor(insuranceType)}`}>
              {insuranceType}
            </Badge>
            {parsedAnalysis && (
              <Badge 
                onClick={() => setIsAnalysisOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer flex items-center gap-0.5 text-[10px] py-0 px-1.5 animate-pulse"
              >
                <Sparkles className="h-2.5 w-2.5 text-indigo-200 fill-indigo-200" />
                AI Analysis
              </Badge>
            )}
          </div>
        </div>
        <div className="flex justify-between items-center">
          <CardDescription className="text-sm text-gray-500">
            Coverage: {insuranceCoverage?.toLocaleString() || "N/A"}
          </CardDescription>
          {belongsToName && belongsToName !== "Self" && (
            <Badge variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50 text-xs flex items-center gap-1">
              <User className="h-3 w-3" />
              {belongsToName}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-500">Premium:</span>
            <span className="text-sm font-bold">
              {insurancePrice.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-500">Expires:</span>
            <span className={`text-sm ${isExpired ? 'text-red-600 font-semibold' : ''}`}>
              {new Date(insuranceToDate).toLocaleDateString()}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex justify-between border-t border-gray-100">
        <Button
          variant="ghost"
          size="sm"
          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
          onClick={() => onView(insuranceId)}
        >
          <Eye className="h-4 w-4 mr-1" /> View
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-amber-600 hover:text-amber-800 hover:bg-amber-50"
          onClick={() => onEdit(insuranceId)}
        >
          <Pencil className="h-4 w-4 mr-1" /> Edit
        </Button>
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-800 hover:bg-red-50"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the insurance policy from{" "}
                {insuranceName}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>

      {/* AI Policy Analysis Modal */}
      {parsedAnalysis && (
        <Dialog open={isAnalysisOpen} onOpenChange={setIsAnalysisOpen}>
          <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                <Sparkles className="h-5 w-5 text-indigo-500 fill-indigo-200" />
                AI Policy Breakdown - {parsedAnalysis.insurerName || insuranceName}
              </DialogTitle>
              <DialogDescription>
                AI-extracted overview of key sub-limits, exclusions, and rules.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 my-2">
              {/* Coverage Details Grid depending on type */}
              {renderDialogCoverageDetails(parsedAnalysis)}

              <Separator />

              {/* Red Flags & Exclusions */}
              <div className="space-y-3 bg-rose-50/50 p-4 rounded-xl border border-rose-100/50">
                <h4 className="text-sm font-semibold text-rose-800 flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-rose-600" />
                  Hidden Exclusions & Red Flags
                </h4>
                {parsedAnalysis.unusualExclusionsRedFlags && parsedAnalysis.unusualExclusionsRedFlags.length > 0 ? (
                  (() => {
                    const itemsPerPage = 3;
                    const totalPages = Math.ceil(parsedAnalysis.unusualExclusionsRedFlags.length / itemsPerPage);
                    const startIndex = redFlagsPage * itemsPerPage;
                    const endIndex = startIndex + itemsPerPage;
                    const displayedFlags = parsedAnalysis.unusualExclusionsRedFlags.slice(startIndex, endIndex);
                    return (
                      <div className="space-y-3">
                        <ul className="space-y-2 min-h-[90px]">
                          {displayedFlags.map((flag: string, idx: number) => (
                            <li key={idx} className="text-xs text-slate-700 flex items-start gap-1.5 leading-normal">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                              <span>{flag}</span>
                            </li>
                          ))}
                        </ul>
                        {totalPages > 1 && (
                          <div className="flex items-center justify-between pt-2.5 border-t border-rose-200/50">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setRedFlagsPage(prev => Math.max(0, prev - 1))}
                              disabled={redFlagsPage === 0}
                              className="text-[10px] text-rose-800 hover:bg-rose-100/70 disabled:opacity-50 h-7 px-2"
                            >
                              Previous
                            </Button>
                            <span className="text-[10px] text-rose-800 font-semibold">
                              Page {redFlagsPage + 1} of {totalPages}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setRedFlagsPage(prev => Math.min(totalPages - 1, prev + 1))}
                              disabled={redFlagsPage === totalPages - 1}
                              className="text-[10px] text-rose-800 hover:bg-rose-100/70 disabled:opacity-50 h-7 px-2"
                            >
                              Next
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })()
                ) : (
                  <p className="text-xs text-slate-500 italic">No unusual exclusions detected.</p>
                )}
              </div>

              {/* Claims Guide */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  Claims Guide
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {parsedAnalysis.claimsSubmissionProcedure || "No specific instructions found."}
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => setIsAnalysisOpen(false)}>Close Explainer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
};

// Inside Card dialog renderer helper
const renderDialogCoverageDetails = (analysis: any) => {
  const type = (analysis.insuranceType || "health").toLowerCase();

  switch (type) {
    case "health":
      const health = analysis.healthDetails || {};
      return (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-xs text-slate-400">Deductible (Indiv / Family)</span>
            <p className="font-semibold text-slate-800 mt-0.5">
              ${health.deductiblesIndividual || 0} / ${health.deductiblesFamily || 0}
            </p>
          </div>
          <div>
            <span className="text-xs text-slate-400">Coinsurance Rate</span>
            <p className="font-semibold text-slate-800 mt-0.5">
              {health.coinsurancePercentage ? `${health.coinsurancePercentage}%` : "0%"}
            </p>
          </div>
          <div>
            <span className="text-xs text-slate-400">Out of Pocket Maximum</span>
            <p className="font-semibold text-slate-800 mt-0.5">
              ${health.outOfPocketMaximum || "N/A"}
            </p>
          </div>
          <div>
            <span className="text-xs text-slate-400">Specialist Copayment</span>
            <p className="font-semibold text-slate-800 mt-0.5">
              ${health.copaymentsSpecialist || "N/A"}
            </p>
          </div>
          <div className="col-span-2">
            <span className="text-xs text-slate-400">Pre-Existing Conditions Waiting Period</span>
            <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-1 leading-relaxed">
              {health.preExistingConditionsLimitations || "No specific limitations."}
            </p>
          </div>
        </div>
      );

    case "life":
      const life = analysis.lifeDetails || {};
      return (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-xs text-slate-400">Death Benefit Amount</span>
            <p className="font-semibold text-slate-800 mt-0.5">
              ${life.deathBenefitAmount?.toLocaleString() || "N/A"}
            </p>
          </div>
          <div>
            <span className="text-xs text-slate-400">Beneficiary Type</span>
            <p className="font-semibold text-slate-800 mt-0.5">
              {life.beneficiaryRevocability || "N/A"}
            </p>
          </div>
          <div>
            <span className="text-xs text-slate-400">Suicide Exclusion window</span>
            <p className="font-semibold text-slate-800 mt-0.5">
              {life.suicideExclusionPeriodMonths ? `${life.suicideExclusionPeriodMonths} months` : "N/A"}
            </p>
          </div>
          <div>
            <span className="text-xs text-slate-400">Contestability window</span>
            <p className="font-semibold text-slate-800 mt-0.5">
              {life.contestabilityPeriodYears ? `${life.contestabilityPeriodYears} years` : "N/A"}
            </p>
          </div>
        </div>
      );

    case "home":
      const home = analysis.homeDetails || {};
      return (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-xs text-slate-400">Dwelling Cover Limit</span>
            <p className="font-semibold text-slate-800 mt-0.5">
              ${home.dwellingLimit?.toLocaleString() || "N/A"}
            </p>
          </div>
          <div>
            <span className="text-xs text-slate-400">Personal Property Limit</span>
            <p className="font-semibold text-slate-800 mt-0.5">
              ${home.personalPropertyLimit?.toLocaleString() || "N/A"}
            </p>
          </div>
          <div>
            <span className="text-xs text-slate-400">Wind/Hail Deductible</span>
            <p className="font-semibold text-slate-800 mt-0.5">
              ${home.deductibleWindHail?.toLocaleString() || "Standard"}
            </p>
          </div>
          <div className="col-span-2">
            <span className="text-xs text-slate-400">Hazard Exclusions</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {home.hazardExclusions && home.hazardExclusions.length > 0 ? (
                home.hazardExclusions.map((ex: string, idx: number) => (
                  <Badge key={idx} variant="secondary" className="text-[10px] py-0 px-2 bg-rose-50 text-rose-800 border-rose-100">
                    {ex}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">None</span>
              )}
            </div>
          </div>
        </div>
      );

    case "auto":
      const auto = analysis.autoDetails || {};
      return (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-xs text-slate-400">IDV (Vehicle Declared Value)</span>
            <p className="font-semibold text-slate-800 mt-0.5">
              ${auto.insuredDeclaredValueIdv?.toLocaleString() || "N/A"}
            </p>
          </div>
          <div>
            <span className="text-xs text-slate-400">No Claim Bonus (NCB)</span>
            <p className="font-semibold text-slate-800 mt-0.5">
              {auto.noClaimBonusPercentage ? `${auto.noClaimBonusPercentage}%` : "0%"}
            </p>
          </div>
          <div>
            <span className="text-xs text-slate-400">Compulsory / Voluntary Deductible</span>
            <p className="font-semibold text-slate-800 mt-0.5">
              ${auto.deductibleCompulsory || 0} / ${auto.deductibleVoluntary || 0}
            </p>
          </div>
          <div>
            <span className="text-xs text-slate-400">Zero Dep (Bumper to Bumper)</span>
            <p className="font-semibold text-slate-800 mt-0.5 capitalize">
              {auto.zeroDepreciationCoverage || "No"}
            </p>
          </div>
        </div>
      );

    case "disability":
      const disability = analysis.disabilityDetails || {};
      return (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-xs text-slate-400">Elimination (Waiting) Period</span>
            <p className="font-semibold text-slate-800 mt-0.5">
              {disability.eliminationPeriodDays ? `${disability.eliminationPeriodDays} Days` : "N/A"}
            </p>
          </div>
          <div>
            <span className="text-xs text-slate-400">Monthly Payout Benefit</span>
            <p className="font-semibold text-slate-800 mt-0.5">
              {disability.monthlyBenefitPercentage ? `${disability.monthlyBenefitPercentage}%` : "N/A"}
            </p>
          </div>
          <div className="col-span-2">
            <span className="text-xs text-slate-400">Definition of Disability</span>
            <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded border border-slate-100 mt-1 leading-relaxed">
              {disability.definitionOfDisability || "Not Extracted"}
            </p>
          </div>
        </div>
      );

    default:
      return <p className="text-xs text-slate-500">Scan details are ready to view.</p>;
  }
};

export default InsuranceCard;
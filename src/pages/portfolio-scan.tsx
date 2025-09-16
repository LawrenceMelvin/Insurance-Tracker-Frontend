import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  ArrowLeft,
  Scan
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Insurance {
  insuranceId: string;
  insuranceName: string;
  insuranceType: string;
  insurancePrice: number;
  insuranceCoverage?: number;
  insuranceToDate: string;
}

interface PortfolioAnalysis {
  overallRating: "Bad" | "Average" | "Good";
  score: number;
  suggestions: string[];
  coverageGaps: string[];
  strengths: string[];
}

export default function PortfolioScan() {
  const navigate = useNavigate();
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [analysis, setAnalysis] = useState<PortfolioAnalysis | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);

  useEffect(() => {
    // Load insurance data from localStorage or API
    const savedInsurances = localStorage.getItem("insurances");
    if (savedInsurances) {
      setInsurances(JSON.parse(savedInsurances));
    }
  }, []);

  const analyzePortfolio = () => {
    setIsScanning(true);
    
    // Simulate scanning delay
    setTimeout(() => {
      const analysis = performPortfolioAnalysis(insurances);
      setAnalysis(analysis);
      setIsScanning(false);
      setHasScanned(true);
    }, 2000);
  };

  const performPortfolioAnalysis = (insurances: Insurance[]): PortfolioAnalysis => {
    const suggestions: string[] = [];
    const coverageGaps: string[] = [];
    const strengths: string[] = [];
    let score = 0;

    // Check for insurance types
    const types = insurances.map(ins => ins.insuranceType.toLowerCase());
    const hasHealth = types.includes("health");
    const hasLife = types.includes("life");
    const hasAuto = types.includes("auto");
    const hasHome = types.includes("home");
    const hasTravel = types.includes("travel");

    // Basic coverage check
    if (!hasHealth) {
      coverageGaps.push("Health Insurance");
      suggestions.push("Health Insurance policy is missing from your portfolio. Consider adding comprehensive health coverage.");
    } else {
      const healthInsurance = insurances.find(ins => ins.insuranceType.toLowerCase() === "health");
      if (healthInsurance?.insuranceCoverage && healthInsurance.insuranceCoverage < 300000) {
        suggestions.push("Health insurance coverage is low. Consider increasing coverage to at least $300,000.");
      } else {
        strengths.push("Good health insurance coverage");
        score += 25;
      }
    }

    if (!hasLife) {
      coverageGaps.push("Life Insurance");
      suggestions.push("Life Insurance policy is missing from your portfolio. Life insurance is essential for financial security.");
    } else {
      const lifeInsurance = insurances.find(ins => ins.insuranceType.toLowerCase() === "life");
      if (lifeInsurance?.insuranceCoverage && lifeInsurance.insuranceCoverage < 500000) {
        suggestions.push("Life insurance coverage might be insufficient. Consider coverage of at least $500,000.");
      } else {
        strengths.push("Adequate life insurance coverage");
        score += 25;
      }
    }

    if (!hasAuto) {
      suggestions.push("Consider adding Auto Insurance if you own a vehicle.");
    } else {
      strengths.push("Auto insurance coverage in place");
      score += 15;
    }

    if (!hasHome) {
      suggestions.push("Consider adding Home/Property Insurance if you own property.");
    } else {
      strengths.push("Property insurance coverage in place");
      score += 15;
    }

    // Check for expired policies
    const expiredPolicies = insurances.filter(ins => new Date(ins.insuranceToDate) < new Date());
    if (expiredPolicies.length > 0) {
      suggestions.push(`You have ${expiredPolicies.length} expired ${expiredPolicies.length === 1 ? 'policy' : 'policies'}. Renew them immediately.`);
      score -= 10;
    }

    // Check for upcoming expirations (within 30 days)
    const upcomingExpirations = insurances.filter(ins => {
      const expiryDate = new Date(ins.insuranceToDate);
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      return expiryDate <= thirtyDaysFromNow && expiryDate >= new Date();
    });

    if (upcomingExpirations.length > 0) {
      suggestions.push(`${upcomingExpirations.length} ${upcomingExpirations.length === 1 ? 'policy expires' : 'policies expire'} within 30 days. Plan for renewal.`);
    }

    // Diversity bonus
    if (types.length >= 3) {
      strengths.push("Good portfolio diversity");
      score += 10;
    }

    // Premium analysis
    const totalPremium = insurances.reduce((sum, ins) => sum + ins.insurancePrice, 0);
    if (totalPremium > 0) {
      strengths.push(`Total annual premium: $${totalPremium.toLocaleString()}`);
      score += 5;
    }

    // Determine overall rating
    let overallRating: "Bad" | "Average" | "Good";
    if (score >= 70) {
      overallRating = "Good";
    } else if (score >= 40) {
      overallRating = "Average";
    } else {
      overallRating = "Bad";
    }

    return {
      overallRating,
      score: Math.max(0, Math.min(100, score)),
      suggestions,
      coverageGaps,
      strengths
    };
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case "Good": return "text-green-600 bg-green-100";
      case "Average": return "text-yellow-600 bg-yellow-100";
      case "Bad": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getRatingIcon = (rating: string) => {
    switch (rating) {
      case "Good": return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "Average": return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case "Bad": return <XCircle className="h-5 w-5 text-red-600" />;
      default: return <Shield className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 flex items-center text-gray-600"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Insurance Portfolio Scan
          </h1>
          <p className="text-gray-600">
            Analyze your insurance coverage and get personalized recommendations
          </p>
        </div>

        {/* Portfolio Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="mr-2 h-5 w-5" />
              Your Insurance Portfolio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {insurances.length}
                </div>
                <div className="text-sm text-gray-500">Total Policies</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  ${insurances.reduce((sum, ins) => sum + ins.insurancePrice, 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">Annual Premium</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  ${insurances.reduce((sum, ins) => sum + (ins.insuranceCoverage || 0), 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">Total Coverage</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scan Button */}
        {!hasScanned && (
          <div className="text-center mb-8">
            <Button
              onClick={analyzePortfolio}
              disabled={isScanning || insurances.length === 0}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isScanning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Scanning Portfolio...
                </>
              ) : (
                <>
                  <Scan className="mr-2 h-5 w-5" />
                  Scan My Portfolio
                </>
              )}
            </Button>
            {insurances.length === 0 && (
              <p className="text-sm text-gray-500 mt-2">
                Add some insurance policies first to scan your portfolio
              </p>
            )}
          </div>
        )}

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-6">
            {/* Overall Rating */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Portfolio Rating</span>
                  <Badge className={getRatingColor(analysis.overallRating)}>
                    {getRatingIcon(analysis.overallRating)}
                    <span className="ml-1">{analysis.overallRating}</span>
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Portfolio Score</span>
                      <span>{analysis.score}/100</span>
                    </div>
                    <Progress value={analysis.score} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Coverage Gaps */}
            {analysis.coverageGaps.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-red-600">
                    <XCircle className="mr-2 h-5 w-5" />
                    Coverage Gaps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysis.coverageGaps.map((gap, index) => (
                      <Alert key={index} className="border-red-200">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Missing: <strong>{gap}</strong>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Suggestions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-blue-600">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.suggestions.map((suggestion, index) => (
                    <Alert key={index} className="border-blue-200">
                      <AlertDescription>{suggestion}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Strengths */}
            {analysis.strengths.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-green-600">
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Portfolio Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysis.strengths.map((strength, index) => (
                      <div key={index} className="flex items-center text-green-700">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {strength}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <Button
                onClick={() => navigate("/add")}
                className="bg-green-600 hover:bg-green-700"
              >
                Add New Policy
              </Button>
              <Button
                onClick={() => {
                  setHasScanned(false);
                  setAnalysis(null);
                }}
                variant="outline"
              >
                Scan Again
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
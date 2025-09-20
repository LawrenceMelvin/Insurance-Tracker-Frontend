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
import { useNavigate, useLocation } from "react-router-dom";

interface Insurance {
  insuranceId: string;
  insuranceName: string;
  insuranceType: string;
  insurancePrice: number;
  insuranceCoverage: number;
  insuranceFromDate?: string;
  insuranceToDate?: string;
  insuranceTerm?: string;
}

interface PortfolioOverview {
  totalPolicies: number;
  annualPremium: number;
  totalCoverage: number;
}

interface PortfolioAnalysis {
  overallRating: "Bad" | "Average" | "Good";
  score: number;
  suggestions: string[];
  coverageGaps: string[];
  strengths: string[];
}

const apiUrl = import.meta.env.VITE_APP_API_URL;

export default function PortfolioScan() {
  const navigate = useNavigate();
  const location = useLocation();
  const [portfolioOverview, setPortfolioOverview] = useState<PortfolioOverview | null>(null);
  const [analysis, setAnalysis] = useState<PortfolioAnalysis | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get insurance policies from navigation state
  const insurancePolicies: Insurance[] = location.state?.insurancePolicies || [];

  useEffect(() => {
    // Calculate portfolio overview from the passed insurance data
    calculatePortfolioOverview();
  }, []);

  const calculatePortfolioOverview = () => {
    const totalPolicies = insurancePolicies.length;
    const annualPremium = insurancePolicies.reduce((sum, policy) => sum + policy.insurancePrice, 0);
    const totalCoverage = insurancePolicies.reduce((sum, policy) => sum + policy.insuranceCoverage, 0);

    setPortfolioOverview({
      totalPolicies,
      annualPremium,
      totalCoverage
    });
  };

  const scanPortfolio = async () => {
    try {
      setIsScanning(true);
      setError(null);
      
      // Send insurance data to backend for analysis
      const response = await fetch(`${apiUrl}/portfolio/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ insurancePolicies })
      });

      if (!response.ok) {
        throw new Error('Failed to scan portfolio');
      }

      const data = await response.json();
      setAnalysis(data);
      setHasScanned(true);
    } catch (error) {
      console.error('Error scanning portfolio:', error);
      setError('Failed to scan portfolio. Please try again.');
    } finally {
      setIsScanning(false);
    }
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

        {error && (
          <Alert className="mb-6 border-red-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-600">
              {error}
            </AlertDescription>
          </Alert>
        )}

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
                  {portfolioOverview?.totalPolicies || 0}
                </div>
                <div className="text-sm text-gray-500">Total Policies</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  ${portfolioOverview?.annualPremium?.toLocaleString() || 0}
                </div>
                <div className="text-sm text-gray-500">Annual Premium</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  ${portfolioOverview?.totalCoverage?.toLocaleString() || 0}
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
              onClick={scanPortfolio}
              disabled={isScanning || (portfolioOverview?.totalPolicies || 0) === 0}
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
            {(portfolioOverview?.totalPolicies || 0) === 0 && (
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
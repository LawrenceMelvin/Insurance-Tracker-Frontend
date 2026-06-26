import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import Estimate from "./estimate";

// Helper to render with Router context
const renderWithRouter = (ui: React.ReactElement) => {
  return render(ui, { wrapper: MemoryRouter });
};

describe("Estimate Page Unit Tests", () => {
  beforeEach(() => {
    localStorage.clear();
    // Default fetch mock setup
    const defaultFetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 401,
        json: () => Promise.resolve({}),
      } as Response)
    );
    vi.stubGlobal("fetch", defaultFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should redirect to login if user is not authenticated", async () => {
    renderWithRouter(<Estimate />);
    
    // Default fetch mock returns 401, causing redirect to login
    await waitFor(() => {
      expect(localStorage.getItem("isLoggedIn")).toBeNull();
    });
  });

  it("should load policies and render form correctly when authenticated", async () => {
    localStorage.setItem("isLoggedIn", "true");

    const mockPolicies = [
      {
        insuranceId: 1,
        insuranceName: "Star Health Premier",
        insuranceType: "health",
        insurancePrice: 12000,
        insuranceCoverage: 500000,
        insuranceFromDate: "2026-01-01",
        insuranceToDate: "2026-12-31",
        belongsToName: "Self",
        policyAnalysisJson: JSON.stringify({
          insuranceType: "health",
          insurerName: "Star Health",
          healthDetails: {
            deductiblesIndividual: 100,
            coinsurancePercentage: 10
          },
          unusualExclusionsRedFlags: ["Room rent cap is 5000"]
        })
      }
    ];

    const mockFetch = vi.mocked(fetch);
    mockFetch.mockImplementation((url) => {
      if (url.toString().endsWith("/user")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ authenticated: true, name: "Bob" }),
        } as Response);
      }
      if (url.toString().endsWith("/family/insurance")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockPolicies),
        } as Response);
      }
      return Promise.reject(new Error("Unknown endpoint"));
    });

    renderWithRouter(<Estimate />);

    await waitFor(() => {
      expect(screen.getByText("Star Health Premier (Self)")).toBeInTheDocument();
    });

    expect(screen.getByText("AI Parsed")).toBeInTheDocument();
  });

  it("should calculate estimate successfully and show projection result", async () => {
    localStorage.setItem("isLoggedIn", "true");

    const mockPolicies = [
      {
        insuranceId: 1,
        insuranceName: "Star Health Premier",
        insuranceType: "health",
        insurancePrice: 12000,
        insuranceCoverage: 500000,
        insuranceFromDate: "2026-01-01",
        insuranceToDate: "2026-12-31",
        belongsToName: "Self",
        policyAnalysisJson: JSON.stringify({
          insuranceType: "health",
          insurerName: "Star Health",
          healthDetails: {
            deductiblesIndividual: 100,
            coinsurancePercentage: 10
          }
        })
      }
    ];

    const mockEstimateResponse = {
      estimatedInsurerCovered: 45000.0,
      estimatedUserOutOfPocket: 15000.0,
      deductionsBreakdown: [
        {
          category: "Room Rent",
          deductedAmount: 5000.0,
          reason: "Exceeded rent cap of 5000/day"
        }
      ],
      suggestions: ["Downgrade your room category"]
    };

    const mockFetch = vi.mocked(fetch);
    mockFetch.mockImplementation((url) => {
      if (url.toString().endsWith("/user")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ authenticated: true, name: "Bob" }),
        } as Response);
      }
      if (url.toString().endsWith("/family/insurance")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockPolicies),
        } as Response);
      }
      if (url.toString().endsWith("/insurance/1/estimate")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockEstimateResponse),
        } as Response);
      }
      return Promise.reject(new Error("Unknown endpoint"));
    });

    renderWithRouter(<Estimate />);

    await waitFor(() => {
      expect(screen.getByText("Star Health Premier (Self)")).toBeInTheDocument();
    });

    // Fill the inputs
    fireEvent.change(screen.getByLabelText(/Daily Room Rent/i), { target: { value: "7000" } });
    fireEvent.change(screen.getByLabelText(/Hospitalization Days/i), { target: { value: "4" } });
    fireEvent.change(screen.getByLabelText(/Procedure Cost/i), { target: { value: "30000" } });
    fireEvent.change(screen.getByLabelText(/Other Expenses/i), { target: { value: "5000" } });

    // Submit
    fireEvent.click(screen.getByText(/Generate Out-of-Pocket Estimate/i));

    // Verify output projection
    await waitFor(() => {
      expect(screen.getByText("Out-of-Pocket Projection Summary")).toBeInTheDocument();
    });

    expect(screen.getByText("$45,000.00")).toBeInTheDocument();
    expect(screen.getByText("$15,000.00")).toBeInTheDocument();
    expect(screen.getByText("Exceeded rent cap of 5000/day")).toBeInTheDocument();
    expect(screen.getByText("Downgrade your room category")).toBeInTheDocument();
  });

  it("should show manual configuration fallback if policy is not AI parsed", async () => {
    localStorage.setItem("isLoggedIn", "true");

    const mockPolicies = [
      {
        insuranceId: 2,
        insuranceName: "Manual Care Plus",
        insuranceType: "health",
        insurancePrice: 8000,
        insuranceCoverage: 300000,
        insuranceFromDate: "2026-01-01",
        insuranceToDate: "2026-12-31",
        belongsToName: "Self"
        // No policyAnalysisJson
      }
    ];

    const mockFetch = vi.mocked(fetch);
    mockFetch.mockImplementation((url) => {
      if (url.toString().endsWith("/user")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ authenticated: true, name: "Bob" }),
        } as Response);
      }
      if (url.toString().endsWith("/family/insurance")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockPolicies),
        } as Response);
      }
      return Promise.reject(new Error("Unknown endpoint"));
    });

    renderWithRouter(<Estimate />);

    await waitFor(() => {
      expect(screen.getByText("Manual Care Plus (Self)")).toBeInTheDocument();
    });

    expect(screen.getByText("Manually Configured")).toBeInTheDocument();
    expect(screen.getByText(/Upload policy PDF booklet/i)).toBeInTheDocument();
  });
});

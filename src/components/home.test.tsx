import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import Home from "./home";

// Helper to render with Router context
const renderWithRouter = (ui: React.ReactElement) => {
  return render(ui, { wrapper: MemoryRouter });
};

describe("Home Component Tests", () => {
  beforeEach(() => {
    localStorage.clear();
    // Setup a clean fetch mock with a default fallback to prevent crashes
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

  it("should immediately render landing page if not logged in (Optimistic Load)", () => {
    // localStorage isLoggedIn is not set
    renderWithRouter(<Home />);

    // Should immediately show the landing page content rather than the loading spinner
    expect(screen.getByText("Welcome to InsureTrack")).toBeInTheDocument();
    expect(screen.queryByText("Loading your dashboard...")).not.toBeInTheDocument();
  });

  it("should display the dashboard and user name when authentication succeeds", async () => {
    // Mock user is logged in
    localStorage.setItem("isLoggedIn", "true");

    const mockFetch = vi.mocked(fetch);
    mockFetch.mockImplementation((url) => {
      if (url.toString().endsWith("/user")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ authenticated: true, name: "Alice Smith" }),
        } as Response);
      }
      if (url.toString().endsWith("/family/members")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ inFamily: false }),
        } as Response);
      }
      if (url.toString() === "undefined/") { // backend URL fallback in tests
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response);
      }
      return Promise.reject(new Error("Unknown URL: " + url));
    });

    renderWithRouter(<Home />);

    // Expecting to load dashboard
    await waitFor(() => {
      expect(screen.getByText("Welcome, Alice Smith")).toBeInTheDocument();
    });

    expect(screen.getByText("My Policies")).toBeInTheDocument();
  });

  it("should clear session and show landing page if authentication fails", async () => {
    localStorage.setItem("isLoggedIn", "true");

    const mockFetch = vi.mocked(fetch);
    mockFetch.mockImplementation((url) => {
      if (url.toString().endsWith("/user")) {
        return Promise.resolve({
          ok: false,
          status: 401,
        } as Response);
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    renderWithRouter(<Home />);

    // Should show landing page
    await waitFor(() => {
      expect(screen.getByText("Welcome to InsureTrack")).toBeInTheDocument();
    });

    expect(localStorage.getItem("isLoggedIn")).toBeNull();
  });
});

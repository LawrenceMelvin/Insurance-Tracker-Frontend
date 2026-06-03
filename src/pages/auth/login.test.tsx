import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import LoginPage from "./login";

const mockNavigate = vi.fn();
let mockLocation = { search: "" };

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<any>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  };
});

describe("LoginPage Component Tests", () => {
  beforeEach(() => {
    localStorage.clear();
    mockNavigate.mockClear();
    mockLocation = { search: "" };
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should instantly render the login form if isLoggedIn is not true", () => {
    // Initial fetch mock for auth check failing/unauthorized
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 401,
      } as Response)
    );

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText("name@example.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });

  it("should check auth and redirect to home if isLoggedIn is true and user is valid", async () => {
    localStorage.setItem("isLoggedIn", "true");

    const mockFetch = vi.mocked(fetch);
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ authenticated: true }),
      } as Response)
    );

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  it("should display verification success alert if token is in URL parameters", async () => {
    mockLocation = { search: "?token=valid-test-token" };

    const mockFetch = vi.mocked(fetch);
    mockFetch.mockImplementation((url) => {
      if (url.toString().includes("/auth/register/verify")) {
        return Promise.resolve({
          ok: true,
        } as Response);
      }
      return Promise.resolve({
        ok: false,
        status: 401,
      } as Response);
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Email verified successfully! You can now log in.")).toBeInTheDocument();
    });
  });

  it("should set isLoggedIn and redirect to home upon successful form submission", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockImplementation((url) => {
      if (url.toString().endsWith("/auth/login")) {
        return Promise.resolve({
          ok: true,
        } as Response);
      }
      if (url.toString().endsWith("/user")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ authenticated: true }),
        } as Response);
      }
      return Promise.resolve({
        ok: false,
        status: 401,
      } as Response);
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText("name@example.com");
    const passwordInput = screen.getByPlaceholderText("••••••••");
    const submitButton = screen.getByRole("button", { name: /login/i });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(localStorage.getItem("isLoggedIn")).toBe("true");
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });
});

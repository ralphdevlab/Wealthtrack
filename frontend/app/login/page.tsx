"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [isSignup, setIsSignup] = useState(false);

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");

    // Validation
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    if (isSignup && (!firstName || !lastName)) {
      setError("Please enter your first and last name");
      return;
    }

    setLoading(true);

    const endpoint = isSignup ? "register" : "login";
    const body = isSignup
      ? { email, password, firstName, lastName }
      : { email, password };

    try {
      const res = await fetch(`http://localhost:8080/api/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        setError(text || (isSignup ? "Could not create account" : "Invalid email or password"));
        setLoading(false);
        return;
      }

      const data = await res.json();

      // Store the JWT token and user info
      localStorage.setItem("token", data.token);
      localStorage.setItem("firstName", data.firstName);

      // Go to dashboard
      router.push("/");
    } catch {
      setError("Something went wrong. Is the server running?");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc] flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 w-full max-w-sm">

        {/* Logo / title */}
        <div className="mb-6">
          <div className="text-xl font-semibold text-[#27500A] mb-1">WealthTrack</div>
          <div className="text-sm text-gray-500">
            {isSignup ? "Create your account" : "Welcome back"}
          </div>
        </div>

        <div className="space-y-3">
          {/* Signup-only fields */}
          {isSignup && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">First name</label>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:border-[#639922]"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Last name</label>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:border-[#639922]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:border-[#639922]"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:border-[#639922]"
            />
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-[#639922] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#557f1d] transition-colors disabled:opacity-50"
          >
            {loading ? "Please wait..." : isSignup ? "Create account" : "Log in"}
          </button>
        </div>

        {/* Toggle */}
        <div className="mt-5 text-center text-sm text-gray-500">
          {isSignup ? "Already have an account?" : "Don't have an account?"}
          <button
            onClick={() => { setIsSignup(!isSignup); setError(""); }}
            className="ml-1 text-[#185FA5] font-medium hover:underline"
          >
            {isSignup ? "Log in" : "Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}
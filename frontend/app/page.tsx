"use client";

import { useEffect, useRef, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useRouter } from "next/navigation";
import { fetchResilient } from "./lib/fetchResilient";
import { DashboardSkeleton, InsightsSkeleton } from "./components/Skeletons";
import { useCountUp } from "./components/CountUp";
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

type HoldingPerformance = {
  id: number;
  ticker: string;
  companyName: string;
  shares: number;
  avgCostBasis: number;
  currentPrice: number;
  marketValue: number;
  totalCost: number;
  gainLoss: number;
  gainLossPercent: number;
};

export default function Dashboard() {
  const [holdings, setHoldings] = useState<HoldingPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [insight, setInsight] = useState("");
  const [insightLoading, setInsightLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<HoldingPerformance | null>(null);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const [portfolioId, setPortfolioId] = useState<number | null>(null);
  const [userName, setUserName] = useState("");
  const [needsPortfolio, setNeedsPortfolio] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState("");
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [wakingUp, setWakingUp] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Form fields
  const [ticker, setTicker] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [shares, setShares] = useState("");
  const [avgCostBasis, setAvgCostBasis] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Ticker autocomplete
  const [suggestions, setSuggestions] = useState<{ symbol: string; description: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getAuthHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const loadDashboard = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    setUserName(localStorage.getItem("firstName") || "");
    setLoadError(false);

    try {
      // Get the user's portfolios
      const res = await fetchResilient(
        `${API}/api/portfolios/me`,
        { headers: getAuthHeaders() },
        {
          onStatusChange: (status) => {
            setWakingUp(status === "waking");
          },
        }
      );

      if (res.status === 401 || res.status === 403) {
        // Token invalid/expired — back to login
        localStorage.removeItem("token");
        router.push("/login");
        return;
      }

      const portfolios = await res.json();

      if (!portfolios || portfolios.length === 0) {
        // No portfolio yet — show the create prompt
        setNeedsPortfolio(true);
        setLoading(false);
        return;
      }

      const pid = portfolios[0].id;
      setPortfolioId(pid);
      loadHoldings(pid);
    } catch {
      setWakingUp(false);
      setLoadError(true);
      setLoading(false);
    }
  };

  const handleCreatePortfolio = async () => {
    if (!newPortfolioName.trim()) return;
    try {
      const res = await fetch(`${API}/api/portfolios`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: newPortfolioName }),
      });
      const portfolio = await res.json();
      setNeedsPortfolio(false);
      setPortfolioId(portfolio.id);
      loadHoldings(portfolio.id);
    } catch {
      // handle error
    }
  };

  const loadHoldings = (pid: number) => {
    fetch(`${API}/api/portfolios/${pid}/performance`, {
      headers: getAuthHeaders(),
    })
      .then((res) => res.json())
      .then((data) => {
        setHoldings(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    setInsightLoading(true);
    fetch(`${API}/api/portfolios/${pid}/insights`, {
      headers: getAuthHeaders(),
    })
      .then((res) => res.json())
      .then((data) => {
        setInsight(data.insight);
        setInsightLoading(false);
      })
      .catch(() => setInsightLoading(false));
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleSubmit = async () => {
    setError("");

    // Basic validation
    if (!ticker || !companyName || !shares || !avgCostBasis) {
      setError("Please fill in all fields");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/holdings`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ticker,
          companyName,
          shares: parseFloat(shares),
          avgCostBasis: parseFloat(avgCostBasis),
          portfolioId: portfolioId,
        }),
      });

      if (!res.ok) {
        setError("Failed to add holding");
        setSubmitting(false);
        return;
      }

      // Reset form, close modal, refresh data
      setTicker("");
      setCompanyName("");
      setShares("");
      setAvgCostBasis("");
      setSuggestions([]);
      setShowSuggestions(false);
      setShowModal(false);
      if (portfolioId) loadHoldings(portfolioId);
    } catch {
      setError("Something went wrong");
    }
    setSubmitting(false);
  };

  const handleTickerChange = (value: string) => {
    const upper = value.toUpperCase();
    setTicker(upper);

    if (searchDebounce.current) clearTimeout(searchDebounce.current);

    if (upper.trim().length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    searchDebounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API}/api/market/search?q=${encodeURIComponent(upper)}`, {
          headers: getAuthHeaders(),
        });
        if (!res.ok) return;
        const results = await res.json();
        setSuggestions(results);
        setShowSuggestions(true);
      } catch {
        // silently ignore — autocomplete is best-effort
      }
    }, 300);
  };

  const handleSelectSuggestion = (suggestion: { symbol: string; description: string }) => {
    setTicker(suggestion.symbol);
    setCompanyName(suggestion.description);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const closeAddModal = () => {
    setShowModal(false);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`${API}/api/holdings/${deleteTarget.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      setDeleteTarget(null);
      if (portfolioId) loadHoldings(portfolioId);
    } catch {
      // silently fail
    }
    setDeleting(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("firstName");
    router.push("/login");
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      await fetch(`${API}/api/users/me`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      // Clear token and send to login
      localStorage.removeItem("token");
      localStorage.removeItem("firstName");
      router.push("/login");
    } catch {
      setDeletingAccount(false);
    }
  };

  const totalValue = holdings.reduce((sum, h) => sum + h.marketValue, 0);
  const totalCost = holdings.reduce((sum, h) => sum + h.totalCost, 0);
  const totalGain = totalValue - totalCost;
  const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
  const displayedTotalValue = useCountUp(totalValue);

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="min-h-screen bg-[#F1F5FB]">
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 h-14 bg-white border-b border-[#DCE7F5] flex items-center justify-between px-4 z-40">
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
          className="text-gray-500 hover:text-[#185FA5] transition-colors p-1 -ml-1"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="text-base font-semibold text-[#185FA5]">WealthTrack</div>
        <div className="w-6" />
      </div>

      {/* Mobile drawer overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`w-[190px] fixed inset-y-0 left-0 bg-white border-r border-[#DCE7F5] flex flex-col z-50 transform transition-transform duration-200 md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-5 py-6">
          <div className="text-lg font-semibold text-[#185FA5]">WealthTrack</div>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          <a
            href="#top"
            onClick={() => setSidebarOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium bg-[#E6F1FB] text-[#185FA5]"
          >
            Dashboard
          </a>
          <a
            href="#holdings"
            onClick={() => setSidebarOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-[#E6F1FB] hover:text-[#185FA5] transition-colors"
          >
            Holdings
          </a>
          <a
            href="#insights"
            onClick={() => setSidebarOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-[#E6F1FB] hover:text-[#185FA5] transition-colors"
          >
            AI insights
          </a>
        </nav>

        <div className="border-t border-[#DCE7F5] px-3 py-4 space-y-1">
          <button
            onClick={() => { setSidebarOpen(false); handleLogout(); }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-[#E6F1FB] hover:text-[#185FA5] transition-colors"
          >
            Log out
          </button>
          <button
            onClick={() => { setSidebarOpen(false); setShowDeleteAccount(true); }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            Delete account
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="md:ml-[190px] pt-16 md:pt-8 px-4 sm:px-6 md:p-8">
        <div className="max-w-5xl mx-auto" id="top">

          {/* Top bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-8">
            <h1 className="text-lg font-medium text-gray-900">
              {userName ? `Welcome, ${userName}` : "Your portfolio"}
            </h1>
            {!needsPortfolio && (
              <button
                onClick={() => setShowModal(true)}
                className="bg-[#639922] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#557f1d] transition-colors"
              >
                + Add holding
              </button>
            )}
          </div>

          {wakingUp && (
            <div className="flex items-center gap-3 bg-[#E6F1FB] border border-[#B5D4F4] text-[#185FA5] rounded-lg px-4 py-3 text-sm mb-6">
              <svg className="animate-spin h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Waking up the server, this can take up to a minute…
            </div>
          )}

          {loadError ? (
            <div className="bg-white border border-[#DCE7F5] rounded-xl p-8 text-center max-w-md mx-auto mt-12">
              <div className="text-lg font-medium text-gray-900 mb-2">Couldn&apos;t reach the server</div>
              <div className="text-sm text-gray-500 mb-5">Please try again in a moment.</div>
              <button
                onClick={() => { setLoading(true); loadDashboard(); }}
                className="bg-[#378ADD] text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-[#185FA5] transition-colors"
              >
                Try again
              </button>
            </div>
          ) : loading ? (
            <DashboardSkeleton />
          ) : needsPortfolio ? (
            <div className="bg-white border border-[#DCE7F5] rounded-xl p-8 text-center max-w-md mx-auto mt-12">
              <div className="text-lg font-medium text-gray-900 mb-2">Create your first portfolio</div>
              <div className="text-sm text-gray-500 mb-5">Give it a name to get started — like "Brokerage" or "Retirement".</div>
              <input
                value={newPortfolioName}
                onChange={(e) => setNewPortfolioName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreatePortfolio()}
                placeholder="My Portfolio"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-[#378ADD]"
              />
              <button
                onClick={handleCreatePortfolio}
                className="w-full bg-[#378ADD] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#185FA5] transition-colors"
              >
                Create portfolio
              </button>
            </div>
          ) : (
            <>
              <div className="text-sm text-gray-500 mb-1">Total portfolio value</div>
              <div className="text-4xl font-semibold text-gray-900 mb-2">${fmt(displayedTotalValue)}</div>
              <div className="flex items-center gap-3 mb-8">
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                  totalGain >= 0 ? "bg-[#EAF3DE] text-[#27500A]" : "bg-red-100 text-red-700"
                }`}>
                  {totalGain >= 0 ? "↑" : "↓"} ${fmt(Math.abs(totalGain))}
                </span>
                <span className="text-sm text-gray-500">
                  {totalGainPercent >= 0 ? "+" : ""}{totalGainPercent.toFixed(2)}% all time
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 animate-fade-in-up" style={{ animationDelay: "0ms" }}>
                <div className="bg-white border border-[#DCE7F5] rounded-xl p-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Invested</div>
                  <div className="text-xl font-semibold text-gray-900">${fmt(totalCost)}</div>
                </div>
                <div className="bg-white border border-[#DCE7F5] rounded-xl p-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total gain</div>
                  <div className={`text-xl font-semibold ${totalGain >= 0 ? "text-[#3B6D11]" : "text-red-600"}`}>
                    {totalGain >= 0 ? "+" : ""}${fmt(totalGain)}
                  </div>
                </div>
                <div className="bg-white border border-[#DCE7F5] rounded-xl p-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Holdings</div>
                  <div className="text-xl font-semibold text-gray-900">{holdings.length}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {/* Holdings list */}
                <div id="holdings" className="lg:col-span-2 bg-white border border-[#DCE7F5] rounded-xl p-5 animate-fade-in-up" style={{ animationDelay: "60ms" }}>
                  <div className="text-sm font-medium text-gray-900 mb-4">Holdings</div>
                  {holdings.length === 0 ? (
                    <div className="text-sm text-gray-400 py-4">No holdings yet. Click "+ Add holding" to start.</div>
                  ) : (
                    holdings.map((h) => (
                      <div key={h.ticker} className="group flex items-center justify-between gap-3 py-3 border-b border-gray-100 last:border-0">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate">{h.ticker}</div>
                          <div className="text-xs text-gray-500 truncate">{h.companyName}</div>
                          <div className="text-xs text-gray-400 mt-0.5 truncate">
                            {h.shares} {h.shares === 1 ? "share" : "shares"} · ${fmt(h.currentPrice)} each
                          </div>
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0">
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">${fmt(h.marketValue)}</div>
                            <div className={`text-xs ${h.gainLoss >= 0 ? "text-[#3B6D11]" : "text-red-600"}`}>
                              {h.gainLossPercent >= 0 ? "+" : ""}{h.gainLossPercent.toFixed(2)}%
                            </div>
                          </div>
                          <button
                            onClick={() => setDeleteTarget(h)}
                            className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 text-lg"
                            title="Delete holding"
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Allocation pie chart */}
                <div className="bg-white border border-[#DCE7F5] rounded-xl p-5 animate-fade-in-up" style={{ animationDelay: "120ms" }}>
                  <div className="text-sm font-medium text-gray-900 mb-4">Allocation</div>
                  {holdings.length === 0 ? (
                    <div className="text-sm text-gray-400 py-4">Add holdings to see allocation.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={holdings.map((h) => ({ name: h.ticker, value: h.marketValue }))}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          innerRadius={40}
                        >
                          {holdings.map((_, i) => (
                            <Cell key={i} fill={["#378ADD", "#185FA5", "#7EB6EA", "#9FB8CC", "#5BA3E8", "#639922"][i % 6]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `$${fmt(Number(value))}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                  {/* Legend */}
                  <div className="mt-2 space-y-1">
                    {holdings.map((h, i) => (
                      <div key={h.ticker} className="flex items-center gap-2 text-xs">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ background: ["#378ADD", "#185FA5", "#7EB6EA", "#9FB8CC", "#5BA3E8", "#639922"][i % 6] }}
                        ></span>
                        <span className="text-gray-600">{h.ticker}</span>
                        <span className="text-gray-400 ml-auto">
                          {totalValue > 0 ? ((h.marketValue / totalValue) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Insights + Performers row */}
              <div id="insights" className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-3 animate-fade-in-up" style={{ animationDelay: "180ms" }}>

                {/* AI Insights - takes 2 columns */}
                <div className="lg:col-span-2 bg-white border border-[#DCE7F5] rounded-xl p-5">
                  <div className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                    AI Insights
                    <span className="text-xs bg-[#E6F1FB] text-[#185FA5] px-2 py-0.5 rounded-full font-normal">
                      ✨ Powered by AI
                    </span>
                  </div>
                  {insightLoading ? (
                    <InsightsSkeleton />
                  ) : (
                    <div className="bg-[#E6F1FB] border border-[#B5D4F4] rounded-lg p-4">
                      <div className="text-sm text-[#185FA5] leading-relaxed whitespace-pre-line">
                        {insight}
                      </div>
                    </div>
                  )}
                </div>

                {/* Best & Worst Performer */}
                <div className="bg-white border border-[#DCE7F5] rounded-xl p-5">
                  <div className="text-sm font-medium text-gray-900 mb-3">Performance</div>
                  {holdings.length === 0 ? (
                    <div className="text-sm text-gray-400">No data yet.</div>
                  ) : (
                    <div className="space-y-3">
                      {/* Best performer */}
                      {(() => {
                        const best = [...holdings].sort((a, b) => b.gainLossPercent - a.gainLossPercent)[0];
                        return (
                          <div className="bg-[#EAF3DE] border border-[#C0DD97] rounded-lg p-3">
                            <div className="text-xs text-[#27500A] uppercase tracking-wide mb-1">Top performer</div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-900">{best.ticker}</span>
                              <span className="text-sm font-semibold text-[#3B6D11]">
                                +{best.gainLossPercent.toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Worst performer */}
                      {(() => {
                        const worst = [...holdings].sort((a, b) => a.gainLossPercent - b.gainLossPercent)[0];
                        const isLoss = worst.gainLossPercent < 0;
                        return (
                          <div className={`rounded-lg p-3 border ${isLoss ? "bg-red-50 border-red-200" : "bg-[#F1F5FB] border-[#DCE7F5]"}`}>
                            <div className={`text-xs uppercase tracking-wide mb-1 ${isLoss ? "text-red-700" : "text-gray-500"}`}>
                              {isLoss ? "Biggest loss" : "Lowest gain"}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-900">{worst.ticker}</span>
                              <span className={`text-sm font-semibold ${isLoss ? "text-red-600" : "text-gray-600"}`}>
                                {worst.gainLossPercent >= 0 ? "+" : ""}{worst.gainLossPercent.toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Add Holding Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Add a holding</h2>
              <button onClick={closeAddModal} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <label className="text-xs text-gray-500 uppercase tracking-wide">Ticker</label>
                <input
                  value={ticker}
                  onChange={(e) => handleTickerChange(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  placeholder="AAPL"
                  autoComplete="off"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:border-[#378ADD]"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-[#DCE7F5] rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {suggestions.map((s) => (
                      <button
                        key={s.symbol}
                        type="button"
                        onMouseDown={() => handleSelectSuggestion(s)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-[#E6F1FB] transition-colors flex items-center justify-between gap-2"
                      >
                        <span className="font-medium text-gray-900">{s.symbol}</span>
                        <span className="text-gray-500 truncate">{s.description}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Company name</label>
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Apple Inc."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:border-[#378ADD]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">Shares</label>
                  <input
                    value={shares}
                    onChange={(e) => setShares(e.target.value)}
                    placeholder="10"
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:border-[#378ADD]"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">Avg cost</label>
                  <input
                    value={avgCostBasis}
                    onChange={(e) => setAvgCostBasis(e.target.value)}
                    placeholder="150.00"
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:border-[#378ADD]"
                  />
                </div>
              </div>

              {error && <div className="text-sm text-red-600">{error}</div>}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-[#639922] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#557f1d] transition-colors disabled:opacity-50"
              >
                {submitting ? "Adding..." : "Add holding"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation popup */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Delete holding?</h2>
            <p className="text-sm text-gray-500 mb-5">
              Are you sure you want to delete <span className="font-medium text-gray-900">{deleteTarget.ticker}</span> ({deleteTarget.companyName})? This can't be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                No, keep it
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete account confirmation */}
      {showDeleteAccount && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Delete your account?</h2>
            <p className="text-sm text-gray-500 mb-5">
              This will permanently delete your account, all your portfolios, and all your holdings. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteAccount(false)}
                className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                className="flex-1 bg-red-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deletingAccount ? "Deleting..." : "Delete forever"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useRouter } from "next/navigation";
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

  // Form fields
  const [ticker, setTicker] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [shares, setShares] = useState("");
  const [avgCostBasis, setAvgCostBasis] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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

    try {
      // Get the user's portfolios
      const res = await fetch(`${API}/api/portfolios/me`, {
        headers: getAuthHeaders(),
      });

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
      setShowModal(false);
      if (portfolioId) loadHoldings(portfolioId);
    } catch {
      setError("Something went wrong");
    }
    setSubmitting(false);
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

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="min-h-screen bg-[#F1F5FB]">
      {/* Sidebar */}
      <aside className="w-[190px] fixed inset-y-0 left-0 bg-white border-r border-[#DCE7F5] flex flex-col z-40">
        <div className="px-5 py-6">
          <div className="text-lg font-semibold text-[#185FA5]">WealthTrack</div>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          <a
            href="#top"
            className="block px-3 py-2 rounded-lg text-sm font-medium bg-[#E6F1FB] text-[#185FA5]"
          >
            Dashboard
          </a>
          <a
            href="#holdings"
            className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-[#E6F1FB] hover:text-[#185FA5] transition-colors"
          >
            Holdings
          </a>
          <a
            href="#insights"
            className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-[#E6F1FB] hover:text-[#185FA5] transition-colors"
          >
            AI insights
          </a>
        </nav>

        <div className="border-t border-[#DCE7F5] px-3 py-4 space-y-1">
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-[#E6F1FB] hover:text-[#185FA5] transition-colors"
          >
            Log out
          </button>
          <button
            onClick={() => setShowDeleteAccount(true)}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            Delete account
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-[190px] p-8">
        <div className="max-w-5xl mx-auto" id="top">

          {/* Top bar */}
          <div className="flex items-center justify-between mb-8">
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

          {loading ? (
            <div className="text-gray-400">Loading your portfolio...</div>
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
              <div className="text-4xl font-semibold text-gray-900 mb-2">${fmt(totalValue)}</div>
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
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
                <div id="holdings" className="lg:col-span-2 bg-white border border-[#DCE7F5] rounded-xl p-5">
                  <div className="text-sm font-medium text-gray-900 mb-4">Holdings</div>
                  {holdings.length === 0 ? (
                    <div className="text-sm text-gray-400 py-4">No holdings yet. Click "+ Add holding" to start.</div>
                  ) : (
                    holdings.map((h) => (
                      <div key={h.ticker} className="group flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{h.ticker}</div>
                          <div className="text-xs text-gray-500">{h.companyName}</div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {h.shares} {h.shares === 1 ? "share" : "shares"} · ${fmt(h.currentPrice)} each
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
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
                <div className="bg-white border border-[#DCE7F5] rounded-xl p-5">
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
              <div id="insights" className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-3">

                {/* AI Insights - takes 2 columns */}
                <div className="lg:col-span-2 bg-white border border-[#DCE7F5] rounded-xl p-5">
                  <div className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                    AI Insights
                    <span className="text-xs bg-[#E6F1FB] text-[#185FA5] px-2 py-0.5 rounded-full font-normal">
                      ✨ Powered by AI
                    </span>
                  </div>
                  {insightLoading ? (
                    <div className="text-sm text-gray-400">Analyzing your portfolio...</div>
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
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Add a holding</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Ticker</label>
                <input
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  placeholder="AAPL"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:border-[#378ADD]"
                />
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
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
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
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
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

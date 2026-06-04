"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

type HoldingPerformance = {
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

  // Form fields
  const [ticker, setTicker] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [shares, setShares] = useState("");
  const [avgCostBasis, setAvgCostBasis] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadHoldings = () => {
    fetch("http://localhost:8080/api/portfolios/1/performance")
      .then((res) => res.json())
      .then((data) => {
        setHoldings(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Fetch AI insights
    setInsightLoading(true);
    fetch("http://localhost:8080/api/portfolios/1/insights")
      .then((res) => res.json())
      .then((data) => {
        setInsight(data.insight);
        setInsightLoading(false);
      })
      .catch(() => setInsightLoading(false));
  };

  useEffect(() => {
    loadHoldings();
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
      const res = await fetch("http://localhost:8080/api/holdings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker,
          companyName,
          shares: parseFloat(shares),
          avgCostBasis: parseFloat(avgCostBasis),
          portfolioId: 1,
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
      loadHoldings();
    } catch {
      setError("Something went wrong");
    }
    setSubmitting(false);
  };

  const totalValue = holdings.reduce((sum, h) => sum + h.marketValue, 0);
  const totalCost = holdings.reduce((sum, h) => sum + h.totalCost, 0);
  const totalGain = totalValue - totalCost;
  const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="min-h-screen bg-[#f7f9fc] p-8">
      <div className="max-w-5xl mx-auto">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-lg font-medium text-gray-900">Good morning, Ralph</h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#639922] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#557f1d] transition-colors"
          >
            + Add holding
          </button>
        </div>

        {loading ? (
          <div className="text-gray-400">Loading your portfolio...</div>
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
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Invested</div>
                <div className="text-xl font-semibold text-gray-900">${fmt(totalCost)}</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total gain</div>
                <div className={`text-xl font-semibold ${totalGain >= 0 ? "text-[#3B6D11]" : "text-red-600"}`}>
                  {totalGain >= 0 ? "+" : ""}${fmt(totalGain)}
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Holdings</div>
                <div className="text-xl font-semibold text-gray-900">{holdings.length}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* Holdings list */}
              <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5">
                <div className="text-sm font-medium text-gray-900 mb-4">Holdings</div>
                {holdings.length === 0 ? (
                  <div className="text-sm text-gray-400 py-4">No holdings yet. Click "+ Add holding" to start.</div>
                ) : (
                  holdings.map((h) => (
                    <div key={h.ticker} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{h.ticker}</div>
                        <div className="text-xs text-gray-500">{h.companyName}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">${fmt(h.marketValue)}</div>
                        <div className={`text-xs ${h.gainLoss >= 0 ? "text-[#3B6D11]" : "text-red-600"}`}>
                          {h.gainLossPercent >= 0 ? "+" : ""}{h.gainLossPercent.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Allocation pie chart */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
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
                          <Cell key={i} fill={["#639922", "#378ADD", "#27500A", "#185FA5", "#8FBF5A", "#5BA3E8"][i % 6]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `$${fmt(value)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                {/* Legend */}
                <div className="mt-2 space-y-1">
                  {holdings.map((h, i) => (
                    <div key={h.ticker} className="flex items-center gap-2 text-xs">
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ background: ["#639922", "#378ADD", "#27500A", "#185FA5", "#8FBF5A", "#5BA3E8"][i % 6] }}
                      ></span>
                      <span className="text-gray-600">{h.ticker}</span>
                      <span className="text-gray-400 ml-auto">
                        {totalValue > 0 ? ((h.marketValue / totalValue) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Insights */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 mt-3">
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
            </div>
          </>
        )}
      </div>

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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:border-[#639922]"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Company name</label>
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Apple Inc."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:border-[#639922]"
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:border-[#639922]"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">Avg cost</label>
                  <input
                    value={avgCostBasis}
                    onChange={(e) => setAvgCostBasis(e.target.value)}
                    placeholder="150.00"
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:border-[#639922]"
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
    </div>
  );
}
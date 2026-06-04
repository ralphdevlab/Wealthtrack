"use client";

import { useEffect, useState } from "react";

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

  useEffect(() => {
    fetch("http://localhost:8080/api/portfolios/1/performance")
      .then((res) => res.json())
      .then((data) => {
        setHoldings(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Calculate totals from real data
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
          <button className="bg-[#639922] text-white rounded-lg px-4 py-2 text-sm font-medium">
            + Add holding
          </button>
        </div>

        {loading ? (
          <div className="text-gray-400">Loading your portfolio...</div>
        ) : (
          <>
            {/* Big portfolio value */}
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

            {/* Stat cards */}
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

            {/* Holdings list */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="text-sm font-medium text-gray-900 mb-4">Holdings</div>
              {holdings.map((h) => (
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
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
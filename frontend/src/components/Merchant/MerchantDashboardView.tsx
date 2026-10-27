import React, { useState, useEffect } from "react";
import {
  Download,
  Filter,
  RefreshCw,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Package,
  Layers,
  HelpCircle,
  Info,
} from "lucide-react";
import {
  fetchMerchantAnalytics,
  getCsvExportUrl,
  type MerchantAnalyticsReport,
  type MatrixCell,
} from "../../services/api";

const DEPTH_GROUPS = ["Fair", "Light", "Medium", "Tan", "Deep"];
const UNDERTONES = ["Warm", "Cool", "Neutral", "Olive"];

export const MerchantDashboardView: React.FC = () => {
  const [data, setData] = useState<MerchantAnalyticsReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [brandFilter, setBrandFilter] = useState<string>("");
  const [productFilter, setProductFilter] = useState<string>("");
  const [selectedCell, setSelectedCell] = useState<MatrixCell | null>(null);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const report = await fetchMerchantAnalytics(
        brandFilter || undefined,
        productFilter || undefined
      );
      setData(report);
      // Auto-select first vulnerable or critical cell for inspection if none selected
      if (!selectedCell && report.coverage_matrix.length > 0) {
        const priorityCell =
          report.coverage_matrix.find((c) => c.status === "critical_gap") ||
          report.coverage_matrix.find((c) => c.status === "vulnerable") ||
          report.coverage_matrix[0];
        setSelectedCell(priorityCell);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load catalogue analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [brandFilter, productFilter]);

  // Helper to find a specific cell in the matrix
  const getCell = (depth: string, undertone: string): MatrixCell | undefined => {
    return data?.coverage_matrix.find(
      (c) =>
        c.depth_group.toLowerCase() === depth.toLowerCase() &&
        c.undertone.toLowerCase() === undertone.toLowerCase()
    );
  };

  const handleExportCsv = () => {
    const url = getCsvExportUrl(brandFilter || undefined, productFilter || undefined);
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-10 animate-fadeIn">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#EFE8DC] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F7F3EC] border border-[#E8E2D9] text-[#59524B] text-xs font-semibold mb-3">
            <Layers className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>Assortment Optimization Suite</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#23201E]">
            Merchant Catalogue & Coverage Insights
          </h1>
          <p className="text-sm text-[#59524B] mt-1.5 max-w-2xl">
            Audit inventory representation across the 20-cell Depth & Undertone matrix. 
            Identify blind spots and assortment gaps to optimize shade variety.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={loadAnalytics}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#E8E2D9] bg-white text-xs font-semibold text-[#59524B] hover:bg-[#F7F3EC] transition-colors disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#C5A880]" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={loading || !data}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#23201E] text-white text-xs font-semibold hover:bg-black transition-colors shadow-sm disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV Report</span>
          </button>
        </div>
      </div>

      {/* Mandatory Objective Data Disclaimer */}
      <div className="p-4 rounded-2xl bg-[#FBF9F5] border border-[#EFE8DC] flex items-start gap-3 text-xs text-[#59524B]">
        <Info className="w-4 h-4 text-[#C5A880] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-[#23201E]">Data Transparency Notice: </span>
          {data?.data_disclaimer || (
            "Catalogue coverage metrics reflect current product inventory variety stored in the catalogue database. They do not represent consumer demographic demand, customer ethnicity, or sales projections."
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-[#EFE8DC] shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#8C827A] uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </div>

        <div className="flex-1 min-w-[180px]">
          <input
            type="text"
            placeholder="Filter by brand (e.g. Lumina Veil)..."
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="w-full text-xs px-3.5 py-2 rounded-xl border border-[#E8E2D9] focus:outline-none focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] bg-[#FAF8F5]"
          />
        </div>

        <div className="flex-1 min-w-[180px]">
          <input
            type="text"
            placeholder="Filter by product name..."
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="w-full text-xs px-3.5 py-2 rounded-xl border border-[#E8E2D9] focus:outline-none focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] bg-[#FAF8F5]"
          />
        </div>

        {(brandFilter || productFilter) && (
          <button
            onClick={() => {
              setBrandFilter("");
              setProductFilter("");
            }}
            className="text-xs text-[#8C827A] hover:text-[#23201E] underline font-medium px-2"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Loading & Error States */}
      {loading && !data && (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 border-2 border-[#C5A880] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-medium text-[#59524B]">Aggregating catalogue assortment data...</p>
        </div>
      )}

      {error && (
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3">
          <AlertOctagon className="w-5 h-5 shrink-0" />
          <div className="flex-1 font-medium">{error}</div>
          <button
            onClick={loadAnalytics}
            className="px-3 py-1 bg-white rounded-lg border border-rose-300 text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {data && (
        <>
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Total SKUs */}
            <div className="bg-white p-6 rounded-2xl border border-[#EFE8DC] shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold text-[#8C827A] uppercase tracking-wider">
                <span>Active SKUs</span>
                <Package className="w-4 h-4 text-[#C5A880]" />
              </div>
              <div className="text-3xl font-serif font-bold text-[#23201E] mt-3">
                {data.total_shades}
              </div>
              <div className="text-xs text-[#59524B] mt-2 flex items-center gap-2">
                <span className="font-medium text-emerald-700">{data.in_stock_count} in-stock</span>
                <span>•</span>
                <span className="text-amber-700">{data.low_stock_count} low</span>
                <span>•</span>
                <span className="text-rose-700">{data.out_of_stock_count} out</span>
              </div>
            </div>

            {/* Card 2: Coverage Score */}
            <div className="bg-white p-6 rounded-2xl border border-[#EFE8DC] shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold text-[#8C827A] uppercase tracking-wider">
                <span>Coverage Index</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-serif font-bold text-[#23201E] mt-3">
                {data.coverage_score}%
              </div>
              <div className="text-xs text-[#59524B] mt-2">
                Percentage of 20 matrix segments with $\ge 1$ in-stock SKU
              </div>
            </div>

            {/* Card 3: Critical Gaps */}
            <div className="bg-white p-6 rounded-2xl border border-[#EFE8DC] shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold text-[#8C827A] uppercase tracking-wider">
                <span>Critical Assortment Gaps</span>
                <AlertOctagon className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-3xl font-serif font-bold text-rose-700 mt-3">
                {data.critical_gaps_count}
              </div>
              <div className="text-xs text-rose-600 mt-2 font-medium">
                0 formulated catalogue shades available
              </div>
            </div>

            {/* Card 4: Vulnerable Segments */}
            <div className="bg-white p-6 rounded-2xl border border-[#EFE8DC] shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold text-[#8C827A] uppercase tracking-wider">
                <span>Vulnerable Segments</span>
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-3xl font-serif font-bold text-amber-700 mt-3">
                {data.vulnerable_segments_count}
              </div>
              <div className="text-xs text-amber-700 mt-2 font-medium">
                Single-point of failure or depleted inventory
              </div>
            </div>
          </div>

          {/* 2D Depth x Undertone Coverage Matrix */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EFE8DC] shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EFE8DC] pb-4">
              <div>
                <h2 className="text-lg font-serif font-bold text-[#23201E]">
                  2D Assortment Coverage Matrix (Depth × Undertone)
                </h2>
                <p className="text-xs text-[#59524B] mt-1">
                  Click any cell to inspect SKU inventory status, shade codes, and formulation variety.
                </p>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" />
                  <span className="text-[#59524B]">Adequate ($\ge 2$ in stock)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300" />
                  <span className="text-[#59524B]">Vulnerable ($\le 1$ in stock)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-rose-100 border border-rose-300" />
                  <span className="text-[#59524B]">Critical Gap (0 shades)</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* The 5x4 Heatmap Table */}
              <div className="lg:col-span-2 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr>
                      <th className="p-3 text-xs font-semibold text-[#8C827A] uppercase tracking-wider border-b border-[#EFE8DC]">
                        Depth Tier
                      </th>
                      {UNDERTONES.map((u) => (
                        <th
                          key={u}
                          className="p-3 text-xs font-semibold text-[#8C827A] uppercase tracking-wider text-center border-b border-[#EFE8DC]"
                        >
                          {u}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DEPTH_GROUPS.map((depth) => (
                      <tr key={depth} className="border-b border-[#F7F3EC] hover:bg-[#FAF8F5]/60">
                        <td className="p-3 text-xs font-bold text-[#23201E] font-serif">
                          {depth}
                        </td>
                        {UNDERTONES.map((undertone) => {
                          const cell = getCell(depth, undertone);
                          const isSelected =
                            selectedCell?.depth_group.toLowerCase() === depth.toLowerCase() &&
                            selectedCell?.undertone.toLowerCase() === undertone.toLowerCase();

                          if (!cell) {
                            return (
                              <td key={undertone} className="p-2 text-center">
                                <span className="text-xs text-stone-300">-</span>
                              </td>
                            );
                          }

                          let statusClasses = "bg-emerald-50 border-emerald-200 text-emerald-900";
                          if (cell.status === "critical_gap") {
                            statusClasses = "bg-rose-50 border-rose-200 text-rose-900";
                          } else if (cell.status === "vulnerable") {
                            statusClasses = "bg-amber-50 border-amber-200 text-amber-900";
                          }

                          return (
                            <td key={undertone} className="p-2 text-center">
                              <button
                                onClick={() => setSelectedCell(cell)}
                                className={`w-full py-2.5 px-2 rounded-xl border text-xs font-bold transition-all ${statusClasses} ${
                                  isSelected
                                    ? "ring-2 ring-[#23201E] shadow-md scale-102"
                                    : "hover:shadow-sm"
                                }`}
                              >
                                <div className="text-sm">{cell.total_shades}</div>
                                <div className="text-[10px] font-normal opacity-80 mt-0.5">
                                  {cell.total_shades === 0
                                    ? "Empty"
                                    : `${cell.in_stock_shades} in stock`}
                                </div>
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cell Inspector Side Panel */}
              <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#EFE8DC] flex flex-col justify-between">
                {selectedCell ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] uppercase tracking-wider font-semibold text-[#8C827A]">
                        Segment Inspector
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          selectedCell.status === "critical_gap"
                            ? "bg-rose-100 text-rose-800"
                            : selectedCell.status === "vulnerable"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {selectedCell.status.replace("_", " ")}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-serif font-bold text-[#23201E]">
                        {selectedCell.depth_group} Depth • {selectedCell.undertone}
                      </h3>
                      <p className="text-xs text-[#59524B] mt-1">
                        Assortment status for this specific complexion segment.
                      </p>
                    </div>

                    <div className="space-y-2 py-3 border-y border-[#EFE8DC] text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#8C827A]">Total Catalogue SKUs:</span>
                        <span className="font-bold text-[#23201E]">{selectedCell.total_shades}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8C827A]">In-Stock:</span>
                        <span className="font-semibold text-emerald-700">
                          {selectedCell.in_stock_shades}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8C827A]">Low-Stock:</span>
                        <span className="font-semibold text-amber-700">
                          {selectedCell.low_stock_shades}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8C827A]">Out-of-Stock:</span>
                        <span className="font-semibold text-rose-700">
                          {selectedCell.out_of_stock_shades}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-[#23201E] mb-2">
                        Assigned Shade Codes:
                      </div>
                      {selectedCell.shade_codes.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {selectedCell.shade_codes.map((code) => (
                            <span
                              key={code}
                              className="px-2.5 py-1 rounded-lg bg-white border border-[#E8E2D9] text-xs font-mono text-[#23201E] font-medium"
                            >
                              {code}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
                          No catalogue shades formulated in this segment. Immediate assortment priority.
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-center text-xs text-[#8C827A] p-6">
                    Select a cell on the left to inspect detailed inventory metrics.
                  </div>
                )}

                <div className="pt-4 text-[11px] text-[#8C827A] border-t border-[#EFE8DC] flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Segment is deemed adequate when $\ge 2$ shades are in-stock.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Assortment Distributions: Depth & Undertone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Depth Group Representation */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EFE8DC] shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-serif font-bold text-[#23201E]">
                  Representation by Depth Group
                </h3>
                <span className="text-xs text-[#8C827A]">5 Depth Tiers</span>
              </div>

              <div className="space-y-4">
                {data.depth_distribution.map((d) => (
                  <div key={d.depth_group} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium text-[#23201E]">
                      <span>{d.depth_group}</span>
                      <span className="text-[#8C827A]">
                        {d.count} SKUs ({d.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#FAF8F5] h-2.5 rounded-full overflow-hidden border border-[#EFE8DC]">
                      <div
                        className="bg-[#23201E] h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(d.percentage, 3)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Undertone Palette Distribution */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EFE8DC] shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-serif font-bold text-[#23201E]">
                  Formulation by Undertone
                </h3>
                <span className="text-xs text-[#8C827A]">4 Undertone Categories</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {data.undertone_distribution.map((u) => {
                  let accentColor = "bg-amber-50 text-amber-900 border-amber-200";
                  if (u.undertone === "Cool")
                    accentColor = "bg-rose-50 text-rose-900 border-rose-200";
                  if (u.undertone === "Neutral")
                    accentColor = "bg-stone-50 text-stone-900 border-stone-200";
                  if (u.undertone === "Olive")
                    accentColor = "bg-emerald-50 text-emerald-900 border-emerald-200";

                  return (
                    <div
                      key={u.undertone}
                      className={`p-4 rounded-2xl border ${accentColor} flex flex-col justify-between`}
                    >
                      <div className="text-xs font-semibold uppercase tracking-wider opacity-80">
                        {u.undertone}
                      </div>
                      <div className="text-2xl font-serif font-bold mt-2">
                        {u.count} <span className="text-xs font-sans font-normal opacity-70">SKUs</span>
                      </div>
                      <div className="text-[11px] opacity-75 mt-1">{u.percentage}% of catalogue</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Actionable Catalogue Assortment Gaps */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EFE8DC] shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EFE8DC] pb-4">
              <div>
                <h3 className="text-lg font-serif font-bold text-[#23201E]">
                  Actionable Catalogue Assortment Gaps
                </h3>
                <p className="text-xs text-[#59524B] mt-1">
                  Specific complexion segments requiring product formulation or inventory replenishment.
                </p>
              </div>
              <span className="text-xs font-semibold text-[#8C827A]">
                {data.catalogue_gaps.length} Identified Gaps
              </span>
            </div>

            {data.catalogue_gaps.length === 0 ? (
              <div className="p-8 text-center bg-[#FAF8F5] rounded-2xl border border-[#EFE8DC]">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-[#23201E]">Zero Assortment Gaps</h4>
                <p className="text-xs text-[#59524B] mt-1">
                  All 20 matrix segments have adequate representation and stock.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.catalogue_gaps.map((gap, index) => {
                  let badge = "bg-rose-100 text-rose-800 border-rose-200";
                  if (gap.severity === "high") {
                    badge = "bg-amber-100 text-amber-800 border-amber-200";
                  } else if (gap.severity === "moderate") {
                    badge = "bg-blue-100 text-blue-800 border-blue-200";
                  }

                  return (
                    <div
                      key={index}
                      className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#EFE8DC] hover:border-[#C5A880]/50 transition-colors flex flex-col justify-between space-y-4"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${badge}`}
                          >
                            {gap.severity}
                          </span>
                          <span className="text-[11px] font-mono text-[#8C827A]">
                            {gap.available_count} SKUs ({gap.in_stock_count} in-stock)
                          </span>
                        </div>

                        <h4 className="text-base font-serif font-bold text-[#23201E]">
                          {gap.depth_group} • {gap.undertone}
                        </h4>
                        <p className="text-xs text-[#59524B] mt-1.5 leading-relaxed">
                          {gap.explanation}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-white border border-[#E8E2D9] text-xs text-[#23201E]">
                        <span className="font-semibold text-[#C5A880] block text-[11px] uppercase tracking-wider mb-1">
                          Assortment Recommendation:
                        </span>
                        {gap.recommendation}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Methodology & Technical Explanations */}
          <div className="bg-[#FAF8F5] p-6 rounded-3xl border border-[#EFE8DC] space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8C827A]">
              Coverage Gap Calculation Methodology
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#59524B] leading-relaxed">
              <div className="p-3.5 rounded-xl bg-white border border-[#E8E2D9]">
                <strong className="text-[#23201E] block mb-1">Critical Gap:</strong>
                Zero catalogue shades exist for this depth and undertone pair. Shoppers with this complexion profile cannot be matched.
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-[#E8E2D9]">
                <strong className="text-[#23201E] block mb-1">High Severity:</strong>
                Catalogue shades exist on paper but all inventory is currently out-of-stock, causing conversion abandonment.
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-[#E8E2D9]">
                <strong className="text-[#23201E] block mb-1">Moderate Vulnerability:</strong>
                Only 1 shade is formulated for the segment, creating a single point of failure with no secondary match options.
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

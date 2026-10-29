import React, { useState } from "react";
import {
  Sparkles,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Camera,
  HelpCircle,
  Store,
  SlidersHorizontal,
  X,
  MapPin,
  RefreshCw,
  FilterX,
  RotateCcw,
} from "lucide-react";
import type { MatchCandidate, ShadeMatchReport } from "../../services/api";

interface MatchesStepProps {
  report: ShadeMatchReport;
  onSelectShadeForTryOn: (shade: MatchCandidate) => void;
  onBackToAnalysis: () => void;
  onFilterChange: (brand: string, finish: string) => void;
  isLoadingVto?: boolean;
  selectedShadeCode?: string;
  selectedBrand: string;
  selectedFinish: string;
}

interface BoutiqueStore {
  name: string;
  location: string;
  distance: string;
  stockCount: number;
  status: "In Stock" | "Low Stock" | "Out of Stock";
}

const DEMO_BOUTIQUE_STORES: BoutiqueStore[] = [
  {
    name: "Lumina Flagship Boutique",
    location: "580 Fifth Avenue, New York, NY",
    distance: "0.8 miles away",
    stockCount: 8,
    status: "In Stock",
  },
  {
    name: "Sephora Soho",
    location: "555 Broadway, New York, NY",
    distance: "1.4 miles away",
    stockCount: 3,
    status: "Low Stock",
  },
  {
    name: "Nordstrom NYC Center",
    location: "225 W 57th St, New York, NY",
    distance: "2.1 miles away",
    stockCount: 12,
    status: "In Stock",
  },
];

export const MatchesStep: React.FC<MatchesStepProps> = ({
  report,
  onSelectShadeForTryOn,
  onBackToAnalysis,
  onFilterChange,
  isLoadingVto = false,
  selectedShadeCode,
  selectedBrand,
  selectedFinish,
}) => {
  const [storeModalShade, setStoreModalShade] = useState<MatchCandidate | null>(null);

  const candidates = report.candidates || [];
  const availableBrands = report.available_filters?.brands || ["All"];
  const availableFinishes = report.available_filters?.finishes || ["All"];

  const hasActiveFilters =
    (selectedBrand && selectedBrand !== "All") ||
    (selectedFinish && selectedFinish !== "All");

  const handleBrandSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange(e.target.value, selectedFinish);
  };

  const handleFinishSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange(selectedBrand, e.target.value);
  };

  const handleResetFilters = () => {
    onFilterChange("All", "All");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fadeIn">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F7F3EC] border border-[#E8E2D9] text-xs font-semibold text-[#8C827A] uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
          <span>Step 3 of 4: Matched Candidates</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#23201E]">
          Your Top Foundation Matches
        </h1>
        <p className="text-sm text-[#59524B] max-w-xl mx-auto font-light">
          Evaluated against {report.total_shades_evaluated} catalogue shades using the{" "}
          <strong>CIEDE2000 (ΔE₀₀)</strong> perceptual color standard and undertone alignment.
        </p>
      </div>

      {/* Filter and Swatch Preview Bar */}
      <div className="bg-white p-5 rounded-3xl border border-[#EFE8DC] shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* User Skin vs Candidates Swatch Comparison Preview */}
          <div className="flex items-center gap-3 overflow-x-auto pb-1 md:pb-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-[#8C827A]">
                Your Skin:
              </span>
              <div
                className="w-7 h-7 rounded-full border-2 border-white shadow-sm ring-1 ring-black/10 shrink-0"
                style={{ backgroundColor: report.user_skin.hex_color }}
                title={`Skin Hex: ${report.user_skin.hex_color}`}
              />
            </div>
            {candidates.length > 0 && (
              <>
                <span className="text-xs text-[#8C827A]">vs. Matches:</span>
                <div className="flex items-center gap-1.5">
                  {candidates.map((c) => (
                    <div
                      key={c.shade_code}
                      className="w-6 h-6 rounded-full border border-black/10 shadow-xs shrink-0"
                      style={{ backgroundColor: c.hex_color }}
                      title={`${c.shade_name} (${c.shade_code}) - ΔE00: ${c.delta_e00.toFixed(2)}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Reset Filters Shortcut */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-semibold text-[#8C827A] hover:text-[#23201E] flex items-center gap-1 underline underline-offset-4"
            >
              <RotateCcw className="w-3 h-3 text-[#C5A880]" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Dynamic Filter Controls (Brand & Finish) */}
        <div className="pt-3 border-t border-[#EFE8DC] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Brand Filter Dropdown */}
          <div className="flex items-center gap-2 bg-[#FAF8F5] p-2.5 rounded-2xl border border-[#E8E2D9]">
            <SlidersHorizontal className="w-4 h-4 text-[#C5A880] shrink-0 ml-1" />
            <span className="font-semibold text-[#8C827A] uppercase tracking-wider text-[11px] shrink-0">
              Brand:
            </span>
            <select
              value={selectedBrand}
              onChange={handleBrandSelect}
              className="flex-1 bg-transparent text-xs font-medium text-[#23201E] focus:outline-none cursor-pointer"
            >
              {availableBrands.map((b) => (
                <option key={b} value={b}>
                  {b === "All" ? "All Brands" : b}
                </option>
              ))}
            </select>
          </div>

          {/* Finish Filter Dropdown */}
          <div className="flex items-center gap-2 bg-[#FAF8F5] p-2.5 rounded-2xl border border-[#E8E2D9]">
            <SlidersHorizontal className="w-4 h-4 text-[#C5A880] shrink-0 ml-1" />
            <span className="font-semibold text-[#8C827A] uppercase tracking-wider text-[11px] shrink-0">
              Finish:
            </span>
            <select
              value={selectedFinish}
              onChange={handleFinishSelect}
              className="flex-1 bg-transparent text-xs font-medium text-[#23201E] focus:outline-none cursor-pointer"
            >
              {availableFinishes.map((f) => (
                <option key={f} value={f}>
                  {f === "All" ? "All Finishes" : f}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Empty State when no candidates match filters */}
      {candidates.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#EFE8DC] p-10 text-center space-y-4 shadow-sm animate-fadeIn">
          <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200">
            <FilterX className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-serif font-bold text-[#23201E]">
              No Shades Match Your Selected Filters
            </h3>
            <p className="text-xs text-[#59524B] max-w-md mx-auto leading-relaxed">
              We couldn't find any foundation shades matching{" "}
              <strong>{selectedBrand !== "All" ? selectedBrand : "the selected brand"}</strong> with a{" "}
              <strong>{selectedFinish !== "All" ? selectedFinish : "selected"}</strong> finish for your skin tone.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-6 py-2.5 rounded-full bg-[#23201E] text-white text-xs font-semibold hover:bg-[#383330] transition-all inline-flex items-center gap-2 shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Reset to All Brands & Finishes</span>
            </button>
          </div>
        </div>
      ) : (
        /* Top Candidates Grid */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {candidates.map((candidate) => {
            const isPrimary = candidate.rank === 1;
            const isCurrentLoading = isLoadingVto && selectedShadeCode === candidate.shade_code;

            return (
              <div
                key={candidate.shade_code}
                className={`rounded-3xl p-6 transition-all relative flex flex-col justify-between ${
                  isPrimary
                    ? "bg-white border-2 border-[#23201E] shadow-lg ring-1 ring-[#23201E]"
                    : "bg-white border border-[#EFE8DC] shadow-sm hover:border-[#C5A880]"
                }`}
              >
                {isPrimary && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#23201E] text-white text-[11px] font-bold tracking-wider uppercase flex items-center gap-1.5 shadow-sm">
                    <Sparkles className="w-3 h-3 text-[#C5A880]" />
                    <span>Primary Match</span>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Header info */}
                  <div className="flex items-start justify-between gap-2 pt-2">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-[#8C827A]">
                        {candidate.brand}
                      </span>
                      <h3 className="text-base font-bold text-[#23201E] font-serif leading-snug">
                        {candidate.shade_name}
                      </h3>
                      <div className="text-xs text-[#59524B] font-mono mt-0.5">
                        {candidate.shade_code}
                      </div>
                    </div>

                    <span className="text-xs px-2.5 py-1 rounded-full bg-[#F7F3EC] font-semibold text-[#23201E] shrink-0">
                      Rank #{candidate.rank}
                    </span>
                  </div>

                  {/* Swatch & Colorimetric Distance */}
                  <div className="p-3 rounded-2xl bg-[#FDFBF7] border border-[#EFE8DC] flex items-center gap-3">
                    <div
                      className="w-14 h-14 rounded-xl border border-black/10 shadow-xs shrink-0"
                      style={{ backgroundColor: candidate.hex_color }}
                    />
                    <div className="text-xs space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[#8C827A]">Perceptual Diff:</span>
                        <span className="font-mono font-bold text-[#23201E]">
                          ΔE₀₀ = {candidate.delta_e00.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#8C827A]">Compatibility:</span>
                        <span className="font-bold text-emerald-700">
                          {candidate.match_score.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Attributes: Undertone & Finish */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs pt-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#EFE8DC] text-[#59524B] font-medium text-[11px]">
                      {candidate.undertone} Undertone
                    </span>
                    {candidate.finish && (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#FAF8F5] border border-[#E8E2D9] text-[#23201E] font-medium text-[11px]">
                        {candidate.finish}
                      </span>
                    )}
                  </div>

                  {/* Store Stock Trigger */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => setStoreModalShade(candidate)}
                      className="text-[11px] font-semibold text-[#C5A880] hover:text-[#23201E] flex items-center gap-1 underline underline-offset-2"
                    >
                      <Store className="w-3.5 h-3.5" />
                      <span>Check Store Stock</span>
                    </button>

                    <span
                      className={`text-[11px] font-semibold flex items-center gap-1 ${
                        candidate.stock_status === "in_stock"
                          ? "text-emerald-700"
                          : "text-amber-700"
                      }`}
                    >
                      {candidate.stock_status === "in_stock" ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Online In Stock</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>{candidate.stock_status.replace("_", " ")}</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Ranking Explanation */}
                  <p className="text-xs text-[#59524B] bg-[#F7F3EC] p-3 rounded-xl border border-[#E8E2D9] leading-relaxed">
                    {candidate.ranking_explanation}
                  </p>
                </div>

                {/* Action: Try On Shade */}
                <div className="pt-5 mt-4 border-t border-[#EFE8DC]">
                  <button
                    type="button"
                    onClick={() => onSelectShadeForTryOn(candidate)}
                    disabled={isLoadingVto}
                    className={`w-full py-3 rounded-full text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-2 ${
                      isPrimary
                        ? "bg-[#23201E] text-white hover:bg-[#383330] shadow-sm disabled:opacity-50"
                        : "bg-white border border-[#23201E] text-[#23201E] hover:bg-[#23201E] hover:text-white disabled:opacity-50"
                    }`}
                  >
                    {isCurrentLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-[#C5A880]" />
                        <span>Rendering with YouCam...</span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4 text-[#C5A880]" />
                        <span>Try On My Face (YouCam AR)</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Scientific Honesty & Methodology Transparency Box */}
      <div className="p-5 rounded-3xl bg-white border border-[#EFE8DC] space-y-2 text-xs text-[#59524B] shadow-xs">
        <div className="flex items-center gap-2 font-semibold text-[#23201E]">
          <HelpCircle className="w-4 h-4 text-[#C5A880]" />
          <span>About ShadeProof Match Scoring & Perceptual Distance</span>
        </div>
        <p className="leading-relaxed">
          {report.scoring_formula_metadata.score_interpretation} The ΔE₀₀ metric represents the
          CIE standard for human visual discrimination. A ΔE₀₀ under 2.0 indicates an imperceptible skin blend.
          Scores are mathematically calibrated from 50% to 99%—we do not claim 100% certainty because foundation
          formulas naturally oxidize and interact with skin oils.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToAnalysis}
          className="px-6 py-3 rounded-full bg-white border border-[#E8E2D9] text-[#23201E] text-sm font-medium hover:bg-[#F7F3EC] transition-all flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4 text-[#8C827A]" />
          <span>Back to Skin Profile</span>
        </button>
      </div>

      {/* In-Store Availability Modal */}
      {storeModalShade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-[#EFE8DC]">
            <div className="flex items-center justify-between border-b border-[#EFE8DC] pb-3">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-[#C5A880]" />
                <h3 className="font-serif font-bold text-lg text-[#23201E]">
                  Nearby Store Availability
                </h3>
              </div>
              <button
                onClick={() => setStoreModalShade(null)}
                className="p-1 rounded-full hover:bg-stone-100 text-[#8C827A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <div className="text-xs uppercase tracking-wider text-[#8C827A] font-semibold">
                Selected Shade:
              </div>
              <div className="text-sm font-bold text-[#23201E] flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded-full border border-black/10"
                  style={{ backgroundColor: storeModalShade.hex_color }}
                />
                <span>
                  {storeModalShade.brand} — {storeModalShade.shade_name} ({storeModalShade.shade_code})
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {DEMO_BOUTIQUE_STORES.map((store, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EFE8DC] flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-[#23201E]">{store.name}</div>
                    <div className="text-[11px] text-[#8C827A] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#C5A880]" />
                      <span>{store.location} • {store.distance}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                        store.status === "In Stock"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {store.stockCount} in stock
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setStoreModalShade(null)}
              className="w-full py-2.5 rounded-full bg-[#23201E] text-white text-xs font-semibold hover:bg-[#383330]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

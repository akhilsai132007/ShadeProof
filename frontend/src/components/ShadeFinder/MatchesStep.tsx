import React from "react";
import {
  Sparkles,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Camera,
  HelpCircle
} from "lucide-react";
import type { MatchCandidate, ShadeMatchReport } from "../../services/api";

interface MatchesStepProps {
  report: ShadeMatchReport;
  onSelectShadeForTryOn: (shade: MatchCandidate) => void;
  onBackToAnalysis: () => void;
}

export const MatchesStep: React.FC<MatchesStepProps> = ({
  report,
  onSelectShadeForTryOn,
  onBackToAnalysis,
}) => {
  const candidates = report.candidates;

  return (
    <div className="max-w-4xl mx-auto space-y-10">
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
          <strong>CIEDE2000 (ΔE₀₀)</strong> color difference standard and undertone alignment.
        </p>
      </div>

      {/* Top 3 Candidates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {candidates.map((candidate) => {
          const isPrimary = candidate.rank === 1;

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

                {/* Attributes: Undertone & Stock */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#EFE8DC] text-[#59524B] font-medium">
                    {candidate.undertone} Undertone
                  </span>

                  <span
                    className={`text-[11px] font-semibold flex items-center gap-1 ${
                      candidate.stock_status === "in_stock"
                        ? "text-emerald-700"
                        : candidate.stock_status === "low_stock"
                        ? "text-amber-700"
                        : "text-rose-700"
                    }`}
                  >
                    {candidate.stock_status === "in_stock" ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>In Stock</span>
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
                  className={`w-full py-3 rounded-full text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-2 ${
                    isPrimary
                      ? "bg-[#23201E] text-white hover:bg-[#383330] shadow-sm"
                      : "bg-white border border-[#23201E] text-[#23201E] hover:bg-[#23201E] hover:text-white"
                  }`}
                >
                  <Camera className="w-4 h-4 text-[#C5A880]" />
                  <span>Try On My Face (YouCam AR)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Scientific Honesty & Methodology Transparency Box */}
      <div className="p-5 rounded-3xl bg-white border border-[#EFE8DC] space-y-2 text-xs text-[#59524B] shadow-xs">
        <div className="flex items-center gap-2 font-semibold text-[#23201E]">
          <HelpCircle className="w-4 h-4 text-[#C5A880]" />
          <span>About ShadeProof Match Scoring & Perceptual Distance</span>
        </div>
        <p className="leading-relaxed">
          {report.scoring_formula_metadata.score_interpretation} The ΔE₀₀ metric represents the
          CIE standard for human visual discrimination. A ΔE₀₀ under 2.0 indicates a seamless skin blend.
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
    </div>
  );
};

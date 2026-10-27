import React from "react";
import { Binary, Check, Cpu } from "lucide-react";

export const AboutView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="border-b border-[#EFE8DC] pb-6">
        <h1 className="text-3xl font-serif font-bold text-[#23201E]">
          About ShadeProof & Technology Architecture
        </h1>
        <p className="text-sm text-[#59524B] mt-2 leading-relaxed">
          Built for the <strong>YouCam API Skin AI & eCommerce VTO Hackathon 2026</strong>,
          ShadeProof demonstrates an end-to-end consumer application that bridges computer
          vision, perceptual color science, and AR virtual try-on.
        </p>
      </div>

      {/* Problem & Solution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-3xl border border-[#EFE8DC] space-y-4 shadow-sm">
          <h2 className="text-xl font-serif font-bold text-[#23201E]">
            The eCommerce Challenge
          </h2>
          <p className="text-xs text-[#59524B] leading-relaxed">
            Finding a foundation match online is notoriously difficult:
          </p>
          <ul className="text-xs text-[#59524B] space-y-2 list-disc list-inside">
            <li>Indoor lighting and phone camera sensors distort facial skin tones.</li>
            <li>Digital swatch images on brand websites rarely match oxidized foundation shades.</li>
            <li>Online foundation return rates reach up to 30%, costing retailers millions.</li>
            <li>Shoppers cannot see candidate shades applied on their actual facial contours.</li>
          </ul>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#EFE8DC] space-y-4 shadow-sm">
          <h2 className="text-xl font-serif font-bold text-[#23201E]">
            The ShadeProof Solution
          </h2>
          <p className="text-xs text-[#59524B] leading-relaxed">
            A three-tier technical bridge that eliminates guesswork:
          </p>
          <ul className="text-xs text-[#59524B] space-y-2 list-disc list-inside">
            <li>
              <strong>Verified YouCam Skin AI:</strong> Extracts calibrated L*a*b* coordinates and undertone.
            </li>
            <li>
              <strong>Deterministic CIEDE2000 Engine:</strong> Computes non-linear human perceptual difference.
            </li>
            <li>
              <strong>Verified YouCam Makeup VTO:</strong> Applies the top 3 shades directly to user selfies.
            </li>
            <li>
              <strong>Merchant Coverage Analytics:</strong> Alerts retailers to demographic inventory gaps.
            </li>
          </ul>
        </div>
      </div>

      {/* Scientific Transparency */}
      <div className="bg-[#23201E] text-white p-8 rounded-3xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#C5A880]/20 text-[#C5A880] flex items-center justify-center">
            <Binary className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-serif font-bold">Scientific Colorimetric Transparency</h3>
            <p className="text-xs text-[#A69C93]">Our commitment to honest, testable engineering</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-[#D1C7BD] leading-relaxed">
          <div className="space-y-2">
            <h4 className="font-semibold text-white flex items-center gap-1.5">
              <Check className="w-4 h-4 text-[#C5A880]" />
              <span>CIEDE2000 (ΔE₀₀) Distance</span>
            </h4>
            <p>
              We calculate perceptual color differences between the user's analyzed skin coordinates
              and each foundation shade using the Sharma-Wu-Dalal CIEDE2000 equation. This accounts
              for non-linear human chromatic sensitivity.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-white flex items-center gap-1.5">
              <Check className="w-4 h-4 text-[#C5A880]" />
              <span>Calibrated Compatibility Index</span>
            </h4>
            <p>
              We do not present arbitrary "probability" percentages. Match scores are strictly
              calibrated compatibility indices derived from ΔE₀₀ distance plus undertone alignment
              penalties.
            </p>
          </div>
        </div>
      </div>

      {/* API Integration Boundary */}
      <div className="bg-white p-8 rounded-3xl border border-[#EFE8DC] space-y-4">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-[#9F8259]" />
          <h3 className="text-lg font-serif font-bold text-[#23201E]">
            YouCam Server-to-Server (S2S v2.0) Architecture
          </h3>
        </div>
        <p className="text-xs text-[#59524B] leading-relaxed">
          ShadeProof strictly interacts with Perfect Corp’s verified asynchronous endpoints:
        </p>

        <div className="space-y-2 text-xs font-mono bg-[#FDFBF7] p-4 rounded-xl border border-[#EFE8DC]">
          <div>1. POST /s2s/v2.0/file (2-step presigned S3 upload handshake)</div>
          <div>2. POST /s2s/v2.0/task/skin-tone-analysis (Skin tone, CIELAB & undertone extraction)</div>
          <div>3. POST /s2s/v2.0/task/makeup-vto (Foundation category with HEX shade rendering)</div>
        </div>
      </div>
    </div>
  );
};

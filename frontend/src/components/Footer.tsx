import React from "react";
import { Sparkles, Shield, Database } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#23201E] text-[#A69C93] border-t border-[#383330] mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 text-white font-serif text-lg font-bold">
              <Sparkles className="w-5 h-5 text-[#C5A880]" />
              <span>ShadeProof</span>
            </div>
            <p className="mt-3 text-sm text-[#A69C93] leading-relaxed max-w-sm">
              AI-driven foundation shade matching and realistic virtual try-on. Built
              for the YouCam API Skin AI & eCommerce VTO Hackathon 2026.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">
              Data & AI Transparency
            </h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#C5A880]" />
                <span>Verified S2S YouCam AI Workflows</span>
              </li>
              <li className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#C5A880]" />
                <span>Calibrated Demo Catalogue Dataset</span>
              </li>
              <li className="text-xs text-[#8C827A] pt-1">
                Match scores represent scientific CIEDE2000 perceptual colorimetric compatibility, not probabilistic estimates.
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">
              Hackathon Track
            </h4>
            <p className="mt-3 text-sm text-[#A69C93] leading-relaxed">
              Demonstrating the technical integration between YouCam Skin Tone Analysis,
              a custom CIELAB matching engine, and YouCam Foundation Makeup VTO.
            </p>
            <div className="mt-4 text-xs text-[#7A7169]">
              © 2026 ShadeProof Team. All demo brand names are for evaluation purposes.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

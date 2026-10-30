import React, { useState, useEffect } from "react";
import { IntakeStep } from "./IntakeStep";
import { AnalysisResultsStep } from "./AnalysisResultsStep";
import { MatchesStep } from "./MatchesStep";
import { TryOnStep } from "./TryOnStep";
import {
  analyzeSkin,
  matchShades,
  requestVirtualTryOn,
  fetchCatalogueFilterOptions,
  type NormalizedSkinAnalysis,
  type ShadeMatchReport,
  type MatchCandidate,
  type NormalizedVtoResult,
  type CatalogueFilterOptions,
} from "../../services/api";

type FlowStep = "intake" | "analysis" | "matches" | "tryon";

export const ShadeFinderView: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<FlowStep>("intake");

  // Flow State
  const [userPhotoUrl, setUserPhotoUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<NormalizedSkinAnalysis | null>(null);
  const [matchReport, setMatchReport] = useState<ShadeMatchReport | null>(null);
  const [selectedShade, setSelectedShade] = useState<MatchCandidate | null>(null);
  const [vtoResult, setVtoResult] = useState<NormalizedVtoResult | null>(null);

  // Dynamic Catalogue Filter State
  const [filterOptions, setFilterOptions] = useState<CatalogueFilterOptions | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string>("All");
  const [selectedFinish, setSelectedFinish] = useState<string>("All");

  // Loading States
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isLoadingMatches, setIsLoadingMatches] = useState<boolean>(false);
  const [isLoadingVto, setIsLoadingVto] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load available catalogue filter options on mount
  useEffect(() => {
    loadFilters();
  }, []);

  const loadFilters = async () => {
    try {
      const opts = await fetchCatalogueFilterOptions();
      setFilterOptions(opts);
    } catch {
      // Fallback defaults if endpoint unreachable
      setFilterOptions({
        brands: ["All", "Lumière Beauty (Demo)", "Velvet Radiance (Demo)"],
        finishes: ["All", "Natural Satin", "Soft Matte", "Radiant Dewy"],
      });
    }
  };

  // 1. Handle Selfie Analysis
  const handleAnalyze = async (file: File, previewUrl: string, isDemoPortrait: boolean) => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    setUserPhotoUrl(previewUrl);

    try {
      const analysis = await analyzeSkin(file, isDemoPortrait);
      setAnalysisResult(analysis);
      setCurrentStep("analysis");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to analyze skin tone. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 2. Fetch Matches from CIEDE2000 Matching Engine with Brand & Finish Filters
  const fetchMatches = async (brand: string, finish: string) => {
    if (!analysisResult) return;
    setIsLoadingMatches(true);
    setErrorMessage(null);
    setSelectedBrand(brand);
    setSelectedFinish(finish);

    try {
      const skinLab: [number, number, number] = [
        analysisResult.lab_l,
        analysisResult.lab_a,
        analysisResult.lab_b,
      ];

      const report = await matchShades(
        analysisResult.hex_color,
        skinLab,
        analysisResult.undertone,
        3,
        brand,
        finish
      );

      setMatchReport(report);
      setCurrentStep("matches");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to compute shade matches.");
    } finally {
      setIsLoadingMatches(false);
    }
  };

  const handleProceedToMatches = () => {
    fetchMatches(selectedBrand, selectedFinish);
  };

  const handleFilterChange = (newBrand: string, newFinish: string) => {
    fetchMatches(newBrand, newFinish);
  };

  // 3. Trigger YouCam Virtual Try-On for Selected Candidate
  const handleSelectShadeForTryOn = async (shade: MatchCandidate) => {
    if (!analysisResult) return;
    setSelectedShade(shade);
    setIsLoadingVto(true);
    setErrorMessage(null);

    try {
      const vto = await requestVirtualTryOn({
        srcFileId: analysisResult.src_file_id,
        shadeCode: shade.shade_code,
        hexColor: shade.hex_color,
        colorIntensity: 50,
        coverageIntensity: 50,
        glowIntensity: 10,
        forceSandbox: analysisResult.is_sandbox_mode,
      });

      setVtoResult(vto);
      // Only transition to try-on step once the asset is ready
      setCurrentStep("tryon");
    } catch (err: any) {
      setErrorMessage(
        err.message || "Failed to render virtual try-on with YouCam API. Please try again."
      );
    } finally {
      setIsLoadingVto(false);
    }
  };

  // Re-render VTO when customer adjusts coverage or glow sliders
  const handleReRenderWithSettings = async (
    colorIntensity: number,
    coverageIntensity: number,
    glowIntensity: number
  ) => {
    if (!analysisResult || !selectedShade) return;
    setIsLoadingVto(true);

    try {
      const vto = await requestVirtualTryOn({
        srcFileId: analysisResult.src_file_id,
        shadeCode: selectedShade.shade_code,
        hexColor: selectedShade.hex_color,
        colorIntensity,
        coverageIntensity,
        glowIntensity,
        forceSandbox: analysisResult.is_sandbox_mode,
      });

      setVtoResult(vto);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to re-render virtual try-on.");
    } finally {
      setIsLoadingVto(false);
    }
  };

  const handleRestart = () => {
    setCurrentStep("intake");
    setUserPhotoUrl(null);
    setAnalysisResult(null);
    setMatchReport(null);
    setSelectedShade(null);
    setVtoResult(null);
    setErrorMessage(null);
    setSelectedBrand("All");
    setSelectedFinish("All");
  };

  return (
    <div className="py-4">
      {/* Top Error Banner */}
      {errorMessage && (
        <div className="mb-8 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="font-bold underline ml-4 hover:text-rose-950"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Step Router */}
      {currentStep === "intake" && (
        <IntakeStep onAnalyze={handleAnalyze} isLoading={isAnalyzing} />
      )}

      {currentStep === "analysis" && analysisResult && userPhotoUrl && (
        <AnalysisResultsStep
          analysis={analysisResult}
          previewUrl={userPhotoUrl}
          onProceedToMatches={handleProceedToMatches}
          onRetake={handleRestart}
          isLoadingMatches={isLoadingMatches}
          filterOptions={filterOptions}
          selectedBrand={selectedBrand}
          selectedFinish={selectedFinish}
          onBrandChange={setSelectedBrand}
          onFinishChange={setSelectedFinish}
        />
      )}

      {currentStep === "matches" && matchReport && (
        <MatchesStep
          report={matchReport}
          onSelectShadeForTryOn={handleSelectShadeForTryOn}
          onBackToAnalysis={() => setCurrentStep("analysis")}
          onFilterChange={handleFilterChange}
          isLoadingVto={isLoadingVto}
          selectedShadeCode={selectedShade?.shade_code}
          selectedBrand={selectedBrand}
          selectedFinish={selectedFinish}
        />
      )}

      {currentStep === "tryon" &&
        userPhotoUrl &&
        selectedShade &&
        matchReport &&
        vtoResult && (
          <TryOnStep
            originalPhotoUrl={userPhotoUrl}
            activeShade={selectedShade}
            candidates={matchReport.candidates}
            vtoResult={vtoResult}
            userSkin={matchReport.user_skin}
            onSwitchCandidate={handleSelectShadeForTryOn}
            onReRenderWithSettings={handleReRenderWithSettings}
            onRestart={handleRestart}
            isLoadingVto={isLoadingVto}
          />
        )}
    </div>
  );
};

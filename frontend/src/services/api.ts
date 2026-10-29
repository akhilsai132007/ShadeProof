/**
 * ShadeProof Frontend API Service Layer.
 * Communicates exclusively with our secure FastAPI backend.
 * Never handles or exposes raw YouCam API keys.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

type float_number = number;

export interface NormalizedSkinAnalysis {
  src_file_id: string;
  face_detected: boolean;
  skin_tone_level: string; // Fair, Light, Medium, Tan, Deep
  undertone: string;       // Warm, Cool, Neutral, Olive
  hex_color: string;       // #RRGGBB
  lab_l: float_number;
  lab_a: float_number;
  lab_b: float_number;
  ita_angle: float_number;
  fitzpatrick_type: string;
  confidence: float_number;
  facial_colors?: {
    skin?: { hex: string };
    lips?: { hex: string };
    eyes?: { hex: string };
    eyebrows?: { hex: string };
    hair?: { hex: string };
  };
  is_sandbox_mode: boolean;
  raw_response?: Record<string, any>;
}

export interface MatchCandidate {
  rank: number;
  shade_code: string;
  shade_name: string;
  brand: string;
  product_name: string;
  hex_color: string;
  delta_e00: number;
  match_score: number;
  undertone: string;
  depth_group: string;
  finish?: string;
  coverage?: string;
  price?: number;
  currency?: string;
  stock_status: "in_stock" | "low_stock" | "out_of_stock";
  match_tier: string;
  ranking_explanation: string;
  product_url?: string;
  delta_e_description?: string;
}

export interface CatalogueFilterOptions {
  brands: string[];
  finishes: string[];
}

export interface ShadeMatchReport {
  user_skin: {
    hex_color: string;
    lab_l: number;
    lab_a: number;
    lab_b: number;
    undertone?: string;
  };
  candidates: MatchCandidate[];
  total_shades_evaluated: number;
  applied_filters?: {
    brand?: string;
    finish?: string;
  };
  available_filters?: {
    brands?: string[];
    finishes?: string[];
  };
  scoring_formula_metadata: {
    formula: string;
    reference_illuminant: string;
    score_type: string;
    score_interpretation: string;
    status?: string;
    message?: string;
    config_weights?: Record<string, any>;
  };
}

export interface NormalizedVtoResult {
  task_id: string;
  src_file_id: string;
  shade_code: string;
  hex_color: string;
  result_image_url: string;
  status: string;
  is_sandbox_mode: boolean;
}

export interface MatrixCell {
  depth_group: string;
  undertone: string;
  total_shades: number;
  in_stock_shades: number;
  low_stock_shades: number;
  out_of_stock_shades: number;
  shade_codes: string[];
  status: "critical_gap" | "vulnerable" | "adequate";
}

export interface CatalogueGap {
  depth_group: string;
  undertone: string;
  severity: "critical" | "high" | "moderate";
  available_count: number;
  in_stock_count: number;
  explanation: string;
  recommendation: string;
}

export interface MerchantAnalyticsReport {
  total_shades: number;
  total_brands: number;
  total_products: number;
  in_stock_count: number;
  low_stock_count: number;
  out_of_stock_count: number;
  coverage_score: number;
  critical_gaps_count: number;
  vulnerable_segments_count: number;
  depth_distribution: { depth_group: string; count: number; percentage: number }[];
  undertone_distribution: { undertone: string; count: number; percentage: number }[];
  coverage_matrix: MatrixCell[];
  catalogue_gaps: CatalogueGap[];
  data_disclaimer: string;
}

export interface SystemInfo {
  app_name: string;
  env: string;
  debug: boolean;
  youcam_configured: boolean;
  youcam_base_url: string;
  evaluation_mode: string;
}

// ----------------------------------------------------------------------------
// API Methods
// ----------------------------------------------------------------------------

export async function fetchSystemInfo(): Promise<SystemInfo> {
  const res = await fetch(`${API_BASE_URL}/api/v1/system-info`);
  if (!res.ok) {
    throw new Error(`Failed to fetch system info: HTTP ${res.status}`);
  }
  return res.json();
}

export async function analyzeSkin(
  file: File,
  forceSandbox: boolean = false
): Promise<NormalizedSkinAnalysis> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("force_sandbox", forceSandbox.toString());

  const res = await fetch(`${API_BASE_URL}/api/v1/analyze-skin`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    let errorDetail = `HTTP ${res.status}`;
    try {
      const errorJson = await res.json();
      errorDetail = errorJson.detail || errorDetail;
    } catch {
      // Use status
    }
    throw new Error(errorDetail);
  }

  return res.json();
}

export async function matchShades(
  skinHex: string,
  skinLab?: [number, number, number],
  skinUndertone?: string,
  topN: number = 3,
  brand?: string,
  finish?: string
): Promise<ShadeMatchReport> {
  const payload: Record<string, any> = {
    skin_hex: skinHex,
    top_n: topN,
  };
  if (skinLab) {
    payload.skin_lab = skinLab;
  }
  if (skinUndertone) {
    payload.skin_undertone = skinUndertone;
  }
  if (brand && brand !== "All") {
    payload.brand = brand;
  }
  if (finish && finish !== "All") {
    payload.finish = finish;
  }

  const res = await fetch(`${API_BASE_URL}/api/v1/match-shades`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errorDetail = `HTTP ${res.status}`;
    try {
      const errorJson = await res.json();
      errorDetail = errorJson.detail || errorDetail;
    } catch {
      // Use status
    }
    throw new Error(errorDetail);
  }

  return res.json();
}

export async function fetchCatalogueFilterOptions(): Promise<CatalogueFilterOptions> {
  const res = await fetch(`${API_BASE_URL}/api/v1/catalogue/filter-options`);
  if (!res.ok) {
    throw new Error(`Failed to fetch filter options: HTTP ${res.status}`);
  }
  return res.json();
}

export async function requestVirtualTryOn(params: {
  srcFileId: string;
  shadeCode: string;
  hexColor: string;
  colorIntensity?: number;
  coverageIntensity?: number;
  glowIntensity?: number;
  forceSandbox?: boolean;
}): Promise<NormalizedVtoResult> {
  const payload = {
    src_file_id: params.srcFileId,
    shade_code: params.shadeCode,
    hex_color: params.hexColor,
    color_intensity: params.colorIntensity ?? 50,
    coverage_intensity: params.coverageIntensity ?? 50,
    glow_intensity: params.glowIntensity ?? 0,
    force_sandbox: params.forceSandbox ?? false,
  };

  const res = await fetch(`${API_BASE_URL}/api/v1/virtual-try-on`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errorDetail = `HTTP ${res.status}`;
    try {
      const errorJson = await res.json();
      errorDetail = errorJson.detail || errorDetail;
    } catch {
      // Use status
    }
    throw new Error(errorDetail);
  }

  return res.json();
}

export async function fetchMerchantAnalytics(
  brand?: string,
  product?: string
): Promise<MerchantAnalyticsReport> {
  const params = new URLSearchParams();
  if (brand) params.append("brand", brand);
  if (product) params.append("product", product);

  const url = `${API_BASE_URL}/api/v1/analytics/overview${
    params.toString() ? `?${params.toString()}` : ""
  }`;

  const res = await fetch(url);
  if (!res.ok) {
    let errorDetail = `HTTP ${res.status}`;
    try {
      const errorJson = await res.json();
      errorDetail = errorJson.detail || errorDetail;
    } catch {
      // Use status
    }
    throw new Error(errorDetail);
  }

  return res.json();
}

export function getCsvExportUrl(brand?: string, product?: string): string {
  const params = new URLSearchParams();
  if (brand) params.append("brand", brand);
  if (product) params.append("product", product);

  return `${API_BASE_URL}/api/v1/analytics/export-csv${
    params.toString() ? `?${params.toString()}` : ""
  }`;
}

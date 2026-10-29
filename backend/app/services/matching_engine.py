"""
ShadeProof Foundation Shade-Matching Engine.

A standalone, deterministic colorimetric matching engine based on:
1. Standard CIE D65 sRGB-to-CIELAB color space transformation.
2. The Sharma, Wu, and Dalal (2005) formulation of CIEDE2000 (ΔE00).
3. A transparent undertone compatibility and inventory availability model.

IMPORTANT:
- Match scores are heuristic colorimetric compatibility indices, NOT statistical probabilities
  or clinical machine-learning confidences.
- Skin depth is evaluated strictly on colorimetric lightness (L*); Fitzpatrick phototype
  is NOT inferred from color alone as it represents a clinical UV reactivity metric.
"""

import math
import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple


# -----------------------------------------------------------------------------
# Configuration Dataclass
# -----------------------------------------------------------------------------

@dataclass
class MatchingConfig:
    """
    Configurable parameters for the CIEDE2000 matching and scoring formula.
    Allows retailers and developers to adjust penalty weights and scaling factors.
    """
    # CIEDE2000 parametric weights (standard 1:1:1 for graphic arts & cosmetics)
    weight_lightness: float = 1.0
    weight_chroma: float = 1.0
    weight_hue: float = 1.0

    # Undertone penalties added to effective ΔE distance
    penalty_undertone_match: float = 0.0
    penalty_undertone_neutral_blend: float = 1.2
    penalty_undertone_opposite: float = 4.0      # Warm vs. Cool conflict
    penalty_undertone_olive_nuance: float = 1.8  # Olive vs. non-olive

    # Stock availability preference
    prefer_in_stock: bool = True
    penalty_out_of_stock: float = 1.5           # Mild ranking bias toward available inventory

    # Score calculation scaling: Score = 100 - (Effective_ΔE * scaling_factor)
    score_scaling_factor: float = 4.2
    score_max: float = 99.0                     # Never claim 100% certainty
    score_min: float = 50.0


# -----------------------------------------------------------------------------
# Domain Data Classes
# -----------------------------------------------------------------------------

@dataclass
class CandidateShade:
    shade_code: str
    shade_name: str
    brand: str
    product_name: str
    hex_color: str
    undertone: str
    depth_group: str
    finish: str = "Natural Matte"
    coverage: str = "Medium-Full"
    lab_l: Optional[float] = None
    lab_a: Optional[float] = None
    lab_b: Optional[float] = None
    stock_status: str = "in_stock"  # in_stock, low_stock, out_of_stock
    price: float = 39.0
    currency: str = "USD"
    product_url: Optional[str] = None
    is_demo_data: bool = True


@dataclass
class MatchResult:
    rank: int
    shade_code: str
    shade_name: str
    brand: str
    product_name: str
    hex_color: str
    delta_e00: float                    # True perceptual chromatic difference
    match_score: float                  # Calibrated compatibility percentage [50.0, 99.0]
    undertone: str
    depth_group: str
    finish: str = "Natural Matte"
    coverage: str = "Medium-Full"
    stock_status: str = "in_stock"
    match_tier: str = "Close Match"     # "Exact Match", "Close Match", "Wearable Alternative"
    ranking_explanation: str = ""
    price: float = 39.0
    currency: str = "USD"
    product_url: Optional[str] = None
    delta_e_description: str = ""


@dataclass
class ShadeMatchReport:
    user_skin: Dict[str, Any]
    candidates: List[MatchResult]
    total_shades_evaluated: int
    applied_filters: Dict[str, str] = field(default_factory=dict)
    available_filters: Dict[str, List[str]] = field(default_factory=dict)
    scoring_formula_metadata: Dict[str, Any] = field(default_factory=dict)


# -----------------------------------------------------------------------------
# Color Space Conversion (sRGB -> CIE XYZ -> CIELAB D65)
# -----------------------------------------------------------------------------

HEX_REGEX = re.compile(r"^#?([0-9A-Fa-f]{6})$")

def hex_to_cielab(hex_str: str) -> Tuple[float, float, float]:
    """
    Converts a valid 6-character sRGB HEX color to CIELAB (L*, a*, b*) coordinates
    using the CIE 1931 2-degree standard observer and D65 reference white.

    D65 Reference White:
      X_n = 0.95047
      Y_n = 1.00000
      Z_n = 1.08883

    Raises:
      ValueError: If the hex string is malformed or invalid.
    """
    if not isinstance(hex_str, str):
        raise ValueError(f"HEX color must be a string, got {type(hex_str).__name__}")

    match = HEX_REGEX.match(hex_str.strip())
    if not match:
        raise ValueError(f"Invalid HEX format '{hex_str}'. Expected 6-character hex like '#EACDB6'.")

    clean_hex = match.group(1)
    r = int(clean_hex[0:2], 16)
    g = int(clean_hex[2:4], 16)
    b = int(clean_hex[4:6], 16)

    # 1. Normalize sRGB to [0, 1]
    r_norm = r / 255.0
    g_norm = g / 255.0
    b_norm = b / 255.0

    # 2. Linearization (Gamma expansion)
    def linearize(c: float) -> float:
        return c / 12.92 if c <= 0.04045 else math.pow((c + 0.055) / 1.055, 2.4)

    r_lin = linearize(r_norm)
    g_lin = linearize(g_norm)
    b_lin = linearize(b_norm)

    # 3. Transform to CIE 1931 XYZ (D65)
    x = r_lin * 0.4124564 + g_lin * 0.3575761 + b_lin * 0.1804375
    y = r_lin * 0.2126729 + g_lin * 0.7151522 + b_lin * 0.0721750
    z = r_lin * 0.0193339 + g_lin * 0.1191920 + b_lin * 0.9503041

    # 4. Normalize by D65 reference white
    x_n, y_n, z_n = 0.95047, 1.00000, 1.08883
    x /= x_n
    y /= y_n
    z /= z_n

    # 5. Non-linear transform to CIELAB
    delta = 6.0 / 29.0
    delta_sq = delta * delta
    delta_cb = delta * delta_sq

    def f_transform(t: float) -> float:
        return math.pow(t, 1.0 / 3.0) if t > delta_cb else (t / (3.0 * delta_sq)) + (4.0 / 29.0)

    fx = f_transform(x)
    fy = f_transform(y)
    fz = f_transform(z)

    lab_l = round(116.0 * fy - 16.0, 4)
    lab_a = round(500.0 * (fx - fy), 4)
    lab_b = round(200.0 * (fy - fz), 4)

    return lab_l, lab_a, lab_b


# -----------------------------------------------------------------------------
# CIEDE2000 (ΔE00) Implementation
# -----------------------------------------------------------------------------

def ciede2000(
    l1: float, a1: float, b1: float,
    l2: float, a2: float, b2: float,
    k_l: float = 1.0, k_c: float = 1.0, k_h: float = 1.0,
) -> float:
    """
    Computes the CIEDE2000 color difference (ΔE00) between two CIELAB colors.
    Based on the standard publication:
      G. Sharma, W. Wu, E. N. Dalal, Color Research & Application, 30(1): 21–30, 2005.

    Returns:
      float: The perceptual difference ΔE00, rounded to 4 decimal places.
    """
    # 1. Calculate C_i and G factor
    c1 = math.hypot(a1, b1)
    c2 = math.hypot(a2, b2)
    c_bar = (c1 + c2) / 2.0
    c_bar_7 = c_bar ** 7
    g = 0.5 * (1.0 - math.sqrt(c_bar_7 / (c_bar_7 + 25.0 ** 7)))

    # 2. Compute a'_i, C'_i, and h'_i
    a1_prime = (1.0 + g) * a1
    a2_prime = (1.0 + g) * a2
    c1_prime = math.hypot(a1_prime, b1)
    c2_prime = math.hypot(a2_prime, b2)

    def get_hue_angle_degrees(a_prime: float, b_star: float) -> float:
        if a_prime == 0.0 and b_star == 0.0:
            return 0.0
        angle = math.degrees(math.atan2(b_star, a_prime))
        return angle if angle >= 0.0 else angle + 360.0

    h1_prime = get_hue_angle_degrees(a1_prime, b1)
    h2_prime = get_hue_angle_degrees(a2_prime, b2)

    # 3. Calculate ΔL', ΔC', Δh'
    delta_l_prime = l2 - l1
    delta_c_prime = c2_prime - c1_prime

    if c1_prime * c2_prime == 0.0:
        delta_h_deg = 0.0
    else:
        diff = h2_prime - h1_prime
        if abs(diff) <= 180.0:
            delta_h_deg = diff
        elif diff > 180.0:
            delta_h_deg = diff - 360.0
        else:
            delta_h_deg = diff + 360.0

    delta_H_prime = 2.0 * math.sqrt(c1_prime * c2_prime) * math.sin(math.radians(delta_h_deg / 2.0))

    # 4. Calculate arithmetic averages L_bar', C_bar', h_bar'
    l_bar_prime = (l1 + l2) / 2.0
    c_bar_prime = (c1_prime + c2_prime) / 2.0

    if c1_prime * c2_prime == 0.0:
        h_bar_prime = h1_prime + h2_prime
    else:
        diff_h = abs(h1_prime - h2_prime)
        sum_h = h1_prime + h2_prime
        if diff_h <= 180.0:
            h_bar_prime = sum_h / 2.0
        elif sum_h < 360.0:
            h_bar_prime = (sum_h + 360.0) / 2.0
        else:
            h_bar_prime = (sum_h - 360.0) / 2.0

    # 5. T factor for hue weighting
    t = (
        1.0
        - 0.17 * math.cos(math.radians(h_bar_prime - 30.0))
        + 0.24 * math.cos(math.radians(2.0 * h_bar_prime))
        + 0.32 * math.cos(math.radians(3.0 * h_bar_prime + 6.0))
        - 0.20 * math.cos(math.radians(4.0 * h_bar_prime - 63.0))
    )

    # 6. Weighting functions S_L, S_C, S_H
    l_diff_sq = (l_bar_prime - 50.0) ** 2
    s_l = 1.0 + (0.015 * l_diff_sq) / math.sqrt(20.0 + l_diff_sq)
    s_c = 1.0 + 0.045 * c_bar_prime
    s_h = 1.0 + 0.015 * c_bar_prime * t

    # 7. Rotation term R_T
    delta_theta = 30.0 * math.exp(-(((h_bar_prime - 275.0) / 25.0) ** 2))
    c_bar_p_7 = c_bar_prime ** 7
    r_c = 2.0 * math.sqrt(c_bar_p_7 / (c_bar_p_7 + 25.0 ** 7))
    r_t = -math.sin(math.radians(2.0 * delta_theta)) * r_c

    # 8. Compute final ΔE00
    term_l = delta_l_prime / (k_l * s_l)
    term_c = delta_c_prime / (k_c * s_c)
    term_h = delta_H_prime / (k_h * s_h)

    de00_sq = term_l ** 2 + term_c ** 2 + term_h ** 2 + r_t * term_c * term_h
    return round(math.sqrt(max(0.0, de00_sq)), 4)


# -----------------------------------------------------------------------------
# Undertone Compatibility & Heuristic Scoring
# -----------------------------------------------------------------------------

def evaluate_undertone_compatibility(
    user_undertone: Optional[str],
    shade_undertone: Optional[str],
    config: MatchingConfig,
) -> Tuple[float, str]:
    """
    Evaluates undertone harmony between customer skin and foundation candidate.
    Returns (penalty, explanation_note).
    """
    if not user_undertone or not shade_undertone:
        return 0.0, "Undertone not specified; ranked solely on chromatic distance."

    u_u = user_undertone.strip().lower()
    s_u = shade_undertone.strip().lower()

    if u_u == s_u:
        return config.penalty_undertone_match, f"Exact undertone match ({s_u.capitalize()})."

    # Neutral blends smoothly with either warm or cool
    if u_u == "neutral" or s_u == "neutral":
        return config.penalty_undertone_neutral_blend, f"Compatible neutral blend with {s_u.capitalize()} shade."

    # Olive undertones have distinct green/golden nuance
    if u_u == "olive" or s_u == "olive":
        other = s_u if u_u == "olive" else u_u
        if other in ("warm", "neutral"):
            return config.penalty_undertone_olive_nuance, f"Olive nuance: partial warmth harmony with {s_u.capitalize()}."
        else:
            return config.penalty_undertone_opposite, f"High undertone contrast: Olive vs. {s_u.capitalize()}."

    # Direct opposition: Warm vs Cool
    if (u_u == "warm" and s_u == "cool") or (u_u == "cool" and s_u == "warm"):
        return config.penalty_undertone_opposite, f"Undertone mismatch: {u_u.capitalize()} skin with {s_u.capitalize()} shade may look ashy/orange."

    return 1.5, f"Subtle undertone contrast ({u_u.capitalize()} vs {s_u.capitalize()})."


def compute_compatibility_score(
    effective_delta_e: float,
    config: MatchingConfig,
) -> float:
    """
    Computes a transparent 50.0% to 99.0% compatibility index from effective ΔE.
    Clearly calibrated so lower distance yields higher compatibility.
    """
    raw_score = 100.0 - (effective_delta_e * config.score_scaling_factor)
    return round(max(config.score_min, min(config.score_max, raw_score)), 1)


def categorize_match_tier(raw_delta_e: float) -> str:
    """Categorizes the perceptual fit according to industrial color tolerance."""
    if raw_delta_e < 1.2:
        return "Exact Match"
    elif raw_delta_e < 2.5:
        return "Close Match"
    else:
        return "Wearable Alternative"


# -----------------------------------------------------------------------------
# Standalone Foundation Matching Engine
# -----------------------------------------------------------------------------

class FoundationMatchingEngine:
    """
    Standalone foundation shade matching engine.
    Independent of web frameworks or database drivers.
    """

    def __init__(self, config: Optional[MatchingConfig] = None):
        self.config = config or MatchingConfig()

    def match(
        self,
        skin_lab: Optional[Tuple[float, float, float]] = None,
        skin_hex: Optional[str] = None,
        skin_undertone: Optional[str] = None,
        catalogue: Optional[List[CandidateShade]] = None,
        brand_filter: Optional[str] = None,
        finish_filter: Optional[str] = None,
        top_n: int = 3,
    ) -> ShadeMatchReport:
        """
        Ranks candidate shades against the user's skin tone coordinates.

        Args:
          skin_lab: Tuple of (L*, a*, b*) from skin analysis.
          skin_hex: Fallback hex string (#RRGGBB) if Lab is not directly provided.
          skin_undertone: "Warm", "Cool", "Neutral", "Olive" (or None).
          catalogue: List of CandidateShade objects to evaluate.
          brand_filter: Optional brand constraint (e.g. 'Lumière Beauty' or 'All').
          finish_filter: Optional finish constraint (e.g. 'Soft Matte' or 'All').
          top_n: Number of candidate shades to return (default: 3).

        Returns:
          ShadeMatchReport containing top candidates, ΔE00, compatibility scores,
          and transparent ranking explanations.
        """
        # 1. Resolve and validate input skin coordinates
        target_l, target_a, target_b, resolved_hex = self._resolve_target_coordinates(skin_lab, skin_hex)

        user_skin_info = {
            "hex_color": resolved_hex,
            "lab_l": target_l,
            "lab_a": target_a,
            "lab_b": target_b,
            "undertone": skin_undertone.capitalize() if skin_undertone else None,
        }

        # Collect dynamic available filters from the catalogue
        raw_catalogue = catalogue or []
        unique_brands = sorted(list({s.brand for s in raw_catalogue if s.brand}))
        unique_finishes = sorted(list({s.finish for s in raw_catalogue if s.finish}))
        available_filters = {
            "brands": ["All"] + unique_brands,
            "finishes": ["All"] + unique_finishes,
        }

        active_brand = (brand_filter or "All").strip()
        active_finish = (finish_filter or "All").strip()
        applied_filters = {
            "brand": active_brand,
            "finish": active_finish,
        }

        # 2. Check for empty catalogue
        if not raw_catalogue:
            return ShadeMatchReport(
                user_skin=user_skin_info,
                candidates=[],
                total_shades_evaluated=0,
                applied_filters=applied_filters,
                available_filters=available_filters,
                scoring_formula_metadata={
                    "status": "empty_catalogue",
                    "message": "No candidate shades available in the catalogue.",
                },
            )

        # 3. Apply Brand and Finish filters before ranking
        filtered_catalogue = raw_catalogue
        if active_brand.lower() != "all":
            filtered_catalogue = [
                s for s in filtered_catalogue
                if active_brand.lower() in s.brand.lower()
            ]

        if active_finish.lower() != "all":
            filtered_catalogue = [
                s for s in filtered_catalogue
                if active_finish.lower() in s.finish.lower()
            ]

        if not filtered_catalogue:
            return ShadeMatchReport(
                user_skin=user_skin_info,
                candidates=[],
                total_shades_evaluated=0,
                applied_filters=applied_filters,
                available_filters=available_filters,
                scoring_formula_metadata={
                    "status": "empty_filtered_results",
                    "message": f"No candidate shades match brand '{active_brand}' and finish '{active_finish}'.",
                },
            )

        # 4. Evaluate each candidate shade in the filtered catalogue
        evaluated_candidates = []

        for shade in filtered_catalogue:
            # Resolve shade Lab coordinates
            try:
                s_l, s_a, s_b = self._resolve_shade_lab(shade)
            except Exception:
                # Skip candidate if its color data is corrupt
                continue

            # Compute true CIEDE2000 color difference
            raw_de00 = ciede2000(
                target_l, target_a, target_b,
                s_l, s_a, s_b,
                k_l=self.config.weight_lightness,
                k_c=self.config.weight_chroma,
                k_h=self.config.weight_hue,
            )

            # Undertone compatibility penalty
            u_penalty, u_note = evaluate_undertone_compatibility(
                skin_undertone, shade.undertone, self.config
            )

            # Stock status penalty
            stock_penalty = 0.0
            if self.config.prefer_in_stock and shade.stock_status == "out_of_stock":
                stock_penalty = self.config.penalty_out_of_stock

            # Effective distance used strictly for ranking priority
            ranking_distance = raw_de00 + u_penalty + stock_penalty

            # Compatibility score (heuristic percentage)
            score = compute_compatibility_score(ranking_distance, self.config)

            match_tier = categorize_match_tier(raw_de00)

            evaluated_candidates.append({
                "shade": shade,
                "raw_de00": round(raw_de00, 2),
                "ranking_distance": ranking_distance,
                "score": score,
                "u_note": u_note,
                "match_tier": match_tier,
            })

        # 5. Sort by ranking distance (lowest distance = closest match)
        evaluated_candidates.sort(key=lambda x: x["ranking_distance"])

        # 6. Extract top_n candidates and format transparent explanations
        results: List[MatchResult] = []
        for i, item in enumerate(evaluated_candidates[:top_n], start=1):
            sh = item["shade"]
            raw_de00 = item["raw_de00"]
            score = item["score"]
            u_note = item["u_note"]
            match_tier = item["match_tier"]

            explanation = self._generate_explanation(
                rank=i,
                delta_e=raw_de00,
                undertone_note=u_note,
                stock_status=sh.stock_status,
                shade_name=sh.shade_name,
            )

            de_description = self._describe_delta_e(raw_de00)

            results.append(
                MatchResult(
                    rank=i,
                    shade_code=sh.shade_code,
                    shade_name=sh.shade_name,
                    brand=sh.brand,
                    product_name=sh.product_name,
                    hex_color=sh.hex_color.upper(),
                    delta_e00=raw_de00,
                    match_score=score,
                    undertone=sh.undertone,
                    depth_group=sh.depth_group,
                    finish=sh.finish,
                    coverage=sh.coverage,
                    stock_status=sh.stock_status,
                    match_tier=match_tier,
                    ranking_explanation=explanation,
                    price=sh.price,
                    currency=sh.currency,
                    product_url=sh.product_url,
                    delta_e_description=de_description,
                )
            )

        metadata = {
            "formula": "CIEDE2000 (Sharma, Wu, Dalal 2005)",
            "reference_illuminant": "CIE Standard Illuminant D65 (2-degree observer)",
            "score_type": "heuristic_colorimetric_compatibility_index",
            "score_interpretation": "Compatibility index reflects chromatic closeness and undertone alignment. It is not a statistical probability.",
            "config_weights": {
                "k_L": self.config.weight_lightness,
                "k_C": self.config.weight_chroma,
                "k_H": self.config.weight_hue,
                "opposite_undertone_penalty": self.config.penalty_undertone_opposite,
            },
        }

        return ShadeMatchReport(
            user_skin=user_skin_info,
            candidates=results,
            total_shades_evaluated=len(evaluated_candidates),
            applied_filters=applied_filters,
            available_filters=available_filters,
            scoring_formula_metadata=metadata,
        )

    # -------------------------------------------------------------------------
    # Internal Helpers
    # -------------------------------------------------------------------------

    def _resolve_target_coordinates(
        self,
        skin_lab: Optional[Tuple[float, float, float]],
        skin_hex: Optional[str],
    ) -> Tuple[float, float, float, str]:
        """Validates and resolves skin CIELAB and HEX."""
        if skin_lab is not None:
            l, a, b = skin_lab
            if not (0.0 <= l <= 100.0):
                raise ValueError(f"Invalid Lightness L*={l}. Must be between 0.0 and 100.0.")
            resolved_hex = skin_hex.upper() if skin_hex else "#UNKNOWN"
            return float(l), float(a), float(b), resolved_hex

        if skin_hex:
            l, a, b = hex_to_cielab(skin_hex)
            return l, a, b, skin_hex.upper()

        raise ValueError(
            "Missing skin analysis data. Valid CIELAB (L*, a*, b*) coordinates or a valid HEX color code is required."
        )

    def _resolve_shade_lab(self, shade: CandidateShade) -> Tuple[float, float, float]:
        """Extracts pre-computed CIELAB or converts from shade hex."""
        if shade.lab_l is not None and shade.lab_a is not None and shade.lab_b is not None:
            return shade.lab_l, shade.lab_a, shade.lab_b
        return hex_to_cielab(shade.hex_color)

    def _generate_explanation(
        self,
        rank: int,
        delta_e: float,
        undertone_note: str,
        stock_status: str,
        shade_name: str,
    ) -> str:
        """Constructs an objective, transparent ranking justification."""
        rank_prefixes = {
            1: "Primary Match",
            2: "Closest Alternative",
            3: "Secondary Alternative",
        }
        prefix = rank_prefixes.get(rank, f"Rank {rank}")

        notes = [f"{prefix}: ΔE00={delta_e:.2f}."]
        notes.append(undertone_note)

        if stock_status == "out_of_stock":
            notes.append("Currently out of stock; available for backorder.")
        elif stock_status == "low_stock":
            notes.append("Limited stock remaining.")

        return " ".join(notes)

    def _describe_delta_e(self, de00: float) -> str:
        """Provides an industrial perception explanation for ΔE00."""
        if de00 < 1.0:
            return "Perceptually imperceptible difference to the human eye."
        elif de00 < 2.0:
            return "Very slight chromatic difference, blends seamlessly on skin."
        elif de00 < 3.5:
            return "Noticeable contrast under close scrutiny; wearable with blending."
        else:
            return "Distinct visual shade difference."


# Global instance with default settings
matching_engine = FoundationMatchingEngine()

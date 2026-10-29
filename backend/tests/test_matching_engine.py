import pytest
from app.services.matching_engine import (
    hex_to_cielab,
    ciede2000,
    evaluate_undertone_compatibility,
    compute_compatibility_score,
    CandidateShade,
    MatchingConfig,
    FoundationMatchingEngine,
)


# -----------------------------------------------------------------------------
# 1. HEX-to-CIELAB Conversion Tests
# -----------------------------------------------------------------------------

def test_hex_to_cielab_valid_colors():
    """Verify D65 standard conversion for canonical color boundaries and skin tones."""
    # Pure white #FFFFFF -> Lightness should be ~100
    l_w, a_w, b_w = hex_to_cielab("#FFFFFF")
    assert 99.5 <= l_w <= 100.0
    assert abs(a_w) < 0.1
    assert abs(b_w) < 0.1

    # Pure black #000000 -> Lightness should be 0
    l_b, a_b, b_b = hex_to_cielab("#000000")
    assert l_b == 0.0
    assert abs(a_b) < 0.1
    assert abs(b_b) < 0.1

    # Mid neutral gray #808080
    l_g, a_g, b_g = hex_to_cielab("#808080")
    assert 53.0 <= l_g <= 54.5
    assert abs(a_g) < 0.5
    assert abs(b_g) < 0.5

    # Realistic warm medium skin tone #D8A47F
    l_s, a_s, b_s = hex_to_cielab("#D8A47F")
    assert 69.0 <= l_s <= 72.0
    assert 13.0 <= a_s <= 16.0
    assert 24.0 <= b_s <= 28.0

    # Test without leading '#' and with lowercase
    l_low, a_low, b_low = hex_to_cielab("d8a47f")
    assert l_low == l_s
    assert a_low == a_s
    assert b_low == b_s


def test_hex_to_cielab_invalid_inputs():
    """Verify safe error handling for malformed hex strings and wrong types."""
    invalid_hexes = [
        "not_a_hex",
        "#12345",      # 5 characters
        "#1234567",    # 7 characters
        "#GGGGGG",    # non-hex chars
        "",           # empty string
        "   ",        # whitespace
    ]
    for bad in invalid_hexes:
        with pytest.raises(ValueError) as exc:
            hex_to_cielab(bad)
        assert "Invalid HEX format" in str(exc.value)

    # Wrong types
    with pytest.raises(ValueError):
        hex_to_cielab(None)  # type: ignore

    with pytest.raises(ValueError):
        hex_to_cielab(123456)  # type: ignore


# -----------------------------------------------------------------------------
# 2. CIEDE2000 Reference Benchmark Tests (Sharma et al. 2005)
# -----------------------------------------------------------------------------

def test_ciede2000_sharma_reference_benchmark():
    """
    Verifies that our CIEDE2000 implementation matches the published reference test pairs
    from Gaurav Sharma, Wencheng Wu, and Edul N. Dalal (2005).
    """
    # Pair 1: Expected ΔE00 = 2.0425
    de_pair1 = ciede2000(50.0000, 2.6772, -79.7751, 50.0000, 0.0000, -82.7485)
    assert abs(de_pair1 - 2.0425) < 0.0001, f"Expected 2.0425, got {de_pair1}"

    # Pair 2: Expected ΔE00 = 2.8615
    de_pair2 = ciede2000(50.0000, 3.1571, -77.2803, 50.0000, 0.0000, -82.7485)
    assert abs(de_pair2 - 2.8615) < 0.0001, f"Expected 2.8615, got {de_pair2}"

    # Identical colors: ΔE00 must equal exactly 0.0
    de_identical = ciede2000(65.0, 15.0, 25.0, 65.0, 15.0, 25.0)
    assert de_identical == 0.0


# -----------------------------------------------------------------------------
# 3. Undertone Compatibility Tests
# -----------------------------------------------------------------------------

def test_undertone_compatibility_penalties():
    """Verify undertone alignment logic and penalty assignment."""
    config = MatchingConfig(
        penalty_undertone_match=0.0,
        penalty_undertone_neutral_blend=1.2,
        penalty_undertone_opposite=4.0,
        penalty_undertone_olive_nuance=1.8,
    )

    # Exact matches
    p_warm, note = evaluate_undertone_compatibility("Warm", "Warm", config)
    assert p_warm == 0.0
    assert "Exact undertone match" in note

    p_cool, _ = evaluate_undertone_compatibility("Cool", "Cool", config)
    assert p_cool == 0.0

    # Neutral blends
    p_neu_warm, note_neu = evaluate_undertone_compatibility("Neutral", "Warm", config)
    assert p_neu_warm == 1.2
    assert "neutral blend" in note_neu.lower()

    # Direct opposition (Warm vs Cool)
    p_opp, note_opp = evaluate_undertone_compatibility("Warm", "Cool", config)
    assert p_opp == 4.0
    assert "mismatch" in note_opp.lower()

    # Missing undertone should not penalize
    p_none, _ = evaluate_undertone_compatibility(None, "Warm", config)
    assert p_none == 0.0


# -----------------------------------------------------------------------------
# 4. Matching & Ranking Integration Tests
# -----------------------------------------------------------------------------

@pytest.fixture
def sample_catalogue():
    return [
        CandidateShade(
            shade_code="SH-100",
            shade_name="Porcelain Cool",
            brand="Brand A",
            product_name="Foundation X",
            hex_color="#F6E6DB",
            undertone="Cool",
            depth_group="Fair",
            finish="Radiant Satin",
            stock_status="in_stock",
        ),
        CandidateShade(
            shade_code="SH-210",
            shade_name="Vanilla Neutral",
            brand="Brand A",
            product_name="Foundation X",
            hex_color="#EACDB6",
            undertone="Neutral",
            depth_group="Light",
            finish="Natural Matte",
            stock_status="in_stock",
        ),
        CandidateShade(
            shade_code="SH-320",
            shade_name="Warm Amber",
            brand="Brand A",
            product_name="Foundation X",
            hex_color="#D8A47F",
            undertone="Warm",
            depth_group="Medium",
            finish="Radiant Satin",
            stock_status="in_stock",
        ),
        CandidateShade(
            shade_code="SH-330",
            shade_name="Olive Sand",
            brand="Brand A",
            product_name="Foundation X",
            hex_color="#CDB28D",
            undertone="Olive",
            depth_group="Medium",
            finish="Natural Matte",
            stock_status="in_stock",
        ),
        CandidateShade(
            shade_code="SH-520",
            shade_name="Mahogany Deep",
            brand="Brand A",
            product_name="Foundation X",
            hex_color="#4B2F21",
            undertone="Warm",
            depth_group="Deep",
            finish="Soft Matte",
            stock_status="out_of_stock",
        ),
        CandidateShade(
            shade_code="SH-B1",
            shade_name="Amber Glow",
            brand="Brand B",
            product_name="Foundation Y",
            hex_color="#D8A47F",
            undertone="Warm",
            depth_group="Medium",
            finish="Dewy Luminous",
            stock_status="in_stock",
        ),
    ]


def test_matching_engine_ranks_closest_shade_first(sample_catalogue):
    """
    Given a skin tone that exactly matches SH-320 (#D8A47F, Warm),
    SH-320 must rank #1 with ΔE00 ~ 0.0 and highest compatibility score.
    """
    engine = FoundationMatchingEngine()
    report = engine.match(
        skin_hex="#D8A47F",
        skin_undertone="Warm",
        catalogue=sample_catalogue,
        top_n=3,
    )

    assert len(report.candidates) == 3
    primary = report.candidates[0]
    assert primary.rank == 1
    assert primary.shade_code == "SH-320"
    assert primary.delta_e00 == 0.0
    assert primary.match_score >= 98.0
    assert primary.match_tier == "Exact Match"
    assert "Primary Match" in primary.ranking_explanation


def test_undertone_compatibility_alters_ranking(sample_catalogue):
    """
    Verify that undertone compatibility influences candidate ranking.
    Two candidates with similar lightness:
    A user with Cool skin should rank the Cool/Neutral shades ahead of conflicting Warm shades.
    """
    engine = FoundationMatchingEngine()

    # User with Fair Cool skin (#F5E5DC)
    report = engine.match(
        skin_hex="#F6E6DB",
        skin_undertone="Cool",
        catalogue=sample_catalogue,
        top_n=3,
    )

    assert report.candidates[0].shade_code == "SH-100"
    assert report.candidates[0].undertone == "Cool"


def test_empty_catalogue_handling():
    """Verify that an empty catalogue returns an empty report gracefully without crashing."""
    engine = FoundationMatchingEngine()
    report = engine.match(
        skin_hex="#D8A47F",
        skin_undertone="Warm",
        catalogue=[],
        top_n=3,
    )

    assert len(report.candidates) == 0
    assert report.total_shades_evaluated == 0
    assert report.scoring_formula_metadata["status"] == "empty_catalogue"


def test_invalid_skin_input_raises_clear_error(sample_catalogue):
    """Verify that completely missing color data raises an informative ValueError."""
    engine = FoundationMatchingEngine()

    with pytest.raises(ValueError) as exc:
        engine.match(
            skin_lab=None,
            skin_hex=None,
            catalogue=sample_catalogue,
        )
    assert "Missing skin analysis data" in str(exc.value)

    # Invalid L* coordinate
    with pytest.raises(ValueError):
        engine.match(
            skin_lab=(150.0, 10.0, 20.0),  # L > 100 is invalid
            catalogue=sample_catalogue,
        )


def test_out_of_stock_shades_handling(sample_catalogue):
    """
    Verify that out of stock shades preserve their true colorimetric ΔE00
    while explicitly noting their inventory status in the explanation.
    """
    engine = FoundationMatchingEngine(config=MatchingConfig(prefer_in_stock=True))

    # Match against deep tone
    report = engine.match(
        skin_hex="#4B2F21",
        skin_undertone="Warm",
        catalogue=sample_catalogue,
        top_n=3,
    )

    candidate_520 = next(c for c in report.candidates if c.shade_code == "SH-520")
    assert candidate_520.stock_status == "out_of_stock"
    assert candidate_520.delta_e00 == 0.0  # Raw chromatic distance remains true
    assert "out of stock" in candidate_520.ranking_explanation.lower()


# -----------------------------------------------------------------------------
# 5. API Endpoint End-to-End Test
# -----------------------------------------------------------------------------

def test_api_match_shades_endpoint(client):
    """Verify POST /api/v1/match-shades returns top 3 ranked candidates with ΔE00."""
    payload = {
        "skin_hex": "#D8A47F",
        "skin_undertone": "Warm",
        "top_n": 3,
    }
    response = client.post("/api/v1/match-shades", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "candidates" in data
    assert len(data["candidates"]) == 3
    assert data["total_shades_evaluated"] >= 15

    top_match = data["candidates"][0]
    assert top_match["rank"] == 1
    assert "delta_e00" in top_match
    assert top_match["delta_e00"] >= 0.0
    assert "match_score" in top_match
    assert "ranking_explanation" in top_match
    assert "match_tier" in top_match

    # Verify score formula metadata disclosure
    assert "scoring_formula_metadata" in data
    assert "CIEDE2000" in data["scoring_formula_metadata"]["formula"]
    assert "not a statistical probability" in data["scoring_formula_metadata"]["score_interpretation"]


# -----------------------------------------------------------------------------
# 6. Brand & Finish Filter Tests (Phase 7 Enhancements)
# -----------------------------------------------------------------------------

def test_matching_engine_brand_filtering(sample_catalogue):
    """Verify that specifying brand_filter restricts candidates to that brand only."""
    engine = FoundationMatchingEngine()
    report = engine.match(
        skin_hex="#D8A47F",
        skin_undertone="Warm",
        catalogue=sample_catalogue,
        brand_filter="Brand B",
        top_n=3,
    )
    assert len(report.candidates) == 1
    assert report.candidates[0].brand == "Brand B"
    assert report.candidates[0].shade_code == "SH-B1"
    assert report.applied_filters["brand"] == "Brand B"
    assert "Brand B" in report.available_filters["brands"]


def test_matching_engine_finish_filtering(sample_catalogue):
    """Verify that specifying finish_filter restricts candidates to matching finish."""
    engine = FoundationMatchingEngine()
    report = engine.match(
        skin_hex="#D8A47F",
        skin_undertone="Warm",
        catalogue=sample_catalogue,
        finish_filter="Radiant",
        top_n=3,
    )
    # SH-100 and SH-320 have "Radiant Satin"
    assert len(report.candidates) == 2
    for c in report.candidates:
        assert "Radiant" in c.finish
    assert report.applied_filters["finish"] == "Radiant"


def test_matching_engine_combined_filtering(sample_catalogue):
    """Verify combining both brand and finish filters."""
    engine = FoundationMatchingEngine()
    report = engine.match(
        skin_hex="#D8A47F",
        skin_undertone="Warm",
        catalogue=sample_catalogue,
        brand_filter="Brand A",
        finish_filter="Matte",
        top_n=3,
    )
    assert len(report.candidates) >= 1
    for c in report.candidates:
        assert c.brand == "Brand A"
        assert "Matte" in c.finish


def test_matching_engine_filter_empty_results(sample_catalogue):
    """Verify empty state handling when no candidates match the filter combination."""
    engine = FoundationMatchingEngine()
    report = engine.match(
        skin_hex="#D8A47F",
        skin_undertone="Warm",
        catalogue=sample_catalogue,
        brand_filter="Brand B",
        finish_filter="Matte",  # Brand B only has "Dewy Luminous"
        top_n=3,
    )
    assert len(report.candidates) == 0
    assert report.total_shades_evaluated == 0
    assert report.scoring_formula_metadata["status"] == "empty_filtered_results"
    assert "Brand B" in report.scoring_formula_metadata["message"]
    # Available filters should still be returned so user can reset or choose another
    assert len(report.available_filters["brands"]) > 1
    assert len(report.available_filters["finishes"]) > 1


def test_api_match_shades_with_brand_and_finish_filters(client):
    """Verify POST /api/v1/match-shades with brand and finish payloads."""
    payload = {
        "skin_hex": "#D8A47F",
        "skin_undertone": "Warm",
        "brand": "Velvet Radiance",
        "finish": "Radiant",
        "top_n": 3,
    }
    response = client.post("/api/v1/match-shades", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "candidates" in data
    assert "applied_filters" in data
    assert data["applied_filters"]["brand"] == "Velvet Radiance"
    assert data["applied_filters"]["finish"] == "Radiant"
    assert "available_filters" in data
    assert "All" in data["available_filters"]["brands"]

    for c in data["candidates"]:
        assert "Velvet Radiance" in c["brand"]


def test_api_catalogue_filter_options(client):
    """Verify GET /api/v1/catalogue/filter-options returns dynamic brands and finishes."""
    response = client.get("/api/v1/catalogue/filter-options")
    assert response.status_code == 200
    data = response.json()
    assert "brands" in data
    assert "finishes" in data
    assert "All" in data["brands"]
    assert "All" in data["finishes"]
    assert len(data["brands"]) >= 2
    assert len(data["finishes"]) >= 2


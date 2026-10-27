import pytest
from app.services.merchant_analytics import merchant_analytics_service, DEPTH_GROUPS, UNDERTONES
from app.models.shade import FoundationShade


def test_merchant_analytics_overview_aggregation(db_session):
    """Verify that merchant analytics aggregates total counts and stock states."""
    report = merchant_analytics_service.analyze_catalogue(db_session)

    assert report.total_shades >= 15
    assert report.total_brands >= 1
    assert report.total_products >= 1

    # Verify stock status counts sum to total shades
    total_stock = report.in_stock_count + report.low_stock_count + report.out_of_stock_count
    assert total_stock == report.total_shades

    # Verify depth distribution
    assert len(report.depth_distribution) == len(DEPTH_GROUPS)
    depth_sum = sum(d["count"] for d in report.depth_distribution)
    assert depth_sum == report.total_shades

    # Verify undertone distribution
    assert len(report.undertone_distribution) == len(UNDERTONES)
    undertone_sum = sum(u["count"] for u in report.undertone_distribution)
    assert undertone_sum == report.total_shades


def test_merchant_coverage_matrix_dimensions(db_session):
    """Verify that the 2D coverage matrix has exactly 20 cells (5 Depth x 4 Undertone)."""
    report = merchant_analytics_service.analyze_catalogue(db_session)
    assert len(report.coverage_matrix) == 20

    # Ensure all combinations exist
    combinations = {(c.depth_group, c.undertone) for c in report.coverage_matrix}
    for d in DEPTH_GROUPS:
        for u in UNDERTONES:
            assert (d, u) in combinations


def test_merchant_gap_identification(db_session):
    """
    Verify that the analytics service identifies critical gaps (0 shades)
    and inventory stock alerts (out-of-stock).
    """
    report = merchant_analytics_service.analyze_catalogue(db_session)
    assert len(report.catalogue_gaps) > 0

    # Olive has only 1 shade in seed (Medium Olive), so Fair+Olive, Light+Olive, etc. must be critical gaps
    critical_gaps = [g for g in report.catalogue_gaps if g.severity == "critical"]
    assert len(critical_gaps) >= 3  # Fair Olive, Light Olive, Deep Olive, Tan Olive
    assert any(g.depth_group == "Fair" and g.undertone == "Olive" for g in critical_gaps)

    # 520 Mahogany Deep Warm is seeded out_of_stock, so Deep Warm must be high/moderate risk
    deep_warm_gap = next((g for g in report.catalogue_gaps if g.depth_group == "Deep" and g.undertone == "Warm"), None)
    assert deep_warm_gap is not None
    assert "out of stock" in deep_warm_gap.explanation.lower()


def test_merchant_analytics_filtering(db_session):
    """Verify filtering analytics by brand and product line."""
    # Filter by existing brand
    report_brand = merchant_analytics_service.analyze_catalogue(db_session, brand_filter="Lumière")
    assert report_brand.total_shades >= 15

    # Filter by non-existent brand
    report_none = merchant_analytics_service.analyze_catalogue(db_session, brand_filter="NonExistentBrand999")
    assert report_none.total_shades == 0
    assert report_none.coverage_score == 0.0
    assert report_none.critical_gaps_count == 20


def test_merchant_csv_export_format(db_session):
    """Verify CSV export contains all standard sections and headers."""
    csv_text = merchant_analytics_service.generate_csv_export(db_session)
    assert "SHADEPROOF FOUNDATION CATALOGUE COVERAGE REPORT" in csv_text
    assert "DEPTH GROUP DISTRIBUTION" in csv_text
    assert "UNDERTONE DISTRIBUTION" in csv_text
    assert "2D COVERAGE MATRIX (DEPTH x UNDERTONE)" in csv_text
    assert "IDENTIFIED CATALOGUE GAPS & RECOMMENDATIONS" in csv_text
    assert "COMPLETE SHADE CATALOGUE" in csv_text
    assert "LB-100C" in csv_text
    assert "LB-320W" in csv_text


def test_api_analytics_overview_endpoint(client):
    """Verify GET /api/v1/analytics/overview returns the expected analytics JSON."""
    response = client.get("/api/v1/analytics/overview")
    assert response.status_code == 200
    data = response.json()

    assert "total_shades" in data
    assert data["total_shades"] >= 15
    assert "coverage_score" in data
    assert "coverage_matrix" in data
    assert len(data["coverage_matrix"]) == 20
    assert "catalogue_gaps" in data
    assert "data_disclaimer" in data


def test_api_analytics_export_csv_endpoint(client):
    """Verify GET /api/v1/analytics/export-csv returns a downloadable CSV attachment."""
    response = client.get("/api/v1/analytics/export-csv")
    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]
    assert "attachment" in response.headers.get("content-disposition", "")
    assert "shadeproof_catalogue_coverage.csv" in response.headers.get("content-disposition", "")
    assert "SHADEPROOF FOUNDATION CATALOGUE COVERAGE REPORT" in response.text

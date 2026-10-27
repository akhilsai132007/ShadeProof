import pytest
from app.models.shade import FoundationShade
from app.seed.seed_data import hex_to_lab


def test_health_check_endpoint(client):
    """Verify that the /health endpoint responds with 200 and healthy status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["app"] == "ShadeProof API"
    assert data["database"] == "connected"


def test_system_info_endpoint(client):
    """Verify system info endpoint returns configuration flags."""
    response = client.get("/api/v1/system-info")
    assert response.status_code == 200
    data = response.json()
    assert "app_name" in data
    assert "youcam_configured" in data
    assert "youcam_base_url" in data


def test_seed_database_populated(db_session):
    """Verify that the seed dataset correctly populates the database."""
    count = db_session.query(FoundationShade).count()
    assert count >= 15, f"Expected at least 15 seed shades, found {count}"

    # Verify depth groups coverage
    depth_groups = {s.depth_group for s in db_session.query(FoundationShade).all()}
    assert {"Fair", "Light", "Medium", "Tan", "Deep"}.issubset(depth_groups)

    # Verify undertones coverage
    undertones = {s.undertone for s in db_session.query(FoundationShade).all()}
    assert {"Warm", "Cool", "Neutral"}.issubset(undertones)


def test_list_shades_endpoint(client):
    """Verify GET /api/v1/shades returns all seeded shades with proper schema."""
    response = client.get("/api/v1/shades")
    assert response.status_code == 200
    shades = response.json()
    assert len(shades) >= 15

    first = shades[0]
    assert "id" in first
    assert "shade_name" in first
    assert "shade_code" in first
    assert "hex_color" in first
    assert "lab_l" in first
    assert "lab_a" in first
    assert "lab_b" in first
    assert "is_demo_data" in first
    assert first["is_demo_data"] is True


def test_list_shades_filtering(client):
    """Verify filtering shades by depth group and undertone."""
    # Filter by depth_group
    res_fair = client.get("/api/v1/shades?depth_group=Fair")
    assert res_fair.status_code == 200
    for s in res_fair.json():
        assert s["depth_group"].lower() == "fair"

    # Filter by undertone
    res_warm = client.get("/api/v1/shades?undertone=Warm")
    assert res_warm.status_code == 200
    for s in res_warm.json():
        assert s["undertone"].lower() == "warm"


def test_get_shade_by_id(client):
    """Verify GET /api/v1/shades/{id} retrieves existing shade and 404 for invalid."""
    # First get list
    res_list = client.get("/api/v1/shades")
    first_id = res_list.json()[0]["id"]

    res_single = client.get(f"/api/v1/shades/{first_id}")
    assert res_single.status_code == 200
    assert res_single.json()["id"] == first_id

    # Test 404
    res_404 = client.get("/api/v1/shades/99999")
    assert res_404.status_code == 404


def test_hex_to_lab_conversion():
    """Verify mathematical accuracy and bounds of hex_to_lab conversion."""
    # Pure white #FFFFFF -> L should be ~100
    l_w, a_w, b_w = hex_to_lab("#FFFFFF")
    assert 99.0 <= l_w <= 100.0

    # Pure black #000000 -> L should be ~0
    l_b, a_b, b_b = hex_to_lab("#000000")
    assert 0.0 <= l_b <= 1.0

    # Typical skin tone #D8A47F
    l_s, a_s, b_s = hex_to_lab("#D8A47F")
    assert 60.0 <= l_s <= 80.0
    assert 5.0 <= a_s <= 25.0
    assert 15.0 <= b_s <= 35.0

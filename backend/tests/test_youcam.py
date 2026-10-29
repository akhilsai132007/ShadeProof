import io
import pytest
import httpx
from unittest.mock import AsyncMock, patch

from app.services.youcam_client import YouCamClient
from app.services.youcam_service import YouCamService, compute_ita, ita_to_fitzpatrick
from app.services.youcam_schemas import (
    YouCamAuthError,
    YouCamRateLimitError,
    YouCamInvalidImageError,
    YouCamTimeoutError,
    YouCamConfigError,
)


# -----------------------------------------------------------------------------
# 1. YouCamClient Unit Tests (HTTP Mocking)
# -----------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_client_missing_key_raises_config_error():
    client = YouCamClient(api_key="")
    with pytest.raises(YouCamConfigError):
        await client.upload_file(b"dummy_bytes")


@pytest.mark.asyncio
async def test_client_file_upload_workflow_success():
    client = YouCamClient(api_key="mock_test_key_123")

    fake_file_resp = httpx.Response(
        status_code=200,
        json={
            "status": 200,
            "data": {
                "files": [
                    {
                        "file_id": "test_s3_file_id_abc999",
                        "requests": [
                            {"method": "PUT", "url": "https://s3.mock.amazon.com/upload-target"}
                        ],
                    }
                ]
            },
        },
    )
    fake_put_resp = httpx.Response(status_code=200)

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post, \
         patch("httpx.AsyncClient.put", new_callable=AsyncMock) as mock_put:
        mock_post.return_value = fake_file_resp
        mock_put.return_value = fake_put_resp

        file_id = await client.upload_file(b"fake_image_bytes", filename="test.jpg")
        assert file_id == "test_s3_file_id_abc999"
        assert mock_post.called
        assert mock_put.called


@pytest.mark.asyncio
async def test_client_handles_401_auth_error():
    client = YouCamClient(api_key="invalid_bad_key")
    error_resp = httpx.Response(status_code=401, json={"message": "Unauthorized access"})

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = error_resp
        with pytest.raises(YouCamAuthError):
            await client.upload_file(b"bytes")


@pytest.mark.asyncio
async def test_client_handles_429_rate_limit_error():
    client = YouCamClient(api_key="mock_key")
    error_resp = httpx.Response(status_code=429, json={"message": "Too Many Requests"})

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = error_resp
        with pytest.raises(YouCamRateLimitError):
            await client.upload_file(b"bytes")


@pytest.mark.asyncio
async def test_client_skin_tone_task_polling_success():
    client = YouCamClient(api_key="mock_key")

    post_resp = httpx.Response(status_code=200, json={"code": 200, "data": {"task_id": "task_skin_123"}})
    poll_running = httpx.Response(status_code=200, json={"code": 200, "data": {"status": "running"}})
    poll_success = httpx.Response(
        status_code=200,
        json={
            "code": 200,
            "data": {
                "status": "succeeded",
                "result": {
                    "skin_tone": {
                        "level": "medium",
                        "undertone": "warm",
                        "hex": "#D8A47F",
                        "cie_lab": {"l": 70.8, "a": 14.2, "b": 26.6},
                    },
                    "metadata": {"face_detected": True, "confidence": 0.98},
                },
            },
        },
    )

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post, \
         patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_post.return_value = post_resp
        mock_get.side_effect = [poll_running, poll_success]

        task_id = await client.create_skin_tone_task("file_123")
        assert task_id == "task_skin_123"

        result = await client.poll_skin_tone_task(task_id, max_attempts=3, poll_interval=0.01)
        assert result["skin_tone"]["hex"] == "#D8A47F"
        assert result["skin_tone"]["undertone"] == "warm"


@pytest.mark.asyncio
async def test_client_vto_task_polling_success():
    client = YouCamClient(api_key="mock_key")

    post_resp = httpx.Response(status_code=200, json={"code": 200, "data": {"task_id": "task_vto_789"}})
    poll_success = httpx.Response(
        status_code=200,
        json={
            "code": 200,
            "data": {
                "status": "succeeded",
                "result_file_url": "https://yce-api-01.makeupar.com/result/tryon_shade_320w.jpg",
            },
        },
    )

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post, \
         patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_post.return_value = post_resp
        mock_get.return_value = poll_success

        task_id = await client.create_makeup_vto_task("file_123", hex_color="#D8A47F")
        assert task_id == "task_vto_789"

        url = await client.poll_makeup_vto_task(task_id, max_attempts=2, poll_interval=0.01)
        assert "tryon_shade_320w.jpg" in url


# -----------------------------------------------------------------------------
# 2. YouCamService Normalization & Mathematical Tests
# -----------------------------------------------------------------------------

def test_compute_ita_and_fitzpatrick():
    """Verify Individual Typology Angle (ITA) and Fitzpatrick phototype mapping."""
    # Light skin: L=85, b=15 -> ITA = atan((85-50)/15) * 180/pi = atan(2.333) = ~66.8 deg -> Type I
    ita_light = compute_ita(85.0, 15.0)
    assert ita_light > 55.0
    assert ita_to_fitzpatrick(ita_light) == "Type I"

    # Medium skin: L=70, b=26 -> ITA = atan(20/26) = ~37.5 deg -> Type III
    ita_med = compute_ita(70.0, 26.0)
    assert 28.0 < ita_med <= 41.0
    assert ita_to_fitzpatrick(ita_med) == "Type III"

    # Deep skin: L=30, b=15 -> ITA = atan(-20/15) = ~-53.1 deg -> Type VI
    ita_deep = compute_ita(30.0, 15.0)
    assert ita_deep <= -30.0
    assert ita_to_fitzpatrick(ita_deep) == "Type VI"


def test_service_normalization_with_complete_cielab():
    service = YouCamService()
    raw = {
        "skin_tone": {
            "level": "medium",
            "undertone": "warm",
            "hex": "#D8A47F",
            "cie_lab": {"l": 70.82, "a": 14.18, "b": 26.56},
        },
        "metadata": {"face_detected": True, "confidence": 0.98},
    }

    norm = service.normalize_skin_analysis(raw, src_file_id="test_file_id")
    assert norm.src_file_id == "test_file_id"
    assert norm.skin_tone_level == "Medium"
    assert norm.undertone == "Warm"
    assert norm.hex_color == "#D8A47F"
    assert norm.lab_l == 70.82
    assert norm.lab_a == 14.18
    assert norm.lab_b == 26.56
    assert norm.fitzpatrick_type == "Type III"
    assert norm.confidence == 0.98


def test_service_normalization_fallback_when_cielab_missing():
    """Verifies that if cie_lab is omitted in YouCam response, service calculates it from hex."""
    service = YouCamService()
    raw = {
        "skin_tone": {
            "hex": "#D8A47F",
            # cie_lab is intentionally omitted
        },
        "metadata": {"face_detected": True},
    }

    norm = service.normalize_skin_analysis(raw, src_file_id="fallback_file_id")
    assert norm.src_file_id == "fallback_file_id"
    assert 60.0 <= norm.lab_l <= 80.0
    assert norm.lab_a > 0.0
    assert norm.lab_b > 0.0
    assert norm.hex_color == "#D8A47F"


def test_service_normalization_rejects_missing_face():
    service = YouCamService()
    raw = {
        "metadata": {"face_detected": False},
    }
    with pytest.raises(YouCamInvalidImageError):
        service.normalize_skin_analysis(raw, src_file_id="no_face")


# -----------------------------------------------------------------------------
# 3. FastAPI Endpoint Integration Tests
# -----------------------------------------------------------------------------

def test_api_analyze_skin_sandbox(client):
    """Verify POST /api/v1/analyze-skin succeeds in sandbox mode."""
    dummy_image = io.BytesIO(b"fake_jpeg_image_content_header_12345")
    response = client.post(
        "/api/v1/analyze-skin",
        files={"file": ("selfie.jpg", dummy_image, "image/jpeg")},
        data={"force_sandbox": "true"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "src_file_id" in data
    assert data["skin_tone_level"] == "Medium"
    assert data["undertone"] == "Warm"
    assert data["hex_color"] == "#D8A47F"
    assert data["is_sandbox_mode"] is True
    assert "ita_angle" in data
    assert "fitzpatrick_type" in data


def test_api_analyze_skin_rejects_bad_file_type(client):
    """Verify rejection of invalid file types."""
    dummy_text = io.BytesIO(b"not an image file")
    response = client.post(
        "/api/v1/analyze-skin",
        files={"file": ("document.txt", dummy_text, "text/plain")},
    )
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"]


def test_api_virtual_try_on_sandbox(client):
    """Verify POST /api/v1/virtual-try-on succeeds in sandbox mode."""
    payload = {
        "src_file_id": "test_staged_file_id_123",
        "shade_code": "LB-320W",
        "hex_color": "#D8A47F",
        "color_intensity": 50,
        "coverage_intensity": 50,
        "glow_intensity": 10,
        "force_sandbox": True,
    }
    response = client.post("/api/v1/virtual-try-on", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["task_id"].startswith("sandbox_task_vto_")
    assert data["shade_code"] == "LB-320W"
    assert data["hex_color"] == "#D8A47F"
    assert "result_image_url" in data
    assert data["is_sandbox_mode"] is True


def test_api_virtual_try_on_validates_hex(client):
    """Verify rejection of invalid hex formats."""
    invalid_payload = {
        "src_file_id": "test_id",
        "shade_code": "LB-320W",
        "hex_color": "not_a_hex",
    }
    response = client.post("/api/v1/virtual-try-on", json=invalid_payload)
    assert response.status_code == 422  # Pydantic validation error


def test_api_analyze_skin_sandbox_fair_and_deep_fixtures(client):
    """Verify demographic-adaptive fixtures for Fair Cool and Deep Warm."""
    # Test Fair Cool portrait fixture
    fair_image = io.BytesIO(b"fake_fair_cool_portrait")
    res_fair = client.post(
        "/api/v1/analyze-skin",
        files={"file": ("fair-cool.jpg", fair_image, "image/jpeg")},
        data={"force_sandbox": "true"},
    )
    assert res_fair.status_code == 200
    data_fair = res_fair.json()
    assert data_fair["skin_tone_level"] == "Fair"
    assert data_fair["undertone"] == "Cool"
    assert data_fair["hex_color"] == "#F4D7C7"

    # Test Deep Warm portrait fixture
    deep_image = io.BytesIO(b"fake_deep_warm_portrait")
    res_deep = client.post(
        "/api/v1/analyze-skin",
        files={"file": ("deep-warm.jpg", deep_image, "image/jpeg")},
        data={"force_sandbox": "true"},
    )
    assert res_deep.status_code == 200
    data_deep = res_deep.json()
    assert data_deep["skin_tone_level"] == "Deep"
    assert data_deep["undertone"] == "Warm"
    assert data_deep["hex_color"] == "#5C3826"


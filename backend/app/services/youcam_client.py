import asyncio
import logging
from typing import Any, Dict, Optional
import httpx

from app.services.youcam_schemas import (
    YouCamError,
    YouCamAuthError,
    YouCamRateLimitError,
    YouCamInvalidImageError,
    YouCamTimeoutError,
    YouCamConfigError,
)

logger = logging.getLogger("shadeproof.youcam_client")


class YouCamClient:
    """
    Low-level asynchronous HTTP client for the Perfect Corp YouCam S2S v2.0 REST API.
    Handles authentication, 2-step S3 file registration, task creation, and async status polling.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: str = "https://yce-api-01.makeupar.com",
        timeout: float = 30.0,
    ):
        self.api_key = api_key or ""
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key.strip())

    def _headers(self) -> Dict[str, str]:
        if not self.is_configured:
            raise YouCamConfigError("YouCam API key is not configured in .env")
        return {
            "Authorization": f"Bearer {self.api_key.strip()}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    def _handle_http_status(self, response: httpx.Response) -> None:
        """Translates HTTP error status codes into domain-specific exceptions."""
        if response.status_code == 200 or response.status_code == 201:
            return

        status = response.status_code
        try:
            body = response.json()
        except Exception:
            body = response.text

        logger.error(f"YouCam API HTTP {status} error: {body}")

        if status in (401, 403):
            raise YouCamAuthError(
                f"Authentication failed (HTTP {status}). Verify your YouCam API key.",
                details=body
            )
        elif status == 429:
            raise YouCamRateLimitError(
                "YouCam API rate limit reached (250 req/300s). Please wait before retrying.",
                details=body
            )
        elif status == 400:
            raise YouCamInvalidImageError(
                f"YouCam rejected request (HTTP 400): {body}",
                details=body
            )
        else:
            raise YouCamError(
                f"YouCam API error (HTTP {status}): {body}",
                status_code=status,
                details=body
            )

    async def check_connectivity(self, timeout: float = 3.0) -> Dict[str, Any]:
        """
        Safely probes YouCam API gateway reachability and credential validity.
        Never exposes the API key or secret in results or error messages.
        """
        import time

        if not self.is_configured:
            return {
                "status": "not_configured",
                "checked": True,
                "http_status": None,
                "latency_ms": None,
                "message": "No YOUCAM_API_KEY configured in backend/.env. Operating in Sandbox Demo mode.",
            }

        start = time.perf_counter()
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                # Probe the documented file endpoint with empty payload to test authentication
                resp = await client.post(
                    f"{self.base_url}/s2s/v2.0/file",
                    headers={
                        "Authorization": f"Bearer {self.api_key.strip()}",
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                    },
                    json={},
                )
                elapsed_ms = round((time.perf_counter() - start) * 1000, 1)

                if resp.status_code in (401, 403):
                    return {
                        "status": "auth_failed",
                        "checked": True,
                        "http_status": resp.status_code,
                        "latency_ms": elapsed_ms,
                        "message": f"YouCam API reached, but authentication failed (HTTP {resp.status_code}). Verify YOUCAM_API_KEY.",
                    }
                elif resp.status_code == 429:
                    return {
                        "status": "rate_limited",
                        "checked": True,
                        "http_status": resp.status_code,
                        "latency_ms": elapsed_ms,
                        "message": "YouCam API rate limit reached (250 req/300s). Key is valid but temporarily throttled.",
                    }
                else:
                    # 200/201 or 400 (validation error because json was empty) means gateway is reachable and authenticated
                    return {
                        "status": "connected",
                        "checked": True,
                        "http_status": resp.status_code,
                        "latency_ms": elapsed_ms,
                        "message": f"Connected and authenticated with YouCam API gateway ({self.base_url}) in {elapsed_ms}ms.",
                    }
        except httpx.TimeoutException:
            return {
                "status": "unreachable",
                "checked": True,
                "http_status": None,
                "latency_ms": None,
                "message": f"Connection timed out after {timeout}s while connecting to {self.base_url}.",
            }
        except httpx.RequestError as exc:
            return {
                "status": "unreachable",
                "checked": True,
                "http_status": None,
                "latency_ms": None,
                "message": f"Network error connecting to {self.base_url}: {type(exc).__name__}",
            }
        except Exception as exc:
            return {
                "status": "unreachable",
                "checked": True,
                "http_status": None,
                "latency_ms": None,
                "message": f"Unexpected error checking connectivity: {type(exc).__name__}",
            }

    # -------------------------------------------------------------------------
    # 1. File Upload Workflow (2-step S3 Presigned Handshake)
    # -------------------------------------------------------------------------

    async def upload_file(
        self,
        image_bytes: bytes,
        filename: str = "selfie.jpg",
        content_type: str = "image/jpeg",
    ) -> str:
        """
        Executes the documented 2-step YouCam S2S v2.0 file upload:
        Step 1: POST /s2s/v2.0/file to register file metadata and receive presigned S3 upload URL.
        Step 2: HTTP PUT raw image bytes directly to the presigned S3 URL.
        Returns the unique `file_id`.
        """
        if not self.is_configured:
            raise YouCamConfigError()

        if len(image_bytes) == 0:
            raise YouCamInvalidImageError("Cannot upload empty image payload")
        if len(image_bytes) > 10 * 1024 * 1024:
            raise YouCamInvalidImageError("Image file size exceeds maximum 10 MB limit")

        reg_url = f"{self.base_url}/s2s/v2.0/file"
        payload = {
            "files": [
                {
                    "content_type": content_type,
                    "file_name": filename,
                    "file_size": len(image_bytes),
                }
            ]
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            # Step 1: Register metadata
            resp = await client.post(reg_url, headers=self._headers(), json=payload)
            self._handle_http_status(resp)
            data = resp.json()

            # Parse files array
            files = data.get("data", {}).get("files", [])
            if not files:
                raise YouCamError("YouCam file registration response missing 'files' array", details=data)

            file_info = files[0]
            file_id = file_info.get("file_id")
            requests_list = file_info.get("requests", [])

            if not file_id or not requests_list:
                raise YouCamError("Invalid YouCam file registration payload (missing file_id or requests)", details=data)

            upload_target = requests_list[0]
            put_url = upload_target.get("url")

            if not put_url:
                raise YouCamError("Missing presigned PUT URL in YouCam file response", details=data)

            # Step 2: Upload raw binary to S3
            put_resp = await client.put(
                put_url,
                content=image_bytes,
                headers={"Content-Type": content_type},
                timeout=self.timeout,
            )

            if put_resp.status_code not in (200, 201, 204):
                raise YouCamError(
                    f"Failed to upload binary image to presigned S3 URL (HTTP {put_resp.status_code})",
                    status_code=put_resp.status_code,
                    details=put_resp.text,
                )

            logger.info(f"Successfully uploaded file to YouCam S3. file_id: {file_id}")
            return file_id

    # -------------------------------------------------------------------------
    # 2. Skin Tone Analysis Task Workflow
    # -------------------------------------------------------------------------

    async def create_skin_tone_task(
        self,
        src_file_id: str,
        face_angle_strictness_level: str = "high",
    ) -> str:
        """
        Initiates an asynchronous skin tone analysis task via POST /s2s/v2.0/task/skin-tone-analysis.
        Returns the unique `task_id`.
        """
        url = f"{self.base_url}/s2s/v2.0/task/skin-tone-analysis"
        payload = {
            "src_file_id": src_file_id,
            "face_angle_strictness_level": face_angle_strictness_level,
            "format": "json",
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(url, headers=self._headers(), json=payload)
            self._handle_http_status(resp)
            data = resp.json()

            task_id = data.get("data", {}).get("task_id") or data.get("task_id")
            if not task_id:
                raise YouCamError("YouCam response missing 'task_id'", details=data)

            logger.info(f"Created skin tone analysis task: {task_id}")
            return task_id

    async def poll_skin_tone_task(
        self,
        task_id: str,
        max_attempts: int = 16,
        poll_interval: float = 1.5,
    ) -> Dict[str, Any]:
        """
        Polls GET /s2s/v2.0/task/skin-tone-analysis until completion.
        Returns the parsed result dictionary.
        """
        url = f"{self.base_url}/s2s/v2.0/task/skin-tone-analysis"
        params = {"task_id": task_id}

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            for attempt in range(1, max_attempts + 1):
                resp = await client.get(url, headers=self._headers(), params=params)
                self._handle_http_status(resp)
                data = resp.json()

                inner_data = data.get("data", {})
                status = (inner_data.get("status") or inner_data.get("task_status") or "").lower()

                if status in ("succeeded", "success"):
                    logger.info(f"Skin tone analysis task {task_id} succeeded on attempt {attempt}")
                    result = inner_data.get("result") or inner_data.get("results") or inner_data
                    return result
                elif status in ("error", "failed"):
                    error_msg = inner_data.get("error_message") or data.get("message") or "Task processing error"
                    raise YouCamError(f"YouCam skin tone task failed: {error_msg}", details=data)
                elif status == "running" or status == "":
                    await asyncio.sleep(poll_interval)
                else:
                    logger.warning(f"Unexpected task status: '{status}' on attempt {attempt}")
                    await asyncio.sleep(poll_interval)

            raise YouCamTimeoutError(
                f"Skin tone analysis task {task_id} timed out after {max_attempts * poll_interval}s"
            )

    # -------------------------------------------------------------------------
    # 3. Foundation Makeup Virtual Try-On Task Workflow
    # -------------------------------------------------------------------------

    async def create_makeup_vto_task(
        self,
        src_file_id: str,
        hex_color: str,
        color_intensity: int = 50,
        coverage_intensity: int = 50,
        glow_intensity: int = 0,
    ) -> str:
        """
        Initiates an asynchronous foundation virtual try-on task via POST /s2s/v2.0/task/makeup-vto.
        Returns the unique `task_id`.
        """
        url = f"{self.base_url}/s2s/v2.0/task/makeup-vto"
        clean_hex = hex_color.upper() if hex_color.startswith("#") else f"#{hex_color.upper()}"

        payload = {
            "src_file_id": src_file_id,
            "version": "1.0",
            "effects": [
                {
                    "category": "foundation",
                    "palettes": [
                        {
                            "color": clean_hex,
                            "colorIntensity": max(0, min(100, color_intensity)),
                            "coverageIntensity": max(0, min(100, coverage_intensity)),
                            "glowIntensity": max(0, min(100, glow_intensity)),
                        }
                    ],
                }
            ],
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(url, headers=self._headers(), json=payload)
            self._handle_http_status(resp)
            data = resp.json()

            task_id = data.get("data", {}).get("task_id") or data.get("task_id")
            if not task_id:
                raise YouCamError("YouCam response missing 'task_id'", details=data)

            logger.info(f"Created makeup VTO task: {task_id} for shade {clean_hex}")
            return task_id

    async def poll_makeup_vto_task(
        self,
        task_id: str,
        max_attempts: int = 16,
        poll_interval: float = 1.5,
    ) -> str:
        """
        Polls GET /s2s/v2.0/task/makeup-vto until completion.
        Returns the rendered try-on image URL (`result_file_url`).
        """
        url = f"{self.base_url}/s2s/v2.0/task/makeup-vto"
        params = {"task_id": task_id}

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            for attempt in range(1, max_attempts + 1):
                resp = await client.get(url, headers=self._headers(), params=params)
                self._handle_http_status(resp)
                data = resp.json()

                inner_data = data.get("data", {})
                status = (inner_data.get("status") or inner_data.get("task_status") or "").lower()

                if status in ("succeeded", "success"):
                    # Find image URL defensively across known schema locations
                    result_url = (
                        inner_data.get("result_file_url")
                        or inner_data.get("result", {}).get("url")
                        or inner_data.get("result", {}).get("file_url")
                        or inner_data.get("results", {}).get("url")
                    )
                    if not result_url:
                        raise YouCamError("YouCam completed VTO task but returned no image URL", details=data)

                    logger.info(f"Makeup VTO task {task_id} succeeded on attempt {attempt}")
                    return result_url
                elif status in ("error", "failed"):
                    error_msg = inner_data.get("error_message") or data.get("message") or "Task processing error"
                    raise YouCamError(f"YouCam makeup VTO task failed: {error_msg}", details=data)
                elif status == "running" or status == "":
                    await asyncio.sleep(poll_interval)
                else:
                    await asyncio.sleep(poll_interval)

            raise YouCamTimeoutError(
                f"Makeup VTO task {task_id} timed out after {max_attempts * poll_interval}s"
            )

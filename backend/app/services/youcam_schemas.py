from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


# -----------------------------------------------------------------------------
# Domain Exceptions
# -----------------------------------------------------------------------------

class YouCamError(Exception):
    """Base exception for all YouCam integration errors."""
    def __init__(self, message: str, status_code: int = 500, details: Optional[Any] = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details


class YouCamAuthError(YouCamError):
    """Raised when authentication fails (401 or 403)."""
    def __init__(self, message: str = "Invalid or missing YouCam API Key", details: Optional[Any] = None):
        super().__init__(message, status_code=401, details=details)


class YouCamRateLimitError(YouCamError):
    """Raised when hitting the YouCam rate limit (429 Too Many Requests)."""
    def __init__(self, message: str = "YouCam rate limit exceeded (250 req/300s)", details: Optional[Any] = None):
        super().__init__(message, status_code=429, details=details)


class YouCamInvalidImageError(YouCamError):
    """Raised when the uploaded image is invalid, corrupt, or has no detectable face."""
    def __init__(self, message: str = "Image rejected or no human face detected", details: Optional[Any] = None):
        super().__init__(message, status_code=400, details=details)


class YouCamTimeoutError(YouCamError):
    """Raised when an asynchronous task does not complete within the timeout."""
    def __init__(self, message: str = "YouCam asynchronous task timed out", details: Optional[Any] = None):
        super().__init__(message, status_code=504, details=details)


class YouCamConfigError(YouCamError):
    """Raised when YouCam configuration is invalid or API key is unconfigured."""
    def __init__(self, message: str = "YouCam API key is not configured in .env", details: Optional[Any] = None):
        super().__init__(message, status_code=503, details=details)


# -----------------------------------------------------------------------------
# Low-Level YouCam S2S v2.0 Wire Schemas
# -----------------------------------------------------------------------------

class FileItemMetadata(BaseModel):
    content_type: str = Field(..., json_schema_extra={"example": "image/jpeg"})
    file_name: str = Field(..., json_schema_extra={"example": "selfie.jpg"})
    file_size: int = Field(..., json_schema_extra={"example": 452100})


class FileUploadRequest(BaseModel):
    files: List[FileItemMetadata]


class PresignedRequest(BaseModel):
    method: str = "PUT"
    url: str


class FileItemResponse(BaseModel):
    content_type: Optional[str] = None
    file_name: Optional[str] = None
    file_id: str
    requests: Optional[List[PresignedRequest]] = None


class FileUploadResponse(BaseModel):
    status: Optional[int] = None
    code: Optional[int] = None
    data: Optional[Dict[str, Any]] = None


class SkinToneTaskRequest(BaseModel):
    src_file_id: str
    face_angle_strictness_level: str = "high"
    format: str = "json"


class MakeupPalette(BaseModel):
    color: str = Field(..., pattern=r"^#[0-9A-Fa-f]{6}$")
    colorIntensity: int = Field(50, ge=0, le=100)
    coverageIntensity: int = Field(50, ge=0, le=100)
    glowIntensity: int = Field(0, ge=0, le=100)


class MakeupEffect(BaseModel):
    category: str = "foundation"
    palettes: List[MakeupPalette]


class MakeupVtoTaskRequest(BaseModel):
    src_file_id: str
    version: str = "1.0"
    effects: List[MakeupEffect]


# -----------------------------------------------------------------------------
# High-Level Normalized Internal Domain Models
# -----------------------------------------------------------------------------

class NormalizedSkinAnalysis(BaseModel):
    """
    Standardized skin tone analysis result used throughout the ShadeProof system.
    Safely normalized regardless of minor variances in YouCam response payloads.
    """
    src_file_id: str
    face_detected: bool = True
    skin_tone_level: str  # fair, light, medium, tan, deep
    undertone: str        # warm, cool, neutral, olive
    hex_color: str        # #RRGGBB
    lab_l: float          # Lightness [0, 100]
    lab_a: float          # Green to Red [-128, 127]
    lab_b: float          # Blue to Yellow [-128, 127]
    ita_angle: float      # Individual Typology Angle in degrees
    fitzpatrick_type: str # Type I to Type VI
    confidence: float     # 0.0 to 1.0
    facial_colors: Optional[Dict[str, Any]] = None
    is_sandbox_mode: bool = False
    raw_response: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)


class NormalizedVtoResult(BaseModel):
    """
    Standardized foundation try-on result returned to client.
    """
    task_id: str
    src_file_id: str
    shade_code: str
    hex_color: str
    result_image_url: str
    status: str = "succeeded"
    is_sandbox_mode: bool = False

    model_config = ConfigDict(from_attributes=True)

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class DiagnosticsConnectivity(BaseModel):
    status: str = Field(..., description="Connection status: connected, auth_failed, unreachable, not_configured, ready, or rate_limited")
    checked: bool = Field(..., description="Whether a live network probe was executed")
    http_status: Optional[int] = Field(None, description="HTTP status returned by YouCam API probe")
    latency_ms: Optional[float] = Field(None, description="Round-trip response time in milliseconds")
    message: str = Field(..., description="Safe human-readable connection description")


class DiagnosticsEndpoint(BaseModel):
    name: str = Field(..., description="Logical endpoint name")
    path: str = Field(..., description="Official Perfect Corp API path")
    method: str = Field(..., description="HTTP Method")
    description: str = Field(..., description="Endpoint purpose")


class DiagnosticsSandboxInfo(BaseModel):
    title: str
    explanation: str
    guarantees: List[str]


class DiagnosticsSetupGuide(BaseModel):
    env_variable: str
    target_file: str
    instructions: List[str]
    security_guarantee: str


class DiagnosticsResponse(BaseModel):
    mode: str = Field(..., description="Current execution mode: 'live' or 'sandbox'")
    mode_label: str = Field(..., description="Human-friendly label: 'Live YouCam API' or 'Sandbox Demo Mode'")
    has_api_key: bool = Field(..., description="Whether a YouCam API key is configured on the backend")
    base_url: str = Field(..., description="YouCam API base URL")
    connectivity: DiagnosticsConnectivity
    supported_endpoints: List[DiagnosticsEndpoint]
    sandbox_info: DiagnosticsSandboxInfo
    setup_guide: DiagnosticsSetupGuide
    timestamp: str = Field(..., description="ISO 8601 server timestamp")

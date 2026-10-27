from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, Response, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.shade import FoundationShade
from app.schemas.shade import FoundationShadeResponse
from app.config import settings
from app.services.youcam_service import youcam_service
from app.services.youcam_schemas import (
    NormalizedSkinAnalysis,
    NormalizedVtoResult,
    YouCamError,
    YouCamAuthError,
    YouCamRateLimitError,
    YouCamInvalidImageError,
    YouCamTimeoutError,
    YouCamConfigError,
)
from app.services.matching_engine import CandidateShade, matching_engine
from app.services.merchant_analytics import merchant_analytics_service

api_router = APIRouter()


# -----------------------------------------------------------------------------
# Request Schemas
# -----------------------------------------------------------------------------

class VirtualTryOnRequest(BaseModel):
    src_file_id: str = Field(..., description="YouCam file_id obtained from skin analysis")
    shade_code: str = Field(..., description="Unique foundation shade identifier (e.g., LB-320W)")
    hex_color: str = Field(..., pattern=r"^#[0-9A-Fa-f]{6}$", description="Hexadecimal color swatch (#RRGGBB)")
    color_intensity: int = Field(50, ge=0, le=100, description="Pigment strength percentage")
    coverage_intensity: int = Field(50, ge=0, le=100, description="Application opacity percentage")
    glow_intensity: int = Field(0, ge=0, le=100, description="Dewy/luminous finish percentage")
    force_sandbox: bool = Field(False, description="Explicitly test using offline sandbox evaluation fixtures")


class MatchShadesRequest(BaseModel):
    skin_hex: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$", description="Skin HEX color code (#RRGGBB)")
    skin_lab: Optional[List[float]] = Field(None, description="Optional CIELAB [L*, a*, b*] coordinates")
    skin_undertone: Optional[str] = Field(None, description="Analyzed skin undertone (Warm, Cool, Neutral, Olive)")
    top_n: int = Field(3, ge=1, le=10, description="Number of top candidates to rank (default 3)")


# -----------------------------------------------------------------------------
# System & Information Endpoints
# -----------------------------------------------------------------------------

@api_router.get("/system-info", tags=["System"])
def get_system_info():
    """Returns general backend configuration and status flags."""
    return {
        "app_name": settings.APP_NAME,
        "env": settings.ENV,
        "debug": settings.DEBUG,
        "youcam_configured": youcam_service.has_live_credentials,
        "youcam_base_url": settings.YOUCAM_BASE_URL,
        "evaluation_mode": "Live YouCam S2S API" if youcam_service.has_live_credentials else "Sandbox Evaluation Mode",
    }


# -----------------------------------------------------------------------------
# YouCam Skin Tone Analysis & VTO Endpoints
# -----------------------------------------------------------------------------

@api_router.post(
    "/analyze-skin",
    response_model=NormalizedSkinAnalysis,
    tags=["YouCam AI"],
    summary="Upload selfie & analyze skin tone via YouCam AI"
)
async def analyze_skin(
    file: UploadFile = File(..., description="Portrait selfie image (JPG, PNG, WebP)"),
    force_sandbox: bool = Form(False, description="Force offline sandbox evaluation fixture"),
):
    """
    Accepts a user selfie, stages the asset on YouCam storage (or sandbox fixture),
    executes skin tone analysis, and normalizes the results into CIELAB, ITA, and undertone metrics.
    """
    allowed_content_types = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
    if file.content_type not in allowed_content_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{file.content_type}'. Must be JPG, PNG, or WebP.",
        )

    # Read binary bytes
    image_bytes = await file.read()
    if len(image_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes).",
        )
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds maximum allowed 10 MB limit.",
        )

    try:
        result = await youcam_service.analyze_skin_tone(
            image_bytes=image_bytes,
            filename=file.filename or "selfie.jpg",
            content_type=file.content_type,
            force_sandbox=force_sandbox,
        )
        return result
    except YouCamAuthError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=e.message)
    except YouCamRateLimitError as e:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=e.message)
    except YouCamInvalidImageError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)
    except YouCamTimeoutError as e:
        raise HTTPException(status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail=e.message)
    except YouCamConfigError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=e.message)
    except YouCamError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Unexpected error: {str(e)}")


@api_router.post(
    "/virtual-try-on",
    response_model=NormalizedVtoResult,
    tags=["YouCam AI"],
    summary="Apply foundation virtual try-on via YouCam VTO"
)
async def virtual_try_on(body: VirtualTryOnRequest):
    """
    Applies the chosen foundation shade HEX to the staged selfie using YouCam Makeup VTO.
    Returns the rendered try-on image URL.
    """
    try:
        result = await youcam_service.try_on_foundation(
            src_file_id=body.src_file_id,
            shade_code=body.shade_code,
            hex_color=body.hex_color,
            color_intensity=body.color_intensity,
            coverage_intensity=body.coverage_intensity,
            glow_intensity=body.glow_intensity,
            force_sandbox=body.force_sandbox,
        )
        return result
    except YouCamAuthError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=e.message)
    except YouCamRateLimitError as e:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=e.message)
    except YouCamTimeoutError as e:
        raise HTTPException(status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail=e.message)
    except YouCamConfigError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=e.message)
    except YouCamError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Unexpected error: {str(e)}")


@api_router.post(
    "/match-shades",
    tags=["Matching Engine"],
    summary="Rank top candidate foundation shades using CIEDE2000"
)
def match_shades(body: MatchShadesRequest, db: Session = Depends(get_db)):
    """
    Ranks catalogue foundation shades against user skin analysis attributes using
    objective CIEDE2000 (ΔE00) perceptual color difference and undertone alignment.
    Returns the top candidates with transparent explanations.
    """
    db_shades = db.query(FoundationShade).all()

    candidates = [
        CandidateShade(
            shade_code=s.shade_code,
            shade_name=s.shade_name,
            brand=s.brand,
            product_name=s.product_name,
            hex_color=s.hex_color,
            undertone=s.undertone,
            depth_group=s.depth_group,
            lab_l=s.lab_l,
            lab_a=s.lab_a,
            lab_b=s.lab_b,
            stock_status=s.stock_status,
            price=s.price,
            currency=s.currency,
            product_url=s.product_url,
            is_demo_data=s.is_demo_data,
        )
        for s in db_shades
    ]

    target_lab = None
    if body.skin_lab and len(body.skin_lab) == 3:
        target_lab = (body.skin_lab[0], body.skin_lab[1], body.skin_lab[2])

    try:
        report = matching_engine.match(
            skin_lab=target_lab,
            skin_hex=body.skin_hex,
            skin_undertone=body.skin_undertone,
            catalogue=candidates,
            top_n=body.top_n,
        )
        return report
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Matching calculation failed: {str(e)}"
        )


# -----------------------------------------------------------------------------
# Catalogue Shade Endpoints
# -----------------------------------------------------------------------------

@api_router.get("/shades", response_model=List[FoundationShadeResponse], tags=["Shades"])
def list_shades(
    depth_group: Optional[str] = Query(None, description="Filter by depth group: Fair, Light, Medium, Tan, Deep"),
    undertone: Optional[str] = Query(None, description="Filter by undertone: Warm, Cool, Neutral, Olive"),
    db: Session = Depends(get_db)
):
    """List all available foundation shades in the catalogue with optional filtering."""
    query = db.query(FoundationShade)
    if depth_group:
        query = query.filter(FoundationShade.depth_group.ilike(depth_group))
    if undertone:
        query = query.filter(FoundationShade.undertone.ilike(undertone))
    return query.order_by(FoundationShade.lab_l.desc()).all()


@api_router.get("/shades/{shade_id}", response_model=FoundationShadeResponse, tags=["Shades"])
def get_shade(shade_id: int, db: Session = Depends(get_db)):
    """Retrieve details for a specific foundation shade."""
    shade = db.query(FoundationShade).filter(FoundationShade.id == shade_id).first()
    if not shade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Foundation shade with id {shade_id} not found"
        )
    return shade


# -----------------------------------------------------------------------------
# Merchant Analytics Endpoints
# -----------------------------------------------------------------------------

@api_router.get("/analytics/overview", tags=["Merchant Analytics"])
def get_catalogue_analytics(
    brand: Optional[str] = Query(None, description="Filter analytics by brand name"),
    product: Optional[str] = Query(None, description="Filter analytics by product name"),
    db: Session = Depends(get_db)
):
    """
    Computes objective foundation catalogue coverage metrics, 2D depth x undertone matrix,
    and identifies critical/vulnerable assortment gaps.
    """
    return merchant_analytics_service.analyze_catalogue(db, brand_filter=brand, product_filter=product)


@api_router.get("/analytics/export-csv", tags=["Merchant Analytics"])
def export_catalogue_csv(
    brand: Optional[str] = Query(None, description="Filter export by brand name"),
    product: Optional[str] = Query(None, description="Filter export by product name"),
    db: Session = Depends(get_db)
):
    """
    Exports a structured CSV summary containing catalogue distributions, coverage matrix,
    identified gaps, and complete SKU inventory.
    """
    csv_content = merchant_analytics_service.generate_csv_export(db, brand_filter=brand, product_filter=product)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": 'attachment; filename="shadeproof_catalogue_coverage.csv"',
            "Content-Type": "text/csv; charset=utf-8",
        }
    )


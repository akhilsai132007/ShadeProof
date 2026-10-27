from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class FoundationShadeBase(BaseModel):
    brand: str = Field(..., max_length=100)
    product_name: str = Field(..., max_length=200)
    shade_name: str = Field(..., max_length=100)
    shade_code: str = Field(..., max_length=50)
    hex_color: str = Field(..., pattern=r"^#[0-9A-Fa-f]{6}$")
    lab_l: float = Field(..., ge=0.0, le=100.0)
    lab_a: float = Field(..., ge=-128.0, le=127.0)
    lab_b: float = Field(..., ge=-128.0, le=127.0)
    undertone: str = Field(..., max_length=20)
    depth_group: str = Field(..., max_length=20)
    finish: str = Field("Natural Matte", max_length=50)
    coverage: str = Field("Medium-Full", max_length=50)
    price: float = Field(39.0, ge=0.0)
    currency: str = Field("USD", max_length=3)
    stock_status: str = Field("in_stock", max_length=20)
    product_url: Optional[str] = None
    is_demo_data: bool = True


class FoundationShadeCreate(FoundationShadeBase):
    pass


class FoundationShadeResponse(FoundationShadeBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

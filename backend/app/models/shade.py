from sqlalchemy import Column, Integer, String, Float, Boolean
from app.database import Base


class FoundationShade(Base):
    __tablename__ = "foundation_shades"

    id = Column(Integer, primary_key=True, index=True)
    brand = Column(String(100), nullable=False, index=True)
    product_name = Column(String(200), nullable=False)
    shade_name = Column(String(100), nullable=False)
    shade_code = Column(String(50), nullable=False, unique=True, index=True)
    hex_color = Column(String(7), nullable=False)  # Format: #RRGGBB

    # Pre-computed CIELAB coordinates for fast distance calculation
    lab_l = Column(Float, nullable=False)  # Lightness (0 to 100)
    lab_a = Column(Float, nullable=False)  # Green to Red (-128 to 127)
    lab_b = Column(Float, nullable=False)  # Blue to Yellow (-128 to 127)

    # Categorical matching descriptors
    undertone = Column(String(20), nullable=False, index=True)  # Warm, Cool, Neutral, Olive
    depth_group = Column(String(20), nullable=False, index=True)  # Fair, Light, Medium, Tan, Deep
    finish = Column(String(50), nullable=False, default="Natural Matte")  # Matte, Radiant, Satin, Natural
    coverage = Column(String(50), nullable=False, default="Medium-Full")  # Sheer, Medium, Full, Medium-Full

    # eCommerce metadata
    price = Column(Float, nullable=False, default=39.0)
    currency = Column(String(3), nullable=False, default="USD")
    stock_status = Column(String(20), nullable=False, default="in_stock")  # in_stock, low_stock, out_of_stock
    product_url = Column(String(500), nullable=True)

    # Transparency flag to distinguish demo sample catalogue from brand-verified inventory
    is_demo_data = Column(Boolean, nullable=False, default=True)

    def __repr__(self) -> str:
        return f"<FoundationShade {self.brand} {self.shade_code} - {self.shade_name}>"

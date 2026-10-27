import math
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models.shade import FoundationShade


def rgb_to_lab(r: int, g: int, b: int) -> Tuple[float, float, float]:
    """
    Standard sRGB (D65 illuminant, 2-degree observer) to CIELAB conversion.
    Used to guarantee mathematically precise (L*, a*, b*) coordinates.
    """
    # 1. Normalize sRGB to [0, 1]
    r_lin = r / 255.0
    g_lin = g / 255.0
    b_lin = b / 255.0

    # 2. Linearize (gamma expansion)
    def pivot_rgb(c: float) -> float:
        return c / 12.92 if c <= 0.04045 else math.pow((c + 0.055) / 1.055, 2.4)

    r_lin = pivot_rgb(r_lin)
    g_lin = pivot_rgb(g_lin)
    b_lin = pivot_rgb(b_lin)

    # 3. Transform to CIE XYZ (D65)
    x = r_lin * 0.4124564 + g_lin * 0.3575761 + b_lin * 0.1804375
    y = r_lin * 0.2126729 + g_lin * 0.7151522 + b_lin * 0.0721750
    z = r_lin * 0.0193339 + g_lin * 0.1191920 + b_lin * 0.9503041

    # 4. Normalize for D65 reference white
    x_n, y_n, z_n = 0.95047, 1.00000, 1.08883
    x /= x_n
    y /= y_n
    z /= z_n

    # 5. Transform XYZ to CIELAB
    def pivot_xyz(t: float) -> float:
        delta = 6.0 / 29.0
        return math.pow(t, 1.0 / 3.0) if t > delta**3 else (t / (3.0 * delta**2)) + (4.0 / 29.0)

    fx = pivot_xyz(x)
    fy = pivot_xyz(y)
    fz = pivot_xyz(z)

    l_val = round(116.0 * fy - 16.0, 2)
    a_val = round(500.0 * (fx - fy), 2)
    b_val = round(200.0 * (fy - fz), 2)

    return l_val, a_val, b_val


def hex_to_lab(hex_code: str) -> Tuple[float, float, float]:
    clean_hex = hex_code.lstrip("#")
    r = int(clean_hex[0:2], 16)
    g = int(clean_hex[2:4], 16)
    b = int(clean_hex[4:6], 16)
    return rgb_to_lab(r, g, b)


# Sample seed dataset containing diverse shades across the 5 depth groups and all undertones.
# Clearly marked with is_demo_data = True to distinguish from real live merchant inventories.
RAW_SHADES: List[Dict[str, Any]] = [
    # --- FAIR ---
    {
        "brand": "Lumière Beauty (Demo)",
        "product_name": "SkinSilk Flawless Foundation",
        "shade_name": "100 Porcelain Cool",
        "shade_code": "LB-100C",
        "hex_color": "#F6E6DB",
        "undertone": "Cool",
        "depth_group": "Fair",
        "finish": "Natural Satin",
        "coverage": "Medium-Full",
        "price": 42.0,
        "currency": "USD",
        "stock_status": "in_stock",
        "product_url": "https://example.com/demo/shades/100c",
    },
    {
        "brand": "Lumière Beauty (Demo)",
        "product_name": "SkinSilk Flawless Foundation",
        "shade_name": "110 Alabaster Neutral",
        "shade_code": "LB-110N",
        "hex_color": "#F5E3D2",
        "undertone": "Neutral",
        "depth_group": "Fair",
        "finish": "Natural Satin",
        "coverage": "Medium-Full",
        "price": 42.0,
        "currency": "USD",
        "stock_status": "in_stock",
        "product_url": "https://example.com/demo/shades/110n",
    },
    {
        "brand": "Lumière Beauty (Demo)",
        "product_name": "SkinSilk Flawless Foundation",
        "shade_name": "120 Ivory Warm",
        "shade_code": "LB-120W",
        "hex_color": "#F8E3CD",
        "undertone": "Warm",
        "depth_group": "Fair",
        "finish": "Natural Satin",
        "coverage": "Medium-Full",
        "price": 42.0,
        "currency": "USD",
        "stock_status": "in_stock",
        "product_url": "https://example.com/demo/shades/120w",
    },

    # --- LIGHT ---
    {
        "brand": "Lumière Beauty (Demo)",
        "product_name": "SkinSilk Flawless Foundation",
        "shade_name": "200 Soft Beige Cool",
        "shade_code": "LB-200C",
        "hex_color": "#EED2BE",
        "undertone": "Cool",
        "depth_group": "Light",
        "finish": "Soft Matte",
        "coverage": "Medium",
        "price": 42.0,
        "currency": "USD",
        "stock_status": "in_stock",
        "product_url": "https://example.com/demo/shades/200c",
    },
    {
        "brand": "Lumière Beauty (Demo)",
        "product_name": "SkinSilk Flawless Foundation",
        "shade_name": "210 Vanilla Neutral",
        "shade_code": "LB-210N",
        "hex_color": "#EACDB6",
        "undertone": "Neutral",
        "depth_group": "Light",
        "finish": "Soft Matte",
        "coverage": "Medium",
        "price": 42.0,
        "currency": "USD",
        "stock_status": "in_stock",
        "product_url": "https://example.com/demo/shades/210n",
    },
    {
        "brand": "Lumière Beauty (Demo)",
        "product_name": "SkinSilk Flawless Foundation",
        "shade_name": "220 Golden Honey Warm",
        "shade_code": "LB-220W",
        "hex_color": "#E8C8A9",
        "undertone": "Warm",
        "depth_group": "Light",
        "finish": "Soft Matte",
        "coverage": "Medium",
        "price": 42.0,
        "currency": "USD",
        "stock_status": "in_stock",
        "product_url": "https://example.com/demo/shades/220w",
    },

    # --- MEDIUM ---
    {
        "brand": "Lumière Beauty (Demo)",
        "product_name": "SkinSilk Flawless Foundation",
        "shade_name": "300 Muted Rose Cool",
        "shade_code": "LB-300C",
        "hex_color": "#DFB295",
        "undertone": "Cool",
        "depth_group": "Medium",
        "finish": "Natural Satin",
        "coverage": "Full",
        "price": 42.0,
        "currency": "USD",
        "stock_status": "in_stock",
        "product_url": "https://example.com/demo/shades/300c",
    },
    {
        "brand": "Lumière Beauty (Demo)",
        "product_name": "SkinSilk Flawless Foundation",
        "shade_name": "310 Sand Neutral",
        "shade_code": "LB-310N",
        "hex_color": "#D7AA8C",
        "undertone": "Neutral",
        "depth_group": "Medium",
        "finish": "Natural Satin",
        "coverage": "Full",
        "price": 42.0,
        "currency": "USD",
        "stock_status": "in_stock",
        "product_url": "https://example.com/demo/shades/310n",
    },
    {
        "brand": "Lumière Beauty (Demo)",
        "product_name": "SkinSilk Flawless Foundation",
        "shade_name": "320 Warm Amber",
        "shade_code": "LB-320W",
        "hex_color": "#D8A47F",
        "undertone": "Warm",
        "depth_group": "Medium",
        "finish": "Natural Satin",
        "coverage": "Full",
        "price": 42.0,
        "currency": "USD",
        "stock_status": "in_stock",
        "product_url": "https://example.com/demo/shades/320w",
    },
    {
        "brand": "Lumière Beauty (Demo)",
        "product_name": "SkinSilk Flawless Foundation",
        "shade_name": "330 Olive Medium",
        "shade_code": "LB-330O",
        "hex_color": "#CDB28D",
        "undertone": "Olive",
        "depth_group": "Medium",
        "finish": "Natural Satin",
        "coverage": "Full",
        "price": 42.0,
        "currency": "USD",
        "stock_status": "low_stock",
        "product_url": "https://example.com/demo/shades/330o",
    },

    # --- TAN ---
    {
        "brand": "Lumière Beauty (Demo)",
        "product_name": "SkinSilk Flawless Foundation",
        "shade_name": "400 Rich Sienna Cool",
        "shade_code": "LB-400C",
        "hex_color": "#BC8B68",
        "undertone": "Cool",
        "depth_group": "Tan",
        "finish": "Radiant",
        "coverage": "Medium-Full",
        "price": 42.0,
        "currency": "USD",
        "stock_status": "in_stock",
        "product_url": "https://example.com/demo/shades/400c",
    },
    {
        "brand": "Lumière Beauty (Demo)",
        "product_name": "SkinSilk Flawless Foundation",
        "shade_name": "410 Caramel Neutral",
        "shade_code": "LB-410N",
        "hex_color": "#B7835E",
        "undertone": "Neutral",
        "depth_group": "Tan",
        "finish": "Radiant",
        "coverage": "Medium-Full",
        "price": 42.0,
        "currency": "USD",
        "stock_status": "in_stock",
        "product_url": "https://example.com/demo/shades/410n",
    },
    {
        "brand": "Lumière Beauty (Demo)",
        "product_name": "SkinSilk Flawless Foundation",
        "shade_name": "420 Toffee Warm",
        "shade_code": "LB-420W",
        "hex_color": "#A66E47",
        "undertone": "Warm",
        "depth_group": "Tan",
        "finish": "Radiant",
        "coverage": "Medium-Full",
        "price": 42.0,
        "currency": "USD",
        "stock_status": "in_stock",
        "product_url": "https://example.com/demo/shades/420w",
    },

    # --- DEEP ---
    {
        "brand": "Lumière Beauty (Demo)",
        "product_name": "SkinSilk Flawless Foundation",
        "shade_name": "500 Cocoa Cool",
        "shade_code": "LB-500C",
        "hex_color": "#6F4534",
        "undertone": "Cool",
        "depth_group": "Deep",
        "finish": "Soft Matte",
        "coverage": "Full",
        "price": 42.0,
        "currency": "USD",
        "stock_status": "in_stock",
        "product_url": "https://example.com/demo/shades/500c",
    },
    {
        "brand": "Lumière Beauty (Demo)",
        "product_name": "SkinSilk Flawless Foundation",
        "shade_name": "510 Espresso Neutral",
        "shade_code": "LB-510N",
        "hex_color": "#5B3929",
        "undertone": "Neutral",
        "depth_group": "Deep",
        "finish": "Soft Matte",
        "coverage": "Full",
        "price": 42.0,
        "currency": "USD",
        "stock_status": "in_stock",
        "product_url": "https://example.com/demo/shades/510n",
    },
    {
        "brand": "Lumière Beauty (Demo)",
        "product_name": "SkinSilk Flawless Foundation",
        "shade_name": "520 Mahogany Warm",
        "shade_code": "LB-520W",
        "hex_color": "#4B2F21",
        "undertone": "Warm",
        "depth_group": "Deep",
        "finish": "Soft Matte",
        "coverage": "Full",
        "price": 42.0,
        "currency": "USD",
        "stock_status": "out_of_stock",
        "product_url": "https://example.com/demo/shades/520w",
    },
]


def seed_shades_if_empty(db: Session) -> int:
    """
    Seeds the foundation_shades table with calibrated demo shades if currently empty.
    Returns the count of shades seeded.
    """
    existing_count = db.query(FoundationShade).count()
    if existing_count > 0:
        return 0

    seeded_count = 0
    for item in RAW_SHADES:
        l_val, a_val, b_val = hex_to_lab(item["hex_color"])
        shade = FoundationShade(
            brand=item["brand"],
            product_name=item["product_name"],
            shade_name=item["shade_name"],
            shade_code=item["shade_code"],
            hex_color=item["hex_color"].upper(),
            lab_l=l_val,
            lab_a=a_val,
            lab_b=b_val,
            undertone=item["undertone"],
            depth_group=item["depth_group"],
            finish=item["finish"],
            coverage=item["coverage"],
            price=item["price"],
            currency=item["currency"],
            stock_status=item["stock_status"],
            product_url=item["product_url"],
            is_demo_data=True,
        )
        db.add(shade)
        seeded_count += 1

    db.commit()
    return seeded_count

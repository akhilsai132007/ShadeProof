"""
ShadeProof Merchant Analytics Service.

Provides objective foundation catalogue coverage analysis and gap identification:
- Aggregates inventory representation across Depth Groups and Undertones.
- Computes a 2D coverage matrix (Depth x Undertone) to locate unrepresented complexions.
- Identifies critical catalogue gaps (0 available shades) and single-point-of-failure segments (1 shade).
- Exports structured CSV reports for retail assortment planning.

IMPORTANT DATA RULES:
- Metrics reflect actual catalogue variety and inventory status from the database.
- Does NOT fabricate demographic customer demand, sales trends, or ethnic inferences.
- Clearly defines 'coverage gap' based on shade count and in-stock availability.
"""

import csv
import io
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from app.models.shade import FoundationShade

DEPTH_GROUPS = ["Fair", "Light", "Medium", "Tan", "Deep"]
UNDERTONES = ["Warm", "Cool", "Neutral", "Olive"]


@dataclass
class MatrixCell:
    depth_group: str
    undertone: str
    total_shades: int
    in_stock_shades: int
    low_stock_shades: int
    out_of_stock_shades: int
    shade_codes: List[str]
    status: str  # "critical_gap" (0), "vulnerable" (1 or 0 in-stock), "adequate" (2+)


@dataclass
class CatalogueGap:
    depth_group: str
    undertone: str
    severity: str  # "critical" (0 shades), "high" (0 in-stock), "moderate" (only 1 shade)
    available_count: int
    in_stock_count: int
    explanation: str
    recommendation: str


@dataclass
class MerchantAnalyticsReport:
    total_shades: int
    total_brands: int
    total_products: int
    in_stock_count: int
    low_stock_count: int
    out_of_stock_count: int
    coverage_score: float  # Percentage of 20 segments covered with >= 1 in-stock shade
    critical_gaps_count: int
    vulnerable_segments_count: int
    depth_distribution: List[Dict[str, Any]]
    undertone_distribution: List[Dict[str, Any]]
    coverage_matrix: List[MatrixCell]
    catalogue_gaps: List[CatalogueGap]
    data_disclaimer: str = (
        "Catalogue coverage metrics reflect current product inventory variety. "
        "They do not represent consumer demographic demand or sales projections."
    )


class MerchantAnalyticsService:
    """
    Computes catalogue distribution, inventory matrix, and assortment gap reports.
    """

    def analyze_catalogue(
        self,
        db: Session,
        brand_filter: Optional[str] = None,
        product_filter: Optional[str] = None,
    ) -> MerchantAnalyticsReport:
        query = db.query(FoundationShade)
        if brand_filter:
            query = query.filter(FoundationShade.brand.ilike(f"%{brand_filter}%"))
        if product_filter:
            query = query.filter(FoundationShade.product_name.ilike(f"%{product_filter}%"))

        shades: List[FoundationShade] = query.all()
        total_shades = len(shades)

        if total_shades == 0:
            return self._empty_report()

        # Distinct brands and products
        brands = {s.brand for s in shades}
        products = {s.product_name for s in shades}

        # Stock breakdown
        in_stock = sum(1 for s in shades if s.stock_status == "in_stock")
        low_stock = sum(1 for s in shades if s.stock_status == "low_stock")
        out_of_stock = sum(1 for s in shades if s.stock_status == "out_of_stock")

        # 1. Depth Distribution
        depth_counts = {d: 0 for d in DEPTH_GROUPS}
        for s in shades:
            dg = s.depth_group.capitalize()
            if dg in depth_counts:
                depth_counts[dg] += 1
            else:
                depth_counts[dg] = depth_counts.get(dg, 0) + 1

        depth_distribution = [
            {
                "depth_group": d,
                "count": depth_counts.get(d, 0),
                "percentage": round((depth_counts.get(d, 0) / total_shades) * 100, 1),
            }
            for d in DEPTH_GROUPS
        ]

        # 2. Undertone Distribution
        undertone_counts = {u: 0 for u in UNDERTONES}
        for s in shades:
            ut = s.undertone.capitalize()
            if ut in undertone_counts:
                undertone_counts[ut] += 1
            else:
                undertone_counts[ut] = undertone_counts.get(ut, 0) + 1

        undertone_distribution = [
            {
                "undertone": u,
                "count": undertone_counts.get(u, 0),
                "percentage": round((undertone_counts.get(u, 0) / total_shades) * 100, 1),
            }
            for u in UNDERTONES
        ]

        # 3. 2D Coverage Matrix (Depth x Undertone: 5x4 = 20 cells)
        matrix: List[MatrixCell] = []
        covered_segments = 0
        critical_gaps = 0
        vulnerable_segments = 0
        gaps: List[CatalogueGap] = []

        for d in DEPTH_GROUPS:
            for u in UNDERTONES:
                cell_shades = [
                    s for s in shades
                    if s.depth_group.capitalize() == d and s.undertone.capitalize() == u
                ]
                count = len(cell_shades)
                in_st = sum(1 for s in cell_shades if s.stock_status == "in_stock")
                low_st = sum(1 for s in cell_shades if s.stock_status == "low_stock")
                out_st = sum(1 for s in cell_shades if s.stock_status == "out_of_stock")
                codes = [s.shade_code for s in cell_shades]

                if count == 0:
                    status = "critical_gap"
                    critical_gaps += 1
                    gaps.append(
                        CatalogueGap(
                            depth_group=d,
                            undertone=u,
                            severity="critical",
                            available_count=0,
                            in_stock_count=0,
                            explanation=(
                                f"Zero shades available in catalogue for {d} skin with {u} undertone. "
                                f"Shoppers with this complexion cannot find any match."
                            ),
                            recommendation=f"Formulate and stock at least 2 shades for {d} + {u}.",
                        )
                    )
                elif in_st == 0:
                    status = "vulnerable"
                    vulnerable_segments += 1
                    gaps.append(
                        CatalogueGap(
                            depth_group=d,
                            undertone=u,
                            severity="high",
                            available_count=count,
                            in_stock_count=0,
                            explanation=(
                                f"All {count} shade(s) in {d} + {u} are currently out of stock. "
                                f"Immediate fulfillment risk."
                            ),
                            recommendation=f"Restock out-of-stock SKUs ({', '.join(codes)}) immediately.",
                        )
                    )
                elif count == 1 or in_st == 1:
                    status = "vulnerable"
                    vulnerable_segments += 1
                    covered_segments += 1
                    gaps.append(
                        CatalogueGap(
                            depth_group=d,
                            undertone=u,
                            severity="moderate",
                            available_count=count,
                            in_stock_count=in_st,
                            explanation=(
                                f"Single-point-of-failure: only 1 in-stock shade ({codes[0]}) for {d} + {u}. "
                                f"No alternative formulas for varied skin textures or coverage preferences."
                            ),
                            recommendation=f"Introduce 1 additional complementary {d} + {u} shade to improve choice.",
                        )
                    )
                else:
                    status = "adequate"
                    covered_segments += 1

                matrix.append(
                    MatrixCell(
                        depth_group=d,
                        undertone=u,
                        total_shades=count,
                        in_stock_shades=in_st,
                        low_stock_shades=low_st,
                        out_of_stock_shades=out_st,
                        shade_codes=codes,
                        status=status,
                    )
                )

        coverage_score = round((covered_segments / 20.0) * 100, 1)

        # Sort gaps by severity (critical first, then high, then moderate)
        severity_order = {"critical": 0, "high": 1, "moderate": 2}
        gaps.sort(key=lambda g: severity_order.get(g.severity, 3))

        return MerchantAnalyticsReport(
            total_shades=total_shades,
            total_brands=len(brands),
            total_products=len(products),
            in_stock_count=in_stock,
            low_stock_count=low_stock,
            out_of_stock_count=out_of_stock,
            coverage_score=coverage_score,
            critical_gaps_count=critical_gaps,
            vulnerable_segments_count=vulnerable_segments,
            depth_distribution=depth_distribution,
            undertone_distribution=undertone_distribution,
            coverage_matrix=matrix,
            catalogue_gaps=gaps,
        )

    def generate_csv_export(
        self,
        db: Session,
        brand_filter: Optional[str] = None,
        product_filter: Optional[str] = None,
    ) -> str:
        """
        Generates a structured, multi-section CSV export containing:
        1. Executive Catalogue Overview
        2. Depth and Undertone Distributions
        3. 2D Inventory Matrix (5x4)
        4. Identified Catalogue Gaps
        5. Complete SKU Listing
        """
        report = self.analyze_catalogue(db, brand_filter, product_filter)
        output = io.StringIO()
        writer = csv.writer(output)

        # Section 1: Overview Header
        writer.writerow(["SHADEPROOF FOUNDATION CATALOGUE COVERAGE REPORT"])
        writer.writerow(["Data Type", "Actual Inventory Variety (Not Demographic Demand)"])
        writer.writerow([])
        writer.writerow(["METRIC", "VALUE"])
        writer.writerow(["Total Active Shades", report.total_shades])
        writer.writerow(["Brands Represented", report.total_brands])
        writer.writerow(["Product Lines", report.total_products])
        writer.writerow(["In-Stock Shades", report.in_stock_count])
        writer.writerow(["Low-Stock Shades", report.low_stock_count])
        writer.writerow(["Out-of-Stock Shades", report.out_of_stock_count])
        writer.writerow(["Catalogue Coverage Score", f"{report.coverage_score}%"])
        writer.writerow(["Critical Gaps (0 Shades)", report.critical_gaps_count])
        writer.writerow(["Vulnerable Segments (<=1 In-Stock)", report.vulnerable_segments_count])
        writer.writerow([])

        # Section 2: Depth Distribution
        writer.writerow(["DEPTH GROUP DISTRIBUTION"])
        writer.writerow(["Depth Group", "Shade Count", "Percentage of Catalogue"])
        for d in report.depth_distribution:
            writer.writerow([d["depth_group"], d["count"], f"{d['percentage']}%"])
        writer.writerow([])

        # Section 3: Undertone Distribution
        writer.writerow(["UNDERTONE DISTRIBUTION"])
        writer.writerow(["Undertone", "Shade Count", "Percentage of Catalogue"])
        for u in report.undertone_distribution:
            writer.writerow([u["undertone"], u["count"], f"{u['percentage']}%"])
        writer.writerow([])

        # Section 4: 2D Matrix
        writer.writerow(["2D COVERAGE MATRIX (DEPTH x UNDERTONE)"])
        writer.writerow(["Depth Group", "Undertone", "Total Shades", "In Stock", "Out of Stock", "Status", "Shade Codes"])
        for cell in report.coverage_matrix:
            writer.writerow([
                cell.depth_group,
                cell.undertone,
                cell.total_shades,
                cell.in_stock_shades,
                cell.out_of_stock_shades,
                cell.status,
                "; ".join(cell.shade_codes) if cell.shade_codes else "NONE",
            ])
        writer.writerow([])

        # Section 5: Identified Catalogue Gaps
        writer.writerow(["IDENTIFIED CATALOGUE GAPS & RECOMMENDATIONS"])
        writer.writerow(["Depth Group", "Undertone", "Severity", "Available Count", "In Stock Count", "Explanation", "Actionable Recommendation"])
        for gap in report.catalogue_gaps:
            writer.writerow([
                gap.depth_group,
                gap.undertone,
                gap.severity.upper(),
                gap.available_count,
                gap.in_stock_count,
                gap.explanation,
                gap.recommendation,
            ])
        writer.writerow([])

        # Section 6: Full SKU Inventory Listing
        query = db.query(FoundationShade)
        if brand_filter:
            query = query.filter(FoundationShade.brand.ilike(f"%{brand_filter}%"))
        if product_filter:
            query = query.filter(FoundationShade.product_name.ilike(f"%{product_filter}%"))
        all_shades = query.order_by(FoundationShade.lab_l.desc()).all()

        writer.writerow(["COMPLETE SHADE CATALOGUE"])
        writer.writerow(["Shade Code", "Shade Name", "Brand", "Product Name", "Hex Color", "Lab L*", "Lab a*", "Lab b*", "Depth Group", "Undertone", "Stock Status", "Price USD"])
        for s in all_shades:
            writer.writerow([
                s.shade_code,
                s.shade_name,
                s.brand,
                s.product_name,
                s.hex_color,
                s.lab_l,
                s.lab_a,
                s.lab_b,
                s.depth_group,
                s.undertone,
                s.stock_status,
                f"${s.price:.2f}",
            ])

        return output.getvalue()

    def _empty_report(self) -> MerchantAnalyticsReport:
        matrix = [
            MatrixCell(
                depth_group=d,
                undertone=u,
                total_shades=0,
                in_stock_shades=0,
                low_stock_shades=0,
                out_of_stock_shades=0,
                shade_codes=[],
                status="critical_gap",
            )
            for d in DEPTH_GROUPS
            for u in UNDERTONES
        ]
        gaps = [
            CatalogueGap(
                depth_group=d,
                undertone=u,
                severity="critical",
                available_count=0,
                in_stock_count=0,
                explanation=f"Empty catalogue: no shades available for {d} + {u}.",
                recommendation=f"Add initial {d} + {u} shades to the catalogue.",
            )
            for d in DEPTH_GROUPS
            for u in UNDERTONES
        ]
        return MerchantAnalyticsReport(
            total_shades=0,
            total_brands=0,
            total_products=0,
            in_stock_count=0,
            low_stock_count=0,
            out_of_stock_count=0,
            coverage_score=0.0,
            critical_gaps_count=20,
            vulnerable_segments_count=0,
            depth_distribution=[{"depth_group": d, "count": 0, "percentage": 0.0} for d in DEPTH_GROUPS],
            undertone_distribution=[{"undertone": u, "count": 0, "percentage": 0.0} for u in UNDERTONES],
            coverage_matrix=matrix,
            catalogue_gaps=gaps,
        )


merchant_analytics_service = MerchantAnalyticsService()

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "mrx-dawson-test-data.pdf"

NAVY = colors.HexColor("#0B2741")
GOLD = colors.HexColor("#C68A2B")
PALE = colors.HexColor("#F4F7F9")
MUTED = colors.HexColor("#4C6173")


def money(value: float) -> str:
    return f"${value:,.2f}"


def build() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=letter,
        rightMargin=0.55 * inch,
        leftMargin=0.55 * inch,
        topMargin=0.45 * inch,
        bottomMargin=0.45 * inch,
        title="MRX Dawson County Test Data",
        author="Mineral Rights Xchange",
        subject="Sanitized staging fixture",
    )
    styles = getSampleStyleSheet()
    title = ParagraphStyle(
        "Title",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=19,
        leading=22,
        textColor=NAVY,
        alignment=0,
        spaceAfter=3,
    )
    banner = ParagraphStyle(
        "Banner",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=13,
        textColor=colors.white,
        alignment=1,
    )
    body = ParagraphStyle(
        "Body",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=MUTED,
    )
    small = ParagraphStyle(
        "Small",
        parent=body,
        fontSize=7.5,
        leading=10,
    )

    story = [
        Paragraph("MINERAL RIGHTS XCHANGE", title),
        Paragraph("Synthetic royalty-interest fixture for staging validation", body),
        Spacer(1, 0.12 * inch),
        Table(
            [[Paragraph("TEST DATA - NOT A REAL OWNER RECORD", banner)]],
            colWidths=[7.4 * inch],
            style=TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), GOLD),
                    ("BOX", (0, 0), (-1, -1), 0.8, GOLD),
                    ("TOPPADDING", (0, 0), (-1, -1), 7),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                ]
            ),
        ),
        Spacer(1, 0.18 * inch),
        Table(
            [
                ["Operator", "County / state", "Production month", "Interest type"],
                ["Laguna Resources", "Dawson County, Texas", "May 2026", "Producing royalty"],
            ],
            colWidths=[1.85 * inch] * 4,
            style=TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), NAVY),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTNAME", (0, 1), (-1, 1), "Helvetica"),
                    ("FONTSIZE", (0, 0), (-1, -1), 8),
                    ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#CAD3DA")),
                    ("BACKGROUND", (0, 1), (-1, 1), PALE),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("TOPPADDING", (0, 0), (-1, -1), 7),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                ]
            ),
        ),
        Spacer(1, 0.18 * inch),
    ]

    rows = [
        [
            "Property / well",
            "Property ref.",
            "Royalty decimal",
            "Owner volume",
            "Gross value",
            "Taxes / fees",
            "Net value",
        ],
        ["Panther B Unit #D 1H", "TX1034001", "0.00105976", "7.43 BBL", money(799.87), money(36.83), money(763.04)],
        ["Panther C Unit #D 2H", "TX1035002", "0.00038124", "1.17 BBL", money(125.66), money(5.79), money(119.87)],
        ["Panther D Unit #D 3H", "TX1036003", "0.00022329", "1.30 BBL", money(139.84), money(6.44), money(133.40)],
        ["Statement totals", "", "", "", money(1065.37), money(49.06), money(1016.31)],
    ]
    story.extend(
        [
            Table(
                rows,
                colWidths=[1.65 * inch, 0.85 * inch, 0.9 * inch, 0.75 * inch, 0.8 * inch, 0.8 * inch, 0.8 * inch],
                repeatRows=1,
                style=TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
                        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                        ("FONTSIZE", (0, 0), (-1, -1), 7.2),
                        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#CAD3DA")),
                        ("ROWBACKGROUNDS", (0, 1), (-1, -2), [colors.white, PALE]),
                        ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#E7EDF1")),
                        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
                        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                        ("ALIGN", (2, 1), (-1, -1), "RIGHT"),
                        ("TOPPADDING", (0, 0), (-1, -1), 8),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                    ]
                ),
            ),
            Spacer(1, 0.2 * inch),
            Paragraph(
                "Known for this test: the operator, county and state, property references, well names, producing status, royalty decimals, May 2026 owner volumes, and payment amounts shown above.",
                body,
            ),
            Spacer(1, 0.08 * inch),
            Paragraph(
                "Intentionally unknown: net mineral acres, gross acres under lease, lease status, legal description, title status, and valuation. The test system must not infer these fields.",
                body,
            ),
            Spacer(1, 0.18 * inch),
            Table(
                [[Paragraph("QA NOTICE", banner)], [Paragraph(
                    "This is an MRX-created synthetic fixture for authorized staging tests. It contains no real owner identity, contact details, financial-account metadata, source-system metadata, or source-platform branding. It is not a royalty statement, title record, valuation, or offer.",
                    small,
                )]],
                colWidths=[7.4 * inch],
                style=TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), GOLD),
                        ("BACKGROUND", (0, 1), (-1, 1), PALE),
                        ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#CAD3DA")),
                        ("LEFTPADDING", (0, 0), (-1, -1), 10),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                        ("TOPPADDING", (0, 0), (-1, -1), 7),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                    ]
                ),
            ),
        ]
    )
    doc.build(story)
    print(OUTPUT)


if __name__ == "__main__":
    build()

#!/usr/bin/env python3
"""Build the canonical MRX free guide PDF."""

from __future__ import annotations

import sys
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


NAVY = colors.HexColor("#17324D")
NAVY_DARK = colors.HexColor("#0D2842")
GOLD = colors.HexColor("#D79A2B")
GOLD_LIGHT = colors.HexColor("#FFF4D8")
CREAM = colors.HexColor("#FFFAF1")
INK = colors.HexColor("#2F4558")
MUTED = colors.HexColor("#617382")
LINE = colors.HexColor("#E8D9BA")
WHITE = colors.white


def build_styles():
    base = getSampleStyleSheet()
    return {
        "eyebrow": ParagraphStyle(
            "Eyebrow",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=12,
            textColor=GOLD,
            tracking=1.2,
            spaceAfter=10,
        ),
        "cover_title": ParagraphStyle(
            "CoverTitle",
            parent=base["Title"],
            fontName="Helvetica-Bold",
            fontSize=32,
            leading=36,
            textColor=NAVY_DARK,
            alignment=TA_LEFT,
            spaceAfter=14,
        ),
        "cover_subtitle": ParagraphStyle(
            "CoverSubtitle",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=14,
            leading=21,
            textColor=INK,
            spaceAfter=22,
        ),
        "h1": ParagraphStyle(
            "H1",
            parent=base["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=23,
            leading=28,
            textColor=NAVY_DARK,
            spaceAfter=13,
        ),
        "h2": ParagraphStyle(
            "H2",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=15,
            leading=19,
            textColor=NAVY,
            spaceBefore=14,
            spaceAfter=7,
        ),
        "body": ParagraphStyle(
            "Body",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=10.5,
            leading=15.5,
            textColor=INK,
            spaceAfter=8,
        ),
        "small": ParagraphStyle(
            "Small",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=12,
            textColor=MUTED,
        ),
        "bullet": ParagraphStyle(
            "Bullet",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=10,
            leading=14.5,
            textColor=INK,
            leftIndent=15,
            firstLineIndent=-10,
            bulletIndent=0,
            spaceAfter=5,
        ),
        "step_title": ParagraphStyle(
            "StepTitle",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=13,
            leading=16,
            textColor=NAVY_DARK,
            spaceAfter=4,
        ),
        "callout": ParagraphStyle(
            "Callout",
            parent=base["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=10.5,
            leading=15,
            textColor=NAVY_DARK,
        ),
        "center": ParagraphStyle(
            "Center",
            parent=base["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=11,
            leading=15,
            alignment=TA_CENTER,
            textColor=NAVY_DARK,
        ),
    }


def bullet(text: str, styles):
    return Paragraph(f"- {text}", styles["bullet"])


def callout(title: str, body: str, styles):
    table = Table(
        [[Paragraph(title, styles["callout"]), Paragraph(body, styles["body"]) ]],
        colWidths=[1.5 * inch, 4.65 * inch],
    )
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), GOLD_LIGHT),
                ("BOX", (0, 0), (-1, -1), 0.8, LINE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    return table


def step(number: str, title: str, body: str, styles):
    badge = Table([[Paragraph(number, styles["center"]) ]], colWidths=[0.42 * inch], rowHeights=[0.42 * inch])
    badge.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), GOLD_LIGHT),
                ("BOX", (0, 0), (-1, -1), 0.7, GOLD),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
        )
    )
    text = [Paragraph(title, styles["step_title"]), Paragraph(body, styles["body"])]
    table = Table([[badge, text]], colWidths=[0.58 * inch, 5.55 * inch])
    table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    return KeepTogether([table, Spacer(1, 4)])


def on_page(canvas, doc):
    canvas.saveState()
    width, height = letter
    canvas.setFillColor(NAVY_DARK)
    canvas.rect(0, height - 0.22 * inch, width, 0.22 * inch, stroke=0, fill=1)
    canvas.setFont("Helvetica-Bold", 8.5)
    canvas.setFillColor(NAVY)
    canvas.drawString(0.72 * inch, 0.42 * inch, "MINERAL RIGHTS XCHANGE")
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(MUTED)
    canvas.drawRightString(width - 0.72 * inch, 0.42 * inch, f"Page {doc.page}")
    canvas.setStrokeColor(LINE)
    canvas.line(0.72 * inch, 0.58 * inch, width - 0.72 * inch, 0.58 * inch)
    canvas.restoreState()


def build(output: Path):
    output.parent.mkdir(parents=True, exist_ok=True)
    styles = build_styles()
    doc = SimpleDocTemplate(
        str(output),
        pagesize=letter,
        rightMargin=0.72 * inch,
        leftMargin=0.72 * inch,
        topMargin=0.62 * inch,
        bottomMargin=0.78 * inch,
        title="How to Find Out What Your Mineral Rights Are",
        author="Mineral Rights Xchange",
        subject="A practical records checklist for mineral owners",
    )

    story = []

    story += [
        Spacer(1, 0.45 * inch),
        Paragraph("FREE OWNER GUIDE", styles["eyebrow"]),
        Paragraph("How to Find Out What Your Mineral Rights Are", styles["cover_title"]),
        Paragraph(
            "A practical records checklist for identifying an interest, connecting it to public records, and preparing better questions before discussing value or signing an offer.",
            styles["cover_subtitle"],
        ),
        callout(
            "Start here",
            "You do not need every document before you begin. Start with one owner name, one county, or one royalty statement, then build the record trail step by step.",
            styles,
        ),
        Spacer(1, 0.35 * inch),
        Paragraph("What this guide helps you organize", styles["h2"]),
        bullet("Family, deed, probate, lease, operator, and royalty records", styles),
        bullet("The state and county sources most likely to confirm the next fact", styles),
        bullet("Questions that separate ownership, production, and value", styles),
        bullet("A clean file for an attorney, CPA, landman, operator, or underwriter review", styles),
        Spacer(1, 0.28 * inch),
        Paragraph(
            "General educational information only. This guide is not a title opinion, certified appraisal, legal opinion, tax opinion, engineering report, or guarantee of ownership, production, or value.",
            styles["small"],
        ),
        PageBreak(),
    ]

    story += [
        Paragraph("The five-part search", styles["eyebrow"]),
        Paragraph("Build the ownership trail in a useful order", styles["h1"]),
        Paragraph(
            "Mineral ownership is usually established by a chain of recorded documents, not by a single website result or royalty check. Keep copies and note where each fact came from.",
            styles["body"],
        ),
        step("1", "Start with the person or entity name", "List current and prior owner names exactly as they may appear in records, including middle initials, maiden names, trusts, estates, and company names.", styles),
        step("2", "Identify the state and county", "Mineral deeds, reservations, probate instruments, and related filings are usually searched where the property is located. County names matter because the same owner can hold interests in several places.", styles),
        step("3", "Gather the documents already in hand", "Look for mineral deeds, warranty deeds, probate orders, wills, leases, division orders, check stubs, operator letters, tax statements, and written offers.", styles),
        step("4", "Connect the legal description", "Capture the section, block, survey, township, range, abstract, tract, parcel, or other legal-description language exactly. Do not assume a street address describes the mineral estate.", styles),
        step("5", "Separate proof from clues", "A royalty statement or tax record can be a valuable clue, but it may not establish full title. Mark each item as confirmed, owner-reported, inferred, or still missing.", styles),
        callout(
            "Useful habit",
            "Create one folder per county or interest. Name files with the document date, county, owner, and document type so the record trail stays understandable.",
            styles,
        ),
        PageBreak(),
    ]

    story += [
        Paragraph("Records checklist", styles["eyebrow"]),
        Paragraph("Where to look and what each source can show", styles["h1"]),
        Paragraph("County clerk or recorder", styles["h2"]),
        bullet("Recorded deeds, reservations, conveyances, assignments, leases, releases, and memoranda", styles),
        bullet("Probate, estate, or court filings when those records are maintained by the county", styles),
        bullet("Document references that point backward or forward in the ownership chain", styles),
        Paragraph("Operator or payor records", styles["h2"]),
        bullet("Owner number, lease or well name, decimal interest, payment history, and division-order status", styles),
        bullet("Contact information for owner relations, transfer, title, or revenue departments", styles),
        Paragraph("State oil and gas regulator", styles["h2"]),
        bullet("Well, operator, field, lease, permit, completion, and production information where publicly available", styles),
        bullet("Examples include the Texas Railroad Commission, New Mexico Oil Conservation Division, and Oklahoma Corporation Commission", styles),
        Paragraph("County appraisal or tax office", styles["h2"]),
        bullet("Mineral or royalty tax accounts in jurisdictions that separately assess those interests", styles),
        bullet("Mailing name and account clues that still need title verification", styles),
        Paragraph("Family, estate, and professional files", styles["h2"]),
        bullet("Wills, trust schedules, settlement statements, prior title work, closing packages, and correspondence", styles),
        bullet("Ask whether any interest was reserved, partially conveyed, inherited, gifted, or placed in an entity", styles),
        callout(
            "Do not upload sensitive data casually",
            "Redact Social Security numbers, bank information, and unrelated personal identifiers. Use a secure portal when a professional actually needs a document.",
            styles,
        ),
        PageBreak(),
    ]

    story += [
        Paragraph("Royalty statements", styles["eyebrow"]),
        Paragraph("What a check stub can tell you", styles["h1"]),
        Paragraph(
            "A current royalty statement is often the fastest way to connect an owner to an operator, lease, well, product, production month, price, deductions, and decimal interest. It is a starting point, not a complete title conclusion.",
            styles["body"],
        ),
        Paragraph("Capture these fields", styles["h2"]),
        bullet("Payor/operator name and owner number", styles),
        bullet("County, state, lease, property, unit, and well names", styles),
        bullet("Production month versus payment month", styles),
        bullet("Oil, gas, NGL, or other product volumes and prices", styles),
        bullet("Decimal interest, gross value, taxes, deductions, and net payment", styles),
        Paragraph("Questions the statement does not answer by itself", styles["h2"]),
        bullet("Whether the listed owner holds the entire mineral estate or only a fractional interest", styles),
        bullet("Whether the decimal is correct under the lease and pooling/unit documents", styles),
        bullet("Whether another tract, depth, formation, or non-producing interest is owned", styles),
        bullet("Whether title issues, suspense, transfer, probate, or curative work remain", styles),
        Paragraph("Use history, not one month", styles["h2"]),
        Paragraph(
            "Organize at least 12 to 24 months of statements when available. One unusually high or low month can distort a value discussion if price, downtime, new wells, adjustments, or declining production are not considered.",
            styles["body"],
        ),
        callout(
            "Simple spreadsheet",
            "Use one row per production month with columns for well, product, volume, price, decimal, deductions, and net revenue. Keep source PDFs beside the spreadsheet.",
            styles,
        ),
        PageBreak(),
    ]

    story += [
        Paragraph("Before discussing value", styles["eyebrow"]),
        Paragraph("Questions that make an offer easier to evaluate", styles["h1"]),
        Paragraph("Ownership and scope", styles["h2"]),
        bullet("What exact interest, tract, depth, formation, and county does the number cover?", styles),
        bullet("Is the interest producing, non-producing, leased, unleased, or held by production?", styles),
        bullet("What net mineral acres, royalty acres, or decimal interest are assumed?", styles),
        Paragraph("Production and assumptions", styles["h2"]),
        bullet("Which wells and months are included?", styles),
        bullet("How are decline, future drilling, commodity prices, downtime, and deductions treated?", styles),
        bullet("Which assumptions are confirmed and which are estimates?", styles),
        Paragraph("Offer terms", styles["h2"]),
        bullet("Is the number gross or net of fees, adjustments, taxes, and closing costs?", styles),
        bullet("Can the price change after title, acreage, or production review?", styles),
        bullet("Are there contingencies, exclusivity, clawback, warranty, or curative obligations?", styles),
        bullet("What deed or assignment will be signed, and exactly what does it convey?", styles),
        Paragraph("Professional review", styles["h2"]),
        Paragraph(
            "Consider a qualified attorney for title and contract questions, a CPA or tax attorney for tax treatment, and a land, engineering, or geology professional when the facts require specialized analysis.",
            styles["body"],
        ),
        callout(
            "Keep control of the process",
            "Do not let a deadline replace verification. Ask for assumptions and material terms in writing, keep copies, and give yourself time to compare the same scope across alternatives.",
            styles,
        ),
        PageBreak(),
    ]

    story += [
        Paragraph("Your next step", styles["eyebrow"]),
        Paragraph("Turn the search into one organized packet", styles["h1"]),
        Paragraph("Minimum useful packet", styles["h2"]),
        bullet("Owner name and best contact information", styles),
        bullet("State, county, and any legal description", styles),
        bullet("The best deed, probate, lease, division order, or operator document you have", styles),
        bullet("Recent royalty statements if the interest is producing", styles),
        bullet("Any written offer, with unrelated personal data redacted", styles),
        bullet("A list of facts you know, facts you are unsure about, and questions you want answered", styles),
        Paragraph("Official starting points", styles["h2"]),
        bullet("County clerk/recorder and county court websites for the property location", styles),
        bullet("Texas Railroad Commission: www.rrc.texas.gov", styles),
        bullet("New Mexico Oil Conservation Division: www.emnrd.nm.gov/ocd", styles),
        bullet("Oklahoma Corporation Commission: www.oklahoma.gov/occ", styles),
        Spacer(1, 0.18 * inch),
        callout(
            "Want help organizing the next questions?",
            "Mineral Rights Xchange offers a free, no-obligation underwriter review. MRX provides educational information and directional assessments, not a certified appraisal or professional title, legal, tax, accounting, engineering, or geology opinion.",
            styles,
        ),
        Spacer(1, 0.28 * inch),
        Paragraph("mineralrightsxchange.com/book", styles["center"]),
        Spacer(1, 0.28 * inch),
        Paragraph(
            "Copyright 2026 Mineral Rights Xchange. You may save or print this guide for personal use. Verify material facts and current rules with qualified professionals in the applicable jurisdiction.",
            styles["small"],
        ),
    ]

    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: build-free-guide-pdf.py OUTPUT.pdf")
    build(Path(sys.argv[1]).resolve())

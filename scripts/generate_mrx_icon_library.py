#!/usr/bin/env python3
"""Generate the MRX custom icon library.

The generator creates a consistent navy/gold rounded-line icon system with:
- SVG master files
- optimized web SVG copies
- transparent PNG exports at 64/128/256/512
- React SVG components
- CSS/HTML preview sheet
- manifest and naming documentation

The icons are generated from internal MRX primitives — no third-party icon pack
source files are copied or referenced.
"""

from __future__ import annotations

import html
import json
import math
import re
import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Iterable

from PIL import Image, ImageDraw

NAVY = "#0B1F3A"
GOLD = "#C8A24A"
SIZE = 64
STROKE = 2.5

ROOT = Path(__file__).resolve().parents[1]
PUBLIC_ROOT = ROOT / "public" / "assets" / "icons"
REACT_ROOT = PUBLIC_ROOT / "react"

CATEGORIES: dict[str, list[str]] = {
    "ai": [
        "Robot Head", "AI Chat Bubble", "Brain", "Spark", "Magic Wand", "Microphone",
        "Voice Wave", "Ask Question", "Conversation", "Thinking", "Lightning Bolt",
        "Automation", "Neural Network", "Connected Nodes", "AI Shield", "AI Search",
        "AI Recommendation", "AI Analysis",
    ],
    "ownership": [
        "Mineral Deed", "Property Records", "County Records", "Owner", "Family Trust",
        "Inheritance", "Title Search", "Ownership Chain", "Land Records", "Document Search",
        "Legal Document", "Verified Owner", "Property Boundary", "Map Pin", "Survey Marker",
        "Parcel", "County Courthouse",
    ],
    "production": [
        "Oil Well", "Pumpjack", "Drilling Rig", "Natural Gas Flame", "Production Graph",
        "Barrel", "Pipeline", "Storage Tank", "Refinery", "Flow Meter", "Oil Drop",
        "Gas Molecule", "Pressure Gauge", "Monthly Production", "Historical Production", "Forecast",
    ],
    "valuation": [
        "Dollar", "Money Bag", "Coins", "Stack of Cash", "Calculator", "Price Tag",
        "Market Value", "Trend Up", "Trend Down", "ROI", "Offer", "Handshake",
        "Investment", "Financial Report", "Estimate", "Premium Value",
    ],
    "geology": [
        "Rock Layers", "Cross Section", "Earth", "Mountain", "Fault Line", "Seismic Wave",
        "Geology Hammer", "Core Sample", "Formation", "Strata", "Underground Layers",
        "Map Contours", "Compass", "Geologist",
    ],
    "leasing": [
        "Contract", "Lease", "Signature", "Pen", "Calendar", "Expiration", "Renewal",
        "Royalty", "Royalty Check", "Lease Payment", "Agreement", "Negotiation", "Handshake",
    ],
    "legal": [
        "Scale of Justice", "Shield", "Gavel", "Legal Document", "Verified", "Compliance",
        "Secure", "Privacy", "Lock", "Certificate", "Attorney", "Court File", "Audit",
        "Approved", "Rejected",
    ],
    "maps": [
        "Texas", "United States", "County Map", "GPS", "Location Pin", "Property Outline",
        "Satellite", "Navigation", "Road", "Acreage", "Survey", "Distance", "Nearby Wells", "Radius",
    ],
    "timeline": [
        "Clock", "Hourglass", "History", "Timeline", "Milestone", "Calendar", "Future",
        "Past", "Today", "Activity", "Recent", "Updates", "Progress",
    ],
    "communication": [
        "Phone", "Email", "Message", "Chat", "Text", "Video", "Camera", "Notification",
        "Bell", "Help", "Support", "Customer Service", "FAQ", "Question Mark",
    ],
    "search": [
        "Magnifying Glass", "Filter", "Sort", "Database", "Lookup", "Find Owner",
        "Search Well", "Search County", "Search Parcel", "Search Documents", "Results",
        "Verified Results",
    ],
    "reports": [
        "PDF", "Analytics", "Pie Chart", "Line Graph", "Bar Graph", "Dashboard", "Clipboard",
        "Report", "Summary", "Insights", "Export", "Print", "Download", "Upload",
    ],
    "navigation": [
        "Home", "Dashboard", "Search", "Pricing", "About", "Contact", "Resources",
        "Articles", "Education", "FAQ", "Settings", "Notifications", "Profile", "Account",
        "Login", "Logout",
    ],
    "users": [
        "Person", "Multiple Users", "Team", "Admin", "User Settings", "Password", "Security",
        "Profile", "Avatar", "Membership", "Subscription", "Billing", "Credit Card", "Invoice", "Receipt",
    ],
    "transactions": [
        "Offer", "Sell", "Buy", "Cash", "Wire Transfer", "Bank", "Wallet", "Payment",
        "Escrow", "Closing", "Contract Signed", "Completed", "Pending", "Rejected", "Approved",
    ],
    "trust": [
        "Five Stars", "Shield Check", "Verified", "Secure", "SSL", "Privacy", "Insurance",
        "Trusted", "Family Owned", "Veteran Owned", "Texas", "American Flag", "Award",
        "Experience", "Top Rated",
    ],
    "education": [
        "Graduation Cap", "Book", "Video", "Play", "Checklist", "Guide", "Learning",
        "Tutorial", "Question", "Idea", "Lightbulb", "Knowledge", "Library", "Article",
    ],
    "agents": [
        "Tommy", "Rebecca", "Charlie", "Cooper", "Chesty", "Tex", "Grant", "Reed",
        "Mason", "Radar", "Stackhouse", "Iron Mike", "Doc Holliday", "Mission", "Orders",
        "Command Center", "Mission Complete", "Mission Failed", "Mission Processing", "AI Team",
    ],
    "marketing": [
        "Megaphone", "SEO", "Google", "Search Ranking", "Social Media", "Email Campaign",
        "Traffic", "Visitors", "Conversions", "Leads", "Funnels", "Analytics", "CTR", "Growth",
    ],
    "status": [
        "Success", "Warning", "Error", "Info", "Loading", "Sync", "Refresh", "Pending",
        "Offline", "Online", "Completed", "In Progress", "Scheduled", "Paused", "Active", "Inactive",
    ],
    "homepage": [
        "Ownership Research", "Production Analysis", "Mineral Valuation", "AI Underwriter",
        "Secure Offer Review", "County Research", "Royalty Analysis", "Drilling Activity",
        "Permit Tracking", "Title Verification", "Market Analysis", "Future Development",
        "Production Forecast", "Offer Comparison", "Negotiation", "Contract Review", "Cash Offers",
        "Family Minerals", "Inherited Minerals", "Mineral Portfolio",
    ],
}


def slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def pascal(name: str) -> str:
    return "".join(part.capitalize() for part in re.split(r"[^a-zA-Z0-9]+", name) if part)


@dataclass
class IconSpec:
    category: str
    name: str
    slug: str
    component: str
    motif: str


def choose_motif(category: str, name: str) -> str:
    n = name.lower()
    table = [
        (("chat", "message", "conversation", "text", "faq", "question", "support", "customer service", "ask"), "chat"),
        (("robot", "ai underwriter", "ai team", "automation"), "robot"),
        (("brain", "thinking", "analysis", "analytics", "insights", "recommendation"), "brain"),
        (("spark", "magic", "idea", "lightbulb"), "spark"),
        (("microphone", "voice", "phone"), "voice"),
        (("network", "nodes", "molecule", "connected"), "network"),
        (("shield", "secure", "security", "privacy", "ssl", "insurance", "trusted"), "shield"),
        (("search", "magnifying", "lookup", "find", "filter", "sort"), "search"),
        (("document", "deed", "records", "contract", "lease", "agreement", "pdf", "article", "report", "summary", "certificate", "court file", "orders"), "document"),
        (("owner", "person", "user", "profile", "avatar", "attorney", "geologist", "admin", "membership", "visitors"), "person"),
        (("team", "multiple users", "family", "trust", "inherited", "inheritance", "family owned"), "team"),
        (("map", "pin", "location", "gps", "boundary", "parcel", "county", "survey", "satellite", "navigation", "road", "acreage", "radius", "nearby wells", "texas", "united states"), "map"),
        (("courthouse",), "courthouse"),
        (("oil", "well", "pumpjack", "drilling", "rig", "barrel", "pipeline", "tank", "refinery", "flow meter", "production", "permit"), "energy"),
        (("flame", "gas"), "flame"),
        (("gauge", "pressure"), "gauge"),
        (("graph", "trend", "roi", "market", "forecast", "growth", "ranking", "activity", "progress", "line", "bar", "pie", "dashboard", "ctr", "conversions"), "graph"),
        (("dollar", "money", "cash", "coins", "price", "value", "valuation", "offer", "payment", "billing", "card", "invoice", "receipt", "wire", "bank", "wallet", "escrow", "premium"), "money"),
        (("calculator", "estimate"), "calculator"),
        (("handshake", "negotiation", "sell", "buy", "closing"), "handshake"),
        (("rock", "layers", "cross section", "earth", "mountain", "fault", "seismic", "hammer", "core", "formation", "strata", "contours", "compass"), "geology"),
        (("signature", "pen"), "pen"),
        (("calendar", "expiration", "renewal", "scheduled", "today", "future", "past", "recent", "updates"), "calendar"),
        (("royalty", "check"), "royalty"),
        (("scale", "gavel", "legal", "compliance", "audit", "approved", "rejected"), "legal"),
        (("clock", "hourglass", "history", "timeline", "milestone"), "time"),
        (("email",), "email"),
        (("video", "camera", "play"), "media"),
        (("bell", "notification"), "bell"),
        (("database", "results"), "database"),
        (("clipboard", "checklist", "guide", "tutorial"), "clipboard"),
        (("export", "upload", "download", "print"), "transfer"),
        (("home", "settings", "login", "logout", "account", "resources", "education", "about", "contact", "pricing"), "navigation"),
        (("stars", "top rated", "award", "veteran", "american flag", "experience"), "trust"),
        (("book", "library", "knowledge", "graduation"), "education"),
        (("mission", "command", "radar", "chesty", "tommy", "rebecca", "charlie", "cooper", "tex", "grant", "reed", "mason", "stackhouse", "iron mike", "doc holliday"), "agent"),
        (("megaphone", "seo", "google", "social", "campaign", "traffic", "leads", "funnels"), "marketing"),
        (("success", "warning", "error", "info", "loading", "sync", "refresh", "pending", "offline", "online", "completed", "in progress", "paused", "active", "inactive"), "status"),
    ]
    for keys, motif in table:
        if any(k in n for k in keys):
            return motif
    return "spark"


# SVG primitive helpers

def svg_el(tag: str, **attrs: object) -> str:
    parts = []
    for k, v in attrs.items():
        if v is None:
            continue
        k = k.replace("_", "-")
        parts.append(f'{k}="{html.escape(str(v), quote=True)}"')
    return f"<{tag} {' '.join(parts)}/>"


def path(d: str, color: str = NAVY, width: float = STROKE, fill: str = "none") -> str:
    return svg_el("path", d=d, fill=fill, stroke=color, stroke_width=width, stroke_linecap="round", stroke_linejoin="round")


def line(x1, y1, x2, y2, color=NAVY, width=STROKE) -> str:
    return svg_el("path", d=f"M{x1} {y1}L{x2} {y2}", fill="none", stroke=color, stroke_width=width, stroke_linecap="round", stroke_linejoin="round")


def rect(x, y, w, h, rx=6, color=NAVY, width=STROKE, fill="none") -> str:
    return svg_el("rect", x=x, y=y, width=w, height=h, rx=rx, fill=fill, stroke=color, stroke_width=width)


def circle(cx, cy, r, color=NAVY, width=STROKE, fill="none") -> str:
    return svg_el("circle", cx=cx, cy=cy, r=r, fill=fill, stroke=color, stroke_width=width)


def icon_elements(spec: IconSpec) -> list[str]:
    m = spec.motif
    n = spec.name.lower()
    accent = GOLD
    elems: list[str] = []

    if m == "chat":
        elems += [path("M14 18h34a8 8 0 0 1 8 8v13a8 8 0 0 1-8 8H31l-13 8v-8h-4a8 8 0 0 1-8-8V26a8 8 0 0 1 8-8Z"), circle(24, 33, 1.7, accent, 2, accent), circle(32, 33, 1.7, accent, 2, accent), circle(40, 33, 1.7, accent, 2, accent)]
    elif m == "robot":
        elems += [rect(14, 18, 36, 30, 8), line(32, 18, 32, 10, accent), circle(32, 8, 2.5, accent, 2, accent), circle(25, 32, 3, accent), circle(39, 32, 3, accent), path("M24 41h16"), line(9, 29, 14, 29, accent), line(50, 29, 55, 29, accent)]
    elif m == "brain":
        elems += [path("M24 47c-8-2-13-8-13-17 0-8 6-14 14-14 3-6 14-6 17 0 7 1 11 7 11 14 0 10-7 17-17 17"), path("M24 16v31M40 16v31", accent), path("M24 27h-7M24 37h-8M40 26h8M40 37h7", accent)]
    elif m == "spark":
        elems += [path("M32 8l4.5 15.5L52 28l-15.5 4.5L32 56l-4.5-23.5L12 28l15.5-4.5Z"), path("M50 9l1.8 6.2L58 17l-6.2 1.8L50 25l-1.8-6.2L42 17l6.2-1.8Z", accent)]
    elif m == "voice":
        elems += [rect(25, 10, 14, 30, 7), path("M17 29c0 9 6 16 15 16s15-7 15-16", accent), line(32, 45, 32, 54), line(24, 54, 40, 54), path("M49 20c3 3 5 7 5 12s-2 9-5 12", accent), path("M15 20c-3 3-5 7-5 12s2 9 5 12", accent)]
    elif m == "network":
        pts = [(17, 18), (47, 18), (32, 32), (19, 48), (47, 48)]
        elems += [line(17, 18, 32, 32), line(47, 18, 32, 32), line(32, 32, 19, 48), line(32, 32, 47, 48), line(19, 48, 47, 48, accent)]
        elems += [circle(x, y, 4, accent if i == 2 else NAVY, STROKE) for i, (x, y) in enumerate(pts)]
    elif m == "shield":
        elems += [path("M32 7l20 8v14c0 13-7 22-20 28-13-6-20-15-20-28V15Z"), path("M22 32l7 7 15-17", accent)]
    elif m == "search":
        elems += [circle(28, 28, 16), line(40, 40, 54, 54, accent), path("M21 28h14M28 21v14", accent if "filter" in n or "sort" in n else NAVY)]
    elif m == "document":
        elems += [path("M18 8h21l11 12v36H18Z"), path("M39 8v13h11", accent), line(25, 31, 42, 31), line(25, 40, 42, 40), line(25, 49, 35, 49, accent)]
    elif m == "person":
        elems += [circle(32, 22, 9), path("M15 54c3-12 11-18 17-18s14 6 17 18"), path("M25 42c3 3 11 3 14 0", accent)]
    elif m == "team":
        elems += [circle(24, 24, 7), circle(42, 25, 6, accent), path("M10 54c2-10 8-15 14-15s12 5 14 15"), path("M34 54c2-8 7-12 12-12 4 0 8 3 10 10", accent)]
    elif m == "map":
        if "texas" in n:
            elems += [path("M20 12l16 3 9 10-3 10 7 8-8 10-13-4-7 4-7-9 5-10-4-10Z"), circle(33, 32, 3, accent, 2, accent)]
        else:
            elems += [path("M32 57s17-17 17-33a17 17 0 1 0-34 0c0 16 17 33 17 33Z"), circle(32, 25, 6, accent)]
    elif m == "courthouse":
        elems += [path("M10 24h44L32 10Z"), line(14, 51, 50, 51), line(18, 28, 18, 48), line(29, 28, 29, 48), line(40, 28, 40, 48), line(51, 28, 51, 48), path("M24 19h16", accent)]
    elif m == "energy":
        if "pumpjack" in n or "well" in n:
            elems += [line(10, 52, 54, 52), line(22, 52, 34, 20), line(42, 52, 34, 20), path("M18 25h25l8 8"), circle(47, 33, 5, accent), path("M28 34h14"), line(34, 20, 34, 52, accent)]
        else:
            elems += [rect(16, 23, 32, 24, 5), path("M20 23c4-8 20-8 24 0", accent), line(13, 52, 51, 52), path("M23 47v-9M32 47v-14M41 47v-8", accent)]
    elif m == "flame":
        elems += [path("M32 8c8 9 15 18 15 29a15 15 0 0 1-30 0c0-8 5-13 10-20-1 8 5 11 5 11 3-5 3-12 0-20Z"), path("M32 40c-4 5-3 11 0 15 5-3 7-8 4-15", accent)]
    elif m == "gauge":
        elems += [path("M14 44a20 20 0 1 1 36 0"), line(32, 42, 43, 27, accent), circle(32, 42, 3, accent), path("M18 44h28")]
    elif m == "graph":
        elems += [line(12, 52, 52, 52), line(12, 52, 12, 12), path("M18 43l9-10 8 6 13-20", accent), path("M42 19h6v6", accent)]
    elif m == "money":
        if "bag" in n:
            elems += [path("M25 10h14l-4 8h-6Z", accent), path("M21 21c-7 7-11 15-11 24 0 8 8 12 22 12s22-4 22-12c0-9-4-17-11-24Z"), path("M28 30c0-3 2-5 5-5s5 2 5 5-2 4-5 4-5 1-5 4 2 5 5 5 5-2 5-5", accent), line(33, 24, 33, 46, accent)]
        else:
            elems += [circle(32, 32, 19), path("M27 25c0-4 3-6 7-6s7 3 7 6c0 5-4 6-8 7s-7 2-7 6 3 7 8 7 8-3 8-7", accent), line(34, 17, 34, 48, accent)]
    elif m == "calculator":
        elems += [rect(18, 9, 28, 46, 6), rect(23, 15, 18, 9, 2, accent), *[circle(x, y, 1.5, NAVY, 2, NAVY) for y in (32, 40, 48) for x in (25, 32, 39)]]
    elif m == "handshake":
        elems += [path("M10 36l10-10 10 10 8-8 16 14"), path("M22 38l8 8c3 3 7 3 10 0l5-5", accent), path("M14 48l10-10M50 48l-10-10")]
    elif m == "geology":
        elems += [path("M9 45c10-10 18-10 28 0s15 6 18 2"), path("M9 34c10-8 19-8 28 0s15 5 18 2", accent), path("M9 23c10-6 19-6 28 0s15 4 18 2"), line(20, 17, 44, 52)]
    elif m == "pen":
        elems += [path("M15 48l4-12 25-25 9 9-25 25Z"), line(38, 17, 47, 26, accent), path("M15 48l12-4")]
    elif m == "calendar":
        elems += [rect(12, 14, 40, 38, 5), line(21, 9, 21, 20, accent), line(43, 9, 43, 20, accent), line(12, 25, 52, 25), *[circle(x, y, 1.3, GOLD, 2, GOLD) for y in (34, 43) for x in (22, 32, 42)]]
    elif m == "royalty":
        elems += [path("M32 8s16 18 16 31a16 16 0 0 1-32 0C16 26 32 8 32 8Z"), path("M26 38h12M26 45h12", accent)]
    elif m == "legal":
        if "gavel" in n:
            elems += [rect(15, 13, 20, 8, 2), rect(30, 24, 20, 8, 2, accent), line(27, 20, 43, 36), line(17, 53, 47, 53)]
        else:
            elems += [line(32, 11, 32, 52), line(17, 20, 47, 20), path("M17 20l-8 17h16Z", accent), path("M47 20l-8 17h16Z", accent), line(20, 52, 44, 52)]
    elif m == "time":
        if "hourglass" in n:
            elems += [path("M20 10h24M20 54h24M22 10c0 15 20 15 20 29 0 7-5 11-10 15-5-4-10-8-10-15 0-14 20-14 20-29"), line(27, 25, 37, 25, accent)]
        else:
            elems += [circle(32, 32, 21), line(32, 18, 32, 33), line(32, 33, 43, 39, accent)]
    elif m == "email":
        elems += [rect(10, 17, 44, 30, 5), path("M12 21l20 15 20-15", accent)]
    elif m == "media":
        elems += [rect(11, 17, 34, 30, 5), path("M45 29l10-7v20l-10-7Z", accent), path("M27 25l9 7-9 7Z", accent)]
    elif m == "bell":
        elems += [path("M20 45h24l-3-5V29a9 9 0 0 0-18 0v11Z"), path("M28 49a4 4 0 0 0 8 0", accent)]
    elif m == "database":
        elems += [path("M14 18c0-5 8-9 18-9s18 4 18 9-8 9-18 9-18-4-18-9Z"), path("M14 18v24c0 5 8 9 18 9s18-4 18-9V18"), path("M14 30c0 5 8 9 18 9s18-4 18-9", accent)]
    elif m == "clipboard":
        elems += [rect(17, 13, 30, 42, 5), rect(25, 8, 14, 10, 4, accent), line(25, 29, 40, 29), line(25, 39, 40, 39), path("M23 29l2 2 4-5", accent)]
    elif m == "transfer":
        elems += [path("M20 16h24v16"), path("M44 16l-8 8", accent), path("M44 16l-8-8", accent), path("M44 48H20V32"), path("M20 48l8-8", accent), path("M20 48l8 8", accent)]
    elif m == "navigation":
        if "home" in n:
            elems += [path("M10 32L32 13l22 19"), path("M17 29v25h30V29"), rect(27, 39, 10, 15, 2, accent)]
        else:
            elems += [rect(14, 14, 36, 36, 8), circle(32, 32, 7, accent), path("M32 19v-6M32 51v-6M19 32h-6M51 32h-6")]
    elif m == "trust":
        if "star" in n or "rated" in n:
            elems += [path("M32 9l6.5 13 14.5 2-10.5 10 2.5 14.5L32 41l-13 7.5L21.5 34 11 24l14.5-2Z"), path("M18 54h28", accent)]
        else:
            elems += [path("M18 48h28l4-19-12 7-6-16-6 16-12-7Z"), path("M20 54h24", accent)]
    elif m == "education":
        if "book" in n or "library" in n:
            elems += [path("M14 14h17c4 0 7 3 7 7v35c0-4-3-7-7-7H14Z"), path("M50 14H37c-4 0-7 3-7 7v35c0-4 3-7 7-7h13Z", accent)]
        else:
            elems += [path("M8 24l24-12 24 12-24 12Z"), path("M18 30v12c7 6 21 6 28 0V30", accent)]
    elif m == "agent":
        initials = "".join(p[0] for p in re.split(r"[^A-Za-z]+", spec.name) if p)[:2].upper() or "A"
        elems += [path("M32 7l20 8v18c0 11-8 19-20 24-12-5-20-13-20-24V15Z"), circle(32, 25, 7, accent), path("M20 48c2-9 7-14 12-14s10 5 12 14", accent), f'<text x="32" y="29" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" font-weight="700" fill="{NAVY}">{initials}</text>']
    elif m == "marketing":
        elems += [path("M12 36h10l24 12V16L22 28H12Z"), path("M22 36v12h8l-4-12", accent), path("M50 25c3 2 4 5 4 7s-1 5-4 7", accent)]
    elif m == "status":
        if "error" in n or "rejected" in n:
            elems += [circle(32, 32, 22), line(24, 24, 40, 40, accent), line(40, 24, 24, 40, accent)]
        elif "warning" in n:
            elems += [path("M32 9l24 43H8Z"), line(32, 24, 32, 38, accent), circle(32, 46, 1.7, accent, 2, accent)]
        elif "loading" in n or "sync" in n or "refresh" in n:
            elems += [path("M48 25a18 18 0 0 0-31-8"), path("M16 17v12h12", accent), path("M16 39a18 18 0 0 0 31 8"), path("M48 47V35H36", accent)]
        else:
            elems += [circle(32, 32, 22), path("M21 33l8 8 16-18", accent)]
    else:
        elems += [path("M32 8l4.5 15.5L52 28l-15.5 4.5L32 56l-4.5-23.5L12 28l15.5-4.5Z"), circle(32, 32, 4, accent)]

    # Small category signature: subtle gold datum line for technical MRX feel.
    if m not in {"status", "shield", "map"}:
        elems.append(path("M14 57h36", accent, 1.8))
    return elems


def svg_for(spec: IconSpec, optimized: bool = False) -> str:
    title = html.escape(spec.name)
    elems = "\n  ".join(icon_elements(spec))
    comment = "" if optimized else f"\n  <title>{title}</title>\n  <desc>MRX custom icon for {title}</desc>"
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" '
        f'fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
        f'{comment}\n  {elems}\n</svg>\n'
    )


def draw_png(spec: IconSpec, size: int) -> Image.Image:
    # Direct PNG companion drawn with the same icon motif language. Transparent background.
    scale = size / SIZE
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    def sc(v: float) -> float:
        return v * scale

    def ln(points, color=NAVY, width=STROKE):
        d.line([(sc(x), sc(y)) for x, y in points], fill=color, width=max(1, round(width * scale)), joint="curve")

    def rr(x, y, w, h, r=6, outline=NAVY, width=STROKE):
        d.rounded_rectangle([sc(x), sc(y), sc(x + w), sc(y + h)], radius=sc(r), outline=outline, width=max(1, round(width * scale)))

    def cir(x, y, r, outline=NAVY, width=STROKE):
        d.ellipse([sc(x - r), sc(y - r), sc(x + r), sc(y + r)], outline=outline, width=max(1, round(width * scale)))

    m = spec.motif
    n = spec.name.lower()
    # Use a compact motif drawing for PNG exports; SVG remains the canonical master.
    if m in {"chat"}:
        rr(8, 18, 48, 30, 8); ln([(18, 48), (18, 56), (30, 48)], GOLD); [cir(x, 33, 1.7, GOLD, 2) for x in (24, 32, 40)]
    elif m in {"document", "clipboard"}:
        rr(18, 9, 30, 46, 5); ln([(38, 9), (48, 20), (38, 20), (38, 9)], GOLD); ln([(25, 32), (42, 32)]); ln([(25, 41), (42, 41)]); ln([(25, 50), (35, 50)], GOLD)
    elif m in {"search"}:
        cir(28, 28, 16); ln([(40, 40), (54, 54)], GOLD)
    elif m in {"shield", "trust"}:
        ln([(32, 7), (52, 15), (52, 29), (45, 44), (32, 57), (19, 44), (12, 29), (12, 15), (32, 7)]); ln([(22, 32), (29, 39), (44, 22)], GOLD)
    elif m in {"person", "agent"}:
        cir(32, 23, 9); ln([(15, 54), (19, 45), (26, 38), (32, 36), (38, 38), (45, 45), (49, 54)]); ln([(25, 43), (32, 47), (39, 43)], GOLD)
    elif m in {"team"}:
        cir(24, 24, 7); cir(42, 25, 6, GOLD); ln([(10, 54), (15, 43), (24, 39), (34, 43), (38, 54)]); ln([(34, 54), (40, 43), (50, 42), (56, 52)], GOLD)
    elif m in {"map"}:
        ln([(32, 57), (20, 43), (15, 30), (17, 19), (25, 11), (36, 9), (47, 16), (50, 28), (45, 43), (32, 57)]); cir(32, 25, 6, GOLD)
    elif m in {"energy"}:
        ln([(10, 52), (54, 52)]); ln([(22, 52), (34, 20), (42, 52)]); ln([(18, 25), (43, 25), (51, 33)], GOLD); cir(47, 33, 5, GOLD)
    elif m in {"graph"}:
        ln([(12, 52), (52, 52)]); ln([(12, 52), (12, 12)]); ln([(18, 43), (27, 33), (35, 39), (48, 19)], GOLD); ln([(42, 19), (48, 19), (48, 25)], GOLD)
    elif m in {"money", "calculator"}:
        cir(32, 32, 19); ln([(34, 17), (34, 48)], GOLD); ln([(27, 25), (33, 21), (40, 25), (34, 32), (27, 38), (34, 45), (42, 38)], GOLD)
    elif m in {"calendar", "time"}:
        rr(12, 14, 40, 38, 5); ln([(21, 9), (21, 20)], GOLD); ln([(43, 9), (43, 20)], GOLD); ln([(12, 25), (52, 25)])
    elif m in {"legal"}:
        ln([(32, 11), (32, 52)]); ln([(17, 20), (47, 20)]); ln([(17, 20), (9, 37), (25, 37), (17, 20)], GOLD); ln([(47, 20), (39, 37), (55, 37), (47, 20)], GOLD); ln([(20, 52), (44, 52)])
    elif m in {"status"}:
        cir(32, 32, 22); ln([(21, 33), (29, 41), (45, 23)], GOLD)
    else:
        # Spark-like default with family signature.
        ln([(32, 8), (37, 24), (52, 28), (37, 33), (32, 56), (27, 33), (12, 28), (27, 24), (32, 8)]); cir(32, 32, 4, GOLD)
    ln([(14, 57), (50, 57)], GOLD, 1.8)
    return img


def component_for(spec: IconSpec, svg: str) -> str:
    inner = re.sub(r"^<svg[^>]*>|</svg>\s*$", "", svg.strip(), flags=re.S).strip()
    inner = re.sub(r"\s+(width|height)=\"64\"", "", inner)
    inner = inner.replace("stroke-linecap", "strokeLinecap").replace("stroke-linejoin", "strokeLinejoin").replace("stroke-width", "strokeWidth")
    inner = inner.replace("text-anchor", "textAnchor").replace("font-family", "fontFamily").replace("font-size", "fontSize").replace("font-weight", "fontWeight")
    return f"""import * as React from 'react';

export interface {spec.component}Props extends React.SVGProps<SVGSVGElement> {{
  title?: string;
}}

export function {spec.component}({{ title = '{spec.name}', ...props }}: {spec.component}Props) {{
  return (
    <svg viewBox=\"0 0 64 64\" fill=\"none\" aria-label={{title}} role=\"img\" {{...props}}>
      <title>{{title}}</title>
      {inner}
    </svg>
  );
}}

export default {spec.component};
"""


def clean() -> None:
    # Only remove generated design-system surfaces, not unrelated MRX homepage assets.
    if PUBLIC_ROOT.exists():
        shutil.rmtree(PUBLIC_ROOT)
    if REACT_ROOT.exists():
        shutil.rmtree(REACT_ROOT)
    PUBLIC_ROOT.mkdir(parents=True, exist_ok=True)
    REACT_ROOT.mkdir(parents=True, exist_ok=True)


def generate() -> None:
    clean()
    specs: list[IconSpec] = []
    for category, names in CATEGORIES.items():
        for name in names:
            slug = slugify(name)
            component = f"Mrx{pascal(category)}{pascal(name)}Icon"
            specs.append(IconSpec(category, name, slug, component, choose_motif(category, name)))

    manifest = {
        "name": "MRX Icon Library",
        "version": "1.0.0",
        "style": {
            "stroke": STROKE,
            "primary": NAVY,
            "accent": GOLD,
            "background": "transparent",
            "viewBox": "0 0 64 64",
        },
        "counts": {"categories": len(CATEGORIES), "icons": len(specs)},
        "categories": {},
    }

    index_exports: list[str] = []
    preview_cards: list[str] = []
    css_lines = [
        ":root { --mrx-navy: #0B1F3A; --mrx-gold: #C8A24A; }",
        ".mrx-icon { width: 1.5rem; height: 1.5rem; color: var(--mrx-navy); }",
        ".mrx-icon--gold { color: var(--mrx-gold); }",
    ]

    for spec in specs:
        cat_dir = PUBLIC_ROOT / spec.category
        svg_dir = cat_dir / "svg"
        opt_dir = cat_dir / "optimized"
        png_dir = cat_dir / "png"
        react_dir = REACT_ROOT / pascal(spec.category)
        for d in (svg_dir, opt_dir, png_dir, react_dir):
            d.mkdir(parents=True, exist_ok=True)

        master = svg_for(spec, optimized=False)
        optimized = svg_for(spec, optimized=True)
        (svg_dir / f"{spec.slug}.svg").write_text(master, encoding="utf-8")
        (opt_dir / f"{spec.slug}.svg").write_text(optimized, encoding="utf-8")
        for size in (64, 128, 256, 512):
            size_dir = png_dir / str(size)
            size_dir.mkdir(parents=True, exist_ok=True)
            draw_png(spec, size).save(size_dir / f"{spec.slug}.png")

        component_path = react_dir / f"{spec.component}.tsx"
        component_path.write_text(component_for(spec, optimized), encoding="utf-8")
        index_exports.append(f"export {{ {spec.component} }} from './{pascal(spec.category)}/{spec.component}';")

        manifest["categories"].setdefault(spec.category, []).append({
            "name": spec.name,
            "slug": spec.slug,
            "motif": spec.motif,
            "svg": f"/assets/icons/{spec.category}/svg/{spec.slug}.svg",
            "optimizedSvg": f"/assets/icons/{spec.category}/optimized/{spec.slug}.svg",
            "png": {str(s): f"/assets/icons/{spec.category}/png/{s}/{spec.slug}.png" for s in (64, 128, 256, 512)},
            "react": f"/assets/icons/react/{pascal(spec.category)}/{spec.component}.tsx",
        })
        preview_cards.append(
            f'<article class="icon-card" data-category="{spec.category}">'
            f'<img src="../{spec.category}/optimized/{spec.slug}.svg" alt="" />'
            f'<strong>{html.escape(spec.name)}</strong><span>{spec.category}/{spec.slug}</span></article>'
        )

    (REACT_ROOT / "index.ts").write_text("\n".join(index_exports) + "\n", encoding="utf-8")
    (PUBLIC_ROOT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    (PUBLIC_ROOT / "icon-library.css").write_text("\n".join(css_lines) + "\n", encoding="utf-8")

    naming = f"""# MRX Icon Naming Convention

Generated by `scripts/generate_mrx_icon_library.py`.

## Style

- 64×64 SVG master viewBox
- Rounded line icons
- 2.5px canonical stroke
- Primary navy `{NAVY}`
- Secondary gold `{GOLD}`
- Transparent background
- No gradients, shadows, or enclosing backgrounds

## Paths

- SVG master: `/assets/icons/<category>/svg/<icon-name>.svg`
- Optimized web SVG: `/assets/icons/<category>/optimized/<icon-name>.svg`
- PNG: `/assets/icons/<category>/png/<size>/<icon-name>.png`
- React component source: `/assets/icons/react/<Category>/<MrxCategoryIconNameIcon>.tsx`

## Slugs

Use lowercase kebab-case based on the plain-English icon name, e.g. `ai/ai-chat-bubble`, `valuation/money-bag`, `homepage/ownership-research`.

## Counts

- Categories: {len(CATEGORIES)}
- Icons: {len(specs)}
- Per icon: SVG master, optimized SVG, PNG 64/128/256/512, React component.
"""
    (PUBLIC_ROOT / "MRX_ICON_NAMING.md").write_text(naming, encoding="utf-8")

    preview_dir = PUBLIC_ROOT / "preview"
    preview_dir.mkdir(parents=True, exist_ok=True)
    preview_css = f"""
:root {{ color-scheme: light; --navy: {NAVY}; --gold: {GOLD}; --paper: #f7f4ec; }}
* {{ box-sizing: border-box; }}
body {{ margin: 0; font: 14px/1.45 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: var(--paper); color: var(--navy); }}
header {{ padding: 48px; background: #fff; border-bottom: 1px solid rgba(11,31,58,.12); }}
h1 {{ margin: 0 0 8px; font-size: clamp(32px, 5vw, 64px); letter-spacing: -.06em; }}
p {{ max-width: 820px; color: rgba(11,31,58,.72); }}
.category {{ padding: 32px 48px; }}
.category h2 {{ text-transform: uppercase; letter-spacing: .14em; color: var(--gold); font-size: 12px; }}
.grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 14px; }}
.icon-card {{ min-height: 150px; display: flex; flex-direction: column; gap: 10px; align-items: flex-start; justify-content: center; padding: 18px; border: 1px solid rgba(11,31,58,.12); border-radius: 18px; background: rgba(255,255,255,.86); }}
.icon-card img {{ width: 48px; height: 48px; }}
.icon-card strong {{ font-size: 14px; }}
.icon-card span {{ color: rgba(11,31,58,.58); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; }}
"""
    (preview_dir / "styles.css").write_text(preview_css, encoding="utf-8")

    grouped = []
    for category in CATEGORIES:
        cards = "\n".join(c for c in preview_cards if f'data-category="{category}"' in c)
        grouped.append(f'<section class="category"><h2>{category}</h2><div class="grid">{cards}</div></section>')
    preview_html = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>MRX Icon Library Preview</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <header>
    <h1>MRX Icon Library</h1>
    <p>Official generated MRX icon family: premium, technical, trustworthy navy/gold line icons for the marketing site, AI Underwriter, Command Center, reports, and future SaaS products.</p>
    <p><strong>{len(specs)} icons</strong> across <strong>{len(CATEGORIES)} categories</strong>. SVG masters, optimized web SVGs, transparent PNG exports, and React components are generated from one source of truth.</p>
  </header>
  {''.join(grouped)}
</body>
</html>
"""
    (preview_dir / "index.html").write_text(preview_html, encoding="utf-8")

    print(json.dumps({"categories": len(CATEGORIES), "icons": len(specs), "publicRoot": str(PUBLIC_ROOT), "reactRoot": str(REACT_ROOT)}, indent=2))


if __name__ == "__main__":
    generate()

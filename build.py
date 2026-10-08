#!/usr/bin/env python3
"""
build.py — CP Club VJTI Blog Builder
Converts blogs/*.md → docs/ static HTML for GitHub Pages.

Usage:
    python build.py [--base-url /repo-name]

Options:
    --base-url  GitHub Pages base URL path (e.g., /CP_Club_VJTI_Blogs).
                Leave empty if served from the root of a custom domain.

Output: docs/ directory ready to be served by GitHub Pages.
"""

import argparse
import html
import json
import math
import os
import re
import shutil
import sys
from datetime import datetime
from pathlib import Path

# ── Check dependencies ─────────────────────────────────────────
try:
    import markdown
    import yaml
    from jinja2 import Environment, FileSystemLoader, select_autoescape
except ImportError:
    print("[ERROR] Missing dependencies. Run:  pip install -r requirements.txt")
    sys.exit(1)

# ── Paths ──────────────────────────────────────────────────────
ROOT = Path(__file__).parent.resolve()
BLOGS_DIR = ROOT / "blogs"
DOCS_DIR = ROOT / "docs"
TEMPLATES_DIR = ROOT / "templates"
STATIC_SRC = ROOT / "static"
STATIC_DEST = DOCS_DIR / "static"
BLOGS_DEST = DOCS_DIR / "blogs"

# ── Markdown extensions ────────────────────────────────────────
MD_EXTENSIONS = [
    "fenced_code",
    "tables",
    "toc",
    "codehilite",
    "nl2br",
    "attr_list",
    "meta",
    "smarty",
]

MD_EXTENSION_CONFIGS = {
    "codehilite": {
        "css_class": "highlight",
        "guess_lang": False,
    },
    "toc": {
        "permalink": True,
        "permalink_class": "toc-link",
    },
}

# ── Jinja2 custom filter ───────────────────────────────────────
def regex_match(value, pattern):
    return bool(re.match(pattern, str(value)))

# ── Helpers ────────────────────────────────────────────────────
def parse_frontmatter(text: str) -> tuple[dict, str]:
    """Extract YAML frontmatter and body from a markdown string."""
    if text.startswith("---"):
        parts = text.split("---", 2)
        if len(parts) >= 3:
            try:
                meta = yaml.safe_load(parts[1]) or {}
                return meta, parts[2].strip()
            except yaml.YAMLError:
                pass
    return {}, text.strip()


def slugify(filename: str) -> str:
    """blog1_IntroToDP.md → blog1_IntroToDP"""
    return Path(filename).stem


def estimate_read_time(text: str) -> int:
    """Estimate reading time in minutes (avg 200 wpm)."""
    words = len(text.split())
    return max(1, math.ceil(words / 200))


def plain_text(html: str) -> str:
    """Strip HTML tags for excerpt generation."""
    return re.sub(r"<[^>]+>", "", html).strip()


def make_excerpt(body_html: str, max_chars: int = 160) -> str:
    text = plain_text(body_html)
    text = re.sub(r"\s+", " ", text)
    if len(text) <= max_chars:
        return text
    cut = text[:max_chars].rsplit(" ", 1)[0]
    return cut + "…"


def add_target_blank(html: str) -> str:
    """Make markdown-generated links open in a new tab."""
    def repl(match: re.Match) -> str:
        tag = match.group(0)
        if ' target="' not in tag:
            tag = tag[:-1] + ' target="_blank">'
        if ' rel="' not in tag:
            tag = tag[:-1] + ' rel="noopener noreferrer">'
        return tag

    return re.sub(r'<a\b[^>]*href="[^"]*"[^>]*>', repl, html)


DISPLAY_MATH_RE = re.compile(r"\$\$(.+?)\$\$", re.DOTALL)


def protect_display_math(text: str) -> tuple[str, list[str]]:
    """Shield $$...$$ blocks from Markdown extensions such as nl2br."""
    blocks: list[str] = []

    def replace(match: re.Match) -> str:
        token = f"MATHBLOCKPLACEHOLDER{len(blocks)}"
        # Escape for HTML now; the browser decodes it back to TeX before MathJax runs.
        blocks.append(html.escape(match.group(0), quote=False))
        return f"\n\n{token}\n\n"

    return DISPLAY_MATH_RE.sub(replace, text), blocks


def restore_display_math(html_body: str, blocks: list[str]) -> str:
    """Replace protected math placeholders after Markdown conversion."""
    for index, block in enumerate(blocks):
        token = f"MATHBLOCKPLACEHOLDER{index}"
        html_body = html_body.replace(f"<p>{token}</p>", block)
    return html_body


def format_date(raw) -> str:
    """Normalize date to YYYY-MM-DD string."""
    if not raw:
        return ""
    if isinstance(raw, datetime):
        return raw.strftime("%Y-%m-%d")
    return str(raw)


def page_base(raw_base: str, page_kind: str) -> str:
    """Return a relative or absolute base URL for a given page kind."""
    raw_base = raw_base.rstrip("/")
    if raw_base:
        return raw_base
    return "." if page_kind == "home" else ".."


def collect_blogs() -> list[dict]:
    """Scan blogs/ directory and parse all .md files (excluding home_page.md)."""
    blogs = []
    if not BLOGS_DIR.exists():
        return blogs

    md_converter = markdown.Markdown(
        extensions=MD_EXTENSIONS,
        extension_configs=MD_EXTENSION_CONFIGS,
    )

    for md_file in sorted(BLOGS_DIR.glob("*.md")):
        if md_file.stem == "home_page":
            continue

        text = md_file.read_text(encoding="utf-8")
        meta, body = parse_frontmatter(text)

        protected_body, math_blocks = protect_display_math(body)
        md_converter.reset()
        html_body = md_converter.convert(protected_body)
        html_body = add_target_blank(restore_display_math(html_body, math_blocks))

        slug = slugify(md_file.name)

        # Infer title: frontmatter > first H1 > slug
        title = meta.get("title", "")
        if not title:
            h1 = re.search(r"^#\s+(.+)$", body, re.MULTILINE)
            title = h1.group(1).strip() if h1 else slug.replace("_", " ").title()

        tags = meta.get("tags", [])
        if isinstance(tags, str):
            tags = [t.strip() for t in tags.split(",")]

        blogs.append({
            "slug": slug,
            "filename": md_file.name,
            "title": title,
            "date": format_date(meta.get("date")),
            "author": meta.get("author", "CP Club VJTI"),
            "tags": tags,
            "description": meta.get("description", ""),
            "math": bool(meta.get("math", False)),
            "excerpt": make_excerpt(html_body),
            "content": html_body,
            "read_time": estimate_read_time(body),
        })

    return blogs


def render_home(env, all_blogs, all_tags, site_base, year) -> str:
    """Render home_page.md into the index.html template."""
    home_md_path = BLOGS_DIR / "home_page.md"
    home_content = ""

    if home_md_path.exists():
        text = home_md_path.read_text(encoding="utf-8")
        _, body = parse_frontmatter(text)
        md = markdown.Markdown(extensions=["fenced_code", "tables", "nl2br", "smarty"])
        home_content = add_target_blank(md.convert(body))
    
    tmpl = env.get_template("index.html")
    return tmpl.render(
        home_content=home_content,
        all_blogs=all_blogs,
        all_tags=all_tags,
        active_page="home",
        active_slug=None,
        site_base=site_base,
        year=year,
    )


def render_blog(env, blog, all_blogs, all_tags, site_base, year, idx) -> str:
    """Render an individual blog post page."""
    prev_blog = all_blogs[idx - 1] if idx > 0 else None
    next_blog = all_blogs[idx + 1] if idx < len(all_blogs) - 1 else None

    tmpl = env.get_template("blog.html")
    return tmpl.render(
        blog=blog,
        prev_blog=prev_blog,
        next_blog=next_blog,
        all_blogs=all_blogs,
        all_tags=all_tags,
        active_page="blog",
        active_slug=blog["slug"],
        site_base=site_base,
        year=year,
    )


def write_index_json(blogs):
    """Write the search manifest blogs/index.json."""
    manifest = [
        {
            "slug": b["slug"],
            "title": b["title"],
            "date": b["date"],
            "author": b["author"],
            "tags": b["tags"],
            "description": b["description"],
            "excerpt": b["excerpt"],
            "url": f"blogs/{b['slug']}.html",
        }
        for b in blogs
    ]
    BLOGS_DEST.mkdir(parents=True, exist_ok=True)
    with open(BLOGS_DEST / "index.json", "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    print(f"  ✓ blogs/index.json ({len(manifest)} entries)")


def copy_static():
    """Copy static/ → docs/static/"""
    if STATIC_SRC.exists():
        if STATIC_DEST.exists():
            shutil.rmtree(STATIC_DEST)
        shutil.copytree(STATIC_SRC, STATIC_DEST)
        print(f"  ✓ static/ → docs/static/")


def main():
    parser = argparse.ArgumentParser(description="CP Club VJTI Blog Builder")
    parser.add_argument(
        "--base-url",
        default="",
        help="GitHub Pages base URL path (e.g., /CP_Club_VJTI_Blogs). "
             "Leave empty for custom domain root.",
    )
    args = parser.parse_args()
    site_root = args.base_url.rstrip("/")
    home_base = page_base(site_root, "home")
    blog_base = page_base(site_root, "blog")
    year = datetime.now().year

    print("\n🔨 CP Club VJTI Blog Builder")
    print(f"   Base URL : '{site_root or '.'}'")
    print(f"   Output   : {DOCS_DIR}\n")

    # ── Clean output dir ───────────────────────────────────────
    if DOCS_DIR.exists():
        # Remove only HTML files and search index; keep .nojekyll etc.
        for p in DOCS_DIR.rglob("*.html"):
            p.unlink()
        index_json = DOCS_DIR / "blogs" / "index.json"
        if index_json.exists():
            index_json.unlink()

    DOCS_DIR.mkdir(parents=True, exist_ok=True)
    BLOGS_DEST.mkdir(parents=True, exist_ok=True)

    # GitHub Pages: .nojekyll prevents Jekyll processing
    (DOCS_DIR / ".nojekyll").touch()

    # ── Jinja2 env ─────────────────────────────────────────────
    env = Environment(
        loader=FileSystemLoader(str(TEMPLATES_DIR)),
        autoescape=select_autoescape(["html"]),
    )
    env.tests["regex_match"] = regex_match
    env.filters["regex_match"] = regex_match

    # ── Collect blogs ──────────────────────────────────────────
    print("📂 Scanning blogs/...")
    blogs = collect_blogs()
    all_tags = sorted(set(tag for b in blogs for tag in b["tags"]))
    print(f"   Found {len(blogs)} blog(s), {len(all_tags)} tag(s)\n")

    # ── Copy static ────────────────────────────────────────────
    print("📁 Copying static assets...")
    copy_static()

    # ── Write search index ─────────────────────────────────────
    print("\n🔍 Writing search index...")
    write_index_json(blogs)

    # ── Render home page ───────────────────────────────────────
    print("\n🏠 Rendering home page...")
    html = render_home(env, blogs, all_tags, home_base, year)
    out = DOCS_DIR / "index.html"
    out.write_text(html, encoding="utf-8")
    print(f"  ✓ docs/index.html")

    # ── Render blog posts ──────────────────────────────────────
    print("\n📝 Rendering blog posts...")
    for idx, blog in enumerate(blogs):
        html = render_blog(env, blog, blogs, all_tags, blog_base, year, idx)
        out = BLOGS_DEST / f"{blog['slug']}.html"
        out.write_text(html, encoding="utf-8")
        print(f"  ✓ docs/blogs/{blog['slug']}.html  [{blog['read_time']} min read]")

    print(f"\n✅ Build complete! {len(blogs) + 1} page(s) written to docs/\n")


if __name__ == "__main__":
    main()

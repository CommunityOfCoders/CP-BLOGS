# CP Club VJTI Blog

A competitive programming blog for CP Club VJTI, featuring tutorial-style posts, problem-solving write-ups, and curated practice links. The site is built from Markdown files in `blogs/` and published through GitHub Pages.

## ✨ Features

- 🖤 Dark/light theme toggle
- 🔍 Client-side search across all blogs
- 🏷️ Tag filtering
- 📖 Reading progress bar on each post
- 📱 Responsive layout with sidebar navigation
- ⚡ Auto-deploy via GitHub Actions on every push to `main`

---

## 🚀 Quick Start

### 1. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 2. Add your logo

Replace the placeholder at `static/assets/logo_placeholder.svg` with your actual logo image.

### 3. Write or update posts

Create or edit markdown files in the `blogs/` folder using the naming convention:

```
blogs/blog1_YourBlogTitle.md
blogs/blog2_AnotherBlog.md
```

Each file supports optional YAML frontmatter at the top:

```yaml
---
title: Your Blog Title
date: 2024-01-15
author: Your Name
tags: [Tag1, Tag2, Tag3]
description: A short summary (shown in search results and blog cards).
---

# Your Blog Title

Start writing content here...
```

### 4. Edit the homepage

Edit `blogs/home_page.md` to customize the landing page content for CP Club VJTI.

### 5. Build locally

```bash
# If repo name is e.g. CP_Club_VJTI_Blogs (served at username.github.io/CP_Club_VJTI_Blogs):
python build.py --base-url /CP_Club_VJTI_Blogs

# If served from a custom domain root:
python build.py
```

Open `docs/index.html` in a browser to preview.

---

## 🌐 GitHub Pages Setup (one-time)

1. Push this repo to GitHub.
2. Go to **Settings → Pages**.
3. Set **Source** to: `Deploy from a branch` → Branch: `main` → Folder: `/docs`.
4. Click **Save**.

After the first push, GitHub Actions will auto-build and your site will be live at:
`https://<username>.github.io/<repo-name>/`

## 🧭 Content Rules

The repository also follows the contribution process in `CONTRIBUTING.md`:

- Only CP Club members should contribute for now.
- For problem-solution posts, the only required change is adding the solution link next to the problem link in the relevant markdown file.
- Keep problem code clean and short, and avoid adding extra template sections.
- Open a PR after committing and mention the related issue.

---

## 📁 Project Structure

```
CP_Club_VJTI_Blogs/
├── blogs/                  ← Put your .md files here
│   ├── home_page.md        ← Homepage content
│   ├── blog1_IntroToDP.md
│   └── blog2_GraphAlgorithms.md
├── templates/              ← Jinja2 HTML templates (edit for layout tweaks)
│   ├── base.html
│   ├── index.html
│   └── blog.html
├── static/                 ← CSS, JS, assets
│   ├── style.css
│   ├── search.js
│   ├── theme.js
│   └── assets/
│       └── logo_placeholder.svg  ← Replace with your actual logo
├── build.py                ← Build script
├── requirements.txt
└── .github/
    └── workflows/
        └── deploy.yml      ← Auto-deploy on push
```

## 🎨 Customization

| What | Where |
|---|---|
| Colors & fonts | `static/style.css` → `:root` CSS variables |
| Logo | Replace `static/assets/logo_placeholder.svg` |
| GitHub link in footer | `templates/base.html` → footer section |
| Blog layout | `templates/blog.html` |
| Home page layout | `templates/index.html` |

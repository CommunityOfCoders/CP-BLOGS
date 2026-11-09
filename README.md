# CP Club Website

The official website of the **CP Club (VJTI)** — a competitive programming community hub featuring a live leaderboard, contest tracker, member profiles, CSES progress tracking, and a blog with editorials and tutorials. Developed by **COC**.

Built with [Next.js](https://nextjs.org), Tailwind CSS, Framer Motion, and a cyberpunk / matrix-green theme. 💚

---

## ✨ Features

- 🏆 **Leaderboard**: ranks club members using their Codeforces and LeetCode ratings
- 📅 **Contests**: upcoming and past contests, plus a calendar view (powered by the Codolio contest API)
- 🥇 **Past Contest Leaderboards**: club members' standings for past Codeforces and LeetCode contests
- 👤 **Member Profiles**: LeetCode and Codeforces stats and contest history for each member
- 📊 **CSES Tracker**: section-wise progress of the CSES problem set for any user
- 📝 **Blogs & Editorials**: Markdown-based posts with GitHub-flavored Markdown, math (KaTeX), and syntax-friendly code blocks
- 🔍 Client-side search and 🏷️ tag filtering on blogs
- 🎨 Glassmorphism UI with animated binary rain, glow effects, and loading states
- ⚡ **Daily Questions & Leaderboard**: 6 curated daily problems across rating tiers, interactive calendar, streak tracking, and automated Codeforces solve sync

---

## 🛠️ Tech Stack

| Area | Tools |
|---|---|
| Framework | Next.js (App Router) |
| Styling | Tailwind CSS, shadcn/ui |
| Animation | Framer Motion |
| Icons | lucide-react |
| Data fetching | axios, Next.js API routes |
| Scraping | Puppeteer (CSES) |
| Blogs | react-markdown, remark-gfm, remark-math, rehype-katex |
| Dates | dayjs |

---

## ⚡ Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd <your-repo-folder>
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

### 3. Run the development server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the result. 🎉

The page auto-updates as you edit files.

### 4. Create New branch 

Create and switch branch to add new feature or fix bug

```
git checkout -b fix-bug/add-feature
```

---

## 📁 Project Structure

```
.
├── app/
├── components/              ← Navbar, Footer, Leaderboard, Profile, BlogsClient, ui/
├── content/
│   └── blogs/               ← Markdown blog posts ✍️
├── lib/                     ← Helpers (blogs, getLeetCodeData, getCodeForcesData)
├── json/
│   ├── members.json         ← Club members & their handles
│   └── cses_problems.json   ← CSES problem list by section

```

---

## ✍️ How to Add a Blog

Blogs are written as **Markdown files** inside the `content/blogs/` folder and are picked up automatically by the site.

### 1. Create a file

Use the naming convention:

```
content/blogs/blog1_YourBlogTitle.md
content/blogs/blog2_AnotherBlog.md
```

### 2. Add frontmatter at the top

```yaml
---
layout: post
title: Your Blog Title
date: 2026-01-15 (YYYY-MM-DD)
author: Your Name
categories: [Competitive Programming, Algorithms]
tags: [DP, Graphs, Beginner]
description: A short summary (shown in search results and blog cards).
---

# Your Blog Title

Start writing content here...
```

### 3. Write your content

Supported out of the box:

-  GitHub-flavored Markdown (tables, task lists, strikethrough)
-  Math using KaTeX, e.g. `$O(n \log n)$`
-  Fenced code blocks (```` ```cpp ````)
-  Images, blockquotes, and links

### 4. Preview locally

```bash
npm run dev
```

Then open [http://localhost:3000/blogs](http://localhost:3000/blogs) to see your post. 👀

### 5. Open a PR 🎉

Commit, push, and open a Pull Request (see the contribution guide below).

---

## 🤝 How to Contribute

Please Read [CONTRIBUTING.md](CONTRIBUTING.md)

---

## 🌐 Deployment

The easiest way to deploy is the [Vercel Platform](https://vercel.com/new). See the [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

Happy Coding! 💻💚
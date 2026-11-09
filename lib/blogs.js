import fs from "fs";
import path from "path";
import matter from "gray-matter";

const blogsDirectory = path.join(process.cwd(), "content", "blogs");

export function getAllBlogs() {
  if (!fs.existsSync(blogsDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(blogsDirectory);
  const allBlogs = fileNames
    .filter((fileName) => fileName.endsWith(".md"))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, "");
      const fullPath = path.join(blogsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, "utf8");
      const { data, content } = matter(fileContents);

      // Estimate reading time (~100 words per minute)
      const wordCount = content.trim().split(/\s+/).length;
      const readingTime = Math.max(1, Math.ceil(wordCount / 100));

      return {
        slug,
        title: data.title || slug.replace(/^blog\d+_/, "").replace(/_/g, " "),
        date: data.date ? new Date(data.date).toISOString().split("T")[0] : "2026-01-01",
        author: data.author || "CP Club Member",
        tags: Array.isArray(data.tags) ? data.tags : [],
        categories: Array.isArray(data.categories) ? data.categories : [],
        description: data.description || content.slice(0, 160).replace(/[#*`_]/g, "") + "...",
        readingTime,
      };
    });

  // Sort oldest first
  return allBlogs.sort((a, b) => (a.date > b.date ? 1 : -1));
}

export function getBlogBySlug(slug) {
  const fullPath = path.join(blogsDirectory, `${slug}.md`);
  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

    // Normalize relative image/file paths like ../static/ to /static/
  let normalizedContent = content.replace(/\.\.\/static\//g, "/static/");
    // Convert MathJax align* to KaTeX-compatible aligned
  normalizedContent = normalizedContent.replace(/\\begin\{align\*\}/g, "\\begin{aligned}");
  normalizedContent = normalizedContent.replace(/\\end\{align\*\}/g, "\\end{aligned}");

  const wordCount = content.trim().split(/\s+/).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 100));

  return {
    slug,
    title: data.title || slug.replace(/^blog\d+_/, "").replace(/_/g, " "),
    date: data.date ? new Date(data.date).toISOString().split("T")[0] : "2026-01-01",
    author: data.author || "CP Club Member",
    tags: Array.isArray(data.tags) ? data.tags : [],
    categories: Array.isArray(data.categories) ? data.categories : [],
    readingTime,
    content: normalizedContent,
  };
}
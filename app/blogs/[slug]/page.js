import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogBySlug, getAllBlogs } from "@/lib/blogs";
import { ArrowLeft, Calendar, Clock, Tag } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

export async function generateStaticParams() {
  const blogs = getAllBlogs();
  return blogs.map((blog) => ({ slug: blog.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const blog = getBlogBySlug(slug);
  if (!blog) return {};

  return {
    title: `${blog.title} | CP Club`,
    description: blog.description || blog.title,
  };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const blog = getBlogBySlug(slug);

  if (!blog) {
    notFound();
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Back button */}
      <Link
        href="/blogs"
        className="inline-flex items-center gap-2 text-sm font-mono text-gray-400 hover:text-matrix-200 transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" /> Back to all articles
      </Link>

      {/* Header */}
      <header className="mb-10 pb-8 border-b border-white/10">
        <h1 className="text-3xl sm:text-5xl font-mono font-bold text-white mb-6 leading-tight">
          {blog.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm font-mono text-gray-400 mb-6">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-matrix-200" />
            {blog.date}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-matrix-200" />
            {blog.readingTime} min read
          </span>
          <span>•</span>
          <span>By {blog.author}</span>
        </div>

        {blog.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {blog.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded bg-matrix-200/10 text-matrix-200 border border-matrix-200/20"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Markdown Content */}
      <article className="font-mono text-gray-300 leading-relaxed space-y-6">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{
            h1: ({ children }) => (
              <h1 className="text-2xl sm:text-3xl font-bold text-white mt-8 mb-4 border-b border-white/10 pb-2">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-xl sm:text-2xl font-bold text-matrix-200 mt-8 mb-4">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-lg font-bold text-white mt-6 mb-2">
                {children}
              </h3>
            ),
            p: ({ children }) => (
              <p className="text-gray-300 leading-7 text-sm sm:text-base mb-4">
                {children}
              </p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc pl-6 space-y-2 mb-4 text-gray-300">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal pl-6 space-y-2 mb-4 text-gray-300">
                {children}
              </ol>
            ),
            img: ({ src, alt }) => (
              <span className="block my-6 rounded-xl overflow-hidden border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={alt || "Blog image"} className="w-full h-auto object-cover" />
              </span>
            ),
            pre: ({ children }) => (
                <pre
                className={`
                    my-4 rounded-xl overflow-hidden border border-white/10
                    bg-black/60 p-4 overflow-x-auto whitespace-pre
                    text-xs sm:text-sm font-mono text-gray-200
                `}
                >
                {children}
                </pre>
            ),
            /* ---------- INLINE CODE ---------- */
            // For back‑ticks that appear inside a paragraph (`inline` code).
            // KaTeX does **not** use this, it’s only for things like `0` or `int`.
            code: ({ className, children, ...props }) => {
                // `className` is present only on block code (e.g. "language-js").
                // If it exists we defer to the `pre` wrapper above – this branch will
                // never be hit for normal fenced blocks.
                if (className?.startsWith('language-')) {
                return (
                    <code className="text-xs sm:text-sm font-mono text-gray-200 block" {...props}>
                    {children}
                    </code>
                );
                }
                // Inline code (the “badge” style you want)
                return (
                <code
                    className="px-1.5 py-0.5 rounded bg-white/10 text-matrix-200 text-xs sm:text-sm font-mono"
                    {...props}
                >
                    {children}
                </code>
                );
            },
            a: ({ href, children }) => (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-matrix-200 underline hover:text-matrix-50 transition-colors"
            >
                {children}
            </a>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-matrix-200 pl-4 py-1 italic bg-matrix-200/5 text-gray-300 my-4 rounded-r">
                {children}
              </blockquote>
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto my-6">
                <table className="w-full text-left border-collapse border border-white/10 text-sm">
                  {children}
                </table>
              </div>
            ),
            th: ({ children }) => (
              <th className="border border-white/10 p-2.5 bg-white/5 font-bold text-white">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="border border-white/10 p-2.5 text-gray-300">
                {children}
              </td>
            ),
          }}
        >
          {blog.content}
        </ReactMarkdown>
      </article>
    </div>
  );
}
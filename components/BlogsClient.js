"use client";
import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Calendar, Clock, Tag, ArrowRight } from "lucide-react";

export default function BlogsClient({ initialBlogs }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("all");

  const allTags = useMemo(() => {
    const tags = new Set();
    initialBlogs.forEach((blog) => blog.tags?.forEach((t) => tags.add(t)));
    return ["all", ...Array.from(tags)];
  }, [initialBlogs]);

  const filteredBlogs = useMemo(() => {
    return initialBlogs.filter((blog) => {
      const matchesSearch =
        blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        blog.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag =
        selectedTag === "all" || blog.tags?.includes(selectedTag);
      return matchesSearch && matchesTag;
    });
  }, [initialBlogs, searchQuery, selectedTag]);

  return (
    <div className="space-y-8">
      {/* Search & Tag Pills */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 font-mono text-sm focus:outline-none focus:border-matrix-200/50 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono capitalize transition-all whitespace-nowrap ${
                selectedTag === tag
                  ? "bg-matrix-200/20 text-matrix-200 border border-matrix-200/50"
                  : "bg-white/5 text-gray-400 hover:text-white border border-white/5"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Blog Cards Grid */}
      {filteredBlogs.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl">
          <p className="text-gray-400 font-mono">No articles found matching your query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBlogs.map((blog) => (
            <Link
              key={blog.slug}
              href={`/blogs/${blog.slug}`}
              className="group flex flex-col justify-between bg-black/40 border border-white/10 hover:border-matrix-200/50 rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-matrix-200/5"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-gray-400 font-mono mb-3">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-matrix-200" />
                    {blog.date}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {blog.readingTime} min read
                  </span>
                </div>

                <h2 className="text-xl font-bold font-mono text-white group-hover:text-matrix-200 transition-colors line-clamp-2 mb-3">
                  {blog.title}
                </h2>

                <p className="text-gray-400 text-sm line-clamp-3 mb-4 font-mono">
                  {blog.description}
                </p>
              </div>

              <div>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {blog.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-300 border border-white/5"
                    >
                      <Tag className="w-2.5 h-2.5 text-matrix-200" />
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center text-xs font-mono text-matrix-200 group-hover:translate-x-1 transition-transform">
                  Read Article <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
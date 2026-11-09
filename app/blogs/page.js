import React from "react";
import { getAllBlogs } from "@/lib/blogs";
import BlogsClient from "@/components/BlogsClient";

export const metadata = {
  title: "Blogs & Editorials | CP Club",
  description: "Tutorials, algorithm breakdowns, and competitive programming tips.",
};

export default function BlogsPage() {
  const blogs = getAllBlogs();

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-mono font-bold text-white mb-4">
          CP Club <span className="text-matrix-200">Articles & Insights</span>
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto font-mono text-sm sm:text-base">
          Tutorials, problem-solving write-ups, and algorithms guides.
        </p>
      </div>

      <BlogsClient initialBlogs={blogs} />
    </div>
  );
}
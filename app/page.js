"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1];

const stats = [
  { label: "Active Members", value: "50+" },
  { label: "Contests Hosted", value: "10+" },
  { label: "Resources", value: "200+" },
  { label: "Problems Solved", value: "5K+" },
];

const rise = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: EASE, delay },
});

export default function Home() {
  return (
    <section className="relative flex min-h-[calc(100svh-78px)] items-center">
      <div className="container py-16">
        <motion.span className="eyebrow" {...rise(0.05)}>
          CP Club · 2026-27
        </motion.span>

        <motion.h1
          className="mt-6 text-[clamp(2.8rem,8.5vw,7rem)] font-bold leading-[0.95]"
          {...rise(0.15)}
        >
          Where algorithms
          <br />
          meet <span className="text-accent">excellence</span>
          <span className="text-accent">.</span>
        </motion.h1>

        <motion.p
          className="mt-7 max-w-xl text-lg leading-relaxed text-zinc-400"
          {...rise(0.3)}
        >
          VJTI&apos;s competitive programming community. Solve problems, compete in contests, and
          level up your problem-solving, together.
        </motion.p>

        <motion.div className="mt-10 flex flex-wrap gap-3" {...rise(0.42)}>
          <Link href="/leaderboard" className="btn">
            View Leaderboard <ArrowRight />
          </Link>
          <Link href="/resources" className="btn btn--ghost">
            <BookOpen /> Resources
          </Link>
        </motion.div>

        <motion.dl
          className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-white/10 bg-white/10 lg:grid-cols-4"
          {...rise(0.55)}
        >
          {stats.map((s) => (
            <div key={s.label} className="bg-zinc-900 px-6 py-7">
              <dd className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
                {s.value}
              </dd>
              <dt className="mt-2 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-zinc-500">
                {s.label}
              </dt>
            </div>
          ))}
        </motion.dl>
      </div>
    </section>
  );
}

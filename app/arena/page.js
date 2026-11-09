"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Swords, Trophy, Flame, Shield, Timer, Sparkles, AlertCircle, ArrowRight, Clock } from "lucide-react";
import axios from "axios";

export default function ArenaLobby() {
  const router = useRouter();
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // Form state
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [minRating, setMinRating] = useState(900);
  const [maxRating, setMaxRating] = useState(1400);
  const [tag, setTag] = useState("all");
  const [count, setCount] = useState(3);
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [startDelaySeconds, setStartDelaySeconds] = useState(60); // Default 1 min to allow sharing link

  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const tags = [
    { value: "all", label: "Any Topic" },
    { value: "implementation", label: "Implementation" },
    { value: "greedy", label: "Greedy" },
    { value: "math", label: "Math" },
    { value: "dp", label: "Dynamic Programming" },
    { value: "data structures", label: "Data Structures" },
    { value: "brute force", label: "Brute Force" },
    { value: "constructive algorithms", label: "Constructive Algorithms" },
    { value: "sortings", label: "Sorting & Two Pointers" },
    { value: "binary search", label: "Binary Search" },
  ];

  useEffect(() => {
    async function loadMembers() {
      try {
        const res = await axios.get("/api/arena/members");
        if (res.data?.success) {
          setMembers(res.data.members);
          if (res.data.members.length >= 2) {
            setP1(res.data.members[0].cf_username);
            setP2(res.data.members[1].cf_username);
          }
        }
      } catch (err) {
        console.error("Failed to load members:", err);
      } finally {
        setLoadingMembers(false);
      }
    }
    loadMembers();
  }, []);

  const handleStartBattle = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!p1.trim() || !p2.trim()) {
      setErrorMsg("Please select or enter handles for both players.");
      return;
    }

    if (p1.trim().toLowerCase() === p2.trim().toLowerCase()) {
      setErrorMsg("Player 1 and Player 2 cannot be the same handle.");
      return;
    }

    if (Number(minRating) > Number(maxRating)) {
      setErrorMsg("Minimum rating cannot exceed maximum rating.");
      return;
    }

    setIsGenerating(true);

    try {
      const res = await axios.post("/api/arena/generate", {
        p1: p1.trim(),
        p2: p2.trim(),
        minRating: Number(minRating),
        maxRating: Number(maxRating),
        tag: tag === "all" ? "" : tag,
        count: Number(count),
        durationMinutes: Number(durationMinutes),
        startDelaySeconds: Number(startDelaySeconds),
      });

      if (res.data?.success && res.data?.token) {
        router.push(`/arena/match?token=${encodeURIComponent(res.data.token)}`);
      } else {
        setErrorMsg(res.data?.error || "Could not generate match.");
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message || "Match generation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8 bg-black text-white relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-matrix-200/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10 pt-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-matrix-200/10 border border-matrix-200/30 text-matrix-200 text-sm font-mono mb-4">
            <Swords className="w-4 h-4" /> 1v1 Battle Arena
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight font-mono">
            HEAD-TO-HEAD <span className="text-matrix-200">DUEL</span>
          </h1>
          <p className="mt-3 text-zinc-400 max-w-xl mx-auto text-sm sm:text-base">
            Challenge a CP Club member in a ThemeCP-style live battle. Real-time verdicts verified directly via Codeforces.
          </p>
        </div>

        {/* Setup Card */}
        <div className="glass-card rounded-2xl border border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm font-mono">{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleStartBattle} className="space-y-6">
            {/* Players Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
              {/* VS badge */}
              <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-zinc-900 border-2 border-matrix-200 items-center justify-center font-mono font-bold text-matrix-200 shadow-glow-sm">
                VS
              </div>

              {/* Player 1 */}
              <div className="p-5 rounded-xl bg-zinc-900/60 border border-matrix-200/30 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-matrix-200 font-mono text-sm font-bold mb-3">
                    <Shield className="w-4 h-4" /> PLAYER 1 (HOST)
                  </div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Select Member or Type CF Handle</label>
                  <input
                    type="text"
                    value={p1}
                    onChange={(e) => setP1(e.target.value)}
                    placeholder="Enter Codeforces handle"
                    className="w-full px-4 py-2.5 rounded-lg bg-black border border-white/20 text-white font-mono focus:border-matrix-200 focus:outline-none text-sm mb-3"
                    required
                  />

                  {members.length > 0 && (
                    <select
                      onChange={(e) => e.target.value && setP1(e.target.value)}
                      value={p1}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-white/10 text-zinc-300 font-mono text-xs focus:outline-none"
                    >
                      <option value="">-- Or choose from club roster --</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.cf_username}>
                          {m.name} ({m.cf_username}) - {m.year}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Player 2 */}
              <div className="p-5 rounded-xl bg-zinc-900/60 border border-red-500/30 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-red-400 font-mono text-sm font-bold mb-3">
                    <Flame className="w-4 h-4" /> PLAYER 2 (CHALLENGER)
                  </div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Select Member or Type CF Handle</label>
                  <input
                    type="text"
                    value={p2}
                    onChange={(e) => setP2(e.target.value)}
                    placeholder="Enter Codeforces handle"
                    className="w-full px-4 py-2.5 rounded-lg bg-black border border-white/20 text-white font-mono focus:border-red-400 focus:outline-none text-sm mb-3"
                    required
                  />

                  {members.length > 0 && (
                    <select
                      onChange={(e) => e.target.value && setP2(e.target.value)}
                      value={p2}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-white/10 text-zinc-300 font-mono text-xs focus:outline-none"
                    >
                      <option value="">-- Or choose from club roster --</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.cf_username}>
                          {m.name} ({m.cf_username}) - {m.year}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* Match Configurations */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {/* Rating Range */}
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">Min Rating</label>
                <input
                  type="number"
                  step="100"
                  min="800"
                  max="3500"
                  value={minRating}
                  onChange={(e) => setMinRating(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 font-mono text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">Max Rating</label>
                <input
                  type="number"
                  step="100"
                  min="800"
                  max="3500"
                  value={maxRating}
                  onChange={(e) => setMaxRating(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 font-mono text-white text-sm"
                />
              </div>

              {/* Tag Selection */}
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">Topic Tag</label>
                <select
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 font-mono text-white text-sm"
                >
                  {tags.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">Duration</label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 font-mono text-white text-sm"
                >
                  <option value={30}>30 Minutes</option>
                  <option value={45}>45 Minutes</option>
                  <option value={60}>60 Minutes</option>
                  <option value={90}>90 Minutes</option>
                </select>
              </div>
            </div>

            {/* Start Delay / Synchronized Kick-Off */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-matrix-200" /> Start Delay (Sync Window)
                </label>
                <select
                  value={startDelaySeconds}
                  onChange={(e) => setStartDelaySeconds(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 font-mono text-white text-sm focus:border-matrix-200"
                >
                  <option value={0}>Start Immediately (0s)</option>
                  <option value={30}>Start in 30 Seconds</option>
                  <option value={60}>Start in 1 Minute (Recommended to share link)</option>
                  <option value={120}>Start in 2 Minutes</option>
                  <option value={300}>Start in 5 Minutes</option>
                </select>
                <span className="text-[11px] font-mono text-zinc-500 mt-1 block">
                  Problems remain locked until this timer hits zero.
                </span>
              </div>

              {/* Problems Count */}
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  Problems: <span className="text-matrix-200 font-bold">{count}</span>
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setCount(n)}
                      className={`flex-1 py-2 font-mono text-sm rounded-lg border transition-all ${
                        count === n
                          ? "bg-matrix-200/20 border-matrix-200 text-matrix-200 font-bold"
                          : "bg-zinc-900 border-white/10 text-zinc-400 hover:text-white"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Launch Button */}
            <button
              type="submit"
              disabled={isGenerating || loadingMembers}
              className="w-full py-4 mt-4 bg-matrix-200 hover:bg-emerald-400 text-black font-mono font-bold text-base rounded-xl transition-all shadow-glow-md hover:shadow-glow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="w-5 h-5 animate-spin" />
                  Generating Unsolved Match Problems...
                </>
              ) : (
                <>
                  <Swords className="w-5 h-5" />
                  Launch 1v1 Battle Arena
                  <ArrowRight className="w-5 h-5 ml-1" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Rules note */}
        <div className="mt-8 p-4 rounded-xl bg-zinc-900/40 border border-white/5 font-mono text-xs text-zinc-400 space-y-1">
          <p className="text-zinc-300 font-bold flex items-center gap-1.5">
            <Timer className="w-4 h-4 text-matrix-200" /> Match Rules & Live Engine:
          </p>
          <p>• Problems are selected dynamically so neither player has solved them before.</p>
          <p>• Problems stay locked with a synchronized countdown until the match starts.</p>
          <p>• Solve the problems directly on Codeforces during the match window.</p>
          <p>• 1 point per problem solved + 0.5 bonus points to whichever player solves first.</p>
          <p>• Zero database dependency: match state is cryptographically signed and verified via Codeforces API.</p>
        </div>
      </div>
    </div>
  );
}

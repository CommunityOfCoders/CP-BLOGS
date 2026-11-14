"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import {
  Swords,
  Timer,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Trophy,
  RefreshCw,
  Copy,
  Check,
  Zap,
  ArrowLeft,
  AlertTriangle,
  Lock,
  Hourglass,
  Share2,
} from "lucide-react";

function MatchContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [matchData, setMatchData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Authoritative synced countdown seconds
  const [countdownSeconds, setCountdownSeconds] = useState(0);

  const fetchStatus = useCallback(
    async (isManual = false) => {
      if (!token) {
        setError("No match token provided.");
        setLoading(false);
        return;
      }

      if (isManual) setRefreshing(true);

      try {
        const res = await axios.get(`/api/arena/verify?token=${encodeURIComponent(token)}`);
        if (res.data?.success) {
          setMatchData(res.data);
          // Sync client countdown with server authoritative time
          if (res.data.isPending) {
            setCountdownSeconds(res.data.startsInSeconds || 0);
          } else {
            setCountdownSeconds(res.data.timeRemainingSeconds || 0);
          }
          setError(null);
        } else {
          setError(res.data?.error || "Failed to verify match.");
        }
      } catch (err) {
        setError(err.response?.data?.error || err.message || "Failed to verify match.");
      } finally {
        setLoading(false);
        if (isManual) setRefreshing(false);
      }
    },
    [token]
  );

  useEffect(() => {
    fetchStatus();
    // Auto poll every 2 minutes (120,000 ms)
    const interval = setInterval(() => {
      fetchStatus(false);
    }, 120000);

    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Client-side 1-second countdown tick
  useEffect(() => {
    if (countdownSeconds <= 0) return;

    const timer = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          // Timer reached 0: Re-fetch status immediately to unmask/finish
          fetchStatus(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdownSeconds, fetchStatus]);

  const copyMatchLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white font-mono">
        <RefreshCw className="w-8 h-8 animate-spin text-matrix-200 mb-4" />
        <p className="text-zinc-400">Loading battle arena...</p>
      </div>
    );
  }

  if (error || !matchData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white font-mono px-4">
        <div className="p-6 rounded-2xl bg-zinc-900 border border-red-500/30 max-w-md text-center">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-red-400 mb-2">Battle Error</h2>
          <p className="text-sm text-zinc-400 mb-6">{error || "Invalid match state."}</p>
          <Link
            href="/arena"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Arena Lobby
          </Link>
        </div>
      </div>
    );
  }

  const { match, scoreboard, problems, isFinished, isPending, winner, outcome } = matchData;
  const p1 = match.p1;
  const p2 = match.p2;

  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8 text-white relative">
      <div className="max-w-5xl mx-auto pt-6">
        {/* Top bar with back and share */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <Link
            href="/arena"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white font-mono text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Exit to Lobby
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={copyMatchLink}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-xs font-mono text-zinc-300 hover:text-matrix-200 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-matrix-200" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Link Copied!" : "Share Match Link"}
            </button>

            <button
              onClick={() => fetchStatus(true)}
              disabled={refreshing}
              title="Auto-refreshes every 2 minutes. Click to check immediately."
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-matrix-200/10 border border-matrix-200/30 text-xs font-mono text-matrix-200 hover:bg-matrix-200/20 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Verifying..." : "Check Status"}
            </button>
          </div>
        </div>

        {/* PRE-MATCH COUNTDOWN BANNER (WHEN isPending IS TRUE) */}
        {isPending ? (
          <div className="mb-10 text-center">
            <div className="p-8 rounded-2xl bg-zinc-900/90 border-2 border-matrix-200/40 max-w-xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-matrix-200/10 border border-matrix-200/30 text-matrix-200 text-xs font-mono mb-4">
                <Hourglass className="w-4 h-4 animate-spin" /> Synchronizing Countdown
              </div>
              <h2 className="text-lg font-mono text-zinc-300 mb-1">MATCH STARTS IN</h2>
              <div className="text-6xl sm:text-7xl font-mono font-extrabold text-matrix-200 tracking-tight my-4">
                {formatTime(countdownSeconds)}
              </div>
              <p className="text-sm font-mono text-zinc-400 mb-6">
                Send the battle link to your opponent now! Problems unlock for both players simultaneously when the timer hits zero.
              </p>

              <button
                onClick={copyMatchLink}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-matrix-200 text-black font-mono font-bold text-sm hover:scale-105 transition-all"
              >
                {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                {copied ? "Match Link Copied!" : "Copy & Send Match Link"}
              </button>
            </div>
          </div>
        ) : (
          /* ACTIVE OR FINISHED TIMER BANNER */
          <div className="text-center mb-8">
            <div className="inline-block p-4 px-6 rounded-2xl bg-zinc-900/80 border border-white/10 shadow-2xl">
              <div className="flex items-center justify-center gap-2 text-xs font-mono text-zinc-400 uppercase tracking-widest mb-1">
                <Timer className="w-4 h-4 text-matrix-200" />
                {isFinished ? "Match Ended" : "Time Remaining"}
              </div>
              <div
                className={`text-4xl sm:text-5xl font-mono font-extrabold tracking-tight ${
                  isFinished ? "text-red-400" : countdownSeconds < 300 ? "text-yellow-400 animate-pulse" : "text-matrix-200"
                }`}
              >
                {formatTime(countdownSeconds)}
              </div>
            </div>
          </div>
        )}

        {/* Winner Announcement Banner */}
        {isFinished && (
          <div className="mb-8 p-6 rounded-2xl bg-zinc-900 border-2 border-matrix-200/50 text-center ">
            <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-2 animate-bounce" />
            <h2 className="text-2xl sm:text-3xl font-mono font-bold text-white">
              {outcome === "tie" ? "IT'S A TIE!" : `VICTORY FOR ${winner.toUpperCase()}!`}
            </h2>
            <p className="text-zinc-400 font-mono text-sm mt-1">
              Final Score: <span className="text-matrix-200 font-bold">{p1} ({scoreboard[p1].score})</span> vs{" "}
              <span className="text-red-400 font-bold">{p2} ({scoreboard[p2].score})</span>
            </p>
          </div>
        )}

        {/* Split Duel Scoreboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Player 1 Card */}
          <div
            className={`p-6 rounded-2xl bg-zinc-900/80 border transition-all ${
              winner === p1 ? "border-matrix-200 ring-2 ring-matrix-200/40" : "border-matrix-200/20"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-mono text-matrix-200 uppercase font-bold tracking-wider">Player 1</span>
                <h3 className="text-xl font-bold font-mono text-white flex items-center gap-2">
                  {p1}
                  {winner === p1 && <Trophy className="w-4 h-4 text-yellow-400" />}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-3xl font-mono font-extrabold text-matrix-200">{scoreboard[p1].score}</span>
                <span className="text-xs font-mono text-zinc-500 block">PTS</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-zinc-400 border-t border-white/5 pt-3">
              <span>Solved: {scoreboard[p1].solvedCount}/{match.totalProblems}</span>
              <span>Total Time: {Math.floor(scoreboard[p1].totalTimeSeconds / 60)}m</span>
            </div>
          </div>

          {/* Player 2 Card */}
          <div
            className={`p-6 rounded-2xl bg-zinc-900/80 border transition-all ${
              winner === p2 ? "border-red-400 ring-2 ring-red-400/40" : "border-red-500/20"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-mono text-red-400 uppercase font-bold tracking-wider">Player 2</span>
                <h3 className="text-xl font-bold font-mono text-white flex items-center gap-2">
                  {p2}
                  {winner === p2 && <Trophy className="w-4 h-4 text-yellow-400" />}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-3xl font-mono font-extrabold text-red-400">{scoreboard[p2].score}</span>
                <span className="text-xs font-mono text-zinc-500 block">PTS</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-zinc-400 border-t border-white/5 pt-3">
              <span>Solved: {scoreboard[p2].solvedCount}/{match.totalProblems}</span>
              <span>Total Time: {Math.floor(scoreboard[p2].totalTimeSeconds / 60)}m</span>
            </div>
          </div>
        </div>

        {/* Problems List */}
        <div className="space-y-4">
          <h3 className="text-lg font-mono font-bold text-white flex items-center gap-2">
            <Swords className="w-5 h-5 text-matrix-200" /> Match Problemset
          </h3>

          {problems.map((prob, idx) => {
            const p1Status = prob[p1] || { solved: false };
            const p2Status = prob[p2] || { solved: false };

            return (
              <div
                key={prob.problemId}
                className="p-5 rounded-xl bg-zinc-900/60 border border-white/10 hover:border-white/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Problem Info */}
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center font-mono text-xs font-bold text-matrix-200">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      {prob.locked ? (
                        <span className="font-mono font-bold text-zinc-500 inline-flex items-center gap-1.5 cursor-not-allowed">
                          <Lock className="w-4 h-4 text-zinc-500" />
                          {prob.name}
                        </span>
                      ) : (
                        <Link
                          href={prob.url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono font-bold text-white hover:text-matrix-200 transition-colors inline-flex items-center gap-1.5"
                        >
                          {prob.name}
                          <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                        </Link>
                      )}
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-800 text-zinc-300">
                        {prob.rating}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-zinc-500 mt-1">
                      {prob.locked ? "Problem statement will unlock at start time" : `Problem ID: ${prob.problemId}`}
                    </p>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-4 border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
                  {prob.locked ? (
                    <span className="text-xs font-mono text-zinc-500 flex items-center gap-1.5 bg-zinc-800/40 px-3 py-1 rounded">
                      <Lock className="w-3.5 h-3.5" /> Locked until match starts
                    </span>
                  ) : (
                    <>
                      {/* P1 status */}
                      <div className="flex items-center gap-1.5 text-xs font-mono">
                        <span className="text-zinc-400">{p1}:</span>
                        {p1Status.solved ? (
                          <span className="inline-flex items-center gap-1 text-matrix-200 font-bold bg-matrix-200/10 px-2 py-0.5 rounded border border-matrix-200/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {p1Status.timeTakenMinutes}m
                            {prob.firstSolver === p1 && (
                              <span title="First to solve! +0.5 bonus points">
                                <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400 ml-0.5" />
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-zinc-500 bg-zinc-800/40 px-2 py-0.5 rounded">
                            <XCircle className="w-3.5 h-3.5" /> Unsolved
                          </span>
                        )}
                      </div>

                      <span className="text-zinc-700">|</span>

                      {/* P2 status */}
                      <div className="flex items-center gap-1.5 text-xs font-mono">
                        <span className="text-zinc-400">{p2}:</span>
                        {p2Status.solved ? (
                          <span className="inline-flex items-center gap-1 text-red-400 font-bold bg-red-400/10 px-2 py-0.5 rounded border border-red-400/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {p2Status.timeTakenMinutes}m
                            {prob.firstSolver === p2 && (
                              <span title="First to solve! +0.5 bonus points">
                                <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400 ml-0.5" />
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-zinc-500 bg-zinc-800/40 px-2 py-0.5 rounded">
                            <XCircle className="w-3.5 h-3.5" /> Unsolved
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ArenaMatchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-white font-mono">
          <RefreshCw className="w-8 h-8 animate-spin text-matrix-200" />
        </div>
      }
    >
      <MatchContent />
    </Suspense>
  );
}

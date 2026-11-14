"use client"

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

const CSESUserPage = () => {
  const params = useParams();
  const userId = params?.userId;
  const [csesData, setCsesData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFilter, setShowFilter] = useState('all'); // 'all', 'solved', 'unsolved'
  
//   console.log('CSES UserId from params:', userId);
  useEffect(() => {
    if (!userId) return;

    async function fetchSolvedProblems(id) {
      setLoading(true);
      setError(null);
      
      try {
          const cacheKey = `cses:${encodeURIComponent(id)}`;
          const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours
  
          // Try to use cached data first (so UI can show immediately on reload)
          try {
              const raw = localStorage.getItem(cacheKey);
              if (raw) {
                  const parsed = JSON.parse(raw);
                  if (parsed?.ts && (Date.now() - parsed.ts) < CACHE_TTL && parsed.data) {
                      setCsesData(parsed.data);
                      setLoading(false);
                      return; // skip using the network response body
                  }
              }
          } catch (e) {
              console.warn('CSES cache read failed', e);
          }
  
          const response = await fetch(`/api/cses?userId=${encodeURIComponent(id)}`);
          
          if (!response.ok) {
            const err = await response.json().catch(() => ({ error: 'Unknown' }));
            throw new Error(err?.error || 'Failed to fetch CSES data');
          }
          const data = await response.json();
  
          // Cache the fresh response
          try {
              localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data }));
          } catch (e) {
              console.warn('CSES cache write failed', e);
          }
          setCsesData(data);
        } catch (err) {
          setError(err.message);
          console.error('Error fetching CSES data:', err);
        } finally {
          setLoading(false);
        }
        
    }

    fetchSolvedProblems(userId);

  }, [userId]);

  const renderProblemCard = (problem, index) => (
    <div key={`${problem.id}-${index}`} className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
      problem.status === 'Solved' 
        ? 'bg-zinc-900 border-matrix-200/40' 
        : 'bg-zinc-900 border-white/10'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-sm font-medium text-zinc-400 mb-1">
            Problem #{problem.id}
          </div>
          <h4 className="font-semibold text-white text-sm leading-tight mb-2">
            {problem.title}
          </h4>
          <div className="text-xs text-zinc-500 mb-2">
            {problem.stats}
          </div>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            problem.status === 'Solved' 
              ? 'bg-matrix-200/15 text-matrix-200' 
              : 'bg-zinc-800 text-white'
          }`}>
            {problem.status === 'Solved' ? '✓ Solved' : '○ Unsolved'}
          </span>
        </div>
      </div>
      <a 
        href={problem.link} 
        target="_blank" 
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center text-xs text-zinc-400 hover:text-zinc-300 font-medium"
      >
        View Problem →
      </a>
    </div>
  );

  const renderSection = (sectionName, sectionData) => {
    let problemsToShow = [];
    
    if (showFilter === 'solved') {
      problemsToShow = sectionData.solved;
    } else if (showFilter === 'unsolved') {
      problemsToShow = sectionData.unsolved;
    } else {
      problemsToShow = [...sectionData.solved, ...sectionData.unsolved];
    }

    if (problemsToShow.length === 0) return null;

    return (
      <div key={sectionName} className="mb-8">
        <div className="bg-zinc-900 p-4 rounded-lg border border-white/10 mb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">{sectionName}</h3>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-zinc-400">
                {sectionData.solvedCount}/{sectionData.totalCount} solved
              </div>
              <div className="text-sm font-medium text-matrix-200">
                {sectionData.completionPercentage}%
              </div>
            </div>
          </div>
          
          {/* Section Progress Bar */}
          <div className="mt-2">
            <div className="w-full bg-zinc-700 rounded-full h-2">
              <div 
                className="bg-matrix-200 h-2 rounded-full transition-all duration-500"
                style={{ width: `${sectionData.completionPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {problemsToShow.map((problem, index) => renderProblemCard(problem, index))}
        </div>
      </div>
    );
  };

  if (!userId) {
    return <div className="p-6">No user id provided.</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-white">CSES Problem Set</h1>
      
      {loading && (
        <div className="flex items-center space-x-2 text-zinc-400 p-4">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <p>Loading CSES data... (This may take a moment as we need to login)</p>
        </div>
      )}
      
      {error && (
        <div className="text-red-500 p-4 bg-red-50 rounded border border-red-200 mb-6">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {csesData && (
        <div className="space-y-6">
          {/* User Stats Card */}
          <div className="bg-zinc-900 p-6 rounded-lg border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4">
              {csesData.username} ({csesData.userId})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{csesData.solvedProblems}</div>
                <div className="text-sm text-zinc-400">Problems Solved</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-zinc-400">{csesData.totalProblems}</div>
                <div className="text-sm text-zinc-400">Total Problems</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-matrix-200">{csesData.completionPercentage}%</div>
                <div className="text-sm text-zinc-400">Completion Rate</div>
              </div>
            </div>
            
            {/* Overall Progress Bar */}
            <div className="mt-4">
              <div className="w-full bg-zinc-700 rounded-full h-3">
                <div 
                  className="bg-matrix-200 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${csesData.completionPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center justify-between bg-zinc-900 p-4 rounded-lg border border-white/10">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-zinc-300">Show:</span>
              <button
                onClick={() => setShowFilter('all')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  showFilter === 'all' 
                    ? 'bg-zinc-800 text-zinc-300' 
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                All Problems
              </button>
              <button
                onClick={() => setShowFilter('solved')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  showFilter === 'solved' 
                    ? 'bg-matrix-200/15 text-matrix-200' 
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                Solved Only
              </button>
              <button
                onClick={() => setShowFilter('unsolved')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  showFilter === 'unsolved' 
                    ? 'bg-orange-100 text-orange-800' 
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                Unsolved Only
              </button>
            </div>
          </div>
          
          {/* Sections */}
          {csesData.sections && (
            <div>
              <h3 className="text-xl font-bold mb-6 text-white">
                Problems by Section
              </h3>
              <div className="space-y-8">
                {Object.entries(csesData.sections).map(([sectionName, sectionData]) => 
                  renderSection(sectionName, sectionData)
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CSESUserPage

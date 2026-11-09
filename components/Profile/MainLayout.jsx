import Image from "next/image";
import React, { useState, useEffect } from "react";
import DoughnutChart from "./DoughnutChart";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import "react-tooltip/dist/react-tooltip.css";
import { Tooltip } from "react-tooltip";
import RatingChart from "./RatingChart";
import ProfileContestTable from "./ProfileContestTable";
import TopicAnalysis from "./TopicAnalysis";
import Link from "next/link";
import ActivityHeatmap from "./Heatmap";

function mergeTopicData(leetCodeData, codeForcesData) {
  const combinedAnalysis = { advanced: [], intermediate: [], fundamental: [] };

  ["advanced", "intermediate", "fundamental"].forEach((level) => {
    const leetTopics = leetCodeData[level] || [];
    const cfTopics = codeForcesData[level] || [];

    const topicMap = new Map();

    // Add LeetCode topics
    leetTopics.forEach((topic) => {
      topicMap.set(topic.tagSlug, { ...topic });
    });

    cfTopics.forEach((topic) => {
      if (topicMap.has(topic.tagSlug)) {
        topicMap.get(topic.tagSlug).problemsSolved += topic.problemsSolved;
      } else {
        topicMap.set(topic.tagSlug, { ...topic });
      }
    });

    combinedAnalysis[level] = Array.from(topicMap.values());
  });

  return combinedAnalysis;
}

async function getDailySolvedProblemsCount(userHandle) {
  const response = await fetch(
    `https://codeforces.com/api/user.status?handle=${userHandle}`
  );
  const data = await response.json();

  if (data.status !== "OK") {
    throw new Error("Failed to fetch user data");
  }

  const solvedProblems = data.result
    .filter((submission) => submission.verdict === "OK")
    .map((submission) => ({
      date: new Date(submission.creationTimeSeconds * 1000)
        .toISOString()
        .split("T")[0],
      problemId: `${submission.contestId}-${submission.problem.index}`,
    }));

  const dailyCounts = new Map();

  solvedProblems.forEach(({ date, problemId }) => {
    if (!dailyCounts.has(date)) {
      dailyCounts.set(date, new Set());
    }
    dailyCounts.get(date).add(problemId);
  });

  const dailySolvedProblems = Array.from(dailyCounts, ([date, problems]) => ({
    date,
    count: problems.size,
  }));

  return dailySolvedProblems;
}

function getAverageContestRating(ratingData) {
  if (!ratingData || ratingData.length === 0) return 0;

  const totalRating = ratingData.reduce(
    (sum, rating) => sum + rating.rating,
    0
  );
  return totalRating / ratingData.length;
}

function MainLayout({ data }) {
  const [dailySolvedProblem, setdailySolvedProblems] = useState([]);
  const [activeTab, setActiveTab] = useState('leetcode');

  useEffect(() => {
    const fetchDailySolvedProblems = async () => {
      try {
        const dailySolvedProblems = await getDailySolvedProblemsCount(
          data?.codeForcesData?.handle
        );
        setdailySolvedProblems(dailySolvedProblems);
      } catch (error) {
        console.error("Error fetching daily solved problems:", error);
      }
    };

    if (data?.codeForcesData?.handle) {
      fetchDailySolvedProblems();
    }
  }, [data?.codeForcesData?.handle]);

  let totalContests =
    data.leetCodeData?.userContestDetails?.contestParticipation.length +
    data.codeForcesData?.ratingData?.length;

  let totalQuestion = data.leetCodeData?.acSubmissionNum[0]?.count;
  let calenderSubmission = data.leetCodeData?.submissionCalendar;

  // console.log(calenderSubmission);

  const topicWiseAnalysis = mergeTopicData(
    data.leetCodeData?.topicWiseAnalysis,
    data.codeForcesData?.topicAnalysis
  );

  const averageContestRating = getAverageContestRating(
    data.codeForcesData?.ratingData
  );

  const heatmapData = Object.keys(calenderSubmission || {}).map((timestamp) => {
    const date = new Date(parseInt(timestamp) * 1000)
      .toISOString()
      .split("T")[0];
    return { date, count: calenderSubmission[timestamp] };
  });

  function mergeHeatmapAndDailySolvedProblems(
    heatmapData,
    dailySolvedProblems
  ) {
    const dailySolvedMap = new Map(
      dailySolvedProblems.map(({ date, count }) => [date, count])
    );

    const mergedData = heatmapData.map(({ date, count }) => {
      const dailySolvedCount = dailySolvedMap.get(date) || 0;
      return {
        date,
        count: count + dailySolvedCount,
      };
    });

    dailySolvedProblems.forEach(({ date, count }) => {
      if (!mergedData.some((item) => item.date === date)) {
        mergedData.push({
          date,
          count,
        });
      }
    });

    return mergedData.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  const mergedData = mergeHeatmapAndDailySolvedProblems(
    heatmapData,
    dailySolvedProblem
  );
  // console.log(mergedData);

  const leetContestSolvedSum = (
    data.leetCodeData?.userContestDetails?.contestParticipation ?? []
  ).reduce((sum, p) => sum + (p?.problemsSolved ?? 0), 0);

  const topData = [
    {
      image: "/svgs/puzzle.svg",
      title: "Contest Questions",
      count:
        (data.codeForcesData?.problemsSolvedCount ?? 0) + leetContestSolvedSum,
    },
    {
      image: "/svgs/trophy.svg",
      title: "Total Contests",
      count: totalContests ?? 0,
    },
    {
      image: "/svgs/active-days.svg",
      title: "Total Active Days",
      count: Object.keys(calenderSubmission || {}).length,
    },
  ];
  // console.log(data.codeForcesData);


  const totalSubmissions =
    (data.leetCodeData?.acSubmissionNum[0]?.count ?? 0) +
    (data.codeForcesData?.problemsSolvedCount ?? 0);

  return (
    <div className="flex flex-col gap-7">
      {/* upper part */}
      <div className="flex gap-7 justify-between">
        {topData.map((data, index) => (
          <div
            key={index}
            className="w-full py-6 px-7 rounded-xl glass-card flex items-center gap-5"
          >
            <div className="bg-matrix-200/10 border border-matrix-200/20 rounded-full w-14 h-14 flex justify-center items-center shadow-glow-sm">
              <Image
                src={data.image}
                alt={data.title}
                width={24}
                height={24}
                className="w-6 h-6 brightness-150"
              />
            </div>
            <div>
              <p className="text-zinc-400 text-sm font-medium">{data.title}</p>
              <p className="text-3xl font-mono font-bold text-matrix-200">{data.count}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-row gap-7">
        {/* left part */}
        <div className="w-full basis-1/3 flex flex-col gap-7">
          <div className="w-full py-6 px-7 rounded-xl glass-card flex flex-col gap-5">
            <div className="flex gap-4 border-b border-white/10">
              <button
                onClick={() => setActiveTab('leetcode')}
                className={`pb-3 px-4 font-mono font-medium transition-all ${activeTab === 'leetcode'
                    ? 'border-b-2 border-matrix-200 text-matrix-200'
                    : 'text-zinc-400 hover:text-zinc-300'
                  }`}
              >
                LeetCode
              </button>
              <button
                onClick={() => setActiveTab('codeforces')}
                className={`pb-3 px-4 font-mono font-medium transition-all ${activeTab === 'codeforces'
                    ? 'border-b-2 border-matrix-200 text-matrix-200'
                    : 'text-zinc-400 hover:text-zinc-300'
                  }`}
              >
                CodeForces
              </button>
            </div>

            {activeTab === 'leetcode' ? (
              <>
                <p className="text-white font-mono text-sm flex items-center gap-2">
                  <span className="w-1 h-4 bg-matrix-200" />
                  Problems solved from leetcode
                </p>
                <div className="flex gap-3">
                  <DoughnutChart data={data.leetCodeData?.acSubmissionNum} />
                </div>
              </>
            ) : (
              <>
                <p className="text-white font-mono text-sm flex items-center gap-2">
                  <span className="w-1 h-4 bg-matrix-200" />
                  Problems solved from codeforces
                </p>
                <div className="flex gap-3">
                  <DoughnutChart data={data.codeForcesData?.topicAnalysis} />
                </div>
              </>
            )}
          </div>

          <div className="w-full py-6 px-7 rounded-xl glass-card flex flex-col gap-5">
            <div className="flex justify-between items-center">
              <p className="text-white font-mono text-sm flex items-center gap-2">
                <span className="w-1 h-4 bg-matrix-200" />
                Contests
              </p>
              <Link href="/contest" className="text-sm text-matrix-200 hover:text-matrix-100 cursor-pointer font-mono transition-colors">
                See All →
              </Link>
            </div>
            <ProfileContestTable data={data} />
          </div>
        </div>

        {/* right part */}
        <div className="w-full basis-2/3 flex flex-col gap-7">
          {/* Heat map section */}
          <ActivityHeatmap heatMapData={mergedData} />

          {/* Rating chart section */}
          <div className="w-full py-6 px-7 rounded-xl glass-card flex flex-col gap-5">
            <RatingChart data={data} />
          </div>

          {/* Topic Analysis section */}
          <div className="w-full py-6 px-7 rounded-xl glass-card flex flex-col gap-5">
            <p className="text-white font-mono text-sm flex items-center gap-2">
              <span className="w-1 h-4 bg-matrix-200" />
              Topic Wise Analysis
            </p>
            <TopicAnalysis data={topicWiseAnalysis} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainLayout;

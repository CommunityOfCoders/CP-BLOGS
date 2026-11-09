import Profile from "@/components/Profile/Profile";
import { getLeetCodeData } from "@/lib/getLeetCodeData";
import React from "react";
import members from "@/json/members.json";
import { getCodeForcesData } from "@/lib/getCodeForcesData";

async function page({ params }) {
  const key = (await params).username;
  const user_data = members[key];

  const leetCodeData = await getLeetCodeData(user_data.lc_username);
  const codeForcesData = await getCodeForcesData(user_data.cf_username);

  let data = {
    user_data: user_data,
    leetCodeData: leetCodeData ?? null,
    codeForcesData: codeForcesData ?? null,
  };

  let contestsData = {
    leetCodeContestsData:
      data.leetCodeData?.userContestDetails?.contestParticipation || [],
    codeForcesContestsData: data.codeForcesData?.ratingData || [],
  };

  let mergedContestsArray = [
    ...contestsData.leetCodeContestsData.map((contest) =>
      normalizeContestData(contest, "LeetCode")
    ),
    ...contestsData.codeForcesContestsData.map((contest) =>
      normalizeContestData(contest, "CodeForces")
    ),
  ];

  data["mergedContests"] = mergedContestsArray;
  data["contestsData"] = contestsData;

  // console.log(data);
  
  return (
    <div>
      <Profile data={data} />
    </div>
  );
}

function normalizeContestData(contest, platform) {
  return {
    platform: platform,
    contestId: contest.contestId || null,
    contestName:
      contest.contestName || contest.contest?.title || "Unknown Contest",
    startTime:
      contest?.contest?.startTime || contest.ratingUpdateTimeSeconds || null,
    newRating: contest.newRating || contest.rating || null,
    rank: contest.rank || contest.ranking || null,
    problemsSolved: contest.problemsSolved || null,
  };
}

export default page;

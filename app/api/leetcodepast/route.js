import axios from "axios";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Helper function to fetch data for a single user
async function fetchUserContestHistory(username) {
  const query = `
        query userContestRankingInfo($username: String!) {
            userContestRankingHistory(username: $username) {
                attended
                ranking
                contest {
                    title
                    startTime
                }
            }
        }
    `;

  const variables = { username };

  try {
    const response = await axios.post(
      "https://leetcode.com/graphql",
      { query, variables },
      { timeout: 5000 }
    );

    return response.data?.data?.userContestRankingHistory || [];
  } catch (error) {
    console.error(`Error fetching data for ${username}:`, error.message);
    return [];
  }
}

export async function GET(req) {
  const url = new URL(req.url);
  
  // Get the exact contest name from URL (e.g., "Weekly Contest 482")
  const targetContestName = url.searchParams.get("contestName") || 'Weekly Contest 482'; 

  // 1. Load members from the JSON file
  const filePath = path.resolve(process.cwd(), "json/members.json");
  let usersData;
  
  try {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    usersData = JSON.parse(fileContent);
  } catch (error) {
    console.error("Error reading members file:", error);
    return NextResponse.json({ error: "Failed to read members file" }, { status: 500 });
  }

  // 2. Convert the users object into an array
  const membersList = Object.entries(usersData).map(([key, data]) => ({
    id: key,       // This becomes the 'ref'
    ...data
  }));

  // console.log(`Fetching ranklist for: "${targetContestName}" | Total Members: ${membersList.length}`);

  // 3. Fetch all data in parallel
  const promises = membersList.map(async (member) => {
    if (!member.lc_username) return null;

    const history = await fetchUserContestHistory(member.lc_username);
    
    // Find the specific contest entry matching the name exactly
    const contestEntry = history.find((entry) => 
      entry.contest.title === targetContestName
    );

    // Only return if found and they have a valid rank
    if (contestEntry && contestEntry.ranking > 0) {
      return {
        ref: member.id, // ID from the JSON key
        name: member.name,
        handle: member.lc_username,
        standing: contestEntry.ranking,
        contestTitle: contestEntry.contest.title,
      };
    }

    return null; // User didn't participate
  });

  const results = await Promise.all(promises);
  
  const ranklist = results
    .filter(item => item !== null)
    .sort((a, b) => a.standing - b.standing);

  // console.log(`Found ${ranklist.length} participants.`);

  return NextResponse.json(ranklist);
}
import axios from "axios";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Function to fetch the LeetCode rating for a given username
async function fetchLCRating(username) {
  const query = `
    query userContestRankingInfo($username: String!) {
      userContestRanking(username: $username) {
        rating
      }
    }
  `;

  const variables = { username };

  try {
    const response = await axios.post(
      "https://leetcode.com/graphql",
      { query, variables },
      { timeout: 5000 } // 5-second timeout for the API request
    );

    // console.log("API response data:", response.data); // Log full response for debugging

    if (response.data?.data?.userContestRanking?.rating) {
      return Math.round(response.data.data.userContestRanking.rating);
    } else {
      return null;
    }
  } catch (error) {
    console.error(`Error fetching rating for ${username}:`, error.message);
    return null;
  }
}

export async function GET(req) {
  const url = new URL(req.url);

  // Load the user list from the JSON file
  const filePath = path.resolve(process.cwd(), "json/members.json");
  let users;

  try {
    const data = fs.readFileSync(filePath, "utf-8");
    users = JSON.parse(data);
  } catch (error) {
    console.error("Error reading JSON file:", error);
    return NextResponse.json(
      { error: "Failed to read users file" },
      { status: 500 }
    );
  }

  // Collect usernames from the JSON file
  const userHandles = Object.values(users).map((user) => user.lc_username);

  // Fetch LeetCode ratings for all users in parallel
  const ratingPromises = userHandles.map((handle) =>
    fetchLCRating(handle).then((rating) => ({
      username: handle,
      rating,
    }))
  );

  // Await all promises and get the results
  const ratings = await Promise.all(ratingPromises);

  // Return the ratings in the response
  return NextResponse.json(ratings);
}

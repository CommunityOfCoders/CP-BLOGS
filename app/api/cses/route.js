import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

export async function GET(req, { params }) {
    const url = new URL(req.url);
    // Prefer dynamic route param, fallback to query
    let userId = params?.userId || url.searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    try {
        // Load CSES problems data
        const problemsDataPath = path.join(process.cwd(), 'json', 'cses_problems.json');
        const problemsData = JSON.parse(fs.readFileSync(problemsDataPath, 'utf8'));

        const csesUser = process.env.CSES_USERNAME || 'fetchpuppter';
        const csesPass = process.env.CSES_PASSWORD || 'fetchpuppter';

        // 1. Fetch CSES login page to get session cookie & csrf_token
        const loginPageRes = await fetch('https://cses.fi/login', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            cache: 'no-store'
        });

        if (!loginPageRes.ok) {
            throw new Error(`Failed to load CSES login page: ${loginPageRes.statusText}`);
        }

        const initialCookie = loginPageRes.headers.get('set-cookie')?.split(';')[0];
        const loginHtml = await loginPageRes.text();
        const $login = cheerio.load(loginHtml);
        const csrfToken = $login('input[name="csrf_token"]').val();

        if (!csrfToken) {
            throw new Error('CSRF token not found on CSES login page');
        }

        // 2. Submit login credentials
        const loginBody = new URLSearchParams({
            csrf_token: csrfToken,
            nick: csesUser,
            pass: csesPass
        });

        const loginRes = await fetch('https://cses.fi/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': initialCookie,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            body: loginBody.toString(),
            redirect: 'manual',
            cache: 'no-store'
        });

        const sessionCookie = loginRes.headers.get('set-cookie')?.split(';')[0] || initialCookie;

        // 3. Fetch user profile page with authenticated session
        const profileUrl = `https://cses.fi/problemset/user/${encodeURIComponent(userId)}/`;
        const profileRes = await fetch(profileUrl, {
            headers: {
                'Cookie': sessionCookie,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            cache: 'no-store'
        });

        if (!profileRes.ok) {
            throw new Error(`Failed to load CSES profile: ${profileRes.statusText}`);
        }

        const profileHtml = await profileRes.text();
        const $ = cheerio.load(profileHtml);

        // Check if redirected to login (auth failed)
        if ($('form[action=""]').find('input[name="nick"]').length > 0) {
            throw new Error('CSES authentication failed');
        }

        // Extract solved count
        const solvedText = $('p').filter((_, el) => $(el).text().includes('Solved tasks')).first().text();
        const solvedMatch = solvedText?.match(/Solved tasks:\s*(\d+)\/(\d+)/);

        // Extract username
        let username = 'Unknown';
        const statsHeading = $('h2').filter((_, el) => $(el).text().includes('Statistics for')).first().text();
        if (statsHeading) {
            const match = statsHeading.match(/Statistics for\s+(.+)/);
            if (match) username = match[1].trim();
        }

        if (username === 'Unknown') {
            const titleText = $('title').text();
            const titleMatch = titleText.match(/CSES\s*-\s*(.+?)\s*-\s*User/i);
            if (titleMatch) username = titleMatch[1].trim();
        }

        // Extract solved problem IDs from the table grid
        const solvedProblemIds = new Set();
        $('table.course-user-solved a.task-score.icon.full').each((_, el) => {
            const href = $(el).attr('href');
            const problemId = href?.match(/\/problemset\/task\/(\d+)\//)?.[1];
            if (problemId) {
                solvedProblemIds.add(problemId);
            }
        });

        // Process problems by section matching previous format
        const sectionResults = {};
        let totalSolved = 0;
        let totalProblems = 0;

        Object.entries(problemsData.sections).forEach(([sectionName, problems]) => {
            const solvedProblems = [];
            const unsolvedProblems = [];

            problems.forEach((problem) => {
                totalProblems++;
                const isSolved = solvedProblemIds.has(problem.id);

                const problemData = {
                    id: problem.id,
                    title: problem.title,
                    stats: problem.stats,
                    link: `https://cses.fi/problemset/task/${problem.id}/`,
                    status: isSolved ? 'Solved' : 'Unsolved'
                };

                if (isSolved) {
                    solvedProblems.push(problemData);
                    totalSolved++;
                } else {
                    unsolvedProblems.push(problemData);
                }
            });

            sectionResults[sectionName] = {
                solved: solvedProblems,
                unsolved: unsolvedProblems,
                solvedCount: solvedProblems.length,
                totalCount: problems.length,
                completionPercentage: Math.round((solvedProblems.length / problems.length) * 100)
            };
        });

        return NextResponse.json({
            userId,
            username,
            solvedProblems: totalSolved,
            totalProblems,
            completionPercentage: Math.round((totalSolved / totalProblems) * 100),
            sections: sectionResults
        });

    } catch (error) {
        console.error('Error fetching CSES data:', error.message);
        return NextResponse.json({
            error: 'Failed to fetch CSES data',
            details: error.message
        }, { status: 500 });
    }
}

---
layout: post
title: "Games in Competitive Programming: Demystifying Alice and Bob"
date: 2026-07-26
categories: [Competitive Programming, Algorithms]
tags: [game-theory, codeforces, competitive-programming, algorithms]
math: true
---

If you had asked 10-year-old me what I thought about Alice and Bob, frustration would definitely not be among my top thoughts. I mean, *Alice in Wonderland* and *Bob the Builder* were pretty cool! 🤩

And yet now, every time they put a Div. 2 C problem featuring Alice and Bob, I just internally dread a little 😨. But after much practice, I've come to realize that most of the time, these questions are actually quite fun to score on.

Usually, the solution code is surprisingly concise or simple, often requiring no complex external data structures 😮. That is exactly what I wish to demonstrate in this blog post: **questions based on games in Competitive Programming are not necessarily evil.**

---

## What is a "Game" Problem in CP?

Aside from our favorite individuals Alice and Bob appearing, games questions usually involve a **two-player perspective** where each player takes turns making certain "moves". The player who cannot make a valid move on their turn loses (normal play convention). 

In other variations, players work towards opposite objectives—for example, one player tries to minimize a certain value while the other attempts to maximize it.

These moves typically consist of operations on arrays, strings, or single integers under strict rules. Below are four common strategies and paradigms you can use to approach these problem statements.

---

### 1. Simulation

Often, the game involves a small, bounded number of total moves. For instance, if an element is deleted from an array of size $N$ at every turn, at most $N$ moves can occur.

Let:
- $X$ = Maximum possible number of moves in the game.
- $Y$ = Operations required to compute/select an individual optimal move.

If the sum of $(X \times Y)$ over all test cases is well under $\sim 10^7$ (for a standard 1-second time limit), we can simply simulate the game directly—making the most optimal choice for the active player at each turn.

#### Example Scenario:
> Alice and Bob have an array of $N$ integers ($1 \le N \le 10^5$, $1 \le A_i \le 10^9$). On each turn, a player picks one integer, adds it to their total score, and removes it from the array. Both players want to maximize their score, and Alice goes first. Determine final scores.

Since one element is removed each turn, there are at most $N$ turns. To maximize their score greedily, each player should always choose the largest available element. While finding the maximum in an unsorted array takes $O(N)$ time, we can preprocess by sorting the array in $O(N \log N)$ time and popping elements from the end:
- 1st largest $\rightarrow$ Alice
- 2nd largest $\rightarrow$ Bob
- 3rd largest $\rightarrow$ Alice ... and so on.

---

### 2. Quick Games

Sometimes games end in just 1 or 2 moves. Or perhaps Alice has no valid moves right at the start, leading to an immediate win for Bob!

Identifying such patterns requires dry-running small test cases on paper. If you notice that no game ever progresses past 1 or 2 turns regardless of input size, you're dealing with a **Quick Game**.

General resolution flow:
1. Check if Alice has a valid move at $T=0$. If no $\rightarrow$ **Bob wins**.
2. Check if Alice can make a move that leaves Bob with zero valid moves at $T=1$. If yes $\rightarrow$ **Alice wins**, else **Bob wins**.

#### Example Problem: Sorting Games
> Alice and Bob play on a binary string $S$ of length $N \le 10^6$. On a player's turn, if $S$ is not sorted, they choose a non-increasing subsequence of indices $1 \le i_1 \le i_2 \le \dots \le i_k \le N$ (where $S_{i_1} \ge S_{i_2} \ge \dots \ge S_{i_k}$) and reverse it. The first player unable to move loses.
>
> *Problem reference:* [CF 2190 A - Sorting Games](https://codeforces.com/problemset/problem/2190/A)

Let's test some cases:
- $S = \text{"000"}$: Already sorted. Alice has no moves. $\rightarrow$ **Bob wins**.
- $S = \text{"100"}$: Alice selects indices $\{1, 3\}$ ($S_1=1, S_3=0$). Reversing yields $\text{"001"}$. $S$ is now sorted, Bob has no moves. $\rightarrow$ **Alice wins**.
- $S = \text{"100101"}$: Alice selects indices $\{1, 5\}$ ($S_1=1, S_5=0$). Reversing yields $\text{"000111"}$. Sorted! $\rightarrow$ **Alice wins**.

Notice the pattern: if the string is initially unsorted, **Alice can always sort the entire string in a single move!**

**How to construct Alice's move?**
Let $Z$ be the total count of `0`s in $S$. In a sorted string, the first $Z$ characters must all be `0`s. 
If the current first $Z$ characters contain $k$ ones, then there must also be exactly $k$ zeros in the remaining $(N - Z)$ characters. By selecting those $k$ ones and $k$ zeros as her non-increasing subsequence and reversing them, the string becomes completely sorted in 1 turn! Fuiyohh! 💡

---

### 3. Winning and Losing States

In finite combinatorial games:
- A **Losing State** is one from which *every* valid move leads to a Winning State for the opponent.
- A **Winning State** is one from which *at least one* valid move exists that hands the opponent a Losing State.

The game reduces to identifying whether the initial state is a Winning or Losing state for Alice.

#### Example Scenario:
> Alice and Bob are in an $N$-floor building (floors $0$ to $N-1$). The elevator can move at most $K$ floors down per turn ($1 \le \text{step} \le K$). Starting at floor $N-1$, players alternate moving down. The player who lands on floor $0$ wins. ($2 \le N, K \le 10^9$).

- Floor $0$: **Losing State** (game already ended/lost for active player).
- Floors $1$ to $K$: **Winning States** (active player can move directly to floor $0$).
- Floor $K + 1$: **Losing State** (any valid move lands on a floor in $[1, K]$, handing the opponent a winning state!).
- Floors $K + 2$ to $2K + 1$: **Winning States** (active player can force opponent to floor $K + 1$).

Pattern recognition shows that any floor $X$ where $X \pmod{K + 1} == 0$ is a **Losing State**. Thus, if $(N - 1) \pmod{K + 1} == 0$, Bob wins; otherwise, Alice wins!

---

### 4. Response Moves

In some games, one player (say, Bob) can only win by precisely mirroring or responding to every single move made by Alice.

#### Example Problem: Removals Game
> Alice and Bob each have a permutation of integers $1 \dots N$. In each turn of $N-1$ rounds, Alice deletes an element from either end of her permutation, then Bob deletes an element from either end of his permutation. At the end, 1 element remains in each sequence. If both remaining elements are identical, Bob wins; otherwise Alice wins.
>
> *Problem reference:* [CF 2002 B - Removals Game](https://codeforces.com/problemset/problem/2002/B)

Simulating this yields $O(2^N)$ possibilities—far too slow for $N \le 3 \times 10^5$.

Instead, observe Bob's winning condition: Bob must ensure that at every step, the set of remaining elements in both permutations remains identical. If Alice ever deletes an element that Bob cannot match from his endpoints, Alice can isolate that difference and win.

For Bob to successfully mirror Alice's moves from the very first turn, the endpoints of their permutations must match.
- **Case 1:** $A[1] == B[1]$ and $A[N] == B[N]$. If Alice deletes $A[1]$, Bob deletes $B[1]$. The game recursively reduces to matching sub-arrays, requiring $A == B$ overall.
- **Case 2:** $A[1] == B[N]$ and $A[N] == B[1]$. If Alice deletes $A[1]$, Bob deletes $B[N]$. The game recursively requires $A == \text{reverse}(B)$.

Thus, **Bob wins if and only if $A == B$ or $A == \text{reverse}(B)$**. Otherwise, **Alice wins**.

---

## Practice Problems

Here is a curated collection of Codeforces game problems to test your understanding, ranging from entry-level to advanced:

1. [CF 959 A - Mahmoud and Ehab and the even-odd game](https://codeforces.com/problemset/problem/959/A)  : [Solution Link](https://codeforces.com/contest/959/submission/387968974)
<<<<<<< Updated upstream
2. [CF 1373 B - 01 Game](https://codeforces.com/problemset/problem/1373/B) : [Solution Link](https://github.com/sahilphad07-sudo/CP-BLOGS/blob/solve-cf1373-B/blogs/cf1373.cpp)
=======
2. [CF 1373 B - 01 Game](https://codeforces.com/problemset/problem/1373/B)[Solution Link](https://codeforces.com/contest/1373/submission/387997365)
>>>>>>> Stashed changes
3. [CF 1842 A - Tenzing and Tsondu](https://codeforces.com/problemset/problem/1842/A)
4. [CF 2055 A - Two Frogs](https://codeforces.com/problemset/problem/2055/A)
5. [CF 2060 C - Game of Mathletes](https://codeforces.com/problemset/problem/2060/C)
6. [CF 1931 E - Anna and the Valentine's Day Gift](https://codeforces.com/problemset/problem/1931/E)
7. [CF 2002 B - Removals Game](https://codeforces.com/problemset/problem/2002/B)
8. [CF 2123 D - Binary String Battle](https://codeforces.com/problemset/problem/2123/D)
9. [CF 2190 A - Sorting Games](https://codeforces.com/problemset/problem/2190/A)
10. [CF 2006 A - Iris and Game on the Tree](https://codeforces.com/problemset/problem/2006/A)
11. [CF 2171 C2 - Renako Amaori and XOR Game (hard version)](https://codeforces.com/problemset/problem/2171/C2)
12. [CF 2236 D - Brand New Tatar TV Show](https://codeforces.com/problemset/problem/2236/D)
13. [CF 2245 E - Tom and Jerry](https://codeforces.com/problemset/problem/2245/E)

---

With that, I conclude this post! I hope this guide helps you overcome your fear of Alice and Bob on Codeforces. 🥳 If you have any questions or thoughts, feel free to drop a comment below!
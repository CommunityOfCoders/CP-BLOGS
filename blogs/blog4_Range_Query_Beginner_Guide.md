---
layout: post
title: "Range Query Beginner Guide: From Prefix Sums to Segment Trees"
date: 2026-09-20
categories: [Competitive Programming, Algorithms]
tags: [range-queries, data-structures, segment-tree, fenwick-tree, sparse-table, mos-algorithm, codeforces, algorithms]
math: true
---
## Introduction

Welcome to the guide! If you are going to survive competitive programming, you need to master Range Queries. Brute-forcing a solution with nested loops might work for arrays of size $1,000$, but when $N$ and $Q$ (the number of queries) scale to $10^5$ or $10^6$, an $\mathcal{O}(N \times Q)$ approach will hit a Time Limit Exceeded (TLE) verdict before you can even blink.

This guide is your survival manual. We will cover everything from the humble Prefix Sum to the almighty Segment Tree.

In competitive programming, you are frequently handed a massive array and asked to perform operations on specific contiguous sub-segments, or “ranges,” of that array.

Imagine you are given an array of $200,000$ integers and asked $100,000$ times to find the minimum value between index $L$ and index $R$. If you scan the array from $L$ to $R$ every single time, your code will perform tens of billions of operations. Most online judges cap your operations at roughly $10^8$ per second.

Range query data structures and algorithms allow us to preprocess the array once, so that answering each subsequent query takes logarithmic time, $\mathcal{O}(\log N)$, or even constant time, $\mathcal{O}(1)$. Some algorithms also allow us to update the array on the fly without having to rebuild everything from scratch.

---

## The Core Vocabulary (Definitions)

Before building data structures, you must master the terminology. We categorize algorithms based on how the underlying data changes and the mathematical properties of the query function.

### Query and Update Types:

* **Range Query:** Asking a question about a subarray from index $L$ to $R$ (e.g., “What is the sum of elements from index 3 to 10?”).
* **Point Update:** Modifying a single element in the array at index $i$ (e.g., “Change the value at index 5 to 100”).
* **Range Update:** Modifying a contiguous block of elements from index $L$ to $R$ (e.g., “Add 10 to all elements from index 2 to 8”).
* **Offline vs. Online:** “Online” means you must process queries one by one as they arrive (often intermixed with updates). “Offline” means you are given all queries upfront and can reorder them to calculate answers faster.

### Mathematical Properties:

* **Identity Element:** A value that leaves other elements unchanged under a function. For addition, identity is $0$ ($x + 0 = x$). For multiplication, it is $1$. For bitwise XOR, it is $0$. For maximum, it is $-\infty$.
* **Invertible Function:** An operation where every action can be “undone.” Addition is invertible (subtract to undo). XOR is invertible (XOR again to undo). Maximum and Minimum are not invertible: if the maximum of a range is 10, removing the 10 does not tell you the new maximum without inspecting other numbers.
* **Idempotent Function:** A function where applying it to the same element multiple times yields the same result: $f(x, x) = x$. Examples: Minimum, Maximum, GCD. (Addition is not idempotent because $x + x \neq x$).
* **Associativity:** Grouping does not matter: $f(a, f(b, c)) = f(f(a, b), c)$. Almost all range query structures rely on this (Sum, Min, Max, GCD, XOR).
* **Commutativity:** Order does not matter: $f(a, b) = f(b, a)$. Matrix multiplication is associative but not commutative, meaning left-to-right order must be preserved!

---

## Prefix Sums

**Formal Definition:** You are given an array of $N$ elements. You must answer queries that aggregate, over a function $f$, the elements in range $[L, R]$, where $1 \le L \le R \le N$. The array is static (no updates).

**Solution:** For array $a_1, a_2, \dots, a_n$, we want $f(a_L, a_{L+1}, \dots, a_R)$.
Instead of looping from $L$ to $R$ every query, precalculate a new array `pref`, where `pref[i]` stores the aggregate from index $1$ to $i$. We define `pref[0]` = identity (for sum, identity is $0$).
When queried for range $[L, R]$, combine the aggregate up to $R$ and undo the prefix up to $L - 1$ using the inverse operation: $f(\text{pref}[R], \text{inverse}(\text{pref}[L-1]))$.

$$
\begin{align*}
\text{Precomputation:} \quad &\text{pref}[i] = f(a_1, a_2, \dots, a_i) \quad \text{with} \quad \text{pref}[0] = e \quad (\text{identity}) \\
\text{Query}(L, R): \quad &\text{Ans} = f\Big(\text{pref}[R], \, \text{inverse}\big(\text{pref}[L-1]\big)\Big) \\
\text{Sum Example:} \quad &\sum_{i=L}^{R} a_i = \text{pref}[R] - \text{pref}[L-1]
\end{align*}
$$

* **Query type:** Static Range Queries (Offline or Online)
* **Functions supported:** Associative and strictly Invertible (Sum, XOR, Product modulo a prime)
* **Preprocessing Complexity:** $\mathcal{O}(N)$
* **Space Complexity:** $\mathcal{O}(N)$
* **Query Complexity:** $\mathcal{O}(1)$

```cpp
#include <iostream>
#include <vector>

// operation: addition
int f(int a, int b){
    return a + b;
}
// inverse: negation
int inverse(int x){
    return - x;
}
void preproc(std::vector<int>&nums, std::vector<int> &pref, int I) // input array, prefix sum array, identity value
{
    int n = nums.size();
    pref.resize(n+1, I);
    // O(N) preproc
    for(int i = 1; i <= n; i++)
    {
        pref[i] = f(pref[i - 1], nums[i - 1]);
    }
}

int query(int L, int R, std::vector<int> &pref)
{
    // O(1) query
    // 1 based indexing
    return f(pref[R], inverse(pref[L - 1]));
}

int main()
{
    std::vector<int> nums={1,2,3,4,5}, pref;
    preproc(nums, pref,0);
    std::cout<<query(2,4,pref)<<std::endl; // 9
    return 0;
}

```

**Practice:**

* [CSES: Static Range Sum Queries](https://cses.fi/problemset/task/1646)
* [USACO Silver: Subsequences Summing to Sevens](https://usaco.org/index.php?page=viewproblem2&cpid=595)

---

## Difference Array

**Formal Definition:** You start with an array of $N$ elements initialized to $0$. You must perform multiple Range Updates (e.g., adding value $V$ to all elements in range $[L, R]$). After all updates are processed, output the final state of the array.

**Solution:** A Difference Array is the exact inverse of a Prefix Sum. The difference array `diff` stores changes between consecutive elements: `diff[i] = a[i] - a[i-1]`.
To add $V$ to range $[L, R]$, make two $\mathcal{O}(1)$ point updates:

1. `diff[L] += V`
2. `diff[R + 1] -= V`

After processing all update queries, reconstruct the array by computing the Prefix Sum of `diff`. The $+V$ at index $L$ cascades forward, and the $-V$ at index $R + 1$ cancels it out for all indices beyond $R$.

$$
\begin{align*}
\text{Definition:} \quad &\text{diff}[i] = a[i] - a[i-1] \\
\text{Range Update } [L, R] + V: \quad &\begin{cases} 
\text{diff}[L] \leftarrow \text{diff}[L] + V \\ 
\text{diff}[R+1] \leftarrow \text{diff}[R+1] - V 
\end{cases} \\
\text{Array Reconstruction:} \quad &a[i] = \sum_{j=1}^{i} \text{diff}[j]
\end{align*}
$$

* **Query type:** Offline Range Updates with a single final evaluation
* **Functions supported:** Associative and Invertible (Sum, XOR)
* **Preprocessing Complexity:** $\mathcal{O}(1)$ per update
* **Space Complexity:** $\mathcal{O}(N)$
* **Final Evaluation Complexity:** $\mathcal{O}(N)$

```cpp
#include <iostream>
#include <vector>

// operation: addition
int f(int a, int b){
    return a + b;
}
// inverse: negation
int inverse(int x){
    return - x;
}
void preproc(std::vector<int>&nums, std::vector<int> &diff, int I) // input array, difference array, identity value
{
    int n = nums.size();
    diff.resize(n+1, I);
    // O(N) preproc
    diff[0] = nums[0];
    for(int i = 1; i < n; i++)
    {
        diff[i] = f(nums[i], inverse(nums[i - 1]));
    }
    // n+1 th value is buffer, just to avoid indexing error in [L,N] updates.
}

void query(int L, int R, std::vector<int> &diff, int change)
{
    // O(1) query
    // L, R in 1 based indexing, hence we use L - 1 and R for updates 
    diff[L - 1] = f(diff[L - 1], change);
    diff[R] = f(diff[R], inverse(change));
}

void reconstruct(std::vector<int>&nums, std::vector<int> &diff)
{
    int n = nums.size();
    nums[0] = diff[0];
    for(int i = 1;i<n;i++){
        nums[i] = f(nums[i-1], diff[i]);
    }
}

int main()
{
    std::vector<int> nums={1,2,3,4,5}, diff;
    preproc(nums, diff,0);
    query(1, 3, diff, 2);
    query(2, 5, diff, -3);
    reconstruct(nums, diff);
    for(auto&e:nums)std::cout<<e<<" ";
    std::cout<<std::endl;
    // 3 1 2 1 2
    return 0;
}

```

**Practice:**

* [Codeforces 816 B. Karen and Coffee](https://codeforces.com/problemset/problem/816/B)
* [USACO Silver: Painting the Barn](https://usaco.org/index.php?page=viewproblem2&cpid=919)

---

## Sparse Table

**Formal Definition:** You are given a static array of $N$ elements. Process Range Queries for an idempotent function (Min, Max, GCD) on range $[L, R]$. No updates are allowed.

**Solution:** Prefix sums fail for Min/Max because those operations are not invertible. A Sparse Table precomputes answers for all intervals whose lengths are powers of 2 ($1, 2, 4, 8, \dots$).
Table entry `ST[i][j]` stores the aggregate for the range starting at index $i$ with length $2^j$. Build the table bottom-up in $\mathcal{O}(N \log N)$ time using smaller powers of 2.
To query range $[L, R]$, find the largest power of 2 that fits inside the range: $k = \lfloor \log_2(R - L + 1) \rfloor$. Because idempotent functions satisfy $f(x, x) = x$, overlapping regions do not alter the answer. Evaluate two overlapping blocks of length $2^k$: one starting at $L$, the other ending at $R$.

$$
\begin{align*}
\text{Precomputation:} \quad &ST[i][j] = f\Big(ST[i][j-1], \; ST[i + 2^{j-1}][j-1]\Big) \\
\text{Range Query } [L, R]: \quad &k = \lfloor \log_2(R - L + 1) \rfloor \\
\text{Result:} \quad &\text{Ans} = f\Big(ST[L][k], \; ST[R - 2^k + 1][k]\Big)
\end{align*}
$$

* **Query type:** Static Range Queries
* **Functions supported:** Associative and Idempotent (Min, Max, GCD, Bitwise OR/AND)
* **Preprocessing Complexity:** $\mathcal{O}(N \log N)$
* **Space Complexity:** $\mathcal{O}(N \log N)$
* **Query Complexity:** $\mathcal{O}(1)$

```cpp
#include <iostream>
#include <vector>
#include <cmath>
// operation: max
int f(int a, int b){
    return std::max(a,b);
}

void preproc(std::vector<int>&nums, std::vector<std::vector<int>> &st) // input array, sparse table
{
    int n = nums.size();
    int maxLog = std::log2(n);
    st.resize(n, std::vector<int>(maxLog + 1));
    // O(N log N) preproc
    // Base case
    for(int i = 0; i < n; i++)st[i][0]=nums[i];
    
    for(int j = 1; j<=maxLog;j++)
    {
        for(int i = 0; i + (1<<j) - 1 < n; i++)
        {
            // Construct next power of 2 score from previous powers of 2
            st[i][j] = f(st[i][j-1], st[i+(1<<(j-1))][j-1]);
        }
    }
}

int query(int L, int R, std::vector<std::vector<int>> &st)
{
    // O(1) query
    // L, R in 1 based indexing, hence we decrement them for updates 
    L--, R--;
    int len = R - L + 1;
    int lg = std::log2(len);
    return f(st[L][lg], st[R - (1<<lg) + 1][lg]);
}

int main()
{
    std::vector<int> nums={1,8,13,34,5};
    std::vector<std::vector<int>> st;
    preproc(nums,st);
    std::cout<<query(1,4,st)<<std::endl; // 34
    std::cout<<query(2,3,st)<<std::endl; // 13
    std::cout<<query(5,5,st)<<std::endl; // 5
    return 0;
}

```

**Practice:**

* [CSES: Static Range Minimum Queries](https://cses.fi/problemset/task/1647)
* [Codeforces 5C. Longest Regular Bracket Sequence](https://codeforces.com/problemset/problem/5/C)
* [Codeforces 2050 F. Maximum modulo equality](https://codeforces.com/contest/2050/problem/F)

---

## Square Root Decomposition (Order-Independent Queries / Mo’s Algorithm)

**Formal Definition:** You have an array of $N$ elements and $Q$ range queries $[L, R]$. The query operation is complex (e.g., counting distinct elements), but updating the answer when inserting or deleting a single element from a range is fast. Queries are known upfront (Offline).

**Solution:** Mo’s Algorithm reorders queries to minimize overall pointer movement across the array. Divide the array into blocks of size approximately $\sqrt{N}$. Maintain active pointers `curr_L` and `curr_R`. Move them step-by-step to match each query's $L$ and $R$, calling `add(element)` or `remove(element)` along the way. Across all queries, total movement of $R$ is bounded by $\mathcal{O}(Q \sqrt{N})$, and $L$ movement is bounded by $\mathcal{O}(Q \sqrt{N})$.

$$\begin{align*} \text{Block Size:} \quad &B = \lfloor \sqrt{N} \rfloor \\ \text{Comparator:} \quad &\text{Query } A < \text{Query } B \iff  \begin{cases}  \frac{A.L}{B} < \frac{B.L}{B} \\  \frac{A.L}{B} = \frac{B.L}{B} \;\land\; \\ ((A.R < B.R \;\land\; \frac{A.L}{B} \% 2 == 0) \\ \vee (A.R > B.R \;\land\; \frac{A.L}{B} \% 2 == 1)) \end{cases} \\ \text{Complexity:} \quad &\mathcal{O}\big((N + Q)\sqrt{N}\big) \end{align*}$$

* **Query type:** Offline Range Queries
* **Functions supported:** Any query state maintained via single-element insertions/deletions (Distinct elements, mode frequency)
* **Preprocessing Complexity:** $\mathcal{O}(Q \log Q)$ (for sorting queries)
* **Space Complexity:** $\mathcal{O}(N + Q)$
* **Query Complexity:** $\mathcal{O}((N + Q) \sqrt{N})$ total for all queries

```cpp
#include <iostream>
#include <vector>
#include <tuple>
#include <algorithm>
#include <cmath>
#include <map>

void add(int i, std::vector<int>&nums, std::vector<int>&mp, int &ct){
    mp[nums[i]]++;
    if(mp[nums[i]]==1)ct++;
}
void remove(int i, std::vector<int>&nums, std::vector<int>&mp, int &ct){
    mp[nums[i]]--;
    if(mp[nums[i]]==0)ct--;
}

void coordinate_compress(std::vector<int>&nums){
    int n = nums.size();
    std::vector<int>tmp = nums;
    std::sort(tmp.begin(),tmp.end());
    std::map<int,int>mp;
    int ptr = 1;
    for(int i = 0; i<n;i++){
        if(!mp.contains(tmp[i]))mp[tmp[i]]=ptr++;
    }
    for(auto&e:nums)e=mp[e];
}

std::vector<int> Mo(std::vector<int> nums, std::vector<std::pair<int,int>> &queries) 
{
    int n = nums.size(), q = queries.size();
    
    coordinate_compress(nums);
    
    int B = std::sqrt(n);
    typedef std::tuple<int,int,int> trp;
    std::vector<trp> Q(q);

    // converting to zero indexed and storing index
    for(int i = 0; i < q; i++) {
        Q[i] = std::make_tuple(queries[i].first - 1, queries[i].second - 1, i);
    }
    
    std::sort(Q.begin(), Q.end(), [&B](const trp &a, const trp &b){
        int lA = std::get<0>(a), rA = std::get<1>(a);
        int lB = std::get<0>(b), rB = std::get<1>(b);
        int bA = lA / B, bB = lB / B;
        if(bA != bB) return bA < bB;
        return (bA & 1) ? rA > rB : rA < rB;
    });

    std::vector<int> result(q);
    
    //Clean empty range initial state
    int curr_l = 0, curr_r = -1;
    int ct = 0;
    
    // Max compressed rank can be at most n
    std::vector<int> mp(n + 2, 0); 

    for(auto& qry : Q) {
        int l = std::get<0>(qry), r = std::get<1>(qry);
        int i = std::get<2>(qry);
        // expand both first, then contract
        while(curr_l > l) {
            curr_l--;
            add(curr_l, nums, mp, ct);
        }
        while(curr_r < r) {
            curr_r++;
            add(curr_r, nums, mp, ct);
        }
        while(curr_l < l) {
            remove(curr_l, nums, mp, ct);
            curr_l++;
        }
        while(curr_r > r) {
            remove(curr_r, nums, mp, ct);
            curr_r--;
        }
        result[i] = ct;
    }
    return result;
}

int main()
{
    std::vector<int> nums={1,2,3,4,1,2,2,3,3,5,4,10,3,1,2};
    std::vector<std::pair<int,int>>queries = {{1,4}, {2,8}, {3,10}, {4,7}, {1,15}};
    std::vector<int>result = Mo(nums,queries);
    for(auto&res:result)std::cout<<res<<std::endl;
    // 4,4,5,3,6
    return 0;
}

```

**Practice:**

* [Codeforces 86 D. Powerful array](https://codeforces.com/problemset/problem/86/D)
* [Codeforces 220 B. Little Elephant and Array](https://codeforces.com/problemset/problem/220/B)

---

## Square Root Decomposition (Order-Dependent Queries / Block Processing)

**Formal Definition:** You have an array of $N$ elements. You must process online Point Updates (or Range Updates) and Range Queries for operations that are non-invertible or where order matters, making Prefix Sums unsuitable.

**Solution:** Divide the array into $S = \lceil \sqrt{N} \rceil$ contiguous blocks, each containing up to $\sqrt{N}$ elements. Maintain a summary answer for each block (e.g., block sum, block min).
For a range query $[L, R]$:

1. **Left Partial Block:** Iterate element-by-element inside $L$’s block up to its end boundary: $\mathcal{O}(\sqrt{N})$.
2. **Middle Full Blocks:** Aggregate precomputed block summaries directly: $\mathcal{O}(\sqrt{N})$.
3. **Right Partial Block:** Iterate element-by-element inside $R$’s block from its start boundary: $\mathcal{O}(\sqrt{N})$.

For a point update at index $i$, update $a[i]$ and recompute the summary of index $i$'s block in $\mathcal{O}(\sqrt{N})$ time.

$$
\begin{align*}
\text{Block Decomposition:} \quad &\text{Block}[k] = f\left(a_{k \cdot B}, \, a_{k \cdot B + 1}, \, \dots, \, a_{(k+1)B - 1}\right) \\
\text{Range Query } [L, R]: \quad &\text{Ans} = f\Big( \text{partial}(L), \, \text{Block}[k_{\text{start}}+1 \dots k_{\text{end}}-1], \, \text{partial}(R) \Big) \\
\text{Time Complexity:} \quad &\mathcal{O}(\sqrt{N}) \quad \text{per query/update}
\end{align*}
$$

* **Query type:** Online Point Updates, Range Updates, Range Queries
* **Functions supported:** Any Associative function (Sum, Min, Max, GCD)
* **Preprocessing Complexity:** $\mathcal{O}(N)$
* **Space Complexity:** $\mathcal{O}(N)$
* **Query/Update Complexity:** $\mathcal{O}(\sqrt{N})$ per operation

```cpp
#include <iostream>
#include <vector>
#include <numeric>
#include <cmath>

// set elements in [L,R] to x
void update(int L, int R, int x, int &B, std::vector<int> &nums, 
std::vector<int> &blocks, std::vector<int>&lazy, std::vector<int>&flag)
{
    L--,R--; // to zero index
    while(L<=R){
        int bL = L/B;
        if(bL * B == L){ // start of a block
            // full block
            if(L + B - 1 <= R)
            {
                blocks[bL] = x;
                flag[bL] = 1;
                lazy[bL] = x;
                L += B;
            }
            else // partial starting block
            {
                int val = x;
                for(int i = L; i < L + B;i++)
                {
                    if(flag[bL])nums[i] = lazy[bL];
                    if(i<=R)nums[i]=x;
                    val = std::gcd(val,nums[i]);
                }
                if(flag[bL])
                {
                    flag[bL] = 0;
                    lazy[bL] = -1;
                }
                blocks[bL] = val;
                L = R + 1;
            }
        }
        else{ // partial ending block / partial block
            int val = x;
            for(int i = bL*B; i < (bL+1)*B;i++)
            {
                if(flag[bL])nums[i] = lazy[bL];
                if(i >= L && i <= R)nums[i] =x;
                val = std::gcd(val, nums[i]);
            }
            blocks[bL] = val;
            if(flag[bL])
            {
                flag[bL] = 0;
                lazy[bL] = -1;
            }
            L = (bL+1)*B;
        }
    }
}

int query(int L, int R, int &B, std::vector<int> &nums, 
std::vector<int> &blocks, std::vector<int>&lazy, std::vector<int>&flag)
{
    L--,R--; // to zero index
    int res = -1;
    while(L<=R){
        int bL = L/B;
        if(bL * B == L){ // start of a block
            // full block
            if(L + B - 1 <= R)
            {
                if(res == -1)res = blocks[bL];
                res = std::gcd(res,blocks[bL]);
                L += B;
            }
            else // partial starting block
            {
                for(int i = L; i < L + B;i++)
                {
                    if(flag[bL])nums[i] = lazy[bL];
                    if(i<=R)
                    {
                        if(res == -1)res = nums[i];
                        res = std::gcd(res,nums[i]);
                    }
                }
                if(flag[bL])
                {
                    flag[bL] = 0;
                    lazy[bL] = -1;
                }
                L = R + 1;
            }
        }
        else{ // partial ending block / partial block
            for(int i = bL*B; i < (bL+1)*B;i++)
                {
                    if(flag[bL])nums[i] = lazy[bL];
                    if(i>=L && i<=R)
                    {
                        if(res == -1)res = nums[i];
                        res = std::gcd(res,nums[i]);
                    }
                }
                if(flag[bL])
                {
                    flag[bL] = 0;
                    lazy[bL] = -1;
                }
                L = (bL+1)*B;
        }
    }
    return res;
}

std::vector<int> sqd(std::vector<int> &nums, std::vector<std::vector<int>> &queries) // input array, query array
{
    int n = nums.size(), q = queries.size();
    int B = std::sqrt(n);
    while(nums.size() % B != 0) nums.push_back(0); // make it perfectly divisible;
    std::vector<int> blocks;
    int blocksize = 0;
    for(int i =0;i<n;i++)
    {
        int bi = i / B;
        if(bi == blocksize)blocks.push_back(nums[i]);
        blocksize=blocks.size();
        blocks[blocksize - 1] = std::gcd(blocks[blocksize - 1],nums[i]);
    }
    std::vector<int> flag(blocksize,0), lazy(blocksize,-1);
    std::vector<int> result;
    for(auto&qry:queries)
    {
        int option = qry[0];
        if(option == 1){
            int L = qry[1], R = qry[2], x = qry[3];
            update(L, R, x, B, nums, blocks, lazy, flag);
        }
        else
        {
            int L = qry[1], R = qry[2];
            int res = query(L, R, B, nums, blocks, lazy, flag);
            result.push_back(res);
        }
    }
    return result;
}

int main()
{
    std::vector<int> nums={2,4,5,3,9, 15,5,21,35, 343};
    std::vector<std::vector<int>>queries = {{2,1,2}, {2,4,6}, {1,3,7,6}, {2,8,10}, {2,1,10}};
    std::vector<int>result = sqd(nums,queries);
    for(auto&res:result)std::cout<<res<<std::endl;
    return 0;
}

```

**Practice:**

* [Codeforces 433 B. Kuriyama Mirai’s Stones](https://codeforces.com/problemset/problem/433/B)
* [CSES: Range Update Queries](https://cses.fi/problemset/task/1651)

---

## Standard Fenwick Tree (Binary Indexed Tree)

**Formal Definition:** You have an array of $N$ elements. You need online Point Updates and Prefix/Range Queries with low overhead, minimal code, and high execution speed.

**Solution:** A Fenwick Tree (BIT) represents partial prefix sums implicitly using bitwise logic. Each index $i$ stores the aggregate of a range of length equal to its lowest set bit: $\text{LSB}(i) = i \mathbin{\&} (-i)$. Index $i$ covers the range $[i - \text{LSB}(i) + 1, i]$.

* **Prefix Query ($1$ to $i$):** Read `BIT[i]`, then clear index $i$'s lowest set bit (`i -= i & -i`). Repeat until $i = 0$.
* **Point Update at $i$:** Add value $V$ to `BIT[i]`, then add index $i$'s lowest set bit (`i += i & -i`). Repeat while $i \le N$.
* **Range Query $[L, R]$:** Compute `query(R)` - `query(L - 1)`.

$$
\begin{align*}
\text{Lowest Set Bit (LSB):} \quad &\text{LSB}(i) = i \mathbin{\&} (-i) \\
\text{Range Covered by } BIT[i]: \quad &\big[i - \text{LSB}(i) + 1, \; i\big] \\
\text{Parent Traversal (Query):} \quad &i \leftarrow i - \text{LSB}(i) \\
\text{Next Node Traversal (Update):} \quad &i \leftarrow i + \text{LSB}(i)
\end{align*}
$$

* **Query type:** Online Point Updates, Prefix/Range Queries
* **Functions supported:** Associative and Invertible operations (Sum, XOR)
* **Preprocessing Complexity:** $\mathcal{O}(N)$
* **Space Complexity:** $\mathcal{O}(N)$
* **Query/Update Complexity:** $\mathcal{O}(\log N)$ with small constant factors

```cpp
#include <iostream>
#include <vector>
#include <tuple>
#include <algorithm>
#include <cmath>

class BIT{
  public:
  std::vector<int>bit;
  int n;
  BIT(std::vector<int>&a)
  {
    n = a.size();
    bit.resize(n, 0);
    for(int i =1; i<=n;i++)update(i,a[i-1]);
  }
  // add x to index i (1 based)
  void update(int i, int x)
  {
      while(i <= n)
      {
        bit[i - 1] += x;
        i += (i & -i);  
      }
  }
  
  // prefix sum till ith element (1 based)
  int query(int i)
  {
    int sum = 0;
    while(i > 0){
        sum += bit[i - 1];
        i -= (i & -i);
    }
    return sum;
  }
};

std::vector<int> process_queries(std::vector<int> &nums, std::vector<std::vector<int>> &queries) // input array, queries array
{
    BIT fenwick(nums);
    std::vector<int> result;
    for(auto&qry:queries)
    {
        int option = qry[0];
        if(option == 1){
            int i = qry[1], x = qry[2];
            fenwick.update(i,x);
        }
        else
        {
            int L = qry[1], R = qry[2];
            int res = fenwick.query(R) - fenwick.query(L - 1);
            result.push_back(res);
        }
    }
    return result;
}
int main()
{
    std::vector<int> nums={2,4,7,3,5};
    std::vector<std::vector<int>>queries = {{2,1,4}, {2,3,5}, {1,3,10}, {2, 4, 5}, {2,1,5}};
    std::vector<int>result = process_queries(nums,queries);
    for(auto&res:result)std::cout<<res<<std::endl;
    // 16, 15, 8, 31
    return 0;
}

```

**Practice:**

* [CSES: Dynamic Range Sum Queries](https://cses.fi/problemset/task/1648)

---

## Standard Segment Tree

**Formal Definition:** You have an array of $N$ elements. You must perform online Point Updates, and Range Queries for arbitrary associative operations.

**Solution:** A Segment Tree is a full binary tree where the root node represents array range $[0, N - 1]$. The root’s left child represents the left half $[0, \lfloor(N-1)/2\rfloor]$, and its right child represents the right half $[\lfloor(N-1)/2\rfloor + 1, N - 1]$. Branching continues recursively down to leaf nodes representing single elements.
To process range query $[L, R]$, traverse down from root:

* **Total Overlap:** Node range inside $[L, R]$ $\rightarrow$ return node’s value.
* **No Overlap:** Node range completely outside $[L, R]$ $\rightarrow$ return identity element.
* **Partial Overlap:** Recurse on left and right children, combining results with operator $f$.

Updates traverse down a single path of depth $\mathcal{O}(\log N)$ to update the leaf, then recalculate parent values on the way back up.

$$
\begin{align*}
\text{Node Merger:} \quad &\text{tree}[\text{node}] = f\Big(\text{tree}[2 \cdot \text{node}], \; \text{tree}[2 \cdot \text{node} + 1]\Big) \\
\text{Base Leaf Condition:} \quad &\text{tree}[\text{node}] = a[\text{start}] \quad \text{when } \text{start} = \text{end} \\
\text{Query Combination:} \quad &\text{Ans} = f\Big(\text{query}(\text{left\_child}), \; \text{query}(\text{right\_child})\Big)
\end{align*}
$$

* **Query type:** Online Point Updates, Online Range Queries
* **Functions supported:** Any Associative function (Sum, Min, Max, GCD, Matrix Multiplication)
* **Preprocessing Complexity:** $\mathcal{O}(N)$
* **Space Complexity:** $\mathcal{O}(N)$ (Allocated as array of size $4N$)
* **Query/Update Complexity:** $\mathcal{O}(\log N)$

```cpp
#include <iostream>
#include <vector>
#include <algorithm>
#include <cmath>

class seg
{
public:
    int ZERO = 0;
    std::vector<int> arr;
    std::vector<int> tree;
    int sz;
    int operation(int a, int b)
    {
        return a + b;
    }
    int build(int i, int s, int e)
    {
        if (e == s)
        {
            return tree[i] = arr[e];
        }
        return tree[i] = operation(build(2 * i + 1, s, (s + e) / 2), build(2 * i + 2, 1 + ((s + e) / 2), e));
    }
    // sum over [qs,qe]
    int qry(int i, int ss, int se, int qs, int qe)
    {
        if (ss > qe || se < qs || ss > se || qs > qe)
            return ZERO;
        if (ss == qs && se == qe)
            return tree[i];
        int mid = (ss + se) / 2;
        return operation(qry(2 * i + 1, ss, mid, qs, std::min(qe, mid)), qry(2 * i + 2, mid + 1, se, std::max(qs, mid + 1), qe));
    }
    
    //set index ii (zero based) to x
    void up(int i, int x, int s, int e, int ii)
    {
        if (s == e)
        {
            arr[ii] = x;
            tree[i] = x;
            return;
        }
        int mid = (s + e) / 2;
        if (ii <= mid)
        {
            up(2 * i + 1, x, s, mid, ii);
        }
        else
        {
            up(2 * i + 2, x, mid + 1, e, ii);
        }
        tree[i] = operation(tree[2 * i + 1], tree[2 * i + 2]);
    }
    seg(std::vector<int> &a, int zro = 0)
    {
        ZERO = zro;
        sz = a.size();
        for (auto &e : a)
            arr.push_back(e);
        tree.resize(4 * sz, ZERO);
        build(0, 0, sz - 1);
    }
};

std::vector<int> process_queries(std::vector<int> &nums, std::vector<std::vector<int>> &queries) // input array, queries array
{
    seg segtree(nums);
    int n = nums.size();
    std::vector<int> result;
    for(auto&qry:queries)
    {
        int option = qry[0];
        if(option == 1){
            int i = qry[1], x = qry[2];
            int newval = segtree.arr[i-1] + x;
            segtree.up(0,newval,0,n-1,i-1);
        }
        else
        {
            int L = qry[1], R = qry[2];
            int res = segtree.qry(0,0,n-1,L-1,R-1);
            result.push_back(res);
        }
    }
    return result;
}
int main()
{
    std::vector<int> nums={2,4,7,3,5};
    std::vector<std::vector<int>>queries = {{2,1,4}, {2,3,5}, {1,3,10}, {2, 4, 5}, {2,1,5}};
    std::vector<int>result = process_queries(nums,queries);
    for(auto&res:result)std::cout<<res<<std::endl;
    // 16, 15, 8, 31
    return 0;
}

```

**Practice:**

* [CSES: Dynamic Range Minimum Queries](https://cses.fi/problemset/task/1649)
* [Codeforces Edu: Segment Tree for the Minimum](https://codeforces.com/edu/course/2/lesson/4/1/practice/contest/273169/problem/A)
* [Codeforces 1462 F. The Treasure of The Segments](https://codeforces.com/contest/1462/problem/F)

---

That’s all for now! Although there are even more complex scenarios and cases, for 95+% of your time dealing with range queries, the above data structures are often more than enough. All the best and hope you go past that TLE next time :D
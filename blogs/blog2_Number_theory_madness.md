---
layout: post
title: "Math in Competitive Programming: Identifying Patterns and Formulae"
date: 2026-08-22
categories: [Competitive Programming, Algorithms]
tags: [math, number-theory, codeforces, competitive-programming, algorithms]
math: true
---

![Ooo numberss](../static/assets/number_theory_cover.jpg)

Math in competitive programming is one of the most critical ways of testing one’s arithmetic and logic-building skills. A lot of the time, math in Competitive Programming is really just a straightforward formula. But obviously, if it were stated directly, the code would be very easy. Instead, the most difficult part is converting the problem from a random storyline into a proper system of equations with defined variables and functions.

Below are some of the common mathematical problems that are twisted by wannabe authors on Codeforces:

## Linear Equations

These equations are of the form:

$$ax + by = c$$

Where $a$, $b$, and $c$ are given integers, and $x$ and $y$ can be some arbitrary integers (if a solution exists). Sometimes, you have to find whether or not a solution exists, other times you have to find non-negative integer solutions, and sometimes you have to give an example. Take a problem like this:

> You are at $X = 0$ on a coordinate line. You can take $A$ or $B$ steps forward or backward. Can you reach point $N$?

So if we take $A$ steps forward, it is $X + A$, else $X - A$; similarly with $B$. Let $x$ be an integer defining the effective times you jumped using $A$, and $y$ be the integer for $B$ for the same. For example, if $x = -3$ and $y = 2$, that means the final point is $2B - 3A$. 

So we are simply asking the question, do integers $x$ and $y$ exist, such that:

$$Ax + By = N$$

There exists a solution if and only if $N \bmod \gcd(A, B) = 0$.

Now consider this problem:

> You are playing a video game, and you can do $X$ damage to an enemy normally and $Y$ damage with a special attack. Due to some technical oversight by the game developer TYF, the final boss has $N$ HP, and you must deal exactly $N$ damage to the boss, no more and no less, to beat it. Can you beat the boss?

Here we are again trying to solve $Ax + By = N$. But this time, $x \ge 0$ and $y \ge 0$ are compulsory.

The first condition is still necessary, i.e., $N \bmod \gcd(A, B) = 0$. Let $\gcd(A, B) = g$. 
The rest of the algorithm is mentioned below in Python.

```python
def extended_gcd(a: int, b: int) -> tuple[int, int, int]:
    """Returns (g, x, y) such that a*x + b*y = g = gcd(a, b)."""
    if b == 0:
        return a, 1, 0
    g, x1, y1 = extended_gcd(b, a % b)
    x = y1
    y = x1 - (a // b) * y1
    return g, x, y

def solve(A: int, B: int, N: int):
    g, s1, s2 = extended_gcd(A, B)
    
    if N % g != 0:
        print("No integer solutions possible.")
        return
    
    # Scale base solution to target N
    factor = N // g
    s1_ = s1 * factor
    s2_ = s2 * factor
    
    step_a = A // g
    step_b = B // g
    
    # We need:
    # x = s1_ + k * step_b >= 0  =>  k >= ceil(-s1_ / step_b)
    # y = s2_ - k * step_a >= 0  =>  k <= floor(s2_ / step_a)
    import math
    min_k = math.ceil(-s1_ / step_b)
    max_k = math.floor(s2_ / step_a)
    
    if min_k > max_k:
        print("No non-negative integer solutions.")
        return
    
    # Pick valid k (e.g., min_k for smallest x)
    k = min_k
    x = s1_ + k * step_b
    y = s2_ - k * step_a
    
    print(f"{A} * {x} + {B} * {y} = {N}")

# Test calls
solve(3, 2, 1)   # Output: No non-negative integer solutions.
solve(4, 6, 9)   # Output: No integer solutions possible.
solve(3, 7, 41)  # Output: 3 * 2 + 7 * 5 = 41
```

### How to identify such patterns

Most problems won't directly tell you what $A$, $B$, and $N$ are, but spin a whole story to distract you. If it is usually a problem with 2 or 3 input values, where 2 of them you can "add" or "subtract" and the 3rd one is to be "equaled", then check whether you can form any equations whose solution is the necessary answer.

Constraints on $A$, $B$, and $N$ may vary, with some of the easy problems having all values under 100 or 1000, which keeps the equations the same but allows for more brute-force methods. However, if $A$, $B$, and $N$ are close to $10^9$, then the above algorithm is likely the intended solution.

---

## SPF Sieve and Inclusion-Exclusion Principle

Here’s a fun puzzle: What is the time complexity of the below function?

```python
def f(n:int):
  for i in range(1, n + 1):
    for j in range(i, n + 1, i):
        print(j, end=" ")
    print()

f(3)
# 1 2 3 
# 2 
# 3
```

If you thought $\mathcal{O}(N \sqrt{N})$, then that's fine; I did too for a long time! But it's actually $\mathcal{O}(N \log N)$. And if the inner loop only ran for primes, it’s actually $\mathcal{O}(N \log(\log N))$!

So first let's look at the SPF sieve.

```python
N = 1000000
spf = [-1] * (N + 1)
i = 2
while i * i <= N:
  if spf[i] == -1:
    # new prime obtained, mark all its unmarked multiples
    for j in range(i, N + 1, i):
      if spf[j] == -1:
        spf[j] = i
  i += 1
while i <= N:
  # mark the remaining primes
  if spf[i] == -1:
    spf[i] = i
  i += 1

def get_prime_factors(k:int) -> list[int]:
    factors = []
    while k > 1:
        # remove all occurrences of smallest prime factor
        sp = spf[k]
        while spf[k] == sp:
            k //= spf[k]
            factors.append(sp)
    return factors
print(get_prime_factors(676767))
```

So we can obtain the prime factors of any $N$ in under $\mathcal{O}(\log N)$ time complexity, after $\mathcal{O}(N \log(\log N))$ preprocessing. Consider this problem:

> Given an array $A$ of $N$ integers, and $Q$ queries where each query asks for the number of pairs $i, j$ such that $1 \le i < j \le N$ and $\gcd(A[i], A[j]) = X$, for a given $X$. Constraints are: $1 \le N \le 10^5$, $1 \le Q \le 10^5$, $1 \le A[i] \le 10^6$, $1 \le X \le 10^9$.

This is a combination of Sieve and the Inclusion-Exclusion principle. The core idea is that it’s easy to first calculate how many pairs of elements have a GCD that is divisible by $X$. But then their GCD can be $2x, 3x, 4x \dots$ etc. For example, the number of pairs that MAY have a GCD of 2 is equal to the number of pairs of even elements. But then we have to remove pairs of elements with GCD 4, 6, 8... etc.

The idea is, let’s create an array $B$, where $B[i]$ equals the number of unique ordered pairs of elements from $A$ whose GCD MAY be $i$, and then after applying Inclusion-Exclusion, it becomes exactly $i$. It is trivial to see that the length of $B$ should be 1 greater than the maximum element in $A$, as the GCD of any pair cannot exceed it. Two elements can have a GCD of $X$ if $X$ divides both of them. Let $C[i]$ be the number of elements in $A$ processed so far, such that those elements are divisible by $i$. So the algorithm for the solution becomes something like:

1. Perform SPF sieve to build the `spf` array for fast factorization.
2. Let $M$ be the largest element in $A$. Initialize $B$ and $C$ with $M+1$ zeros.
3. Process each element in $A$ sequentially.
4. For each element, use `spf` to get its prime factors. Then build the factors from it. For each factor $i$, $B[i] += C[i]$, and $C[i] += 1$, happening in order.
5. After this loop, run a loop from $M$ down to 1. For every $i$, $B[i] -= B[j]$, where $j = 2i, 3i, \dots xi$, and $xi \le M$.
6. For any query $X$, if $X \le M$, return $B[X]$, else return 0.

Python code is as follows (assumes `spf` is built from the above code):

```python
def build_all_factors(p_factors:list[int]) -> list[int]:
    all_factors = [1]
    i, n = 0, len(p_factors)
    while i < n:
        ct, num = 0, p_factors[i]
        # find the frequency of a certain prime
        while i < n and p_factors[i] == num:
            i += 1
            ct += 1
        m = len(all_factors)
        # multiply all possible divisors with a power of the current prime
        # this power must not exceed the frequency of the prime
        for j in range(m):
            mul = 1
            for k in range(ct):
                mul *= num
                all_factors.append(all_factors[j]*mul)
    return all_factors

def solve(A:list[int], N:int, Q:int, Q_arr:list[int]) -> list[int]:
    M = max(A)
    B, C = [0]*(M+1), [0]*(M+1)
    for a in A:
        # get prime factors
        p_factors = get_prime_factors(a)
        # build all divisors
        all_factors = build_all_factors(p_factors)
        for factor in all_factors:
            # update B and C
            B[factor] += C[factor]
            C[factor] += 1
    for i in reversed(range(1, M+1)):
        # Inclusion-Exclusion Loop
        for j in range(2*i, M+1, i):
            B[i] -= B[j]
    answer = [B[q] if q <= M else 0 for q in Q_arr]
    return answer

answer = solve([2, 4, 5, 1, 6, 9, 18], 7, 3, [1, 3, 2])
print(answer)
# [13, 1, 5]
```

### How to identify the pattern:

* Usually involves GCD or factorization.
* Constraints for array elements may be $5 \times 10^4$ to $2 \times 10^5$ for 2 seconds, or $10^6$ for 3 to 4 seconds.
* Asks for either range queries or the number of ordered pairs satisfying some property.

---

## Constructive Proofs

There are many questions of some form: Construct an array of $N$ integers satisfying condition $X$. Sometimes the trick is to build a solution for a small $N$ like 2 or 3, and then every larger $N$ is constructed from it or from a similar pattern.

For example:

> You are given an integer $N$. Construct a permutation of 1 to $N$ (or report that it is not possible), such that no prefix sum is divisible by 3. That is, there is no $i$, such that $1 \le i \le n$, $a_1 + a_2 + a_3 \dots + a_i \equiv 0 \pmod 3$. Here $1 \le N \le 10^6$.

The first thing to note is that if the sum of 1 to $N$ is divisible by 3, it is not possible to construct a valid permutation as the total sum is inherently divisible by 3.

Let’s try solving for some small cases:
For $n = 1$: 1
For $n = 4$: 1 3 4 2
For $n = 7$: 1 3 6 4 2 7 5

If we look for a pattern, it goes something like this:
The first element is $1 \bmod 3$. Next, all elements are $0 \bmod 3$. Then it alternates between $1 \bmod 3$ and $2 \bmod 3$. So if we just make the array in modulo 3, we have:
1 0 0 0 ... 0 1 2 1 2 ... 2 1 2

It is now easier to prove, as the prefix sum is always either 1 or 2 modulo 3. So this is a valid construction!

### How to identify a pattern:

* You have to construct a permutation, rearrange an array, or evaluate some value from a permutation.
* If you can solve for an array of $n - 1$ or $n - 2$, you can solve for a larger value. Some base cases can reveal a pattern (solve for small examples with a brute-force algorithm; up to $n = 10$, even exponential works).
* Constraints are usually linear, close to $10^5$.

---

## Modular Arithmetic

This topic is often more of a sub-problem rather than a unique problem on its own. Usually, you have to calculate some value, but since it can be too large, you evaluate it under a modulo, like $10^9 + 7$ or $998244353$. Below are some of the most common calculation functions for this:

```python
MOD = int(1e9 + 7)

def add(a:int, b:int) -> int:
    return ((a % MOD) + (b % MOD)) % MOD

def sub(a:int, b:int) -> int:
    return add((a % MOD) - (b % MOD) % MOD, MOD)

def mul(a:int, b:int) -> int:
    return ((a % MOD) * (b % MOD)) % MOD

def powmod(x:int, n:int) -> int:
    p = 1
    while n > 0:
        if n % 2 == 1:
            p = mul(p, x)
        x = mul(x, x)
        n //= 2
    return p

def inv(a:int) -> int:
    return powmod(a, MOD - 2)

def div(a:int, b:int) -> int:
    return mul(a, inv(b))

# pre-processing
M = 100005
fact, invfact = [1] * M, [1] * M
for i in range(2, M):
    fact[i] = mul(fact[i-1], i)
    invfact[i] = inv(fact[i])

def nCk(n:int, k:int) -> int:
    if k > n or n < 0 or k < 0:
        return 0
    # nCk = n! / ((n-k)! * (k!))
    return mul(fact[n], mul(invfact[n-k], invfact[k]))
```

Consider this problem:

> You are given a strip of length of $N$ units. You can perform cuts to divide it into integer lengths. How many different possible partitions can happen? Two partitions are different if the number of cuts is different or if the size of the $i$-th cut is different for some $i$. $N$ is between 2 and $10^5$.

Let $k$ be the number of cuts we make. So there will be $k + 1$ sections. Let their sizes be $x_0, x_1, x_2, \dots x_k$.

We know, $x_0 + x_1 + x_2 \dots + x_k = N$. This is exactly the beggar's formula (stars and bars), with the solution being $\binom{n+k}{k}$. Using the `nCk` and `add` functions in the above code, this is straightforward!

### How to identify such a concept:

* It is explicitly mentioned that modulo should be used.
* Usually, only the `add` or `mul` function is enough.
* Sometimes the answer involves powers of 2 (or $N$), so a power function is needed.
* If counting is explicitly mentioned, pre-processing factorials + the `nCk` function is needed.

---

## Pigeonhole Principle

This principle basically states: "If there are $N$ pigeons and $N - 1$ holes, at least one hole has 2 or more pigeons."
This principle is most useful when you need to prove that after a certain number of elements, 2 elements fall into the same "class". Consider this:

> Given an array $A$ of $N$ positive integers, rearrange them so that for all $i$ such that $1 \le i < N$, $i$ is odd and $|A[i+1] - A[i]| \equiv 0 \pmod i$. Constraints: $2 \le N \le 5\times 10^3$, $1 \le A[i] \le 10^9$, $N$ is even.

Here we can apply the Pigeonhole Principle repeatedly. First, since we have $N$ integers, under modulo $(N - 1)$, there are at least 2 integers with the same value, as modulo $N - 1$ has $N - 1$ "holes" but we have $N$ "pigeons".
So we keep those 2 numbers as the last 2. We can apply the same process for the remaining $N - 2$ numbers, and so on.

### How to identify such a concept:

* Usually involves constructing/rearranging an array to satisfy some property (typically involving modulo).
* It is guaranteed that if the answer exists, it can be found quickly enough. (Try dry-running a few cases to see if the number of steps to find an answer is bounded by some known variable like $N$).
* Constraints may be quadratic (~$5 \times 10^3$) or linear (~$10^5$) depending on the number of "holes" and how fast they can be counted and used.

---

## Common Formulae


$$\sum_{1 \le i \le n} i = n(n+1)/2$$

$$\sum_{1 \le i \le n} i^2 = n(n+1)(2n+1)/6$$

$$\sum_{1 \le i \le n} i^3 = (n(n+1)/2)^2$$

$$n! = n * (n - 1)! , 0! = 1$$

$${}^nC_2 = n(n-1)/2$$

$${}^nC_0 = {}^nC_n = 1$$

$${}^nC_k = {}^{n-1}C_{k-1} + {}^{n-1}C_k \forall k \in [1, n)$$

$$Beggars\ formula : {}^{n+r-1}C_n$$


[Link to C++ code covering all python snippets above](https://onlinegdb.com/fNfJZQG2v)
[Local file: ](../static/code_files/number_theory.cpp)

## Practice Problems

* [2225 A. A Number Between Two Others](https://codeforces.com/problemset/problem/2225/A)
* [2208 A. Bingo Candies](https://codeforces.com/problemset/problem/2208/A)
* [633 A. Ebony And Ivory](https://codeforces.com/problemset/problem/633/A)
* [1201 B. Zero Array](https://codeforces.com/problemset/problem/1201/B)
* [2244 C. Stepan And Permutation](https://codeforces.com/problemset/problem/2244/C)
* [1349 A. Orac And LCM](https://codeforces.com/problemset/problem/1349/A)
* [1798 D. Shocking Arrangement](https://codeforces.com/problemset/problem/1798/D)
* [1907 E. Good Triples](https://codeforces.com/problemset/problem/1907/E)
* [1795 D. Triangle Coloring](https://codeforces.com/problemset/problem/1795/D)
* [1994 D. Funny Game](https://codeforces.com/problemset/problem/1994/D)
#include <iostream>
#include <vector>
#include <tuple>
#include <cmath>
#include <algorithm>

// ==========================================
// FILE 1: Linear Diophantine Equation Solver
// ==========================================
namespace File1 {
    std::tuple<long long, long long, long long> extended_gcd(long long a, long long b) {
        if (b == 0) {
            return {a, 1, 0};
        }
        auto [g, x1, y1] = extended_gcd(b, a % b);
        long long x = y1;
        long long y = x1 - (a / b) * y1;
        return {g, x, y};
    }

    void solve(long long A, long long B, long long N) {
        auto [g, s1, s2] = extended_gcd(A, B);
        
        if (N % g != 0) {
            std::cout << "No integer solutions possible.\n";
            return;
        }
        
        // Scale base solution to target N
        long long factor = N / g;
        long long s1_ = s1 * factor;
        long long s2_ = s2 * factor;
        
        long long step_a = A / g;
        long long step_b = B / g;
        
        // C++ division truncates towards zero; using floating-point std::ceil/std::floor
        // correctly mirrors Python's precision for mathematical bounds checking
        long long min_k = std::ceil(-static_cast<double>(s1_) / step_b);
        long long max_k = std::floor(static_cast<double>(s2_) / step_a);
        
        if (min_k > max_k) {
            std::cout << "No non-negative integer solutions.\n";
            return;
        }
        
        // Pick valid k (e.g., min_k for smallest x)
        long long k = min_k;
        long long x = s1_ + k * step_b;
        long long y = s2_ - k * step_a;
        
        std::cout << A << " * " << x << " + " << B << " * " << y << " = " << N << "\n";
    }
}

// ==========================================
// FILE 2: Divisors and Inclusion-Exclusion
// ==========================================
namespace File2 {
    const int MAX_N = 1000000;
    std::vector<int> spf;

    void init_sieve() {
        spf.assign(MAX_N + 1, -1);
        long long i = 2;
        while (i * i <= MAX_N) {
            if (spf[i] == -1) {
                for (long long j = i; j <= MAX_N; j += i) {
                    if (spf[j] == -1) {
                        spf[j] = i;
                    }
                }
            }
            i += 1;
        }
        while (i <= MAX_N) {
            if (spf[i] == -1) {
                spf[i] = i;
            }
            i += 1;
        }
    }

    std::vector<int> get_prime_factors(int k) {
        std::vector<int> factors;
        while (k > 1) {
            int sp = spf[k];
            while (k > 1 && spf[k] == sp) {
                k /= spf[k];
                factors.push_back(sp);
            }
        }
        return factors;
    }

    std::vector<long long> build_all_factors(const std::vector<int>& p_factors) {
        std::vector<long long> all_factors = {1};
        int i = 0;
        int n = p_factors.size();
        
        while (i < n) {
            int ct = 0;
            int num = p_factors[i];
            while (i < n && p_factors[i] == num) {
                i++;
                ct++;
            }
            int m = all_factors.size();
            for (int j = 0; j < m; j++) {
                long long mul = 1;
                for (int k = 0; k < ct; k++) {
                    mul *= num;
                    all_factors.push_back(all_factors[j] * mul);
                }
            }
        }
        return all_factors;
    }

    std::vector<long long> solve(const std::vector<int>& A, int N, int Q, const std::vector<int>& Q_arr) {
        if (A.empty()) return {};
        int M = *std::max_element(A.begin(), A.end());
        std::vector<long long> B(M + 1, 0), C(M + 1, 0);
        
        for (int a : A) {
            auto p_factors = get_prime_factors(a);
            auto all_factors = build_all_factors(p_factors);
            for (long long factor : all_factors) {
                if (factor <= M) {
                    B[factor] += C[factor];
                    C[factor] += 1;
                }
            }
        }
        
        for (int i = M; i >= 1; i--) {
            for (int j = 2 * i; j <= M; j += i) {
                B[i] -= B[j];
            }
        }
        
        std::vector<long long> answer;
        answer.reserve(Q_arr.size());
        for (int q : Q_arr) {
            if (q <= M) {
                answer.push_back(B[q]);
            } else {
                answer.push_back(0);
            }
        }
        return answer;
    }
}

// ==========================================
// FILE 3: Modular Arithmetic & Combinatorics
// ==========================================
namespace File3 {
    const long long MOD = 1e9 + 7;

    long long add(long long a, long long b) {
        return ((a % MOD) + (b % MOD)) % MOD;
    }

    long long sub(long long a, long long b) {
        // Adding MOD before the final modulo guarantees positive results 
        // unlike native C++ negative modulo behaviors
        return (((a % MOD) - (b % MOD)) % MOD + MOD) % MOD;
    }

    long long mul(long long a, long long b) {
        return ((a % MOD) * (b % MOD)) % MOD;
    }

    long long powmod(long long x, long long n) {
        long long p = 1;
        x %= MOD;
        while (n > 0) {
            if (n % 2 == 1) {
                p = mul(p, x);
            }
            x = mul(x, x);
            n /= 2;
        }
        return p;
    }

    long long inv(long long a) {
        return powmod(a, MOD - 2);
    }

    long long div(long long a, long long b) {
        return mul(a, inv(b));
    }

    const int MAX_M = 100005;
    std::vector<long long> fact(MAX_M, 1);
    std::vector<long long> invfact(MAX_M, 1);

    void init_fact() {
        for (int i = 2; i < MAX_M; i++) {
            fact[i] = mul(fact[i - 1], i);
            invfact[i] = inv(fact[i]);
        }
    }

    long long nCk(long long n, long long k) {
        if (k > n || n < 0 || k < 0) {
            return 0;
        }
        return mul(fact[n], mul(invfact[n - k], invfact[k]));
    }
}

// ==========================================
// ENTRY POINT & TEST CALLS
// ==========================================
int main() {
    // -------------------------
    // Run File 1 Tests
    // -------------------------
    std::cout << "--- FILE 1 TESTS ---\n";
    File1::solve(3, 2, 1);     // Output: No non-negative integer solutions.
    File1::solve(4, 6, 9);     // Output: No integer solutions possible.
    File1::solve(3, 7, 41);    // Output: 3 * 2 + 7 * 5 = 41
    std::cout << "\n";

    // -------------------------
    // Run File 2 Tests
    // -------------------------
    std::cout << "--- FILE 2 TESTS ---\n";
    File2::init_sieve(); // Precompute SPF array
    
    auto factors = File2::get_prime_factors(676767);
    std::cout << "[";
    for(size_t i = 0; i < factors.size(); ++i) {
        std::cout << factors[i] << (i + 1 == factors.size() ? "" : ", ");
    }
    std::cout << "]\n"; // Expected: [3, 7, 7, 13, 353]

    std::vector<int> A = {2, 4, 5, 1, 6, 9, 18};
    std::vector<int> Q_arr = {1, 3, 2};
    auto ans2 = File2::solve(A, 7, 3, Q_arr);
    
    std::cout << "[";
    for(size_t i = 0; i < ans2.size(); ++i) {
        std::cout << ans2[i] << (i + 1 == ans2.size() ? "" : ", ");
    }
    std::cout << "]\n\n"; // Expected: [13, 1, 5]

    // -------------------------
    // Run File 3 Tests
    // -------------------------
    std::cout << "--- FILE 3 TESTS ---\n";
    File3::init_fact(); // Precompute factorials and their inverses

    std::cout << "add(1e9, 15) \t\t = " << File3::add(1000000000, 15) << "\n";
    std::cout << "sub(5, 10) \t\t = " << File3::sub(5, 10) << "\n";
    std::cout << "mul(1e9, 2) \t\t = " << File3::mul(1000000000, 2) << "\n";
    std::cout << "powmod(2, 10) \t\t = " << File3::powmod(2, 10) << "\n";
    std::cout << "div(100, 2) \t\t = " << File3::div(100, 2) << "\n";
    
    std::cout << "nCk(5, 2) \t\t = " << File3::nCk(5, 2) << "\n";
    std::cout << "nCk(10, 3) \t\t = " << File3::nCk(10, 3) << "\n";
    std::cout << "nCk(100000, 50000) \t = " << File3::nCk(100000, 50000) << "\n";
    
    return 0;
}
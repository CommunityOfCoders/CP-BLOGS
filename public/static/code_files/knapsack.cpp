/******************************************************************************

Welcome to GDB Online.
GDB online is an online compiler and debugger tool for C, C++, Python, Java, PHP, Ruby, Perl,
C#, OCaml, VB, Swift, Pascal, Fortran, Haskell, Objective-C, Assembly, HTML, CSS, JS, SQLite, Prolog.
Code, Compile, Run and Debug online from anywhere in world.

*******************************************************************************/
#include <iostream>
#include <vector>
#include<algorithm>
using namespace std;

int knapsack(vector<pair<int,int>> &items, int W) {
	// initialise with zeroes
	vector<int> dp(W + 1, 0);
	for(auto&[w, v] : items) {
		// iterate from W to w
		for(int i = W; i>=w; i--)
		{
			dp[i] = max(dp[i], dp[i-w]+v);
		}
	}
	// return max value in dp
	return *max_element(dp.begin(), dp.end());
}


int knapsack_with_multiple(vector<tuple<int,int, int>> &items, int W) {
	// initialise with zeroes
	vector<int> dp(W + 1, 0);
	for(auto&[w, v, f] : items) {
		int factor = 1;
        while(f > 0){
            int multiplier = min(factor, f);
            int w_= multiplier*w,v_ = multiplier*v;
            // iterate in [w_, W] in reverse
            for(int i = W; i>=w_;i--){
                dp[i] = max(dp[i-w_] + v_, dp[i]);
            }
            f -= multiplier;
            factor *= 2;
        }
	}
	// return max value in dp
	return *max_element(dp.begin(), dp.end());
}

int coin_change(int amount, vector<int> &coins){
    vector<unsigned int> dp(amount+1, 0);
    // not taking anything is a single possibility
    dp[0] = 1;
    for(auto&c : coins){
        // range is reverse of our finite case
        for(int i = c; i<=amount;i++){
            dp[i] += dp[i-c];
        }
    }
    return dp[amount];
}

int main()
{
	vector<pair<int,int>> items = {
		{3, 5},
		{5, 7},
		{12, 20},
		{9, 15}
	};
	int W = 20;
	cout<<"Max profit = "<<knapsack(items, W)<<endl;
	vector<tuple<int,int,int>> items_2 = {
		{3, 5, 2},
		{5, 7, 3},
		{12, 20, 1},
		{9, 15, 2}
	};
	int W_2 = 29;
	cout<<"Max profit with repeated items = "<<knapsack_with_multiple(items_2, W_2)<<endl;
	int amount = 30;
	vector<int> coins ={2,5,3,10};
	cout<<"Possible combinations = "<<coin_change(amount, coins)<<endl;
	return 0;
}
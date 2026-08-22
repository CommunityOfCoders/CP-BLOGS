#include <iostream>
#include <vector>
#include <algorithm>
#include <unordered_map>
#include <stack>
#include<map>
#include <cstring>
#include <set>
#include <string>
#include <iomanip>
#include <numeric>
using namespace std;
 
#define fastio() ios::sync_with_stdio(false); cin.tie(NULL)
#define ll long long
using vi=vector<int>;
using vll=vector<long long>;
const ll mod = 1e9 + 7;
 
//recursion which gives tle

// int func(vi &vec , int l , int r , int sum){
//     int ans = sum;

//     if (l > r)
//         return sum;
   
//     for (int i = l; i <= r; i++) {
//         if (vec[i] < 0){
//             ans = max(ans , func(vec, l , i-1 , sum + abs(vec[i])));
//         }
//         else{
//              ans = max(ans , func(vec, i+1 , r ,  sum + abs(vec[i])));
//         }
//     }

//     return ans;
// }

void solve(){
    int n;
    cin>>n;

    vll vec(n);
    for(auto &it : vec)cin>>it;

    vector<ll>dp1(n , 0);
    vector<ll>dp2(n , 0);


    // 1. POSITIVES (Left to Right):
    // Picking a positive number at index 'i' deletes its prefix (0 to i).
    // To collect positive numbers without losing them, we process left-to-right.
    // dp1[i] = total positive coins collected from index 0 up to index i.

    for(int i = 0 ; i < n ; i++){
        dp1[i] = (i-1 >= 0 ? dp1[i-1] : 0) + (vec[i] > 0 ? (vec[i]) : 0);
    }

    
    // 2. NEGATIVES (Right to Left):
    // Picking a negative number at index 'i' deletes its suffix (i to n-1).
    // To collect negative numbers without losing them, we process right-to-left.
    // dp2[i] = total absolute negative coins collected from index i to index n-1.

    for(int i = n-1 ; i >= 0 ; i--){
        
        dp2[i] = (i+1 <= n-1 ? dp2[i+1] : 0) + (vec[i] < 0 ? abs(vec[i]) : 0);
        
    }

    //i take hint for this block only

   ll ans = max(dp1[n-1], dp2[0]);

    for(int i = 0 ; i < n-1 ; i++){
        // allows us to collect both sides without destroying remaining elements.
        ans = max(ans , dp1[i] + dp2[i+1]);
    }

    cout<<ans<<endl;
}
 
int main() {
    fastio();
 
    int t;
    cin >> t;
 
    while(t--){
        solve();
    }
 
    return 0;
}
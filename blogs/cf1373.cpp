#include <iostream>
#include <vector>
#include <algorithm>
#include <unordered_map>
#include <stack>
#include<map>
#include<queue>
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

void solve(){
    string s;
    cin>>s;

    int cnt0 = 0 , cnt1 = 0;
    for(int i = 0 ; i < s.size() ; i++){
        if(s[i] == '0'){
            cnt0++;
        }else{
            cnt1++;
        }
    }

    int t = min(cnt0 , cnt1) * 2; 

    //if length of deleted chars are even and if length must not be divisible by 4
    if(t % 2 == 0 && t % 4 != 0){
        cout<<"DA"<<endl;
    }else{
        cout<<"NET"<<endl;
    }
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
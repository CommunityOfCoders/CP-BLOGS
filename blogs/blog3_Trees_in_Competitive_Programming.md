---
layout: post
title: "Trees in Competitive Programming: A Complete From-Scratch Tutorial To Essentials"
date: 2026-09-08
categories: [Competitive Programming, Algorithms]
tags: [trees, graph-theory, dfs, binary-lifting, codeforces, algorithms]
math: true
---

Trees are pretty cool. But many people simply skip questions when they see a tree mentioned. I’ve heard people say:

> "It feels complex."
> "I only know how to work with binary trees."
> "How do I even take input?"

This blog addresses that by giving you a complete, from-scratch tutorial on how to work with tree-related problems in competitive programming and some standard algorithms/approaches surrounding them.

This blog is a bit more technical than the previous ones, so I recommend that after reading it once, you practice problems or write your own tree algorithms/structures and come back here when stuck so the concepts are easier to grasp.

## Introduction

A tree is simply a connected undirected graph of $n$ nodes with $n - 1$ edges.

Some properties and facts of trees include:
* The path between any 2 nodes is unique.
* Consider any node as a root; all other nodes have a single unique parent.
* The diameter (maximum distance between any two nodes in a tree) ranges from 2 to $n - 1$.
* A post-order traversal of a tree always takes $n$ steps.
* A node’s ancestors consist of all the nodes on the path from it to the root.
* A node’s descendants are the direct and indirect children (children of other descendants) of the node.
* The set of a node and its descendants constitute the subtree of the node.

Most people are stuck at input only. Primarily, tree-based problems give one of two types of inputs:

**1. Direct edges**
The first line is $N$ (number of nodes). The next $N - 1$ lines contain two space-separated integers $u_i, v_i$ in $[1, n]$, which indicates an edge between node $u_i$ and $v_i$. Node 1 is not necessarily the root.

```text
N
u_1 v_1
u_2 v_2
…
u_{n-1} v_{n-1}

```

We can take input for it like this:

```cpp
int n; cin >> n;
vector<vector<int>> adj(n);
for(int i = 1; i < n; i++) {
    int u, v; cin >> u >> v;
    u--, v--; // comment this line if u, v are in 0-based indexing
    adj[u].push_back(v);
    adj[v].push_back(u);
}

```

**2. Parent list**
The first line is $N$ (number of nodes). The next line contains $N - 1$ space-separated integers $p_i$, where the first integer is the parent of node 2, the second is the parent of node 3, and so on until the last integer is the parent of node $n$. Here, node 1 is the root of the tree.

```text
N
p_1 p_2 … p_{n-1}

```

We take the input in almost the same way:

```cpp
int n; cin >> n;
vector<vector<int>> adj(n);
for(int i = 1; i < n; i++) {
    int p; cin >> p;
    p--; // comment this if input is 0-indexing based
    adj[p].push_back(i);
    adj[i].push_back(p); // can comment this if p < i is guaranteed 
}

```

Then almost all of our problems devolve down to the following function:

```cpp
auto dfs(int par, int u, vector<vector<int>>& adj) -> void { // add more arguments as needed
    // do something here if pre-order traversal (children depend on parent)
    cout << u << endl;
    for(auto& v : adj[u]) {
        if(v == par) continue;
        dfs(u, v, adj);
        // do something here if post-order traversal (parent depends on children)
    }
    return; // or return some value
}
dfs(-1, 0, adj);

```

Sometimes it doesn’t even have to be DFS, and you can solve the problem with just the adjacency list. Consider this problem:

> You are given a tree with $n$ nodes. Each node has a value associated with it. Output $n$ integers on a line, where the $i$-th integer is the maximum score of the $i$-th node. The score of a node $i$ in the tree is defined as the maximum over this function for all $j \neq i$: $f(i,j) =$ GCD of all values on the simple path from $i$ to $j$. Constraints: $1 \le n \le 2 \times 10^5$.

Sounds intimidating right? But it isn’t. First, note that repeated GCD is non-increasing. i.e., $\gcd(S) \le \min(S)$ for any set $S$. So for any $i$, the best $j$ will be one of its direct neighbors, because if you try to take some other node, you will reduce the value below the values of the neighbors. So we get:

```cpp
// ... input ...
for(int i = 0; i < n; i++) {
    int mx_val = 0; // max score;
    for(auto& v : adj[i]) mx_val = max(mx_val, gcd(val[i], val[v]));
    cout << mx_val << ((i == n - 1) ? '\n' : ' ');
}

```

There are also problems whose solution is determined simply by the number of neighbors of a node! Let’s now look at some standard algorithms relating to tree problems.

## Precalculating Values

### 1. Calculate the Depth of Each Node

The tree is rooted at node 1, and its depth is 0. The depth of every node is defined as the number of edges on the minimal path from it to the root.

```cpp
auto dfs(int par, int u, vector<vector<int>>& adj, vector<int>& depth, int d) -> void { 
    // set depth of current node
    depth[u] = d;
    for(auto& v : adj[u]) {
        if(v == par) continue;
        dfs(u, v, adj, depth, d + 1);
        // one level deeper
    }
    return;
}

// ... input ...
vector<int> depth(n, -1);
dfs(-1, 0, adj, depth, 0); // root starts at 0
for(int i = 0; i < n; i++) {
    // output in 1-based indexing
    cout << "Depth of node " << i + 1 << " is " << depth[i] << endl;
}

```

### 2. Calculate the Subtree Size of Each Node

The tree is rooted at node 1, and its subtree size is $n$ (the entire tree). The subtree of a node includes itself and all its descendants.

```cpp
auto dfs(int par, int u, vector<vector<int>>& adj, vector<int>& s_size) -> int { 
    // set size of current node's subtree = 1 (only the current node)
    int cur_size = 1;
    for(auto& v : adj[u]) {
        if(v == par) continue;
        cur_size += dfs(u, v, adj, s_size);
        // add the subtree size of its children
    }
    return s_size[u] = cur_size; // set and return the calculated size
}

// ... input ...
vector<int> s_size(n, -1);
dfs(-1, 0, adj, s_size); // root starts at 0
for(int i = 0; i < n; i++) {
    // output in 1-based indexing
    cout << "Subtree Size of node " << i + 1 << " is " << s_size[i] << endl;
}

```

### 3. Calculate the Parent of Each Node

The tree is rooted at node 1. Calculate the direct parent of each node (assume the root’s parent is -1).

```cpp
auto dfs(int par, int u, vector<vector<int>>& adj, vector<int>& parent) -> void {
    // set parent of current node
    parent[u] = par;
    for(auto& v : adj[u]) {
        if(v == par) continue;
        dfs(u, v, adj, parent);
        // traverse the children
    }
    return;
}

// ... input ...
vector<int> parent(n, -1);
dfs(-1, 0, adj, parent); // root starts at 0, parent is -1
for(int i = 0; i < n; i++) {
    // output in 1-based indexing
    cout << "Parent of node " << i + 1 << " is " << parent[i] + 1 << endl;
}

```

This is useful when the input is in direct edges and you need a way to track each node’s direct parent.

## Standard Problems

*(Note: All these are inspired from the CSES Problemset Tree section)*

### 1. Diameter of a Tree

The longest path between any two nodes in a tree. For this problem, we use the fact that any node in a tree has maximum distance with at least one endpoint of some diameter in the tree. Then from that one end, we find the node furthest from it to complete the diameter.

```cpp
// ... input ...
vector<int> depth_1(n, -1);
// here the dfs function is same as we defined above for finding depth 
dfs(-1, 0, adj, depth_1, 0); // first iteration to find one end

int end_1 = 0;    
for(int i = 0; i < n; i++) {
    if(depth_1[end_1] < depth_1[i]) end_1 = i;
}

vector<int> depth_2(n, -1);
dfs(-1, end_1, adj, depth_2, 0); // second iteration to find the other end

int end_2 = 0;
for(int i = 0; i < n; i++) {
    if(depth_2[end_2] < depth_2[i]) end_2 = i;
}
cout << depth_2[end_2] << endl; // diameter

```

### 2. Centroid of a Tree

The centroid of a tree is defined as a node which, if rooted, has no child whose subtree size is more than the sum of the subtree sizes of its other children (or $\le n/2$).

The idea here is to first take any one node as the root and find all node’s subtree sizes from it. Then we check if it satisfies the condition for being a centroid. If it doesn’t, it is guaranteed that a centroid exists in the largest subtree among its children, so we only need to adjust the sizes of the root and the largest child, and then assume the largest child as the new root. We repeat this until we find a centroid.

```cpp
// ... input ...
vector<int> s_size(n, -1);
dfs(-1, 0, adj, s_size); // subtree size calculation function as given before

int root = 0, centroid = -1, limit = n;
while(centroid == -1 && limit > 0) {
    limit--; // guaranteed to reach centroid in some number of steps
    int largest_child = -1;
    for(auto& v : adj[root]) {
        if(largest_child == -1 || s_size[v] > s_size[largest_child]) {
            largest_child = v;
        }
    }
    if(2 * s_size[largest_child] > n - 1) { // size of largest child's subtree > n/2
        s_size[root] -= s_size[largest_child];
        s_size[largest_child] = n;
        root = largest_child;
    } else {
        centroid = root; // exit condition
    }
}
if(centroid == -1) centroid = root;
cout << centroid + 1 << endl; // 1-based output

```

### 3. Sum of All Paths

Given a tree of $n$ nodes, find the sum of all paths between two nodes $u, v$ where $1 \le u < v \le n$.

First, we calculate for each node the sum of distances to all its descendants. There is a simple recurrence relation for this:
`distances[i] = sum(distances[j] + s_size[j])` for all $j$ that are direct children of $i$.
This is because the node $i$ is at 1 more distance than node $j$ for all the nodes in its subtree, so that 1 extra distance is counted in `s_size[j]`.

Then we run a second DFS, this time a pre-order traversal where we use this formula for all $i$ that is not the root:
`distances[i] = distances[par] + n - 2 * s_size[i]`
where `par` is the parent of node $i$.

Once we get the updated distances array for all nodes, we sum up the values and divide by 2 (as the path between every pair is counted twice, once from each end).

```cpp
// functions
auto dfs(int par, int u, vector<vector<int>>& adj, vector<int>& s_size, vector<long long>& distances) -> int {
    // set size of current node's subtree = 1 (only the current node)
    int cur_size = 1;
    distances[u] = 0; // initialisation
    for(auto& v : adj[u]) {
        if(v == par) continue;
        cur_size += dfs(u, v, adj, s_size, distances); // add the subtree size of its children 
        distances[u] += s_size[v] + distances[v]; // add sum of distances to children in subtree of v
    }
    return s_size[u] = cur_size; // set and return the calculated size
}

auto dfs2(int par, int u, vector<vector<int>>& adj, vector<int>& s_size, vector<long long>& distances) -> void {
    if(par != -1) {
        distances[u] = distances[par] + (adj.size() - 2ll * s_size[u]); // formula
    }
    for(auto& v : adj[u]) {
        if(v == par) continue;
        dfs2(u, v, adj, s_size, distances); // propagate the changes
    }
    return;
}

// ... input ...
vector<int> s_size(n, -1);
vector<long long> distances(n);

dfs(-1, 0, adj, s_size, distances); // root starts at 0
dfs2(-1, 0, adj, s_size, distances);

cout << (accumulate(distances.begin(), distances.end(), 0ll) / 2ll) << endl;

```

## Binary Lifting

### 1. Finding Kth Ancestor

> Given a tree of $n$ nodes rooted at node 1, you have to process $q$ queries of the type: $u, k$. You have to output the $k$-th ancestor of $u$, or -1 if it doesn’t exist. Both $u$ and $k$ are between 1 and $n$ inclusive.

The idea is to consider the $k$-th ancestor of a given node as a chain of its ancestors of powers of 2. For example, a node’s 5th ancestor is its 1st ancestor’s 4th ancestor (since 5 has bits 4 and 1). Or a node’s 15th ancestor is its 1st ancestor’s 2nd ancestor’s 4th ancestor’s 8th ancestor.

Let `lift[u][i]` denote the $2^i$ ancestor of node $u$. If such an ancestor doesn’t exist, `lift[u][i] = -1`. It is easy to see that `lift[u][0]` is basically the parent of $u$, and `lift[0][i] = -1`, as the root has no ancestors.

```cpp
// pre calculation
auto dfs(int par, int u, vector<vector<int>>& adj, vector<vector<int>>& lift, int& log_lim) -> void {
    int tmp = par;
    int i = 0;
    while (tmp != -1 && i < log_lim) {
        lift[u][i] = tmp;
        tmp = lift[tmp][i];
        i++;
    }
    for (auto& v : adj[u]) {
        if (v == par) continue;
        dfs(u, v, adj, lift, log_lim);
    }
}

// query function
int kth_ancestor(int u, int k, vector<vector<int>>& lift) {
    int tmp = u - 1;
    // input assumed to be 1 indexed
    while (tmp != -1 && k > 0) {
        int lsb = (k & (-k));
        tmp = lift[tmp][log2(lsb)];
        k -= lsb;
    }
    return (tmp == -1) ? -1 : tmp + 1;
}

// ... input ...
int log_lim = 21; // 21 for n=2e5, 25 for 1e6, 17 for 5e4, 13 for 5e3
vector<vector<int>> lift(n, vector<int>(log_lim, -1));
dfs(-1, 0, adj, lift, log_lim);

// example query
int u, k;
cin >> u >> k;
cout << kth_ancestor(u, k, lift) << endl;

```

### 2. Finding LCA (Least Common Ancestor)

The LCA of any two nodes is an ancestor of both nodes at the closest distance to both nodes. We can use our previous functions for help. Additionally, we also need to precalculate the depth vector.

It results in this function:

```cpp
int get_lca(int a, int b, vector<vector<int>>& lift, vector<int>& depth) {
    a--, b--; // 1 indexed
    if(depth[a] > depth[b]) swap(a, b);
    b = kth_ancestor(b + 1, depth[b] - depth[a], lift) - 1; // get to same depth
    if(a == b) return a + 1;
    
    int i = -1;
    // go to smallest ancestor in lift that is different
    while(lift[a][i + 1] != lift[b][i + 1]) i++;
    if(i == -1) return lift[a][0] + 1; // parent is lca
    
    return get_lca(lift[a][i] + 1, lift[b][i] + 1, lift, depth); // find lca recursively
}

```

Consider this problem:

> You are given a tree with $n$ nodes. Each node has a value associated with it. You are asked to process $q$ queries. Each query contains 2 integers $u$ and $v$ between 1 and $n$ inclusive. You are supposed to find the sum of all the values of the vertices on the simple path between $u$ and $v$. The size of the tree and number of queries go up to $10^5$. Value of nodes can go up to $10^9$.

Such problems can be solved elegantly due to no updates and the invertible nature of the operations. Let $f(u)$ define the sum of all values on the path from the root to $u$. Then the sum of values on the path from any node $u$ to node $v$ is:

$$g(u,v) = f(u) + f(v) - 2 \cdot f(\text{LCA}(u,v)) + \text{value of LCA}(u,v)$$

This is because the values covered once are those in the subtree of the LCA of $u$ and $v$, and those covered twice are in the path from the root to the LCA. Since subtraction removes the contribution of the LCA completely, we add it back once.
Similar logic can be applied to XOR or multiplication under modulo operations.

```cpp
// pre calculation function
auto dfs_make_f(int par, int u, vector<vector<int>>& adj, vector<long long>& f, vector<long long>& value, long long sm) -> void {
    sm += value[u];
    f[u] = sm;
    for(auto& v : adj[u]) {
        if(v == par) continue;
        dfs_make_f(u, v, adj, f, value, sm);
    }
}

// ... input ...
// lca precalc
vector<long long> f(n);
dfs_make_f(-1, 0, adj, f, value, 0);

// example query
int u, v; cin >> u >> v;
int z = get_lca(u, v, lift, depth);
u--, v--, z--; // to 0 indexing
long long result = f[u] + f[v] - 2 * f[z] + value[z];
cout << result << endl;

```

That’s all for the intro! Much of the remaining advanced section heavily borrows from range queries, so if you want to dive deeper into trees it would be a good idea to search that up next. Happy coding!

## Practice Problems

* [1843 C. Sum in Binary Tree](https://codeforces.com/problemset/problem/1843/C)[solution](https://codeforces.com/problemset/submission/1843/390835379)
* [1057 A. Bmail Computer Network](https://codeforces.com/problemset/problem/1057/A)[solution](https://codeforces.com/problemset/submission/1057/390836950)
* [522 A. Reposts](https://codeforces.com/problemset/problem/522/A)[solution](https://codeforces.com/problemset/submission/522/390842073)
* [2257 C. Spying on the Beaver](https://codeforces.com/problemset/problem/2257/C)
* [1905 B. Beginner's Zelda](https://codeforces.com/problemset/problem/1905/B)
* [982 C. Cut 'em all!](https://codeforces.com/problemset/problem/982/C)
* [1843 D. Apple Tree](https://codeforces.com/problemset/problem/1843/D)
* [1676 G. White-Black Balanced Subtrees](https://codeforces.com/problemset/problem/1676/G)
* [862 B. Mahmoud and Ehab and the bipartiteness](https://codeforces.com/problemset/problem/862/B)
* [1139 C. Edgy Tree](https://codeforces.com/problemset/problem/1139/C)
* [1336 A. Linova and Kingdom](https://codeforces.com/problemset/problem/1336/A)
* [1528 A. Parsa's Humongous Tree](https://codeforces.com/problemset/problem/1528/A)
* [2018 C. Tree Pruning](https://codeforces.com/problemset/problem/2018/C)
* [1739 D. Reset K Edges](https://codeforces.com/problemset/problem/1739/D)
* [1824 B1. LuoTianyi and the Floating Islands (Easy Version)](https://codeforces.com/problemset/problem/1824/B1)

Aside from this, do check out the Tree questions on [CSES](https://cses.fi/problemset/list/).



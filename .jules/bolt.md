## 2026-09-12 - Date grouping function bottleneck
**Learning:** Functions invoked for every element inside hot render loops (like grouping chat history dates) can cause significant latency when they re-allocate date objects, call formatting functions, or run expensive date operations continuously.
**Action:** Lift repeated date boundary calculations out of loops and compute them once. Use lightweight boundary comparisons (e.g. `isAfter`) and cache repeated static data maps rather than relying on heavy string formatting for each item.

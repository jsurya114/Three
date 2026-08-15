# Implementation Plan for Three

## Phase 0: Discovery and Planning (Completed)
- Read master plan.
- Evaluated environment: Node v22.22.3, Rust 1.97.1, Python 3.14.4, OpenClaw 2026.6.6 are available.
- Hardware: MacBook Air (M5, 16GB RAM, 10 Cores).
- Missing dependency: Ollama needs to be installed.

## Phase 1: OpenClaw Foundation
- Setup project structure (`apps/desktop`, `packages/*`, `agents/*`, etc.).
- Initialize OpenClaw workspace.
- Setup `Three` identity and base configuration.
- Implement one test agent.
- Setup `.env.local` based on `.env.example`.
- Setup journal and recovery workflow scripts/utilities.
- *Acceptance:* Three can receive a command and survive a restart.

## Phase 2: Permission System
- Implement Permission DB (PostgreSQL or SQLite to start).
- Implement Tool policy and Permission UI.
- Allow once, Always allow, Deny, and Audit logs.

## Phase 3: Computer Agent
- Application launching, File/Folder operations, Screenshot, Clipboard.

## Phase 4 & 5: Voice Agent
- VAD, Local ASR, Streaming transcription, TTS, Barge-in.

## Phase 6: Memory
- PostgreSQL, LanceDB integrations. Candidate profiles, semantic search.

## Phase 7: Email Agent
- Gmail OAuth, read/search/summarize/draft/send.

## Phase 8: GitHub/Coding Agent
- GitHub Auth, Repository access, Clone, Code analysis, Test, Commit, PR.

## Phase 9: Browser Agent
- OpenClaw browser integrations, Managed profiles (Chrome/Brave), Search, Navigation.

## Phase 10: Resume Agent
- PDF parsing, Candidate profile versioning, LanceDB embeddings.

## Phase 11: Job Agent
- Job provider abstraction, Deduplication, Matching, Ranking.

## Phase 12: Application Workflow
- Application preparation, Browser-assisted workflows, Tracking.

## Phase 13: Model Router
- Provider fallbacks, Task routing, Cost tracking.

## Phase 14: Parallel Agents
- Background tasks, Sub-agents, Task queue, Concurrent execution.

## Phase 15 & 16: Hardening and Polish
- Security audit, Rate limits, Crash recovery, Three UI, Animations, Settings.

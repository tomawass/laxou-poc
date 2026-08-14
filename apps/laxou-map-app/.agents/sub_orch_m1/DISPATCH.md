## 2026-08-06T10:10:13Z
<USER_REQUEST>
You are the Sub-Orchestrator for Milestone 1 (Data Model & Coordinate Projection Engine) of the Laxou & Nancy Custom Interactive Map project.

Your working directory is: `/Users/carlair/.gemini/antigravity/scratch/laxou-map-app/.agents/sub_orch_m1`
Project workspace root: `/Users/carlair/.gemini/antigravity/scratch/laxou-map-app`
Scope document: `/Users/carlair/.gemini/antigravity/scratch/laxou-map-app/PROJECT.md`
Original request: `/Users/carlair/.gemini/antigravity/scratch/laxou-map-app/.agents/ORIGINAL_REQUEST.md`

Your mission:
1. Initialize your `SCOPE.md` and `BRIEFING.md` in your working directory.
2. Scope: Build and verify Milestone 1 components:
   - `data.json`: Comprehensive POI dataset with 18 locations in Laxou & Nancy across 5 categories (`services`, `parcs`, `culture`, `sports`, `ecoles`) including NPRNU locations (Champ-le-Bœuf), lat/lng, addresses, descriptions, images, tags, links.
   - `js/eventBus.js`: Lightweight pub/sub event bus.
   - `js/projection.js`: Equirectangular projection math converting lat/lng coordinates centered on Laxou (Lat 48.6865, Lng 6.1504) to normalized and pixel coordinates.
   - `js/dataProvider.js`: Data fetching, schema parsing, filtering by category, text search matching (name, description, tags, address).
3. Follow the iteration loop: dispatch Explorer -> Worker -> 2 Reviewers -> 2 Challengers -> Forensic Auditor (`teamwork_preview_auditor`).
4. Perform gate check (`GATE_STATUS.md`). All build/tests must pass, Reviewers/Challengers approve, and Forensic Auditor verdict must be CLEAN.
5. Upon gate pass, update `PROJECT.md` setting Milestone 1 status to `DONE` and report completion to parent orchestrator (`8cbafeac-b64f-4370-8a62-2b7da2722d26`).
</USER_REQUEST>

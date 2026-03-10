# Gym Log

A progressive strength training tracker built for the 5/3/1 programme. Tracks barbell lifts and pull-ups across a structured 12-week cycle (3 cycles of 4 weeks), with three sessions per week (Tuesday, Thursday, Saturday).

Supports multiple users with PIN-based login, works offline, and syncs training data via GitHub.

## Features

- **Structured 12-week programme** — follows the 5/3/1 methodology with deload weeks
- **Four barbell lifts** — Squat, Bench Press, Deadlift, Overhead Press
- **Pull-up tracking** — per-set rep counters with band assistance levels (Thick, Medium, Light, Bodyweight)
- **Multi-user support** — PIN-based authentication with isolated data per user
- **Offline-first** — caches data in localStorage, syncs to GitHub when online
- **Progress reports** with:
  - Progress bars showing % of 12-week targets
  - Pace charts comparing actual vs. planned programme
  - Rep performance bar charts
  - Plateau detection (warns if no improvement in 3+ sessions)

## Tech Stack

| Component | Technology |
|---|---|
| Frontend | Single-page HTML + vanilla JavaScript + CSS |
| Backend | Cloudflare Workers (serverless API) |
| Data storage | JSON files in this GitHub repo |
| Charts | Custom Canvas API (no external libraries) |
| Fonts | Google Fonts (Barlow, Barlow Condensed) |

No build tools, no frameworks, no npm dependencies.

## Architecture

The app is a single HTML file (`index.html`) that talks to a Cloudflare Worker (`worker.js`). The Worker handles authentication and proxies read/write requests to the GitHub API, where training logs and programme data are stored as JSON files.

```
Browser (index.html)
    ↕
Cloudflare Worker (worker.js)
    ↕
GitHub API (logs/ and programmes/ directories)
```

## Project Structure

```
gym-log/
├── index.html          # Single-page app (all HTML, CSS, and JS)
├── worker.js           # Cloudflare Worker (API backend)
├── logs/               # Per-user training logs
│   ├── data-arek.json
│   ├── data-kris.json
│   └── data-diana.json
└── programmes/         # Per-user training programmes
    ├── program-arek.json
    ├── program-kris.json
    └── program-diana.json
```

## How It Works

### User flow

1. **Login** — enter username and PIN
2. **Home screen** — see all 12 weeks with session completion dots (empty = not started, orange = partial, green = complete)
3. **Log a session** — select a week, pick a day tab (Tue/Thu/Sat), log reps for each exercise using +/- buttons
4. **Finish** — session saves to GitHub automatically
5. **Progress** — view charts and progress bars to track performance against the programme

### Data storage

- **Programme files** (`programmes/program-<user>.json`) — define the planned weights, sets, reps, and pull-up targets for each of the 12 weeks
- **Log files** (`logs/data-<user>.json`) — store actual session data (weights lifted, reps completed, dates)

Both are plain JSON, committed directly to this repo via the GitHub API.

## Setup

### Prerequisites

- A [Cloudflare](https://www.cloudflare.com/) account (free tier is sufficient)
- A GitHub personal access token with repo read/write permissions

### Deploy the backend

1. Create a new Cloudflare Worker
2. Paste the contents of `worker.js`
3. Set the `GITHUB_TOKEN` environment variable in the Worker settings
4. Update `GITHUB_OWNER` and `GITHUB_REPO` constants in `worker.js` to point to your fork
5. Update user PINs in the `USERS` object in `worker.js`

### Deploy the frontend

1. Update the `WORKER_URL` constant in `index.html` to your Worker's URL
2. Update the `TARGETS` object with your 12-week weight goals
3. Serve `index.html` via GitHub Pages, Cloudflare Pages, or any static hosting

### Customising the programme

Edit the programme files in `programmes/` to set weights, sets, and reps for each week. The structure supports:
- Custom weights per set per week
- AMRAP sets (target reps ending with `+`, e.g. `"5+"`)
- Deload weeks (reduced intensity)
- Per-set pull-up band assignments

## Licence

This project is provided as-is for personal use.

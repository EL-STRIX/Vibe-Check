# GitHub Vibe Check: Build Phases

The step-by-step order for building the project. Each phase says what to read, what to build, and how to know it is finished. Follow the phases in order and do not skip ahead.

## 1. The Three Documents

This project has four documents. This one is the roadmap. The other three hold the details. Open them before starting and return to them at every phase.

| Short name | Full title | Use it for |
| --- | --- | --- |
| **Project Details** | GitHub Vibe Check: Project Details | The overall idea, core rules, what the user sees, reactions and extra features |
| **Build Instructions** | GitHub Vibe Check: Build Instructions for the AI Agent | Design spec, screen layouts, scoring rules, sample lines, edge cases, API setup, mobile rules, must-not-do list, definition of done |
| **Tech Stack** | GitHub Vibe Check: Tech Stack | Technology choices, the serverless function, GitHub APIs, token, hosting, caching, file structure |
| **Build Phases** (this doc) | GitHub Vibe Check: Build Phases | The order of work and the check at the end of each phase |

**If two documents ever seem to disagree:**

- Technology and files: Tech Stack wins
- Design, content, rules and scoring: Build Instructions wins
- The overall idea and feature list: Project Details wins
- If still unclear, ask the owner. Do not guess and do not add anything extra.

## 2. Rules for Every Phase

- Finish and test one phase before starting the next
- At the start of each phase, re-read the documents and sections listed for it
- At the end of each phase, run its check and fix problems before moving on
- Never use anything from the Tech Stack section 11 list ("What Is Not Used")
- Never break the Build Instructions section 10 list ("Must-Not-Do List")
- Keep the screen text short at all times: this is the heart of the project

## 3. Phase Overview

| Phase | Name | Result |
| --- | --- | --- |
| 0 | Setup | Project folder, accounts and token ready |
| 1 | Backend data function | `/api/vibe` returns real GitHub data |
| 2 | Design system and landing screen | The look and the first screen are done |
| 3 | Loading screen and basic result | A user can search and see profile and stats |
| 4 | Reaction engine | Score, title, badges, reaction and verdict work |
| 5 | Visual extras | Chart, heatmap, top repos, animations, confetti |
| 6 | Edge cases | Every wrong situation shows a funny message |
| 7 | Fun extras | Share card and compare mode |
| 8 | Mobile polish, final test and deploy | Live site passing every check |

The three phases in Build Instructions section 9 map onto these like this: its Phase 1 (MVP) is Phases 0 to 4 here, its Phase 2 (visual extras) is Phase 5 here, and its Phase 3 (fun extras) is Phases 6 to 8 here.

## Phase 0: Setup

**Goal:** everything ready before any code is written.

**Read first:** Tech Stack sections 1, 5, 6 and 9.

**Tasks:**

- Create the project folder with the exact file structure from Tech Stack section 9 (empty files are fine)
- Create `.gitignore` containing `.env.local`
- Owner creates the GitHub token (Tech Stack section 5) and the Vercel account (Tech Stack section 6)
- Put the token in `.env.local` for local testing, never in a code file
- Confirm `npx vercel dev` runs

**Done when:** the folder matches the structure, `.env.local` exists and is ignored by git, and the local dev command starts without errors.

## Phase 1: Backend Data Function

**Goal:** one working address, `/api/vibe?user=NAME`, that returns real GitHub data.

**Read first:** Tech Stack sections 3, 4 and 7. Project Details, section "Data Collected (GitHub API)".

**Tasks:**

- Build `api/vibe.js` in Node.js using the secret token from the environment variable `GITHUB_TOKEN`
- Clean the username (trim, remove a leading `@`, keep only valid characters)
- Call the REST and GraphQL calls listed in Tech Stack section 4
- Calculate the longest streak, the current streak and the commit hours
- Return the single JSON object shaped like the example in Tech Stack section 3
- Return the error codes `not_found`, `rate_limited` and `server_error`
- Add the cache header from Tech Stack section 7

**Do not build yet:** any scoring, titles or reactions. This function returns raw numbers only.

**Done when:**

- A big account, a small account and an empty account each return correct data
- A fake username returns `not_found`
- The token is not visible in any response

## Phase 2: Design System and Landing Screen

**Goal:** the look of the whole project is set and the first screen is finished.

**Read first:** Build Instructions sections 1, 2 (Landing part) and 8. Tech Stack section 2.

**Tasks:**

- Create `index.html` with the three screens in one page (only landing is visible for now)
- Create `style.css` with the colors, fonts, card style, gradient and dark and light themes from Build Instructions section 1, using CSS variables
- Build the landing screen exactly as described: heading, one short line, one input, one button, theme toggle
- Save the chosen theme with `localStorage`
- Build it for a 390px phone first, then scale up to desktop

**Done when:** the landing screen matches the design spec, both themes look clean, it looks good on phone and desktop, and it has no extra text or elements.

## Phase 3: Loading Screen and Basic Result

**Goal:** a visitor can type an id and see real profile data.

**Read first:** Build Instructions section 2 (Loading and Result parts, items 1 and 4 only). Tech Stack section 8.

**Tasks:**

- Create `app.js` with the screen switching
- Build the loading screen: pulsing blob and the rotating funny lines
- Call `/api/vibe` from the page. The page must never call GitHub directly
- Show the profile card (avatar, name, @id, one-line bio)
- Show the stats row: repos, stars, commits, PRs, followers, streak
- Abbreviate large numbers (1.2k, 3.4M)
- Add the "try another" button

**Done when:** typing a real id shows the loading screen, then the profile card and stats with correct numbers, and "try another" returns to the landing screen.

## Phase 4: Reaction Engine

**Goal:** the personality of the project works. This is the most important phase.

**Read first:** Build Instructions sections 3 and 4. Project Details, section "The Fun Part (Reactions)".

**Tasks:**

- Create `reactions.js` and put all logic and all lines in it
- Calculate the vibe score using exactly the point values in Build Instructions section 3
- Pick the score label from the four ranges
- Pick the dev title using the first matching rule in the title table
- Add the badges (maximum 4) and their rules
- Write at least 6 reaction lines for every title and every score label, in the tone of the samples in Build Instructions section 4
- Pick lines randomly so every check feels fresh
- Follow the roast and hype rule: roast lightly under 40, hype hard at 60 or more, mix in between, and end low scores with a small encouraging line
- Add the one-line verdict
- Show the title, score, label, reaction, badges and verdict on the result screen in the order from Build Instructions section 2

**Done when:**

- A high-activity account and a low-activity account get clearly different titles, scores and tones
- Checking the same user twice gives different wording
- No line is mean about the person, only about the stats
- The reaction never goes over 3 short lines on screen

## Phase 5: Visual Extras

**Goal:** the result screen becomes beautiful.

**Read first:** Build Instructions sections 1 and 2 (Result items 2, 5, 6, 7 and 8). Tech Stack section 2.

**Tasks:**

- Draw the score ring that fills smoothly
- Draw the language bar (top 4 languages) using CSS or SVG
- Draw the contribution heatmap for the last 12 months, small size
- Show the top 2 repos
- Show the badges as small pills
- Add the motion: cards slide up one after another, numbers count up, buttons bounce
- Add confetti (canvas-confetti, loaded from the CDN) only when the score is 80 or more
- Keep every animation under 0.8 seconds

**Done when:** the result screen shows all items in the correct order, animations feel smooth, and no chart library was added.

## Phase 6: Edge Cases

**Goal:** nothing ever shows a plain error.

**Read first:** Build Instructions section 5. Tech Stack section 10.

**Tasks:**

- Add a funny message for every row in the edge case table in Build Instructions section 5
- Accept pasted profile links by taking the last part of the URL
- Handle missing bio or name, and the missing commit hours case
- Add the retry button for rate limit and server errors

**Done when:** every situation in the table has been tried on purpose and shows its funny message with no crash and no blank screen.

## Phase 7: Fun Extras

**Goal:** the shareable parts.

**Read first:** Project Details, section "Small Extra Features". Build Instructions section 8 (share card size). Tech Stack sections 2 and 10.

**Tasks:**

- **Share card:** create a good-looking card with avatar, title, score and verdict, sized 1080 x 1350, and download it as a PNG using html-to-image. If the avatar fails to load, draw a circle with the first letter of the username
- **Compare mode:** two ids, call `/api/vibe` once per id, show both vibe scores side by side, and announce the winner with a funny line. The same id twice shows the special message from the edge case table
- Keep both features inside the existing page. No new pages

**Done when:** the share card downloads as a clean image and compare mode always shows a clear winner.

## Phase 8: Mobile Polish, Final Test and Deploy

**Goal:** a finished project that is live and passes every check.

**Read first:** Build Instructions sections 8, 10 and 11. Tech Stack section 6.

**Tasks:**

- Check every screen at 390px and at desktop width, in both themes
- Remove any placeholder text, unused code and leftover test files
- Write the short `README.md` described in Tech Stack section 9
- Push the project to a GitHub repository
- Import it into Vercel, add `GITHUB_TOKEN` in Environment Variables, and deploy
- Run the full checklist in Build Instructions section 11 on the live address

**Done when:** every item in the Build Instructions section 11 checklist passes on the live site, and the token cannot be seen in the page source.

## 4. Final Review Before Handing Over

The agent must confirm each of these before saying the project is finished:

- Every phase above was completed and its check passed
- Nothing outside the Tech Stack was used
- Nothing from the Must-Not-Do list appears anywhere
- The screen has very little text and still feels cute, premium and Gen-Z
- The first impression is: "this is cute, I want to share it"

# project-fisheye

A fish pond performance tracking and decision-support tool for aquaculture farm owners and workers.

## Overview

Fisheye digitizes the manual pond-management workflow currently kept in spreadsheets (feed logs, mortality records, harvest estimates) into a web app, with the long-term goal of AI-assisted decision making (e.g. predictive feed recommendations based on historical data).

## Context

- Initial scope: 7 ponds, ~10,000 kg of fish
- Target platform: web app, optimized for Android phones (primary device used by farmers)
- User groups:
  - **Farm Owner** — views data, makes decisions (feed, harvest, inventory)
  - **Farm Worker** — inputs daily data (feed used, dead fish)

## Phase 1 Plan

See [`Screenshot_2026-09-20_at_10.23.41_PM.png`](./Screenshot_2026-09-20_at_10.23.41_PM.png) for the full flow diagram.

1. **Data Understanding** — assess existing pond data
2. **Decide Web App** — confirm web app approach, accessible to farmers on Android
3. **Code on what?** — pick architecture, considering future scalability to more ponds and a possible native app
4. **UI Requirements** — track feed used, dead fish, potential harvest, inventory needed, sampling reminders
5. **AI Decision Making** — predictive recommendations for farm owners (starting with feed), based on historical data

## Sample Data

[`(Project) Fish pond performance report  - Copy of 「Pond 1 」.csv`](<./(Project) Fish pond performance report  - Copy of 「Pond 1 」.csv>) is a raw export of the current manual tracking spreadsheet for Pond 1, including:

- Feed consumed (by packing size, gunny quantity, total weight)
- Dead fish records by month (tail count, average weight, cost)
- Monthly feed logs (date, feed type, quantity, dead fish) from Dec-25 through Aug-26
- Feed cost breakdown and conversion ratio calculations

This sample informs the data model for the app's UI and backend.

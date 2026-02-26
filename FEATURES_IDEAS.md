# RIFT – Feature ideas and possible additions

Use this as a backlog for future improvements.

---

## Already in the app

- Run history with search/filter and delete selected
- **Tags/labels for runs** – add tags per run, filter by tag
- **Date range filter** – from/to in history
- **Export history** – CSV and JSON of (filtered) runs
- **Compare two runs** – modal with Run A / Run B dropdowns and side-by-side summary
- **Re-run from history** – "Run again" on each run (same repo/team/leader)
- Workspace modal: list cloned repos, open on GitHub, delete, **bulk delete** (select mode), **copy path**
- Results JSON viewer (collapsible, copy)
- **Export fixes (CSV)** – download fixes table as CSV
- **Full PDF report** (multi-page) with all details:
  - Cover, Run summary, Score breakdown, Time metrics, Repository statistics
  - Fixes table, CI/CD timeline, **PR link** (when available), **Security scan summary** (when available), Full results JSON, Footer
- **HTML report** – downloadable single HTML file
- **Report preview** – expandable "Preview report" before PDF
- **Dark/light PDF** – toggle theme for PDF and HTML
- **Keyboard shortcuts** – `Ctrl+H` history, **`Ctrl+P`** download report, `Escape` close modals
- **Dashboard filters** – Fixes table: filter by All / Fixed / Failed
- **PR link** in Run Summary Card and in full report when backend provides it
- **Toast notification** when run completes
- **Backend:** **Audit log** (`GET /audit-log`), **rate limiting** (100 req/15 min), **optional API key** (`API_KEY` env, `X-API-Key` or `Authorization: Bearer`)

---

## Possible future additions

- **Charts in PDF** – include performance charts in the full report
- **Email report** – optional send report to email (backend + config)
- **Schedule runs** – cron-like "run this repo every night"

---

*Last updated: 2026-02*

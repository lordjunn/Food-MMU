# Food-blog
 yes

---

## Tuning Guide

Quick reference for what to edit when adjusting features. All shared files are in `Logs/`.

### Collapsible "Read more" (long food descriptions)

When a food description exceeds the threshold height, it collapses with a gradient fade + "Read more ▼" button.

| What to change | File | What to edit |
|---|---|---|
| **Collapse trigger height** | `Logs/months.js` | `COLLAPSE_THRESHOLD = 350` (in px) |
| **Collapsed max-height** | `Logs/Food.css` | `.is-collapsible { max-height: 300px; }` |
| **Gradient fade height** | `Logs/Food.css` | `.is-collapsible::after { height: 80px; }` |
| **Toggle button style** | `Logs/Food.css` | `.description-toggle { ... }` |

> **Note:** `COLLAPSE_THRESHOLD` (JS) should be >= `.is-collapsible max-height` (CSS), otherwise descriptions get clipped without a button. Keep them in sync.

### Spending summary scroll box (monthly recap prose)

The long prose in the monthly spending summary (e.g. Feb 26) gets a bordered scroll box. The expense `<ul>` stays outside below it.

| What to change | File | What to edit |
|---|---|---|
| **Scroll box height** | `Logs/Food.css` | `.description-scrollbox { max-height: 280px; }` |
| **Scroll box styling** | `Logs/Food.css` | `.description-scrollbox { border, background, padding... }` |
| **Scrollbar look** | `Logs/Food.css` | `.description-scrollbox::-webkit-scrollbar-*` rules |
| **Detection logic** | `Logs/months.js` | Looks for sibling `<ul>` containing `"Purely food expenses"` |

### Header / Footer / Navigation

All dynamically generated from `data-*` attributes in each HTML's `#header-config` div.

| What to change | File | What to edit |
|---|---|---|
| **Month title, days, reasons, text** | Each `XXX YY.html` | `data-year`, `data-month`, `data-days`, `data-reasons`, `data-text` in `#header-config` |
| **Nav menu links / food vendors** | `Logs/months.js` | `foodVendors` array (changes based on date range) |
| **Month mapping** | `Logs/months.js` | `monthMap` object |

### Spending auto-fill

The JS auto-calculates food totals, averages, and fills in the spending `<ul>` at the bottom of each month.

| What to change | File | What to edit |
|---|---|---|
| **Which labels are detected** | `Logs/months.js` | `findLiByLabel()` calls in `fillSpendingSummary()` |
| **Number formatting** | `Logs/months.js` | `formatRM()` function |

### Chart (meal cost bar/line chart)

| What to change | File | What to edit |
|---|---|---|
| **Chart colors** | `Logs/months.js` | `datasets` array in `generateChart()` |
| **Chart size** | Each `XXX YY.html` | `<canvas id="mealChart" width="400" height="200">` |

### General layout

| What to change | File | What to edit |
|---|---|---|
| **Image size** | `Logs/Food.css` | `.menu-item-image { width: 400px; height: 400px; }` |
| **Container width** | `Logs/Food.css` | `.container { max-width: 1200px; }` |
| **Mobile breakpoint** | `Logs/Food.css` | `@media (max-width: 768px)` |
| **Font** | `Logs/Food.css` | `.menu { font-family: ... }` + Google Fonts link in HTML `<head>` |

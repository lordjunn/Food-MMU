# 🍽️ Food Blog - "Dine with Junn"

A personal food diary and review website documenting daily meals, expenses, and restaurant reviews around MMU (Multimedia University) campus and beyond. Track spending, analyze meal costs, and discover local eats!

---

## 🌐 Live Site

> **GitHub:** [LordJunn/Food-blog](https://github.com/LordJunn/Food-blog)  
> **Index Page:** [`index.html`](index.html) - Quick food vendor guide & about page  
> **Full Archive:** [`Logs/Food Archives.html`](Logs/Food Archives.html) - Complete monthly logs

---

## 📚 Table of Contents

- [Project Overview](#-project-overview)
- [How the Site Works](#-how-the-site-works)
- [Directory Structure](#-directory-structure)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Adding New Food Entries](#-adding-new-food-entries)
- [Data Structure](#-data-structure)
- [Tuning Guide (Editing)](#tuning-guide-editing)

---

## 📖 Project Overview

This food blog serves as a comprehensive diary of my dining experiences, combining:
- **Daily meal logs** with detailed reviews and expenses
- **Monthly archives** with spending summaries and charts
- **Restaurant directories** for campus and local vendors
- **Automated analytics** (charts, averages, totals)

### Philosophy
> *"With passion For Real, Good Food"* - Documenting meals to inform others about food choices in MMU campus surroundings. If you want me to review a specific food, contact me via Discord (`lordjunn`).

---

## ⚙️ How the Site Works

### Frontend Pages

| Page | Purpose |
|------|---------|
| [`index.html`](index.html) | Landing page with featured restaurants & "About Me" section |
| [`Logs/XXX YY.html`](Logs/Jun 26.html) | Monthly food diary entries with spending breakdown |
| [`Logs/Food Archives.html`](Logs/Food Archives.html) | Archive hub linking to all months |
| [`Logs/full.html`](Logs/full.html) | Full archive viewer (iframe layout) |

### Dynamic Generation

Monthly archives are generated from `data-*` attributes in HTML files:

```html
<div id="header-config" data-year="2026" data-month="Jul" 
     data-days="21?" data-reasons="FYP2 Presentation, Exam Weeks, ..." 
     data-text="It is now the final month...">
</div>
```

The [`Logs/months.js`](Logs/months.js) script processes these attributes to:
- Generate navigation headers/footers
- Create spending summary charts (Chart.js)
- Auto-fill expense totals from menu items
- Handle collapsible long descriptions

---

## 📁 Directory Structure

```
Food blog/
├── index.html              # Main landing page
├── Foods/                  # Individual restaurant pages
│   ├── HTC.html           # Haji Tapah Catering
│   ├── Dapo Sahang.html   # HB2 food court
│   ├── Deens.html         # STAD cafe
│   ├── Starbees.html      # Campus canteen
│   └── ...                # More vendors
├── Foods/Images/           # Restaurant-specific images
├── Foods/Cina.css          # Food pages stylesheet
├── Logs/                   # Monthly archives & full archive
│   ├── Jul 26.html        # Current month example
│   ├── Jun 26.html
│   ├── May 26.html
│   ├── ...                # Historical logs back to Aug 2022
│   ├── Food Archives.html # Archive index
│   ├── full.html          # Full archive viewer
│   ├── months.js          # Dynamic content generator
│   └── Food.css           # Shared food page styles
├── Logs/Icons/             # Navigation icons (cart, search, etc.)
├── Logs/img/               # Feature images (chef, food items)
├── style.css               # Root stylesheet
├── index.css               # Index page styles
└── README.md               # This file
```

---

## ✨ Key Features

### 📊 Spending Analytics
- **Monthly spending summaries** with breakdowns (Breakfast, Lunch, Dinner, Etc.)
- **Interactive Chart.js bar charts** showing daily meal costs
- **Averaging calculations** for each meal type
- **Expense categorization** (Food vs. Etc. vs. Rent/Petrol)

### 📝 Food Diary Format
Each day entry includes:
```html
<div class="menu-item">
  <img class="menu-item-image" src="">              <!-- Optional food image -->
  <div class="menu-item-text">
    <h3 class="menu-item-heading">
      <span class="menu-item-name">Food Name [Vendor]</span>
      <span class="menu-item-price">RM XX.XX</span>
    </h3>
    <span class="meal-type">(Type of meal)</span>
    <p class="menu-item-description">              <!-- Detailed review -->
      ... description, thoughts, and notes ...
      <ul>                                          <!-- Itemized breakdown -->
        <li>... detail ...</li>
        <li>... details ...</li>
        <li>... more details ...</li>
      </ul>
    </p>
  </div>
</div>
```

### 🎨 Collapsible Long Descriptions
Descriptions exceeding **350px** height collapse with a "Read more ▼" button. Adjust threshold in `Logs/months.js` (`COLLAPSE_THRESHOLD`).

### 📱 Responsive Design
- Mobile-first CSS approach
- Hamburger menu for navigation
- Breakpoints at 768px

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|------------|
| **HTML** | Semantic HTML5 with data-* attributes |
| **CSS** | Custom stylesheets (`Food.css`, `index.css`, `style.css`) |
| **JavaScript** | Vanilla JS for interactivity & DOM manipulation |
| **Chart.js** | Meal cost visualization |

---

## ➕ Adding New Food Entries

### 1. Create/Update Monthly Entry
Edit the corresponding `Logs/MMM YYYY.html` (e.g., `Jul 26.html`). Add new `<div class="menu">` blocks for each day:

```html
<div class="menu">
  <h2 class="menu-group-heading">DD MMM YYYY (DayOfWeek)</h2>
  <div class="menu-group">
    <!-- Day's food items go here -->
  </div>
</div>
```

### 2. Add to Footer Spending Summary
At the end of the month, add the summary block before the closing `</body>` tag:

```html
<div id="footer-container"></div>
```

The JS will auto-populate totals from menu items.

### 3. Link in Archive Index
If adding a new restaurant (e.g., `Foods/NewPlace.html`), ensure it appears in the `foodVendors` array in [`Logs/months.js`](Logs/months.js) (lines ~64-66).

---

## 📊 Data Structure for Menu Items

| Class | Description | Example Value |
|-------|-------------|---------------|
| `.menu-item-name` | Food name + vendor reference | `Nasi Campur [Dapo Sahang` |
| `.menu-item-price` | Total price (parse with regex) | `RM 6.50` |
| `.meal-type` | Meal category | `(Lunch)` or `(Dinner)` |
| `.menu-item-description` | Review prose | "Anything goes" |

### Price Parsing Logic
- Stripped of currency symbols (`RM`) and whitespace
- Supports struck-through prices (old pricing)
- Non-numeric text ignored during summation

---

## 🔧 Tuning Guide (Editing)

> **Preserved from original:** Quick reference for what to edit when adjusting features. All shared files are in `Logs/`.

### Collapsible "Read more" (long food descriptions)

| What to change | File | What to edit |
|----------------|------|--------------|
| **Collapse trigger height** | `Logs/months.js` | `COLLAPSE_THRESHOLD = 350` (in px) |
| **Collapsed max-height** | `Logs/Food.css` | `.is-collapsible { max-height: 300px; }` |
| **Gradient fade height** | `Logs/Food.css` | `.is-collapsible::after { height: 80px; }` |
| **Toggle button style** | `Logs/Food.css` | `.description-toggle { ... }` |

> **Note:** `COLLAPSE_THRESHOLD` (JS) should be >= `.is-collapsible max-height` (CSS), otherwise descriptions get clipped without a button. Keep them in sync.

### Spending summary scroll box (monthly recap prose)

| What to change | File | What to edit |
|----------------|------|--------------|
| **Scroll box height** | `Logs/Food.css` | `.description-scrollbox { max-height: 280px; }` |
| **Scroll box styling** | `Logs/Food.css` | `.description-scrollbox { border, background, padding... }` |
| **Scrollbar look** | `Logs/Food.css` | `.description-scrollbox::-webkit-scrollbar-*` rules |
| **Detection logic** | `Logs/months.js` | Looks for sibling `<ul>` containing `"Purely food expenses"` |

### Header / Footer / Navigation

All dynamically generated from `data-*` attributes in each HTML's `#header-config` div.

| What to change | File | What to edit |
|----------------|------|--------------|
| **Month title, days, reasons, text** | Each `XXX YY.html` | `data-year`, `data-month`, `data-days`, `data-reasons`, `data-text` in `#header-config` |
| **Nav menu links / food vendors** | `Logs/months.js` | `foodVendors` array (changes based on date range) |
| **Month mapping** | `Logs/months.js` | `monthMap` object |

### Spending auto-fill

The JS auto-calculates food totals, averages, and fills in the spending `<ul>` at the bottom of each month.

| What to change | File | What to edit |
|----------------|------|--------------|
| **Which labels are detected** | `Logs/months.js` | `findLiByLabel()` calls in `fillSpendingSummary()` |
| **Number formatting** | `Logs/months.js` | `formatRM()` function |

### Chart (meal cost bar/line chart)

| What to change | File | What to edit |
|----------------|------|--------------|
| **Chart colors** | `Logs/months.js` | `datasets` array in `generateChart()` |
| **Chart size** | Each `XXX YY.html` | `<canvas id="mealChart" width="400" height="200">` |

### General layout

| What to change | File | What to edit |
|----------------|------|--------------|
| **Image size** | `Logs/Food.css` | `.menu-item-image { width: 400px; height: 400px; }` |
| **Container width** | `Logs/Food.css` | `.container { max-width: 1200px; }` |
| **Mobile breakpoint** | `Logs/Food.css` | `@media (max-width: 768px)` |
| **Font** | `Logs/Food.css` | `.menu { font-family: ... }` + Google Fonts link in HTML `<head>` |

---

## 🐍 Python Automation Tools

Not in the repo, but it is for batch processing:

- `scrap month header.py` - Extracts headers from HTML
- `scrap month ending.py` - Processes footers/spending data
- `food_pipeline.py` - Full pipeline automation
- `Food site calculations v4.py` - Advanced analytics

---

## 📂 Archive Layout (Logs/)

```
Logs/
├── 2022/    # Archived 2022 images
├── 2023/    # Archived 2023 images
├── 2024/    # Archived 2024 images
├── 2025/    # Archived 2025 images
├── 2026/    # Current year images (in progress)
├── Feb 26.html
├── Mar 26.html
├── ...
├── Aug 26.html
├── Sep 26.html
├── Oct 26.html
├── Nov 26.html
├── Dec 26.html
├── Jan 26.html
├── Feb 26.html
├── Food Archives.html    # Index with iframe viewer
├── full.html             # Full archive (iframe layout)
├── full.css              # Archive stylesheet
├── full.js               # Archive viewer logic
└── months.js             # Dynamic content generator
```

---

## 🎨 Styling Files

| File | Purpose |
|------|---------|
| `Logs/Food.css` | Main food diary styling (shared across all month pages) |
| `style.css` | Root/global stylesheet |
| `index.css` | Landing page styles |
| `Foods/Cina.css` | Restaurant-specific styles |

---

## 🖼️ Icon Locations

| Icon | Path | Use Case |
|------|------|----------|
| 3 bar black.png | `Icons/3 bar black.png` | Desktop menu toggle |
| 3 bar white.png | `Icons/3 bar white.png` | Mobile menu toggle |
| Cart.png | `Icons/Cart.png` | Shopping cart (if added) |
| Search.png | `Icons/search.png` | Search function |
| ... | `Icons/*` | Various nav icons |

---

## 📜 License

This project is maintained by **Lord Junn** as a personal food blog. Feel free to use the structure and code for your own projects, but please give credit!

---

<div align="center">
  <em>"Dine with Junn - Because every meal tells a story."</em>
</div>

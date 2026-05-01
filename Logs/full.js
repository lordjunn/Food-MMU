document.addEventListener('DOMContentLoaded', function () {
  const searchBox = document.getElementById('searchBox');
  const menuGroup = document.getElementById('menu-group');
  const sortDropdown = document.getElementById('sortDropdown');
  const resultCountText = document.getElementById('resultCount');
  const toggleButton = document.getElementById('toggleSourceButton');
  const insightsControls = document.getElementById('insightsControls');
  const insightMetricDropdown = document.getElementById('insightMetricDropdown');
  const showInsightButton = document.getElementById('showInsightButton');
  const insightsPanel = document.getElementById('insightsPanel');
  const scrollArea = document.getElementById('scrollArea');

  const defaultImage = 'https://lordjunn.github.io/Study-With-Junn/img/Sumire.png';
  const imagePlaceholder = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E';

  let currentCSV = 'menu_items2.csv';
  let currentMode = 'full';
  let lastInsightKey = null;

  function updateSortDropdownLabelsForMode() {
    const ascOpt = sortDropdown.querySelector('option[value="price-asc"]');
    const descOpt = sortDropdown.querySelector('option[value="price-desc"]');
    if (!ascOpt || !descOpt) return;

    if (currentMode === 'summary') {
      ascOpt.textContent = 'Sort by Metric (Lowest)';
      descOpt.textContent = 'Sort by Metric (Highest)';
    } else {
      ascOpt.textContent = 'Sort by Price (Lowest)';
      descOpt.textContent = 'Sort by Price (Highest)';
    }
  }

  function shouldShowInsightsControls() {
    if (currentMode !== 'summary') return false;
    const sortVal = String(sortDropdown.value || '');
    return !(sortVal === 'date-asc' || sortVal === 'date-desc');
  }

  function refreshInsightsControlsVisibility() {
    const show = shouldShowInsightsControls();
    insightsControls.style.display = show ? 'flex' : 'none';

    if (!show) {
      insightsPanel.style.display = 'none';
      insightsPanel.innerHTML = '';
      showInsightButton.textContent = 'Show Insight';
      lastInsightKey = null;
    }
  }

  function debounce(fn, delay) {
    let t; return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  function parsePrice(p) {
    if (!p) return 0;
    const raw = String(p).toLowerCase().trim();
    if (raw === "free" || raw === "free!") return 0;

    // Supports values like: RM <s>10.50</s> 10.00 (use actual paid price).
    const nums = String(p).match(/\d+(?:\.\d+)?/g);
    if (!nums || !nums.length) return 0;

    const n = parseFloat(nums[nums.length - 1]);
    return isNaN(n) ? 0 : n;
  }

  function parseRmAmount(text) {
    if (!text) return 0;
    const normalized = String(text).replace(/,/g, '');
    const n = parseFloat(normalized);
    return isNaN(n) ? 0 : n;
  }

  function getMonthYearFromDateText(dateText) {
    if (!dateText || dateText === 'N/A') return null;

    const cleaned = String(dateText)
      .replace(/\([^)]*\)/g, ' ')
      .replace(/,/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const monthMatch = cleaned.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i);

    if (monthMatch) {
      const monthToken = monthMatch[1].toLowerCase();
      const monthLookup = {
        jan: 'Jan', january: 'Jan',
        feb: 'Feb', february: 'Feb',
        mar: 'Mar', march: 'Mar',
        apr: 'Apr', april: 'Apr',
        may: 'May',
        jun: 'Jun', june: 'Jun',
        jul: 'Jul', july: 'Jul',
        aug: 'Aug', august: 'Aug',
        sep: 'Sep', sept: 'Sep', september: 'Sep',
        oct: 'Oct', october: 'Oct',
        nov: 'Nov', november: 'Nov',
        dec: 'Dec', december: 'Dec',
      };

      function pickYearToken(text) {
        if (!text) return null;
        const fourDigit = text.match(/\b20\d{2}\b/g);
        if (fourDigit && fourDigit.length) return fourDigit[fourDigit.length - 1];

        const twoDigit = text.match(/\b\d{2}\b/g);
        if (twoDigit && twoDigit.length) return twoDigit[twoDigit.length - 1];

        return null;
      }

      const month = monthLookup[monthToken];
      const monthIndex = cleaned.toLowerCase().indexOf(monthMatch[0].toLowerCase());
      const beforeMonth = monthIndex >= 0 ? cleaned.slice(0, monthIndex) : '';
      const afterMonth = monthIndex >= 0 ? cleaned.slice(monthIndex + monthMatch[0].length) : cleaned;

      // Prefer year tokens appearing after the month to avoid treating day (dd) as year.
      const yearToken = pickYearToken(afterMonth) || pickYearToken(beforeMonth) || pickYearToken(cleaned);
      const year = yearToken ? (yearToken.length === 2 ? yearToken : yearToken.slice(-2)) : null;
      if (month && year) return { month, year };
    }

    const parsed = new Date(cleaned);
    if (isNaN(parsed.getTime())) return null;

    const month = parsed.toLocaleString('en-US', { month: 'short' });
    const year = String(parsed.getFullYear()).slice(-2);
    return { month, year };
  }

  function buildMonthlyLogHref(dateText) {
    const monthYear = getMonthYearFromDateText(dateText);
    if (!monthYear) return null;

    const filePart = `${monthYear.month} ${monthYear.year}`;
    const encodedFileName = `${encodeURIComponent(filePart)}.html`;
    const isGitHubPages = window.location.hostname.toLowerCase().includes('github.io');

    if (isGitHubPages) {
      return `https://lordjunn.github.io/Food-MMU/Logs/${encodedFileName}`;
    }

    return `/Logs/${encodedFileName}`;
  }

  function toPlainText(html) {
    return String(html || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function parseDateToTimestamp(dateText) {
    if (!dateText || dateText === 'N/A') return 0;
    const cleaned = String(dateText).replace(/\([^)]*\)/g, ' ').replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
    const parsed = new Date(cleaned);
    return isNaN(parsed.getTime()) ? 0 : parsed.getTime();
  }

  function deriveSummaryDateFromMonth(monthLabel) {
    if (!monthLabel) return null;
    const parts = String(monthLabel).trim().split(/\s+/);
    if (parts.length !== 2) return null;

    const [monthStr, yearStr] = parts;
    const monthProbe = new Date(`${monthStr} 1, 2000`);
    if (isNaN(monthProbe.getTime())) return null;

    const yearNum = parseInt(yearStr, 10);
    if (isNaN(yearNum)) return null;

    const fullYear = yearStr.length === 2 ? 2000 + yearNum : yearNum;
    const monthIndex = monthProbe.getMonth();
    const lastDay = new Date(fullYear, monthIndex + 1, 0);

    return {
      date: lastDay.toISOString().split('T')[0],
      displayDate: `${lastDay.getDate()} ${lastDay.toLocaleString('default', { month: 'long' })} ${lastDay.getFullYear()}`,
    };
  }

  const insightMetrics = {
    total: {
      label: 'Total (Card Price)',
      extractor: (item) => {
        const m = String(item.price || '').match(/([0-9][0-9,]*(?:\.[0-9]+)?)/);
        return m ? parseRmAmount(m[1]) : null;
      },
    },
    purelyFood: {
      label: 'Purely Food Expenses',
      extractor: (item, plain) => extractMetricFromText(plain, /purely\s*food\s*expenses\s*-\s*rm\s*([0-9][0-9,]*(?:\.[0-9]+)?)/i),
    },
    breakfast: {
      label: 'Breakfast',
      extractor: (item, plain) => extractMetricFromText(plain, /breakfast\s*-\s*rm\s*([0-9][0-9,]*(?:\.[0-9]+)?)/i),
    },
    lunch: {
      label: 'Lunch',
      extractor: (item, plain) => extractMetricFromText(plain, /lunch\s*-\s*rm\s*([0-9][0-9,]*(?:\.[0-9]+)?)/i),
    },
    dinner: {
      label: 'Dinner',
      extractor: (item, plain) => extractMetricFromText(plain, /dinner\s*-\s*rm\s*([0-9][0-9,]*(?:\.[0-9]+)?)/i),
    },
    avgPerDay: {
      label: 'Average Cost Per Day',
      extractor: (item, plain) => extractMetricFromText(plain, /average\s*cost\s*per\s*day\s*-\s*rm\s*([0-9][0-9,]*(?:\.[0-9]+)?)/i),
    },
    etcExpenses: {
      label: 'Etc. Expenses',
      extractor: (item, plain) => extractMetricFromText(plain, /etc\.?\s*expenses\s*-\s*rm\s*([0-9][0-9,]*(?:\.[0-9]+)?)/i),
    },
    rental: {
      label: 'Rental',
      extractor: (item, plain) => extractMetricFromText(plain, /rental\s*-\s*rm\s*([0-9][0-9,]*(?:\.[0-9]+)?)/i),
    },
    utilities: {
      label: 'Utilities',
      extractor: (item, plain) => extractMetricFromText(plain, /utilities\s*-\s*rm\s*([0-9][0-9,]*(?:\.[0-9]+)?)/i),
    },
    petrol: {
      label: 'Petrol',
      extractor: (item, plain) => extractMetricFromText(plain, /petrol\s*-\s*rm\s*([0-9][0-9,]*(?:\.[0-9]+)?)/i),
    },
    cashDamage: {
      label: 'Cash Damage',
      extractor: (item, plain) => extractMetricFromText(plain, /cash\s*damage\s*-\s*rm\s*([0-9][0-9,]*(?:\.[0-9]+)?)/i),
    },
    totalDamage: {
      label: 'Total Damage',
      extractor: (item, plain) => extractMetricFromText(plain, /total\s*damage\s*-\s*rm\s*([0-9][0-9,]*(?:\.[0-9]+)?)/i),
    },
  };

  function extractMetricFromText(plainText, regex) {
    const m = plainText.match(regex);
    if (!m) return null;
    return parseRmAmount(m[1]);
  }

  function getSelectedInsightMetric() {
    return insightMetricDropdown ? insightMetricDropdown.value : 'total';
  }

  function getMetricValue(item, metricKey) {
    if (item && item._metrics && Object.prototype.hasOwnProperty.call(item._metrics, metricKey)) {
      return item._metrics[metricKey];
    }

    const metric = insightMetrics[metricKey] || insightMetrics.total;
    const plain = toPlainText(item.description || '');
    return metric.extractor(item, plain);
  }

  function preprocessItem(item) {
    const processed = { ...item };
    const isSummary = !processed.dish_name;

    if (isSummary && (!processed.date || processed.date === 'N/A') && processed.month_url) {
      const derived = deriveSummaryDateFromMonth(processed.month_url);
      if (derived) {
        processed.date = derived.date;
        processed._displayDate = derived.displayDate;
      }
    }

    if (!processed._displayDate && processed.date) {
      processed._displayDate = processed.date;
    }

    processed._plainDescription = toPlainText(processed.description || '');
    processed._priceNum = parsePrice(processed.price || '');
    processed._sortDateValue = parseDateToTimestamp(processed.date || processed._displayDate || '');

    processed._metrics = {};
    for (const key of Object.keys(insightMetrics)) {
      processed._metrics[key] = insightMetrics[key].extractor(processed, processed._plainDescription);
    }

    processed._searchBlob = [
      processed.dish_name || processed.title || '',
      processed.restaurant_name || processed.month_url || '',
      processed.date || '',
      processed._plainDescription || '',
      processed.price || '',
    ].join(' ').toLowerCase();

    const renderedDate = processed._displayDate || processed.date || 'N/A';
    processed._monthLogHref = buildMonthlyLogHref(renderedDate);

    return processed;
  }

  function preprocessItems(items) {
    return items.map(preprocessItem);
  }

  function monthToDateKey(monthLabel) {
    if (!monthLabel) return 0;
    const d = new Date(`${monthLabel} 1`);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  }

  function formatMonthShort(monthLabel) {
    if (!monthLabel) return 'Unknown';
    const d = new Date(`${monthLabel} 1`);
    if (isNaN(d.getTime())) return monthLabel;
    const mon = d.toLocaleString('en-US', { month: 'short' });
    const yy = String(d.getFullYear()).slice(-2);
    return `${mon} ${yy}`;
  }

  function getMetricRanking(items, metricKey, order) {
    const summaryItems = items.filter(item => !item.dish_name);
    const rows = [];

    for (const item of summaryItems) {
      const value = getMetricValue(item, metricKey);
      if (value === null || value === undefined || isNaN(value)) continue;
      rows.push({
        month: item.month_url || 'Unknown month',
        value,
      });
    }

    rows.sort((a, b) => {
      if (a.value !== b.value) return order === 'asc' ? a.value - b.value : b.value - a.value;
      return monthToDateKey(b.month) - monthToDateKey(a.month);
    });

    return rows;
  }

  function renderMetricInsights(rows, metricKey, order) {
    const metric = insightMetrics[metricKey] || insightMetrics.total;
    const headingMode = order === 'asc' ? 'Lowest' : 'Highest';

    if (!rows.length) {
      insightsPanel.innerHTML = `<div class="insights-title">${headingMode} Months by ${metric.label}</div><div class="insights-subtext">No values were detected for this metric in the current summary result set.</div>`;
      insightsPanel.style.display = 'block';
      return;
    }

    // Consolidate equal values to reduce clutter in rankings.
    const groupedRows = [];
    for (const r of rows) {
      const prev = groupedRows[groupedRows.length - 1];
      const monthKey = monthToDateKey(r.month);
      if (prev && Math.abs(prev.value - r.value) < 1e-9) {
        prev.months.push({ label: formatMonthShort(r.month), key: monthKey });
      } else {
        groupedRows.push({
          value: r.value,
          months: [{ label: formatMonthShort(r.month), key: monthKey }],
        });
      }
    }

    const topGroups = groupedRows.slice(0, 5);
    const listHtml = topGroups
      .map((g, i) => {
        const sortedMonths = g.months
          .slice()
          .sort((a, b) => a.key - b.key)
          .map(m => m.label);

        const monthLabel = sortedMonths.length > 4
          ? `${sortedMonths.slice(0, 4).join(', ')} +${sortedMonths.length - 4} more`
          : sortedMonths.join(', ');
        return `<li><strong>#${i + 1}</strong> ${monthLabel}: <strong>RM ${g.value.toFixed(2)}</strong></li>`;
      })
      .join('');

    insightsPanel.innerHTML = `
      <div class="insights-title">${headingMode} Months by ${metric.label}</div>
      <div class="insights-subtext">Based on currently visible monthly summaries (${rows.length} month(s) with detected values). Equal values are consolidated and months are shown in short form.</div>
      <ul class="insights-list">${listHtml}</ul>
    `;
    insightsPanel.style.display = 'block';
  }

  function getInsightOrderFromMainSort() {
    return String(sortDropdown.value || '').endsWith('asc') ? 'asc' : 'desc';
  }

  function normalizeSortBy(sortBy, mode) {
    if (mode === 'summary' && sortBy === 'price-asc') return 'value-asc';
    if (mode === 'summary' && sortBy === 'price-desc') return 'value-desc';
    return sortBy;
  }

  function parseSearchQuery(rawInput) {
    const keyword = String(rawInput || '').toLowerCase().trim();
    const priceFilters = [];

    if (!keyword) {
      return {
        keyword: '',
        cleanedKeyword: '',
        terms: [],
        priceFilters,
        keywordIsNumber: false,
        keywordNumber: null,
      };
    }

    const priceFilterRegex = /(>=|<=|=|>|<)\s*(?:r?m\s*)?(\d+(?:\.\d+)?)/gi;
    let match;

    while ((match = priceFilterRegex.exec(keyword)) !== null) {
      const value = parseFloat(match[2]);
      if (!isNaN(value)) {
        priceFilters.push({ op: match[1], value });
      }
    }

    const cleanedKeyword = keyword.replace(priceFilterRegex, ' ').replace(/\s+/g, ' ').trim();
    const quotedTerms = cleanedKeyword.match(/"([^"]+)"|'([^']+)'/g) || [];
    const phraseTerms = quotedTerms.map(term => term.slice(1, -1).trim()).filter(Boolean);
    const remainder = cleanedKeyword.replace(/"[^"]+"|'[^']+'/g, ' ');
    const wordTerms = remainder.split(/\s+/).map(term => term.trim()).filter(Boolean);
    const terms = [...phraseTerms, ...wordTerms];
    const keywordNumber = parseFloat(cleanedKeyword);

    return {
      keyword,
      cleanedKeyword,
      terms,
      priceFilters,
      keywordIsNumber: !isNaN(keywordNumber) && cleanedKeyword !== '',
      keywordNumber: isNaN(keywordNumber) ? null : keywordNumber,
    };
  }

  function passesPriceFilters(item, priceFilters) {
    if (!priceFilters.length) return true;
    const priceNum = item._priceNum;

    return priceFilters.every(f => {
      switch (f.op) {
        case '>': return priceNum > f.value;
        case '>=': return priceNum >= f.value;
        case '<': return priceNum < f.value;
        case '<=': return priceNum <= f.value;
        case '=': return priceNum === f.value;
        default: return true;
      }
    });
  }

  function filterItems(items, query, mode, sortBy, metricKey) {
    const metricSortActive = mode === 'summary' && (sortBy === 'value-asc' || sortBy === 'value-desc');

    return items.filter(item => {
      if (metricSortActive) {
        if (item.dish_name) return false;
        const value = getMetricValue(item, metricKey);
        if (value === null || value === undefined || isNaN(value)) return false;
      }

      if (!query.terms.length && !query.priceFilters.length) return true;
      if (!passesPriceFilters(item, query.priceFilters)) return false;
      if (!query.terms.length) return true;

      const matchesTerms = query.terms.every(t => item._searchBlob.includes(t));
      const free = ['free', 'free!'].includes((item.price || '').toLowerCase());

      return matchesTerms ||
        (query.cleanedKeyword === 'free' && free) ||
        (query.keywordIsNumber && item._priceNum === query.keywordNumber);
    });
  }

  function sortItems(items, mode, sortBy, metricKey) {
    const sorted = items.slice();

    if (mode === 'summary') {
      if (sortBy === 'date-asc') {
        sorted.sort((a, b) => a._sortDateValue - b._sortDateValue);
      }
      if (sortBy === 'date-desc') {
        sorted.sort((a, b) => b._sortDateValue - a._sortDateValue);
      }
      if (sortBy === 'value-asc') {
        sorted.sort((a, b) => {
          const av = getMetricValue(a, metricKey);
          const bv = getMetricValue(b, metricKey);
          if (av !== bv) return av - bv;
          return a._sortDateValue - b._sortDateValue;
        });
      }
      if (sortBy === 'value-desc') {
        sorted.sort((a, b) => {
          const av = getMetricValue(a, metricKey);
          const bv = getMetricValue(b, metricKey);
          if (av !== bv) return bv - av;
          return b._sortDateValue - a._sortDateValue;
        });
      }
      return sorted;
    }

    if (sortBy === 'date-asc') sorted.sort((a, b) => a._sortDateValue - b._sortDateValue);
    if (sortBy === 'date-desc') sorted.sort((a, b) => b._sortDateValue - a._sortDateValue);
    if (sortBy === 'price-asc') sorted.sort((a, b) => a._priceNum - b._priceNum);
    if (sortBy === 'price-desc') sorted.sort((a, b) => b._priceNum - a._priceNum);

    return sorted;
  }

  let clusterizeInstance = null;

  function renderItems(items) {
    if (!items.length) {
      if (clusterizeInstance) clusterizeInstance.clear();
      menuGroup.innerHTML = "<p>No items found.</p>";
      return;
    }

    const htmlArray = items.map(item => {
      const isSummary = !item.dish_name;
      const name = item.dish_name || item.title;
      const restaurant = isSummary ? (item.month_url || "Summary") : item.restaurant_name;
      const summaryMonthHref = isSummary ? buildMonthlyLogHref(restaurant) : null;
      const price = item.price || "N/A";
      let desc = item.description || "";
      if (!isSummary) {
          desc = desc.replace(/\n/g, "<br>");
      }
      const img = (item.image && item.image !== "No image") ? item.image : defaultImage;
      const date = item._displayDate || item.date || 'N/A';
      const dateHref = item._monthLogHref;

      if (isSummary) {
        // For summaries, extract text before <ul> and render expenses properly
        let summaryText = "";
        let expensesText = "";
        const ulIndex = desc.indexOf("<ul");
        if (ulIndex !== -1) {
            summaryText = desc.substring(0, ulIndex).trim();
            expensesText = desc.substring(ulIndex).trim();
        } else {
            summaryText = desc;
        }

        return `
          <div class="menu-item">
              ${img !== defaultImage && img !== "No image" ? `<img class="menu-item-image" data-src="${img}" src="${imagePlaceholder}" alt="${name}" loading="lazy" decoding="async">` : ''}
            <div class="menu-item-text" style="flex-grow: 1;">
              <h3 class="menu-item-heading">
                <span class="menu-item-name">${name}</span>
                <span class="menu-item-price">${price}</span>
              </h3>
              <h3><span class="meal-type">${summaryMonthHref ? `<a class="summary-month-link" href="${summaryMonthHref}">${restaurant}</a>` : restaurant}</span></h3>
              ${summaryText ? `<div class="summary-text-box">${summaryText}</div>` : ''}
              ${expensesText ? `<div class="summary-expenses">${expensesText}</div>` : ''}
            </div>
          </div>
        `;
      }

      return `
        <div class="menu-item">
          <img class="menu-item-image" data-src="${img}" src="${imagePlaceholder}" alt="${name}" loading="lazy" decoding="async">
          <div class="menu-item-text">
            <h3 class="menu-item-heading">
              <span class="menu-item-name">${name}</span>
              <span class="menu-item-price">${price}</span>
            </h3>
            <h3><span class="meal-type">${restaurant}</span></h3>
            <p class="menu-item-description">${desc}</p>
            <p><strong>Date:</strong> ${dateHref ? `<a class="date-link" href="${dateHref}">${date}</a>` : date}</p>
          </div>
        </div>
      `;
    });

    if (!clusterizeInstance) {
      clusterizeInstance = new Clusterize({
        rows: htmlArray,
        scrollElem: scrollArea,
        contentElem: menuGroup
      });
    } else {
      clusterizeInstance.update(htmlArray);
    }

    requestAnimationFrame(() => hydrateVisibleImages());
  }

  function hydrateVisibleImages() {
    const images = menuGroup.querySelectorAll('img[data-src]');

    if (!images.length) return;

    if (!('IntersectionObserver' in window)) {
      images.forEach(img => {
        if (img.dataset.src) img.src = img.dataset.src;
        img.removeAttribute('data-src');
      });
      return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const img = entry.target;
        const realSrc = img.dataset.src;
        if (realSrc) {
          img.src = realSrc;
          img.removeAttribute('data-src');
        }
        obs.unobserve(img);
      }
    }, {
      root: scrollArea,
      rootMargin: '200px 0px',
    });

    images.forEach(img => observer.observe(img));
  }

  const cachedData = {};

  function syncInsightsIfOpen(filteredItems) {
    if (currentMode !== 'summary') return;
    if (insightsPanel.style.display !== 'block') return;

    const metricKey = insightMetricDropdown.value;
    const order = getInsightOrderFromMainSort();
    const ranking = getMetricRanking(filteredItems, metricKey, order);
    renderMetricInsights(ranking, metricKey, order);
    showInsightButton.textContent = 'Hide Insight';
    lastInsightKey = `${metricKey}|${order}`;
  }

  function renderCurrentView() {
    const query = parseSearchQuery(searchBox.value);
    const metricKey = getSelectedInsightMetric();
    const sortBy = normalizeSortBy(sortDropdown.value, currentMode);
    const filtered = filterItems(window.allFoodItems || [], query, currentMode, sortBy, metricKey);
    const sorted = sortItems(filtered, currentMode, sortBy, metricKey);

    renderItems(sorted);
    resultCountText.textContent = `${sorted.length} results found`;
    refreshInsightsControlsVisibility();
    syncInsightsIfOpen(sorted);

    return sorted;
  }

  function loadCSVData(csv) {
    if (cachedData[csv]) {
      window.allFoodItems = cachedData[csv];
      renderCurrentView();
      return;
    }

    Papa.parse(csv, {
      download: true,
      header: true,
      complete: function(results) {
        const items = results.data.filter(row =>
          (row.dish_name && row.date) ||
          (row.title && (row.date || row.month_url))
        );

        const prepared = preprocessItems(items);
        cachedData[csv] = prepared;
        window.allFoodItems = prepared;
        renderCurrentView();
      }
    });
  }

  searchBox.addEventListener("input", debounce(() => {
    renderCurrentView();
  }, 500));

  sortDropdown.addEventListener("change", () => {
    renderCurrentView();
  });

  toggleButton.addEventListener("click", () => {
    if (currentMode === "full") {
      currentCSV = "menu_endings.csv";
      currentMode = "summary";
      toggleButton.textContent = "Show Full Log";
      updateSortDropdownLabelsForMode();
      refreshInsightsControlsVisibility();
    } else {
      currentCSV = "menu_items2.csv";
      currentMode = "full";
      toggleButton.textContent = "Show Monthly Summaries";
      insightsPanel.style.display = 'none';
      insightsPanel.innerHTML = '';
      showInsightButton.textContent = 'Show Insight';
      lastInsightKey = null;
      updateSortDropdownLabelsForMode();
      refreshInsightsControlsVisibility();
    }
    loadCSVData(currentCSV);
  });

  showInsightButton.addEventListener("click", () => {
    if (currentMode !== 'summary') return;
    const metricKey = insightMetricDropdown.value;
    const order = getInsightOrderFromMainSort();
    const currentKey = `${metricKey}|${order}`;

    if (insightsPanel.style.display === 'block' && lastInsightKey === currentKey) {
      insightsPanel.style.display = 'none';
      insightsPanel.innerHTML = '';
      showInsightButton.textContent = 'Show Insight';
      lastInsightKey = null;
      return;
    }

    insightsPanel.style.display = 'block';
    showInsightButton.textContent = 'Hide Insight';
    lastInsightKey = currentKey;
    renderCurrentView();
  });

  insightMetricDropdown.addEventListener("change", () => {
    if (currentMode !== 'summary') return;
    renderCurrentView();
  });

  document.getElementById("backHomeButton").addEventListener("click", () =>
    window.location.href = "../index.html"
  );

  updateSortDropdownLabelsForMode();
  loadCSVData(currentCSV);
});

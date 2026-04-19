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
    p = p.toLowerCase().trim();
    if (p === "free" || p === "free!") return 0;
    const n = parseFloat(p.replace(/[^0-9.]/g, ""));
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
    const yearMatch = cleaned.match(/\b(20\d{2}|\d{2})\b/);

    if (monthMatch && yearMatch) {
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

      const month = monthLookup[monthToken];
      const year = yearMatch[1].length === 2 ? yearMatch[1] : yearMatch[1].slice(-2);
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
    const metric = insightMetrics[metricKey] || insightMetrics.total;
    const plain = toPlainText(item.description || '');
    return metric.extractor(item, plain);
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
    const metric = insightMetrics[metricKey] || insightMetrics.total;
    const summaryItems = items.filter(item => !item.dish_name);
    const rows = [];

    for (const item of summaryItems) {
      const plain = toPlainText(item.description || '');
      const value = metric.extractor(item, plain);
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

  function applySearchAndSort() {
    const keyword = searchBox.value.toLowerCase().trim();
    const keywordIsNumber = !isNaN(keyword) && keyword !== "";

    // Extract price filters like >rm4, <rm9, >=rm5.50, <=rm10, =rm3
    const priceFilterRegex = /(>=?|<=?|=)\s*r?m?\s*(\d+\.?\d*)/gi;
    const priceFilters = [];
    let pf;
    while ((pf = priceFilterRegex.exec(keyword)) !== null) {
      priceFilters.push({ op: pf[1], value: parseFloat(pf[2]) });
    }

    // Remove price filter tokens from the keyword to get remaining search terms
    const cleanedKeyword = keyword.replace(/(>=?|<=?|=)\s*r?m?\s*\d+\.?\d*/gi, '').trim();

    const quotedRegex = /"([^"]+)"|\S+/g;
    let m, terms = [];
    while ((m = quotedRegex.exec(cleanedKeyword)) !== null)
      terms.push((m[1] || m[0]).trim());

    let filtered = window.allFoodItems.filter(item => {
      const fields = [
        (item.dish_name || item.title || "").toLowerCase(),
        (item.restaurant_name || item.month_url || "").toLowerCase(),
        (item.date || "").toLowerCase(),
        (item.description || "").toLowerCase(),
        (item.price || "").toLowerCase(),
      ];

      // Check price filters
      if (priceFilters.length > 0) {
        const priceNum = parsePrice(item.price || "");
        const passesPrice = priceFilters.every(f => {
          switch (f.op) {
            case '>':  return priceNum > f.value;
            case '>=': return priceNum >= f.value;
            case '<':  return priceNum < f.value;
            case '<=': return priceNum <= f.value;
            case '=':  return priceNum === f.value;
            default:   return true;
          }
        });
        if (!passesPrice) return false;
        // If only price filters and no text terms, pass
        if (terms.length === 0) return true;
      }

      const matchesTerms = terms.length > 0
        ? terms.every(t => fields.some(f => f.includes(t)))
        : true;
      const free = ["free", "free!"].includes((item.price || "").toLowerCase());
      const priceNum = parsePrice(item.price || "");

      if (terms.length === 0 && priceFilters.length === 0) return true;

      return matchesTerms ||
             (cleanedKeyword === "free" && free) ||
             (keywordIsNumber && priceNum === parseFloat(keyword));
    });

    const sortBy = sortDropdown.value;
    const metricSortActive = currentMode === 'summary' && (sortBy === 'price-asc' || sortBy === 'price-desc');

    if (metricSortActive) {
      const metricKey = getSelectedInsightMetric();
      filtered = filtered.filter(item => {
        if (item.dish_name) return false;
        const value = getMetricValue(item, metricKey);
        return value !== null && value !== undefined && !isNaN(value);
      });
    }

    if (currentMode === 'summary') {
      const metricKey = getSelectedInsightMetric();
      if (sortBy === "date-asc") {
        filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
      }
      if (sortBy === "date-desc") {
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
      }
      if (sortBy === "price-asc") {
        filtered.sort((a, b) => {
          const av = getMetricValue(a, metricKey);
          const bv = getMetricValue(b, metricKey);
          if (av !== bv) return av - bv;
          return new Date(a.date) - new Date(b.date);
        });
      }
      if (sortBy === "price-desc") {
        filtered.sort((a, b) => {
          const av = getMetricValue(a, metricKey);
          const bv = getMetricValue(b, metricKey);
          if (av !== bv) return bv - av;
          return new Date(b.date) - new Date(a.date);
        });
      }
    } else {
      if (sortBy === "date-asc")  filtered.sort((a,b)=>new Date(a.date)-new Date(b.date));
      if (sortBy === "date-desc") filtered.sort((a,b)=>new Date(b.date)-new Date(a.date));
      if (sortBy === "price-asc") filtered.sort((a,b)=>parsePrice(a.price)-parsePrice(b.price));
      if (sortBy === "price-desc")filtered.sort((a,b)=>parsePrice(b.price)-parsePrice(a.price));
    }

    return filtered;
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
      const price = item.price || "N/A";
      let desc = item.description || "";
      if (!isSummary) {
          desc = desc.replace(/\n/g, "<br>");
      }
      const img = (item.image && item.image !== "No image") ? item.image : defaultImage;


      if (isSummary && (!item.date || item.date === 'N/A') && item.month_url) {
        const parts = item.month_url.trim().split(' ');
        if (parts.length === 2) {
          const [monthStr, yearStr] = parts;
          const dateObj = new Date(`${monthStr} 1, ${yearStr}`);
          const lastDay = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0);

          // Store sortable ISO date
          item.date = lastDay.toISOString().split('T')[0];

          // Also store display-friendly date
          const day = lastDay.getDate();
          const month = lastDay.toLocaleString('default', { month: 'long' });
          const year = lastDay.getFullYear();
          item._displayDate = `${day} ${month} ${year}`;
        }
      }
      const date = item._displayDate || item.date || 'N/A';
      const dateHref = buildMonthlyLogHref(date);

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
            ${img !== defaultImage && img !== "No image" ? `<img class="menu-item-image" src="${img}" alt="${name}">` : ''}
            <div class="menu-item-text" style="flex-grow: 1;">
              <h3 class="menu-item-heading">
                <span class="menu-item-name">${name}</span>
                <span class="menu-item-price">${price}</span>
              </h3>
              <h3><span class="meal-type">${restaurant}</span></h3>
              ${summaryText ? `<div class="summary-text-box">${summaryText}</div>` : ''}
              ${expensesText ? `<div class="summary-expenses">${expensesText}</div>` : ''}
            </div>
          </div>
        `;
      }

      return `
        <div class="menu-item">
          <img class="menu-item-image" src="${img}" alt="${name}">
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
  }

  const cachedData = {};

  function loadCSVData(csv) {
    if (cachedData[csv]) {
      window.allFoodItems = cachedData[csv];
      const filtered = applySearchAndSort();
      renderItems(filtered);
      resultCountText.textContent = `${filtered.length} results found`;
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

        cachedData[csv] = items;
        window.allFoodItems = items;

        const filtered = applySearchAndSort();
        renderItems(filtered);
        resultCountText.textContent = `${filtered.length} results found`;
      }
    });
  }

  searchBox.addEventListener("input", debounce(() => {
    const filtered = applySearchAndSort();
    renderItems(filtered);
    resultCountText.textContent = `${filtered.length} results found`;
  }, 500));

  sortDropdown.addEventListener("change", () => {
    const filtered = applySearchAndSort();
    renderItems(filtered);
    resultCountText.textContent = `${filtered.length} results found`;

    refreshInsightsControlsVisibility();

    if (currentMode === 'summary' && insightsPanel.style.display === 'block') {
      const metricKey = insightMetricDropdown.value;
      const order = getInsightOrderFromMainSort();
      const ranking = getMetricRanking(filtered, metricKey, order);
      renderMetricInsights(ranking, metricKey, order);
      lastInsightKey = `${metricKey}|${order}`;
    }
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
    const filtered = applySearchAndSort();
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

    const ranking = getMetricRanking(filtered, metricKey, order);
    renderMetricInsights(ranking, metricKey, order);
    showInsightButton.textContent = 'Hide Insight';
    lastInsightKey = currentKey;
  });

  insightMetricDropdown.addEventListener("change", () => {
    if (currentMode !== 'summary') return;

    const filtered = applySearchAndSort();
    renderItems(filtered);
    resultCountText.textContent = `${filtered.length} results found`;

    if (insightsPanel.style.display === 'block') {
      const metricKey = insightMetricDropdown.value;
      const order = getInsightOrderFromMainSort();
      const ranking = getMetricRanking(filtered, metricKey, order);
      renderMetricInsights(ranking, metricKey, order);
      lastInsightKey = `${metricKey}|${order}`;
    }
  });

  document.getElementById("backHomeButton").addEventListener("click", () =>
    window.location.href = "../index.html"
  );

  updateSortDropdownLabelsForMode();
  loadCSVData(currentCSV);
});

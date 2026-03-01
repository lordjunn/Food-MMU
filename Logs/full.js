document.addEventListener('DOMContentLoaded', function () {
  const searchBox = document.getElementById('searchBox');
  const menuGroup = document.getElementById('menu-group');
  const sortDropdown = document.getElementById('sortDropdown');
  const resultCountText = document.getElementById('resultCount');
  const toggleButton = document.getElementById('toggleSourceButton');
  const scrollArea = document.getElementById('scrollArea');

  const defaultImage = 'https://lordjunn.github.io/Study-With-Junn/img/Sumire.png';

  let currentCSV = 'menu_items2.csv';
  let currentMode = 'full';

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
    if (sortBy === "date-asc")  filtered.sort((a,b)=>new Date(a.date)-new Date(b.date));
    if (sortBy === "date-desc") filtered.sort((a,b)=>new Date(b.date)-new Date(a.date));
    if (sortBy === "price-asc") filtered.sort((a,b)=>parsePrice(a.price)-parsePrice(b.price));
    if (sortBy === "price-desc")filtered.sort((a,b)=>parsePrice(b.price)-parsePrice(a.price));

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
      const desc = (item.description || "").replace(/\n/g, "<br>");
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
            <p><strong>Date:</strong> ${date}</p>
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
      renderItems(window.allFoodItems);
      resultCountText.textContent = `${window.allFoodItems.length} results found`;
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

        renderItems(items);
        resultCountText.textContent = `${items.length} results found`;
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
  });

  toggleButton.addEventListener("click", () => {
    if (currentMode === "full") {
      currentCSV = "menu_endings.csv";
      currentMode = "summary";
      toggleButton.textContent = "Show Full Log";
    } else {
      currentCSV = "menu_items2.csv";
      currentMode = "full";
      toggleButton.textContent = "Show Monthly Summaries";
    }
    loadCSVData(currentCSV);
  });

  document.getElementById("backHomeButton").addEventListener("click", () =>
    window.location.href = "../index.html"
  );

  loadCSVData(currentCSV);
});

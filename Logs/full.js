document.addEventListener('DOMContentLoaded', function () {
  const searchBox = document.getElementById('searchBox');
  const menuGroup = document.getElementById('menu-group');
  const sortDropdown = document.getElementById('sortDropdown');
  const resultCountText = document.getElementById('resultCount');
  const toggleButton = document.getElementById('toggleSourceButton');
  const defaultImage = 'https://lordjunn.github.io/Study-With-Junn/img/Sumire.png';

  let currentCSV = 'menu_items2.csv';
  let currentMode = 'full'; // or 'summary'

  function debounce(fn, delay) {
    let timeoutID;
    return function (...args) {
      clearTimeout(timeoutID);
      timeoutID = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  function parsePrice(price) {
    if (!price) return 0.00;
    if (isPriceFree(price)) return 0.00;
    const numericString = price.replace(/[^0-9.]/g, '');
    const numericPrice = parseFloat(numericString);
    return isNaN(numericPrice) ? 0.00 : numericPrice;
  }

  function isPriceFree(price) {
    return ['free', 'free!'].includes(price.toLowerCase().trim());
  }

  function applySearchAndSort() {
    const keyword = searchBox.value.toLowerCase().trim();
    const keywordIsNumber = !isNaN(keyword) && keyword !== '';

    const quotedRegex = /"([^"]+)"|\S+/g;
    let matches;
    const searchTerms = [];

    while ((matches = quotedRegex.exec(keyword)) !== null) {
      const term = matches[1] || matches[0];
      searchTerms.push(term.trim());
    }

    let filteredItems = window.allFoodItems.filter(item => {
      const priceNumeric = parsePrice(item.price || '');
      const priceIsFree = isPriceFree(item.price || '');

      const fieldsToSearch = [
        (item.dish_name || item.title || '').toLowerCase(),
        (item.restaurant_name || item.month_url || '').toLowerCase(),
        (item.date || '').toLowerCase(),
        (item.description || '').toLowerCase(),
        (item.price || '').toLowerCase()
      ];

      const matchesAllTerms = searchTerms.every(term =>
        fieldsToSearch.some(field => field.includes(term))
      );

      const matchesFree = keyword === 'free' && priceIsFree;
      const matchesPrice = keywordIsNumber && priceNumeric === parseFloat(keyword);

      return matchesAllTerms || matchesFree || matchesPrice;
    });

    const sortBy = sortDropdown.value;
    let sortedItems = [...filteredItems];

    if (sortBy === 'date-asc') {
      sortedItems.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sortBy === 'date-desc') {
      sortedItems.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortBy === 'price-asc') {
      sortedItems.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    } else if (sortBy === 'price-desc') {
      sortedItems.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
    }

    return sortedItems;
  }

function renderItems(items) {
  if (items.length === 0) {
    menuGroup.innerHTML = '<p>No items found.</p>';
    return;
  }

  const html = items.map(item => {
    const isSummary = !item.dish_name && item.title;

    const name = isSummary ? item.title : item.dish_name;
    const restaurant = isSummary ? item.month_url || 'Summary' : item.restaurant_name;
    const price = item.price ? item.price : 'N/A';
    const description = item.description ? item.description.replace(/\n/g, '<br>') : 'No description available';
    const imageUrl = item.image && item.image !== 'No image' ? item.image : defaultImage;

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
        <img class="menu-item-image" src="${imageUrl}" alt="${name}" loading="lazy">
        <div class="menu-item-text">
          <h3 class="menu-item-heading">
            <span class="menu-item-name">${name}</span>
            <span class="menu-item-price">${price}</span>
          </h3>
          <h3>
            <span class="meal-type">${restaurant}</span>
          </h3>
          <p class="menu-item-description">${description}</p>
          <p><strong>Date:</strong> ${date}</p>
        </div>
      </div>
    `;
  }).join('');

  menuGroup.innerHTML = html;
}


  function updateResultCount(count) {
    resultCountText.textContent = `${count} results found`;
  }

  function loadCSVData(csvPath) {
    Papa.parse(csvPath, {
      download: true,
      header: true,
      complete: function (results) {
        const items = results.data.filter(item =>
          (item.dish_name && item.date) ||
          (item.title && (item.date || item.month_url))
        );

        window.allFoodItems = items;
        renderItems(items);
        updateResultCount(items.length);

        searchBox.addEventListener('input', debounce(function () {
          const filtered = applySearchAndSort();
          renderItems(filtered);
          updateResultCount(filtered.length);
        }, 300));

        sortDropdown.addEventListener('change', function () {
          const filtered = applySearchAndSort();
          renderItems(filtered);
          updateResultCount(filtered.length);
        });
      }
    });
  }

  // Initial load
  loadCSVData(currentCSV);

  // Toggle between full and summary
  toggleButton.addEventListener('click', function () {
    if (currentMode === 'full') {
      currentCSV = 'menu_endings.csv';
      currentMode = 'summary';
      toggleButton.textContent = 'Show Full Log';
    } else {
      currentCSV = 'menu_items2.csv';
      currentMode = 'full';
      toggleButton.textContent = 'Show Monthly Summaries';
    }

    loadCSVData(currentCSV);
  });

  // Back button
  document.getElementById('backHomeButton').addEventListener('click', () => {
    window.location.href = '../index.html';
  });
});

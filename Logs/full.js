document.addEventListener('DOMContentLoaded', function () {
  const searchBox = document.getElementById('searchBox');
  const menuGroup = document.getElementById('menu-group');
  const sortDropdown = document.getElementById('sortDropdown');
  const resultCountText = document.getElementById('resultCount');
  const defaultImage = 'https://lordjunn.github.io/Study-With-Junn/img/Sumire.png';

  // Debounce function
  function debounce(fn, delay) {
    let timeoutID;
    return function (...args) {
      clearTimeout(timeoutID);
      timeoutID = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  Papa.parse('menu_items2.csv', {
    download: true,
    header: true,
    complete: function (results) {
      const items = results.data.filter(item => item.dish_name && item.date);
      window.allFoodItems = items;
      renderItems(items);
      updateResultCount(items.length);

      // Debounced search functionality
      searchBox.addEventListener('input', debounce(function () {
        const filtered = applySearchAndSort();
        renderItems(filtered);
        updateResultCount(filtered.length);
      }, 300));

      // Sorting functionality
      sortDropdown.addEventListener('change', function () {
        const filtered = applySearchAndSort();
        renderItems(filtered);
        updateResultCount(filtered.length);
      });
    }
  });

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
  
    // --- Quoted phrase and word extraction ---
    const quotedRegex = /"([^"]+)"|\S+/g;
    let matches;
    const searchTerms = [];
  
    while ((matches = quotedRegex.exec(keyword)) !== null) {
      const term = matches[1] || matches[0]; // quoted or unquoted
      searchTerms.push(term.trim());
    }
  
    let filteredItems = window.allFoodItems.filter(item => {
      const priceNumeric = parsePrice(item.price);
      const priceIsFree = isPriceFree(item.price);
  
      const fieldsToSearch = [
        item.dish_name.toLowerCase(),
        item.restaurant_name.toLowerCase(),
        item.date.toLowerCase(),
        item.description.toLowerCase(),
        item.price.toLowerCase()
      ];
  
      // All terms (quoted or not) must match somewhere
      const matchesAllTerms = searchTerms.every(term =>
        fieldsToSearch.some(field => field.includes(term))
      );
  
      const matchesFree = keyword === 'free' && priceIsFree;
      const matchesPrice = keywordIsNumber && !isNaN(priceNumeric) && priceNumeric === parseFloat(keyword);
  
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
      const imageUrl = item.image && item.image !== 'No image' ? item.image : defaultImage;
      const price = item.price ? item.price : 'N/A';
      const description = item.description ? item.description.replace(/\n/g, '<br>') : 'No description available';

      return `
        <div class="menu-item">
          <img class="menu-item-image" src="${imageUrl}" alt="${item.dish_name}" loading="lazy">
          <div class="menu-item-text">
            <h3 class="menu-item-heading">
              <span class="menu-item-name">${item.dish_name}</span>
              <span class="menu-item-price">${price}</span>
            </h3>
            <h3>
              <span class="meal-type">${item.restaurant_name}</span>
            </h3>
            <p class="menu-item-description">${description}</p>
            <p><strong>Date:</strong> ${item.date}</p>
          </div>
        </div>
      `;
    }).join('');

    menuGroup.innerHTML = html;
  }

  function updateResultCount(count) {
    resultCountText.textContent = `${count} results found`;
  }
});

document.getElementById('backHomeButton').addEventListener('click', () => {
  window.location.href = '../index.html';
});

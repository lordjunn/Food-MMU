document.addEventListener('DOMContentLoaded', function () {
  const searchBox = document.getElementById('searchBox');
  const menuGroup = document.getElementById('menu-group');
  const sortDropdown = document.getElementById('sortDropdown');
  const resultCountText = document.getElementById('resultCount');
  const defaultImage = 'https://lordjunn.github.io/Study-With-Junn/img/Sumire.png';

  Papa.parse('menu_items2.csv', {
    download: true,
    header: true,
    complete: function (results) {
      const items = results.data.filter(item => item.dish_name && item.date);
      window.allFoodItems = items;
      renderItems(items);
      updateResultCount(items.length);

      // Search functionality
      searchBox.addEventListener('input', function () {
        const filtered = applySearchAndSort();
        renderItems(filtered);
        updateResultCount(filtered.length);
      });

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
  
    // Remove any currency symbols or non-numeric characters except dot and comma
    const numericString = price.replace(/[^0-9.]/g, '');
    const numericPrice = parseFloat(numericString);
  
    return isNaN(numericPrice) ? 0.00 : numericPrice;
  }

  function isPriceFree(price) {
    return ['free', 'free!'].includes(price.toLowerCase().trim());
  }

  // Shared logic to filter and sort
  function applySearchAndSort() {
    const keyword = searchBox.value.toLowerCase();
    const keywordIsNumber = !isNaN(keyword) && keyword.trim() !== '';

    // Filter first
    let filteredItems = window.allFoodItems.filter(item => {
      const keywordLower = keyword.toLowerCase();
      const priceNumeric = parsePrice(item.price);
      const priceIsFree = isPriceFree(item.price);

      const matchesKeyword = (
        item.dish_name.toLowerCase().includes(keywordLower) ||
        item.restaurant_name.toLowerCase().includes(keywordLower) ||
        item.date.toLowerCase().includes(keywordLower) ||
        item.description.toLowerCase().includes(keywordLower) ||
        item.price.replace('$', '').toLowerCase().includes(keywordLower)
      );

      const matchesFree = keywordLower === 'free' && priceIsFree;
      const matchesPrice = keywordIsNumber && !isNaN(priceNumeric) && priceNumeric === parseFloat(keyword);

      return matchesKeyword || matchesFree || matchesPrice;
    });

    // Then sort
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
    menuGroup.innerHTML = '';

    if (items.length === 0) {
      menuGroup.innerHTML = '<p>No items found.</p>';
      return;
    }

    items.forEach(item => {
      const imageUrl = item.image && item.image !== 'No image' ? item.image : defaultImage;
      const price = item.price ? item.price : 'N/A';
      const description = item.description ? item.description : 'No description available';

      const html = `
        <div class="menu-item">
          <img class="menu-item-image" src="${imageUrl}" alt="${item.dish_name}">
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

      menuGroup.insertAdjacentHTML('beforeend', html);
    });
  }

  function updateResultCount(count) {
    resultCountText.textContent = `${count} results found`;
  }
});

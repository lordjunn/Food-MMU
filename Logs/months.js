document.addEventListener('DOMContentLoaded', function() {
  // Get the config div and extract its data attributes
  const configDiv = document.getElementById('header-config');
  if (!configDiv) return; // If no config div is found, exit the script
  
const { year, month: monthShort, days, reasons, text: monthlyText } = configDiv.dataset;

  // Define a mapping of month abbreviations to full month names (capitalized)
  const monthMap = {
    Jan: "January", Feb: "February", Mar: "March", Apr: "April", May: "May", Jun: "June",
    Jul: "July", Aug: "August", Sep: "September", Oct: "October", Nov: "November", Dec: "December",
    E: "Entirety of"
  };

  // Get the full month name based on the abbreviation provided
  const fullMonth = monthMap[monthShort] || "Unknown Month";

  // Split the reasons into an array, using the comma as the delimiter
  const reasonList = reasons
    .split(',')
    .map(reason => reason.trim())
    .filter(reason => reason.length > 0);

  // Check if header and footer containers exist before inserting content
  const headerContainer = document.getElementById('header-container');
  const footerContainer = document.getElementById('footer-container');
  const iframeContainer = document.getElementById('iframe-container');

  // Get the current month and year from the attributes
  const currentMonth = monthShort;
  const currentYear = parseInt(year);
  const months = ["Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];

  // Get the previous and next month, considering the year change
  function getPreviousMonth(month, year) {
    const monthIndex = months.indexOf(month);
    const prevMonthIndex = (monthIndex === 0) ? 11 : monthIndex - 1;
    const prevMonth = months[prevMonthIndex];
    const prevYear = (monthIndex === 1) ? year - 1 : year;
    return { prevMonth, prevYear };
  }

  function getNextMonth(month, year) {
    const monthIndex = months.indexOf(month);
    const nextMonthIndex = (monthIndex === 11) ? 0 : monthIndex + 1;
    const nextMonth = months[nextMonthIndex];
    const nextYear = (monthIndex === 0) ? year + 1 : year;
    return { nextMonth, nextYear };
  }

  const { prevMonth, prevYear } = getPreviousMonth(currentMonth, currentYear);
  const { nextMonth, nextYear } = getNextMonth(currentMonth, currentYear);

  // If the header container exists, create the dynamically generated header HTML
if (headerContainer) {
  const isOldRange = (() => {
    const oldStart = new Date('2022-08-01');
    const oldEnd = new Date('2023-02-28');
    const currentDate = new Date(`${monthMap[monthShort]} 1, ${year}`);
    return currentDate >= oldStart && currentDate <= oldEnd;
  })();

  // Food menu section
  const foodVendors = isOldRange 
    ? ['Starbees', 'HTC', 'Komatra', 'Deens Cafe']
    : ['Starbees', 'HTC', 'Dapo Sahang', 'Deens Cafe'];

  const foodMenuHTML = `
    <li><a href="#">Food</a>
      <ul>
        ${foodVendors.map(vendor => `<li><a href="${isOldRange ? '' : '../Foods/'}${vendor}.html">${vendor}</a></li>`).join('')}
      </ul>
    </li>
  `;

  // Build the archive submenu links dynamically, skipping July 2022
  let archiveLinks = '';
  if (!(prevMonth === "Jul" && prevYear === 2022)) {
    archiveLinks += `
      <li><a href="${prevMonth} ${prevYear.toString().slice(-2)}.html">
        ${monthMap[prevMonth]} ${prevYear}
      </a></li>`;
  }
  if (!(nextMonth === "Jul" && nextYear === 2022)) {
    archiveLinks += `
      <li><a href="${nextMonth} ${nextYear.toString().slice(-2)}.html">
        ${monthMap[nextMonth]} ${nextYear}
      </a></li>`;
  }
  archiveLinks += `<li><a href="full.html">Full Archive</a></li>`;

  const navMenuHTML = `
    <div class="container">
      <ul id="navMenu">
        <li><a href="${isOldRange ? 'index.html' : '../index.html'}">Index</a></li>
        ${foodMenuHTML}
        <li><a href="Food Archives.html">Archives</a>
          <ul>
            ${archiveLinks}
          </ul>
        </li>
      </ul>
    </div>
  `;

  const headerHTML = `
    ${navMenuHTML}
    <div class="container">
        <div class="menu">
          <h2 class="menu-group-heading">
            Food Archive - ${fullMonth} ${year}
          </h2>
          <br>
          <p>Nom nom days: ${days} days<br>
            ${reasonList.length > 0 ? `
              Reasons:
              <ul>
                ${reasonList.map(reason => `<li>${reason}</li>`).join('')}
              </ul>
            ` : ''}
          </p>   
        </div>
    </div>

    <div class="container">
        <div class="menu">
          <h2 class="menu-group-heading">
            ${fullMonth} ${year}
          </h2>
          <br>
          <p>${monthlyText}</p> 
        </div>   
  `;
  headerContainer.innerHTML = headerHTML;
}

  // If the footer container exists, create the dynamically generated footer HTML
  if (footerContainer) {
    const footerHTML = `
      <h2 class="menu-group-heading">
          ${fullMonth} ${year} Spendings
      </h2>
    `;
    footerContainer.innerHTML = footerHTML;
  }

  // Generate iframes for all months (January to December), if iframe container exists
  if (iframeContainer) {
    const months = Object.keys(monthMap).slice(0, 12); // Get months from Jan to Dec

    months.forEach(month => {
      const iframe = document.createElement('iframe');
      iframe.src = `${month} ${year - 2000}.html`;  // Generate the src dynamically based on month and year
      iframe.width = "100%";
      iframe.height = "500px";  // Set the height for each iframe
      iframeContainer.appendChild(iframe);  // Append the iframe to the iframe container
    });
  }
});

    // Function to extract the meal prices for each day
    function extractMealData() {
      // Extracting data for each menu day
      let days = [];
      let dailyCosts = [];
      let lunchCosts = [];
      let dinnerCosts = [];
      let breakfastCosts = [];
    
      let menuItems = document.querySelectorAll('.menu');
      menuItems.forEach((menu, index) => {
        let dayHeading = menu.querySelector('.menu-group-heading');
        let dateText = dayHeading ? dayHeading.innerText : 'Unknown Date';
    
        // Create a Date object using the dateText (assuming it's in a recognizable format)
        let date = new Date(dateText);
    
        // If the date is valid, format it to "DD (Mon)"
        if (!isNaN(date)) {
          let day = date.getDate().toString().padStart(2, '0'); // Get day (e.g., 02)
          let dayOfWeek = date.toLocaleString('en-US', { weekday: 'short' }); // Get short weekday (e.g., Mon)
          date = `${day} (${dayOfWeek})`; // Combine day and weekday abbreviation
        } else {
          date = 'Unknown Date'; // Fallback in case the date is not valid
        }
    
        // Initialize costs for each meal type for this day
        let totalCost = 0;
        let lunchTotal = 0;
        let dinnerTotal = 0;
        let breakfastTotal = 0;

        // Loop through all menu items for the day
        let mealItems = menu.querySelectorAll('.menu-item');
        mealItems.forEach(meal => {
          let mealType = meal.querySelector('.meal-type');
          let priceElement = meal.querySelector('.menu-item-price');
    
          let price = 0;
    
          if (priceElement) {
            // Check if it contains a <s> element
            const strike = priceElement.querySelector('s');
    
            if (strike) {
              // If struck-through, check for any non-struck text nodes (e.g., "Free", "RM 0.00")
              const textNodes = Array.from(priceElement.childNodes).filter(n => n.nodeType === 3); // Text only
              textNodes.forEach(node => {
                const cleaned = node.textContent.replace(/RM|\s|Free/gi, '').trim();
                const parsed = parseFloat(cleaned);
                if (!isNaN(parsed)) {
                  price += parsed;
                }
              });
            } else {
              // No strike-through, parse normally
              const cleaned = priceElement.innerText.replace(/RM|\s/gi, '').trim();
              const parsed = parseFloat(cleaned);
              if (!isNaN(parsed)) {
                price = parsed;
              }
            }
          }
    
          if (mealType) {
            let mealText = mealType.innerText.trim().toLowerCase();
            if (mealText.includes('lunch')) {
              lunchTotal += price;
            } else if (mealText.includes('dinner')) {
              dinnerTotal += price;
            } else if (mealText.includes('breakfast')) {
              breakfastTotal += price;
            }
          }
    
          totalCost += price;
        });

        // Push extracted data into arrays
        days.push(date);
        breakfastCosts.push(breakfastTotal);
        lunchCosts.push(lunchTotal);
        dinnerCosts.push(dinnerTotal);
        dailyCosts.push(totalCost);
      });
    
      // Remove extra/filler menu block at the end
      days = days.slice(2, -1);
      lunchCosts = lunchCosts.slice(2, -1);
      dinnerCosts = dinnerCosts.slice(2, -1);
      breakfastCosts = breakfastCosts.slice(2, -1);
      dailyCosts = dailyCosts.slice(2, -1);
    
      return { days, dailyCosts, lunchCosts, dinnerCosts, breakfastCosts };
    }    
  
  function generateChart() {
    const mealData = extractMealData();
    const ctx = document.getElementById('mealChart').getContext('2d');

    // Initialize dataset array
    const datasets = [
        {
            label: 'Total Meal Costs (RM)',
            data: mealData.dailyCosts,
            backgroundColor: 'rgba(75, 192, 192, 0.2)',  // Bar color
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
            type: 'bar'  // This is the bar chart dataset
        }
    ];

    // Only add breakfast costs dataset if there's data
    if (mealData.breakfastCosts.some(cost => cost > 0)) {
      datasets.push({
          label: 'Breakfast Costs (RM)',
          data: mealData.breakfastCosts,
          fill: false,
          borderColor: 'rgba(255, 99, 132, 1)', // Line color for breakfast
          tension: 0.1,
          type: 'line' // This is the line chart dataset
      });
    }
    
    // Only add lunch costs dataset if there's data
    if (mealData.lunchCosts.some(cost => cost > 0)) {
        datasets.push({
            label: 'Lunch Costs (RM)',
            data: mealData.lunchCosts,
            fill: false,  // Do not fill the area under the line
            borderColor: 'rgba(255, 159, 64, 1)', // Line color for lunch
            tension: 0.1, // Smooth curve
            type: 'line' // This is the line chart dataset
        });
    }

    // Only add dinner costs dataset if there's data
    if (mealData.dinnerCosts.some(cost => cost > 0)) {
        datasets.push({
            label: 'Dinner Costs (RM)',
            data: mealData.dinnerCosts,
            fill: false,
            borderColor: 'rgba(153, 102, 255, 1)', // Line color for dinner
            tension: 0.1,
            type: 'line' // This is the line chart dataset
        });
    }



    // Create the chart
    new Chart(ctx, {
        type: 'bar', // Set the base chart type to 'bar' for the bar chart
        data: {
            labels: mealData.days,
            datasets: datasets // Use the dynamically populated datasets
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            elements: {
                line: {
                    tension: 0.4 // Smooth curves for the line chart
                },
                bar: {
                    borderRadius: 5 // Optional: rounding the corners of the bars
                }
            },
            plugins: {
                legend: {
                    position: 'top' // Position the legend at the top
                }
            }
        }
    });
}

// Run the chart generation after the page loads
window.onload = generateChart;
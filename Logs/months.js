document.addEventListener('DOMContentLoaded', function() {
  // Get the config div and extract its data attributes
  const configDiv = document.getElementById('header-config');
  if (!configDiv) return; // If no config div is found, exit the script
  
  const year = configDiv.getAttribute('data-year');  // Get the year
  const monthShort = configDiv.getAttribute('data-month');  // Get the month abbreviation
  const days = configDiv.getAttribute('data-days');
  const reasons = configDiv.getAttribute('data-reasons');  // Get the reasons for the month
  const monthlyText = configDiv.getAttribute('data-text');

  // Define a mapping of month abbreviations to full month names (capitalized)
  const monthMap = {
    Jan: "January", Feb: "February", Mar: "March", Apr: "April", May: "May", Jun: "June",
    Jul: "July", Aug: "August", Sep: "September", Oct: "October", Nov: "November", Dec: "December",
    E: "Entirety of"
  };

  // Get the full month name based on the abbreviation provided
  const fullMonth = monthMap[monthShort] || "Unknown Month";

  // Split the reasons into an array, using the comma as the delimiter
  const reasonList = reasons.split(',').map(reason => reason.trim());

  // Check if header and footer containers exist before inserting content
  const headerContainer = document.getElementById('header-container');
  const footerContainer = document.getElementById('footer-container');
  const iframeContainer = document.getElementById('iframe-container');

  // If the header container exists, create the dynamically generated header HTML
  if (headerContainer) {
    const headerHTML = `
      <div class="container">
        <ul id="navMenu">
            <li><a href="../index.html">Index</a></li>
            <li><a href="#">Food</a>
                <ul>
                  <li><a href="../Foods/Starbees.html">Starbees</a></li>
                  <li><a href="../Foods/HTC.html">HTC</a></li>
                  <li><a href="../Foods/Dapo Sahang.html">Dapo Sahang</a></li>
                  <li><a href="../Foods/Deens.html">Deens Cafe</a></li>
                </ul>
            </li>
        </ul>
      </div>

      <div class="container">
          <div class="menu">
            <h2 class="menu-group-heading">
              Food Archive - ${fullMonth} ${year}
            </h2>
            <br>
            <p>Days in MMU: ${days} days<br>
              Reasons:
              <ul>
                ${reasonList.map(reason => `<li>${reason}</li>`).join('')}
              </ul>
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
  
          let mealPrices = Array.from(menu.querySelectorAll('.menu-item-price')).map(price => parseFloat(price.innerText.replace('RM ', '').trim()) || 0);
  
          let totalCost = mealPrices.reduce((sum, price) => sum + price, 0);
  
          // Initialize costs for each meal type for this day
          let lunchTotal = 0;
          let dinnerTotal = 0;
          let breakfastTotal = 0;
  
          // Loop through all menu items for the day
          let mealItems = menu.querySelectorAll('.menu-item');
          mealItems.forEach(meal => {
              let mealType = meal.querySelector('.meal-type');
              let priceElement = meal.querySelector('.menu-item-price');
              let price = parseFloat(priceElement.innerText.replace('RM ', '').trim()) || 0;
              
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
          });
  
          // Push extracted data into arrays
          days.push(date);
  
          breakfastCosts.push(breakfastTotal);
          lunchCosts.push(lunchTotal);
          dinnerCosts.push(dinnerTotal);
          
          dailyCosts.push(totalCost);
      });
  
      // Remove the last item from both days and dailyCosts arrays
      days = days.slice(2, -1);  // Exclude the last entry
  
      lunchCosts = lunchCosts.slice(2, -1);
      dinnerCosts = dinnerCosts.slice(2, -1);
      breakfastCosts = breakfastCosts.slice(2, -1);
  
      dailyCosts = dailyCosts.slice(2, -1);  // Exclude the last entry
  
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
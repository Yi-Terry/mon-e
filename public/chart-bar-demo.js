let revenueData = []


function getIncomeAndUpdateChart() {
  fetch('/api/credit/payroll_income/get')
    .then((response) => response.json())
    .then((data) => {
      // Extract net pay YTD amounts
      let incomeData = data.items[0].payroll_income[0].pay_stubs
        .filter((_, index) => index < 2)
        .map(pay_stub => pay_stub.net_pay.ytd_amount);

      // Calculate monthly income
      let monthlyIncome = incomeData.reduce((income, currentValue) => income + currentValue, 0);

      // Push monthly income into revenueData array
      for (let i = 0; i < 12; i++) {
        revenueData.push(monthlyIncome);
      }

      // Update the chart with new revenueData
      myBarChart.data.datasets[0].data = revenueData;
      myBarChart.update();
    });
}

const dateRange = 365

let cashSpentData = []

function getTransactionAndUpdateChart() {
  fetch(`/api/transactions/get?dateRange=${dateRange}`)
    .then((response) => response.json())
    .then((data) => {
      // Initialize an object to store total transaction amounts for each month
      let monthlyTotal = {};

      // Extract transactions from the response
      let transactions = data.all_transactions;

      // Iterate through each transaction
      transactions.forEach(transaction => {
        // Extract amount and date from the transaction
        let amount = transaction.amount;
        let date = new Date(transaction.date);
        let month = date.getMonth(); // Get the month index (0-11)

        // Check if the transaction amount is positive
        // Check if there's already an entry for this month
        if (amount > 0) {
          // Check if there's already an entry for this month
          if (!monthlyTotal[month]) {
            // If not, initialize the total amount for this month to 0
            monthlyTotal[month] = 0;
          }

          // Add the positive transaction amount to the total for this month
          monthlyTotal[month] += amount;
        }
      });

      for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
        cashSpentData.push(monthlyTotal[monthIndex] || 0);
      }

      // Output monthly total transaction amounts
      myBarChart.data.datasets[1].data = cashSpentData;
      myBarChart.update();
      calculateCashFlow()
    })
}

// Example call to getIncomeAndUpdateChart
getTransactionAndUpdateChart();
getIncomeAndUpdateChart();



// Bar Chart Example
var ctx = document.getElementById("myBarChart");
console.log(cashSpentData)
console.log(revenueData)
// Calculate cash flow for each month
let cashFlowData = [];

function calculateCashFlow() {
for (let i = 0; i < 12; i++) {
  let revenue = revenueData[i] || 0;
  let cashSpent = cashSpentData[i] || 0;
  cashFlowData.push(revenue - cashSpent);
}
}

console.log(cashFlowData)


var myBarChart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],

    datasets: [
      {
        label: "Revenue",
        backgroundColor: "#006400", //dark green
        hoverBackgroundColor: "#15F5BA",
        borderColor: "#4e73df",
        data: revenueData,
      },
      {
        label: "Cash Spent",
        backgroundColor: "#FF204E", //red color
        hoverBackgroundColor: "#FF204E", //red hover
        borderColor: "#FF204E", //red border
        data: cashSpentData,
      },
      {
        label: "Cash Flow",
        backgroundColor: "#1cc88a", //green color
        hoverBackgroundColor: "#17a673", //green hover
        borderColor: "#1cc88a", //green border
        data: cashFlowData,

      }
    ],
  },
  options: {
    maintainAspectRatio: false,
    layout: {
      padding: {
        left: 10,
        right: 25,
        top: 25,
        bottom: 0
      }
    },
    scales: {
      xAxes: [{
        time: {
          unit: 'month'
        },
        gridLines: {
          display: false,
          drawBorder: false
        },

        //Displays amount of Months (1-12)
        ticks: {
          maxTicksLimit: 12
        },
        maxBarThickness: 25,
      }],
      yAxes: [{
        ticks: {
          min: 0,
          max: 15000,
          maxTicksLimit: 5,
          padding: 10,
          callback: function (value, index, values) {
            return '$' + number_format(value);
          }
        },
        gridLines: {
          color: "rgb(234, 236, 244)",
          zeroLineColor: "rgb(234, 236, 244)",
          drawBorder: false,
          borderDash: [2],
          zeroLineBorderDash: [2]
        }
      }],
    },
    legend: {
      display: false
    },
    tooltips: {
      callbacks: {
        label: function (tooltipItem, data) {
          var datasetLabel = data.datasets[tooltipItem.datasetIndex].label || '';
          var value = tooltipItem.yLabel;
          if (datasetLabel === "Cash Flow") {
            return datasetLabel + ': $' + number_format(value);
          } else {
            return datasetLabel + ': $' + number_format(value) + ' | Cash Flow: $' + number_format(cashFlowData[tooltipItem.index]);
          }
        }
      }
    }

  }
})
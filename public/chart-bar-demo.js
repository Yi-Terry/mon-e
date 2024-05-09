import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.6/firebase-app.js'
import { getDatabase, ref, onValue, onChildAdded } from 'https://www.gstatic.com/firebasejs/9.6.6/firebase-database.js'
import { firebaseConfig } from './firebase.js'

let processedTransactionKeys = new Set();
document.addEventListener('DOMContentLoaded', async () => {
  const firebaseApp = initializeApp(firebaseConfig)
  const database = getDatabase(firebaseApp)

  let revenueData = []
  let revenueNumber;
  const dateRange = 365
  let cashSpentData = []
  let cashFlowData = [];
  let currentUser;

  fetch('/CurrentUsers')
    .then((response) => response.json())
    .then((user) => {
      currentUser = user
    })
    .catch((error) => {
      console.error('Error fetching user data:', error)
    })

  function calculateCashFlow(revenueData, cashSpentData) {
    for (let i = 0; i < 12; i++) {
      let revenue = revenueData[i] || 0;
      let cashSpent = cashSpentData[i] || 0;
      cashFlowData.push(revenue - cashSpent);
    }
  }

  fetch('/api/credit/payroll_income/get')
    .then((response) => response.json())
    .then((data) => {
      // Extract net pay YTD amounts

      let incomeData = data.items[0].payroll_income[0].pay_stubs
        .filter((_, index) => index < 2)
        .map((pay_stub) => pay_stub.net_pay.ytd_amount);

      // Calculate monthly income
      let monthlyIncome = incomeData.reduce((income, currentValue) => income + currentValue, 0);

      // Push monthly income into revenueData array
      for (let i = 0; i < 12; i++) {
        revenueData.push(monthlyIncome);
      }

      revenueNumber = monthlyIncome;

      let twentyPercentOfIncome = 0.2 * monthlyIncome;

      // Add 20% of monthly income back to monthly income
      revenueNumber += twentyPercentOfIncome;
      // Update the chart with new revenueData
      myBarChart.data.datasets[0].data = revenueData;
      myBarChart.update();
    })
    .then(() =>
      fetch(`/api/transactions/get?dateRange=${dateRange}`)
        .then((response) => response.json())
        .then((data) => {
          const currentUserUid = currentUser;
          const firebaseTransactions = [];
          const transactionsRef = ref(database, 'transactions');

          onValue(transactionsRef, (snapshot) => {

            snapshot.forEach((childSnapshot) => {
              const transaction = childSnapshot.val();
              const key = childSnapshot.key;

              // Check if the transaction has already been processed
              if (!processedTransactionKeys.has(key) && transaction.user === currentUserUid) {
                // Transaction not processed before, add it to processedTransactionKeys
                processedTransactionKeys.add(key);

                // Generate a unique key for each firebaseTransaction
                transaction.key = key; // Add the key to the transaction object
                firebaseTransactions.push(transaction);
              }
            });

            let monthlyTotal = {};
            const transactions = data.all_transactions.concat(firebaseTransactions);

            transactions.forEach((transaction) => {
              let amount = parseFloat(transaction.amount);
              let date = new Date(transaction.date);
              let year = date.getFullYear(); // Get the year
              let month = date.getMonth();

              let key = `${year}-${month}`;

              if (amount > 0) {
                if (!monthlyTotal[key]) {
                  monthlyTotal[key] = 0;
                }
                monthlyTotal[key] += amount;
              }
            });

            // Initialize cashSpentData array
            let cashSpentData = [];

            // Output monthly total transaction amounts
            for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
              let key = `${new Date().getFullYear()}-${monthIndex}`;
              cashSpentData.push(monthlyTotal[key] || 0);
            }

            // Update chart data
            myBarChart.data.datasets[1].data = cashSpentData;
            myBarChart.options.scales.yAxes[0].ticks.max = revenueNumber;
            calculateCashFlow(revenueData, cashSpentData);
            myBarChart.update();
          });
        })
    );
  // Bar Chart Example
  var ctx = document.getElementById("myBarChart");

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
})
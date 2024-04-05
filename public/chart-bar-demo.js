// Bar Chart Example
var ctx = document.getElementById("myBarChart");
var revenueData = [4215, 5312, 6251, 7841, 9821, 2484, 1000, 1911, 10911, 11311, 11311, 13191];
var cashSpentData = [2500, 3200, 4100, 5300, 6800, 9500, 13000, 1400, 12100, 1100, 9800, 8200];

// Calculate cash flow for each month
var cashFlowData = revenueData.map((revenue, index) => revenue - cashSpentData[index]);


var myBarChart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: ["January", "February", "March", "April", "May", "June","July","August","September","October","November","December"], 
    
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
          callback: function(value, index, values) {
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
        label: function(tooltipItem, data) {
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
});
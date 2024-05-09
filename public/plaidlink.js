import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.6/firebase-app.js'
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.6.6/firebase-auth.js'
import {
  getDatabase,
  ref,
  onValue,
} from 'https://www.gstatic.com/firebasejs/9.6.6/firebase-database.js'
import { firebaseConfig } from './firebase.js'

document.addEventListener('DOMContentLoaded', async () => {
  const firebaseApp = initializeApp(firebaseConfig)
  const database = getDatabase(firebaseApp)
  const auth = getAuth(firebaseApp)

  const addBankButton = document.getElementById('add-bank-button')
  let accessToken = localStorage.getItem('accessToken')
  let currentUser;

  fetch('/CurrentUsers')
    .then((response) => response.json())
    .then((user) => {
      currentUser = user
    })
    .catch((error) => {
      console.error('Error fetching user data:', error)
    })

  addBankButton.addEventListener('click', async () => {
    const linkTokenResponse = await fetch('/api/create_link_token', {
      method: 'POST',
    })

    const linkTokenData = await linkTokenResponse.json()
    const linkToken = linkTokenData.link_token

    const linkHandler = Plaid.create({
      token: linkToken,
      onSuccess: (publicToken, metadata) => {
        fetch('/api/set_access_token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ public_token: publicToken }),
        })
          .then((response) => response.json())
          .then((data) => {
            accessToken = data.access_token
            localStorage.setItem('accessToken', accessToken)
            const itemId = data.item_id
            window.plaid.sendToken(accessToken, itemId, currentUser)
            window.location.assign('homePage.html')
            displayTransactions()
            displayRecurringTransactions()
          })
          .catch((error) => console.error('Error setting access token:', error))
      },
      onExit: (err, metadata) => {
        console.error('Plaid Link exited:', err, metadata)
      },
    })

    linkHandler.open()
  })

  let transactionCategories = {}

  function displayTransactions() {
    const dateRangeSelector = document.getElementById('date-range')
    const transactionsContainer = document.getElementById(
      'transactions-container',
    )

    if (!accessToken) {
      console.error(
        'Access Token is not available. Please link your account first.',
      )
      return
    }

    // Reset transactionCategories object
    transactionCategories = {}

    fetch(`/api/transactions/get?dateRange=${dateRangeSelector.value}`)
      .then((response) => response.json())
      .then((plaidData) => {
        const plaidTransactions = plaidData.all_transactions

        const currentUserUid = currentUser
        const transactionsRef = ref(database, 'transactions')
        onValue(transactionsRef, (snapshot) => {
          const firebaseTransactions = []
          snapshot.forEach((childSnapshot) => {
            const transaction = childSnapshot.val()
            if (transaction.user === currentUserUid) {
              firebaseTransactions.push(transaction)
            }
          })

          const allTransactions = plaidTransactions.concat(firebaseTransactions)
          allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date))

          const groupedTransactions = groupByDate(allTransactions)

          let tableHTML = '<table class="transactions-table">'
          Object.keys(groupedTransactions).forEach((date) => {
            tableHTML += `<tr class="date-row"><th colspan="3">${date}</th></tr>`
            groupedTransactions[date].forEach((transaction) => {
              const mainCategory = String(transaction.category)
                .split(',')[0]
                .trim()

              if (
                !transaction.name.includes('CREDIT CARD') &&
                !transaction.name.includes('INTRST')
              ) {
                const amount = Math.abs(transaction.amount)
                if (transactionCategories[mainCategory]) {
                  transactionCategories[mainCategory] += amount
                } else {
                  transactionCategories[mainCategory] = amount
                }
              }

              const logoHTML = transaction.logo_url
                ? `<td class="transaction-logo"><img src="${transaction.logo_url}" alt="${transaction.name}"></td>`
                : '<td class="transaction-logo"></td>'

              const formattedAmount = `$${Math.abs(transaction.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

              tableHTML += `
                            <tr class="transaction-row">
                                <td class="transaction-name">${transaction.name}</td>
                                ${logoHTML}
                                <td class="transaction-amount">${formattedAmount}</td>
                            </tr>`
            })
          })
          tableHTML += '</table>'

          transactionsContainer.innerHTML = tableHTML

          displayPieChart()
        })
      })
      .catch((error) => console.error('Error fetching transactions:', error))
  }


  function groupByDate(transactions) {
    const grouped = {}
    transactions.forEach((transaction) => {
      if (!grouped[transaction.date]) {
        grouped[transaction.date] = []
      }
      grouped[transaction.date].push(transaction)
    })
    return grouped
  }

  function displayRecurringTransactions() {
    const recurringTransactionsContainer = document.getElementById(
      'recurring-transactions-container',
    )

    if (!accessToken) {
      console.error(
        'Access Token is not available. Please link your account first.',
      )
      return
    }

    fetch('/api/transactions/recurring')
      .then((response) => response.json())
      .then((data) => {
        let tableHTML = '<table class="recurring-transactions-table">'
        tableHTML +=
          '<tr class="table-header"><th>Description</th><th>Frequency</th><th>Amount</th></tr>'

        data.recurring_Transactions.inflow_streams.forEach((stream) => {
          const formattedAmount = `$${Math.abs(stream.last_amount.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          tableHTML += `
                        <tr>
                            <td>${stream.description}</td>
                            <td>${stream.frequency}</td>
                            <td>${formattedAmount}</td>
                        </tr>`
        })

        data.recurring_Transactions.outflow_streams.forEach((stream) => {
          const formattedAmount = `$${Math.abs(stream.last_amount.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          tableHTML += `
                        <tr>
                            <td>${stream.description}</td>
                            <td>${stream.frequency}</td>
                            <td>${formattedAmount}</td>
                        </tr>`
        })

        tableHTML += '</table>'

        recurringTransactionsContainer.innerHTML = tableHTML
      })
      .catch((error) =>
        console.error('Error fetching recurring transactions:', error),
      )
  }

  function displayPieChart() {
    const ctx = document.getElementById('myPieChart').getContext('2d')

    const labels = Object.keys(transactionCategories)
    const data = Object.values(transactionCategories)

    new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: [
              '#FF6384',
              '#36A2EB',
              '#FFCE56',
              '#4BC0C0',
              '#FF8A80',
              '#A1887F',
              '#7986CB',
              '#81C784',
              '#FFD54F',
              '#64B5F6',
            ],
          },
        ],
      },
      options: {
        responsive: true,
        legend: {
          position: 'right',
        },
        tooltips: {
          callbacks: {
            label: function (tooltipItem, data) {
              let label = data.labels[tooltipItem.index] || ''
              let value = data.datasets[0].data[tooltipItem.index] || ''
              if (value) {
                value = '$' + Math.abs(value).toFixed(2)
              }
              return label + ': ' + value
            },
          },
        },
      },
    })
  }

  const dateRangeSelector = document.getElementById('date-range')
  dateRangeSelector.addEventListener('change', displayTransactions)




  displayTransactions();
  setTimeout(displayRecurringTransactions, 1000)
});

const linkElement = document.createElement('link')
linkElement.rel = 'stylesheet'
linkElement.href = 'transactions.css'
document.head.appendChild(linkElement)

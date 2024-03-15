document.addEventListener('DOMContentLoaded', async () => {
  const addBankButton = document.getElementById('add-bank-button')
  let accessToken = localStorage.getItem('accessToken') // Retrieve access token from localStorage
  let currentUser
  const fetchRecurringTransactionsButton = document.getElementById(
    'fetch-recurring-transactions',
  )
  fetchRecurringTransactionsButton.addEventListener(
    'click',
    displayRecurringTransactions,
  )

  fetch('/CurrentUsers')
    .then((response) => response.json())
    .then((user) => {
      currentUser = user // Assign user data to the variable
      console.log(currentUser) // You can log it here if needed
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

    const dateRange = dateRangeSelector.value

    fetch(`/api/transactions/get?dateRange=${dateRange}`)
      .then((response) => response.json())
      .then((data) => {
        transactionsContainer.innerHTML = `
                    <ul>
                        ${data.all_transactions
                          .map(
                            (transaction) => `
                            <li>
                                <strong>Name:</strong> ${transaction.name} |
                                <strong>Amount:</strong> ${transaction.amount} ${transaction.iso_currency_code} |
                                <strong>Date:</strong> ${transaction.date}
                            </li>`,
                          )
                          .join('')}
                    </ul>`
      })
      .catch((error) => console.error('Error fetching transactions:', error))
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
        const recurringTransactions = data.recurring_Transactions || []

        recurringTransactionsContainer.innerHTML = `
                    <ul>
                        ${recurringTransactions.inflow_streams
                          .map(
                            (stream) => `
                            <li>
                                <strong>Category:</strong> ${stream.category.join(', ')} |
                                <strong>Description:</strong> ${stream.description} |
                                <strong>Frequency:</strong> ${stream.frequency}
                            </li>`,
                          )
                          .join('')}
                        ${recurringTransactions.outflow_streams
                          .map(
                            (stream) => `
                            <li>
                                <strong>Category:</strong> ${stream.category.join(', ')} |
                                <strong>Description:</strong> ${stream.description} |
                                <strong>Frequency:</strong> ${stream.frequency}
                            </li>`,
                          )
                          .join('')}
                    </ul>`
      })
      .catch((error) =>
        console.error('Error fetching recurring transactions:', error),
      )
  }

  const dateRangeSelector = document.getElementById('date-range')
  dateRangeSelector.addEventListener('change', displayTransactions)

  displayTransactions()
})

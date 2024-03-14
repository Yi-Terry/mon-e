document.addEventListener('DOMContentLoaded', async () => {
    const addBankButton = document.getElementById('add-bank-button');
    let accessToken = null;
    let currentUser;

    // You may need to replace this fetch with the appropriate endpoint for getting current user data
    fetch('/CurrentUsers')
        .then(response => response.json())
        .then(user => {
            currentUser = user; // Assign user data to the variable
            console.log(currentUser); // You can log it here if needed
        })
        .catch(error => {
            console.error('Error fetching user data:', error);
        });

    addBankButton.addEventListener('click', async () => {
        const linkTokenResponse = await fetch('/api/create_link_token', {
            method: 'POST',
        });

        const linkTokenData = await linkTokenResponse.json();
        const linkToken = linkTokenData.link_token;

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
                    .then(response => response.json())
                    .then(data => {
                        accessToken = data.access_token;
                        const itemId = data.item_id;
                        // Here you can pass the access token, item ID, and current user data to your backend
                        // window.plaid.sendToken(accessToken, itemId, currentUser);
                        // Display transactions after successful Plaid login
                        displayTransactions();
                    })
                    .catch(error => console.error('Error setting access token:', error));
            },
            onExit: (err, metadata) => {
                console.error('Plaid Link exited:', err, metadata);
            },
        });

        linkHandler.open();
    });

    // Function to display transactions based on the selected date range
    function displayTransactions() {
        const dateRangeSelector = document.getElementById('date-range');
        const transactionsContainer = document.getElementById('transactions-container');

        if (!accessToken) {
            console.error('Access Token is not available. Please link your account first.');
            return;
        }

        const dateRange = dateRangeSelector.value;

        fetch(`/api/transactions/get?dateRange=${dateRange}`)
            .then(response => response.json())
            .then(data => {
                transactionsContainer.innerHTML = `
                    <ul>
                        ${data.all_transactions.map(transaction => `
                            <li>
                                <strong>Name:</strong> ${transaction.name} |
                                <strong>Amount:</strong> ${transaction.amount} ${transaction.iso_currency_code} |
                                <strong>Date:</strong> ${transaction.date}
                            </li>`).join('')}
                    </ul>`;
            })
            .catch(error => console.error('Error fetching transactions:', error));
    }

    // Listen for changes in the date range selector
    const dateRangeSelector = document.getElementById('date-range');
    dateRangeSelector.addEventListener('change', displayTransactions);

    // Initial call to display transactions with default date range
    displayTransactions();
});



  
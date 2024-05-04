document.addEventListener('DOMContentLoaded', async () => {
  const addIncomeButton = document.getElementById('add-Income-button');
  let linkTokenData;
  let currentUser;


  addIncomeButton.addEventListener('click', async () => {
    const linkTokenResponse = await fetch('/api/link/token/create', {
      method: 'POST',
    });

    const linkTokenData = await linkTokenResponse.json();
    const linkToken = linkTokenData.link_token;

    const linkHandler = Plaid.create({
      token: linkToken,
      onSuccess: () => {
        setTimeout(getIncome, 3000);
      },
      onExit: (err, metadata) => {
        console.error('Plaid Link exited:', err, metadata);
      },
    });

    linkHandler.open();
  });

  function getIncome() {
    fetch('/api/credit/payroll_income/get').then((response) => response.json())
      .then((data) => {
        incomeData = data.items[0].payroll_income[0].pay_stubs
          .filter((_, index) => index <= 1)
          .map(pay_stub => pay_stub.net_pay.ytd_amount);
        let monthlyIncome = incomeData.reduce((income, currentValue) => income + currentValue, 0);
        let annualIncome = (monthlyIncome * 12)
        const earningContainerMonthly = document.getElementById('monthlyIncome');
        const earningContainerAnnually = document.getElementById('annualIncome');
        const formattedAnnual = `$${annualIncome}`;
        const formattedMonthly = `$${monthlyIncome}`;
        earningContainerMonthly.innerHTML = formattedMonthly
        earningContainerAnnually.innerHTML = formattedAnnual


        addIncomeButton.remove();
      }).catch((error) => {
        console.error('Error fetching income data:', error);
      });
  }

  getIncome()
});

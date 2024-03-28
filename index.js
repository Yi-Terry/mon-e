const { app, BrowserWindow, session, ipcMain, dialog, ipcRenderer } = require('electron');
const express = require('express');
const path = require('node:path');
const bcrypt = require("bcryptjs");
const firebase = require("firebase/app");
const { getDatabase, set, ref, onValue } = require("firebase/database");
const { getAuth, createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword, onAuthStateChanged } = require("firebase/auth");

const firebaseConfig = {
  apiKey: "AIzaSyAuj-AVSSgdL9QKDvCr6C4WBfb_o_RhiR8",
  authDomain: "mon-e-2dbd6.firebaseapp.com",
  projectId: "mon-e-2dbd6",
  storageBucket: "mon-e-2dbd6.appspot.com",
  messagingSenderId: "983558902043",
  appId: "1:983558902043:web:93b3e671eeafa0a99503be"
};

var fapp = firebase.initializeApp(firebaseConfig)
const database = getDatabase(fapp)
const auth = getAuth(fapp)


const appServer = express()
const serverPort = 3000



appServer.use(express.static(path.join(__dirname, 'public')))


let ACCESS_TOKEN = null

appServer.get('/createAccount.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'createAccount.html'))
})

appServer.get('/index.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.js'))
})

appServer.get('/renderer.js', (req, res) => {
  res.sendFile(path.join(__dirname, './renderer.js'))
})

appServer.listen(serverPort, () => {
  console.log(`Server is running on http://localhost:${serverPort}`)
})

let win

ipcMain.on('get-main-window', (event) => {
  event.returnValue = win
})

function createWindow() {
  win = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      webSecurity: true,
      allowRunningInsecureContent: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  win.loadURL(`http://localhost:${serverPort}/signUp.html`)

  win.on('closed', () => {
    session.defaultSession.clearStorageData(
      {
        storages: ['cookies'],
      },
      function (error) {
        if (error) {
          console.error('Error clearing cookies:', error)
        } else {
          console.log('Cookies cleared')
        }
      },
    )

    win = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (win === null) {
    createWindow()
  }
})

ipcMain.on("sendTokenCurrentUser", (event, accesstoken, itemid, currentUser) => {
  if (currentUser != null) {
    set(ref(database, 'plaidToken/' + currentUser), {
      Access_Token: accesstoken,
      Item_Id: itemid
    });
  } else {
    console.log("error storing tokens")
  }
});

ipcMain.on("AppleSignIn", (event, user) => {
  if (user) {
    appServer.get('/CurrentUsers', (req, res) => {
      res.json(user)
    });
    const Access_Token = ref(database, 'plaidToken/' + user + '/Access_Token');
    onValue(Access_Token, (snapshot) => {
      const data = snapshot.val();
      ACCESS_TOKEN = data
    });
    console.log('user signed in');
  } else {
    console.log('User is logged out');
  }
});

ipcMain.on('GoogleSignIn', (event, user) => {
  if (user) {
    appServer.get('/CurrentUsers', (req, res) => {
      res.json(user)
    })
    const Access_Token = ref(database, 'plaidToken/' + user + '/Access_Token');
    onValue(Access_Token, (snapshot) => {
      const data = snapshot.val();
      ACCESS_TOKEN = data
    });
    console.log('user signed in')
  } else {
    console.log('User is logged out')
  }
})

ipcMain.on("ErrorMessage", (event, message) => {
  dialog.showMessageBox({
    type: 'question',
    buttons: ['Ok'],
    defaultId: 2,
    message: 'Invalid Password',
    detail: message,
  })
});


ipcMain.on('createAccount', (event, email, password, FirstName, LastName, PhoneNumber) => {
  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user
      hash = bcrypt.hashSync(password, 12)
      password = hash
      set(ref(database, 'users/' + user.uid), {
        FirstName: FirstName,
        LastName: LastName,
        PhoneNumber: PhoneNumber,
        email: email,
        password: password,
        created_at: Date.now(),
      })
        .then(() => {
          sendEmailVerification(user)
          dialog.showMessageBox({
            type: 'question',
            buttons: ['Ok'],
            defaultId: 2,
            message: 'Account Created!',
            detail: 'Email Verification Link has been sent',
          })
          win.loadURL(`http://localhost:${serverPort}/signUp.html`)
        })
        .catch((error) => { })
    })
    .catch((error) => {
      const errorCode = error.code
      const errorMessage = error.message

      dialog.showMessageBox({
        type: 'question',
        buttons: ['Ok'],
        title: 'Error Creating Account.',
        cancelId: 99,
        message: errorMessage,
      })
    })
},
)



ipcMain.on('Login', (event, email, password) => {
  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user
      if (user.emailVerified) {
        console.log('user signed in')
        appServer.get('/CurrentUsers', (req, res) => {
          res.json(user.uid)
        });
        const Access_Token = ref(database, 'plaidToken/' + user.uid + '/Access_Token');
        onValue(Access_Token, (snapshot) => {
          const data = snapshot.val();
          ACCESS_TOKEN = data
        });
      } else {
        dialog.showMessageBox({
          type: 'question',
          buttons: ['Ok'],
          title: 'Error Logging In.',
          cancelId: 99,
          message: 'Email not verified. New Verification Link sent to Email!',
        })
        sendEmailVerification(user)
      }
    })
    .catch((error) => {
      const errorCode = error.code
      const errorMessage = error.message
      dialog.showMessageBox({
        type: 'question',
        buttons: ['Ok'],
        title: 'Error Logging In.',
        cancelId: 99,
        message: errorMessage,
      })
    })
  onAuthStateChanged(auth, (user) => {
    if (user) {
      var isVerified = user.emailVerified
      if (isVerified) {
        win.loadURL(`http://localhost:${serverPort}/homePage.html`)
      }
    } else {
    }
  })
})

  ; ('use strict')

// read env vars from .env file
require('dotenv').config()
const {
  Configuration,
  PlaidApi,
  Products,
  PlaidEnvironments,
} = require('plaid')
const util = require('util')
const { v4: uuidv4 } = require('uuid')
const bodyParser = require('body-parser')
const moment = require('moment')
const cors = require('cors')

const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID
const PLAID_SECRET = process.env.PLAID_SECRET
const PLAID_ENV = process.env.PLAID_ENV || 'sandbox'

// PLAID_PRODUCTS is a comma-separated list of products to use when initializing
// Link. Note that this list must contain 'assets' in order for the appServer to be
// able to create and retrieve asset reports.
const PLAID_PRODUCTS = (
  process.env.PLAID_PRODUCTS || Products.Transactions
).split(',')

// PLAID_COUNTRY_CODES is a comma-separated list of countries for which users
// will be able to select institutions from.
const PLAID_COUNTRY_CODES = (process.env.PLAID_COUNTRY_CODES || 'US').split(',')

// Parameters used for the OAuth redirect Link flow.
//
// Set PLAID_REDIRECT_URI to 'http://localhost:3000'
// The OAuth redirect flow requires an endpoint on the developer's website
// that the bank website should redirect to. You will need to configure
// this redirect URI for your client ID through the Plaid developer dashboard
// at https://dashboard.plaid.com/team/api.
const PLAID_REDIRECT_URI = process.env.PLAID_REDIRECT_URI || ''

// Parameter used for OAuth in Android. This should be the package name of your appServer,
// e.g. com.plaid.linksample
const PLAID_ANDROID_PACKAGE_NAME = process.env.PLAID_ANDROID_PACKAGE_NAME || ''

// We store the access_token in memory - in production, store it in a secure
// persistent data store
let PUBLIC_TOKEN = null
let ITEM_ID = null
let ACCOUNT_ID = null
// The payment_id is only relevant for the UK/EU Payment Initiation product.
// We store the payment_id in memory - in production, store it in a secure
// persistent data store along with the Payment metadata, such as userId .
let PAYMENT_ID = null
// The transfer_id and authorization_id are only relevant for Transfer ACH product.
// We store the transfer_id in memory - in production, store it in a secure
// persistent data store
let AUTHORIZATION_ID = null
let TRANSFER_ID = null

// Initialize the Plaid client
// Find your API keys in the Dashboard (https://dashboard.plaid.com/account/keys)

const configuration = new Configuration({
  basePath: PlaidEnvironments[PLAID_ENV],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
      'PLAID-SECRET': PLAID_SECRET,
      'Plaid-Version': '2020-09-14',
    },
  },
})

const client = new PlaidApi(configuration)

appServer.use(
  bodyParser.urlencoded({
    extended: false,
  }),
)
appServer.use(bodyParser.json())
appServer.use(cors())

appServer.post('/api/info', function (request, response, next) {
  response.json({
    item_id: ITEM_ID,
    access_token: ACCESS_TOKEN,
    products: PLAID_PRODUCTS,
  })
})

// Create a link token with configs which we can then use to initialize Plaid Link client-side.
// See https://plaid.com/docs/#create-link-token
appServer.post('/api/create_link_token', function (request, response, next) {
  Promise.resolve()
    .then(async function () {
      const configs = {
        user: {
          // This should correspond to a unique id for the current user.
          client_user_id: 'user-id',
        },
        client_name: 'Plaid Quickstart',
        products: PLAID_PRODUCTS,
        country_codes: PLAID_COUNTRY_CODES,
        language: 'en',
      }

      if (PLAID_REDIRECT_URI !== '') {
        configs.redirect_uri = PLAID_REDIRECT_URI
      }

      if (PLAID_ANDROID_PACKAGE_NAME !== '') {
        configs.android_package_name = PLAID_ANDROID_PACKAGE_NAME
      }
      const createTokenResponse = await client.linkTokenCreate(configs)
      prettyPrintResponse(createTokenResponse)
      response.json(createTokenResponse.data)
    })
    .catch(next)
})

// Create a link token with configs which we can then use to initialize Plaid Link client-side
// for a 'payment-initiation' flow.
// See:
// - https://plaid.com/docs/payment-initiation/
// - https://plaid.com/docs/#payment-initiation-create-link-token-request
appServer.post(
  '/api/create_link_token_for_payment',
  function (request, response, next) {
    Promise.resolve()
      .then(async function () {
        const createRecipientResponse =
          await client.paymentInitiationRecipientCreate({
            name: 'Harry Potter',
            iban: 'GB33BUKB20201555555555',
            address: {
              street: ['4 Privet Drive'],
              city: 'Little Whinging',
              postal_code: '11111',
              country: 'GB',
            },
          })
        const recipientId = createRecipientResponse.data.recipient_id
        prettyPrintResponse(createRecipientResponse)

        const createPaymentResponse =
          await client.paymentInitiationPaymentCreate({
            recipient_id: recipientId,
            reference: 'paymentRef',
            amount: {
              value: 1.23,
              currency: 'GBP',
            },
          })
        prettyPrintResponse(createPaymentResponse)
        const paymentId = createPaymentResponse.data.payment_id

        // We store the payment_id in memory for demo purposes - in production, store it in a secure
        // persistent data store along with the Payment metadata, such as userId.
        PAYMENT_ID = paymentId

        const configs = {
          client_name: 'Plaid Quickstart',
          user: {
            // This should correspond to a unique id for the current user.
            // Typically, this will be a user ID number from your application.
            // Personally identifiable information, such as an email address or phone number, should not be used here.
            client_user_id: uuidv4(),
          },
          // Institutions from all listed countries will be shown.
          country_codes: PLAID_COUNTRY_CODES,
          language: 'en',
          // The 'payment_initiation' product has to be the only element in the 'products' list.
          products: [Products.PaymentInitiation],
          payment_initiation: {
            payment_id: paymentId,
          },
        }
        if (PLAID_REDIRECT_URI !== '') {
          configs.redirect_uri = PLAID_REDIRECT_URI
        }
        const createTokenResponse = await client.linkTokenCreate(configs)
        prettyPrintResponse(createTokenResponse)
        response.json(createTokenResponse.data)
      })
      .catch(next)
  },
)

// Exchange token flow - exchange a Link public_token for
// an API access_token
// https://plaid.com/docs/#exchange-token-flow
appServer.post('/api/set_access_token', function (request, response, next) {
  PUBLIC_TOKEN = request.body.public_token
  Promise.resolve()
    .then(async function () {
      const tokenResponse = await client.itemPublicTokenExchange({
        public_token: PUBLIC_TOKEN,
      })
      prettyPrintResponse(tokenResponse)
      ACCESS_TOKEN = tokenResponse.data.access_token
      ITEM_ID = tokenResponse.data.item_id
      response.json({
        // the 'access_token' is a private token, DO NOT pass this token to the frontend in your production environment
        access_token: ACCESS_TOKEN,
        item_id: ITEM_ID,
        error: null,
      })
    })
    .catch(next)
})

// Retrieve ACH or ETF Auth data for an Item's accounts
// https://plaid.com/docs/#auth
appServer.get('/api/auth', function (request, response, next) {
  Promise.resolve()
    .then(async function () {
      const authResponse = await client.authGet({
        access_token: ACCESS_TOKEN,
      })
      prettyPrintResponse(authResponse)
      response.json(authResponse.data)
    })
    .catch(next)
})

//TRANSACTIONS
// Retrieve Transactions for an Item
// https://plaid.com/docs/#transactions
appServer.get('/api/transactions', function (request, response, next) {
  Promise.resolve()
    .then(async function () {
      // Set cursor to empty to receive all historical updates
      let cursor = null

      // New transaction updates since "cursor"
      let added = []
      let modified = []
      // Removed transaction ids
      let removed = []
      let hasMore = true
      // Iterate through each page of new transaction updates for item
      while (hasMore) {
        const request = {
          access_token: ACCESS_TOKEN,
          cursor: cursor,
        }
        const response = await client.transactionsSync(request)
        const data = response.data
        // Add this page of results
        added = added.concat(data.added)
        modified = modified.concat(data.modified)
        removed = removed.concat(data.removed)
        hasMore = data.has_more
        // Update cursor to the next cursor
        cursor = data.next_cursor
        prettyPrintResponse(response)
      }

      response.json({ latest_transactions: added })
    })
    .catch(next)
})

appServer.get('/api/transactions/get', async function (request, response, next) {
  try {

    const endDate = new Date();
    let startDate;

    const dateRange = parseInt(request.query.dateRange) || 30;

    startDate = new Date();
    startDate.setDate(startDate.getDate() - dateRange);

    const startDateString = startDate.toISOString().split('T')[0];
    const endDateString = endDate.toISOString().split('T')[0];

    const initialRequest = {
      access_token: ACCESS_TOKEN,
      start_date: startDateString,
      end_date: endDateString,
    };

    const initialResponse = await client.transactionsGet(initialRequest);
    let transactions = initialResponse.data.transactions;
    const total_transactions = initialResponse.data.total_transactions;


    while (transactions.length < total_transactions) {
      const paginatedRequest = {
        access_token: ACCESS_TOKEN,
        start_date: startDateString,
        end_date: endDateString,
        options: {
          offset: transactions.length,
        },
      };

      const paginatedResponse = await client.transactionsGet(paginatedRequest);
      transactions = transactions.concat(paginatedResponse.data.transactions);
    }

    response.json({ all_transactions: transactions });
  } catch (error) {
    console.error('Error fetching all transactions:', error);
    response.status(500).json({
      error: 'Internal Server Error',
    });
  }
});

appServer.get(
  '/api/transactions/recurring',
  function (request, response, next) {
    Promise.resolve()
      .then(async function () {

        const accountsResponse = await client.accountsGet({
          access_token: ACCESS_TOKEN,
        })

        const accountIds = accountsResponse.data.accounts.map(
          (account) => account.account_id,
        )

        const Plaidrequest = {
          access_token: ACCESS_TOKEN,
          account_ids: accountIds,
        }

        const recurringTransactions =
          await client.transactionsRecurringGet(Plaidrequest)


        console.log(recurringTransactions.data.inflow_streams)

        response.json({
          recurring_Transactions: recurringTransactions.data,
        })
      })
      .catch(function (error) {

        console.error('Error fetching recurring transactions:', error)
        response.status(500).json({
          error: 'Internal Server Error',
        })
      })
  },
)

// Retrieve Investment Transactions for an Item
// https://plaid.com/docs/#investments
appServer.get(
  '/api/investments_transactions',
  function (request, response, next) {
    Promise.resolve()
      .then(async function () {
        const startDate = moment().subtract(30, 'days').format('YYYY-MM-DD')
        const endDate = moment().format('YYYY-MM-DD')
        const configs = {
          access_token: ACCESS_TOKEN,
          start_date: startDate,
          end_date: endDate,
        }
        const investmentTransactionsResponse =
          await client.investmentsTransactionsGet(configs)
        prettyPrintResponse(investmentTransactionsResponse)
        response.json({
          error: null,
          investments_transactions: investmentTransactionsResponse.data,
        })
      })
      .catch(next)
  },
)

//Refresh transactions
//https://plaid.com/docs/api/products/transactions/#transactionsrefresh
appServer.get('/api/transactions/refresh', function (request, response, next) {
  Promise.resolve()
    .then(async function () {
      const request = {
        access_token: ACCESS_TOKEN,
      }
      await client.transactionsRefresh(request)
    })
    .catch(next)
})

//INCOME
//refreshes the users bank income info
//https://plaid.com/docs/api/products/income/#creditbank_incomerefresh
appServer.get(
  '/api/credit/bank_income/refresh',
  function (request, response, next) {
    Promise.resolve()
      .then(async function () {
        const request = {
          access_token: ACCESS_TOKEN,
          options: {
            days_requested: 90,
          },
        }
        response = await client.creditBankIncomeRefresh(request)
      })
      .catch(next)
  },
)

//IDENTITY
// Retrieve Identity for an Item
// https://plaid.com/docs/#identity
appServer.get('/api/identity', function (request, response, next) {
  Promise.resolve()
    .then(async function () {
      const identityResponse = await client.identityGet({
        access_token: ACCESS_TOKEN,
      })
      prettyPrintResponse(identityResponse)
      response.json({ identity: identityResponse.data.accounts })
    })
    .catch(next)
})

//BALANCE
// Retrieve real-time Balances for each of an Item's accounts
// https://plaid.com/docs/#balance
appServer.get('/api/balance', function (request, response, next) {
  Promise.resolve()
    .then(async function () {
      const balanceResponse = await client.accountsBalanceGet({
        access_token: ACCESS_TOKEN,
      })
      prettyPrintResponse(balanceResponse)
      response.json(balanceResponse.data)
    })
    .catch(next)
})

// Retrieve Holdings for an Item
// https://plaid.com/docs/#investments
appServer.get('/api/holdings', function (request, response, next) {
  Promise.resolve()
    .then(async function () {
      const holdingsResponse = await client.investmentsHoldingsGet({
        access_token: ACCESS_TOKEN,
      })
      prettyPrintResponse(holdingsResponse)
      response.json({ error: null, holdings: holdingsResponse.data })
    })
    .catch(next)
})

// Retrieve Liabilities for an Item
// https://plaid.com/docs/#liabilities
appServer.get('/api/liabilities', function (request, response, next) {
  Promise.resolve()
    .then(async function () {
      const liabilitiesResponse = await client.liabilitiesGet({
        access_token: ACCESS_TOKEN,
      })
      prettyPrintResponse(liabilitiesResponse)
      response.json({ error: null, liabilities: liabilitiesResponse.data })
    })
    .catch(next)
})

// Retrieve information about an Item
// https://plaid.com/docs/#retrieve-item
appServer.get('/api/item', function (request, response, next) {
  Promise.resolve()
    .then(async function () {
      // Pull the Item - this includes information about available products,
      // billed products, webhook information, and more.
      const itemResponse = await client.itemGet({
        access_token: ACCESS_TOKEN,
      })
      // Also pull information about the institution
      const configs = {
        institution_id: itemResponse.data.item.institution_id,
        country_codes: PLAID_COUNTRY_CODES,
      }
      const instResponse = await client.institutionsGetById(configs)
      prettyPrintResponse(itemResponse)
      response.json({
        item: itemResponse.data.item,
        institution: instResponse.data.institution,
      })
    })
    .catch(next)
})

// Retrieve an Item's accounts
// https://plaid.com/docs/#accounts
appServer.get('/api/accounts', function (request, response, next) {
  Promise.resolve()
    .then(async function () {
      const accountsResponse = await client.accountsGet({
        access_token: ACCESS_TOKEN,
      })
      prettyPrintResponse(accountsResponse)
      response.json(accountsResponse.data)
    })
    .catch(next)
})

// Create and then retrieve an Asset Report for one or more Items. Note that an
// Asset Report can contain up to 100 items, but for simplicity we're only
// including one Item here.
// https://plaid.com/docs/#assets
appServer.get('/api/assets', function (request, response, next) {
  Promise.resolve()
    .then(async function () {
      // You can specify up to two years of transaction history for an Asset
      // Report.
      const daysRequested = 10

      // The `options` object allows you to specify a webhook for Asset Report
      // generation, as well as information that you want included in the Asset
      // Report. All fields are optional.
      const options = {
        client_report_id: 'Custom Report ID #123',
        // webhook: 'https://your-domain.tld/plaid-webhook',
        user: {
          client_user_id: 'Custom User ID #456',
          first_name: 'Alice',
          middle_name: 'Bobcat',
          last_name: 'Cranberry',
          ssn: '123-45-6789',
          phone_number: '555-123-4567',
          email: 'alice@example.com',
        },
      }
      const configs = {
        access_tokens: [ACCESS_TOKEN],
        days_requested: daysRequested,
        options,
      }
      const assetReportCreateResponse = await client.assetReportCreate(configs)
      prettyPrintResponse(assetReportCreateResponse)
      const assetReportToken = assetReportCreateResponse.data.asset_report_token
      const getResponse = await getAssetReportWithRetries(
        client,
        assetReportToken,
      )
      const pdfRequest = {
        asset_report_token: assetReportToken,
      }

      const pdfResponse = await client.assetReportPdfGet(pdfRequest, {
        responseType: 'arraybuffer',
      })
      prettyPrintResponse(getResponse)
      prettyPrintResponse(pdfResponse)
      response.json({
        json: getResponse.data.report,
        pdf: pdfResponse.data.toString('base64'),
      })
    })
    .catch(next)
})

// This functionality is only relevant for the UK/EU Payment Initiation product.
// Retrieve Payment for a specified Payment ID
appServer.get('/api/payment', function (request, response, next) {
  Promise.resolve()
    .then(async function () {
      const paymentGetResponse = await client.paymentInitiationPaymentGet({
        payment_id: PAYMENT_ID,
      })
      prettyPrintResponse(paymentGetResponse)
      response.json({ error: null, payment: paymentGetResponse.data })
    })
    .catch(next)
})

// This endpoint is still supported but is no longer recommended
// For Income best practices, see https://github.com/plaid/income-sample instead
appServer.get(
  '/api/income/verification/paystubs',
  function (request, response, next) {
    Promise.resolve()
      .then(async function () {
        const paystubsGetResponse = await client.incomeVerificationPaystubsGet({
          access_token: ACCESS_TOKEN,
        })
        prettyPrintResponse(paystubsGetResponse)
        response.json({ error: null, paystubs: paystubsGetResponse.data })
      })
      .catch(next)
  },
)

appServer.use('/api', function (error, request, response, next) {
  prettyPrintResponse(error.response)
  response.json(formatError(error.response))
})

const prettyPrintResponse = (response) => {
  console.log(util.inspect(response.data, { colors: true, depth: 4 }))
}

// This is a helper function to poll for the completion of an Asset Report and
// then send it in the response to the client. Alternatively, you can provide a
// webhook in the `options` object in your `/asset_report/create` request to be
// notified when the Asset Report is finished being generated.

const getAssetReportWithRetries = (
  plaidClient,
  asset_report_token,
  ms = 1000,
  retriesLeft = 20,
) =>
  new Promise((resolve, reject) => {
    const request = {
      asset_report_token,
    }

    plaidClient
      .assetReportGet(request)
      .then(resolve)
      .catch(() => {
        setTimeout(() => {
          if (retriesLeft === 1) {
            reject('Ran out of retries while polling for asset report')
            return
          }
          getAssetReportWithRetries(
            plaidClient,
            asset_report_token,
            ms,
            retriesLeft - 1,
          ).then(resolve)
        }, ms)
      })
  })

const formatError = (error) => {
  return {
    error: { ...error.data, status_code: error.status },
  }
}

appServer.get('/api/transfer_authorize', function (request, response, next) {
  Promise.resolve()
    .then(async function () {
      const accountsResponse = await client.accountsGet({
        access_token: ACCESS_TOKEN,
      })
      ACCOUNT_ID = accountsResponse.data.accounts[0].account_id

      const transferAuthorizationCreateResponse =
        await client.transferAuthorizationCreate({
          access_token: ACCESS_TOKEN,
          account_id: ACCOUNT_ID,
          type: 'debit',
          network: 'ach',
          amount: '1.00',
          ach_class: 'ppd',
          user: {
            legal_name: 'FirstName LastName',
            email_address: 'foobar@email.com',
            address: {
              street: '123 Main St.',
              city: 'San Francisco',
              region: 'CA',
              postal_code: '94053',
              country: 'US',
            },
          },
        })
      prettyPrintResponse(transferAuthorizationCreateResponse)
      AUTHORIZATION_ID =
        transferAuthorizationCreateResponse.data.authorization.id
      response.json(transferAuthorizationCreateResponse.data)
    })
    .catch(next)
})

appServer.get('/api/transfer_create', function (request, response, next) {
  Promise.resolve()
    .then(async function () {
      const transferCreateResponse = await client.transferCreate({
        access_token: ACCESS_TOKEN,
        account_id: ACCOUNT_ID,
        authorization_id: AUTHORIZATION_ID,
        description: 'Debit',
      })
      prettyPrintResponse(transferCreateResponse)
      TRANSFER_ID = transferCreateResponse.data.transfer.id
      response.json({
        error: null,
        transfer: transferCreateResponse.data.transfer,
      })
    })
    .catch(next)
})

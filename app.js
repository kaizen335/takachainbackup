// Await window load event before starting the app
window.addEventListener('load', async () => {
    // Check for Web3 provider
    if (window.ethereum) {
        window.web3 = new Web3(window.ethereum);
        try {
            // Request account access if needed
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            initializeApp();
        } catch (error) {
            console.error("User denied account access or another error occurred.");
            showMessage("Please connect your wallet to use the DApp.", 'error');
        }
    } else if (window.web3) {
        window.web3 = new Web3(window.web3.currentProvider);
        initializeApp();
    } else {
        console.log('Non-Ethereum browser detected. You should consider trying MetaMask or Core.');
        showMessage("Please install a Web3 wallet like Core or MetaMask.", 'error');
    }
});

// Global variables for Web3 and contract interaction
let contract;
let currentAccount;
let isPicker = false;
let isRecycler = false;
let pickerName = '';
let recyclerName = '';
const CONTRACT_ADDRESS = '0x4e993240dd1004d6e5f991ee0017e1C284148FDF'; // Replace with your contract address
const CONTRACT_ABI = [
    // Correct ABI for the smart contract (copy-paste from your compiled artifacts)
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_depositId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_weight",
                "type": "uint256"
            }
        ],
        "name": "depositAndVerifyPlastic",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_depositId",
                "type": "uint256"
            }
        ],
        "name": "getDeposit",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "address",
                        "name": "pickerAddress",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "plasticWeight",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "timestamp",
                        "type": "uint256"
                    },
                    {
                        "internalType": "bool",
                        "name": "isVerified",
                        "type": "bool"
                    },
                    {
                        "internalType": "bool",
                        "name": "isPaid",
                        "type": "bool"
                    },
                    {
                        "internalType": "uint256",
                        "name": "paymentAmount",
                        "type": "uint256"
                    },
                    {
                        "internalType": "address",
                        "name": "recyclerVerifier",
                        "type": "address"
                    },
                    {
                        "internalType": "address",
                        "name": "recyclerPayer",
                        "type": "address"
                    }
                ],
                "internalType": "struct Takachain.PlasticDeposit",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "pickers",
        "outputs": [
            {
                "internalType": "bool",
                "name": "isRegistered",
                "type": "bool"
            },
            {
                "internalType": "string",
                "name": "name",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "totalDepositedWeight",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "totalEarnings",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "recyclers",
        "outputs": [
            {
                "internalType": "bool",
                "name": "isRegistered",
                "type": "bool"
            },
            {
                "internalType": "string",
                "name": "name",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "totalPaid",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "verifiedDepositCount",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getTotalDeposits",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_depositId",
                "type": "uint256"
            }
        ],
        "name": "makePayment",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "nextDepositId",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "plasticDeposits",
        "outputs": [
            {
                "internalType": "address",
                "name": "pickerAddress",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "plasticWeight",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
            },
            {
                "internalType": "bool",
                "name": "isVerified",
                "type": "bool"
            },
            {
                "internalType": "bool",
                "name": "isPaid",
                "type": "bool"
            },
            {
                "internalType": "uint256",
                "name": "paymentAmount",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "recyclerVerifier",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "recyclerPayer",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_name",
                "type": "string"
            }
        ],
        "name": "registerPicker",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_name",
                "type": "string"
            }
        ],
        "name": "registerRecycler",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "requestRecycler",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    // ABI for the RecyclerRequested event
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "pickerAddress",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "depositId",
                "type": "uint256"
            }
        ],
        "name": "RecyclerRequested",
        "type": "event"
    }
];


// --- UI Utility Functions ---

function showLoading() {
    document.getElementById('loading-indicator').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading-indicator').style.display = 'none';
}

function showMessage(message, type = 'info') {
    const messageBox = document.getElementById('message-box');
    const messageText = document.getElementById('message-text');
    messageText.textContent = message;
    messageBox.style.display = 'flex';
}

document.getElementById('message-close-btn').addEventListener('click', () => {
    document.getElementById('message-box').style.display = 'none';
});

// Function to show a specific page and hide others
function showPage(pageId) {
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.remove('active');
        page.classList.add('hidden');
    });
    document.getElementById(pageId).classList.remove('hidden');
    document.getElementById(pageId).classList.add('active');
    
    // Conditional visibility for "All Transactions" page link
    const transactionsNavLink = document.getElementById('transactions-nav-link');
    if (transactionsNavLink) {
        transactionsNavLink.style.display = (isRecycler) ? 'list-item' : 'none';
    }
}

// --- Main Application Logic ---

async function initializeApp() {
    showLoading();
    // Initialize contract
    contract = new window.web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);

    // Get current account
    const accounts = await window.web3.eth.getAccounts();
    if (accounts.length === 0) {
        showMessage("Please connect your wallet.", 'error');
        hideLoading();
        return;
    }
    currentAccount = accounts[0];

    // Check network and update status
    const networkId = await window.web3.eth.net.getId();
    if (networkId !== 43113) {
        showMessage("Please switch to the Avalanche Fuji C-Chain.", 'error');
        hideLoading();
        return;
    }

    showMessage("Connected to Avalanche Fuji C-Chain.", 'success');
    document.getElementById('account-display').textContent = `Account: ${currentAccount}`;
    document.getElementById('network-display').textContent = `Network ID: ${networkId}`;
    document.getElementById('connection-status').classList.remove('hidden');
    document.getElementById('connect-wallet-btn').textContent = 'Wallet Connected';
    document.getElementById('connect-wallet-btn').disabled = true;
    
    // Initial check and dashboard update
    await updatePickerDashboard();
    await updateRecyclerDashboard();
    await populateAllTransactionsTable();
    hideLoading();
}

// Event listener for wallet connection button
document.getElementById('connect-wallet-btn').addEventListener('click', async () => {
    showLoading();
    try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        initializeApp();
    } catch (error) {
        showMessage("Connection rejected or failed. Please try again.");
    } finally {
        hideLoading();
    }
});

// Event listener for navigation links
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = e.target.getAttribute('data-page');
        if (page === 'transactions' && !isRecycler) {
            showMessage("You must be a registered Recycler to view all transactions.");
        } else {
            showPage(page + '-page');
        }
    });
});

// --- Picker Functions ---

async function updatePickerDashboard() {
    if (!contract || !currentAccount) return;
    try {
        const picker = await contract.methods.pickers(currentAccount).call();
        isPicker = picker.isRegistered;
        pickerName = picker.name;
        document.getElementById('picker-status').textContent = isPicker ? `Status: Registered as Picker (${pickerName})` : 'Status: Not Registered';

        if (isPicker) {
            document.getElementById('picker-registration-section').classList.add('hidden');
            document.getElementById('request-recycler-section').classList.remove('hidden');
            document.getElementById('picker-info').classList.remove('hidden');
            document.getElementById('picker-name-display').textContent = pickerName;

            const totalDepositedWeight = window.web3.utils.fromWei(picker.totalDepositedWeight, 'gwei'); // Assuming 1 AVAX = 1e9 gwei, so 1 gwei = 1 gram for plastic
            const totalEarnings = window.web3.utils.fromWei(picker.totalEarnings, 'ether');
            document.getElementById('total-deposited-weight').textContent = `${totalDepositedWeight} grams`;
            document.getElementById('total-avax-earnings').textContent = `${totalEarnings} AVAX`;

            populatePickerDepositsTable();
        }
    } catch (error) {
        console.error("Error updating picker dashboard:", error);
    }
}

document.getElementById('register-picker-btn').addEventListener('click', async () => {
    if (!contract || !currentAccount) return showMessage("Please connect your wallet first.");
    const name = document.getElementById('picker-name-input').value;
    if (!name) return showMessage("Please enter your name to register.");

    showLoading();
    try {
        await contract.methods.registerPicker(name).send({ from: currentAccount });
        showMessage("Registration as Picker successful!");
        await updatePickerDashboard(); // Refresh dashboard
    } catch (error) {
        showMessage("Picker registration failed. Are you already registered?");
        console.error(error);
    } finally {
        hideLoading();
    }
});

document.getElementById('request-recycler-btn').addEventListener('click', async () => {
    if (!contract || !currentAccount || !isPicker) return showMessage("You must be a registered Picker to make a request.");

    showLoading();
    try {
        const result = await contract.methods.requestRecycler().send({ from: currentAccount });
        // The fix is here: safely check if the event exists before accessing its properties
        const event = result.events.RecyclerRequested;
        if (event) {
            const depositId = event.returnValues.depositId;
            document.getElementById('deposit-id-value').textContent = depositId;
            document.getElementById('request-id-display').classList.remove('hidden');
            showMessage(`Request submitted! Your Deposit ID is ${depositId}. Share this with a Recycler.`);
            await updatePickerDashboard(); // Refresh dashboard
        } else {
             showMessage("Request submitted successfully, but event data could not be retrieved.");
             console.error("No RecyclerRequested event found in the transaction receipt.");
        }
    } catch (error) {
        showMessage("Request submission failed.");
        console.error(error);
    } finally {
        hideLoading();
    }
});


async function populatePickerDepositsTable() {
    const tableBody = document.getElementById('picker-deposits-table-body');
    tableBody.innerHTML = '';
    const totalDeposits = await contract.methods.getTotalDeposits().call();

    for (let i = 0; i < totalDeposits; i++) {
        const deposit = await contract.methods.plasticDeposits(i).call();
        if (deposit.pickerAddress.toLowerCase() === currentAccount.toLowerCase()) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="py-3 px-6">${i}</td>
                <td class="py-3 px-6">${window.web3.utils.fromWei(deposit.plasticWeight, 'gwei')} g</td>
                <td class="py-3 px-6">${new Date(Number(deposit.timestamp) * 1000).toLocaleString()}</td>
                <td class="py-3 px-6">${deposit.isVerified ? '✅ Yes' : '❌ No'}</td>
            `;
            tableBody.appendChild(row);
        }
    }
}


// --- Recycler Functions ---

async function updateRecyclerDashboard() {
    if (!contract || !currentAccount) return;
    try {
        const recycler = await contract.methods.recyclers(currentAccount).call();
        isRecycler = recycler.isRegistered;
        recyclerName = recycler.name;
        document.getElementById('recycler-status').textContent = isRecycler ? `Status: Registered as Recycler (${recyclerName})` : 'Status: Not Registered';

        if (isRecycler) {
            document.getElementById('recycler-registration-section').classList.add('hidden');
            document.getElementById('recycler-info').classList.remove('hidden');
            document.getElementById('recycler-name-display').textContent = recyclerName;
            
            const totalPaidAVAX = window.web3.utils.fromWei(recycler.totalPaid, 'ether');
            document.getElementById('total-recycler-paid-avax').textContent = `${totalPaidAVAX} AVAX`;
            document.getElementById('total-verified-deposits').textContent = recycler.verifiedDepositCount;

            populatePendingRequestsTable();
        }

        // Update nav link visibility
        const transactionsNavLink = document.getElementById('transactions-nav-link');
        transactionsNavLink.style.display = (isRecycler) ? 'list-item' : 'none';
        
    } catch (error) {
        console.error("Error updating recycler dashboard:", error);
    }
}

document.getElementById('register-recycler-btn').addEventListener('click', async () => {
    if (!contract || !currentAccount) return showMessage("Please connect your wallet first.");
    const name = document.getElementById('recycler-name-input').value;
    if (!name) return showMessage("Please enter your name to register.");
    
    showLoading();
    try {
        await contract.methods.registerRecycler(name).send({ from: currentAccount });
        showMessage("Registration as Recycler successful!");
        await updateRecyclerDashboard(); // Refresh dashboard
    } catch (error) {
        showMessage("Recycler registration failed. Are you already registered?");
        console.error(error);
    } finally {
        hideLoading();
    }
});

document.getElementById('deposit-verify-btn').addEventListener('click', async () => {
    if (!contract || !currentAccount || !isRecycler) return showMessage("You must be a registered Recycler to verify deposits.");
    const depositId = document.getElementById('deposit-verify-id').value;
    const weight = document.getElementById('deposit-verify-weight').value;

    if (!depositId || !weight) return showMessage("Please enter a Deposit ID and weight.");
    if (weight <= 0) return showMessage("Weight must be greater than zero.");
    
    const weightWei = window.web3.utils.toWei(weight, 'gwei');

    showLoading();
    try {
        await contract.methods.depositAndVerifyPlastic(depositId, weightWei).send({ from: currentAccount });
        showMessage("Deposit and verification successful!");
        await updateRecyclerDashboard();
    } catch (error) {
        showMessage("Deposit and verification failed. Check the ID and make sure it's not already verified.");
        console.error(error);
    } finally {
        hideLoading();
    }
});

document.getElementById('make-payment-btn').addEventListener('click', async () => {
    if (!contract || !currentAccount || !isRecycler) return showMessage("You must be a registered Recycler to make payments.");
    const depositId = document.getElementById('payment-deposit-id').value;
    const amount = document.getElementById('payment-amount').value;
    
    if (!depositId || !amount) return showMessage("Please enter a Deposit ID and amount.");
    if (amount <= 0) return showMessage("Payment amount must be greater than zero.");

    const amountWei = window.web3.utils.toWei(amount, 'ether');

    showLoading();
    try {
        await contract.methods.makePayment(depositId).send({ from: currentAccount, value: amountWei });
        showMessage("Payment successful!");
        await updateRecyclerDashboard();
        await updatePickerDashboard(); // Also update picker dashboard to reflect payment
    } catch (error) {
        showMessage("Payment failed. Check if the deposit is verified and unpaid.");
        console.error(error);
    } finally {
        hideLoading();
    }
});


async function populatePendingRequestsTable() {
    const tableBody = document.getElementById('pending-requests-table-body');
    tableBody.innerHTML = '';
    const totalDeposits = await contract.methods.getTotalDeposits().call();

    for (let i = 0; i < totalDeposits; i++) {
        const deposit = await contract.methods.plasticDeposits(i).call();
        // Check if the deposit is not verified or not paid
        if (!deposit.isVerified || !deposit.isPaid) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="py-3 px-6">${i}</td>
                <td class="py-3 px-6">${deposit.pickerAddress.slice(0, 6)}...${deposit.pickerAddress.slice(-4)}</td>
                <td class="py-3 px-6">${deposit.plasticWeight > 0 ? window.web3.utils.fromWei(deposit.plasticWeight, 'gwei') + ' g' : 'N/A'}</td>
                <td class="py-3 px-6">${new Date(Number(deposit.timestamp) * 1000).toLocaleString()}</td>
                <td class="py-3 px-6">${deposit.isVerified ? '✅' : '❌'}</td>
                <td class="py-3 px-6">${deposit.isPaid ? '✅' : '❌'}</td>
            `;
            tableBody.appendChild(row);
        }
    }
}

// --- All Transactions Functions ---

async function populateAllTransactionsTable() {
    const tableBody = document.getElementById('all-transactions-table-body');
    tableBody.innerHTML = '';
    const totalDeposits = await contract.methods.getTotalDeposits().call();

    for (let i = 0; i < totalDeposits; i++) {
        const deposit = await contract.methods.plasticDeposits(i).call();
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="py-3 px-6">${i}</td>
            <td class="py-3 px-6">${deposit.pickerAddress.slice(0, 6)}...${deposit.pickerAddress.slice(-4)}</td>
            <td class="py-3 px-6">${deposit.plasticWeight > 0 ? window.web3.utils.fromWei(deposit.plasticWeight, 'gwei') + ' g' : 'N/A'}</td>
            <td class="py-3 px-6">${new Date(Number(deposit.timestamp) * 1000).toLocaleString()}</td>
            <td class="py-3 px-6">${deposit.isVerified ? '✅' : '❌'}</td>
            <td class="py-3 px-6">${deposit.recyclerVerifier.slice(0, 6)}...${deposit.recyclerVerifier.slice(-4)}</td>
            <td class="py-3 px-6">${deposit.isPaid ? '✅' : '❌'}</td>
            <td class="py-3 px-6">${deposit.recyclerPayer.slice(0, 6)}...${deposit.recyclerPayer.slice(-4)}</td>
            <td class="py-3 px-6">${deposit.paymentAmount > 0 ? window.web3.utils.fromWei(deposit.paymentAmount, 'ether') + ' AVAX' : 'N/A'}</td>
        `;
        tableBody.appendChild(row);
    }
}

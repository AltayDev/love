const {
  ClientFactory,
  WalletClient,
  DefaultProviderUrls,
  CHAIN_ID,
} = require("@massalabs/massa-web3");

const secretKey = "YOUR SECRET KEY ( CONTRACT OWNER )";
const mainnetRPC = "https://mainnet.massa.net/api/v2";

async function initializeClient() {
  const deployedAccount = await WalletClient.getAccountFromSecretKey(secretKey);

  const client = await ClientFactory.createDefaultClient(
    mainnetRPC,
    CHAIN_ID.MainNet,
    false,
    deployedAccount
  );

  return client;
}

async function mint(wallet) {
  const client = await initializeClient()
  const tx = await client.smartContracts().callSmartContract({
    fee: fromMAS(0.01),
    maxGas: MAX_GAS_CALL,
    coins: fromMAS(0),
    targetAddress: 'SMART_CONTRACT_ADDRESS',
    functionName: 'mint',
    parameter: new Args().addString(wallet),
  });
  console.log(tx);
}

const walletAddress = process.argv[2];
mint(walletAddress);

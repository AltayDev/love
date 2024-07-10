const {  
  ClientFactory,  
  WalletClient,  
  DefaultProviderUrls,  
  CHAIN_ID,  
  Args,  
  fromMAS,  
  MAX_GAS_CALL  
} = require("@massalabs/massa-web3");  
  
const secretKey = "S1zN1YEnNeEws7nfULuCmZsi";  
const buildnetRpc = "https://buildnet.massa.net/api/v2";  
  
async function initializeClient() {  
  const deployedAccount = await WalletClient.getAccountFromSecretKey(secretKey);  
  
  const client = await ClientFactory.createDefaultClient(  
    buildnetRpc,  
    CHAIN_ID.BuildNet,  
    false,  
    deployedAccount  
  );  
  
  return client;  
}  
  
async function mint(wallet) {  
  try {
    if (!wallet) {
      throw new Error("Wallet address is undefined or null");
    }

    const client = await initializeClient();
    const tx = await client.smartContracts().callSmartContract({  
      fee: fromMAS(0.01),  
      maxGas: MAX_GAS_CALL,  
      coins: fromMAS(0),  
      targetAddress: 'AS1JV2i9pHHZGwoUWE8JvMGB7F2K3nL1iKFgjRTLAtwTdDsLXM7u',  
      functionName: 'mint',  
      parameter: new Args().addString(wallet),  
    });  
    console.log(tx);
  } catch (error) {
    console.error("Error in mint function:", error);
  }
}  
  
const walletAddress = process.argv[2];  
console.log("Wallet address received:", walletAddress);  // Debugging line
mint(walletAddress);

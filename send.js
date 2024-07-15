const { Args, MAX_GAS_CALL, fromMAS } = require("@massalabs/massa-web3");


//amount = PUR Amount
//to = address
const handleTransferPUR = async (amount, to) => {
    if (!amount) {
      return;
    }
    try {
      const parsedAmount = BigInt(amount) * 10n ** BigInt(18);

      const args = new Args()
        .addString(to) // Address to send
        .addU256(parsedAmount);

      const tx = await client.smartContracts().callSmartContract({
        fee: fromMAS(0.01),
        maxGas: MAX_GAS_CALL,
        coins: fromMAS(0),
        targetAddress: sc,
        functionName: "transfer",
        parameter: args,
      });

      console.log(tx)
    } catch (e) {
      console.error(e);
    }
  };

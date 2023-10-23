// fetching tokens sent to the address
app.get("/fetchGarage", async (req, res) => {
  try {
    const client = await initializeClient();
    const totalSupply = await client
      .publicApi()
      .getDatastoreEntries([
        {
          key: "Counter",
          address: erc721_address,
        },
      ])
      .then((data) => {
        const byteArr = data[0].candidate_value;
        const utf8Array = new Uint8Array(byteArr);

        return parseInt(bytesToU64(utf8Array));
      });
    const batchSize = 1000;
    const fetchPromises = [];
    for (let i = 0; i < totalSupply; i += batchSize) {
      const batchKeys = [];
      for (let j = i; j < i + batchSize && j < totalSupply; j++) {
        batchKeys.push({ address: collection_address, key: "ownerOf_" + j });
      }
      fetchPromises.push(client.publicApi().getDatastoreEntries(batchKeys));
    }
    const startTime = new Date().getTime();
    Promise.all(fetchPromises)
      .then((results) => {
        const allData = results.flat();
        const targetAddress = req.query.address;
        const targetData = [];

        allData.forEach((item, index) => {
          const byteArr = item.candidate_value;
          const utf8Array = new Uint8Array(byteArr);
          const desData = bytesToStr(utf8Array);

          if (desData === targetAddress) {
            targetData.push({ index, address: targetAddress });
          }
        });

        const endTime = new Date().getTime();
        const durationInSeconds = (endTime - startTime) / 1000;
        console.log(`The process took ${durationInSeconds} seconds.`);
        res.status(200).json(targetData);
      })
      .catch((error) => {
        console.error("Fetch error:", error);
      });
  } catch (error) {
    // Return 500 (Internal Server Error) in case of error
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

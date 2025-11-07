module.exports = async function (callback) {
  try {
    const Ensemble = artifacts.require("EnsembleLearning");
    const instance = await Ensemble.deployed();
    const accounts = await web3.eth.getAccounts();
    const round = (await instance.currentRoundId()).toNumber();

    const cids = [
      "bafyTrainer0",
      "bafyTrainer1",
      "bafyTrainer2",
      "bafyTrainer3",
      "bafyTrainer4"
    ];

    for (let i = 0; i < 5; i++) {
      await instance.submitModel(round, cids[i], { from: accounts[i] });
      console.log(`Trainer ${i} submitted model CID: ${cids[i]}`);
    }

    console.log("✅ All models submitted");
    callback();
  } catch (err) {
    console.error(err);
    callback(err);
  }
};

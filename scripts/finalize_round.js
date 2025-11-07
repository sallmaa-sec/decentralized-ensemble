module.exports = async function (callback) {
  try {
    const Ensemble = artifacts.require("EnsembleLearning");
    const instance = await Ensemble.deployed();
    const accounts = await web3.eth.getAccounts();
    const round = (await instance.currentRoundId()).toNumber();

    await instance.finalizeRound(round, { from: accounts[1] });
    const bad = await instance.maliciousTrainer(round);

    console.log(`✅ Round ${round} finalized`);
    console.log(`🚨 Malicious trainer: ${bad}`);
    callback();
  } catch (err) {
    console.error(err);
    callback(err);
  }
};

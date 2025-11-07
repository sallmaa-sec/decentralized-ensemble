module.exports = async function (callback) {
  try {
    const Ensemble = artifacts.require("EnsembleLearning");
    const instance = await Ensemble.deployed();
    const accounts = await web3.eth.getAccounts();

    const trainers = accounts.slice(0, 5);
    const validators = accounts.slice(5, 10);

    // Fund the contract with ETH for payouts
    await web3.eth.sendTransaction({
      from: accounts[0],
      to: instance.address,
      value: web3.utils.toWei("5", "ether")
    });

    // Start round from rewarder
    await instance.startRound(trainers, validators, { from: accounts[1] });

    const round = await instance.currentRoundId();
    console.log(`✅ Round ${round.toString()} started`);
    callback();
  } catch (err) {
    console.error(err);
    callback(err);
  }
};

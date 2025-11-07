module.exports = async function (callback) {
  try {
    const Ensemble = artifacts.require("EnsembleLearning");
    const instance = await Ensemble.deployed();
    const accounts = await web3.eth.getAccounts();

    // Trainers = 0..4
    for (let i = 0; i < 5; i++) {
      await instance.setTrainer(accounts[i], true);
      console.log(`Trainer ${i} registered: ${accounts[i]}`);
    }

    // Validators = 5..9
    for (let i = 5; i < 10; i++) {
      await instance.setValidator(accounts[i], true);
      console.log(`Validator ${i} registered: ${accounts[i]}`);
    }

    console.log("✅ Roles registered successfully");
    callback();
  } catch (err) {
    console.error(err);
    callback(err);
  }
};

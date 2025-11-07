// scripts/submit_accuracy.js
const EnsembleLearning = artifacts.require("EnsembleLearning");

module.exports = async function (callback) {
  try {
    const accounts = await web3.eth.getAccounts();
    const instance = await EnsembleLearning.deployed();
    const round = await instance.currentRoundId();

    console.log(`📊 Submitting validator accuracy reports for round ${round.toString()}...`);

    // Trainers (accounts[2] to accounts[6]) and one validator (accounts[7])
    const trainerAddresses = [accounts[2], accounts[3], accounts[4], accounts[5], accounts[6]];
    const validator = accounts[7];

    // Simulated accuracies (floats)
    const accuracies = [0.95, 0.89, 0.92, 0.87, 0.98];

    // Convert to integer (×1000 for precision)
    const scaledAccuracies = accuracies.map(a => Math.round(a * 1000));

    // Loop through trainers and submit each accuracy
    for (let i = 0; i < trainerAddresses.length; i++) {
      await instance.submitAccuracy(round, trainerAddresses[i], scaledAccuracies[i], { from: validator });
      console.log(
        `✅ Validator ${validator} submitted accuracy ${scaledAccuracies[i]} (scaled from ${accuracies[i]}) for trainer ${trainerAddresses[i]}`
      );
    }

    console.log("🎯 All accuracies successfully submitted!");
  } catch (error) {
    console.error("❌ Error submitting accuracies:", error);
  }
  callback();
};

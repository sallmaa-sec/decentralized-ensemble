// scripts/submit_model.js
const EnsembleLearning = artifacts.require("EnsembleLearning");

module.exports = async function (callback) {
  try {
    const cid = process.argv[4]; // argument from Python
    const accounts = await web3.eth.getAccounts();
    const instance = await EnsembleLearning.deployed();
    const round = await instance.currentRoundId();

    await instance.submitModel(round, cid, { from: accounts[2] }); // trainer account
    console.log(`✅ Model submitted by Trainer with CID: ${cid}`);
  } catch (error) {
    console.error("❌ Error submitting model:", error);
  }
  callback();
};

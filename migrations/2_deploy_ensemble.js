const EnsembleLearning = artifacts.require("EnsembleLearning");

module.exports = async function (deployer, network, accounts) {
  // use accounts[1] as rewarder (for now)
  await deployer.deploy(EnsembleLearning, accounts[1]);
};

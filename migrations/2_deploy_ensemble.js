const EnsembleToken = artifacts.require("EnsembleToken");
const EnsembleLearning = artifacts.require("EnsembleLearning");

module.exports = async function (deployer, network, accounts) {
  // 1. Deploy the token with 1 000 000 ERT to rewarder
  await deployer.deploy(EnsembleToken, 1_000_000);
  const token = await EnsembleToken.deployed();

  // 2. Deploy the learning contract
  await deployer.deploy(EnsembleLearning, accounts[1], token.address);
  const ensemble = await EnsembleLearning.deployed();

  // 3. Transfer 500 000 ERT from rewarder (accounts[1]) to the contract
  await token.transfer(ensemble.address, web3.utils.toWei("500000", "ether"), { from: accounts[1] });

  console.log("✅ EnsembleToken deployed at:", token.address);
  console.log("✅ EnsembleLearning deployed at:", ensemble.address);
};

module.exports = async function (callback) {
  try {
    const Ensemble = artifacts.require("EnsembleLearning");
    const instance = await Ensemble.deployed();
    const accounts = await web3.eth.getAccounts();
    const round = (await instance.currentRoundId()).toNumber();

    const trainers = accounts.slice(0, 5);
    const validators = accounts.slice(5, 10);

    // Validators’ accuracy reports (permille = accuracy×10)
    const template = [
      [920, 915, 905, 540, 900],
      [910, 905, 895, 560, 910],
      [930, 920, 910, 580, 905],
      [900, 895, 885, 520, 920],
      [940, 930, 920, 590, 915],
    ];

    for (let v = 0; v < validators.length; v++) {
      for (let t = 0; t < trainers.length; t++) {
        await instance.submitAccuracy(round, trainers[t], template[v][t], {
          from: validators[v],
        });
      }
      console.log(`Validator ${v} submitted accuracies`);
    }

    console.log("✅ All accuracies submitted");
    callback();
  } catch (err) {
    console.error(err);
    callback(err);
  }
};

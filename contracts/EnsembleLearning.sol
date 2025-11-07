// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./EnsembleToken.sol";

/**
 * @title EnsembleLearning
 * @dev Decentralized ensemble-learning coordination contract using ERC-20 token rewards
 */
contract EnsembleLearning {
    // ---------------------------------------------------------------------
    // Roles & state
    // ---------------------------------------------------------------------
    address public owner;
    address public rewarder;

    mapping(address => bool) public isTrainer;
    mapping(address => bool) public isValidator;

    uint256 public currentRoundId;
    mapping(uint256 => bool) public roundActive;

    mapping(uint256 => address[]) public roundTrainers;
    mapping(uint256 => address[]) public roundValidators;

    mapping(uint256 => mapping(address => string)) public modelCid;
    mapping(uint256 => mapping(address => bool)) public modelSubmitted;

    mapping(uint256 => mapping(address => mapping(address => uint256))) public accuracy; // round→validator→trainer→permille
    mapping(uint256 => mapping(address => mapping(address => bool))) public validated;

    mapping(uint256 => mapping(address => uint256)) public countsByTrainer;
    mapping(uint256 => mapping(address => uint256)) public sumAccByTrainer;

    mapping(uint256 => address) public maliciousTrainer;
    mapping(uint256 => bool) public roundFinalized;

    // ---------------------------------------------------------------------
    // Token economy
    // ---------------------------------------------------------------------
    EnsembleToken public token;
    uint256 public trainerReward = 5 * 10 ** 18;    // 5 ERT per trainer
    uint256 public validatorReward = 2 * 10 ** 18;  // 2 ERT per validator

    // ---------------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------------
    event RoleUpdated(address indexed who, string role, bool enabled);
    event RewarderUpdated(address indexed rewarder);
    event RoundStarted(uint256 indexed roundId);
    event ModelSubmitted(uint256 indexed roundId, address indexed trainer, string cid);
    event AccuracySubmitted(uint256 indexed roundId, address indexed validator, address indexed trainer, uint256 permille);
    event RoundFinalized(uint256 indexed roundId, address malicious, uint256 maliciousAvgPermille);

    // ---------------------------------------------------------------------
    // Modifiers
    // ---------------------------------------------------------------------
    modifier onlyOwner() { require(msg.sender == owner, "not owner"); _; }
    modifier onlyRewarder() { require(msg.sender == rewarder, "not rewarder"); _; }
    modifier roundIsActive(uint256 id) { require(roundActive[id], "round not active"); _; }

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------
    constructor(address _rewarder, address tokenAddress) {
        owner = msg.sender;
        rewarder = _rewarder;
        token = EnsembleToken(tokenAddress);
    }

    // ---------------------------------------------------------------------
    // Role management
    // ---------------------------------------------------------------------
    function setRewarder(address _rewarder) external onlyOwner {
        rewarder = _rewarder;
        emit RewarderUpdated(_rewarder);
    }

    function setTrainer(address who, bool enabled) external onlyOwner {
        isTrainer[who] = enabled;
        emit RoleUpdated(who, "trainer", enabled);
    }

    function setValidator(address who, bool enabled) external onlyOwner {
        isValidator[who] = enabled;
        emit RoleUpdated(who, "validator", enabled);
    }

    function setRewards(uint256 _trainer, uint256 _validator) external onlyOwner {
        trainerReward = _trainer;
        validatorReward = _validator;
    }

    // ---------------------------------------------------------------------
    // Round lifecycle
    // ---------------------------------------------------------------------
    function startRound(address[] calldata trainers, address[] calldata validators)
        external
        onlyRewarder
    {
        require(!roundActive[currentRoundId + 1], "next round already active");
        currentRoundId += 1;
        roundActive[currentRoundId] = true;

        for (uint i = 0; i < trainers.length; i++) {
            require(isTrainer[trainers[i]], "unknown trainer");
            roundTrainers[currentRoundId].push(trainers[i]);
        }
        for (uint j = 0; j < validators.length; j++) {
            require(isValidator[validators[j]], "unknown validator");
            roundValidators[currentRoundId].push(validators[j]);
        }

        emit RoundStarted(currentRoundId);
    }

    function submitModel(uint256 id, string calldata cid)
        external
        roundIsActive(id)
    {
        require(isTrainer[msg.sender], "not trainer");
        require(!modelSubmitted[id][msg.sender], "already submitted");
        modelSubmitted[id][msg.sender] = true;
        modelCid[id][msg.sender] = cid;
        emit ModelSubmitted(id, msg.sender, cid);
    }

    function submitAccuracy(uint256 id, address trainer, uint256 permille)
        external
        roundIsActive(id)
    {
        require(isValidator[msg.sender], "not validator");
        require(modelSubmitted[id][trainer], "no model");
        require(!validated[id][msg.sender][trainer], "already validated");
        require(permille <= 1000, "permille>1000");

        validated[id][msg.sender][trainer] = true;
        accuracy[id][msg.sender][trainer] = permille;
        countsByTrainer[id][trainer] += 1;
        sumAccByTrainer[id][trainer] += permille;

        emit AccuracySubmitted(id, msg.sender, trainer, permille);
    }

    // ---------------------------------------------------------------------
    // Compute averages & finalize
    // ---------------------------------------------------------------------
    function averageAccuracy(uint256 id, address trainer)
        public
        view
        returns (bool hasData, uint256 avg)
    {
        uint256 c = countsByTrainer[id][trainer];
        if (c == 0) return (false, 0);
        return (true, sumAccByTrainer[id][trainer] / c);
    }

    function finalizeRound(uint256 id)
        external
        onlyRewarder
        roundIsActive(id)
    {
        require(!roundFinalized[id], "already finalized");
        address[] memory trainers = roundTrainers[id];
        require(trainers.length > 0, "no trainers");

        address worst = trainers[0];
        uint256 worstAvg = type(uint256).max;

        for (uint i = 0; i < trainers.length; i++) {
            (bool hasData, uint256 avg) = averageAccuracy(id, trainers[i]);
            require(hasData, "missing accuracy");
            if (avg < worstAvg) {
                worstAvg = avg;
                worst = trainers[i];
            }
        }

        maliciousTrainer[id] = worst;
        roundFinalized[id] = true;
        roundActive[id] = false;

        // Pay rewards in tokens
        for (uint i = 0; i < trainers.length; i++) {
            if (trainers[i] != worst) {
                require(token.transfer(trainers[i], trainerReward), "trainer reward failed");
            }
        }
        address[] memory validators = roundValidators[id];
        for (uint j = 0; j < validators.length; j++) {
            require(token.transfer(validators[j], validatorReward), "validator reward failed");
        }

        emit RoundFinalized(id, worst, worstAvg);
    }
}

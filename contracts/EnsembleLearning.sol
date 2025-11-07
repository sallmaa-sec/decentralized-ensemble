// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract EnsembleLearning {
    address public owner;
    address public rewarder;

    constructor(address _rewarder) {
        owner = msg.sender;
        rewarder = _rewarder;
    }

    receive() external payable {}
}

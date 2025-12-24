// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script} from "forge-std/Script.sol";

import {VeTerex} from "../src/trex.sol";

contract DeployVeryMediaCompletion is Script {
    function run() external returns (VeTerex deployed) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        address initialOwner = vm.envOr("INITIAL_OWNER", deployer);
        string memory defaultName = "VeTerex";
        string memory defaultSymbol = "VTRX";
        string memory defaultBaseURI = "";

        string memory name_ = vm.envOr("TOKEN_NAME", defaultName);
        string memory symbol_ = vm.envOr("TOKEN_SYMBOL", defaultSymbol);
        string memory baseURI_ = vm.envOr("BASE_URI", defaultBaseURI);

        vm.startBroadcast(deployerPrivateKey);
        deployed = new VeTerex(name_, symbol_, initialOwner, baseURI_);
        vm.stopBroadcast();
    }
}

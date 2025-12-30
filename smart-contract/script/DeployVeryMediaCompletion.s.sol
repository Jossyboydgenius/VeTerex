// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script} from "forge-std/Script.sol";

import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import {VeTerex} from "../src/trex.sol";

contract DeployVeryMediaCompletion is Script {
    function run() external returns (VeTerex deployed) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        address initialOwner = vm.envOr("INITIAL_OWNER", deployer);
        string memory defaultName = "VeTerex";
        string memory defaultSymbol = "VTRX";
        string memory defaultBaseURI = "";
        address defaultBackend = address(0);

        string memory name_ = vm.envOr("TOKEN_NAME", defaultName);
        string memory symbol_ = vm.envOr("TOKEN_SYMBOL", defaultSymbol);
        string memory baseURI_ = vm.envOr("BASE_URI", defaultBaseURI);
        address backend_ = vm.envOr("BACKEND", defaultBackend);

        vm.startBroadcast(deployerPrivateKey);
        address implementationAddress = vm.envOr("IMPLEMENTATION_ADDRESS", address(0));
        if (implementationAddress == address(0)) {
            VeTerex implementation = new VeTerex();
            implementationAddress = address(implementation);
        }

        bytes memory initData = abi.encodeCall(VeTerex.initialize, (name_, symbol_, initialOwner, baseURI_, backend_));
        ERC1967Proxy proxy = new ERC1967Proxy(implementationAddress, initData);
        deployed = VeTerex(address(proxy));
        vm.stopBroadcast();
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./IDverse.interfaces.sol";

// Simple DID registry for managing decentralized identifiers
// We keep personal info off-chain and only store references here
contract DIDRegistry is IDIDRegistry {
    // Maps each DID to its controller (the address that owns it)
    mapping(bytes32 => address) public controller;
    // Points to where the full DID document lives (usually IPFS)
    mapping(bytes32 => string) public docPointer;
    // Quick lookup to see if an address is a controller for any DID
    mapping(address => bool) public override isController;

    event DIDRegistered(bytes32 indexed did, address indexed controller, string docPointer);
    event ControllerChanged(bytes32 indexed did, address indexed previous, address indexed current);
    event DIDDocUpdated(bytes32 indexed did, string newDocPointer);

    // Register a new DID - anyone can create one for themselves or others
    function registerDID(bytes32 did, address controllerAddr, string calldata pointer) external {
        require(controller[did] == address(0), "DID already registered");
        require(controllerAddr != address(0), "Controller cannot be zero address");

        controller[did] = controllerAddr;
        docPointer[did] = pointer;
        isController[controllerAddr] = true;

        emit DIDRegistered(did, controllerAddr, pointer);
    }

    // Transfer control of a DID to a new address
    function updateController(bytes32 did, address newController) external {
        address previous = controller[did];
        require(previous == msg.sender, "only controller");
        require(newController != address(0), "Controller cannot be zero address");

        controller[did] = newController;
        isController[previous] = false;
        isController[newController] = true;

        emit ControllerChanged(did, previous, newController);
    }

    // Update where the DID document is stored
    function updateDocPointer(bytes32 did, string calldata pointer) external {
        require(controller[did] == msg.sender, "only controller");
        docPointer[did] = pointer;
        emit DIDDocUpdated(did, pointer);
    }

    // Look up who controls a specific DID
    function getController(bytes32 did) external view returns (address) {
        return controller[did];
    }

    // Get the document pointer for a DID
    function getDocPointer(bytes32 did) external view returns (string memory) {
        return docPointer[did];
    }
}

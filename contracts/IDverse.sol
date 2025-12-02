// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Simple DID registry for managing decentralized identifiers
// We keep personal info off-chain and only store references here
contract DIDRegistry {
    // Maps each DID to its controller (the address that owns it)
    mapping(bytes32 => address) public controller;
    // Points to where the full DID document lives (usually IPFS)
    mapping(bytes32 => string) public docPointer;

    event DIDRegistered(bytes32 indexed did, address indexed controller, string docPointer);
    event ControllerChanged(bytes32 indexed did, address indexed previous, address indexed current);
    event DIDDocUpdated(bytes32 indexed did, string newDocPointer);

    // Register a new DID - anyone can create one for themselves or others
    function registerDID(bytes32 did, address controllerAddr, string calldata pointer) external {
        require(controller[did] == address(0), "DID already registered");
        controller[did] = controllerAddr;
        docPointer[did] = pointer;
        emit DIDRegistered(did, controllerAddr, pointer);
    }

    // Transfer control of a DID to a new address
    function updateController(bytes32 did, address newController) external {
        require(controller[did] == msg.sender, "only controller");
        address previous = controller[did];
        controller[did] = newController;
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

// Manages the lifecycle of verifiable credentials
contract CredentialRegistry {
    // Everything we need to track about a credential
    struct Credential {
        address issuer;
        address holder;
        bytes32 credentialHash; // proves the data hasn't been tampered with
        string cid; // where to find the full credential data
        uint256 issuedAt;
        bool revoked;
    }

    mapping(bytes32 => Credential) public credentials;

    event CredentialIssued(bytes32 indexed credentialId, address indexed issuer, address indexed holder, bytes32 credentialHash, string cid);
    event CredentialRevoked(bytes32 indexed credentialId, address indexed issuer);
    event CredentialStatusUpdated(bytes32 indexed credentialId, bytes32 statusPointer);

    /// @notice Issuers call this to register an issued credential anchor
    function issueCredential(bytes32 credentialId, address holder, bytes32 credentialHash, string calldata cid) external {
        Credential storage c = credentials[credentialId];
        require(c.issuer == address(0), "credential exists");
        c.issuer = msg.sender;
        c.holder = holder;
        c.credentialHash = credentialHash;
        c.cid = cid;
        c.issuedAt = block.timestamp;
        c.revoked = false;
        emit CredentialIssued(credentialId, msg.sender, holder, credentialHash, cid);
    }

    // Revoke a credential - only the original issuer can do this
    function revokeCredential(bytes32 credentialId) external {
        Credential storage c = credentials[credentialId];
        require(c.issuer == msg.sender, "only issuer");
        require(!c.revoked, "already revoked");
        c.revoked = true;
        emit CredentialRevoked(credentialId, msg.sender);
    }

    // Get all the details about a credential
    function getCredential(bytes32 credentialId) external view returns (address issuer, address holder, bytes32 credentialHash, string memory cid, uint256 issuedAt, bool revoked) {
        Credential storage c = credentials[credentialId];
        return (c.issuer, c.holder, c.credentialHash, c.cid, c.issuedAt, c.revoked);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
/// @title IDverse  DID registry + Credential Status registry (draft)
/// @notice Minimal, educational implementation for course project.
/// @dev Keep PII off-chain. Store only IPFS CIDs or compact hashes on-chain.
contract DIDRegistry {
    // DID => controller address (owner)
    mapping(bytes32 => address) public controller;
    // DID => ipfs CID or metadata pointer (stored as string)
    mapping(bytes32 => string) public docPointer;
    // events
    event DIDRegistered(bytes32 indexed did, address indexed controller, string docPointer);
    event ControllerChanged(bytes32 indexed did, address indexed previous, address indexed current);
    event DIDDocUpdated(bytes32 indexed did, string newDocPointer);

    /// @notice Register a DID with controller and pointer
    /// @param did bytes32 compact identifier (e.g., keccak256 of did string)
    /// @param controllerAddr owner/controller of the DID
    /// @param pointer string pointer to DID doc (IPFS CID or URL)
    function registerDID(bytes32 did, address controllerAddr, string calldata pointer) external {
        require(controller[did] == address(0), "DID already registered");
        controller[did] = controllerAddr;
        docPointer[did] = pointer;
        emit DIDRegistered(did, controllerAddr, pointer);
    }

    /// @notice Update controller (only current controller)
    function updateController(bytes32 did, address newController) external {
        require(controller[did] == msg.sender, "only controller");
        address previous = controller[did];
        controller[did] = newController;
        emit ControllerChanged(did, previous, newController);
    }

    /// @notice Update DID document pointer (only controller)
    function updateDocPointer(bytes32 did, string calldata pointer) external {
        require(controller[did] == msg.sender, "only controller");
        docPointer[did] = pointer;
        emit DIDDocUpdated(did, pointer);
    }

    /// @notice Query controller address
    function getController(bytes32 did) external view returns (address) {
        return controller[did];
    }

    /// @notice Query doc pointer
    function getDocPointer(bytes32 did) external view returns (string memory) {
        return docPointer[did];
    }
}

contract CredentialRegistry {
    /// Credential record
    struct Credential {
        address issuer;
        bytes32 credentialHash; // hash of credential JSON
        string cid; // IPFS CID or pointer to credential
        uint256 issuedAt;
        bool revoked;
    }

    // credentialId => Credential
    mapping(bytes32 => Credential) public credentials;

    // issuer => list of issued credential ids could be added off-chain for indexing
    event CredentialIssued(bytes32 indexed credentialId, address indexed issuer, bytes32 credentialHash, string cid);
    event CredentialRevoked(bytes32 indexed credentialId, address indexed issuer);
    event CredentialStatusUpdated(bytes32 indexed credentialId, bytes32 statusPointer); // for future use with merkle roots etc.

    /// @notice Issuers call this to register an issued credential anchor
    function issueCredential(bytes32 credentialId, bytes32 credentialHash, string calldata cid) external {
        Credential storage c = credentials[credentialId];
        require(c.issuer == address(0), "credential exists");
        c.issuer = msg.sender;
        c.credentialHash = credentialHash;
        c.cid = cid;
        c.issuedAt = block.timestamp;
        c.revoked = false;
        emit CredentialIssued(credentialId, msg.sender, credentialHash, cid);
    }

    /// @notice Revoke credential (only issuer)
    function revokeCredential(bytes32 credentialId) external {
        Credential storage c = credentials[credentialId];
        require(c.issuer == msg.sender, "only issuer");
        require(!c.revoked, "already revoked");
        c.revoked = true;
        emit CredentialRevoked(credentialId, msg.sender);
    }

    /// @notice Get credential data
    function getCredential(bytes32 credentialId) external view returns (address issuer, bytes32 credentialHash, string memory cid, uint256 issuedAt, bool revoked) {
        Credential storage c = credentials[credentialId];
        return (c.issuer, c.credentialHash, c.cid, c.issuedAt, c.revoked);
    }
}

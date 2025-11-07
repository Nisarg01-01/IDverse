// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IDIDRegistry {
    function registerDID(bytes32 did, address controllerAddr, string calldata pointer) external;
    function updateController(bytes32 did, address newController) external;
    function updateDocPointer(bytes32 did, string calldata pointer) external;
    function getController(bytes32 did) external view returns (address);
    function getDocPointer(bytes32 did) external view returns (string memory);
}

interface ICredentialRegistry {
    function issueCredential(bytes32 credentialId, bytes32 credentialHash, string calldata cid) external;
    function revokeCredential(bytes32 credentialId) external;
    function getCredential(bytes32 credentialId) external view returns (address issuer, bytes32 credentialHash, string memory cid, uint256 issuedAt, bool revoked);
}

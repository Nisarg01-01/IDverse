// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Keeps track of who's checking credentials and when
// Think of it like an audit log that nobody can erase
contract EventLogger {
    address public owner;

    // Only certain addresses are allowed to log verifications
    mapping(address => bool) public authorizedVerifiers;

    // Track every time a credential gets verified
    mapping(bytes32 => uint256[]) public verificationHistory;

    // Store details about who accessed what and when
    struct AccessLog {
        address accessor;
        bytes32 credentialId;
        uint256 timestamp;
        bool success;
    }

    AccessLog[] public accessLogs;

    event CredentialVerified(
        bytes32 indexed credentialId,
        address indexed verifier,
        uint256 timestamp,
        bool result
    );

    event AccessAttempt(
        bytes32 indexed credentialId,
        address indexed accessor,
        uint256 timestamp,
        bool success
    );

    event VerifierAuthorized(address indexed verifier);
    event VerifierDeauthorized(address indexed verifier);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    modifier onlyAuthorized() {
        require(authorizedVerifiers[msg.sender], "Not authorized verifier");
        _;
    }

    constructor() {
        owner = msg.sender;
        // Whoever deploys this contract becomes the owner and first verifier
        authorizedVerifiers[msg.sender] = true;
        emit VerifierAuthorized(msg.sender);
    }

    // Let someone become an authorized verifier
    function addAuthorizedVerifier(address verifier) external onlyOwner {
        require(verifier != address(0), "Invalid address");
        require(!authorizedVerifiers[verifier], "Already authorized");
        authorizedVerifiers[verifier] = true;
        emit VerifierAuthorized(verifier);
    }

    // Remove someone's verification privileges
    function removeAuthorizedVerifier(address verifier) external onlyOwner {
        require(authorizedVerifiers[verifier], "Not authorized");
        require(verifier != owner, "Cannot remove owner");
        authorizedVerifiers[verifier] = false;
        emit VerifierDeauthorized(verifier);
    }

    // Record that a credential was verified
    function logVerification(bytes32 credentialId, bool result) external onlyAuthorized {
        uint256 timestamp = block.timestamp;
        verificationHistory[credentialId].push(timestamp);
        emit CredentialVerified(credentialId, msg.sender, timestamp, result);
    }

    // Anyone can log that they accessed a credential
    function logAccess(bytes32 credentialId, bool success) external {
        uint256 timestamp = block.timestamp;
        accessLogs.push(AccessLog({
            accessor: msg.sender,
            credentialId: credentialId,
            timestamp: timestamp,
            success: success
        }));
        emit AccessAttempt(credentialId, msg.sender, timestamp, success);
    }

    // See when a credential was verified
    function getVerificationHistory(bytes32 credentialId) external view returns (uint256[] memory) {
        return verificationHistory[credentialId];
    }

    // Count how many times a credential has been verified
    function getVerificationCount(bytes32 credentialId) external view returns (uint256) {
        return verificationHistory[credentialId].length;
    }

    // How many access attempts have been logged total
    function getAccessLogCount() external view returns (uint256) {
        return accessLogs.length;
    }

    // Look up a specific access log entry
    function getAccessLog(uint256 index) external view returns(
        address accessor,
        bytes32 credentialId,
        uint256 timestamp,
        bool success
    ) {
        require(index < accessLogs.length, "Index out of bounds");
        AccessLog memory log = accessLogs[index];
        return (log.accessor, log.credentialId, log.timestamp, log.success);
    }

    // Check if someone is allowed to log verifications
    function isAuthorizedVerifier(address verifier) external view returns (bool) {
        return authorizedVerifiers[verifier];
    }

    // Hand over control to someone else
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        require(newOwner != owner, "Already owner");
        
        // Make sure the new owner can log verifications
        authorizedVerifiers[newOwner] = true;
        emit VerifierAuthorized(newOwner);
        
        owner = newOwner;
    }
}

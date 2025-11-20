// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title EventLogger
/// @notice Records verification and access events for audit trail
/// @dev Provides transparency and accountability for credential verification
contract EventLogger {
    /// @dev Owner of the contract (can add/remove authorized verifiers)
    address public owner;

    /// @dev Mapping of authorized verifier addresses
    mapping(address => bool) public authorizedVerifiers;

    /// @dev Verification history: credentialId => array of verification timestamps
    mapping(bytes32 => uint256[]) public verificationHistory;

    /// @dev Access log entries
    struct AccessLog {
        address accessor;
        bytes32 credentialId;
        uint256 timestamp;
        bool success;
    }

    /// @dev Array of all access logs
    AccessLog[] public accessLogs;

    /// @notice Emitted when a credential is verified
    /// @param credentialId The credential being verified
    /// @param verifier Address performing the verification
    /// @param timestamp When the verification occurred
    /// @param result Verification result (true/false)
    event CredentialVerified(
        bytes32 indexed credentialId,
        address indexed verifier,
        uint256 timestamp,
        bool result
    );

    /// @notice Emitted when access to a credential is attempted
    /// @param credentialId The credential being accessed
    /// @param accessor Address attempting access
    /// @param timestamp When the access occurred
    /// @param success Whether access was granted
    event AccessAttempt(
        bytes32 indexed credentialId,
        address indexed accessor,
        uint256 timestamp,
        bool success
    );

    /// @notice Emitted when a verifier is authorized
    event VerifierAuthorized(address indexed verifier);

    /// @notice Emitted when a verifier is deauthorized
    event VerifierDeauthorized(address indexed verifier);

    /// @dev Modifier to restrict access to owner only
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    /// @dev Modifier to restrict access to authorized verifiers only
    modifier onlyAuthorized() {
        require(authorizedVerifiers[msg.sender], "Not authorized verifier");
        _;
    }

    /// @notice Constructor sets the contract deployer as owner
    constructor() {
        owner = msg.sender;
        // Owner is automatically an authorized verifier
        authorizedVerifiers[msg.sender] = true;
        emit VerifierAuthorized(msg.sender);
    }

    /// @notice Add an authorized verifier
    /// @param verifier Address to authorize
    function addAuthorizedVerifier(address verifier) external onlyOwner {
        require(verifier != address(0), "Invalid address");
        require(!authorizedVerifiers[verifier], "Already authorized");
        authorizedVerifiers[verifier] = true;
        emit VerifierAuthorized(verifier);
    }

    /// @notice Remove an authorized verifier
    /// @param verifier Address to deauthorize
    function removeAuthorizedVerifier(address verifier) external onlyOwner {
        require(authorizedVerifiers[verifier], "Not authorized");
        require(verifier != owner, "Cannot remove owner");
        authorizedVerifiers[verifier] = false;
        emit VerifierDeauthorized(verifier);
    }

    /// @notice Log a credential verification (authorized verifiers only)
    /// @param credentialId The credential being verified
    /// @param result Verification result
    function logVerification(bytes32 credentialId, bool result) external onlyAuthorized {
        uint256 timestamp = block.timestamp;
        verificationHistory[credentialId].push(timestamp);
        emit CredentialVerified(credentialId, msg.sender, timestamp, result);
    }

    /// @notice Log an access attempt (public - anyone can log their access)
    /// @param credentialId The credential being accessed
    /// @param success Whether access was successful
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

    /// @notice Get verification history for a credential
    /// @param credentialId The credential to query
    /// @return Array of verification timestamps
    function getVerificationHistory(bytes32 credentialId) external view returns (uint256[] memory) {
        return verificationHistory[credentialId];
    }

    /// @notice Get the total number of verifications for a credential
    /// @param credentialId The credential to query
    /// @return Number of verifications
    function getVerificationCount(bytes32 credentialId) external view returns (uint256) {
        return verificationHistory[credentialId].length;
    }

    /// @notice Get the total number of access logs
    /// @return Number of access log entries
    function getAccessLogCount() external view returns (uint256) {
        return accessLogs.length;
    }

    /// @notice Get a specific access log entry
    /// @param index Index of the access log
    /// @return accessor Address that accessed
    /// @return credentialId Credential that was accessed
    /// @return timestamp When the access occurred
    /// @return success Whether access was successful
    function getAccessLog(uint256 index) external view returns (
        address accessor,
        bytes32 credentialId,
        uint256 timestamp,
        bool success
    ) {
        require(index < accessLogs.length, "Index out of bounds");
        AccessLog memory log = accessLogs[index];
        return (log.accessor, log.credentialId, log.timestamp, log.success);
    }

    /// @notice Check if an address is an authorized verifier
    /// @param verifier Address to check
    /// @return True if authorized, false otherwise
    function isAuthorizedVerifier(address verifier) external view returns (bool) {
        return authorizedVerifiers[verifier];
    }

    /// @notice Transfer ownership to a new owner
    /// @param newOwner Address of the new owner
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        require(newOwner != owner, "Already owner");
        
        // Remove old owner from authorized verifiers if needed
        // Add new owner as authorized verifier
        authorizedVerifiers[newOwner] = true;
        emit VerifierAuthorized(newOwner);
        
        owner = newOwner;
    }
}

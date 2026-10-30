// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title ChainSleuthAudit
 * @dev Records immutable audit findings for suspicious blockchain transactions.
 * Designed for ChainSleuth AI-Powered Blockchain Fraud Detection.
 */
contract ChainSleuthAudit is AccessControl {
    bytes32 public constant REPORTER_ROLE = keccak256("REPORTER_ROLE");

    struct AuditFinding {
        string  transactionId;
        uint8   riskScore;
        string  category;       // "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
        string  modelVersion;
        uint256 recordedAt;
        address reporter;
    }

    mapping(string => bool) public recorded;
    AuditFinding[] public findings;

    event FindingRecorded(
        uint256 indexed findingIndex,
        string  indexed transactionId,
        uint8   riskScore,
        string  category,
        address reporter,
        uint256 recordedAt
    );

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(REPORTER_ROLE, admin);
    }

    /**
     * @notice Records a new fraud detection finding. Only addresses with REPORTER_ROLE can call.
     */
    function recordFinding(
        string calldata transactionId,
        uint8  riskScore,
        string calldata category,
        string calldata modelVersion
    ) external onlyRole(REPORTER_ROLE) returns (uint256) {
        require(riskScore <= 100, "Score out of range");
        require(bytes(transactionId).length > 0, "Empty transaction ID");
        require(!recorded[transactionId], "Already recorded");

        recorded[transactionId] = true;
        findings.push(AuditFinding({
            transactionId: transactionId,
            riskScore: riskScore,
            category: category,
            modelVersion: modelVersion,
            recordedAt: block.timestamp,
            reporter: msg.sender
        }));

        uint256 idx = findings.length - 1;
        emit FindingRecorded(idx, transactionId, riskScore, category, msg.sender, block.timestamp);
        return idx;
    }

    /**
     * @notice Fetches a recorded finding by index.
     */
    function getFinding(uint256 index) external view returns (AuditFinding memory) {
        require(index < findings.length, "Index out of bounds");
        return findings[index];
    }

    /**
     * @notice Total number of findings committed to this contract.
     */
    function findingsCount() external view returns (uint256) {
        return findings.length;
    }
}

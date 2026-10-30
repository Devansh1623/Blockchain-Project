const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ChainSleuthAudit Contract", function () {
  let ChainSleuthAudit;
  let audit;
  let admin;
  let reporter;
  let nonReporter;

  beforeEach(async function () {
    [admin, reporter, nonReporter] = await ethers.getSigners();

    ChainSleuthAudit = await ethers.getContractFactory("ChainSleuthAudit");
    audit = await ChainSleuthAudit.deploy(admin.address);
    await audit.waitForDeployment();

    // Grant reporter role to reporter account
    const REPORTER_ROLE = await audit.REPORTER_ROLE();
    await audit.connect(admin).grantRole(REPORTER_ROLE, reporter.address);
  });

  it("Should allow authorized reporter to record a finding and emit FindingRecorded", async function () {
    await expect(
      audit.connect(reporter).recordFinding(
        "TXN-9999",
        85,
        "CRITICAL",
        "IsolationForest-v1.0"
      )
    )
      .to.emit(audit, "FindingRecorded")
      .withArgs(0, "TXN-9999", 85, "CRITICAL", reporter.address, (val) => val > 0);

    expect(await audit.findingsCount()).to.equal(1);
    expect(await audit.recorded("TXN-9999")).to.be.true;

    const finding = await audit.getFinding(0);
    expect(finding.transactionId).to.equal("TXN-9999");
    expect(finding.riskScore).to.equal(85);
    expect(finding.category).to.equal("CRITICAL");
    expect(finding.modelVersion).to.equal("IsolationForest-v1.0");
    expect(finding.reporter).to.equal(reporter.address);
  });

  it("Should revert if unauthorized account attempts to record finding", async function () {
    await expect(
      audit.connect(nonReporter).recordFinding(
        "TXN-1111",
        45,
        "MEDIUM",
        "IsolationForest-v1.0"
      )
    ).to.be.reverted;
  });

  it("Should revert if risk score exceeds 100", async function () {
    await expect(
      audit.connect(reporter).recordFinding(
        "TXN-2222",
        101,
        "CRITICAL",
        "IsolationForest-v1.0"
      )
    ).to.be.revertedWith("Score out of range");
  });

  it("Should revert if transaction ID is empty", async function () {
    await expect(
      audit.connect(reporter).recordFinding(
        "",
        50,
        "MEDIUM",
        "IsolationForest-v1.0"
      )
    ).to.be.revertedWith("Empty transaction ID");
  });

  it("Should prevent duplicate recordings for the same transaction ID", async function () {
    await audit.connect(reporter).recordFinding(
      "TXN-DUPLICATE",
      70,
      "HIGH",
      "IsolationForest-v1.0"
    );

    await expect(
      audit.connect(reporter).recordFinding(
        "TXN-DUPLICATE",
        90,
        "CRITICAL",
        "IsolationForest-v1.0"
      )
    ).to.be.revertedWith("Already recorded");
  });
});

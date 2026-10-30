const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying ChainSleuthAudit with account:", deployer.address);

  const ChainSleuthAudit = await hre.ethers.getContractFactory("ChainSleuthAudit");
  const audit = await ChainSleuthAudit.deploy(deployer.address);

  await audit.waitForDeployment();
  const address = await audit.getAddress();

  console.log("ChainSleuthAudit deployed to:", address);
  console.log("Add this to your backend .env:");
  console.log(`CONTRACT_ADDRESS=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

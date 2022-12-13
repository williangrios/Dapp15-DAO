const hre = require("hardhat");

async function main() {
  const contributionTime = 1;
  const voteTime = 5; //in days
  const quorum = 66;

  const DAO = await hre.ethers.getContractFactory("DAO");
  const dao = await DAO.deploy(contributionTime, voteTime, quorum);

  await dao.deployed();

  console.log(
    `DAO deployed to ${dao.address}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

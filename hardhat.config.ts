import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
    },
    localhost: {
      url: "http://127.0.0.1:8545",
    },
  },
  paths: {
    tests: './test'
  },
  mocha: {
    timeout: 40000
  }
};

export default config;

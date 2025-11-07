import 'dotenv/config';
import '@nomicfoundation/hardhat-toolbox-mocha-ethers';
import { defineConfig } from 'hardhat/config';

export default defineConfig({
  solidity: {
    profiles: {
      default: { version: '0.8.28' }
    }
  },
  networks: {
    // built-in simulated hardhat network
    hardhat: { type: 'edr-simulated' },

    // local node used for development and demo
    local: { type: 'http', url: 'http://127.0.0.1:8545' }
  },
  // no testnet configs in local-first mode
});

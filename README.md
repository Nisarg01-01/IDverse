# IDverse - Decentralized Identity and Access Management (IAM) dApp

## Project Description
This project implements a decentralized Identity and Access Management (IAM) system using Ethereum smart contracts and self-sovereign identity (SSI) principles. The system enables *issuers* to create and sign credentials, *holders* to manage decentralized identifiers and store valid credentials, and *verifiers* to actually validate the credentials and check if they need to be revoked.

Only minimal data is stored on the chain such as metadata, hashes of the credentials, and audit events. Full credential documents are stored off-chain using `IPFS`, with hashes linking them to records that are on the chain.

A frontend made with `React` + `Ethers.js` will connect to `MetaMask` for authentication and contract interactions.

## Tech Stack and Dependencies
**Solidity** for our smart contract programming language
<br>**Hardhat** for compilation, testing, and deployment
<br>**Node.js and npm** for our development env and tooling
<br>**Ethers.js and/or Web3.js** for contract interaction in the frontend
<br>**MetaMask** the wallet used for identity control and signing transactions
<br>**Ethereum Testnet like Sepolia or Polygon Mumbai** network for on chain testing
<br>**Helia** for off chain decentralized file storage

## Local Setup at this Stage:

1. Install Node.js: https://nodejs.org/
2. Install project dependencies:  
   ```bash
   npm init -y
   npm i -D hardhat @nomicfoundation/hardhat-toolbox dotenv
   npm i ethers
   npm i helia @helia/unixfs
   ```

## How to Use / Deploy (draft)
These deployment steps are incomplete by design and will be finalized later. They outline how the system is intended to be deployed and used.

Draft Deployment Steps

1. Compile contracts
`npx hardhat compile`

2. Deploy to a local Hardhat network (later)
`npx hardhat node`
This will print a list of pre-funded accounts with private keys and the local RPC URL usually http://127.0.0.1:8545. These accounts and their keys are public and any funds actually sent to them will be lost. For local testing only.

3. What We Will Do Next
    - Add initial contract implementations
    - Add a deployment script like scripts/deploy.js and document exact deploy commands.
    - Record deployed addresses and write up the frontend.
    - Add Helia helpers to store/retrieve credential JSON by CID and reference the CID on-chain.

We will update this deployment section with exact deployment commands and addresses once the first contract implementation and deployment script are added.

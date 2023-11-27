require("@nomiclabs/hardhat-waffle");

module.exports = {
  solidity: "0.8.13",
  networks: {
    hardhat: {
      chainId: 33 // RSK Regtest chain ID
    },
    testnet: {
      url: "https://public-node.testnet.rsk.co",
      accounts: [process.env.MNEMONIC],
      chainId: 31 // RSK Testnet chain ID
    }
    
    }
  };

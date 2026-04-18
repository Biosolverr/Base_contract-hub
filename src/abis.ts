export const FACTORY_ABI = [
  {
    "type": "function",
    "name": "deployContract",
    "inputs": [
      { "name": "contractId", "type": "bytes32" },
      { "name": "licenseTokenId", "type": "uint256" }
    ],
    "outputs": [{ "name": "", "type": "address" }],
    "stateMutability": "payable"
  }
] as const;

export const MARKETPLACE_ABI = [
  {
    "type": "function",
    "name": "purchaseLicense",
    "inputs": [{ "name": "contractId", "type": "bytes32" }],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "rateContract",
    "inputs": [
      { "name": "contractId", "type": "bytes32" },
      { "name": "rating", "type": "uint256" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  }
] as const;

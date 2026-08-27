// Committed Kuru contract ABI metadata used by the SDK runtime.
export const contractMetadata = {
  contractsCommit: "e37bc3961c23e0bdb0ce23477cffc2b2482a1b72",
  artifacts: {
    AccountCore: {
      artifact: "AccountCore.sol/AccountCore.json",
      abiSha256: "445b3b5acc25edfaa8859f97265669b70c2528622bf6be093f8c029c94f7134e"
    },
    SpotRouter: {
      artifact: "SpotRouter.sol/SpotRouter.json",
      abiSha256: "d22e77451b596fa2f8c02d571bc1b53dc6790804dfbef685bc266dc128b2c5d0"
    },
    OrderBook: {
      artifact: "OrderBook.sol/OrderBook.json",
      abiSha256: "ee4fb7bcc5941be25eaac57cca7f364f02e50355dc7d4ff092e87778bba1fcf3"
    },
    SpotPeriphery: {
      artifact: "SpotPeriphery.sol/SpotPeriphery.json",
      abiSha256: "8505083188e43737b3da5d5c280f8940d0bfd5be4acb9be07103fa13f9f1be2a"
    },
    IERC20Metadata: {
      artifact: "IERC20Metadata.sol/IERC20Metadata.json",
      abiSha256: "ebd8c069b13444f2b42ed48f6ffde97963423dc8e7591ac55276f53e04a609eb"
    }
  }
} as const;

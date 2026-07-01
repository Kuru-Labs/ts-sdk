// Committed Kuru contract ABI metadata used by the SDK runtime.
export const contractMetadata = {
  contractsCommit: "393d122c40c70372373448a42612183d98fc3b34",
  artifacts: {
    AccountCore: {
      artifact: "AccountCore.sol/AccountCore.json",
      abiSha256: "89cacbb3428b07aee08af80abe39ca20eff5b9b06aba5adc501a9c9d15d0fd0b"
    },
    SpotRouter: {
      artifact: "SpotRouter.sol/SpotRouter.json",
      abiSha256: "ba597239ac3b705700d4a1458f1660de40a64adf6f6281ea6b28f9d735f6aac0"
    },
    SpotEngine: {
      artifact: "SpotEngine.sol/SpotEngine.json",
      abiSha256: "8cbf949d2f297724bad1263f70b1ffaeb658f464d831fb886ad0193037b3de5f"
    },
    OrderBook: {
      artifact: "OrderBook.sol/OrderBook.json",
      abiSha256: "5ef354211494b9db66230dfe8e3ddbfe7ee5189a0bbc565588fa73fec5d7def0"
    },
    SpotPeriphery: {
      artifact: "SpotPeriphery.sol/SpotPeriphery.json",
      abiSha256: "8505083188e43737b3da5d5c280f8940d0bfd5be4acb9be07103fa13f9f1be2a"
    },
    KuruIntentExecutor: {
      artifact: "KuruIntentExecutor.sol/KuruIntentExecutor.json",
      abiSha256: "5eece9b0ceacaf0f3f535eb9f93b6861c8526c97c38a77621401a60e0708cc07"
    },
    IERC20Metadata: {
      artifact: "IERC20Metadata.sol/IERC20Metadata.json",
      abiSha256: "ebd8c069b13444f2b42ed48f6ffde97963423dc8e7591ac55276f53e04a609eb"
    }
  }
} as const;

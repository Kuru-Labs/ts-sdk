// Committed Kuru contract ABIs used by the SDK runtime.
import type { Abi } from "viem";

export const accountCoreAbi = [
  {
    type: "constructor",
    inputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "receive",
    stateMutability: "payable"
  },
  {
    type: "function",
    name: "ACCOUNT_PERMISSION_ADMIN",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint32",
        internalType: "uint32"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "ACCOUNT_PERMISSION_INTERNAL_TRANSFER",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint32",
        internalType: "uint32"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "ACCOUNT_PERMISSION_TRADE",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint32",
        internalType: "uint32"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "ACCOUNT_PERMISSION_WITHDRAW",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint32",
        internalType: "uint32"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "AUTHORIZE_ACCOUNT_SIGNER_TYPEHASH",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "BPS_MULTIPLIER",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "CREATE_SUBACCOUNT_TYPEHASH",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "MAX_SPOT_TOKEN_DECIMALS",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint8",
        internalType: "uint8"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "NATIVE_TOKEN_DECIMALS",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint8",
        internalType: "uint8"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "accountSignerAuthorizationNonces",
    inputs: [
      {
        name: "",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "applySpotReserveDelta",
    inputs: [
      {
        name: "user",
        type: "address",
        internalType: "address"
      },
      {
        name: "",
        type: "uint40",
        internalType: "uint40"
      },
      {
        name: "reserveBid",
        type: "uint96",
        internalType: "uint96"
      },
      {
        name: "reserveAsk",
        type: "uint96",
        internalType: "uint96"
      },
      {
        name: "releaseBid",
        type: "uint96",
        internalType: "uint96"
      },
      {
        name: "releaseAsk",
        type: "uint96",
        internalType: "uint96"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "approveBuilder",
    inputs: [
      {
        name: "builder",
        type: "address",
        internalType: "address"
      },
      {
        name: "maxFeeBps",
        type: "uint16",
        internalType: "uint16"
      },
      {
        name: "expiry",
        type: "uint64",
        internalType: "uint64"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "authority",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "authorizeAccountSigner",
    inputs: [
      {
        name: "account",
        type: "address",
        internalType: "address"
      },
      {
        name: "signer",
        type: "address",
        internalType: "address"
      },
      {
        name: "permissions",
        type: "uint32",
        internalType: "uint32"
      },
      {
        name: "expiry",
        type: "uint64",
        internalType: "uint64"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "authorizeAccountSignerBySig",
    inputs: [
      {
        name: "account",
        type: "address",
        internalType: "address"
      },
      {
        name: "signer",
        type: "address",
        internalType: "address"
      },
      {
        name: "permissions",
        type: "uint32",
        internalType: "uint32"
      },
      {
        name: "expiry",
        type: "uint64",
        internalType: "uint64"
      },
      {
        name: "nonce",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "deadline",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "signature",
        type: "bytes",
        internalType: "bytes"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "cancelOwnershipHandover",
    inputs: [],
    outputs: [],
    stateMutability: "payable"
  },
  {
    type: "function",
    name: "claimBuilderFees",
    inputs: [
      {
        name: "asset",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "completeOwnershipHandover",
    inputs: [
      {
        name: "pendingOwner",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [],
    stateMutability: "payable"
  },
  {
    type: "function",
    name: "configureSpotToken",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address"
      },
      {
        name: "enabled",
        type: "bool",
        internalType: "bool"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "createSubaccount",
    inputs: [
      {
        name: "subaccount",
        type: "address",
        internalType: "address"
      },
      {
        name: "deadline",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "signature",
        type: "bytes",
        internalType: "bytes"
      }
    ],
    outputs: [
      {
        name: "subaccountId",
        type: "uint40",
        internalType: "uint40"
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "createSubaccount",
    inputs: [
      {
        name: "subaccount",
        type: "address",
        internalType: "address"
      },
      {
        name: "deadline",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "v",
        type: "uint8",
        internalType: "uint8"
      },
      {
        name: "r",
        type: "bytes32",
        internalType: "bytes32"
      },
      {
        name: "s",
        type: "bytes32",
        internalType: "bytes32"
      }
    ],
    outputs: [
      {
        name: "subaccountId",
        type: "uint40",
        internalType: "uint40"
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "createSubaccount",
    inputs: [
      {
        name: "subaccount",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "",
        type: "uint40",
        internalType: "uint40"
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "defaultSpotFeesActive",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "defaultSpotMakerFeeBps",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint16",
        internalType: "uint16"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "defaultSpotTakerFeeBps",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint16",
        internalType: "uint16"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "deposit",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address"
      },
      {
        name: "amount",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [],
    stateMutability: "payable"
  },
  {
    type: "function",
    name: "depositForAccount",
    inputs: [
      {
        name: "account",
        type: "address",
        internalType: "address"
      },
      {
        name: "token",
        type: "address",
        internalType: "address"
      },
      {
        name: "amount",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [],
    stateMutability: "payable"
  },
  {
    type: "function",
    name: "effectiveSpotMakerFeeBps",
    inputs: [
      {
        name: "accountId",
        type: "uint40",
        internalType: "uint40"
      },
      {
        name: "marketMakerFeeBps",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [
      {
        name: "",
        type: "uint16",
        internalType: "uint16"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "effectiveSpotTakerFeeBps",
    inputs: [
      {
        name: "accountId",
        type: "uint40",
        internalType: "uint40"
      },
      {
        name: "marketTakerFeeBps",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [
      {
        name: "",
        type: "uint16",
        internalType: "uint16"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "eip712Domain",
    inputs: [],
    outputs: [
      {
        name: "fields",
        type: "bytes1",
        internalType: "bytes1"
      },
      {
        name: "name",
        type: "string",
        internalType: "string"
      },
      {
        name: "version",
        type: "string",
        internalType: "string"
      },
      {
        name: "chainId",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "verifyingContract",
        type: "address",
        internalType: "address"
      },
      {
        name: "salt",
        type: "bytes32",
        internalType: "bytes32"
      },
      {
        name: "extensions",
        type: "uint256[]",
        internalType: "uint256[]"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "ensureUserRegistered",
    inputs: [
      {
        name: "user",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "",
        type: "uint40",
        internalType: "uint40"
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "feeCollector",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getAccountFeeTierById",
    inputs: [
      {
        name: "accountId",
        type: "uint40",
        internalType: "uint40"
      }
    ],
    outputs: [
      {
        name: "tier",
        type: "tuple",
        internalType: "struct IAccountCore.AccountFeeTier",
        components: [
          {
            name: "makerFeeBps",
            type: "uint16",
            internalType: "uint16"
          },
          {
            name: "takerFeeBps",
            type: "uint16",
            internalType: "uint16"
          },
          {
            name: "active",
            type: "bool",
            internalType: "bool"
          }
        ]
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getAccountOwner",
    inputs: [
      {
        name: "account",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getAccountRootId",
    inputs: [
      {
        name: "account",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "",
        type: "uint40",
        internalType: "uint40"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getAccountSubaccountSeq",
    inputs: [
      {
        name: "account",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "",
        type: "uint16",
        internalType: "uint16"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getBalance",
    inputs: [
      {
        name: "user",
        type: "address",
        internalType: "address"
      },
      {
        name: "token",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getBuilderApproval",
    inputs: [
      {
        name: "rootAccount",
        type: "address",
        internalType: "address"
      },
      {
        name: "builder",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct IAccountCore.BuilderApproval",
        components: [
          {
            name: "maxFeeBps",
            type: "uint16",
            internalType: "uint16"
          },
          {
            name: "expiry",
            type: "uint64",
            internalType: "uint64"
          },
          {
            name: "active",
            type: "bool",
            internalType: "bool"
          }
        ]
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getClaimableBuilderFees",
    inputs: [
      {
        name: "builder",
        type: "address",
        internalType: "address"
      },
      {
        name: "asset",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getSpotReservedBalance",
    inputs: [
      {
        name: "user",
        type: "address",
        internalType: "address"
      },
      {
        name: "token",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getSpotTokenDecimals",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "",
        type: "uint8",
        internalType: "uint8"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getSubaccounts",
    inputs: [
      {
        name: "rootAccount",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "",
        type: "address[]",
        internalType: "address[]"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "initialize",
    inputs: [
      {
        name: "_owner",
        type: "address",
        internalType: "address"
      },
      {
        name: "_feeCollector",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "isAssetEnabledForSpot",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "isAuthorizedAccountSigner",
    inputs: [
      {
        name: "account",
        type: "address",
        internalType: "address"
      },
      {
        name: "signer",
        type: "address",
        internalType: "address"
      },
      {
        name: "permission",
        type: "uint32",
        internalType: "uint32"
      }
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "isAuthorizedAccountSignerById",
    inputs: [
      {
        name: "accountId",
        type: "uint40",
        internalType: "uint40"
      },
      {
        name: "signer",
        type: "address",
        internalType: "address"
      },
      {
        name: "permission",
        type: "uint32",
        internalType: "uint32"
      }
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "lockSpotPassiveLiquidity",
    inputs: [
      {
        name: "user",
        type: "address",
        internalType: "address"
      },
      {
        name: "baseAmount",
        type: "uint128",
        internalType: "uint128"
      },
      {
        name: "quoteAmount",
        type: "uint128",
        internalType: "uint128"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [
      {
        name: "result",
        type: "address",
        internalType: "address"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "ownershipHandoverExpiresAt",
    inputs: [
      {
        name: "pendingOwner",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "result",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "protocolPaused",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "proxiableUUID",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "registerSpotMarket",
    inputs: [
      {
        name: "orderBook",
        type: "address",
        internalType: "address"
      },
      {
        name: "baseToken",
        type: "address",
        internalType: "address"
      },
      {
        name: "quoteToken",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "releaseSpotOrderReserve",
    inputs: [
      {
        name: "user",
        type: "address",
        internalType: "address"
      },
      {
        name: "",
        type: "uint40",
        internalType: "uint40"
      },
      {
        name: "releasedAmount",
        type: "uint96",
        internalType: "uint96"
      },
      {
        name: "isBid",
        type: "bool",
        internalType: "bool"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "releaseSpotPassiveLiquidity",
    inputs: [
      {
        name: "user",
        type: "address",
        internalType: "address"
      },
      {
        name: "baseAmount",
        type: "uint128",
        internalType: "uint128"
      },
      {
        name: "quoteAmount",
        type: "uint128",
        internalType: "uint128"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "renounceOwnership",
    inputs: [],
    outputs: [],
    stateMutability: "payable"
  },
  {
    type: "function",
    name: "requestOwnershipHandover",
    inputs: [],
    outputs: [],
    stateMutability: "payable"
  },
  {
    type: "function",
    name: "reserveSpotOrder",
    inputs: [
      {
        name: "user",
        type: "address",
        internalType: "address"
      },
      {
        name: "",
        type: "uint40",
        internalType: "uint40"
      },
      {
        name: "reserveAmount",
        type: "uint96",
        internalType: "uint96"
      },
      {
        name: "isBid",
        type: "bool",
        internalType: "bool"
      }
    ],
    outputs: [
      {
        name: "",
        type: "uint96",
        internalType: "uint96"
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "revokeAccountSigner",
    inputs: [
      {
        name: "account",
        type: "address",
        internalType: "address"
      },
      {
        name: "signer",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "revokeBuilder",
    inputs: [
      {
        name: "builder",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "setAccountFeeTierById",
    inputs: [
      {
        name: "accountId",
        type: "uint40",
        internalType: "uint40"
      },
      {
        name: "makerFeeBps_",
        type: "uint16",
        internalType: "uint16"
      },
      {
        name: "takerFeeBps_",
        type: "uint16",
        internalType: "uint16"
      },
      {
        name: "active",
        type: "bool",
        internalType: "bool"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "setAccountFeeTiersById",
    inputs: [
      {
        name: "accountIds",
        type: "uint40[]",
        internalType: "uint40[]"
      },
      {
        name: "makerFeeBps_",
        type: "uint16[]",
        internalType: "uint16[]"
      },
      {
        name: "takerFeeBps_",
        type: "uint16[]",
        internalType: "uint16[]"
      },
      {
        name: "active",
        type: "bool[]",
        internalType: "bool[]"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "setAuthority",
    inputs: [
      {
        name: "newAuthority",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "setDefaultSpotFees",
    inputs: [
      {
        name: "makerFeeBps_",
        type: "uint16",
        internalType: "uint16"
      },
      {
        name: "takerFeeBps_",
        type: "uint16",
        internalType: "uint16"
      },
      {
        name: "active",
        type: "bool",
        internalType: "bool"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "setFeeCollector",
    inputs: [
      {
        name: "newFeeCollector",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "setSpotRouter",
    inputs: [
      {
        name: "newSpotRouter",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "settleSpotPassiveTrade",
    inputs: [
      {
        name: "taker",
        type: "address",
        internalType: "address"
      },
      {
        name: "takerIsBuy",
        type: "bool",
        internalType: "bool"
      },
      {
        name: "baseAmount",
        type: "uint96",
        internalType: "uint96"
      },
      {
        name: "quoteAmount",
        type: "uint128",
        internalType: "uint128"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "settleSpotTrades",
    inputs: [
      {
        name: "makerFills",
        type: "tuple[]",
        internalType: "struct ISpotBalanceAccount.SpotFill[]",
        components: [
          {
            name: "maker",
            type: "address",
            internalType: "address"
          },
          {
            name: "baseAmount",
            type: "uint96",
            internalType: "uint96"
          },
          {
            name: "quoteAmount",
            type: "uint128",
            internalType: "uint128"
          },
          {
            name: "makerIsBuy",
            type: "bool",
            internalType: "bool"
          },
          {
            name: "makerReserveConsumed",
            type: "uint96",
            internalType: "uint96"
          },
          {
            name: "makerFeeBps",
            type: "uint16",
            internalType: "uint16"
          }
        ]
      },
      {
        name: "taker",
        type: "address",
        internalType: "address"
      },
      {
        name: "takerIsBuy",
        type: "bool",
        internalType: "bool"
      },
      {
        name: "takerFeeBps",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "settleSpotTradesWithBuilder",
    inputs: [
      {
        name: "makerFills",
        type: "tuple[]",
        internalType: "struct ISpotBalanceAccount.SpotFill[]",
        components: [
          {
            name: "maker",
            type: "address",
            internalType: "address"
          },
          {
            name: "baseAmount",
            type: "uint96",
            internalType: "uint96"
          },
          {
            name: "quoteAmount",
            type: "uint128",
            internalType: "uint128"
          },
          {
            name: "makerIsBuy",
            type: "bool",
            internalType: "bool"
          },
          {
            name: "makerReserveConsumed",
            type: "uint96",
            internalType: "uint96"
          },
          {
            name: "makerFeeBps",
            type: "uint16",
            internalType: "uint16"
          }
        ]
      },
      {
        name: "taker",
        type: "address",
        internalType: "address"
      },
      {
        name: "takerIsBuy",
        type: "bool",
        internalType: "bool"
      },
      {
        name: "takerFeeBps",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "builder",
        type: "address",
        internalType: "address"
      },
      {
        name: "builderFeeBps",
        type: "uint16",
        internalType: "uint16"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "spotOrderBookToBaseToken",
    inputs: [
      {
        name: "",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "spotOrderBookToQuoteToken",
    inputs: [
      {
        name: "",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "spotReservedBalance",
    inputs: [
      {
        name: "",
        type: "address",
        internalType: "address"
      },
      {
        name: "",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "spotRouterAddress",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "spotTokenConfigs",
    inputs: [
      {
        name: "",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "decimals",
        type: "uint8",
        internalType: "uint8"
      },
      {
        name: "enabled",
        type: "bool",
        internalType: "bool"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "spotTokenEnabled",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "supportedSpotTokens",
    inputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "toggleProtocolState",
    inputs: [
      {
        name: "state",
        type: "bool",
        internalType: "bool"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "transferBetweenAccounts",
    inputs: [
      {
        name: "fromAccount",
        type: "address",
        internalType: "address"
      },
      {
        name: "toAccount",
        type: "address",
        internalType: "address"
      },
      {
        name: "token",
        type: "address",
        internalType: "address"
      },
      {
        name: "amount",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "transferOwnership",
    inputs: [
      {
        name: "newOwner",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [],
    stateMutability: "payable"
  },
  {
    type: "function",
    name: "upgradeToAndCall",
    inputs: [
      {
        name: "newImplementation",
        type: "address",
        internalType: "address"
      },
      {
        name: "data",
        type: "bytes",
        internalType: "bytes"
      }
    ],
    outputs: [],
    stateMutability: "payable"
  },
  {
    type: "function",
    name: "userAddressById",
    inputs: [
      {
        name: "",
        type: "uint40",
        internalType: "uint40"
      }
    ],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "userRegistry",
    inputs: [
      {
        name: "",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "",
        type: "uint40",
        internalType: "uint40"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "validateBuilderConfigById",
    inputs: [
      {
        name: "accountId",
        type: "uint40",
        internalType: "uint40"
      },
      {
        name: "builder",
        type: "address",
        internalType: "address"
      },
      {
        name: "feeBps",
        type: "uint16",
        internalType: "uint16"
      }
    ],
    outputs: [],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "verifiedSpotOrderBook",
    inputs: [
      {
        name: "",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "withdraw",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address"
      },
      {
        name: "amount",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "withdrawFromAccount",
    inputs: [
      {
        name: "account",
        type: "address",
        internalType: "address"
      },
      {
        name: "token",
        type: "address",
        internalType: "address"
      },
      {
        name: "amount",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "event",
    name: "AccountFeeTierUpdated",
    inputs: [
      {
        name: "rootAccountId",
        type: "uint40",
        indexed: true,
        internalType: "uint40"
      },
      {
        name: "makerFeeBps",
        type: "uint16",
        indexed: false,
        internalType: "uint16"
      },
      {
        name: "takerFeeBps",
        type: "uint16",
        indexed: false,
        internalType: "uint16"
      },
      {
        name: "active",
        type: "bool",
        indexed: false,
        internalType: "bool"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "AccountSignerAuthorized",
    inputs: [
      {
        name: "account",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "accountId",
        type: "uint40",
        indexed: true,
        internalType: "uint40"
      },
      {
        name: "signer",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "permissions",
        type: "uint32",
        indexed: false,
        internalType: "uint32"
      },
      {
        name: "expiry",
        type: "uint64",
        indexed: false,
        internalType: "uint64"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "AccountSignerRevoked",
    inputs: [
      {
        name: "account",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "accountId",
        type: "uint40",
        indexed: true,
        internalType: "uint40"
      },
      {
        name: "signer",
        type: "address",
        indexed: true,
        internalType: "address"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "AuthorityUpdated",
    inputs: [
      {
        name: "oldAuthority",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "newAuthority",
        type: "address",
        indexed: true,
        internalType: "address"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "BuilderApprovalUpdated",
    inputs: [
      {
        name: "rootAccount",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "rootUserId",
        type: "uint40",
        indexed: true,
        internalType: "uint40"
      },
      {
        name: "builder",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "maxFeeBps",
        type: "uint16",
        indexed: false,
        internalType: "uint16"
      },
      {
        name: "expiry",
        type: "uint64",
        indexed: false,
        internalType: "uint64"
      },
      {
        name: "active",
        type: "bool",
        indexed: false,
        internalType: "bool"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "BuilderFeeAccrued",
    inputs: [
      {
        name: "builder",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "asset",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "account",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "accountId",
        type: "uint40",
        indexed: false,
        internalType: "uint40"
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "BuilderFeesClaimed",
    inputs: [
      {
        name: "builder",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "asset",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "DefaultSpotFeesUpdated",
    inputs: [
      {
        name: "makerFeeBps",
        type: "uint16",
        indexed: false,
        internalType: "uint16"
      },
      {
        name: "takerFeeBps",
        type: "uint16",
        indexed: false,
        internalType: "uint16"
      },
      {
        name: "active",
        type: "bool",
        indexed: false,
        internalType: "bool"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "Deposit",
    inputs: [
      {
        name: "user",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "token",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "Initialized",
    inputs: [
      {
        name: "version",
        type: "uint64",
        indexed: false,
        internalType: "uint64"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "InternalAccountTransfer",
    inputs: [
      {
        name: "fromAccount",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "toAccount",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "token",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "OwnershipHandoverCanceled",
    inputs: [
      {
        name: "pendingOwner",
        type: "address",
        indexed: true,
        internalType: "address"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "OwnershipHandoverRequested",
    inputs: [
      {
        name: "pendingOwner",
        type: "address",
        indexed: true,
        internalType: "address"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "OwnershipTransferred",
    inputs: [
      {
        name: "oldOwner",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "newOwner",
        type: "address",
        indexed: true,
        internalType: "address"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "SpotMarketRegistered",
    inputs: [
      {
        name: "orderBook",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "baseToken",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "quoteToken",
        type: "address",
        indexed: true,
        internalType: "address"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "SpotPassiveBalanceUpdated",
    inputs: [
      {
        name: "user",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "baseToken",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "quoteToken",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "freeBaseBalance",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      },
      {
        name: "freeQuoteBalance",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "SpotReserveUpdated",
    inputs: [
      {
        name: "user",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "token",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "freeBalance",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      },
      {
        name: "reservedBalance",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "SpotRouterUpdated",
    inputs: [
      {
        name: "oldRouter",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "newRouter",
        type: "address",
        indexed: true,
        internalType: "address"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "SpotTokenConfigured",
    inputs: [
      {
        name: "token",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "decimals",
        type: "uint8",
        indexed: false,
        internalType: "uint8"
      },
      {
        name: "enabled",
        type: "bool",
        indexed: false,
        internalType: "bool"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "SubaccountCreated",
    inputs: [
      {
        name: "owner",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "subaccount",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "subaccountId",
        type: "uint40",
        indexed: true,
        internalType: "uint40"
      },
      {
        name: "rootId",
        type: "uint40",
        indexed: false,
        internalType: "uint40"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "Upgraded",
    inputs: [
      {
        name: "implementation",
        type: "address",
        indexed: true,
        internalType: "address"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "Withdrawal",
    inputs: [
      {
        name: "user",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "token",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      }
    ],
    anonymous: false
  },
  {
    type: "error",
    name: "AccountAlreadyRegistered",
    inputs: []
  },
  {
    type: "error",
    name: "AccountNotFound",
    inputs: []
  },
  {
    type: "error",
    name: "AlreadyInitialized",
    inputs: []
  },
  {
    type: "error",
    name: "AssetNotEnabled",
    inputs: []
  },
  {
    type: "error",
    name: "BuilderApprovalExpired",
    inputs: []
  },
  {
    type: "error",
    name: "BuilderApprovalNotFound",
    inputs: []
  },
  {
    type: "error",
    name: "BuilderFeeTooHigh",
    inputs: []
  },
  {
    type: "error",
    name: "CannotAuthorizeOwner",
    inputs: []
  },
  {
    type: "error",
    name: "InsufficientBalance",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidAuthority",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidBuilder",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidCollateral",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidInitialization",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidMarketConfig",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidSignature",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidSubaccount",
    inputs: []
  },
  {
    type: "error",
    name: "MarketFeeError",
    inputs: []
  },
  {
    type: "error",
    name: "NativeAssetMismatch",
    inputs: []
  },
  {
    type: "error",
    name: "NewOwnerIsZeroAddress",
    inputs: []
  },
  {
    type: "error",
    name: "NoBuilderFees",
    inputs: []
  },
  {
    type: "error",
    name: "NoHandoverRequest",
    inputs: []
  },
  {
    type: "error",
    name: "NotInitializing",
    inputs: []
  },
  {
    type: "error",
    name: "OnlySpotRouter",
    inputs: []
  },
  {
    type: "error",
    name: "OnlyVerifiedSpotOrderBook",
    inputs: []
  },
  {
    type: "error",
    name: "ProtocolPaused",
    inputs: []
  },
  {
    type: "error",
    name: "Reentrancy",
    inputs: []
  },
  {
    type: "error",
    name: "SameRootRequired",
    inputs: []
  },
  {
    type: "error",
    name: "SpotTokenNotEnabled",
    inputs: []
  },
  {
    type: "error",
    name: "SubaccountLimitReached",
    inputs: []
  },
  {
    type: "error",
    name: "Unauthorized",
    inputs: []
  },
  {
    type: "error",
    name: "Unauthorized",
    inputs: []
  },
  {
    type: "error",
    name: "UnauthorizedCallContext",
    inputs: []
  },
  {
    type: "error",
    name: "UpgradeFailed",
    inputs: []
  },
  {
    type: "error",
    name: "ZeroAddress",
    inputs: []
  },
  {
    type: "error",
    name: "ZeroAmount",
    inputs: []
  }
] as const satisfies Abi;

export const spotRouterAbi = [
  {
    type: "constructor",
    inputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "authority",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "cancelOwnershipHandover",
    inputs: [],
    outputs: [],
    stateMutability: "payable"
  },
  {
    type: "function",
    name: "completeOwnershipHandover",
    inputs: [
      {
        name: "pendingOwner",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [],
    stateMutability: "payable"
  },
  {
    type: "function",
    name: "computeAddress",
    inputs: [
      {
        name: "baseToken",
        type: "address",
        internalType: "address"
      },
      {
        name: "quoteToken",
        type: "address",
        internalType: "address"
      },
      {
        name: "sizePrecision",
        type: "uint96",
        internalType: "uint96"
      },
      {
        name: "pricePrecision",
        type: "uint32",
        internalType: "uint32"
      },
      {
        name: "tickSize",
        type: "uint32",
        internalType: "uint32"
      },
      {
        name: "passiveSpreadTicks",
        type: "uint32",
        internalType: "uint32"
      },
      {
        name: "minQuoteNotional",
        type: "uint96",
        internalType: "uint96"
      },
      {
        name: "maxQuoteNotional",
        type: "uint96",
        internalType: "uint96"
      },
      {
        name: "takerFeeBps",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "makerFeeBps",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "deploySpotMarket",
    inputs: [
      {
        name: "baseToken",
        type: "address",
        internalType: "address"
      },
      {
        name: "quoteToken",
        type: "address",
        internalType: "address"
      },
      {
        name: "sizePrecision",
        type: "uint96",
        internalType: "uint96"
      },
      {
        name: "pricePrecision",
        type: "uint32",
        internalType: "uint32"
      },
      {
        name: "tickSize",
        type: "uint32",
        internalType: "uint32"
      },
      {
        name: "passiveSpreadTicks",
        type: "uint32",
        internalType: "uint32"
      },
      {
        name: "minQuoteNotional",
        type: "uint96",
        internalType: "uint96"
      },
      {
        name: "maxQuoteNotional",
        type: "uint96",
        internalType: "uint96"
      },
      {
        name: "takerFeeBps",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "makerFeeBps",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [
      {
        name: "proxy",
        type: "address",
        internalType: "address"
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "initialize",
    inputs: [
      {
        name: "_owner",
        type: "address",
        internalType: "address"
      },
      {
        name: "_spotBalanceAccount",
        type: "address",
        internalType: "address"
      },
      {
        name: "_spotEngine",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [
      {
        name: "result",
        type: "address",
        internalType: "address"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "ownershipHandoverExpiresAt",
    inputs: [
      {
        name: "pendingOwner",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "result",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "proxiableUUID",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "renounceOwnership",
    inputs: [],
    outputs: [],
    stateMutability: "payable"
  },
  {
    type: "function",
    name: "requestOwnershipHandover",
    inputs: [],
    outputs: [],
    stateMutability: "payable"
  },
  {
    type: "function",
    name: "setAuthority",
    inputs: [
      {
        name: "newAuthority",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "setSpotOrderBookImplementation",
    inputs: [
      {
        name: "newImplementation",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "spotBalanceAccountAddress",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "spotEngineAddress",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "spotOrderBookImplementation",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "toggleSpotMarkets",
    inputs: [
      {
        name: "orderBooks",
        type: "address[]",
        internalType: "address[]"
      },
      {
        name: "state",
        type: "uint8",
        internalType: "enum IBaseOrderBook.MarketState"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "transferOwnership",
    inputs: [
      {
        name: "newOwner",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [],
    stateMutability: "payable"
  },
  {
    type: "function",
    name: "transferOwnershipForContracts",
    inputs: [
      {
        name: "contracts",
        type: "address[]",
        internalType: "address[]"
      },
      {
        name: "newOwner",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "upgradeToAndCall",
    inputs: [
      {
        name: "newImplementation",
        type: "address",
        internalType: "address"
      },
      {
        name: "data",
        type: "bytes",
        internalType: "bytes"
      }
    ],
    outputs: [],
    stateMutability: "payable"
  },
  {
    type: "function",
    name: "verifiedMarket",
    inputs: [
      {
        name: "",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "baseToken",
        type: "address",
        internalType: "address"
      },
      {
        name: "quoteToken",
        type: "address",
        internalType: "address"
      },
      {
        name: "pricePrecision",
        type: "uint32",
        internalType: "uint32"
      },
      {
        name: "sizePrecision",
        type: "uint96",
        internalType: "uint96"
      },
      {
        name: "tickSize",
        type: "uint32",
        internalType: "uint32"
      },
      {
        name: "passiveSpreadTicks",
        type: "uint32",
        internalType: "uint32"
      },
      {
        name: "minQuoteNotional",
        type: "uint96",
        internalType: "uint96"
      },
      {
        name: "maxQuoteNotional",
        type: "uint96",
        internalType: "uint96"
      },
      {
        name: "takerFeeBps",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "makerFeeBps",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "verifiedSpotMarket",
    inputs: [
      {
        name: "",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "whitelistSpotToken",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address"
      },
      {
        name: "status",
        type: "bool",
        internalType: "bool"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "whitelistedSpotTokens",
    inputs: [
      {
        name: "",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "event",
    name: "AuthorityUpdated",
    inputs: [
      {
        name: "oldAuthority",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "newAuthority",
        type: "address",
        indexed: true,
        internalType: "address"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "Initialized",
    inputs: [
      {
        name: "version",
        type: "uint64",
        indexed: false,
        internalType: "uint64"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "OwnershipHandoverCanceled",
    inputs: [
      {
        name: "pendingOwner",
        type: "address",
        indexed: true,
        internalType: "address"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "OwnershipHandoverRequested",
    inputs: [
      {
        name: "pendingOwner",
        type: "address",
        indexed: true,
        internalType: "address"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "OwnershipTransferred",
    inputs: [
      {
        name: "oldOwner",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "newOwner",
        type: "address",
        indexed: true,
        internalType: "address"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "SpotMarketRegistered",
    inputs: [
      {
        name: "orderBook",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "baseToken",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "quoteToken",
        type: "address",
        indexed: true,
        internalType: "address"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "SpotOBImplementationUpdated",
    inputs: [
      {
        name: "oldImplementation",
        type: "address",
        indexed: false,
        internalType: "address"
      },
      {
        name: "newImplementation",
        type: "address",
        indexed: false,
        internalType: "address"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "SpotTokenWhitelisted",
    inputs: [
      {
        name: "token",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "status",
        type: "bool",
        indexed: false,
        internalType: "bool"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "Upgraded",
    inputs: [
      {
        name: "implementation",
        type: "address",
        indexed: true,
        internalType: "address"
      }
    ],
    anonymous: false
  },
  {
    type: "error",
    name: "AlreadyInitialized",
    inputs: []
  },
  {
    type: "error",
    name: "Create2EmptyBytecode",
    inputs: []
  },
  {
    type: "error",
    name: "FailedDeployment",
    inputs: []
  },
  {
    type: "error",
    name: "ImplementationNotChanged",
    inputs: []
  },
  {
    type: "error",
    name: "InsufficientBalance",
    inputs: [
      {
        name: "balance",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "needed",
        type: "uint256",
        internalType: "uint256"
      }
    ]
  },
  {
    type: "error",
    name: "InvalidAuthority",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidInitialization",
    inputs: []
  },
  {
    type: "error",
    name: "MarketNotFound",
    inputs: []
  },
  {
    type: "error",
    name: "NewOwnerIsZeroAddress",
    inputs: []
  },
  {
    type: "error",
    name: "NoHandoverRequest",
    inputs: []
  },
  {
    type: "error",
    name: "NotInitializing",
    inputs: []
  },
  {
    type: "error",
    name: "SpotTokenNotEnabled",
    inputs: []
  },
  {
    type: "error",
    name: "SpotTokenNotWhitelisted",
    inputs: []
  },
  {
    type: "error",
    name: "Unauthorized",
    inputs: []
  },
  {
    type: "error",
    name: "Unauthorized",
    inputs: []
  },
  {
    type: "error",
    name: "UnauthorizedCallContext",
    inputs: []
  },
  {
    type: "error",
    name: "UpgradeFailed",
    inputs: []
  },
  {
    type: "error",
    name: "ZeroAddress",
    inputs: []
  }
] as const satisfies Abi;

export const spotEngineAbi = [
  {
    type: "constructor",
    inputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "addMarket",
    inputs: [
      {
        name: "orderBook",
        type: "address",
        internalType: "address"
      },
      {
        name: "baseToken",
        type: "address",
        internalType: "address"
      },
      {
        name: "quoteToken",
        type: "address",
        internalType: "address"
      },
      {
        name: "sizePrecision",
        type: "uint96",
        internalType: "uint96"
      },
      {
        name: "pricePrecision",
        type: "uint32",
        internalType: "uint32"
      },
      {
        name: "tickSize",
        type: "uint32",
        internalType: "uint32"
      },
      {
        name: "passiveSpreadTicks",
        type: "uint32",
        internalType: "uint32"
      },
      {
        name: "minQuoteNotional",
        type: "uint96",
        internalType: "uint96"
      },
      {
        name: "maxQuoteNotional",
        type: "uint96",
        internalType: "uint96"
      },
      {
        name: "takerFeeBps",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "makerFeeBps",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "authority",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "cancelOwnershipHandover",
    inputs: [],
    outputs: [],
    stateMutability: "payable"
  },
  {
    type: "function",
    name: "completeOwnershipHandover",
    inputs: [
      {
        name: "pendingOwner",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [],
    stateMutability: "payable"
  },
  {
    type: "function",
    name: "getMarketConfig",
    inputs: [
      {
        name: "orderBook",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "config",
        type: "tuple",
        internalType: "struct ISpotEngine.SpotMarketConfig",
        components: [
          {
            name: "baseToken",
            type: "address",
            internalType: "address"
          },
          {
            name: "quoteToken",
            type: "address",
            internalType: "address"
          },
          {
            name: "sizePrecision",
            type: "uint96",
            internalType: "uint96"
          },
          {
            name: "pricePrecision",
            type: "uint32",
            internalType: "uint32"
          },
          {
            name: "tickSize",
            type: "uint32",
            internalType: "uint32"
          },
          {
            name: "passiveSpreadTicks",
            type: "uint32",
            internalType: "uint32"
          },
          {
            name: "minQuoteNotional",
            type: "uint96",
            internalType: "uint96"
          },
          {
            name: "maxQuoteNotional",
            type: "uint96",
            internalType: "uint96"
          },
          {
            name: "takerFeeBps",
            type: "uint256",
            internalType: "uint256"
          },
          {
            name: "makerFeeBps",
            type: "uint256",
            internalType: "uint256"
          },
          {
            name: "active",
            type: "bool",
            internalType: "bool"
          }
        ]
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "initialize",
    inputs: [
      {
        name: "_owner",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "marketExists",
    inputs: [
      {
        name: "orderBook",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [
      {
        name: "result",
        type: "address",
        internalType: "address"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "ownershipHandoverExpiresAt",
    inputs: [
      {
        name: "pendingOwner",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "result",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "proxiableUUID",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "renounceOwnership",
    inputs: [],
    outputs: [],
    stateMutability: "payable"
  },
  {
    type: "function",
    name: "requestOwnershipHandover",
    inputs: [],
    outputs: [],
    stateMutability: "payable"
  },
  {
    type: "function",
    name: "setAuthority",
    inputs: [
      {
        name: "newAuthority",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "setMarketActive",
    inputs: [
      {
        name: "orderBook",
        type: "address",
        internalType: "address"
      },
      {
        name: "active",
        type: "bool",
        internalType: "bool"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "transferOwnership",
    inputs: [
      {
        name: "newOwner",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [],
    stateMutability: "payable"
  },
  {
    type: "function",
    name: "upgradeToAndCall",
    inputs: [
      {
        name: "newImplementation",
        type: "address",
        internalType: "address"
      },
      {
        name: "data",
        type: "bytes",
        internalType: "bytes"
      }
    ],
    outputs: [],
    stateMutability: "payable"
  },
  {
    type: "event",
    name: "AuthorityUpdated",
    inputs: [
      {
        name: "oldAuthority",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "newAuthority",
        type: "address",
        indexed: true,
        internalType: "address"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "Initialized",
    inputs: [
      {
        name: "version",
        type: "uint64",
        indexed: false,
        internalType: "uint64"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "OwnershipHandoverCanceled",
    inputs: [
      {
        name: "pendingOwner",
        type: "address",
        indexed: true,
        internalType: "address"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "OwnershipHandoverRequested",
    inputs: [
      {
        name: "pendingOwner",
        type: "address",
        indexed: true,
        internalType: "address"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "OwnershipTransferred",
    inputs: [
      {
        name: "oldOwner",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "newOwner",
        type: "address",
        indexed: true,
        internalType: "address"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "SpotMarketActiveUpdated",
    inputs: [
      {
        name: "orderBook",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "active",
        type: "bool",
        indexed: false,
        internalType: "bool"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "SpotMarketAdded",
    inputs: [
      {
        name: "orderBook",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "baseToken",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "quoteToken",
        type: "address",
        indexed: true,
        internalType: "address"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "Upgraded",
    inputs: [
      {
        name: "implementation",
        type: "address",
        indexed: true,
        internalType: "address"
      }
    ],
    anonymous: false
  },
  {
    type: "error",
    name: "AlreadyInitialized",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidAuthority",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidCollateral",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidInitialization",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidMarketConfig",
    inputs: []
  },
  {
    type: "error",
    name: "MarketAlreadyExists",
    inputs: []
  },
  {
    type: "error",
    name: "MarketFeeError",
    inputs: []
  },
  {
    type: "error",
    name: "MarketNotFound",
    inputs: []
  },
  {
    type: "error",
    name: "MarketSizeError",
    inputs: []
  },
  {
    type: "error",
    name: "NewOwnerIsZeroAddress",
    inputs: []
  },
  {
    type: "error",
    name: "NoHandoverRequest",
    inputs: []
  },
  {
    type: "error",
    name: "NotInitializing",
    inputs: []
  },
  {
    type: "error",
    name: "Unauthorized",
    inputs: []
  },
  {
    type: "error",
    name: "Unauthorized",
    inputs: []
  },
  {
    type: "error",
    name: "UnauthorizedCallContext",
    inputs: []
  },
  {
    type: "error",
    name: "UpgradeFailed",
    inputs: []
  },
  {
    type: "error",
    name: "ZeroAddress",
    inputs: []
  }
] as const satisfies Abi;

export const spotOrderBookAbi = [
  {
    type: "constructor",
    inputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "__applyPostFillHookDecision",
    inputs: [
      {
        name: "refresh",
        type: "tuple",
        internalType: "struct BaseOrderBook.PostFillRefresh",
        components: [
          {
            name: "makerId",
            type: "uint40",
            internalType: "uint40"
          },
          {
            name: "filledSlotIdx",
            type: "uint8",
            internalType: "uint8"
          },
          {
            name: "filledOrderId",
            type: "uint64",
            internalType: "uint64"
          },
          {
            name: "maker",
            type: "address",
            internalType: "address"
          },
          {
            name: "filledOrderIsBuy",
            type: "bool",
            internalType: "bool"
          },
          {
            name: "header",
            type: "uint256",
            internalType: "uint256"
          },
          {
            name: "replenishWord",
            type: "uint256",
            internalType: "uint256"
          },
          {
            name: "replacementWord",
            type: "uint256",
            internalType: "uint256"
          }
        ]
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "accountCore",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract IAccountCore"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "accountCoreAddress",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "authority",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "baseToken",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "batch",
    inputs: [
      {
        name: "userId",
        type: "uint40",
        internalType: "uint40"
      },
      {
        name: "orders",
        type: "tuple[]",
        internalType: "struct ISpotOrderBook.NativeOrder[]",
        components: [
          {
            name: "side",
            type: "uint8",
            internalType: "enum ISpotOrderBook.NativeSide"
          },
          {
            name: "quantity",
            type: "uint96",
            internalType: "uint96"
          },
          {
            name: "price",
            type: "uint32",
            internalType: "uint32"
          },
          {
            name: "tif",
            type: "uint8",
            internalType: "enum ISpotOrderBook.NativeTif"
          },
          {
            name: "executionInstruction",
            type: "uint8",
            internalType: "enum ISpotOrderBook.NativeExecInstruction"
          },
          {
            name: "minSizeAfterBlock",
            type: "uint32",
            internalType: "uint32"
          }
        ]
      },
      {
        name: "cancelSlotIdxs",
        type: "uint8[]",
        internalType: "uint8[]"
      },
      {
        name: "clientOrderId",
        type: "bytes32",
        internalType: "bytes32"
      },
      {
        name: "builderConfig",
        type: "tuple",
        internalType: "struct ISpotOrderBook.BuilderConfig",
        components: [
          {
            name: "builder",
            type: "address",
            internalType: "address"
          },
          {
            name: "feeBps",
            type: "uint16",
            internalType: "uint16"
          }
        ]
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "batch",
    inputs: [
      {
        name: "userId",
        type: "uint40",
        internalType: "uint40"
      },
      {
        name: "orders",
        type: "tuple[]",
        internalType: "struct ISpotOrderBook.NativeOrder[]",
        components: [
          {
            name: "side",
            type: "uint8",
            internalType: "enum ISpotOrderBook.NativeSide"
          },
          {
            name: "quantity",
            type: "uint96",
            internalType: "uint96"
          },
          {
            name: "price",
            type: "uint32",
            internalType: "uint32"
          },
          {
            name: "tif",
            type: "uint8",
            internalType: "enum ISpotOrderBook.NativeTif"
          },
          {
            name: "executionInstruction",
            type: "uint8",
            internalType: "enum ISpotOrderBook.NativeExecInstruction"
          },
          {
            name: "minSizeAfterBlock",
            type: "uint32",
            internalType: "uint32"
          }
        ]
      },
      {
        name: "cancelSlotIdxs",
        type: "uint8[]",
        internalType: "uint8[]"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "batch",
    inputs: [
      {
        name: "userId",
        type: "uint40",
        internalType: "uint40"
      },
      {
        name: "orders",
        type: "tuple[]",
        internalType: "struct ISpotOrderBook.NativeOrder[]",
        components: [
          {
            name: "side",
            type: "uint8",
            internalType: "enum ISpotOrderBook.NativeSide"
          },
          {
            name: "quantity",
            type: "uint96",
            internalType: "uint96"
          },
          {
            name: "price",
            type: "uint32",
            internalType: "uint32"
          },
          {
            name: "tif",
            type: "uint8",
            internalType: "enum ISpotOrderBook.NativeTif"
          },
          {
            name: "executionInstruction",
            type: "uint8",
            internalType: "enum ISpotOrderBook.NativeExecInstruction"
          },
          {
            name: "minSizeAfterBlock",
            type: "uint32",
            internalType: "uint32"
          }
        ]
      },
      {
        name: "cancelSlotIdxs",
        type: "uint8[]",
        internalType: "uint8[]"
      },
      {
        name: "builderConfig",
        type: "tuple",
        internalType: "struct ISpotOrderBook.BuilderConfig",
        components: [
          {
            name: "builder",
            type: "address",
            internalType: "address"
          },
          {
            name: "feeBps",
            type: "uint16",
            internalType: "uint16"
          }
        ]
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "batch",
    inputs: [
      {
        name: "userId",
        type: "uint40",
        internalType: "uint40"
      },
      {
        name: "orders",
        type: "tuple[]",
        internalType: "struct ISpotOrderBook.NativeOrder[]",
        components: [
          {
            name: "side",
            type: "uint8",
            internalType: "enum ISpotOrderBook.NativeSide"
          },
          {
            name: "quantity",
            type: "uint96",
            internalType: "uint96"
          },
          {
            name: "price",
            type: "uint32",
            internalType: "uint32"
          },
          {
            name: "tif",
            type: "uint8",
            internalType: "enum ISpotOrderBook.NativeTif"
          },
          {
            name: "executionInstruction",
            type: "uint8",
            internalType: "enum ISpotOrderBook.NativeExecInstruction"
          },
          {
            name: "minSizeAfterBlock",
            type: "uint32",
            internalType: "uint32"
          }
        ]
      },
      {
        name: "cancelSlotIdxs",
        type: "uint8[]",
        internalType: "uint8[]"
      },
      {
        name: "clientOrderId",
        type: "bytes32",
        internalType: "bytes32"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "batchMintPassiveLiquidity",
    inputs: [
      {
        name: "userId",
        type: "uint40",
        internalType: "uint40"
      },
      {
        name: "mints",
        type: "tuple[]",
        internalType: "struct ISpotOrderBook.PassiveMintParams[]",
        components: [
          {
            name: "lowPrice",
            type: "uint32",
            internalType: "uint32"
          },
          {
            name: "baseAmount",
            type: "uint128",
            internalType: "uint128"
          },
          {
            name: "quoteAmount",
            type: "uint128",
            internalType: "uint128"
          },
          {
            name: "minSharesOut",
            type: "uint128",
            internalType: "uint128"
          }
        ]
      },
      {
        name: "deadline",
        type: "uint64",
        internalType: "uint64"
      },
      {
        name: "clientOrderId",
        type: "bytes32",
        internalType: "bytes32"
      }
    ],
    outputs: [
      {
        name: "results",
        type: "tuple[]",
        internalType: "struct ISpotOrderBook.PassiveMintResult[]",
        components: [
          {
            name: "positionId",
            type: "uint64",
            internalType: "uint64"
          },
          {
            name: "sharesOut",
            type: "uint128",
            internalType: "uint128"
          },
          {
            name: "baseUsed",
            type: "uint128",
            internalType: "uint128"
          },
          {
            name: "quoteUsed",
            type: "uint128",
            internalType: "uint128"
          }
        ]
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "bestBidAsk",
    inputs: [],
    outputs: [
      {
        name: "bid",
        type: "uint32",
        internalType: "uint32"
      },
      {
        name: "ask",
        type: "uint32",
        internalType: "uint32"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "burnPassiveLiquidity",
    inputs: [
      {
        name: "userId",
        type: "uint40",
        internalType: "uint40"
      },
      {
        name: "positionId",
        type: "uint64",
        internalType: "uint64"
      },
      {
        name: "sharesToBurn",
        type: "uint128",
        internalType: "uint128"
      },
      {
        name: "clientOrderId",
        type: "bytes32",
        internalType: "bytes32"
      }
    ],
    outputs: [
      {
        name: "basePrincipalOut",
        type: "uint128",
        internalType: "uint128"
      },
      {
        name: "quotePrincipalOut",
        type: "uint128",
        internalType: "uint128"
      },
      {
        name: "baseFeeOut",
        type: "uint128",
        internalType: "uint128"
      },
      {
        name: "quoteFeeOut",
        type: "uint128",
        internalType: "uint128"
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "cancelAllOrders",
    inputs: [
      {
        name: "userId",
        type: "uint40",
        internalType: "uint40"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "claimPassiveFees",
    inputs: [
      {
        name: "userId",
        type: "uint40",
        internalType: "uint40"
      },
      {
        name: "positionId",
        type: "uint64",
        internalType: "uint64"
      },
      {
        name: "clientOrderId",
        type: "bytes32",
        internalType: "bytes32"
      }
    ],
    outputs: [
      {
        name: "baseFeeOut",
        type: "uint128",
        internalType: "uint128"
      },
      {
        name: "quoteFeeOut",
        type: "uint128",
        internalType: "uint128"
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "estimateSwap",
    inputs: [
      {
        name: "isBuy",
        type: "bool",
        internalType: "bool"
      },
      {
        name: "amountIn",
        type: "uint128",
        internalType: "uint128"
      },
      {
        name: "limitPrice",
        type: "uint32",
        internalType: "uint32"
      }
    ],
    outputs: [
      {
        name: "result",
        type: "tuple",
        internalType: "struct ISpotOrderBook.SwapResult",
        components: [
          {
            name: "amountInUsed",
            type: "uint128",
            internalType: "uint128"
          },
          {
            name: "amountOut",
            type: "uint128",
            internalType: "uint128"
          }
        ]
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "estimateSwap",
    inputs: [
      {
        name: "isBuy",
        type: "bool",
        internalType: "bool"
      },
      {
        name: "amountIn",
        type: "uint128",
        internalType: "uint128"
      },
      {
        name: "limitPrice",
        type: "uint32",
        internalType: "uint32"
      },
      {
        name: "builderFeeBps",
        type: "uint16",
        internalType: "uint16"
      }
    ],
    outputs: [
      {
        name: "result",
        type: "tuple",
        internalType: "struct ISpotOrderBook.SwapResult",
        components: [
          {
            name: "amountInUsed",
            type: "uint128",
            internalType: "uint128"
          },
          {
            name: "amountOut",
            type: "uint128",
            internalType: "uint128"
          }
        ]
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getDesignatedOperator",
    inputs: [
      {
        name: "makerId",
        type: "uint40",
        internalType: "uint40"
      }
    ],
    outputs: [
      {
        name: "operator",
        type: "address",
        internalType: "address"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getL2Book",
    inputs: [
      {
        name: "levels",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [
      {
        name: "bidPrices",
        type: "uint32[]",
        internalType: "uint32[]"
      },
      {
        name: "bidSizes",
        type: "uint96[]",
        internalType: "uint96[]"
      },
      {
        name: "askPrices",
        type: "uint32[]",
        internalType: "uint32[]"
      },
      {
        name: "askSizes",
        type: "uint96[]",
        internalType: "uint96[]"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getMarketParams",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint32",
        internalType: "uint32"
      },
      {
        name: "",
        type: "uint96",
        internalType: "uint96"
      },
      {
        name: "",
        type: "uint32",
        internalType: "uint32"
      },
      {
        name: "",
        type: "uint96",
        internalType: "uint96"
      },
      {
        name: "",
        type: "uint96",
        internalType: "uint96"
      },
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getOrderId",
    inputs: [
      {
        name: "makerId",
        type: "uint40",
        internalType: "uint40"
      },
      {
        name: "slotIdx",
        type: "uint8",
        internalType: "uint8"
      }
    ],
    outputs: [
      {
        name: "orderId",
        type: "uint64",
        internalType: "uint64"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getOrderMinSizeAfterBlock",
    inputs: [
      {
        name: "makerId",
        type: "uint40",
        internalType: "uint40"
      },
      {
        name: "slotIdx",
        type: "uint8",
        internalType: "uint8"
      }
    ],
    outputs: [
      {
        name: "minSizeAfterBlock",
        type: "uint32",
        internalType: "uint32"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getPassiveBand",
    inputs: [
      {
        name: "lowPrice",
        type: "uint32",
        internalType: "uint32"
      }
    ],
    outputs: [
      {
        name: "band",
        type: "tuple",
        internalType: "struct ISpotOrderBook.PassiveBandView",
        components: [
          {
            name: "lowPrice",
            type: "uint32",
            internalType: "uint32"
          },
          {
            name: "highPrice",
            type: "uint32",
            internalType: "uint32"
          },
          {
            name: "quoteAtLow",
            type: "uint128",
            internalType: "uint128"
          },
          {
            name: "baseAtHigh",
            type: "uint128",
            internalType: "uint128"
          },
          {
            name: "totalShares",
            type: "uint128",
            internalType: "uint128"
          },
          {
            name: "feeGrowthBasePerShareX128",
            type: "uint256",
            internalType: "uint256"
          },
          {
            name: "feeGrowthQuotePerShareX128",
            type: "uint256",
            internalType: "uint256"
          }
        ]
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getPassivePosition",
    inputs: [
      {
        name: "positionId",
        type: "uint64",
        internalType: "uint64"
      }
    ],
    outputs: [
      {
        name: "position",
        type: "tuple",
        internalType: "struct ISpotOrderBook.PassivePositionView",
        components: [
          {
            name: "owner",
            type: "address",
            internalType: "address"
          },
          {
            name: "lowPrice",
            type: "uint32",
            internalType: "uint32"
          },
          {
            name: "highPrice",
            type: "uint32",
            internalType: "uint32"
          },
          {
            name: "shares",
            type: "uint128",
            internalType: "uint128"
          },
          {
            name: "lastFeeGrowthBaseX128",
            type: "uint256",
            internalType: "uint256"
          },
          {
            name: "lastFeeGrowthQuoteX128",
            type: "uint256",
            internalType: "uint256"
          }
        ]
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getPostFillHook",
    inputs: [
      {
        name: "makerId",
        type: "uint40",
        internalType: "uint40"
      }
    ],
    outputs: [
      {
        name: "hook",
        type: "address",
        internalType: "address"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "initialize",
    inputs: [
      {
        name: "_owner",
        type: "address",
        internalType: "address"
      },
      {
        name: "_spotBalanceAccount",
        type: "address",
        internalType: "address"
      },
      {
        name: "_spotEngine",
        type: "address",
        internalType: "address"
      },
      {
        name: "_baseToken",
        type: "address",
        internalType: "address"
      },
      {
        name: "_quoteToken",
        type: "address",
        internalType: "address"
      },
      {
        name: "_sizePrecision",
        type: "uint96",
        internalType: "uint96"
      },
      {
        name: "_pricePrecision",
        type: "uint32",
        internalType: "uint32"
      },
      {
        name: "_tickSize",
        type: "uint32",
        internalType: "uint32"
      },
      {
        name: "_passiveSpreadTicks",
        type: "uint32",
        internalType: "uint32"
      },
      {
        name: "_minQuoteNotional",
        type: "uint96",
        internalType: "uint96"
      },
      {
        name: "_maxQuoteNotional",
        type: "uint96",
        internalType: "uint96"
      },
      {
        name: "_takerFeeBps",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "_makerFeeBps",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "lastTradeObservation",
    inputs: [],
    outputs: [
      {
        name: "priceX8",
        type: "uint64",
        internalType: "uint64"
      },
      {
        name: "timestamp",
        type: "uint32",
        internalType: "uint32"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "makerFeeBps",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "marketState",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint8",
        internalType: "enum IBaseOrderBook.MarketState"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "maxQuoteNotional",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint96",
        internalType: "uint96"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "minQuoteNotional",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint96",
        internalType: "uint96"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "mintPassiveLiquidity",
    inputs: [
      {
        name: "userId",
        type: "uint40",
        internalType: "uint40"
      },
      {
        name: "lowPrice",
        type: "uint32",
        internalType: "uint32"
      },
      {
        name: "baseAmount",
        type: "uint128",
        internalType: "uint128"
      },
      {
        name: "quoteAmount",
        type: "uint128",
        internalType: "uint128"
      },
      {
        name: "clientOrderId",
        type: "bytes32",
        internalType: "bytes32"
      }
    ],
    outputs: [
      {
        name: "positionId",
        type: "uint64",
        internalType: "uint64"
      },
      {
        name: "sharesOut",
        type: "uint128",
        internalType: "uint128"
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "mintPassiveLiquidity",
    inputs: [
      {
        name: "userId",
        type: "uint40",
        internalType: "uint40"
      },
      {
        name: "lowPrice",
        type: "uint32",
        internalType: "uint32"
      },
      {
        name: "baseAmount",
        type: "uint128",
        internalType: "uint128"
      },
      {
        name: "quoteAmount",
        type: "uint128",
        internalType: "uint128"
      },
      {
        name: "minSharesOut",
        type: "uint128",
        internalType: "uint128"
      },
      {
        name: "deadline",
        type: "uint64",
        internalType: "uint64"
      },
      {
        name: "clientOrderId",
        type: "bytes32",
        internalType: "bytes32"
      }
    ],
    outputs: [
      {
        name: "positionId",
        type: "uint64",
        internalType: "uint64"
      },
      {
        name: "sharesOut",
        type: "uint128",
        internalType: "uint128"
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "passiveSpreadTicks",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint32",
        internalType: "uint32"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "postFillHookGasLimit",
    inputs: [],
    outputs: [
      {
        name: "gasLimit",
        type: "uint64",
        internalType: "uint64"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "postFillHookMinQuoteNotional",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint96",
        internalType: "uint96"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "pricePrecision",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint32",
        internalType: "uint32"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "primeMakerPage",
    inputs: [
      {
        name: "makerId",
        type: "uint40",
        internalType: "uint40"
      },
      {
        name: "slotsToPrime",
        type: "uint8",
        internalType: "uint8"
      }
    ],
    outputs: [
      {
        name: "primedCount",
        type: "uint8",
        internalType: "uint8"
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "primeQueuePages",
    inputs: [
      {
        name: "centerPrice",
        type: "uint32",
        internalType: "uint32"
      },
      {
        name: "groupsAround",
        type: "uint8",
        internalType: "uint8"
      },
      {
        name: "wordsPerGroup",
        type: "uint8",
        internalType: "uint8"
      }
    ],
    outputs: [
      {
        name: "pagesPrimed",
        type: "uint16",
        internalType: "uint16"
      },
      {
        name: "wordsPrimed",
        type: "uint32",
        internalType: "uint32"
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "protocolCancelBySlots",
    inputs: [
      {
        name: "userId",
        type: "uint40",
        internalType: "uint40"
      },
      {
        name: "slotIdxs",
        type: "uint8[]",
        internalType: "uint8[]"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "protocolCancelBySlots",
    inputs: [
      {
        name: "userId",
        type: "uint40",
        internalType: "uint40"
      },
      {
        name: "slotIdxs",
        type: "uint8[]",
        internalType: "uint8[]"
      },
      {
        name: "clientOrderId",
        type: "bytes32",
        internalType: "bytes32"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "proxiableUUID",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "quoteToken",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "quoteTokenDecimals",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint8",
        internalType: "uint8"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "replaceBySlotPacked",
    inputs: [
      {
        name: "userId",
        type: "uint40",
        internalType: "uint40"
      },
      {
        name: "packedOps",
        type: "bytes",
        internalType: "bytes"
      },
      {
        name: "builderConfig",
        type: "tuple",
        internalType: "struct ISpotOrderBook.BuilderConfig",
        components: [
          {
            name: "builder",
            type: "address",
            internalType: "address"
          },
          {
            name: "feeBps",
            type: "uint16",
            internalType: "uint16"
          }
        ]
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "replaceBySlotPacked",
    inputs: [
      {
        name: "userId",
        type: "uint40",
        internalType: "uint40"
      },
      {
        name: "packedOps",
        type: "bytes",
        internalType: "bytes"
      },
      {
        name: "clientOrderId",
        type: "bytes32",
        internalType: "bytes32"
      },
      {
        name: "builderConfig",
        type: "tuple",
        internalType: "struct ISpotOrderBook.BuilderConfig",
        components: [
          {
            name: "builder",
            type: "address",
            internalType: "address"
          },
          {
            name: "feeBps",
            type: "uint16",
            internalType: "uint16"
          }
        ]
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "replaceBySlotPacked",
    inputs: [
      {
        name: "userId",
        type: "uint40",
        internalType: "uint40"
      },
      {
        name: "packedOps",
        type: "bytes",
        internalType: "bytes"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "replaceBySlotPacked",
    inputs: [
      {
        name: "userId",
        type: "uint40",
        internalType: "uint40"
      },
      {
        name: "packedOps",
        type: "bytes",
        internalType: "bytes"
      },
      {
        name: "clientOrderId",
        type: "bytes32",
        internalType: "bytes32"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "setAuthority",
    inputs: [
      {
        name: "newAuthority",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "setDesignatedOperator",
    inputs: [
      {
        name: "makerId",
        type: "uint40",
        internalType: "uint40"
      },
      {
        name: "operator",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "setPostFillHook",
    inputs: [
      {
        name: "makerId",
        type: "uint40",
        internalType: "uint40"
      },
      {
        name: "hook",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "setPostFillHookGasLimit",
    inputs: [
      {
        name: "gasLimit",
        type: "uint64",
        internalType: "uint64"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "setPostFillHookMinQuoteNotional",
    inputs: [
      {
        name: "newMinQuoteNotional",
        type: "uint96",
        internalType: "uint96"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "sizePrecision",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint96",
        internalType: "uint96"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "spotBalanceAccount",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract ISpotBalanceAccount"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "spotBalanceAccountAddress",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "spotEngine",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract ISpotEngine"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "spotEngineAddress",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "swap",
    inputs: [
      {
        name: "userId",
        type: "uint40",
        internalType: "uint40"
      },
      {
        name: "isBuy",
        type: "bool",
        internalType: "bool"
      },
      {
        name: "amountIn",
        type: "uint128",
        internalType: "uint128"
      },
      {
        name: "minAmountOut",
        type: "uint128",
        internalType: "uint128"
      },
      {
        name: "limitPrice",
        type: "uint32",
        internalType: "uint32"
      },
      {
        name: "deadline",
        type: "uint64",
        internalType: "uint64"
      },
      {
        name: "builderConfig",
        type: "tuple",
        internalType: "struct ISpotOrderBook.BuilderConfig",
        components: [
          {
            name: "builder",
            type: "address",
            internalType: "address"
          },
          {
            name: "feeBps",
            type: "uint16",
            internalType: "uint16"
          }
        ]
      }
    ],
    outputs: [
      {
        name: "result",
        type: "tuple",
        internalType: "struct ISpotOrderBook.SwapResult",
        components: [
          {
            name: "amountInUsed",
            type: "uint128",
            internalType: "uint128"
          },
          {
            name: "amountOut",
            type: "uint128",
            internalType: "uint128"
          }
        ]
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "swap",
    inputs: [
      {
        name: "userId",
        type: "uint40",
        internalType: "uint40"
      },
      {
        name: "isBuy",
        type: "bool",
        internalType: "bool"
      },
      {
        name: "amountIn",
        type: "uint128",
        internalType: "uint128"
      },
      {
        name: "minAmountOut",
        type: "uint128",
        internalType: "uint128"
      },
      {
        name: "limitPrice",
        type: "uint32",
        internalType: "uint32"
      },
      {
        name: "deadline",
        type: "uint64",
        internalType: "uint64"
      }
    ],
    outputs: [
      {
        name: "result",
        type: "tuple",
        internalType: "struct ISpotOrderBook.SwapResult",
        components: [
          {
            name: "amountInUsed",
            type: "uint128",
            internalType: "uint128"
          },
          {
            name: "amountOut",
            type: "uint128",
            internalType: "uint128"
          }
        ]
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "takerFeeBps",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "tickSize",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint32",
        internalType: "uint32"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "toggleMarket",
    inputs: [
      {
        name: "_state",
        type: "uint8",
        internalType: "enum IBaseOrderBook.MarketState"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "transferOwnership",
    inputs: [
      {
        name: "_newOwner",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "upgradeToAndCall",
    inputs: [
      {
        name: "newImplementation",
        type: "address",
        internalType: "address"
      },
      {
        name: "data",
        type: "bytes",
        internalType: "bytes"
      }
    ],
    outputs: [],
    stateMutability: "payable"
  },
  {
    type: "event",
    name: "AuthorityUpdated",
    inputs: [
      {
        name: "oldAuthority",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "newAuthority",
        type: "address",
        indexed: true,
        internalType: "address"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "BookUpdatesPacked",
    inputs: [
      {
        name: "account",
        type: "address",
        indexed: false,
        internalType: "address"
      },
      {
        name: "clientOrderId",
        type: "bytes32",
        indexed: false,
        internalType: "bytes32"
      },
      {
        name: "packedUpdates",
        type: "bytes",
        indexed: false,
        internalType: "bytes"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "DesignatedOperatorUpdated",
    inputs: [
      {
        name: "maker",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "makerId",
        type: "uint40",
        indexed: true,
        internalType: "uint40"
      },
      {
        name: "operator",
        type: "address",
        indexed: true,
        internalType: "address"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "Initialized",
    inputs: [
      {
        name: "version",
        type: "uint64",
        indexed: false,
        internalType: "uint64"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "MakerPagePrimed",
    inputs: [
      {
        name: "maker",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "makerId",
        type: "uint40",
        indexed: true,
        internalType: "uint40"
      },
      {
        name: "primedCount",
        type: "uint8",
        indexed: false,
        internalType: "uint8"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "MakerRegistered",
    inputs: [
      {
        name: "maker",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "makerId",
        type: "uint40",
        indexed: false,
        internalType: "uint40"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "MarketStateUpdated",
    inputs: [
      {
        name: "previousState",
        type: "uint8",
        indexed: false,
        internalType: "enum IBaseOrderBook.MarketState"
      },
      {
        name: "newState",
        type: "uint8",
        indexed: false,
        internalType: "enum IBaseOrderBook.MarketState"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "PassiveBandUpdated",
    inputs: [
      {
        name: "lowPrice",
        type: "uint32",
        indexed: true,
        internalType: "uint32"
      },
      {
        name: "baseAtHigh",
        type: "uint128",
        indexed: false,
        internalType: "uint128"
      },
      {
        name: "quoteAtLow",
        type: "uint128",
        indexed: false,
        internalType: "uint128"
      },
      {
        name: "totalShares",
        type: "uint128",
        indexed: false,
        internalType: "uint128"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "PassiveFeesClaimed",
    inputs: [
      {
        name: "provider",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "userId",
        type: "uint40",
        indexed: true,
        internalType: "uint40"
      },
      {
        name: "positionId",
        type: "uint64",
        indexed: true,
        internalType: "uint64"
      },
      {
        name: "baseFeeOut",
        type: "uint128",
        indexed: false,
        internalType: "uint128"
      },
      {
        name: "quoteFeeOut",
        type: "uint128",
        indexed: false,
        internalType: "uint128"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "PassiveLiquidityBurned",
    inputs: [
      {
        name: "provider",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "userId",
        type: "uint40",
        indexed: true,
        internalType: "uint40"
      },
      {
        name: "positionId",
        type: "uint64",
        indexed: true,
        internalType: "uint64"
      },
      {
        name: "sharesBurned",
        type: "uint128",
        indexed: false,
        internalType: "uint128"
      },
      {
        name: "basePrincipalOut",
        type: "uint128",
        indexed: false,
        internalType: "uint128"
      },
      {
        name: "quotePrincipalOut",
        type: "uint128",
        indexed: false,
        internalType: "uint128"
      },
      {
        name: "baseFeeOut",
        type: "uint128",
        indexed: false,
        internalType: "uint128"
      },
      {
        name: "quoteFeeOut",
        type: "uint128",
        indexed: false,
        internalType: "uint128"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "PassiveLiquidityMinted",
    inputs: [
      {
        name: "provider",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "userId",
        type: "uint40",
        indexed: true,
        internalType: "uint40"
      },
      {
        name: "positionId",
        type: "uint64",
        indexed: true,
        internalType: "uint64"
      },
      {
        name: "lowPrice",
        type: "uint32",
        indexed: false,
        internalType: "uint32"
      },
      {
        name: "baseAmount",
        type: "uint128",
        indexed: false,
        internalType: "uint128"
      },
      {
        name: "quoteAmount",
        type: "uint128",
        indexed: false,
        internalType: "uint128"
      },
      {
        name: "shares",
        type: "uint128",
        indexed: false,
        internalType: "uint128"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "PassiveTrade",
    inputs: [
      {
        name: "taker",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "takerIsBuy",
        type: "bool",
        indexed: true,
        internalType: "bool"
      },
      {
        name: "lowPrice",
        type: "uint32",
        indexed: true,
        internalType: "uint32"
      },
      {
        name: "price",
        type: "uint32",
        indexed: false,
        internalType: "uint32"
      },
      {
        name: "baseFilled",
        type: "uint96",
        indexed: false,
        internalType: "uint96"
      },
      {
        name: "quoteAmount",
        type: "uint128",
        indexed: false,
        internalType: "uint128"
      },
      {
        name: "baseAtHighAfter",
        type: "uint128",
        indexed: false,
        internalType: "uint128"
      },
      {
        name: "quoteAtLowAfter",
        type: "uint128",
        indexed: false,
        internalType: "uint128"
      },
      {
        name: "clientOrderId",
        type: "bytes32",
        indexed: false,
        internalType: "bytes32"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "PostFillHookGasLimitUpdated",
    inputs: [
      {
        name: "oldGasLimit",
        type: "uint64",
        indexed: false,
        internalType: "uint64"
      },
      {
        name: "newGasLimit",
        type: "uint64",
        indexed: false,
        internalType: "uint64"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "PostFillHookMinQuoteNotionalUpdated",
    inputs: [
      {
        name: "oldMinQuoteNotional",
        type: "uint96",
        indexed: false,
        internalType: "uint96"
      },
      {
        name: "newMinQuoteNotional",
        type: "uint96",
        indexed: false,
        internalType: "uint96"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "PostFillHookUpdated",
    inputs: [
      {
        name: "maker",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "makerId",
        type: "uint40",
        indexed: true,
        internalType: "uint40"
      },
      {
        name: "hook",
        type: "address",
        indexed: true,
        internalType: "address"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "QueuePagesPrimed",
    inputs: [
      {
        name: "caller",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "centerPrice",
        type: "uint32",
        indexed: true,
        internalType: "uint32"
      },
      {
        name: "groupsAround",
        type: "uint8",
        indexed: false,
        internalType: "uint8"
      },
      {
        name: "wordsPerGroup",
        type: "uint8",
        indexed: false,
        internalType: "uint8"
      },
      {
        name: "pagesPrimed",
        type: "uint16",
        indexed: false,
        internalType: "uint16"
      },
      {
        name: "wordsPrimed",
        type: "uint32",
        indexed: false,
        internalType: "uint32"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "SpotSwap",
    inputs: [
      {
        name: "account",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "userId",
        type: "uint40",
        indexed: true,
        internalType: "uint40"
      },
      {
        name: "isBuy",
        type: "bool",
        indexed: true,
        internalType: "bool"
      },
      {
        name: "amountInUsed",
        type: "uint128",
        indexed: false,
        internalType: "uint128"
      },
      {
        name: "amountOut",
        type: "uint128",
        indexed: false,
        internalType: "uint128"
      },
      {
        name: "limitPrice",
        type: "uint32",
        indexed: false,
        internalType: "uint32"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "TradesPacked",
    inputs: [
      {
        name: "account",
        type: "address",
        indexed: false,
        internalType: "address"
      },
      {
        name: "clientOrderId",
        type: "bytes32",
        indexed: false,
        internalType: "bytes32"
      },
      {
        name: "packedTrades",
        type: "bytes",
        indexed: false,
        internalType: "bytes"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "Upgraded",
    inputs: [
      {
        name: "implementation",
        type: "address",
        indexed: true,
        internalType: "address"
      }
    ],
    anonymous: false
  },
  {
    type: "error",
    name: "BuilderFeeTooHigh",
    inputs: []
  },
  {
    type: "error",
    name: "DuplicatePackedReplaceSlot",
    inputs: []
  },
  {
    type: "error",
    name: "InsufficientBalance",
    inputs: []
  },
  {
    type: "error",
    name: "InsufficientLiquidity",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidAuthority",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidCollateral",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidExpireTime",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidInitialization",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidMarketConfig",
    inputs: []
  },
  {
    type: "error",
    name: "MarketFeeError",
    inputs: []
  },
  {
    type: "error",
    name: "MarketNotActive",
    inputs: []
  },
  {
    type: "error",
    name: "MarketSizeError",
    inputs: []
  },
  {
    type: "error",
    name: "MarketStateError",
    inputs: []
  },
  {
    type: "error",
    name: "NotInitializing",
    inputs: []
  },
  {
    type: "error",
    name: "OrderAlreadyFilledOrCancelled",
    inputs: []
  },
  {
    type: "error",
    name: "PassiveLiquidityCrossesBook",
    inputs: []
  },
  {
    type: "error",
    name: "PositionNotFound",
    inputs: []
  },
  {
    type: "error",
    name: "PostOnlyError",
    inputs: []
  },
  {
    type: "error",
    name: "PriceError",
    inputs: []
  },
  {
    type: "error",
    name: "Reentrancy",
    inputs: []
  },
  {
    type: "error",
    name: "SelfTrade",
    inputs: []
  },
  {
    type: "error",
    name: "SizeError",
    inputs: []
  },
  {
    type: "error",
    name: "SlippageExceeded",
    inputs: []
  },
  {
    type: "error",
    name: "SpotTokenNotEnabled",
    inputs: []
  },
  {
    type: "error",
    name: "TickSizeError",
    inputs: []
  },
  {
    type: "error",
    name: "Uint96Overflow",
    inputs: []
  },
  {
    type: "error",
    name: "Unauthorized",
    inputs: []
  },
  {
    type: "error",
    name: "UnauthorizedCallContext",
    inputs: []
  },
  {
    type: "error",
    name: "UpgradeFailed",
    inputs: []
  },
  {
    type: "error",
    name: "ZeroAddress",
    inputs: []
  },
  {
    type: "error",
    name: "ZeroAmount",
    inputs: []
  }
] as const satisfies Abi;

export const spotPeripheryAbi = [
  {
    type: "constructor",
    inputs: [
      {
        name: "_accountCore",
        type: "address",
        internalType: "contract IAccountCore"
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "receive",
    stateMutability: "payable"
  },
  {
    type: "function",
    name: "accountCore",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract IAccountCore"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "authorizeAccountSignerBySig",
    inputs: [
      {
        name: "account",
        type: "address",
        internalType: "address"
      },
      {
        name: "signer",
        type: "address",
        internalType: "address"
      },
      {
        name: "permissions",
        type: "uint32",
        internalType: "uint32"
      },
      {
        name: "expiry",
        type: "uint64",
        internalType: "uint64"
      },
      {
        name: "nonce",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "deadline",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "signature",
        type: "bytes",
        internalType: "bytes"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "deposit",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address"
      },
      {
        name: "amount",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [],
    stateMutability: "payable"
  },
  {
    type: "function",
    name: "depositForAccount",
    inputs: [
      {
        name: "account",
        type: "address",
        internalType: "address"
      },
      {
        name: "token",
        type: "address",
        internalType: "address"
      },
      {
        name: "amount",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [],
    stateMutability: "payable"
  },
  {
    type: "function",
    name: "estimateSwap",
    inputs: [
      {
        name: "market",
        type: "address",
        internalType: "address"
      },
      {
        name: "isBuy",
        type: "bool",
        internalType: "bool"
      },
      {
        name: "amountIn",
        type: "uint128",
        internalType: "uint128"
      },
      {
        name: "limitPrice",
        type: "uint32",
        internalType: "uint32"
      }
    ],
    outputs: [
      {
        name: "result",
        type: "tuple",
        internalType: "struct ISpotOrderBook.SwapResult",
        components: [
          {
            name: "amountInUsed",
            type: "uint128",
            internalType: "uint128"
          },
          {
            name: "amountOut",
            type: "uint128",
            internalType: "uint128"
          }
        ]
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "estimateSwap",
    inputs: [
      {
        name: "market",
        type: "address",
        internalType: "address"
      },
      {
        name: "isBuy",
        type: "bool",
        internalType: "bool"
      },
      {
        name: "amountIn",
        type: "uint128",
        internalType: "uint128"
      },
      {
        name: "limitPrice",
        type: "uint32",
        internalType: "uint32"
      },
      {
        name: "builderFeeBps",
        type: "uint16",
        internalType: "uint16"
      }
    ],
    outputs: [
      {
        name: "result",
        type: "tuple",
        internalType: "struct ISpotOrderBook.SwapResult",
        components: [
          {
            name: "amountInUsed",
            type: "uint128",
            internalType: "uint128"
          },
          {
            name: "amountOut",
            type: "uint128",
            internalType: "uint128"
          }
        ]
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "estimateSwaps",
    inputs: [
      {
        name: "markets",
        type: "address[]",
        internalType: "address[]"
      },
      {
        name: "isBuy",
        type: "bool[]",
        internalType: "bool[]"
      },
      {
        name: "amountIn",
        type: "uint128[]",
        internalType: "uint128[]"
      },
      {
        name: "limitPrice",
        type: "uint32[]",
        internalType: "uint32[]"
      }
    ],
    outputs: [
      {
        name: "results",
        type: "tuple[]",
        internalType: "struct ISpotOrderBook.SwapResult[]",
        components: [
          {
            name: "amountInUsed",
            type: "uint128",
            internalType: "uint128"
          },
          {
            name: "amountOut",
            type: "uint128",
            internalType: "uint128"
          }
        ]
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "estimateSwaps",
    inputs: [
      {
        name: "markets",
        type: "address[]",
        internalType: "address[]"
      },
      {
        name: "isBuy",
        type: "bool[]",
        internalType: "bool[]"
      },
      {
        name: "amountIn",
        type: "uint128[]",
        internalType: "uint128[]"
      },
      {
        name: "limitPrice",
        type: "uint32[]",
        internalType: "uint32[]"
      },
      {
        name: "builderFeeBps",
        type: "uint16[]",
        internalType: "uint16[]"
      }
    ],
    outputs: [
      {
        name: "results",
        type: "tuple[]",
        internalType: "struct ISpotOrderBook.SwapResult[]",
        components: [
          {
            name: "amountInUsed",
            type: "uint128",
            internalType: "uint128"
          },
          {
            name: "amountOut",
            type: "uint128",
            internalType: "uint128"
          }
        ]
      }
    ],
    stateMutability: "view"
  },
  {
    type: "error",
    name: "LengthMismatch",
    inputs: []
  },
  {
    type: "error",
    name: "NativeAssetMismatch",
    inputs: []
  },
  {
    type: "error",
    name: "ZeroAddress",
    inputs: []
  },
  {
    type: "error",
    name: "ZeroAmount",
    inputs: []
  }
] as const satisfies Abi;

export const kuruIntentExecutorAbi = [
  {
    type: "constructor",
    inputs: [
      {
        name: "_accountCore",
        type: "address",
        internalType: "contract IAccountCore"
      },
      {
        name: "owner_",
        type: "address",
        internalType: "address"
      },
      {
        name: "_maxFutureNonceSkewMillis",
        type: "uint64",
        internalType: "uint64"
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "ACCOUNT_PERMISSION_TRADE",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint32",
        internalType: "uint32"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "BATCH_INTENT_TYPEHASH",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "CANCEL_TRIGGER_TYPEHASH",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "CREATE_BATCH_TRIGGER_TYPEHASH",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "CREATE_REPLACE_TRIGGER_TYPEHASH",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "REPLACE_BY_SLOT_INTENT_TYPEHASH",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "accountCore",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract IAccountCore"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "authorizedSubmitter",
    inputs: [
      {
        name: "submitter",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "authorized",
        type: "bool",
        internalType: "bool"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "cancelOwnershipHandover",
    inputs: [],
    outputs: [],
    stateMutability: "payable"
  },
  {
    type: "function",
    name: "cancelTrigger",
    inputs: [
      {
        name: "accountId",
        type: "uint40",
        internalType: "uint40"
      },
      {
        name: "signer",
        type: "address",
        internalType: "address"
      },
      {
        name: "nonce",
        type: "uint64",
        internalType: "uint64"
      },
      {
        name: "deadline",
        type: "uint64",
        internalType: "uint64"
      },
      {
        name: "triggerId",
        type: "bytes32",
        internalType: "bytes32"
      },
      {
        name: "signature",
        type: "bytes",
        internalType: "bytes"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "completeOwnershipHandover",
    inputs: [
      {
        name: "pendingOwner",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [],
    stateMutability: "payable"
  },
  {
    type: "function",
    name: "createBatchTrigger",
    inputs: [
      {
        name: "header",
        type: "tuple",
        internalType: "struct KuruIntentExecutor.IntentHeader",
        components: [
          {
            name: "accountId",
            type: "uint40",
            internalType: "uint40"
          },
          {
            name: "market",
            type: "address",
            internalType: "address"
          },
          {
            name: "signer",
            type: "address",
            internalType: "address"
          },
          {
            name: "nonce",
            type: "uint64",
            internalType: "uint64"
          },
          {
            name: "deadline",
            type: "uint64",
            internalType: "uint64"
          },
          {
            name: "clientOrderId",
            type: "bytes32",
            internalType: "bytes32"
          },
          {
            name: "builder",
            type: "address",
            internalType: "address"
          },
          {
            name: "builderFeeBps",
            type: "uint16",
            internalType: "uint16"
          }
        ]
      },
      {
        name: "triggerExpiry",
        type: "uint64",
        internalType: "uint64"
      },
      {
        name: "conditionHash",
        type: "bytes32",
        internalType: "bytes32"
      },
      {
        name: "orders",
        type: "tuple[]",
        internalType: "struct ISpotOrderBook.NativeOrder[]",
        components: [
          {
            name: "side",
            type: "uint8",
            internalType: "enum ISpotOrderBook.NativeSide"
          },
          {
            name: "quantity",
            type: "uint96",
            internalType: "uint96"
          },
          {
            name: "price",
            type: "uint32",
            internalType: "uint32"
          },
          {
            name: "tif",
            type: "uint8",
            internalType: "enum ISpotOrderBook.NativeTif"
          },
          {
            name: "executionInstruction",
            type: "uint8",
            internalType: "enum ISpotOrderBook.NativeExecInstruction"
          },
          {
            name: "minSizeAfterBlock",
            type: "uint32",
            internalType: "uint32"
          }
        ]
      },
      {
        name: "cancelSlotIdxs",
        type: "uint8[]",
        internalType: "uint8[]"
      },
      {
        name: "signature",
        type: "bytes",
        internalType: "bytes"
      }
    ],
    outputs: [
      {
        name: "triggerId",
        type: "bytes32",
        internalType: "bytes32"
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "createReplaceTrigger",
    inputs: [
      {
        name: "header",
        type: "tuple",
        internalType: "struct KuruIntentExecutor.IntentHeader",
        components: [
          {
            name: "accountId",
            type: "uint40",
            internalType: "uint40"
          },
          {
            name: "market",
            type: "address",
            internalType: "address"
          },
          {
            name: "signer",
            type: "address",
            internalType: "address"
          },
          {
            name: "nonce",
            type: "uint64",
            internalType: "uint64"
          },
          {
            name: "deadline",
            type: "uint64",
            internalType: "uint64"
          },
          {
            name: "clientOrderId",
            type: "bytes32",
            internalType: "bytes32"
          },
          {
            name: "builder",
            type: "address",
            internalType: "address"
          },
          {
            name: "builderFeeBps",
            type: "uint16",
            internalType: "uint16"
          }
        ]
      },
      {
        name: "triggerExpiry",
        type: "uint64",
        internalType: "uint64"
      },
      {
        name: "conditionHash",
        type: "bytes32",
        internalType: "bytes32"
      },
      {
        name: "packedOps",
        type: "bytes",
        internalType: "bytes"
      },
      {
        name: "signature",
        type: "bytes",
        internalType: "bytes"
      }
    ],
    outputs: [
      {
        name: "triggerId",
        type: "bytes32",
        internalType: "bytes32"
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "eip712Domain",
    inputs: [],
    outputs: [
      {
        name: "fields",
        type: "bytes1",
        internalType: "bytes1"
      },
      {
        name: "name",
        type: "string",
        internalType: "string"
      },
      {
        name: "version",
        type: "string",
        internalType: "string"
      },
      {
        name: "chainId",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "verifyingContract",
        type: "address",
        internalType: "address"
      },
      {
        name: "salt",
        type: "bytes32",
        internalType: "bytes32"
      },
      {
        name: "extensions",
        type: "uint256[]",
        internalType: "uint256[]"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "executeBatch",
    inputs: [
      {
        name: "header",
        type: "tuple",
        internalType: "struct KuruIntentExecutor.IntentHeader",
        components: [
          {
            name: "accountId",
            type: "uint40",
            internalType: "uint40"
          },
          {
            name: "market",
            type: "address",
            internalType: "address"
          },
          {
            name: "signer",
            type: "address",
            internalType: "address"
          },
          {
            name: "nonce",
            type: "uint64",
            internalType: "uint64"
          },
          {
            name: "deadline",
            type: "uint64",
            internalType: "uint64"
          },
          {
            name: "clientOrderId",
            type: "bytes32",
            internalType: "bytes32"
          },
          {
            name: "builder",
            type: "address",
            internalType: "address"
          },
          {
            name: "builderFeeBps",
            type: "uint16",
            internalType: "uint16"
          }
        ]
      },
      {
        name: "orders",
        type: "tuple[]",
        internalType: "struct ISpotOrderBook.NativeOrder[]",
        components: [
          {
            name: "side",
            type: "uint8",
            internalType: "enum ISpotOrderBook.NativeSide"
          },
          {
            name: "quantity",
            type: "uint96",
            internalType: "uint96"
          },
          {
            name: "price",
            type: "uint32",
            internalType: "uint32"
          },
          {
            name: "tif",
            type: "uint8",
            internalType: "enum ISpotOrderBook.NativeTif"
          },
          {
            name: "executionInstruction",
            type: "uint8",
            internalType: "enum ISpotOrderBook.NativeExecInstruction"
          },
          {
            name: "minSizeAfterBlock",
            type: "uint32",
            internalType: "uint32"
          }
        ]
      },
      {
        name: "cancelSlotIdxs",
        type: "uint8[]",
        internalType: "uint8[]"
      },
      {
        name: "signature",
        type: "bytes",
        internalType: "bytes"
      }
    ],
    outputs: [
      {
        name: "intentHash",
        type: "bytes32",
        internalType: "bytes32"
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "executeReplaceBySlotPacked",
    inputs: [
      {
        name: "header",
        type: "tuple",
        internalType: "struct KuruIntentExecutor.IntentHeader",
        components: [
          {
            name: "accountId",
            type: "uint40",
            internalType: "uint40"
          },
          {
            name: "market",
            type: "address",
            internalType: "address"
          },
          {
            name: "signer",
            type: "address",
            internalType: "address"
          },
          {
            name: "nonce",
            type: "uint64",
            internalType: "uint64"
          },
          {
            name: "deadline",
            type: "uint64",
            internalType: "uint64"
          },
          {
            name: "clientOrderId",
            type: "bytes32",
            internalType: "bytes32"
          },
          {
            name: "builder",
            type: "address",
            internalType: "address"
          },
          {
            name: "builderFeeBps",
            type: "uint16",
            internalType: "uint16"
          }
        ]
      },
      {
        name: "packedOps",
        type: "bytes",
        internalType: "bytes"
      },
      {
        name: "signature",
        type: "bytes",
        internalType: "bytes"
      }
    ],
    outputs: [
      {
        name: "intentHash",
        type: "bytes32",
        internalType: "bytes32"
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "executeTrigger",
    inputs: [
      {
        name: "triggerId",
        type: "bytes32",
        internalType: "bytes32"
      },
      {
        name: "executionReportHash",
        type: "bytes32",
        internalType: "bytes32"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "lastSeenOrderNonce",
    inputs: [
      {
        name: "signer",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "nonce",
        type: "uint64",
        internalType: "uint64"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "maxFutureNonceSkewMillis",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint64",
        internalType: "uint64"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [
      {
        name: "result",
        type: "address",
        internalType: "address"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "ownershipHandoverExpiresAt",
    inputs: [
      {
        name: "pendingOwner",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "result",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "renounceOwnership",
    inputs: [],
    outputs: [],
    stateMutability: "payable"
  },
  {
    type: "function",
    name: "requestOwnershipHandover",
    inputs: [],
    outputs: [],
    stateMutability: "payable"
  },
  {
    type: "function",
    name: "setAuthorizedSubmitter",
    inputs: [
      {
        name: "submitter",
        type: "address",
        internalType: "address"
      },
      {
        name: "authorized",
        type: "bool",
        internalType: "bool"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "setMaxFutureNonceSkewMillis",
    inputs: [
      {
        name: "newSkewMillis",
        type: "uint64",
        internalType: "uint64"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "transferOwnership",
    inputs: [
      {
        name: "newOwner",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [],
    stateMutability: "payable"
  },
  {
    type: "function",
    name: "triggers",
    inputs: [
      {
        name: "triggerId",
        type: "bytes32",
        internalType: "bytes32"
      }
    ],
    outputs: [
      {
        name: "accountId",
        type: "uint40",
        internalType: "uint40"
      },
      {
        name: "signer",
        type: "address",
        internalType: "address"
      },
      {
        name: "market",
        type: "address",
        internalType: "address"
      },
      {
        name: "nonce",
        type: "uint64",
        internalType: "uint64"
      },
      {
        name: "expiry",
        type: "uint64",
        internalType: "uint64"
      },
      {
        name: "clientOrderId",
        type: "bytes32",
        internalType: "bytes32"
      },
      {
        name: "builder",
        type: "address",
        internalType: "address"
      },
      {
        name: "builderFeeBps",
        type: "uint16",
        internalType: "uint16"
      },
      {
        name: "conditionHash",
        type: "bytes32",
        internalType: "bytes32"
      },
      {
        name: "action",
        type: "uint8",
        internalType: "enum KuruIntentExecutor.TriggerAction"
      },
      {
        name: "status",
        type: "uint8",
        internalType: "enum KuruIntentExecutor.TriggerStatus"
      },
      {
        name: "payload",
        type: "bytes",
        internalType: "bytes"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "usedTriggerNonce",
    inputs: [
      {
        name: "signer",
        type: "address",
        internalType: "address"
      },
      {
        name: "nonce",
        type: "uint64",
        internalType: "uint64"
      }
    ],
    outputs: [
      {
        name: "used",
        type: "bool",
        internalType: "bool"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "event",
    name: "IntentExecuted",
    inputs: [
      {
        name: "intentHash",
        type: "bytes32",
        indexed: true,
        internalType: "bytes32"
      },
      {
        name: "signer",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "accountId",
        type: "uint40",
        indexed: true,
        internalType: "uint40"
      },
      {
        name: "market",
        type: "address",
        indexed: false,
        internalType: "address"
      },
      {
        name: "clientOrderId",
        type: "bytes32",
        indexed: false,
        internalType: "bytes32"
      },
      {
        name: "nonce",
        type: "uint64",
        indexed: false,
        internalType: "uint64"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "MaxFutureNonceSkewUpdated",
    inputs: [
      {
        name: "oldSkewMillis",
        type: "uint64",
        indexed: false,
        internalType: "uint64"
      },
      {
        name: "newSkewMillis",
        type: "uint64",
        indexed: false,
        internalType: "uint64"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "OwnershipHandoverCanceled",
    inputs: [
      {
        name: "pendingOwner",
        type: "address",
        indexed: true,
        internalType: "address"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "OwnershipHandoverRequested",
    inputs: [
      {
        name: "pendingOwner",
        type: "address",
        indexed: true,
        internalType: "address"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "OwnershipTransferred",
    inputs: [
      {
        name: "oldOwner",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "newOwner",
        type: "address",
        indexed: true,
        internalType: "address"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "SubmitterAuthorizationUpdated",
    inputs: [
      {
        name: "submitter",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "authorized",
        type: "bool",
        indexed: false,
        internalType: "bool"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "TriggerCanceled",
    inputs: [
      {
        name: "triggerId",
        type: "bytes32",
        indexed: true,
        internalType: "bytes32"
      },
      {
        name: "signer",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "accountId",
        type: "uint40",
        indexed: true,
        internalType: "uint40"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "TriggerCreated",
    inputs: [
      {
        name: "triggerId",
        type: "bytes32",
        indexed: true,
        internalType: "bytes32"
      },
      {
        name: "signer",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "accountId",
        type: "uint40",
        indexed: true,
        internalType: "uint40"
      },
      {
        name: "market",
        type: "address",
        indexed: false,
        internalType: "address"
      },
      {
        name: "clientOrderId",
        type: "bytes32",
        indexed: false,
        internalType: "bytes32"
      },
      {
        name: "nonce",
        type: "uint64",
        indexed: false,
        internalType: "uint64"
      },
      {
        name: "expiry",
        type: "uint64",
        indexed: false,
        internalType: "uint64"
      },
      {
        name: "conditionHash",
        type: "bytes32",
        indexed: false,
        internalType: "bytes32"
      },
      {
        name: "action",
        type: "uint8",
        indexed: false,
        internalType: "enum KuruIntentExecutor.TriggerAction"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "TriggerExpired",
    inputs: [
      {
        name: "triggerId",
        type: "bytes32",
        indexed: true,
        internalType: "bytes32"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "TriggerFired",
    inputs: [
      {
        name: "triggerId",
        type: "bytes32",
        indexed: true,
        internalType: "bytes32"
      },
      {
        name: "submitter",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "executionReportHash",
        type: "bytes32",
        indexed: false,
        internalType: "bytes32"
      }
    ],
    anonymous: false
  },
  {
    type: "error",
    name: "AlreadyInitialized",
    inputs: []
  },
  {
    type: "error",
    name: "DeadlineExpired",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidBuilder",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidExpireTime",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidSignature",
    inputs: []
  },
  {
    type: "error",
    name: "NewOwnerIsZeroAddress",
    inputs: []
  },
  {
    type: "error",
    name: "NoHandoverRequest",
    inputs: []
  },
  {
    type: "error",
    name: "NonceTooFarInFuture",
    inputs: []
  },
  {
    type: "error",
    name: "NonceTooLow",
    inputs: []
  },
  {
    type: "error",
    name: "Reentrancy",
    inputs: []
  },
  {
    type: "error",
    name: "TriggerNonceUsed",
    inputs: []
  },
  {
    type: "error",
    name: "TriggerNotActive",
    inputs: []
  },
  {
    type: "error",
    name: "Unauthorized",
    inputs: []
  },
  {
    type: "error",
    name: "Unauthorized",
    inputs: []
  },
  {
    type: "error",
    name: "UnauthorizedSubmitter",
    inputs: []
  },
  {
    type: "error",
    name: "ZeroAddress",
    inputs: []
  }
] as const satisfies Abi;

export const erc20MetadataAbi = [
  {
    type: "function",
    name: "allowance",
    inputs: [
      {
        name: "owner",
        type: "address",
        internalType: "address"
      },
      {
        name: "spender",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "approve",
    inputs: [
      {
        name: "spender",
        type: "address",
        internalType: "address"
      },
      {
        name: "value",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool"
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [
      {
        name: "account",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint8",
        internalType: "uint8"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "name",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "string",
        internalType: "string"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "symbol",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "string",
        internalType: "string"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "totalSupply",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "transfer",
    inputs: [
      {
        name: "to",
        type: "address",
        internalType: "address"
      },
      {
        name: "value",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool"
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "transferFrom",
    inputs: [
      {
        name: "from",
        type: "address",
        internalType: "address"
      },
      {
        name: "to",
        type: "address",
        internalType: "address"
      },
      {
        name: "value",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool"
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "event",
    name: "Approval",
    inputs: [
      {
        name: "owner",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "spender",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "value",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "Transfer",
    inputs: [
      {
        name: "from",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "to",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "value",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      }
    ],
    anonymous: false
  }
] as const satisfies Abi;

export const contractAbis = {
  AccountCore: accountCoreAbi,
  SpotRouter: spotRouterAbi,
  SpotEngine: spotEngineAbi,
  SpotOrderBook: spotOrderBookAbi,
  SpotPeriphery: spotPeripheryAbi,
  KuruIntentExecutor: kuruIntentExecutorAbi,
  IERC20Metadata: erc20MetadataAbi
} as const;

export const kuruErrorAbi = [
  {
    type: "error",
    name: "AccountAlreadyRegistered",
    inputs: []
  },
  {
    type: "error",
    name: "AccountNotFound",
    inputs: []
  },
  {
    type: "error",
    name: "AlreadyInitialized",
    inputs: []
  },
  {
    type: "error",
    name: "AssetNotEnabled",
    inputs: []
  },
  {
    type: "error",
    name: "BuilderApprovalExpired",
    inputs: []
  },
  {
    type: "error",
    name: "BuilderApprovalNotFound",
    inputs: []
  },
  {
    type: "error",
    name: "BuilderFeeTooHigh",
    inputs: []
  },
  {
    type: "error",
    name: "CannotAuthorizeOwner",
    inputs: []
  },
  {
    type: "error",
    name: "InsufficientBalance",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidAuthority",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidBuilder",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidCollateral",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidInitialization",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidMarketConfig",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidSignature",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidSubaccount",
    inputs: []
  },
  {
    type: "error",
    name: "MarketFeeError",
    inputs: []
  },
  {
    type: "error",
    name: "NativeAssetMismatch",
    inputs: []
  },
  {
    type: "error",
    name: "NewOwnerIsZeroAddress",
    inputs: []
  },
  {
    type: "error",
    name: "NoBuilderFees",
    inputs: []
  },
  {
    type: "error",
    name: "NoHandoverRequest",
    inputs: []
  },
  {
    type: "error",
    name: "NotInitializing",
    inputs: []
  },
  {
    type: "error",
    name: "OnlySpotRouter",
    inputs: []
  },
  {
    type: "error",
    name: "OnlyVerifiedSpotOrderBook",
    inputs: []
  },
  {
    type: "error",
    name: "ProtocolPaused",
    inputs: []
  },
  {
    type: "error",
    name: "Reentrancy",
    inputs: []
  },
  {
    type: "error",
    name: "SameRootRequired",
    inputs: []
  },
  {
    type: "error",
    name: "SpotTokenNotEnabled",
    inputs: []
  },
  {
    type: "error",
    name: "SubaccountLimitReached",
    inputs: []
  },
  {
    type: "error",
    name: "Unauthorized",
    inputs: []
  },
  {
    type: "error",
    name: "Unauthorized",
    inputs: []
  },
  {
    type: "error",
    name: "UnauthorizedCallContext",
    inputs: []
  },
  {
    type: "error",
    name: "UpgradeFailed",
    inputs: []
  },
  {
    type: "error",
    name: "ZeroAddress",
    inputs: []
  },
  {
    type: "error",
    name: "ZeroAmount",
    inputs: []
  },
  {
    type: "error",
    name: "AlreadyInitialized",
    inputs: []
  },
  {
    type: "error",
    name: "Create2EmptyBytecode",
    inputs: []
  },
  {
    type: "error",
    name: "FailedDeployment",
    inputs: []
  },
  {
    type: "error",
    name: "ImplementationNotChanged",
    inputs: []
  },
  {
    type: "error",
    name: "InsufficientBalance",
    inputs: [
      {
        name: "balance",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "needed",
        type: "uint256",
        internalType: "uint256"
      }
    ]
  },
  {
    type: "error",
    name: "InvalidAuthority",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidInitialization",
    inputs: []
  },
  {
    type: "error",
    name: "MarketNotFound",
    inputs: []
  },
  {
    type: "error",
    name: "NewOwnerIsZeroAddress",
    inputs: []
  },
  {
    type: "error",
    name: "NoHandoverRequest",
    inputs: []
  },
  {
    type: "error",
    name: "NotInitializing",
    inputs: []
  },
  {
    type: "error",
    name: "SpotTokenNotEnabled",
    inputs: []
  },
  {
    type: "error",
    name: "SpotTokenNotWhitelisted",
    inputs: []
  },
  {
    type: "error",
    name: "Unauthorized",
    inputs: []
  },
  {
    type: "error",
    name: "Unauthorized",
    inputs: []
  },
  {
    type: "error",
    name: "UnauthorizedCallContext",
    inputs: []
  },
  {
    type: "error",
    name: "UpgradeFailed",
    inputs: []
  },
  {
    type: "error",
    name: "ZeroAddress",
    inputs: []
  },
  {
    type: "error",
    name: "AlreadyInitialized",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidAuthority",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidCollateral",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidInitialization",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidMarketConfig",
    inputs: []
  },
  {
    type: "error",
    name: "MarketAlreadyExists",
    inputs: []
  },
  {
    type: "error",
    name: "MarketFeeError",
    inputs: []
  },
  {
    type: "error",
    name: "MarketNotFound",
    inputs: []
  },
  {
    type: "error",
    name: "MarketSizeError",
    inputs: []
  },
  {
    type: "error",
    name: "NewOwnerIsZeroAddress",
    inputs: []
  },
  {
    type: "error",
    name: "NoHandoverRequest",
    inputs: []
  },
  {
    type: "error",
    name: "NotInitializing",
    inputs: []
  },
  {
    type: "error",
    name: "Unauthorized",
    inputs: []
  },
  {
    type: "error",
    name: "Unauthorized",
    inputs: []
  },
  {
    type: "error",
    name: "UnauthorizedCallContext",
    inputs: []
  },
  {
    type: "error",
    name: "UpgradeFailed",
    inputs: []
  },
  {
    type: "error",
    name: "ZeroAddress",
    inputs: []
  },
  {
    type: "error",
    name: "BuilderFeeTooHigh",
    inputs: []
  },
  {
    type: "error",
    name: "DuplicatePackedReplaceSlot",
    inputs: []
  },
  {
    type: "error",
    name: "InsufficientBalance",
    inputs: []
  },
  {
    type: "error",
    name: "InsufficientLiquidity",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidAuthority",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidCollateral",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidExpireTime",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidInitialization",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidMarketConfig",
    inputs: []
  },
  {
    type: "error",
    name: "MarketFeeError",
    inputs: []
  },
  {
    type: "error",
    name: "MarketNotActive",
    inputs: []
  },
  {
    type: "error",
    name: "MarketSizeError",
    inputs: []
  },
  {
    type: "error",
    name: "MarketStateError",
    inputs: []
  },
  {
    type: "error",
    name: "NotInitializing",
    inputs: []
  },
  {
    type: "error",
    name: "OrderAlreadyFilledOrCancelled",
    inputs: []
  },
  {
    type: "error",
    name: "PassiveLiquidityCrossesBook",
    inputs: []
  },
  {
    type: "error",
    name: "PositionNotFound",
    inputs: []
  },
  {
    type: "error",
    name: "PostOnlyError",
    inputs: []
  },
  {
    type: "error",
    name: "PriceError",
    inputs: []
  },
  {
    type: "error",
    name: "Reentrancy",
    inputs: []
  },
  {
    type: "error",
    name: "SelfTrade",
    inputs: []
  },
  {
    type: "error",
    name: "SizeError",
    inputs: []
  },
  {
    type: "error",
    name: "SlippageExceeded",
    inputs: []
  },
  {
    type: "error",
    name: "SpotTokenNotEnabled",
    inputs: []
  },
  {
    type: "error",
    name: "TickSizeError",
    inputs: []
  },
  {
    type: "error",
    name: "Uint96Overflow",
    inputs: []
  },
  {
    type: "error",
    name: "Unauthorized",
    inputs: []
  },
  {
    type: "error",
    name: "UnauthorizedCallContext",
    inputs: []
  },
  {
    type: "error",
    name: "UpgradeFailed",
    inputs: []
  },
  {
    type: "error",
    name: "ZeroAddress",
    inputs: []
  },
  {
    type: "error",
    name: "ZeroAmount",
    inputs: []
  },
  {
    type: "error",
    name: "LengthMismatch",
    inputs: []
  },
  {
    type: "error",
    name: "NativeAssetMismatch",
    inputs: []
  },
  {
    type: "error",
    name: "ZeroAddress",
    inputs: []
  },
  {
    type: "error",
    name: "ZeroAmount",
    inputs: []
  },
  {
    type: "error",
    name: "AlreadyInitialized",
    inputs: []
  },
  {
    type: "error",
    name: "DeadlineExpired",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidBuilder",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidExpireTime",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidSignature",
    inputs: []
  },
  {
    type: "error",
    name: "NewOwnerIsZeroAddress",
    inputs: []
  },
  {
    type: "error",
    name: "NoHandoverRequest",
    inputs: []
  },
  {
    type: "error",
    name: "NonceTooFarInFuture",
    inputs: []
  },
  {
    type: "error",
    name: "NonceTooLow",
    inputs: []
  },
  {
    type: "error",
    name: "Reentrancy",
    inputs: []
  },
  {
    type: "error",
    name: "TriggerNonceUsed",
    inputs: []
  },
  {
    type: "error",
    name: "TriggerNotActive",
    inputs: []
  },
  {
    type: "error",
    name: "Unauthorized",
    inputs: []
  },
  {
    type: "error",
    name: "Unauthorized",
    inputs: []
  },
  {
    type: "error",
    name: "UnauthorizedSubmitter",
    inputs: []
  },
  {
    type: "error",
    name: "ZeroAddress",
    inputs: []
  }
] as const satisfies Abi;

export type ContractName = keyof typeof contractAbis;

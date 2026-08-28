import { isAddressEqual, type Address } from "viem";

import { normalizeAddress } from "../trading-wallet/validation";
import { KuruRelayError, relayInputError } from "./errors";
import type { LocalMessageAccount, MessageWalletClient, RelayPersonalMessageSigner } from "./types";

export function createLocalAccountRelaySigner(
  account: LocalMessageAccount
): RelayPersonalMessageSigner {
  const address = normalizeAddress(account.address, "account.address");
  return {
    address,
    signMessage: (message) => account.signMessage({ message })
  };
}

export function createWalletClientRelaySigner(
  walletClient: MessageWalletClient,
  account: Address
): RelayPersonalMessageSigner {
  const address = normalizeAddress(account, "account");
  return {
    address,
    signMessage: (message) => walletClient.signMessage({ account: address, message })
  };
}

export function resolveRelayAuthenticationWallet(
  walletInput: Address | undefined,
  signer: RelayPersonalMessageSigner | undefined
): Address {
  if (!walletInput && !signer?.address) {
    throw relayInputError(
      "WALLET_REQUIRED",
      "Provide a wallet address or a relay signer with an address."
    );
  }
  const wallet = normalizeAddress(walletInput ?? signer!.address!, "wallet");
  if (
    signer?.address &&
    !isAddressEqual(wallet, normalizeAddress(signer.address, "signer.address"))
  ) {
    throw relayInputError(
      "SIGNER_MISMATCH",
      "The personal-message signer does not match the authentication wallet."
    );
  }
  return wallet;
}

export async function signRelayChallenge(message: string, signer: RelayPersonalMessageSigner) {
  if (!message) {
    throw relayInputError("INVALID_CHALLENGE", "The relay challenge message is empty.");
  }
  try {
    return await signer.signMessage(message);
  } catch (cause) {
    if (cause instanceof KuruRelayError) throw cause;
    throw new KuruRelayError("AUTHENTICATION", "Unable to sign the relay challenge.", {
      code: "CHALLENGE_SIGNING_FAILED"
    });
  }
}

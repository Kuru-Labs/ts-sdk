import {
  isAddressEqual,
  recoverTypedDataAddress,
  type Address,
  type Hex,
  type LocalAccount,
  type WalletClient
} from "viem";

import { KuruSdkError } from "../errors";
import {
  prepareBatchIntent,
  prepareCancelTriggerIntent,
  prepareCreateBatchTriggerIntent,
  prepareCreateReplaceTriggerIntent,
  prepareReplaceBySlotIntent
} from "./intents";
import type {
  BatchIntentInput,
  CancelTriggerIntentInput,
  CreateBatchTriggerIntentInput,
  CreateReplaceTriggerIntentInput,
  PreparedWalletIntent,
  ReplaceBySlotIntentInput,
  SignedWalletIntent,
  WalletIntentSigner,
  WalletTypedDataDefinition
} from "./types";
import { normalizeAddress, normalizeWalletSignature } from "./validation";

export function createLocalAccountWalletIntentSigner(
  account: Pick<LocalAccount, "address" | "signTypedData">
): WalletIntentSigner {
  return {
    address: account.address,
    signTypedData: (typedData) => account.signTypedData(typedData)
  };
}

export function createWalletClientIntentSigner(
  walletClient: Pick<WalletClient, "signTypedData">,
  account: Address
): WalletIntentSigner {
  const address = normalizeAddress(account, "account");
  return {
    address,
    signTypedData: (typedData) =>
      walletClient.signTypedData({
        ...(typedData as any),
        account: address
      })
  };
}

export async function signPreparedWalletIntent<TIntent extends PreparedWalletIntent>(
  intent: TIntent,
  signer: WalletIntentSigner
): Promise<SignedWalletIntent<TIntent>> {
  if (
    signer.address &&
    !isAddressEqual(normalizeAddress(signer.address, "signer.address"), intent.wallet)
  ) {
    throw new KuruSdkError(
      "SIGNER_MISMATCH",
      "The wallet intent signer does not match the wallet EIP-712 domain."
    );
  }

  let rawSignature: Hex;
  try {
    rawSignature = await signer.signTypedData(intent.typedData);
  } catch (cause) {
    throw new KuruSdkError("INVALID_SIGNATURE", "Unable to sign the wallet intent.", { cause });
  }
  const signature = normalizeWalletSignature(rawSignature);
  const recovered = await recoverWalletIntentSigner(intent.typedData, signature);
  if (!isAddressEqual(recovered, intent.wallet)) {
    throw new KuruSdkError(
      "SIGNER_MISMATCH",
      "The wallet intent signature does not recover the wallet EIP-712 domain address."
    );
  }
  return { ...intent, signature };
}

export async function recoverWalletIntentSigner(
  typedData: WalletTypedDataDefinition,
  signature: Hex
): Promise<Address> {
  try {
    const recovered = await recoverTypedDataAddress({
      ...(typedData as any),
      signature: normalizeWalletSignature(signature)
    });
    return normalizeAddress(recovered, "recovered signer");
  } catch (cause) {
    throw new KuruSdkError("INVALID_SIGNATURE", "Unable to recover the wallet signature.", {
      cause
    });
  }
}

export function signReplaceBySlotIntent(
  input: ReplaceBySlotIntentInput,
  signer: WalletIntentSigner
) {
  return signPreparedWalletIntent(prepareReplaceBySlotIntent(input), signer);
}

export function signBatchIntent(input: BatchIntentInput, signer: WalletIntentSigner) {
  return signPreparedWalletIntent(prepareBatchIntent(input), signer);
}

export function signCreateReplaceTriggerIntent(
  input: CreateReplaceTriggerIntentInput,
  signer: WalletIntentSigner
) {
  return signPreparedWalletIntent(prepareCreateReplaceTriggerIntent(input), signer);
}

export function signCreateBatchTriggerIntent(
  input: CreateBatchTriggerIntentInput,
  signer: WalletIntentSigner
) {
  return signPreparedWalletIntent(prepareCreateBatchTriggerIntent(input), signer);
}

export function signCancelTriggerIntent(
  input: CancelTriggerIntentInput,
  signer: WalletIntentSigner
) {
  return signPreparedWalletIntent(prepareCancelTriggerIntent(input), signer);
}

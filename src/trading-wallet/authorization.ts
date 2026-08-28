import {
  concatHex,
  isAddressEqual,
  keccak256,
  numberToHex,
  recoverAddress,
  toRlp,
  type Hex,
  type PrivateKeyAccount
} from "viem";

import { KuruSdkError } from "../errors";
import { assertUint } from "../utils";
import type {
  Eip7702AuthorizationRequest,
  Eip7702AuthorizationSigner,
  SignedEip7702Authorization,
  SignEip7702AuthorizationParams
} from "./types";
import { normalizeAddress, normalizeAuthorizationSignature, normalizeChainId } from "./validation";

const MAX_EIP7702_NONCE = (1n << 64n) - 2n;

export function hashEip7702Authorization(
  authorization: Pick<Eip7702AuthorizationRequest, "chainId" | "delegate" | "nonce">
): Hex {
  const chainId = normalizeChainId(authorization.chainId);
  const delegate = normalizeAddress(authorization.delegate, "delegate");
  const nonce = normalizeAuthorizationNonce(authorization.nonce);
  return keccak256(
    concatHex([
      "0x05",
      toRlp([
        chainId === 0 ? "0x" : numberToHex(chainId),
        delegate,
        nonce === 0n ? "0x" : numberToHex(nonce)
      ])
    ])
  );
}

export function createLocalAccountAuthorizationSigner(
  account: Pick<PrivateKeyAccount, "address" | "signAuthorization">
): Eip7702AuthorizationSigner {
  return {
    address: account.address,
    async signAuthorization(authorization) {
      if (authorization.nonce > BigInt(Number.MAX_SAFE_INTEGER)) {
        throw new KuruSdkError(
          "UNSUPPORTED_SIGNER",
          "Viem local account authorization requires a nonce within Number.MAX_SAFE_INTEGER."
        );
      }
      const signed = await account.signAuthorization({
        address: authorization.delegate,
        chainId: authorization.chainId,
        nonce: Number(authorization.nonce)
      });
      if (signed.yParity !== 0 && signed.yParity !== 1) {
        throw new KuruSdkError(
          "INVALID_SIGNATURE",
          "Viem returned an EIP-7702 signature without a valid yParity."
        );
      }
      return {
        r: signed.r,
        s: signed.s,
        yParity: signed.yParity
      };
    }
  };
}

export async function signEip7702Authorization(
  parameters: SignEip7702AuthorizationParams
): Promise<SignedEip7702Authorization> {
  const authority = normalizeAddress(parameters.authority, "authority");
  const delegate = normalizeAddress(parameters.delegate, "delegate");
  const chainId = normalizeChainId(parameters.chainId);
  if (
    parameters.signer.address &&
    !isAddressEqual(normalizeAddress(parameters.signer.address, "signer.address"), authority)
  ) {
    throw new KuruSdkError(
      "SIGNER_MISMATCH",
      "The EIP-7702 authorization signer does not match the authority."
    );
  }

  const nonce = await resolveAuthorizationNonce(parameters, authority);
  const authorization: Eip7702AuthorizationRequest = {
    authority,
    chainId,
    delegate,
    nonce
  };
  const digest = hashEip7702Authorization(authorization);

  let returnedSignature;
  try {
    returnedSignature = await parameters.signer.signAuthorization(authorization);
  } catch (cause) {
    if (cause instanceof KuruSdkError) throw cause;
    throw new KuruSdkError("INVALID_SIGNATURE", "Unable to sign EIP-7702 authorization.", {
      cause
    });
  }
  const signature = normalizeAuthorizationSignature(returnedSignature);
  const recovered = await recoverAddress({ hash: digest, signature });
  if (!isAddressEqual(recovered, authority)) {
    throw new KuruSdkError(
      "SIGNER_MISMATCH",
      "The EIP-7702 authorization signature does not recover the authority."
    );
  }

  return { ...authorization, digest, ...signature };
}

async function resolveAuthorizationNonce(
  parameters: SignEip7702AuthorizationParams,
  authority: `0x${string}`
): Promise<bigint> {
  if (parameters.nonce !== undefined) {
    return normalizeAuthorizationNonce(parameters.nonce);
  }
  if (parameters.nonceResolver) {
    try {
      return normalizeAuthorizationNonce(await parameters.nonceResolver(authority));
    } catch (cause) {
      if (cause instanceof KuruSdkError) throw cause;
      throw new KuruSdkError(
        "NONCE_RESOLUTION_FAILED",
        "Unable to resolve the pending EIP-7702 authority nonce.",
        { cause }
      );
    }
  }
  if (parameters.publicClient) {
    try {
      const value = await parameters.publicClient.getTransactionCount({
        address: authority,
        blockTag: "pending"
      });
      return normalizeAuthorizationNonce(value);
    } catch (cause) {
      if (cause instanceof KuruSdkError) throw cause;
      throw new KuruSdkError(
        "NONCE_RESOLUTION_FAILED",
        "Unable to resolve the pending EIP-7702 authority nonce.",
        { cause }
      );
    }
  }
  throw new KuruSdkError(
    "MISSING_NONCE_RESOLVER",
    "Provide authority nonce, nonceResolver, or publicClient for EIP-7702 authorization."
  );
}

function normalizeAuthorizationNonce(value: bigint | number | string): bigint {
  const nonce = assertUint(value, 64, "authority nonce");
  if (nonce > MAX_EIP7702_NONCE) {
    throw new KuruSdkError(
      "INVALID_UINT",
      "authority nonce must be below uint64.max so the outer transaction can increment it."
    );
  }
  return nonce;
}

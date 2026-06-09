import { createAccountClient } from "./account";
import { createIntentClient } from "./intent";
import { createSpotClient } from "./spot";
import type { KuruClientConfig } from "./types";

export function createKuruClient(config: KuruClientConfig) {
  return {
    account: createAccountClient(config),
    spot: createSpotClient(config),
    intent: createIntentClient(config)
  };
}

export type KuruClient = ReturnType<typeof createKuruClient>;

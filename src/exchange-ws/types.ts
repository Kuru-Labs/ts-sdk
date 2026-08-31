import type { Address, Hex } from "viem";

export type ExchangeWsBinaryInput = ArrayBuffer | ArrayBufferView;

export interface ExchangeWsBlobLike {
  arrayBuffer(): Promise<ArrayBuffer>;
}

export type ExchangeWsView = "proposed" | "voted" | "finalized";
export type ExchangeWsSide = "buy" | "sell";

export interface ExchangeWsBlockContext {
  blockNumber: bigint;
  blockId: Hex;
}

interface ExchangeWsFrameHeader {
  wireVersion: 1;
  feedEpoch: bigint;
  view: ExchangeWsView;
}

interface ExchangeWsMarketFrame extends ExchangeWsFrameHeader {
  marketAddress: Address;
  marketSeq: bigint;
  globalSeq: bigint;
}

export type ExchangeWsL2Grouping =
  | { kind: "none" }
  | { kind: "nativeTick"; tickSize: bigint }
  | { kind: "significantFigures"; figures: number; mantissa: number | null };

export interface ExchangeWsCompactL2Level {
  priceX18: bigint;
  totalBaseX18: bigint;
}

export interface ExchangeWsExtendedL2Level extends ExchangeWsCompactL2Level {
  activeBaseX18: bigint;
  passiveBaseX18: bigint;
  activeOrderCount: number;
}

interface ExchangeWsL2BookFrameBase extends ExchangeWsMarketFrame {
  kind: "l2Book";
  stateHead: ExchangeWsBlockContext;
  durationMs: bigint;
  maxDepthPerSide: number;
  grouping: ExchangeWsL2Grouping;
}

export interface ExchangeWsCompactL2BookFrame extends ExchangeWsL2BookFrameBase {
  levelFormat: "compact";
  bids: ExchangeWsCompactL2Level[];
  asks: ExchangeWsCompactL2Level[];
}

export interface ExchangeWsExtendedL2BookFrame extends ExchangeWsL2BookFrameBase {
  levelFormat: "extended";
  bids: ExchangeWsExtendedL2Level[];
  asks: ExchangeWsExtendedL2Level[];
}

export type ExchangeWsL2BookFrame = ExchangeWsCompactL2BookFrame | ExchangeWsExtendedL2BookFrame;

export interface ExchangeWsL2DeltaUpdate {
  side: ExchangeWsSide;
  priceTick: bigint;
  totalBaseAfter: bigint;
  activeBaseAfter: bigint;
  passiveBaseAfter: bigint;
  activeOrderCountAfter: number;
}

export interface ExchangeWsL2DeltaFrame extends ExchangeWsMarketFrame {
  kind: "l2Delta";
  sourceBlock: ExchangeWsBlockContext;
  updates: ExchangeWsL2DeltaUpdate[];
}

export interface ExchangeWsMarketTrade {
  tradeId: bigint;
  recordIndex: number;
  takerSide: ExchangeWsSide;
  priceTick: bigint;
  baseFilled: bigint;
}

export interface ExchangeWsMarketTradesFrame extends ExchangeWsMarketFrame {
  kind: "trades";
  sourceBlock: ExchangeWsBlockContext;
  trades: ExchangeWsMarketTrade[];
}

export interface ExchangeWsBboLevel {
  priceX18: bigint;
  totalBaseX18: bigint;
}

export interface ExchangeWsBboFrame extends ExchangeWsMarketFrame {
  kind: "bbo";
  stateHead: ExchangeWsBlockContext;
  bid: ExchangeWsBboLevel | null;
  ask: ExchangeWsBboLevel | null;
}

export interface ExchangeWsMidpoint {
  marketAddress: Address;
  midpointX18: bigint;
}

export interface ExchangeWsAllMidsFrame extends ExchangeWsFrameHeader {
  kind: "allMids";
  mids: ExchangeWsMidpoint[];
}

export interface ExchangeWsUserContext {
  userId: bigint;
  globalUserSeq: bigint | null;
  globalSeq: bigint | null;
  previousGlobalUserSeq: bigint | null;
}

export interface ExchangeWsUserOrder {
  marketAddress: Address;
  orderId: bigint;
  slotIdx: number;
  side: ExchangeWsSide;
  priceTick: bigint;
  remainingBase: bigint;
  minSizeAfterBlock: bigint | null;
  clientOrderId: Hex | null;
}

export interface ExchangeWsUserOrderRemoval {
  marketAddress: Address;
  orderId: bigint;
  slotIdx: number;
}

interface ExchangeWsUserOrdersFrameBase extends ExchangeWsFrameHeader, ExchangeWsUserContext {
  kind: "userOrders";
  upserts: ExchangeWsUserOrder[];
  removals: ExchangeWsUserOrderRemoval[];
}

export interface ExchangeWsUserOrdersSnapshotFrame extends ExchangeWsUserOrdersFrameBase {
  snapshot: true;
  stateHead: ExchangeWsBlockContext | null;
}

export interface ExchangeWsUserOrdersDeltaFrame extends ExchangeWsUserOrdersFrameBase {
  snapshot: false;
  sourceBlock: ExchangeWsBlockContext;
}

export type ExchangeWsUserOrdersFrame =
  | ExchangeWsUserOrdersSnapshotFrame
  | ExchangeWsUserOrdersDeltaFrame;

export interface ExchangeWsUserBalance {
  tokenAddress: Address;
  freeBalance: bigint;
  reservedBalance: bigint;
}

interface ExchangeWsUserBalancesFrameBase extends ExchangeWsFrameHeader, ExchangeWsUserContext {
  kind: "userBalances";
  balances: ExchangeWsUserBalance[];
}

export interface ExchangeWsUserBalancesSnapshotFrame extends ExchangeWsUserBalancesFrameBase {
  snapshot: true;
  stateHead: ExchangeWsBlockContext | null;
}

export interface ExchangeWsUserBalancesDeltaFrame extends ExchangeWsUserBalancesFrameBase {
  snapshot: false;
  sourceBlock: ExchangeWsBlockContext;
}

export type ExchangeWsUserBalancesFrame =
  | ExchangeWsUserBalancesSnapshotFrame
  | ExchangeWsUserBalancesDeltaFrame;

export interface ExchangeWsActiveFifoLiquidity {
  kind: "activeFifo";
  slotIndex: number;
  orderId: bigint;
  makerSide: ExchangeWsSide;
  remainingBaseAfter: bigint;
}

export interface ExchangeWsPassiveBandLiquidity {
  kind: "passiveBand";
  lowPriceTick: bigint;
  passiveSideRemainingAfter: bigint;
}

export type ExchangeWsUserTradeLiquidity =
  | ExchangeWsActiveFifoLiquidity
  | ExchangeWsPassiveBandLiquidity;

export interface ExchangeWsUserTrade {
  marketAddress: Address;
  tradeId: bigint;
  recordIndex: number;
  takerSide: ExchangeWsSide;
  priceTick: bigint;
  baseFilled: bigint;
  liquidity: ExchangeWsUserTradeLiquidity;
}

export interface ExchangeWsUserTradesFrame extends ExchangeWsFrameHeader, ExchangeWsUserContext {
  kind: "userTrades";
  sourceBlock: ExchangeWsBlockContext;
  trades: ExchangeWsUserTrade[];
}

export type ExchangeWsLifecycleAction =
  | "blockProposed"
  | "blockVoted"
  | "blockFinalized"
  | "blockExecuted"
  | "branchDropped";

export type ExchangeWsBranchDropReason =
  | "competingBlock"
  | "sourceDroppedSignal"
  | "parentNotCanonical"
  | "sourceCorrection";

export interface ExchangeWsLifecycleEvent {
  action: ExchangeWsLifecycleAction;
  blockNumber: bigint;
  blockId: Hex;
  parentBlockId: Hex | null;
  dropReason: ExchangeWsBranchDropReason | null;
  replacementBlockId: Hex | null;
}

export interface ExchangeWsMarketLifecycleFrame extends ExchangeWsMarketFrame {
  kind: "lifecycle";
  scope: "market";
  event: ExchangeWsLifecycleEvent;
}

export interface ExchangeWsUserLifecycleFrame extends ExchangeWsFrameHeader, ExchangeWsUserContext {
  kind: "lifecycle";
  scope: "user";
  event: ExchangeWsLifecycleEvent;
}

export type ExchangeWsLifecycleFrame =
  | ExchangeWsMarketLifecycleFrame
  | ExchangeWsUserLifecycleFrame;

export type ExchangeWsFrame =
  | ExchangeWsL2BookFrame
  | ExchangeWsL2DeltaFrame
  | ExchangeWsMarketTradesFrame
  | ExchangeWsLifecycleFrame
  | ExchangeWsBboFrame
  | ExchangeWsAllMidsFrame
  | ExchangeWsUserOrdersFrame
  | ExchangeWsUserBalancesFrame
  | ExchangeWsUserTradesFrame;

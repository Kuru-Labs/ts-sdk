import { bytesToHex, type Address, type Hex } from "viem";

import { KuruSdkError } from "../errors";
import type {
  ExchangeWsAllMidsFrame,
  ExchangeWsBboFrame,
  ExchangeWsBboLevel,
  ExchangeWsBinaryInput,
  ExchangeWsBlobLike,
  ExchangeWsBlockContext,
  ExchangeWsBranchDropReason,
  ExchangeWsCompactL2BookFrame,
  ExchangeWsCompactL2Level,
  ExchangeWsExtendedL2BookFrame,
  ExchangeWsExtendedL2Level,
  ExchangeWsFrame,
  ExchangeWsL2BookFrame,
  ExchangeWsL2DeltaFrame,
  ExchangeWsL2DeltaUpdate,
  ExchangeWsL2Grouping,
  ExchangeWsLifecycleAction,
  ExchangeWsLifecycleEvent,
  ExchangeWsLifecycleFrame,
  ExchangeWsMarketTrade,
  ExchangeWsMarketTradesFrame,
  ExchangeWsSide,
  ExchangeWsUserBalance,
  ExchangeWsUserBalancesFrame,
  ExchangeWsUserContext,
  ExchangeWsUserOrder,
  ExchangeWsUserOrderEvent,
  ExchangeWsUserOrderSource,
  ExchangeWsUserOrdersFrame,
  ExchangeWsUserTrade,
  ExchangeWsUserTradeLiquidity,
  ExchangeWsUserTradesFrame,
  ExchangeWsView
} from "./types";

const MAGIC = Uint8Array.of(0x4b, 0x58, 0x4d, 0x44);
const WIRE_VERSION = 1;
const ZERO_HASH = `0x${"00".repeat(32)}`;

const KIND = {
  L2_BOOK: 1,
  L2_DELTA: 2,
  TRADES: 3,
  LIFECYCLE: 4,
  BBO: 5,
  ALL_MIDS: 6,
  USER_ORDERS: 7,
  USER_BALANCES: 8,
  USER_TRADES: 9
} as const;

interface DecodedHeader {
  wireVersion: 1;
  kind: number;
  view: ExchangeWsView;
  flags: number;
  feedEpoch: bigint;
}

function invalidFrame(message: string): never {
  throw new KuruSdkError("INVALID_EXCHANGE_WS_FRAME", message);
}

class ByteReader {
  readonly bytes: Uint8Array;
  readonly view: DataView;
  offset = 0;

  constructor(input: ExchangeWsBinaryInput) {
    this.bytes = toUint8Array(input);
    this.view = new DataView(this.bytes.buffer, this.bytes.byteOffset, this.bytes.byteLength);
  }

  get remaining(): number {
    return this.bytes.byteLength - this.offset;
  }

  require(length: number, field: string): void {
    if (!Number.isSafeInteger(length) || length < 0 || length > this.remaining) {
      invalidFrame(
        `Exchange WebSocket frame is truncated while reading ${field} at byte ${this.offset}.`
      );
    }
  }

  readBytes(length: number, field: string): Uint8Array {
    this.require(length, field);
    const value = this.bytes.subarray(this.offset, this.offset + length);
    this.offset += length;
    return value;
  }

  readU8(field: string): number {
    this.require(1, field);
    const value = this.view.getUint8(this.offset);
    this.offset += 1;
    return value;
  }

  readU16(field: string): number {
    this.require(2, field);
    const value = this.view.getUint16(this.offset, false);
    this.offset += 2;
    return value;
  }

  readU32(field: string): number {
    this.require(4, field);
    const value = this.view.getUint32(this.offset, false);
    this.offset += 4;
    return value;
  }

  readU64(field: string): bigint {
    this.require(8, field);
    const value = this.view.getBigUint64(this.offset, false);
    this.offset += 8;
    return value;
  }

  readI64(field: string): bigint {
    this.require(8, field);
    const value = this.view.getBigInt64(this.offset, false);
    this.offset += 8;
    return value;
  }

  readU128(field: string): bigint {
    const high = this.readU64(`${field} high word`);
    const low = this.readU64(`${field} low word`);
    return (high << 64n) | low;
  }

  readI128(field: string): bigint {
    const unsigned = this.readU128(field);
    return (unsigned & (1n << 127n)) === 0n ? unsigned : unsigned - (1n << 128n);
  }

  readBoolean(field: string): boolean {
    const value = this.readU8(field);
    if (value !== 0 && value !== 1) {
      invalidFrame(`${field} must be encoded as 0 or 1, received ${value}.`);
    }
    return value === 1;
  }

  readHex(length: number, field: string): Hex {
    return bytesToHex(this.readBytes(length, field));
  }

  readAddress(field: string): Address {
    return this.readHex(20, field);
  }

  expectZeroBytes(length: number, field: string): void {
    const bytes = this.readBytes(length, field);
    if (!isZeroBytes(bytes)) {
      invalidFrame(`${field} must be zero-filled.`);
    }
  }

  finish(): void {
    if (this.remaining !== 0) {
      invalidFrame(`Exchange WebSocket frame has ${this.remaining} unexpected trailing bytes.`);
    }
  }
}

function toUint8Array(input: ExchangeWsBinaryInput): Uint8Array {
  if (input instanceof ArrayBuffer) {
    return new Uint8Array(input);
  }
  if (ArrayBuffer.isView(input)) {
    return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  }
  return invalidFrame("Exchange WebSocket payload must be an ArrayBuffer or an ArrayBuffer view.");
}

function isBlobLike(input: unknown): input is ExchangeWsBlobLike {
  return (
    typeof input === "object" &&
    input !== null &&
    "arrayBuffer" in input &&
    typeof input.arrayBuffer === "function"
  );
}

function isZeroBytes(bytes: Uint8Array): boolean {
  for (const byte of bytes) {
    if (byte !== 0) return false;
  }
  return true;
}

function assertFlags(flags: number, expected: number, kind: string): void {
  if (flags !== expected) {
    invalidFrame(`${kind} flags must be ${expected}, received ${flags}.`);
  }
}

function assertCountFits(reader: ByteReader, count: number, width: number, field: string): void {
  if (count > Math.floor(reader.remaining / width)) {
    invalidFrame(`${field} exceeds the records available in the frame.`);
  }
}

function optionalSequence(value: bigint): bigint | null {
  return value === 0n ? null : value;
}

function decodeHeader(reader: ByteReader): DecodedHeader {
  const magic = reader.readBytes(4, "magic");
  if (!magic.every((byte, index) => byte === MAGIC[index])) {
    invalidFrame("Exchange WebSocket frame has an invalid KXMD magic header.");
  }

  const version = reader.readU8("wire version");
  if (version !== WIRE_VERSION) {
    throw new KuruSdkError(
      "UNSUPPORTED_EXCHANGE_WS_VERSION",
      `Unsupported Exchange WebSocket wire version ${version}; expected ${WIRE_VERSION}.`
    );
  }

  const kind = reader.readU8("message kind");
  const view = decodeView(reader.readU8("view"));
  const flags = reader.readU8("flags");
  const feedEpoch = reader.readU64("feed epoch");
  return { wireVersion: 1, kind, view, flags, feedEpoch };
}

function decodeView(value: number): ExchangeWsView {
  if (value === 1) return "proposed";
  if (value === 2) return "voted";
  if (value === 3) return "finalized";
  return invalidFrame(`Unknown Exchange WebSocket view code ${value}.`);
}

function decodeSide(value: number, field: string): ExchangeWsSide {
  if (value === 1) return "buy";
  if (value === 2) return "sell";
  return invalidFrame(`Unknown ${field} side code ${value}.`);
}

function decodeBlockContext(reader: ByteReader, field: string): ExchangeWsBlockContext {
  return {
    blockNumber: reader.readU64(`${field} block number`),
    blockId: reader.readHex(32, `${field} block ID`)
  };
}

function decodeOptionalBlockContext(
  reader: ByteReader,
  field: string
): ExchangeWsBlockContext | null {
  const present = reader.readBoolean(`${field} present`);
  const blockNumber = reader.readU64(`${field} block number`);
  const blockId = reader.readHex(32, `${field} block ID`);
  if (!present) {
    if (blockNumber !== 0n || blockId !== ZERO_HASH) {
      invalidFrame(`Absent ${field} must have zero-filled block fields.`);
    }
    return null;
  }
  return { blockNumber, blockId };
}

function decodeMarketContext(reader: ByteReader) {
  return {
    marketAddress: reader.readAddress("market address"),
    marketSeq: reader.readU64("market sequence"),
    globalSeq: reader.readU64("global sequence")
  };
}

function decodeUserContext(reader: ByteReader): ExchangeWsUserContext {
  return {
    userId: reader.readU64("user ID"),
    globalUserSeq: optionalSequence(reader.readU64("global user sequence")),
    globalSeq: optionalSequence(reader.readU64("global sequence")),
    previousGlobalUserSeq: optionalSequence(reader.readU64("previous global user sequence"))
  };
}

function decodeGrouping(reader: ByteReader): ExchangeWsL2Grouping {
  const code = reader.readU8("grouping code");
  const nativeTickSize = reader.readU64("native tick grouping size");
  const figures = reader.readU8("significant figures");
  const mantissa = reader.readU8("significant-figure mantissa");
  reader.expectZeroBytes(2, "L2 grouping reserved bytes");

  if (code === 0) {
    if (nativeTickSize !== 0n || figures !== 0 || mantissa !== 0) {
      invalidFrame("Ungrouped L2 snapshots must zero all grouping parameters.");
    }
    return { kind: "none" };
  }
  if (code === 1) {
    if (figures !== 0 || mantissa !== 0) {
      invalidFrame("Native-tick grouping must zero significant-figure parameters.");
    }
    return { kind: "nativeTick", tickSize: nativeTickSize };
  }
  if (code === 2) {
    if (nativeTickSize !== 0n) {
      invalidFrame("Significant-figure grouping must zero the native tick size.");
    }
    return {
      kind: "significantFigures",
      figures,
      mantissa: mantissa === 0 ? null : mantissa
    };
  }
  return invalidFrame(`Unknown L2 grouping code ${code}.`);
}

function decodeCompactLevel(reader: ByteReader, field: string): ExchangeWsCompactL2Level {
  return {
    priceX18: reader.readI128(`${field} price x18`),
    totalBaseX18: reader.readU128(`${field} total base x18`)
  };
}

function decodeExtendedLevel(reader: ByteReader, field: string): ExchangeWsExtendedL2Level {
  return {
    ...decodeCompactLevel(reader, field),
    activeBaseX18: reader.readU128(`${field} active base x18`),
    passiveBaseX18: reader.readU128(`${field} passive base x18`),
    activeOrderCount: reader.readU32(`${field} active order count`)
  };
}

function decodeL2Book(reader: ByteReader, header: DecodedHeader): ExchangeWsL2BookFrame {
  if (header.flags !== 1 && header.flags !== 2) {
    invalidFrame(
      `L2 book flags must select compact (1) or extended (2), received ${header.flags}.`
    );
  }
  const market = decodeMarketContext(reader);
  const stateHead = decodeBlockContext(reader, "state head");
  const durationMs = reader.readU64("coalesce duration");
  const maxDepthPerSide = reader.readU32("maximum depth per side");
  const grouping = decodeGrouping(reader);
  const bidCount = reader.readU32("bid count");
  const askCount = reader.readU32("ask count");
  const count = bidCount + askCount;

  if (header.flags === 1) {
    assertCountFits(reader, count, 32, "L2 compact level count");
    const levels: ExchangeWsCompactL2Level[] = [];
    for (let index = 0; index < count; index++) {
      levels.push(decodeCompactLevel(reader, `L2 level ${index}`));
    }
    const frame: ExchangeWsCompactL2BookFrame = {
      wireVersion: 1,
      feedEpoch: header.feedEpoch,
      kind: "l2Book",
      view: header.view,
      ...market,
      stateHead,
      durationMs,
      maxDepthPerSide,
      grouping,
      levelFormat: "compact",
      bids: levels.slice(0, bidCount),
      asks: levels.slice(bidCount)
    };
    return frame;
  }

  assertCountFits(reader, count, 68, "L2 extended level count");
  const levels: ExchangeWsExtendedL2Level[] = [];
  for (let index = 0; index < count; index++) {
    levels.push(decodeExtendedLevel(reader, `L2 level ${index}`));
  }
  const frame: ExchangeWsExtendedL2BookFrame = {
    wireVersion: 1,
    feedEpoch: header.feedEpoch,
    kind: "l2Book",
    view: header.view,
    ...market,
    stateHead,
    durationMs,
    maxDepthPerSide,
    grouping,
    levelFormat: "extended",
    bids: levels.slice(0, bidCount),
    asks: levels.slice(bidCount)
  };
  return frame;
}

function decodeL2Delta(reader: ByteReader, header: DecodedHeader): ExchangeWsL2DeltaFrame {
  assertFlags(header.flags, 0, "L2 delta");
  const market = decodeMarketContext(reader);
  const sourceBlock = decodeBlockContext(reader, "source");
  const count = reader.readU32("L2 update count");
  assertCountFits(reader, count, 61, "L2 update count");
  const updates: ExchangeWsL2DeltaUpdate[] = [];
  for (let index = 0; index < count; index++) {
    updates.push({
      side: decodeSide(reader.readU8(`L2 update ${index} side`), "L2 update"),
      priceTick: reader.readI64(`L2 update ${index} price tick`),
      totalBaseAfter: reader.readU128(`L2 update ${index} total base after`),
      activeBaseAfter: reader.readU128(`L2 update ${index} active base after`),
      passiveBaseAfter: reader.readU128(`L2 update ${index} passive base after`),
      activeOrderCountAfter: reader.readU32(`L2 update ${index} active order count after`)
    });
  }
  return {
    wireVersion: 1,
    feedEpoch: header.feedEpoch,
    kind: "l2Delta",
    view: header.view,
    ...market,
    sourceBlock,
    updates
  };
}

function decodeMarketTrades(
  reader: ByteReader,
  header: DecodedHeader
): ExchangeWsMarketTradesFrame {
  assertFlags(header.flags, 0, "market trades");
  const market = decodeMarketContext(reader);
  const sourceBlock = decodeBlockContext(reader, "source");
  const count = reader.readU32("trade count");
  assertCountFits(reader, count, 35, "trade count");
  const trades: ExchangeWsMarketTrade[] = [];
  for (let index = 0; index < count; index++) {
    trades.push({
      tradeId: reader.readU64(`trade ${index} ID`),
      recordIndex: reader.readU16(`trade ${index} record index`),
      takerSide: decodeSide(reader.readU8(`trade ${index} taker side`), "trade taker"),
      priceTick: reader.readI64(`trade ${index} price tick`),
      baseFilled: reader.readU128(`trade ${index} base filled`)
    });
  }
  return {
    wireVersion: 1,
    feedEpoch: header.feedEpoch,
    kind: "trades",
    view: header.view,
    ...market,
    sourceBlock,
    trades
  };
}

function decodeOptionalBboLevel(reader: ByteReader, field: string): ExchangeWsBboLevel | null {
  const present = reader.readBoolean(`${field} present`);
  const priceX18 = reader.readI128(`${field} price x18`);
  const totalBaseX18 = reader.readU128(`${field} total base x18`);
  if (!present) {
    if (priceX18 !== 0n || totalBaseX18 !== 0n) {
      invalidFrame(`Absent ${field} must have zero-filled price and size fields.`);
    }
    return null;
  }
  return { priceX18, totalBaseX18 };
}

function decodeBbo(reader: ByteReader, header: DecodedHeader): ExchangeWsBboFrame {
  assertFlags(header.flags, 0, "BBO");
  const market = decodeMarketContext(reader);
  return {
    wireVersion: 1,
    feedEpoch: header.feedEpoch,
    kind: "bbo",
    view: header.view,
    ...market,
    stateHead: decodeBlockContext(reader, "state head"),
    bid: decodeOptionalBboLevel(reader, "bid"),
    ask: decodeOptionalBboLevel(reader, "ask")
  };
}

function decodeAllMids(reader: ByteReader, header: DecodedHeader): ExchangeWsAllMidsFrame {
  assertFlags(header.flags, 0, "all mids");
  const count = reader.readU32("market count");
  assertCountFits(reader, count, 36, "market count");
  const mids = [];
  for (let index = 0; index < count; index++) {
    mids.push({
      marketAddress: reader.readAddress(`mid ${index} market address`),
      midpointX18: reader.readI128(`mid ${index} midpoint x18`)
    });
  }
  return {
    wireVersion: 1,
    feedEpoch: header.feedEpoch,
    kind: "allMids",
    view: header.view,
    mids
  };
}

function decodeLifecycleAction(value: number): ExchangeWsLifecycleAction {
  if (value === 1) return "blockProposed";
  if (value === 2) return "blockVoted";
  if (value === 3) return "blockFinalized";
  if (value === 4) return "blockExecuted";
  if (value === 5) return "branchDropped";
  return invalidFrame(`Unknown lifecycle action code ${value}.`);
}

function decodeDropReason(value: number): ExchangeWsBranchDropReason {
  if (value === 1) return "competingBlock";
  if (value === 2) return "sourceDroppedSignal";
  if (value === 3) return "parentNotCanonical";
  if (value === 4) return "sourceCorrection";
  return invalidFrame(`Unknown branch-drop reason code ${value}.`);
}

function decodeLifecycleEvent(reader: ByteReader): ExchangeWsLifecycleEvent {
  const action = decodeLifecycleAction(reader.readU8("lifecycle action"));
  reader.expectZeroBytes(3, "lifecycle reserved bytes");
  const blockNumber = reader.readU64("lifecycle block number");
  const blockId = reader.readHex(32, "lifecycle block ID");
  const parentBlockId = reader.readHex(32, "lifecycle parent block ID");
  const reasonCode = reader.readU8("branch-drop reason");
  const replacementPresent = reader.readBoolean("replacement block present");
  reader.expectZeroBytes(2, "lifecycle replacement reserved bytes");
  const replacementBlockId = reader.readHex(32, "replacement block ID");

  const omitsParent = action === "blockVoted" || action === "blockFinalized";
  if (omitsParent && parentBlockId !== ZERO_HASH) {
    invalidFrame(`${action} must have a zero-filled parent block ID.`);
  }

  if (action !== "branchDropped") {
    if (reasonCode !== 0 || replacementPresent || replacementBlockId !== ZERO_HASH) {
      invalidFrame("Non-drop lifecycle events must zero branch-drop fields.");
    }
    return {
      action,
      blockNumber,
      blockId,
      parentBlockId: omitsParent ? null : parentBlockId,
      dropReason: null,
      replacementBlockId: null
    };
  }

  const dropReason = decodeDropReason(reasonCode);
  if (!replacementPresent && replacementBlockId !== ZERO_HASH) {
    invalidFrame("Absent replacement block must have a zero-filled block ID.");
  }
  return {
    action,
    blockNumber,
    blockId,
    parentBlockId,
    dropReason,
    replacementBlockId: replacementPresent ? replacementBlockId : null
  };
}

function decodeLifecycle(reader: ByteReader, header: DecodedHeader): ExchangeWsLifecycleFrame {
  assertFlags(header.flags, 0, "lifecycle");
  if (reader.remaining === 148) {
    const market = decodeMarketContext(reader);
    return {
      wireVersion: 1,
      feedEpoch: header.feedEpoch,
      kind: "lifecycle",
      scope: "market",
      view: header.view,
      ...market,
      event: decodeLifecycleEvent(reader)
    };
  }
  if (reader.remaining === 144) {
    const user = decodeUserContext(reader);
    return {
      wireVersion: 1,
      feedEpoch: header.feedEpoch,
      kind: "lifecycle",
      scope: "user",
      view: header.view,
      ...user,
      event: decodeLifecycleEvent(reader)
    };
  }
  return invalidFrame(
    `Lifecycle frame payload must be 144 user bytes or 148 market bytes, received ${reader.remaining}.`
  );
}

function decodeUserOrder(reader: ByteReader, index: number): ExchangeWsUserOrder {
  const prefix = `user order ${index}`;
  const marketAddress = reader.readAddress(`${prefix} market address`);
  const orderId = reader.readU64(`${prefix} ID`);
  const slotIdx = reader.readU8(`${prefix} slot index`);
  const side = decodeSide(reader.readU8(`${prefix} side`), "user order");
  const priceTick = reader.readI64(`${prefix} price tick`);
  const remainingBase = reader.readU128(`${prefix} remaining base`);
  const minSizePresent = reader.readBoolean(`${prefix} min-size-after-block present`);
  const minSizeValue = reader.readU64(`${prefix} min-size-after-block`);
  const clientOrderIdPresent = reader.readBoolean(`${prefix} client order ID present`);
  const clientOrderIdValue = reader.readHex(32, `${prefix} client order ID`);

  if (!minSizePresent && minSizeValue !== 0n) {
    invalidFrame(`Absent ${prefix} min-size-after-block must be zero.`);
  }
  if (!clientOrderIdPresent && clientOrderIdValue !== ZERO_HASH) {
    invalidFrame(`Absent ${prefix} client order ID must be zero-filled.`);
  }
  return {
    marketAddress,
    orderId,
    slotIdx,
    side,
    priceTick,
    remainingBase,
    minSizeAfterBlock: minSizePresent ? minSizeValue : null,
    clientOrderId: clientOrderIdPresent ? clientOrderIdValue : null
  };
}

function decodeUserOrderSource(reader: ByteReader, index: number): ExchangeWsUserOrderSource {
  const prefix = `user-order event ${index} source`;
  return {
    txHash: reader.readHex(32, `${prefix} transaction hash`),
    txIdx: reader.readU32(`${prefix} transaction index`),
    logIdx: reader.readU32(`${prefix} log index`),
    recordIdx: reader.readU16(`${prefix} record index`)
  };
}

function decodeUserOrderEvent(reader: ByteReader, index: number): ExchangeWsUserOrderEvent {
  const code = reader.readU8(`user-order event ${index} code`);
  if (code < 1 || code > 4) {
    invalidFrame(`Unknown user-order event code ${code}.`);
  }
  const source = decodeUserOrderSource(reader, index);
  if (code === 1) {
    const makerId = reader.readU64(`user-order event ${index} maker user ID`);
    return {
      kind: "created",
      source,
      makerId,
      ...decodeUserOrder(reader, index)
    };
  }
  if (code === 2) {
    return {
      kind: "trade",
      source,
      takerId: reader.readU64(`user-order event ${index} taker user ID`),
      makerId: reader.readU64(`user-order event ${index} maker user ID`),
      marketAddress: reader.readAddress(`user-order event ${index} market address`),
      orderId: reader.readU64(`user-order event ${index} order ID`),
      tradeId: reader.readU64(`user-order event ${index} trade ID`),
      slotIdx: reader.readU8(`user-order event ${index} slot index`),
      filledSize: reader.readU128(`user-order event ${index} filled size`),
      updatedSize: reader.readU128(`user-order event ${index} updated size`)
    };
  }
  if (code === 3) {
    return {
      kind: "cancelled",
      source,
      makerId: reader.readU64(`user-order event ${index} maker user ID`),
      marketAddress: reader.readAddress(`user-order event ${index} market address`),
      orderId: reader.readU64(`user-order event ${index} order ID`),
      slotIdx: reader.readU8(`user-order event ${index} slot index`)
    };
  }
  if (code === 4) {
    return {
      kind: "rab-reduced",
      source,
      makerId: reader.readU64(`user-order event ${index} maker user ID`),
      marketAddress: reader.readAddress(`user-order event ${index} market address`),
      orderId: reader.readU64(`user-order event ${index} order ID`),
      slotIdx: reader.readU8(`user-order event ${index} slot index`),
      updatedSize: reader.readU128(`user-order event ${index} updated size`)
    };
  }
  return invalidFrame(`Unknown user-order event code ${code}.`);
}

function decodeUserOrders(reader: ByteReader, header: DecodedHeader): ExchangeWsUserOrdersFrame {
  if (header.flags !== 0 && header.flags !== 1) {
    invalidFrame(`User-orders flags must be delta (0) or snapshot (1), received ${header.flags}.`);
  }
  const snapshot = header.flags === 1;
  const user = decodeUserContext(reader);
  const block = snapshot
    ? decodeOptionalBlockContext(reader, "state head")
    : decodeBlockContext(reader, "source");

  const common = {
    wireVersion: 1 as const,
    feedEpoch: header.feedEpoch,
    kind: "userOrders" as const,
    view: header.view,
    ...user
  };
  if (snapshot) {
    const count = reader.readU32("user-order snapshot count");
    assertCountFits(reader, count, 96, "user-order snapshot count");
    const orders: ExchangeWsUserOrder[] = [];
    for (let index = 0; index < count; index++) {
      orders.push(decodeUserOrder(reader, index));
    }
    const reservedRemovalCount = reader.readU32("reserved user-order removal count");
    if (reservedRemovalCount !== 0) {
      invalidFrame(
        `Reserved user-order snapshot removal count must be zero, received ${reservedRemovalCount}.`
      );
    }
    return { ...common, snapshot: true, stateHead: block, orders };
  }

  const count = reader.readU32("user-order event count");
  assertCountFits(reader, count, 80, "user-order event count");
  const events: ExchangeWsUserOrderEvent[] = [];
  for (let index = 0; index < count; index++) {
    events.push(decodeUserOrderEvent(reader, index));
  }
  return {
    ...common,
    snapshot: false,
    sourceBlock: block as ExchangeWsBlockContext,
    events
  };
}

function decodeTokenAddress(reader: ByteReader, field: string): Address {
  reader.expectZeroBytes(12, `${field} left padding`);
  return reader.readAddress(field);
}

function decodeUserBalance(reader: ByteReader, index: number): ExchangeWsUserBalance {
  return {
    tokenAddress: decodeTokenAddress(reader, `user balance ${index} token address`),
    freeBalance: reader.readU128(`user balance ${index} free balance`),
    reservedBalance: reader.readU128(`user balance ${index} reserved balance`)
  };
}

function decodeUserBalances(
  reader: ByteReader,
  header: DecodedHeader
): ExchangeWsUserBalancesFrame {
  if (header.flags !== 0 && header.flags !== 1) {
    invalidFrame(
      `User-balances flags must be delta (0) or snapshot (1), received ${header.flags}.`
    );
  }
  const snapshot = header.flags === 1;
  const user = decodeUserContext(reader);
  const block = snapshot
    ? decodeOptionalBlockContext(reader, "state head")
    : decodeBlockContext(reader, "source");
  const count = reader.readU32("user-balance count");
  assertCountFits(reader, count, 64, "user-balance count");
  const balances: ExchangeWsUserBalance[] = [];
  for (let index = 0; index < count; index++) {
    balances.push(decodeUserBalance(reader, index));
  }

  const common = {
    wireVersion: 1 as const,
    feedEpoch: header.feedEpoch,
    kind: "userBalances" as const,
    view: header.view,
    ...user,
    balances
  };
  return snapshot
    ? { ...common, snapshot: true, stateHead: block }
    : { ...common, snapshot: false, sourceBlock: block as ExchangeWsBlockContext };
}

function decodeUserTradeLiquidity(reader: ByteReader, index: number): ExchangeWsUserTradeLiquidity {
  const code = reader.readU8(`user trade ${index} liquidity code`);
  if (code === 1) {
    return {
      kind: "activeFifo",
      slotIndex: reader.readU8(`user trade ${index} maker slot index`),
      orderId: reader.readU64(`user trade ${index} maker order ID`),
      makerSide: decodeSide(reader.readU8(`user trade ${index} maker side`), "user trade maker"),
      remainingBaseAfter: reader.readU128(`user trade ${index} maker remaining base after`)
    };
  }
  if (code === 2) {
    return {
      kind: "passiveBand",
      lowPriceTick: reader.readI64(`user trade ${index} low price tick`),
      passiveSideRemainingAfter: reader.readU128(
        `user trade ${index} passive-side remaining base after`
      )
    };
  }
  return invalidFrame(`Unknown user-trade liquidity code ${code}.`);
}

function decodeUserTrades(reader: ByteReader, header: DecodedHeader): ExchangeWsUserTradesFrame {
  assertFlags(header.flags, 0, "user trades");
  const user = decodeUserContext(reader);
  const sourceBlock = decodeBlockContext(reader, "source");
  const count = reader.readU32("user-trade count");
  assertCountFits(reader, count, 96, "user-trade count");
  const trades: ExchangeWsUserTrade[] = [];
  for (let index = 0; index < count; index++) {
    trades.push({
      marketAddress: reader.readAddress(`user trade ${index} market address`),
      tradeId: reader.readU64(`user trade ${index} ID`),
      recordIndex: reader.readU16(`user trade ${index} record index`),
      users: [
        reader.readU64(`user trade ${index} taker user ID`),
        reader.readU64(`user trade ${index} maker user ID`)
      ],
      takerSide: decodeSide(reader.readU8(`user trade ${index} taker side`), "user trade taker"),
      priceTick: reader.readI64(`user trade ${index} price tick`),
      baseFilled: reader.readU128(`user trade ${index} base filled`),
      liquidity: decodeUserTradeLiquidity(reader, index)
    });
  }
  return {
    wireVersion: 1,
    feedEpoch: header.feedEpoch,
    kind: "userTrades",
    view: header.view,
    ...user,
    sourceBlock,
    trades
  };
}

export function decodeExchangeWsFrame(input: ExchangeWsBinaryInput): ExchangeWsFrame {
  const reader = new ByteReader(input);
  const header = decodeHeader(reader);
  let frame: ExchangeWsFrame;
  switch (header.kind) {
    case KIND.L2_BOOK:
      frame = decodeL2Book(reader, header);
      break;
    case KIND.L2_DELTA:
      frame = decodeL2Delta(reader, header);
      break;
    case KIND.TRADES:
      frame = decodeMarketTrades(reader, header);
      break;
    case KIND.LIFECYCLE:
      frame = decodeLifecycle(reader, header);
      break;
    case KIND.BBO:
      frame = decodeBbo(reader, header);
      break;
    case KIND.ALL_MIDS:
      frame = decodeAllMids(reader, header);
      break;
    case KIND.USER_ORDERS:
      frame = decodeUserOrders(reader, header);
      break;
    case KIND.USER_BALANCES:
      frame = decodeUserBalances(reader, header);
      break;
    case KIND.USER_TRADES:
      frame = decodeUserTrades(reader, header);
      break;
    default:
      return invalidFrame(`Unknown Exchange WebSocket message kind ${header.kind}.`);
  }
  reader.finish();
  return frame;
}

export async function decodeExchangeWsMessage(
  input: ExchangeWsBinaryInput | ExchangeWsBlobLike
): Promise<ExchangeWsFrame> {
  if (input instanceof ArrayBuffer || ArrayBuffer.isView(input)) {
    return decodeExchangeWsFrame(input);
  }
  if (isBlobLike(input)) {
    return decodeExchangeWsFrame(await input.arrayBuffer());
  }
  return invalidFrame("Exchange WebSocket message is not a supported binary payload.");
}

function expectKind<K extends ExchangeWsFrame["kind"]>(
  input: ExchangeWsBinaryInput,
  kind: K
): Extract<ExchangeWsFrame, { kind: K }> {
  const frame = decodeExchangeWsFrame(input);
  if (frame.kind !== kind) {
    return invalidFrame(`Expected an ${kind} frame, received ${frame.kind}.`);
  }
  return frame as Extract<ExchangeWsFrame, { kind: K }>;
}

export function decodeL2BookFrame(input: ExchangeWsBinaryInput): ExchangeWsL2BookFrame {
  return expectKind(input, "l2Book");
}

export function decodeL2DeltaFrame(input: ExchangeWsBinaryInput): ExchangeWsL2DeltaFrame {
  return expectKind(input, "l2Delta");
}

export function decodeMarketTradesFrame(input: ExchangeWsBinaryInput): ExchangeWsMarketTradesFrame {
  return expectKind(input, "trades");
}

export function decodeLifecycleFrame(input: ExchangeWsBinaryInput): ExchangeWsLifecycleFrame {
  return expectKind(input, "lifecycle");
}

export function decodeBboFrame(input: ExchangeWsBinaryInput): ExchangeWsBboFrame {
  return expectKind(input, "bbo");
}

export function decodeAllMidsFrame(input: ExchangeWsBinaryInput): ExchangeWsAllMidsFrame {
  return expectKind(input, "allMids");
}

export function decodeUserOrdersFrame(input: ExchangeWsBinaryInput): ExchangeWsUserOrdersFrame {
  return expectKind(input, "userOrders");
}

export function decodeUserBalancesFrame(input: ExchangeWsBinaryInput): ExchangeWsUserBalancesFrame {
  return expectKind(input, "userBalances");
}

export function decodeUserTradesFrame(input: ExchangeWsBinaryInput): ExchangeWsUserTradesFrame {
  return expectKind(input, "userTrades");
}

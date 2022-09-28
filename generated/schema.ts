// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.

import {
  TypedMap,
  Entity,
  Value,
  ValueKind,
  store,
  Bytes,
  BigInt,
  BigDecimal
} from "@graphprotocol/graph-ts";

export class Factory extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save Factory entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        `Entities of type Factory must have an ID of type String but the id '${id.displayData()}' is of type ${id.displayKind()}`
      );
      store.set("Factory", id.toString(), this);
    }
  }

  static load(id: string): Factory | null {
    return changetype<Factory | null>(store.get("Factory", id));
  }

  get id(): string {
    let value = this.get("id");
    return value!.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get timestamp(): BigInt {
    let value = this.get("timestamp");
    return value!.toBigInt();
  }

  set timestamp(value: BigInt) {
    this.set("timestamp", Value.fromBigInt(value));
  }

  get fundCount(): BigInt {
    let value = this.get("fundCount");
    return value!.toBigInt();
  }

  set fundCount(value: BigInt) {
    this.set("fundCount", Value.fromBigInt(value));
  }

  get txCount(): BigInt {
    let value = this.get("txCount");
    return value!.toBigInt();
  }

  set txCount(value: BigInt) {
    this.set("txCount", Value.fromBigInt(value));
  }

  get totalVolumeUSD(): BigDecimal {
    let value = this.get("totalVolumeUSD");
    return value!.toBigDecimal();
  }

  set totalVolumeUSD(value: BigDecimal) {
    this.set("totalVolumeUSD", Value.fromBigDecimal(value));
  }

  get totalVolumeETH(): BigDecimal {
    let value = this.get("totalVolumeETH");
    return value!.toBigDecimal();
  }

  set totalVolumeETH(value: BigDecimal) {
    this.set("totalVolumeETH", Value.fromBigDecimal(value));
  }

  get owner(): string {
    let value = this.get("owner");
    return value!.toString();
  }

  set owner(value: string) {
    this.set("owner", Value.fromString(value));
  }
}

export class Token extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save Token entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        `Entities of type Token must have an ID of type String but the id '${id.displayData()}' is of type ${id.displayKind()}`
      );
      store.set("Token", id.toString(), this);
    }
  }

  static load(id: string): Token | null {
    return changetype<Token | null>(store.get("Token", id));
  }

  get id(): string {
    let value = this.get("id");
    return value!.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get symbol(): string {
    let value = this.get("symbol");
    return value!.toString();
  }

  set symbol(value: string) {
    this.set("symbol", Value.fromString(value));
  }

  get name(): string {
    let value = this.get("name");
    return value!.toString();
  }

  set name(value: string) {
    this.set("name", Value.fromString(value));
  }

  get decimals(): BigInt {
    let value = this.get("decimals");
    return value!.toBigInt();
  }

  set decimals(value: BigInt) {
    this.set("decimals", Value.fromBigInt(value));
  }

  get totalSupply(): BigInt {
    let value = this.get("totalSupply");
    return value!.toBigInt();
  }

  set totalSupply(value: BigInt) {
    this.set("totalSupply", Value.fromBigInt(value));
  }

  get volume(): BigDecimal {
    let value = this.get("volume");
    return value!.toBigDecimal();
  }

  set volume(value: BigDecimal) {
    this.set("volume", Value.fromBigDecimal(value));
  }

  get volumeUSD(): BigDecimal {
    let value = this.get("volumeUSD");
    return value!.toBigDecimal();
  }

  set volumeUSD(value: BigDecimal) {
    this.set("volumeUSD", Value.fromBigDecimal(value));
  }

  get untrackedVolumeUSD(): BigDecimal {
    let value = this.get("untrackedVolumeUSD");
    return value!.toBigDecimal();
  }

  set untrackedVolumeUSD(value: BigDecimal) {
    this.set("untrackedVolumeUSD", Value.fromBigDecimal(value));
  }

  get feesUSD(): BigDecimal {
    let value = this.get("feesUSD");
    return value!.toBigDecimal();
  }

  set feesUSD(value: BigDecimal) {
    this.set("feesUSD", Value.fromBigDecimal(value));
  }

  get txCount(): BigInt {
    let value = this.get("txCount");
    return value!.toBigInt();
  }

  set txCount(value: BigInt) {
    this.set("txCount", Value.fromBigInt(value));
  }

  get poolCount(): BigInt {
    let value = this.get("poolCount");
    return value!.toBigInt();
  }

  set poolCount(value: BigInt) {
    this.set("poolCount", Value.fromBigInt(value));
  }

  get totalValueLocked(): BigDecimal {
    let value = this.get("totalValueLocked");
    return value!.toBigDecimal();
  }

  set totalValueLocked(value: BigDecimal) {
    this.set("totalValueLocked", Value.fromBigDecimal(value));
  }

  get totalValueLockedUSD(): BigDecimal {
    let value = this.get("totalValueLockedUSD");
    return value!.toBigDecimal();
  }

  set totalValueLockedUSD(value: BigDecimal) {
    this.set("totalValueLockedUSD", Value.fromBigDecimal(value));
  }

  get totalValueLockedUSDUntracked(): BigDecimal {
    let value = this.get("totalValueLockedUSDUntracked");
    return value!.toBigDecimal();
  }

  set totalValueLockedUSDUntracked(value: BigDecimal) {
    this.set("totalValueLockedUSDUntracked", Value.fromBigDecimal(value));
  }

  get derivedETH(): BigDecimal {
    let value = this.get("derivedETH");
    return value!.toBigDecimal();
  }

  set derivedETH(value: BigDecimal) {
    this.set("derivedETH", Value.fromBigDecimal(value));
  }
}

export class Fund extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save Fund entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        `Entities of type Fund must have an ID of type String but the id '${id.displayData()}' is of type ${id.displayKind()}`
      );
      store.set("Fund", id.toString(), this);
    }
  }

  static load(id: string): Fund | null {
    return changetype<Fund | null>(store.get("Fund", id));
  }

  get id(): string {
    let value = this.get("id");
    return value!.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get createdAtTimestamp(): BigInt {
    let value = this.get("createdAtTimestamp");
    return value!.toBigInt();
  }

  set createdAtTimestamp(value: BigInt) {
    this.set("createdAtTimestamp", Value.fromBigInt(value));
  }

  get createdAtBlockNumber(): BigInt {
    let value = this.get("createdAtBlockNumber");
    return value!.toBigInt();
  }

  set createdAtBlockNumber(value: BigInt) {
    this.set("createdAtBlockNumber", Value.fromBigInt(value));
  }

  get manager(): Bytes {
    let value = this.get("manager");
    return value!.toBytes();
  }

  set manager(value: Bytes) {
    this.set("manager", Value.fromBytes(value));
  }

  get tokens(): Array<string> {
    let value = this.get("tokens");
    return value!.toStringArray();
  }

  set tokens(value: Array<string>) {
    this.set("tokens", Value.fromStringArray(value));
  }

  get principalETH(): BigDecimal {
    let value = this.get("principalETH");
    return value!.toBigDecimal();
  }

  set principalETH(value: BigDecimal) {
    this.set("principalETH", Value.fromBigDecimal(value));
  }

  get principalUSD(): BigDecimal {
    let value = this.get("principalUSD");
    return value!.toBigDecimal();
  }

  set principalUSD(value: BigDecimal) {
    this.set("principalUSD", Value.fromBigDecimal(value));
  }

  get profit(): BigInt {
    let value = this.get("profit");
    return value!.toBigInt();
  }

  set profit(value: BigInt) {
    this.set("profit", Value.fromBigInt(value));
  }

  get txCount(): BigInt {
    let value = this.get("txCount");
    return value!.toBigInt();
  }

  set txCount(value: BigInt) {
    this.set("txCount", Value.fromBigInt(value));
  }

  get collectedFeesUSD(): BigDecimal {
    let value = this.get("collectedFeesUSD");
    return value!.toBigDecimal();
  }

  set collectedFeesUSD(value: BigDecimal) {
    this.set("collectedFeesUSD", Value.fromBigDecimal(value));
  }

  get volumeETH(): BigDecimal {
    let value = this.get("volumeETH");
    return value!.toBigDecimal();
  }

  set volumeETH(value: BigDecimal) {
    this.set("volumeETH", Value.fromBigDecimal(value));
  }

  get volumeUSD(): BigDecimal {
    let value = this.get("volumeUSD");
    return value!.toBigDecimal();
  }

  set volumeUSD(value: BigDecimal) {
    this.set("volumeUSD", Value.fromBigDecimal(value));
  }

  get investorCount(): BigInt {
    let value = this.get("investorCount");
    return value!.toBigInt();
  }

  set investorCount(value: BigInt) {
    this.set("investorCount", Value.fromBigInt(value));
  }

  get fundHourData(): Array<string> {
    let value = this.get("fundHourData");
    return value!.toStringArray();
  }

  set fundHourData(value: Array<string>) {
    this.set("fundHourData", Value.fromStringArray(value));
  }

  get fundDayData(): Array<string> {
    let value = this.get("fundDayData");
    return value!.toStringArray();
  }

  set fundDayData(value: Array<string>) {
    this.set("fundDayData", Value.fromStringArray(value));
  }

  get deposits(): Array<string> {
    let value = this.get("deposits");
    return value!.toStringArray();
  }

  set deposits(value: Array<string>) {
    this.set("deposits", Value.fromStringArray(value));
  }

  get withdraws(): Array<string> {
    let value = this.get("withdraws");
    return value!.toStringArray();
  }

  set withdraws(value: Array<string>) {
    this.set("withdraws", Value.fromStringArray(value));
  }

  get swaps(): Array<string> {
    let value = this.get("swaps");
    return value!.toStringArray();
  }

  set swaps(value: Array<string>) {
    this.set("swaps", Value.fromStringArray(value));
  }
}

export class Transaction extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save Transaction entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        `Entities of type Transaction must have an ID of type String but the id '${id.displayData()}' is of type ${id.displayKind()}`
      );
      store.set("Transaction", id.toString(), this);
    }
  }

  static load(id: string): Transaction | null {
    return changetype<Transaction | null>(store.get("Transaction", id));
  }

  get id(): string {
    let value = this.get("id");
    return value!.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get blockNumber(): BigInt {
    let value = this.get("blockNumber");
    return value!.toBigInt();
  }

  set blockNumber(value: BigInt) {
    this.set("blockNumber", Value.fromBigInt(value));
  }

  get timestamp(): BigInt {
    let value = this.get("timestamp");
    return value!.toBigInt();
  }

  set timestamp(value: BigInt) {
    this.set("timestamp", Value.fromBigInt(value));
  }

  get gasUsed(): BigInt {
    let value = this.get("gasUsed");
    return value!.toBigInt();
  }

  set gasUsed(value: BigInt) {
    this.set("gasUsed", Value.fromBigInt(value));
  }

  get gasPrice(): BigInt {
    let value = this.get("gasPrice");
    return value!.toBigInt();
  }

  set gasPrice(value: BigInt) {
    this.set("gasPrice", Value.fromBigInt(value));
  }

  get deposits(): Array<string> {
    let value = this.get("deposits");
    return value!.toStringArray();
  }

  set deposits(value: Array<string>) {
    this.set("deposits", Value.fromStringArray(value));
  }

  get withdraws(): Array<string> {
    let value = this.get("withdraws");
    return value!.toStringArray();
  }

  set withdraws(value: Array<string>) {
    this.set("withdraws", Value.fromStringArray(value));
  }

  get swaps(): Array<string> {
    let value = this.get("swaps");
    return value!.toStringArray();
  }

  set swaps(value: Array<string>) {
    this.set("swaps", Value.fromStringArray(value));
  }
}

export class Deposit extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save Deposit entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        `Entities of type Deposit must have an ID of type String but the id '${id.displayData()}' is of type ${id.displayKind()}`
      );
      store.set("Deposit", id.toString(), this);
    }
  }

  static load(id: string): Deposit | null {
    return changetype<Deposit | null>(store.get("Deposit", id));
  }

  get id(): string {
    let value = this.get("id");
    return value!.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get transaction(): string {
    let value = this.get("transaction");
    return value!.toString();
  }

  set transaction(value: string) {
    this.set("transaction", Value.fromString(value));
  }

  get timestamp(): BigInt {
    let value = this.get("timestamp");
    return value!.toBigInt();
  }

  set timestamp(value: BigInt) {
    this.set("timestamp", Value.fromBigInt(value));
  }

  get fund(): string {
    let value = this.get("fund");
    return value!.toString();
  }

  set fund(value: string) {
    this.set("fund", Value.fromString(value));
  }

  get token(): string {
    let value = this.get("token");
    return value!.toString();
  }

  set token(value: string) {
    this.set("token", Value.fromString(value));
  }

  get owner(): Bytes {
    let value = this.get("owner");
    return value!.toBytes();
  }

  set owner(value: Bytes) {
    this.set("owner", Value.fromBytes(value));
  }

  get sender(): Bytes | null {
    let value = this.get("sender");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBytes();
    }
  }

  set sender(value: Bytes | null) {
    if (!value) {
      this.unset("sender");
    } else {
      this.set("sender", Value.fromBytes(<Bytes>value));
    }
  }

  get origin(): Bytes {
    let value = this.get("origin");
    return value!.toBytes();
  }

  set origin(value: Bytes) {
    this.set("origin", Value.fromBytes(value));
  }

  get amount(): BigDecimal {
    let value = this.get("amount");
    return value!.toBigDecimal();
  }

  set amount(value: BigDecimal) {
    this.set("amount", Value.fromBigDecimal(value));
  }

  get amountUSD(): BigDecimal | null {
    let value = this.get("amountUSD");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigDecimal();
    }
  }

  set amountUSD(value: BigDecimal | null) {
    if (!value) {
      this.unset("amountUSD");
    } else {
      this.set("amountUSD", Value.fromBigDecimal(<BigDecimal>value));
    }
  }

  get logIndex(): BigInt | null {
    let value = this.get("logIndex");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set logIndex(value: BigInt | null) {
    if (!value) {
      this.unset("logIndex");
    } else {
      this.set("logIndex", Value.fromBigInt(<BigInt>value));
    }
  }
}

export class Withdraw extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save Withdraw entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        `Entities of type Withdraw must have an ID of type String but the id '${id.displayData()}' is of type ${id.displayKind()}`
      );
      store.set("Withdraw", id.toString(), this);
    }
  }

  static load(id: string): Withdraw | null {
    return changetype<Withdraw | null>(store.get("Withdraw", id));
  }

  get id(): string {
    let value = this.get("id");
    return value!.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get transaction(): string {
    let value = this.get("transaction");
    return value!.toString();
  }

  set transaction(value: string) {
    this.set("transaction", Value.fromString(value));
  }

  get timestamp(): BigInt {
    let value = this.get("timestamp");
    return value!.toBigInt();
  }

  set timestamp(value: BigInt) {
    this.set("timestamp", Value.fromBigInt(value));
  }

  get fund(): string {
    let value = this.get("fund");
    return value!.toString();
  }

  set fund(value: string) {
    this.set("fund", Value.fromString(value));
  }

  get token(): string {
    let value = this.get("token");
    return value!.toString();
  }

  set token(value: string) {
    this.set("token", Value.fromString(value));
  }

  get owner(): Bytes | null {
    let value = this.get("owner");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBytes();
    }
  }

  set owner(value: Bytes | null) {
    if (!value) {
      this.unset("owner");
    } else {
      this.set("owner", Value.fromBytes(<Bytes>value));
    }
  }

  get sender(): Bytes | null {
    let value = this.get("sender");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBytes();
    }
  }

  set sender(value: Bytes | null) {
    if (!value) {
      this.unset("sender");
    } else {
      this.set("sender", Value.fromBytes(<Bytes>value));
    }
  }

  get origin(): Bytes {
    let value = this.get("origin");
    return value!.toBytes();
  }

  set origin(value: Bytes) {
    this.set("origin", Value.fromBytes(value));
  }

  get amount(): BigDecimal {
    let value = this.get("amount");
    return value!.toBigDecimal();
  }

  set amount(value: BigDecimal) {
    this.set("amount", Value.fromBigDecimal(value));
  }

  get amountUSD(): BigDecimal | null {
    let value = this.get("amountUSD");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigDecimal();
    }
  }

  set amountUSD(value: BigDecimal | null) {
    if (!value) {
      this.unset("amountUSD");
    } else {
      this.set("amountUSD", Value.fromBigDecimal(<BigDecimal>value));
    }
  }

  get logIndex(): BigInt | null {
    let value = this.get("logIndex");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set logIndex(value: BigInt | null) {
    if (!value) {
      this.unset("logIndex");
    } else {
      this.set("logIndex", Value.fromBigInt(<BigInt>value));
    }
  }
}

export class Swap extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save Swap entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        `Entities of type Swap must have an ID of type String but the id '${id.displayData()}' is of type ${id.displayKind()}`
      );
      store.set("Swap", id.toString(), this);
    }
  }

  static load(id: string): Swap | null {
    return changetype<Swap | null>(store.get("Swap", id));
  }

  get id(): string {
    let value = this.get("id");
    return value!.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get transaction(): string {
    let value = this.get("transaction");
    return value!.toString();
  }

  set transaction(value: string) {
    this.set("transaction", Value.fromString(value));
  }

  get timestamp(): BigInt {
    let value = this.get("timestamp");
    return value!.toBigInt();
  }

  set timestamp(value: BigInt) {
    this.set("timestamp", Value.fromBigInt(value));
  }

  get fund(): string {
    let value = this.get("fund");
    return value!.toString();
  }

  set fund(value: string) {
    this.set("fund", Value.fromString(value));
  }

  get token0(): string {
    let value = this.get("token0");
    return value!.toString();
  }

  set token0(value: string) {
    this.set("token0", Value.fromString(value));
  }

  get token1(): string {
    let value = this.get("token1");
    return value!.toString();
  }

  set token1(value: string) {
    this.set("token1", Value.fromString(value));
  }

  get sender(): Bytes {
    let value = this.get("sender");
    return value!.toBytes();
  }

  set sender(value: Bytes) {
    this.set("sender", Value.fromBytes(value));
  }

  get recipient(): Bytes {
    let value = this.get("recipient");
    return value!.toBytes();
  }

  set recipient(value: Bytes) {
    this.set("recipient", Value.fromBytes(value));
  }

  get origin(): Bytes {
    let value = this.get("origin");
    return value!.toBytes();
  }

  set origin(value: Bytes) {
    this.set("origin", Value.fromBytes(value));
  }

  get amount0(): BigDecimal {
    let value = this.get("amount0");
    return value!.toBigDecimal();
  }

  set amount0(value: BigDecimal) {
    this.set("amount0", Value.fromBigDecimal(value));
  }

  get amount1(): BigDecimal {
    let value = this.get("amount1");
    return value!.toBigDecimal();
  }

  set amount1(value: BigDecimal) {
    this.set("amount1", Value.fromBigDecimal(value));
  }

  get amountUSD(): BigDecimal {
    let value = this.get("amountUSD");
    return value!.toBigDecimal();
  }

  set amountUSD(value: BigDecimal) {
    this.set("amountUSD", Value.fromBigDecimal(value));
  }

  get logIndex(): BigInt | null {
    let value = this.get("logIndex");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set logIndex(value: BigInt | null) {
    if (!value) {
      this.unset("logIndex");
    } else {
      this.set("logIndex", Value.fromBigInt(<BigInt>value));
    }
  }
}

export class XXXFundDayData extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save XXXFundDayData entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        `Entities of type XXXFundDayData must have an ID of type String but the id '${id.displayData()}' is of type ${id.displayKind()}`
      );
      store.set("XXXFundDayData", id.toString(), this);
    }
  }

  static load(id: string): XXXFundDayData | null {
    return changetype<XXXFundDayData | null>(store.get("XXXFundDayData", id));
  }

  get id(): string {
    let value = this.get("id");
    return value!.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get date(): i32 {
    let value = this.get("date");
    return value!.toI32();
  }

  set date(value: i32) {
    this.set("date", Value.fromI32(value));
  }

  get volumeETH(): BigDecimal {
    let value = this.get("volumeETH");
    return value!.toBigDecimal();
  }

  set volumeETH(value: BigDecimal) {
    this.set("volumeETH", Value.fromBigDecimal(value));
  }

  get volumeUSD(): BigDecimal {
    let value = this.get("volumeUSD");
    return value!.toBigDecimal();
  }

  set volumeUSD(value: BigDecimal) {
    this.set("volumeUSD", Value.fromBigDecimal(value));
  }

  get feesUSD(): BigDecimal {
    let value = this.get("feesUSD");
    return value!.toBigDecimal();
  }

  set feesUSD(value: BigDecimal) {
    this.set("feesUSD", Value.fromBigDecimal(value));
  }

  get txCount(): BigInt {
    let value = this.get("txCount");
    return value!.toBigInt();
  }

  set txCount(value: BigInt) {
    this.set("txCount", Value.fromBigInt(value));
  }

  get tvlUSD(): BigDecimal {
    let value = this.get("tvlUSD");
    return value!.toBigDecimal();
  }

  set tvlUSD(value: BigDecimal) {
    this.set("tvlUSD", Value.fromBigDecimal(value));
  }
}

export class FundDayData extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save FundDayData entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        `Entities of type FundDayData must have an ID of type String but the id '${id.displayData()}' is of type ${id.displayKind()}`
      );
      store.set("FundDayData", id.toString(), this);
    }
  }

  static load(id: string): FundDayData | null {
    return changetype<FundDayData | null>(store.get("FundDayData", id));
  }

  get id(): string {
    let value = this.get("id");
    return value!.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get date(): i32 {
    let value = this.get("date");
    return value!.toI32();
  }

  set date(value: i32) {
    this.set("date", Value.fromI32(value));
  }

  get fund(): string {
    let value = this.get("fund");
    return value!.toString();
  }

  set fund(value: string) {
    this.set("fund", Value.fromString(value));
  }

  get tokens(): Array<string> {
    let value = this.get("tokens");
    return value!.toStringArray();
  }

  set tokens(value: Array<string>) {
    this.set("tokens", Value.fromStringArray(value));
  }

  get tvlUSD(): BigDecimal {
    let value = this.get("tvlUSD");
    return value!.toBigDecimal();
  }

  set tvlUSD(value: BigDecimal) {
    this.set("tvlUSD", Value.fromBigDecimal(value));
  }

  get volumeUSD(): BigDecimal {
    let value = this.get("volumeUSD");
    return value!.toBigDecimal();
  }

  set volumeUSD(value: BigDecimal) {
    this.set("volumeUSD", Value.fromBigDecimal(value));
  }

  get feesUSD(): BigDecimal {
    let value = this.get("feesUSD");
    return value!.toBigDecimal();
  }

  set feesUSD(value: BigDecimal) {
    this.set("feesUSD", Value.fromBigDecimal(value));
  }

  get txCount(): BigInt {
    let value = this.get("txCount");
    return value!.toBigInt();
  }

  set txCount(value: BigInt) {
    this.set("txCount", Value.fromBigInt(value));
  }
}

export class FundHourData extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save FundHourData entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        `Entities of type FundHourData must have an ID of type String but the id '${id.displayData()}' is of type ${id.displayKind()}`
      );
      store.set("FundHourData", id.toString(), this);
    }
  }

  static load(id: string): FundHourData | null {
    return changetype<FundHourData | null>(store.get("FundHourData", id));
  }

  get id(): string {
    let value = this.get("id");
    return value!.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get periodStartUnix(): i32 {
    let value = this.get("periodStartUnix");
    return value!.toI32();
  }

  set periodStartUnix(value: i32) {
    this.set("periodStartUnix", Value.fromI32(value));
  }

  get fund(): string {
    let value = this.get("fund");
    return value!.toString();
  }

  set fund(value: string) {
    this.set("fund", Value.fromString(value));
  }

  get tokens(): Array<string> {
    let value = this.get("tokens");
    return value!.toStringArray();
  }

  set tokens(value: Array<string>) {
    this.set("tokens", Value.fromStringArray(value));
  }

  get tvlUSD(): BigDecimal {
    let value = this.get("tvlUSD");
    return value!.toBigDecimal();
  }

  set tvlUSD(value: BigDecimal) {
    this.set("tvlUSD", Value.fromBigDecimal(value));
  }

  get volumeUSD(): BigDecimal {
    let value = this.get("volumeUSD");
    return value!.toBigDecimal();
  }

  set volumeUSD(value: BigDecimal) {
    this.set("volumeUSD", Value.fromBigDecimal(value));
  }

  get feesUSD(): BigDecimal {
    let value = this.get("feesUSD");
    return value!.toBigDecimal();
  }

  set feesUSD(value: BigDecimal) {
    this.set("feesUSD", Value.fromBigDecimal(value));
  }

  get txCount(): BigInt {
    let value = this.get("txCount");
    return value!.toBigInt();
  }

  set txCount(value: BigInt) {
    this.set("txCount", Value.fromBigInt(value));
  }
}

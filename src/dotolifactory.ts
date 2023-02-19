import { Address, Bytes, BigInt, log } from "@graphprotocol/graph-ts"
import {
  FactoryCreated,
  OwnerChanged,
  MinPoolAmountChanged,
  ManagerFeeChanged,
  WhiteListTokenAdded,
  WhiteListTokenRemoved
} from './types/DotoliFactory/DotoliFactory'
import { 
  Factory,
  Token
} from "./types/schema"
import { 
  DOTOLI_FACTORY_ADDRESS,
  ZERO_BD,
  ONE_BI,
  ADDRESS_ZERO,
  DECIMAL_18,
  WETH9,
  DTL
} from './utils/constants'
import { factorySnapshot } from "./utils/snapshots"
import { fetchTokenSymbol, fetchTokenDecimals } from './utils/token'


export function handleFactoryCreated(event: FactoryCreated): void {
  // load factory
  let factory = Factory.load(Bytes.fromHexString(DOTOLI_FACTORY_ADDRESS))
  if (factory === null) {
    factory = new Factory(Bytes.fromHexString(DOTOLI_FACTORY_ADDRESS))
    factory.fundCount = ONE_BI
    factory.investorCount = ONE_BI
    factory.managerFee = BigInt.fromString("10000")
    factory.minPoolAmount = BigInt.fromString(DECIMAL_18)
    factory.totalCurrentETH = ZERO_BD
    factory.totalCurrentUSD = ZERO_BD
    factory.owner = Address.fromString(ADDRESS_ZERO)
    factory.save()
  }
  
  const weth9 = new Token(Address.fromHexString(WETH9))
  weth9.id = Bytes.fromHexString(WETH9)
  weth9.address = Bytes.fromHexString(WETH9)
  weth9.decimals = fetchTokenDecimals(Address.fromString(WETH9))
  if (weth9.decimals === null) {
    log.debug('the decimals on weth9 token was null', [])
    return
  }
  weth9.symbol = fetchTokenSymbol(Address.fromString(WETH9))
  weth9.updatedTimestamp = event.block.timestamp
  weth9.active = true
  weth9.save()

  const dtl = new Token(Address.fromHexString(DTL))
  dtl.id = Bytes.fromHexString(DTL)
  dtl.address = Bytes.fromHexString(DTL)
  dtl.decimals = fetchTokenDecimals(Address.fromString(DTL))
  if (dtl.decimals === null) {
    log.debug('the decimals on dtl token was null', [])
    return
  }
  dtl.symbol = fetchTokenSymbol(Address.fromString(DTL))
  dtl.updatedTimestamp = event.block.timestamp
  dtl.active = true
  dtl.save()
}

export function handleOwnerChanged(event: OwnerChanged): void {
  let factory = Factory.load(Bytes.fromHexString(DOTOLI_FACTORY_ADDRESS))
  if (!factory) return
  
  factory.owner = event.params.newOwner
  factory.save()
  factorySnapshot(event)
}

export function handleMinPoolAmountChanged(event: MinPoolAmountChanged): void {
  let factory = Factory.load(Bytes.fromHexString(DOTOLI_FACTORY_ADDRESS))
  if (!factory) return
  factory.minPoolAmount = event.params.amount
  factory.save()
}

export function handleManagerFeeChanged(event: ManagerFeeChanged): void {
  let factory = Factory.load(Bytes.fromHexString(DOTOLI_FACTORY_ADDRESS))
  if (!factory) return
  factory.managerFee = event.params.managerFee
  factory.save()
}

export function handleWhiteListTokenAdded(event: WhiteListTokenAdded): void {
  let token = Token.load(event.params.token)
  if (!token) {
    token = new Token(event.params.token)
    token.id = event.params.token
    token.address = event.params.token
    token.decimals = fetchTokenDecimals(event.params.token)
    if (token.decimals === null) {
      log.debug('the decimals on {} token was null', [event.params.token.toHexString()])
      return
    }
    token.symbol = fetchTokenSymbol(event.params.token)
    token.updatedTimestamp = event.block.timestamp
    token.active = true
    token.save()
  } else {
    token.updatedTimestamp = event.block.timestamp
    token.active = true
    token.save()
  }
}

export function handleWhiteListTokenRemoved(event: WhiteListTokenRemoved): void {
  let token = Token.load(event.params.token)
  if (token) {
    token.updatedTimestamp = event.block.timestamp
    token.active = false
    token.save()
  }
}
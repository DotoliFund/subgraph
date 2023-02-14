import { Address, Bytes, BigInt, log } from "@graphprotocol/graph-ts"
import {
  FactoryCreated,
  FundCreated,
  OwnerChanged,
  MinPoolAmountChanged,
  ManagerFeeChanged,
  Subscribe as SubscribeEvent,
  WhiteListTokenAdded,
  WhiteListTokenRemoved
} from './types/DotoliFactory/DotoliFactory'
import { 
  Factory,
  Fund,
  Investor,
  Subscribe,
  Token
} from "./types/schema"
import { 
  DOTOLI_FACTORY_ADDRESS,
  ZERO_BD,
  ONE_BI,
  ADDRESS_ZERO,
  UNKNWON,
  DECIMAL_18,
  WETH9,
  DTL
} from './utils/constants'
import { getEthPriceInUSD } from './utils/pricing'
import { getInvestorID } from "./utils/investor"
import { fundSnapshot, investorSnapshot, factorySnapshot } from "./utils/snapshots"
import { DotoliFund as FundTemplate } from './types/templates'
import { fetchTokenSymbol, fetchTokenDecimals } from './utils/token'

export function handleFundCreated(event: FundCreated): void {
  let fund = new Fund(event.params.fund)
  fund.address = event.params.fund
  fund.createdAtTimestamp = event.block.timestamp
  fund.updatedAtTimestamp = event.block.timestamp
  fund.manager = event.params.manager
  fund.investorCount = ONE_BI
  fund.currentETH = ZERO_BD
  fund.currentUSD = ZERO_BD
  fund.feeTokens = []
  fund.feeSymbols = []
  fund.feeTokensAmount = []
  fund.currentTokens = []
  fund.currentTokensSymbols = []
  fund.currentTokensDecimals = []
  fund.currentTokensAmount = []

  const investorID = getInvestorID(event.params.fund, event.params.manager)
  let investor = Investor.load(investorID)
  if (investor === null) {
    investor = new Investor(investorID)
    investor.createdAtTimestamp = event.block.timestamp
    investor.updatedAtTimestamp = event.block.timestamp
    investor.fund = event.params.fund
    investor.investor = event.params.manager
    investor.isManager = true
    investor.principalETH = ZERO_BD
    investor.principalUSD = ZERO_BD
    investor.currentETH = ZERO_BD
    investor.currentUSD = ZERO_BD
    investor.currentTokens = []
    investor.currentTokensSymbols = []
    investor.currentTokensDecimals = []
    investor.currentTokensAmount = []
    investor.profitETH = ZERO_BD
    investor.profitUSD = ZERO_BD
    investor.profitRatio = ZERO_BD
  }

  fund.updatedAtTimestamp = event.block.timestamp
  investor.updatedAtTimestamp = event.block.timestamp
  investor.save()
  fund.save()
  // create the tracked contract based on the template
  FundTemplate.create(event.params.fund)

  const ethPriceInUSD = getEthPriceInUSD()
  investorSnapshot(event.params.fund, event.params.manager, event.params.manager, ethPriceInUSD, event)
  fundSnapshot(event.params.fund, event.params.manager, event, ethPriceInUSD)
  factorySnapshot(event)

  // Note: If a handler doesn't require existing field values, it is faster
  // _not_ to load the entity from the store. Instead, create it fresh with
  // `new Entity(...)`, set the fields that should be updated and save the
  // entity back to the store. Fields that were not set or unset remain
  // unchanged, allowing for partial updates to be applied.

  // It is also possible to access smart contracts from mappings. For
  // example, the contract that has emitted the event can be connected to
  // with:
  //
  // let contract = Contract.bind(event.address)
  //
  // The following functions can then be called on this contract to access
  // state variables and other data:
  //
  // - contract.createFund(...)
  // - contract.getFundByManager(...)
  // - contract.getManagerFee(...)
  // - contract.getSwapRouterAddress(...)
  // - contract.getWhiteListTokens(...)
  // - contract.isSubscribed(...)
  // - contract.isWhiteListToken(...)
  // - contract.owner(...)
  // - contract.subscribedFunds(...)
}

export function handleSubscribe(event: SubscribeEvent): void {
  let factory = Factory.load(Bytes.fromHexString(DOTOLI_FACTORY_ADDRESS))
  if (!factory) return

  factory.investorCount = factory.investorCount.plus(ONE_BI)

  let fund = Fund.load(event.params.fund)
  if (fund !== null) {
    fund.investorCount = fund.investorCount.plus(ONE_BI)

    const subscribeID = 
      event.params.fund.toHexString().toUpperCase() 
      + '-'
      + event.params.investor.toHexString().toUpperCase()
    let subscribe = new Subscribe(subscribeID)
    subscribe.timestamp = event.block.timestamp
    subscribe.hash = event.transaction.hash
    subscribe.fund = event.params.fund
    subscribe.investor = event.params.investor
    subscribe.save()

    const investorID = getInvestorID(event.params.fund, event.params.investor)
    let investor = Investor.load(investorID)
    if (investor === null) {
      investor = new Investor(investorID)
      investor.createdAtTimestamp = event.block.timestamp
      investor.updatedAtTimestamp = event.block.timestamp
      investor.fund = event.params.fund
      investor.investor = event.params.investor
      investor.isManager = false
      investor.principalETH = ZERO_BD
      investor.principalUSD = ZERO_BD
      investor.currentETH = ZERO_BD
      investor.currentUSD = ZERO_BD
      investor.currentTokens = []
      investor.currentTokensSymbols = []
      investor.currentTokensDecimals = []
      investor.currentTokensAmount = []
      investor.profitETH = ZERO_BD
      investor.profitUSD = ZERO_BD
      investor.profitRatio = ZERO_BD  
    }

    fund.updatedAtTimestamp = event.block.timestamp
    investor.updatedAtTimestamp = event.block.timestamp
    investor.save()
    fund.save()
    factory.save()

    const ethPriceInUSD = getEthPriceInUSD()
    investorSnapshot(event.params.fund, event.params.manager, event.params.investor, ethPriceInUSD, event)
    fundSnapshot(event.params.fund, event.params.manager, event, ethPriceInUSD)
    factorySnapshot(event)
  }
}

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
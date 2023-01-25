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
  SWAP_ROUTER_ADDRESS,
  UNKNWON_SYMBOL,
  DECIMAL_18,
  WETH9,
  DTL
} from './utils/constants'
import { getInvestorID } from "./utils/investor"
import { fundSnapshot, investorSnapshot, dotolifundSnapshot } from "./utils/snapshots"
import { loadTransaction } from "./utils"
import { DotoliFund as FundTemplate } from './types/templates'
import { ERC20 } from './types/templates/DotoliFund/ERC20'

export function handleFundCreated(event: FundCreated): void {
  let fund = new Fund(event.params.fund)
  fund.address = event.params.fund
  fund.createdAtTimestamp = event.block.timestamp
  fund.manager = event.params.manager
  fund.investorCount = ONE_BI
  fund.principalETH = ZERO_BD
  fund.principalUSD = ZERO_BD
  fund.volumeETH = ZERO_BD
  fund.volumeUSD = ZERO_BD
  fund.liquidityVolumeETH = ZERO_BD
  fund.liquidityVolumeUSD = ZERO_BD
  fund.feeTokens = []
  fund.feeSymbols = []
  fund.feeTokensAmount = []
  fund.tokens = []
  fund.symbols = []
  fund.tokensAmount = []
  fund.tokensVolumeETH = []
  fund.tokensVolumeUSD = []
  fund.profitETH = ZERO_BD
  fund.profitUSD = ZERO_BD
  fund.profitRatio = ZERO_BD

  const investorID = getInvestorID(event.params.fund, event.params.manager)
  let investor = Investor.load(investorID)
  if (investor === null) {
    investor = new Investor(investorID)
    investor.createdAtTimestamp = event.block.timestamp
    investor.fund = event.params.fund
    investor.manager = event.params.manager
    investor.investor = event.params.manager
    investor.principalETH = ZERO_BD
    investor.principalUSD = ZERO_BD
    investor.volumeETH = ZERO_BD
    investor.volumeUSD = ZERO_BD
    investor.liquidityVolumeETH = ZERO_BD
    investor.liquidityVolumeUSD = ZERO_BD  
    investor.tokens = []
    investor.symbols = []
    investor.decimals = []
    investor.tokensAmount = []
    investor.tokensVolumeETH = []
    investor.tokensVolumeUSD = []
    investor.liquidityTokens = []
    investor.liquiditySymbols = []
    investor.liquidityDecimals = []
    investor.liquidityTokensAmount = []
    investor.liquidityTokensVolumeETH = []
    investor.liquidityTokensVolumeUSD = []
    investor.profitETH = ZERO_BD
    investor.profitUSD = ZERO_BD
    investor.profitRatio = ZERO_BD
  }
  investor.save()
  fund.save()
  // create the tracked contract based on the template
  FundTemplate.create(event.params.fund)

  investorSnapshot(
    event.params.fund,
    event.params.manager,
    event.params.manager,
    event
  )
  fundSnapshot(
    event.params.fund,
    event.params.manager,
    event
  )
  dotolifundSnapshot(event)

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

    let transaction = loadTransaction(event)
    subscribe.transaction = transaction.id
    subscribe.timestamp = transaction.timestamp
    subscribe.fund = event.params.fund
    subscribe.investor = event.params.investor
    subscribe.origin = event.transaction.from
    subscribe.logIndex = event.logIndex

    const investorID = getInvestorID(event.params.fund, event.params.investor)
    let investor = Investor.load(investorID)
    if (investor === null) {
      investor = new Investor(investorID)
      investor.createdAtTimestamp = event.block.timestamp
      investor.fund = event.params.fund
      investor.manager = event.params.manager
      investor.investor = event.params.investor
      investor.principalETH = ZERO_BD
      investor.principalUSD = ZERO_BD
      investor.volumeETH = ZERO_BD
      investor.volumeUSD = ZERO_BD
      investor.liquidityVolumeETH = ZERO_BD
      investor.liquidityVolumeUSD = ZERO_BD    
      investor.tokens = []
      investor.symbols = []
      investor.decimals = []
      investor.tokensAmount = []
      investor.tokensVolumeETH = []
      investor.tokensVolumeUSD = []
      investor.liquidityTokens = []
      investor.liquiditySymbols = []
      investor.liquidityDecimals = []
      investor.liquidityTokensAmount = []
      investor.liquidityTokensVolumeETH = []
      investor.liquidityTokensVolumeUSD = []
      investor.profitETH = ZERO_BD
      investor.profitUSD = ZERO_BD
      investor.profitRatio = ZERO_BD
    }
    investor.save()
    subscribe.save()
    fund.save()
    factory.save()
    investorSnapshot(
      event.params.fund,
      event.params.manager,
      event.params.investor,
      event
    )
    fundSnapshot(
      event.params.fund,
      event.params.manager,
      event
    )
    dotolifundSnapshot(event)
  }
}

export function handleFactoryCreated(event: FactoryCreated): void {
  // load factory
  let factory = Factory.load(Bytes.fromHexString(DOTOLI_FACTORY_ADDRESS))
  if (factory === null) {
    factory = new Factory(Bytes.fromHexString(DOTOLI_FACTORY_ADDRESS))
    factory.fundCount = ONE_BI
    factory.investorCount = ONE_BI
    factory.swapRouter = SWAP_ROUTER_ADDRESS
    factory.managerFee = BigInt.fromString("10000")
    factory.minPoolAmount = BigInt.fromString(DECIMAL_18)
    factory.totalVolumeETH = ZERO_BD
    factory.totalVolumeUSD = ZERO_BD
    factory.totalLiquidityVolumeETH = ZERO_BD
    factory.totalLiquidityVolumeUSD = ZERO_BD
    factory.owner = Address.fromString(ADDRESS_ZERO)
    factory.save()
  }
  const test = 'test'

  const weth9 = new Token(Address.fromHexString(WETH9))
  weth9.id = Bytes.fromHexString(WETH9)
  weth9.address = Bytes.fromHexString(WETH9)
  const weth9Symbol = ERC20.bind(Address.fromString(WETH9)).try_symbol()
  if (!weth9Symbol.reverted) {
    weth9.symbol = weth9Symbol.value
    weth9.updatedTimestamp = event.block.timestamp
    weth9.active = true
    weth9.save()
  }

  const dtl = new Token(Address.fromHexString(DTL))
  dtl.id = Bytes.fromHexString(DTL)
  dtl.address = Bytes.fromHexString(DTL)
  const dtlSymbol = ERC20.bind(Address.fromString(DTL)).try_symbol()
  if (!dtlSymbol.reverted) {
    dtl.symbol = dtlSymbol.value
    dtl.updatedTimestamp = event.block.timestamp
    dtl.active = true
    dtl.save()
  }
}

export function handleOwnerChanged(event: OwnerChanged): void {
  let factory = Factory.load(Bytes.fromHexString(DOTOLI_FACTORY_ADDRESS))
  if (!factory) return
  
  factory.owner = event.params.newOwner
  factory.save()
  dotolifundSnapshot(event)
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
    const symbol = ERC20.bind(Address.fromBytes(event.params.token)).try_symbol()
    if (symbol.reverted) {
      token.symbol = UNKNWON_SYMBOL
    } else {
      token.symbol = symbol.value
    }
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
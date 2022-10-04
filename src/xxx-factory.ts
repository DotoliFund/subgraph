import { BigInt, Address } from "@graphprotocol/graph-ts"
import {
  FundCreated,
  OwnerChanged,
  Subscribe as SubscribeEvent,
} from './types/XXXFactory/XXXFactory'
import { 
  Factory,
  Fund,
  Investor,
  Subscribe
} from "./types/schema"
import { 
  FACTORY_ADDRESS,
  FACTORY_OWNER,
  SWAP_ROUTER_ADDRESS,
  WHITELIST_TOKENS,
  ZERO_BD,
  ZERO_BI,
  ONE_BI
} from './utils/constants'
import { investorSnapshot } from "./utils/snapshots"

export function handleFundCreated(event: FundCreated): void {
  // load factory
  let factory = Factory.load(FACTORY_ADDRESS)
  if (factory === null) {
    factory = new Factory(FACTORY_ADDRESS)
    factory.fundCount = ZERO_BI
    factory.investorCount = ZERO_BI
    factory.whitelistTokens = WHITELIST_TOKENS
    factory.swapRouter = SWAP_ROUTER_ADDRESS
    factory.managerFee = ONE_BI
    factory.totalVolumeETH = ZERO_BD
    factory.totalVolumeUSD = ZERO_BD
    factory.owner = Address.fromString(FACTORY_OWNER)
  }
  factory.fundCount = factory.fundCount.plus(ONE_BI)
  factory.investorCount = factory.investorCount.plus(ONE_BI)

  let fund = new Fund(event.params.fund.toHexString()) as Fund
  fund.createdAtTimestamp = event.block.timestamp
  fund.createdAtBlockNumber = event.block.number
  fund.volumeETH = ZERO_BD
  fund.volumeUSD = ZERO_BD
  fund.investorCount = ONE_BI

  fund.save()
  factory.save()

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

export function handleOwnerChanged(event: OwnerChanged): void {
  let factory = Factory.load(FACTORY_ADDRESS)
  if (factory !== null) {
    factory.owner = event.params.newOwner
    factory.save()
  }
}

export function handleSubscribe(event: SubscribeEvent): void {
  let factory = Factory.load(FACTORY_ADDRESS)
  if (factory !== null) {
    factory.investorCount = factory.investorCount.plus(ONE_BI)
  
    let fund = Fund.load(event.params.fund.toHexString())
    if (fund !== null) {
      fund.investorCount = fund.investorCount.plus(ONE_BI)
      fund.save()
    }

    let investor = Investor.load(event.params.investor.toHexString())
    if (investor === null) {
      investor = new Investor(event.params.investor.toHexString())
      investor.createdAtTimestamp = event.block.timestamp
      investor.createdAtBlockNumber = event.block.number
      investor.fund = event.address
      investor.principalETH = ZERO_BD
      investor.principalUSD = ZERO_BD
      investor.volumeETH = ZERO_BD
      investor.volumeUSD = ZERO_BD
      investor.profitETH = ZERO_BI
      investor.profitUSD = ZERO_BI
    }

    investorSnapshot(event)

    investor.save()
    factory.save()
  }
}



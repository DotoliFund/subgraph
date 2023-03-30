import { Address, Bytes, log } from "@graphprotocol/graph-ts"
import {
  DotoliInfo,
  InfoCreated,
  FundCreated,
  OwnerChanged,
  Subscribe as SubscribeEvent,
} from './types/DotoliInfo/DotoliInfo'
import { 
  Info,
  Fund,
  Investor,
  Subscribe,
} from "./types/schema"
import {
  DOTOLI_INFO_ADDRESS,
  ZERO_BD,
  ZERO_BI,
  ONE_BI,
  ADDRESS_ZERO,
  ONE_BD,
} from './utils/constants'
import {
  getInvestorID
} from "./utils/investor"
import { 
  getEthPriceInUSD,
} from './utils/pricing'
import { 
  infoSnapshot,
  fundSnapshot,
  investorSnapshot 
} from "./utils/snapshots"


export function handleInfoCreated(event: InfoCreated): void {
  let info = Info.load(Bytes.fromHexString(DOTOLI_INFO_ADDRESS))
  if (info === null) {
    info = new Info(Bytes.fromHexString(DOTOLI_INFO_ADDRESS))
    info.fundCount = ZERO_BI
    info.investorCount = ZERO_BI
    info.totalCurrentETH = ZERO_BD
    info.totalCurrentUSD = ZERO_BD
    info.owner = Address.fromString(ADDRESS_ZERO)
    info.save()
  }
}

export function handleOwnerChanged(event: OwnerChanged): void {
  let info = Info.load(Bytes.fromHexString(DOTOLI_INFO_ADDRESS))
  if (!info) return
  info.owner = event.params.newOwner
  info.save()
  infoSnapshot(event)
}

export function handleFundCreated(event: FundCreated): void {
  let info = Info.load(Bytes.fromHexString(DOTOLI_INFO_ADDRESS))
  if (!info) return
  info.fundCount = info.fundCount.plus(ONE_BI)
  info.investorCount = info.investorCount.plus(ONE_BI)
  info.save()

  let fund = new Fund(event.params.fundId.toString())
  fund.fundId = event.params.fundId.toString()
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
  fund.updatedAtTimestamp = event.block.timestamp
  fund.save()

  const investorID = getInvestorID(event.params.fundId, event.params.manager)
  let investor = Investor.load(investorID)
  if (investor === null) {
    investor = new Investor(investorID)
    investor.createdAtTimestamp = event.block.timestamp
    investor.updatedAtTimestamp = event.block.timestamp
    investor.fundId = event.params.fundId.toString()
    investor.investor = event.params.manager
    investor.isManager = true
    investor.snapshotCount = ZERO_BI
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
    investor.updatedAtTimestamp = event.block.timestamp
  }
  investor.save()

  const ethPriceInUSD = getEthPriceInUSD()
  infoSnapshot(event)
  fundSnapshot(event.params.fundId, event.params.manager, event, ethPriceInUSD)
  investorSnapshot(event.params.fundId, event.params.manager, event.params.manager, ethPriceInUSD, event)
}

export function handleSubscribe(event: SubscribeEvent): void {
  let info = Info.load(Bytes.fromHexString(DOTOLI_INFO_ADDRESS))
  if (!info) return

  info.investorCount = info.investorCount.plus(ONE_BI)

  const fundId = event.params.fundId
  let fund = Fund.load(fundId.toString())
  if (fund !== null) {
    fund.investorCount = fund.investorCount.plus(ONE_BI)

    const subscribeID = 
    fundId.toString()
      + '-'
      + event.params.investor.toHexString().toUpperCase()
    let subscribe = new Subscribe(subscribeID)
    subscribe.timestamp = event.block.timestamp
    subscribe.hash = event.transaction.hash
    subscribe.fundId = fundId.toString()
    subscribe.investor = event.params.investor
    subscribe.save()

    const investorID = getInvestorID(fundId, event.params.investor)
    let investor = Investor.load(investorID)
    if (investor === null) {
      investor = new Investor(investorID)
      investor.createdAtTimestamp = event.block.timestamp
      investor.updatedAtTimestamp = event.block.timestamp
      investor.fundId = fundId.toString()
      investor.investor = event.params.investor
      investor.isManager = false
      investor.snapshotCount = ZERO_BI
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
    info.save()

    const ethPriceInUSD = getEthPriceInUSD()
    const managerAddress = DotoliInfo.bind(Address.fromString(DOTOLI_INFO_ADDRESS))
      .manager(fundId)
    investorSnapshot(fundId, managerAddress, event.params.investor, ethPriceInUSD, event)
    fundSnapshot(fundId, managerAddress, event, ethPriceInUSD)
    infoSnapshot(event)
  }
}
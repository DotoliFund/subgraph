import { ZERO_BD, ZERO_BI, ONE_BI } from './constants'
/* eslint-disable prefer-const */
import {
  Factory,
  XXXFund2Snapshot,
  Fund,
  FundSnapshot,
  Investor,
  InvestorSnapshot,
} from '../types/schema'
import { FACTORY_ADDRESS, SWAP_ROUTER_ADDRESS, WHITELIST_TOKENS } from './constants'
import { Bytes, ethereum } from '@graphprotocol/graph-ts'

export function xxxfund2Snapshot(event: ethereum.Event): void {
  let factory = Factory.load(FACTORY_ADDRESS)
  if (!factory) return 

  let xxxfund2Snapshot = XXXFund2Snapshot.load(event.block.timestamp.toString())
  if (xxxfund2Snapshot === null) {
    xxxfund2Snapshot = new XXXFund2Snapshot(event.block.timestamp.toString())
    xxxfund2Snapshot.timestamp = event.block.timestamp
    xxxfund2Snapshot.fundCount = factory.fundCount
    xxxfund2Snapshot.investorCount = factory.investorCount
    xxxfund2Snapshot.whitelistTokens = factory.whitelistTokens
    xxxfund2Snapshot.managerFee = factory.managerFee
    xxxfund2Snapshot.totalVolumeETH = factory.totalVolumeETH
    xxxfund2Snapshot.totalVolumeUSD = factory.totalVolumeUSD
  }
  xxxfund2Snapshot.save()
}

export function fundSnapshot(fundAddress: Bytes, managerAddress: Bytes, event: ethereum.Event): void {
  let timestamp = event.block.timestamp
  let fundTimeID = fundAddress
    .toHexString()
    .concat('-')
    .concat(timestamp.toString())

  let fund = Fund.load(fundAddress.toHexString())
  if (!fund)  return
  
  let fundSnapshot = FundSnapshot.load(fundTimeID)
  if (fundSnapshot === null) {
    fundSnapshot = new FundSnapshot(fundTimeID)
    fundSnapshot.timestamp = timestamp
    fundSnapshot.fund = fundAddress
    fundSnapshot.manager = managerAddress
    fundSnapshot.principalETH = ZERO_BI
    fundSnapshot.principalUSD = ZERO_BI
    fundSnapshot.volumeETH = fund.volumeETH
    fundSnapshot.volumeUSD = fund.volumeUSD
    fundSnapshot.profitETH = ZERO_BI
    fundSnapshot.profitUSD = ZERO_BI
    fundSnapshot.profitRatioETH = ZERO_BI
    fundSnapshot.profitRatioUSD = ZERO_BI
    fundSnapshot.investorCount = ZERO_BI
    fundSnapshot.feeVolumeETH = fund.feeVolumeETH
    fundSnapshot.feeVolumeUSD = fund.feeVolumeUSD
  }
  fundSnapshot.save()
}

export function investorSnapshot(
  fundAddress: Bytes, 
  managerAddress: Bytes, 
  investorAddress: Bytes, 
  event: ethereum.Event
): void {
  let timestamp = event.block.timestamp
  let fundTimeID = investorAddress
    .toHexString()
    .concat('-')
    .concat(timestamp.toString())

  const investorID = 
    fundAddress.toHexString().toUpperCase() 
    + '-' 
    + managerAddress.toHexString().toUpperCase()
  let investor = Investor.load(investorID)
  if (!investor)  return

  let investorSnapshot = InvestorSnapshot.load(fundTimeID)
  if (investorSnapshot === null) {
    investorSnapshot = new InvestorSnapshot(fundTimeID)
    investorSnapshot.timestamp = timestamp
    investorSnapshot.fund = fundAddress
    investorSnapshot.manager = managerAddress
    investorSnapshot.investor = investorAddress
    investorSnapshot.principalETH = ZERO_BD
    investorSnapshot.principalUSD = ZERO_BD
    investorSnapshot.volumeETH = investor.volumeETH
    investorSnapshot.volumeUSD = investor.volumeUSD
    investorSnapshot.profitETH = ZERO_BD
    investorSnapshot.profitUSD = ZERO_BD
    investorSnapshot.profitRatioETH = ZERO_BD
    investorSnapshot.profitRatioUSD = ZERO_BD
  }
  investorSnapshot.save()
}

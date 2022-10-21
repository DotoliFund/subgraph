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
import { FACTORY_ADDRESS } from './constants'
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
  let fund = Fund.load(fundAddress.toHexString())
  if (!fund) return 

  let timestamp = event.block.timestamp
  let fundTimeID = fundAddress
    .toHexString()
    .concat('-')
    .concat(timestamp.toString())
    
  let fundSnapshot = FundSnapshot.load(fundTimeID)
  if (fundSnapshot === null) {
    fundSnapshot = new FundSnapshot(fundTimeID)
    fundSnapshot.timestamp = timestamp
    fundSnapshot.fund = fundAddress
    fundSnapshot.manager = managerAddress
    fundSnapshot.investorCount = ZERO_BI
    fundSnapshot.principalETH = fund.principalETH
    fundSnapshot.principalUSD = fund.principalUSD
    fundSnapshot.volumeETH = fund.volumeETH
    fundSnapshot.volumeUSD = fund.volumeUSD
    fundSnapshot.profitETH = ZERO_BD
    fundSnapshot.profitUSD = ZERO_BD
    fundSnapshot.profitRatioETH = ZERO_BD
    fundSnapshot.profitRatioUSD = ZERO_BD
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
  const investorID = 
  fundAddress.toHexString().toUpperCase() 
    + '-' 
    + investorAddress.toHexString().toUpperCase()

  let investor = Investor.load(investorID)
  if (!investor) return 

  let timestamp = event.block.timestamp
  let fundTimeID = investorAddress
    .toHexString()
    .concat('-')
    .concat(timestamp.toString())

  let investorSnapshot = InvestorSnapshot.load(fundTimeID)
  if (investorSnapshot === null) {
    investorSnapshot = new InvestorSnapshot(fundTimeID)
    investorSnapshot.timestamp = timestamp
    investorSnapshot.fund = fundAddress
    investorSnapshot.manager = managerAddress
    investorSnapshot.investor = investorAddress
    investorSnapshot.principalETH = investor.principalETH
    investorSnapshot.principalUSD = investor.principalUSD
    investorSnapshot.volumeETH = investor.volumeETH
    investorSnapshot.volumeUSD = investor.volumeUSD
    investorSnapshot.profitETH = ZERO_BD
    investorSnapshot.profitUSD = ZERO_BD
    investorSnapshot.profitRatioETH = ZERO_BD
    investorSnapshot.profitRatioUSD = ZERO_BD
  }
  investorSnapshot.save()
}

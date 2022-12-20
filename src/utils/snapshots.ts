import { ZERO_BI } from './constants'
/* eslint-disable prefer-const */
import {
  Factory,
  XXXFund2Snapshot,
  Fund,
  FundSnapshot,
  Investor,
  InvestorSnapshot,
} from '../types/schema'
import { getInvestorID } from './investor'
import { FACTORY_ADDRESS } from './constants'
import { Bytes, ethereum, Address } from '@graphprotocol/graph-ts'


export function xxxfund2Snapshot(event: ethereum.Event): void {
  let factory = Factory.load(Bytes.fromHexString(FACTORY_ADDRESS))
  if (!factory) return 

  let xxxfund2Snapshot = XXXFund2Snapshot.load(event.block.timestamp.toString())
  if (xxxfund2Snapshot === null) {
    xxxfund2Snapshot = new XXXFund2Snapshot(event.block.timestamp.toString())
    xxxfund2Snapshot.timestamp = event.block.timestamp
    xxxfund2Snapshot.fundCount = factory.fundCount
    xxxfund2Snapshot.investorCount = factory.investorCount
    xxxfund2Snapshot.whitelistTokens = factory.whitelistTokens
    xxxfund2Snapshot.totalVolumeETH = factory.totalVolumeETH
    xxxfund2Snapshot.totalVolumeUSD = factory.totalVolumeUSD
    xxxfund2Snapshot.totalLiquidityVolumeETH = factory.totalLiquidityVolumeETH
    xxxfund2Snapshot.totalLiquidityVolumeUSD = factory.totalLiquidityVolumeUSD
  }
  xxxfund2Snapshot.save()
}

export function fundSnapshot(
  fundAddress: Bytes,
  managerAddress: Bytes,
  event: ethereum.Event
): void {
  let fund = Fund.load(fundAddress)
  if (!fund) return 

  let timestamp = event.block.timestamp
  let fundTimeID = fundAddress.toHexString()
    .concat('-').concat(timestamp.toString())
    
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
    fundSnapshot.liquidityVolumeETH = fund.liquidityVolumeETH
    fundSnapshot.liquidityVolumeUSD = fund.liquidityVolumeUSD
    fundSnapshot.feeVolumeETH = fund.feeVolumeETH
    fundSnapshot.feeVolumeUSD = fund.feeVolumeUSD
    fundSnapshot.tokens = fund.tokens
    fundSnapshot.symbols = fund.symbols
    fundSnapshot.tokensVolumeETH = fund.tokensVolumeETH
    fundSnapshot.tokensVolumeUSD = fund.tokensVolumeUSD
  }
  fundSnapshot.save()
}

export function investorSnapshot(
  fundAddress: Bytes, 
  managerAddress: Bytes, 
  investorAddress: Bytes,
  event: ethereum.Event
): void {
  let investor = Investor.load(getInvestorID(
    Address.fromString(fundAddress.toHexString()), 
    Address.fromString(investorAddress.toHexString())))
  if (!investor) return 

  let timestamp = event.block.timestamp
  let fundTimeID = investorAddress.toHexString()
    .concat('-').concat(timestamp.toString())

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
    investorSnapshot.liquidityVolumeETH = investor.liquidityVolumeETH
    investorSnapshot.liquidityVolumeUSD = investor.liquidityVolumeUSD
    investorSnapshot.tokens = investor.tokens
    investorSnapshot.symbols = investor.symbols
    investorSnapshot.tokensVolumeETH = investor.tokensVolumeETH
    investorSnapshot.tokensVolumeUSD = investor.tokensVolumeUSD
  }
  investorSnapshot.save()
}

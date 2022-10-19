import { ZERO_BD, ZERO_BI, ONE_BI } from './constants'
/* eslint-disable prefer-const */
import {
  Factory,
  Fund,
  FundSnapshot,
  Investor,
  InvestorSnapshot,
} from '../types/schema'
import { FACTORY_ADDRESS } from './constants'
import { Bytes, ethereum } from '@graphprotocol/graph-ts'

export function fundSnapshot(fundAddress: Bytes, managerAddress: Bytes, event: ethereum.Event): void {
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
    fundSnapshot.principalETH = ZERO_BD
    fundSnapshot.principalUSD = ZERO_BD
    fundSnapshot.volumeUSD = ZERO_BD
    fundSnapshot.volumeETH = ZERO_BD
    fundSnapshot.profitETH = ZERO_BI
    fundSnapshot.profitUSD = ZERO_BI
    fundSnapshot.profitRatioETH = ZERO_BI
    fundSnapshot.profitRatioUSD = ZERO_BI
    fundSnapshot.investorCount = ZERO_BI
    fundSnapshot.feeVolumeETH = ZERO_BI
    fundSnapshot.feeVolumeUSD = ZERO_BI
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

  let investorSnapshot = InvestorSnapshot.load(fundTimeID)
  if (investorSnapshot === null) {
    investorSnapshot = new InvestorSnapshot(fundTimeID)
    investorSnapshot.timestamp = timestamp
    investorSnapshot.fund = fundAddress
    investorSnapshot.manager = managerAddress
    investorSnapshot.investor = investorAddress
    investorSnapshot.principalETH = ZERO_BD
    investorSnapshot.principalUSD = ZERO_BD
    investorSnapshot.volumeUSD = ZERO_BD
    investorSnapshot.volumeETH = ZERO_BD
    investorSnapshot.profitETH = ZERO_BI
    investorSnapshot.profitUSD = ZERO_BI
    investorSnapshot.profitRatioETH = ZERO_BI
    investorSnapshot.profitRatioUSD = ZERO_BI
  }
  //TODO : set data
  investorSnapshot.save()
}

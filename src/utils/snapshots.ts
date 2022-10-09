import { ZERO_BD, ZERO_BI, ONE_BI } from './constants'
/* eslint-disable prefer-const */
import {
  Factory,
  Fund,
  FundSnapshot,
  Manager,
  ManagerSnapshot,
  Investor,
  InvestorSnapshot,
} from '../types/schema'
import { FACTORY_ADDRESS } from './constants'
import { Bytes, ethereum } from '@graphprotocol/graph-ts'

export function fundSnapshot(event: ethereum.Event): void {
  let timestamp = event.block.timestamp
  let fundTimeID = event.address
    .toHexString()
    .concat('-')
    .concat(timestamp.toString())
  let fund = Fund.load(event.address.toHexString())
  if (fund !== null) {
    let fundSnapshot = FundSnapshot.load(fundTimeID)
    if (fundSnapshot === null) {
      fundSnapshot = new FundSnapshot(fundTimeID)
      fundSnapshot.timestamp = timestamp
      fundSnapshot.fund = event.address
      fundSnapshot.volumeUSD = ZERO_BD
      fundSnapshot.volumeETH = ZERO_BD
      fundSnapshot.principalETH = ZERO_BD
      fundSnapshot.principalUSD = ZERO_BD
      fundSnapshot.profitETH = ZERO_BI
      fundSnapshot.profitUSD = ZERO_BI
      fundSnapshot.profitRatioETH = ZERO_BI
      fundSnapshot.profitRatioUSD = ZERO_BI
      fundSnapshot.investorCount = ZERO_BI
    }
    fundSnapshot.volumeUSD
    fundSnapshot.save()
  }
}

export function managerSnapshot(
  fundAddress: Bytes, 
  managerAddress: Bytes, 
  event: ethereum.Event
): void {
  let timestamp = event.block.timestamp
  let fundTimeID = event.address
    .toHexString()
    .concat('-')
    .concat(timestamp.toString())
  let manager = Manager.load(event.address.toHexString())
  if (manager !== null) {
    let managerSnapshot = ManagerSnapshot.load(fundTimeID)
    if (managerSnapshot === null) {
      managerSnapshot = new ManagerSnapshot(fundTimeID)
      managerSnapshot.timestamp = timestamp
      managerSnapshot.fund = fundAddress
      managerSnapshot.manager = managerAddress
      managerSnapshot.volumeUSD = ZERO_BD
      managerSnapshot.volumeETH = ZERO_BD
      managerSnapshot.principalETH = ZERO_BD
      managerSnapshot.principalUSD = ZERO_BD
      managerSnapshot.profitETH = ZERO_BI
      managerSnapshot.profitUSD = ZERO_BI
      managerSnapshot.profitRatioETH = ZERO_BI
      managerSnapshot.profitRatioUSD = ZERO_BI
      managerSnapshot.feeVolumeETH = ZERO_BI
      managerSnapshot.feeVolumeUSD = ZERO_BI
    }
    managerSnapshot.volumeUSD
    managerSnapshot.save()  
  }
}

export function investorSnapshot(
  fundAddress: Bytes, 
  investorAddress: Bytes, 
  event: ethereum.Event
): void {
  let timestamp = event.block.timestamp
  let fundTimeID = event.address
    .toHexString()
    .concat('-')
    .concat(timestamp.toString())
  let investor = Investor.load(event.address.toHexString())
  let investorSnapshot = InvestorSnapshot.load(fundTimeID)

  if (investor !== null) {
    if (investorSnapshot === null) {
      investorSnapshot = new InvestorSnapshot(fundTimeID)
      investorSnapshot.timestamp = timestamp
      investorSnapshot.fund = fundAddress
      investorSnapshot.investor = investorAddress
      investorSnapshot.volumeUSD = ZERO_BD
      investorSnapshot.volumeETH = ZERO_BD
      investorSnapshot.principalETH = ZERO_BD
      investorSnapshot.principalUSD = ZERO_BD
      investorSnapshot.profitETH = ZERO_BI
      investorSnapshot.profitUSD = ZERO_BI
      investorSnapshot.profitRatioETH = ZERO_BI
      investorSnapshot.profitRatioUSD = ZERO_BI
    }
    investorSnapshot.volumeUSD
    investorSnapshot.save()
  }
}

import { ZERO_BD, ZERO_BI, ONE_BI } from './constants'
/* eslint-disable prefer-const */
import {
  Factory,
  XXXFund2Snapshot,
  Fund,
  FundSnapshot,
  Manager,
  ManagerSnapshot,
  Investor,
  InvestorSnapshot,
} from '../types/schema'
import { FACTORY_ADDRESS } from './constants'
import { ethereum } from '@graphprotocol/graph-ts'

export function xxxfund2Snapshot(event: ethereum.Event): void {
  let factory = Factory.load(FACTORY_ADDRESS)
  if (factory !== null) {
    let timestamp = event.block.timestamp.toI32()
    let dayID = timestamp / 86400 // rounded
    let dayStartTimestamp = dayID * 86400
    let fund = Fund.load(event.address.toHexString())
    if (fund !== null) {
      let xxxfundSnapshot = XXXFund2Snapshot.load(dayID.toString())
      if (xxxfundSnapshot === null) {
        xxxfundSnapshot = new XXXFund2Snapshot(dayID.toString())
        xxxfundSnapshot.date = dayStartTimestamp
        xxxfundSnapshot.volumeUSD = ZERO_BD
        xxxfundSnapshot.volumeETH = ZERO_BD
        xxxfundSnapshot.fundCount = ZERO_BI
      }
      xxxfundSnapshot.volumeETH
      xxxfundSnapshot.volumeUSD
      xxxfundSnapshot.fundCount = factory.fundCount
      xxxfundSnapshot.save()
    }
  }
}

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
      fundSnapshot.fund = fund.id
      fundSnapshot.volumeUSD = ZERO_BD
      fundSnapshot.volumeETH = ZERO_BD
      fundSnapshot.principalETH = ZERO_BD
      fundSnapshot.profitETH = ZERO_BI
      fundSnapshot.profitUSD = ZERO_BI
    }
    fundSnapshot.volumeUSD
    fundSnapshot.save()
  }
}

export function managerSnapshot(event: ethereum.Event): void {
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
      managerSnapshot.manager = manager.id
      managerSnapshot.volumeUSD = ZERO_BD
      managerSnapshot.volumeETH = ZERO_BD
      managerSnapshot.principalETH = ZERO_BD
      managerSnapshot.profitETH = ZERO_BI
      managerSnapshot.profitUSD = ZERO_BI
    }
    managerSnapshot.volumeUSD
    managerSnapshot.save()  
  }
}

export function investorSnapshot(event: ethereum.Event): void {
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
      investorSnapshot.investor = event.address.toHexString()
      investorSnapshot.volumeUSD = ZERO_BD
      investorSnapshot.volumeETH = ZERO_BD
      investorSnapshot.principalETH = ZERO_BD
      investorSnapshot.profitETH = ZERO_BI
      investorSnapshot.profitUSD = ZERO_BI
    }
    investorSnapshot.volumeUSD
    investorSnapshot.save()


  }
}

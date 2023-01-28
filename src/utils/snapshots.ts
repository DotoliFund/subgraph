/* eslint-disable prefer-const */
import {
  Factory,
  DotoliFundSnapshot,
  Fund,
  FundSnapshot,
  Investor,
  InvestorSnapshot,
} from '../types/schema'
import { getInvestorID } from './investor'
import { DOTOLI_FACTORY_ADDRESS } from './constants'
import { Bytes, ethereum, Address } from '@graphprotocol/graph-ts'


export function dotolifundSnapshot(event: ethereum.Event): void {
  let factory = Factory.load(Bytes.fromHexString(DOTOLI_FACTORY_ADDRESS))
  if (!factory) return 

  let dotolifundSnapshot = DotoliFundSnapshot.load(event.block.timestamp.toString())
  dotolifundSnapshot = new DotoliFundSnapshot(event.block.timestamp.toString())
  dotolifundSnapshot.timestamp = event.block.timestamp
  dotolifundSnapshot.fundCount = factory.fundCount
  dotolifundSnapshot.investorCount = factory.investorCount
  dotolifundSnapshot.totalVolumeETH = factory.totalVolumeETH
  dotolifundSnapshot.totalVolumeUSD = factory.totalVolumeUSD
  dotolifundSnapshot.save()
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
  fundSnapshot = new FundSnapshot(fundTimeID)
  fundSnapshot.timestamp = timestamp
  fundSnapshot.fund = fundAddress
  fundSnapshot.manager = managerAddress
  fundSnapshot.investorCount = fund.investorCount
  fundSnapshot.volumeETH = fund.volumeETH
  fundSnapshot.volumeUSD = fund.volumeUSD
  fundSnapshot.tokens = fund.tokens
  fundSnapshot.symbols = fund.symbols
  fundSnapshot.decimals = fund.decimals
  fundSnapshot.tokensVolumeETH = fund.tokensVolumeETH
  fundSnapshot.tokensVolumeUSD = fund.tokensVolumeUSD
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
  investorSnapshot.save()
}

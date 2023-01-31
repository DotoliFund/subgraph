/* eslint-disable prefer-const */
import {
  Factory,
  FactorySnapshot,
  Fund,
  FundSnapshot,
  Investor,
  InvestorSnapshot,
} from '../types/schema'
import { getInvestorID } from './investor'
import { DOTOLI_FACTORY_ADDRESS } from './constants'
import { Bytes, ethereum, Address } from '@graphprotocol/graph-ts'


export function factorySnapshot(event: ethereum.Event): void {
  let factory = Factory.load(Bytes.fromHexString(DOTOLI_FACTORY_ADDRESS))
  if (!factory) return 

  let factorySnapshot = FactorySnapshot.load(event.block.timestamp.toString())
  factorySnapshot = new FactorySnapshot(event.block.timestamp.toString())
  factorySnapshot.timestamp = event.block.timestamp
  factorySnapshot.fundCount = factory.fundCount
  factorySnapshot.investorCount = factory.investorCount
  factorySnapshot.totalCurrentETH = factory.totalCurrentETH
  factorySnapshot.totalCurrentUSD = factory.totalCurrentUSD
  factorySnapshot.save()
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
  fundSnapshot.currentETH = fund.currentETH
  fundSnapshot.currentUSD = fund.currentUSD
  fundSnapshot.currentTokens = fund.currentTokens
  fundSnapshot.currentTokensSymbols = fund.currentTokensSymbols
  fundSnapshot.currentTokensDecimals = fund.currentTokensDecimals
  fundSnapshot.currentTokensAmount = fund.currentTokensAmount
  fundSnapshot.currentTokensAmountETH = fund.currentTokensAmountETH
  fundSnapshot.currentTokensAmountUSD = fund.currentTokensAmountUSD
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
  investorSnapshot.investAmountETH = investor.investAmountETH
  investorSnapshot.investAmountUSD = investor.investAmountUSD
  investorSnapshot.currentETH = investor.currentETH
  investorSnapshot.currentUSD = investor.currentUSD
  investorSnapshot.currentTokens = investor.currentTokens
  investorSnapshot.currentTokensSymbols = investor.currentTokensSymbols
  investorSnapshot.currentTokensDecimals = investor.currentTokensDecimals
  investorSnapshot.currentTokensAmount = investor.currentTokensAmount
  investorSnapshot.currentTokensAmountETH = investor.currentTokensAmountETH
  investorSnapshot.currentTokensAmountUSD = investor.currentTokensAmountUSD
  investorSnapshot.poolETH = investor.poolETH
  investorSnapshot.poolUSD = investor.poolUSD
  investorSnapshot.save()
}

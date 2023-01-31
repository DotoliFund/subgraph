/* eslint-disable prefer-const */
import { BigDecimal, BigInt, log } from '@graphprotocol/graph-ts'
import {
  Factory,
  FactorySnapshot,
  Fund,
  FundSnapshot,
  Investor,
  InvestorSnapshot,
} from '../types/schema'
import { getInvestorID } from './investor'
import { DOTOLI_FACTORY_ADDRESS, LIQUIDITY_ORACLE_ADDRESS } from './constants'
import { Bytes, ethereum, Address } from '@graphprotocol/graph-ts'
import { LiquidityOracle  } from '../types/templates/DotoliFund/LiquidityOracle'


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
  investorSnapshot.investAmountUSD = investor.investAmountUSD
  investorSnapshot.tokenIds = investor.tokenIds

  //sum current, pool token's amountETH, amountUSD
  const tokens: Bytes[] = []
  const tokensSymbols: string[] = []
  const tokensDecimals: BigInt[] = []
  const tokensAmountETH: BigDecimal[] = []
  const tokensAmountUSD: BigDecimal[] = []

  const currentTokens = investor.currentTokens
  for (let i=0; i<currentTokens.length; i++) {
    tokens.push(currentTokens[i])
    tokensSymbols.push(investor.currentTokensSymbols[i])
    tokensDecimals.push(investor.currentTokensDecimals[i])
    tokensAmountETH.push(investor.currentTokensAmountETH[i])
    tokensAmountUSD.push(investor.currentTokensAmountUSD[i])
  }

  const liquidityOracle = LiquidityOracle.bind(Address.fromString(LIQUIDITY_ORACLE_ADDRESS))
  const tokenIds = investor.tokenIds

  for (let i=0; i<tokenIds.length; i++) {
    const positionTokens = liquidityOracle.getPositionTokenAmount(tokenIds[i])
  
    const token0 = positionTokens.getToken0()
    const amount0 = positionTokens.getAmount0()
    const decimal0 = ERC20.bind(token0).decimals()
    const deAmount0 = amount0.divDecimal(BigDecimal.fromString(f64(10 ** decimal0).toString()))
    const token0Index = poolTokens.indexOf(token0)







    let added = false
    for (let j=0; j<tokens.length; j++) {
      if (poolTokens[i].equals(tokens[j])) {
        tokensAmountETH[j] = tokensAmountETH[j].plus(investor.poolTokensAmountETH[i])
        tokensAmountUSD[j] = tokensAmountUSD[j].plus(investor.poolTokensAmountUSD[i])
        added = true 
        break  
      }
    }

    if (!added) {
      tokens.push(poolTokens[i])
      tokensSymbols.push(investor.poolTokensSymbols[i])
      tokensDecimals.push(investor.poolTokensDecimals[i])
      tokensAmountETH.push(investor.poolTokensAmountETH[i])
      tokensAmountUSD.push(investor.poolTokensAmountUSD[i])  
    }
  }

  investorSnapshot.tokens = tokens
  investorSnapshot.tokensSymbols = tokensSymbols
  investorSnapshot.tokensDecimals = tokensDecimals
  investorSnapshot.tokensAmountETH = tokensAmountETH
  investorSnapshot.tokensAmountUSD = tokensAmountUSD
  investorSnapshot.currentETH = investor.currentETH
  investorSnapshot.currentUSD = investor.currentUSD
  investorSnapshot.poolETH = investor.poolETH
  investorSnapshot.poolUSD = investor.poolUSD
  investorSnapshot.save()
}

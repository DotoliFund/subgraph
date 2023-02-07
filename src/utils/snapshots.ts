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
import { DOTOLI_FACTORY_ADDRESS, LIQUIDITY_ORACLE_ADDRESS, ZERO_BD } from './constants'
import { Bytes, ethereum, Address } from '@graphprotocol/graph-ts'
import { LiquidityOracle  } from '../types/templates/DotoliFund/LiquidityOracle'
import { ERC20 } from '../types/templates/DotoliFund/ERC20'
import { getPriceETH } from './pricing'

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
  ethPriceInUSD: BigDecimal,
  event: ethereum.Event
): void {
  let investor = Investor.load(getInvestorID(
    Address.fromString(fundAddress.toHexString()), 
    Address.fromString(investorAddress.toHexString())))
  if (!investor) return 

  let timestamp = event.block.timestamp
  let investorSnapshotID = investorAddress.toHexString()
    .concat('-').concat(timestamp.toString())

  let investorSnapshot = InvestorSnapshot.load(investorSnapshotID)
  investorSnapshot = new InvestorSnapshot(investorSnapshotID)
  investorSnapshot.timestamp = timestamp
  investorSnapshot.fund = fundAddress
  investorSnapshot.manager = managerAddress
  investorSnapshot.investor = investorAddress
  investorSnapshot.principalETH = investor.principalETH
  investorSnapshot.principalUSD = investor.principalUSD
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
  let poolETH: BigDecimal = ZERO_BD
  let poolUSD: BigDecimal = ZERO_BD

  for (let i=0; i<tokenIds.length; i++) {
    const positionTokens = liquidityOracle.getPositionTokenAmount(tokenIds[i])
  
    const token0 = positionTokens.getToken0()
    const amount0 = positionTokens.getAmount0()
    const decimal0 = ERC20.bind(token0).decimals()
    const amount0ETH = getPriceETH(token0, amount0)
    const amount0USD = amount0ETH.times(ethPriceInUSD)
    const token0Index = tokens.indexOf(token0)
    if (token0Index >= 0) {
      tokensAmountETH[token0Index] = tokensAmountETH[token0Index].plus(amount0ETH)
      tokensAmountUSD[token0Index] = tokensAmountUSD[token0Index].plus(amount0USD)
    } else {
      tokens.push(token0)
      const symbol = ERC20.bind(token0).try_symbol()
      if (symbol.reverted) {
        tokensSymbols.push(token0.toHexString())
      } else {
        tokensSymbols.push(symbol.value)
      }
      tokensDecimals.push(BigInt.fromString(decimal0.toString()))
      tokensAmountETH.push(amount0ETH)
      tokensAmountUSD.push(amount0USD)
    }
    poolETH = poolETH.plus(amount0ETH)
    poolUSD = poolUSD.plus(amount0USD)

    const token1 = positionTokens.getToken1()
    const amount1 = positionTokens.getAmount1()
    const decimal1 = ERC20.bind(token1).decimals()
    const amount1ETH = getPriceETH(token1, amount1)
    const amount1USD = amount1ETH.times(ethPriceInUSD)
    const token1Index = tokens.indexOf(token1)
    if (token1Index >= 0) {
      tokensAmountETH[token1Index] = tokensAmountETH[token1Index].plus(amount1ETH)
      tokensAmountUSD[token1Index] = tokensAmountUSD[token1Index].plus(amount1USD)
    } else {
      tokens.push(token1)
      const symbol = ERC20.bind(token1).try_symbol()
      if (symbol.reverted) {
        tokensSymbols.push(token1.toHexString())
      } else {
        tokensSymbols.push(symbol.value)
      }
      tokensDecimals.push(BigInt.fromString(decimal1.toString()))
      tokensAmountETH.push(amount1ETH)
      tokensAmountUSD.push(amount1USD)
    }
    poolETH = poolETH.plus(amount1ETH)
    poolUSD = poolUSD.plus(amount1USD)
  }

  investorSnapshot.tokens = tokens
  investorSnapshot.tokensSymbols = tokensSymbols
  investorSnapshot.tokensDecimals = tokensDecimals
  investorSnapshot.tokensAmountETH = tokensAmountETH
  investorSnapshot.tokensAmountUSD = tokensAmountUSD
  investorSnapshot.currentETH = investor.currentETH // current price is updated at updateInvestorCurrent()
  investorSnapshot.currentUSD = investor.currentUSD // current price is updated at updateInvestorCurrent()
  investorSnapshot.tokenIds = investor.tokenIds
  investorSnapshot.poolETH = poolETH
  investorSnapshot.poolUSD = poolUSD
  investorSnapshot.profitETH = investor.profitETH
  investorSnapshot.profitUSD = investor.profitUSD
  investorSnapshot.profitRatio = investor.profitRatio
  investorSnapshot.save()
}

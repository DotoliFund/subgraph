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
import { DOTOLI_FACTORY_ADDRESS, DOTOLI_FUND_ADDRESS, LIQUIDITY_ROUTER_ADDRESS, ZERO_BD } from './constants'
import { Bytes, ethereum, Address } from '@graphprotocol/graph-ts'
import { DotoliFund } from '../types/DotoliFund/DotoliFund'
import { LiquidityRouter } from '../types/DotoliFund/LiquidityRouter'
import { ERC20 } from '../types/DotoliFund/ERC20'
import { getTokenPriceETH } from './pricing'
import { fetchTokenSymbol, fetchTokenDecimals } from '../utils/token'
import { exponentToBigDecimal } from "../utils"


export function factorySnapshot(event: ethereum.Event): void {
  let factory = Factory.load(Bytes.fromHexString(DOTOLI_FACTORY_ADDRESS))
  if (!factory) return 

  let timestamp = event.block.timestamp.toI32()
  let dayID = timestamp / 86400 // rounded
  let dayStartTimestamp = dayID * 86400
  
  let factorySnapshot = FactorySnapshot.load(dayID.toString())
  if (factorySnapshot === null) {
    factorySnapshot = new FactorySnapshot(dayID.toString())
  }
  factorySnapshot.date = dayStartTimestamp
  factorySnapshot.fundCount = factory.fundCount
  factorySnapshot.investorCount = factory.investorCount
  factorySnapshot.totalCurrentETH = factory.totalCurrentETH
  factorySnapshot.totalCurrentUSD = factory.totalCurrentUSD
  factorySnapshot.save()
}

export function fundSnapshot(
  fundId: BigInt,
  managerAddress: Bytes,
  event: ethereum.Event,
  ethPriceInUSD: BigDecimal
): void {
  let fund = Fund.load(fundId.toString())
  if (!fund) return 
  
  const currentTokens = fund.currentTokens

  let currentETH: BigDecimal = ZERO_BD
  let currentUSD: BigDecimal = ZERO_BD
  const currentTokensAmountETH: BigDecimal[] = []
  const currentTokensAmountUSD: BigDecimal[] = []

  for (let i=0; i<currentTokens.length; i++) {
    const amount = DotoliFund.bind(Address.fromString(DOTOLI_FUND_ADDRESS)).getFundTokenAmount(fundId, Address.fromBytes(currentTokens[i]))
    const decimals = fetchTokenDecimals(Address.fromBytes(currentTokens[i]))
    if (decimals === null) {
      log.debug('the decimals on {} token was null', [currentTokens[i].toHexString()])
      return
    }
    const tokenDecimal = exponentToBigDecimal(decimals)
    const tokenAmount = amount.divDecimal(tokenDecimal)
    const tokenPriceETH = getTokenPriceETH(Address.fromBytes(currentTokens[i]))
    if (tokenPriceETH === null) return
    const amountETH = tokenAmount.times(tokenPriceETH)
    const amountUSD = amountETH.times(ethPriceInUSD)
    currentETH = currentETH.plus(amountETH)
    currentUSD = currentUSD.plus(amountUSD)
    currentTokensAmountETH.push(amountETH)
    currentTokensAmountUSD.push(amountUSD)
  }
  
  let timestamp = event.block.timestamp
  let fundTimeID = fundId.toString()
    .concat('-').concat(timestamp.toString())
    
  let fundSnapshot = FundSnapshot.load(fundTimeID)
  fundSnapshot = new FundSnapshot(fundTimeID)
  fundSnapshot.timestamp = timestamp
  fundSnapshot.fundId = fundId.toString()
  fundSnapshot.manager = managerAddress
  fundSnapshot.investorCount = fund.investorCount
  fundSnapshot.currentETH = currentETH
  fundSnapshot.currentUSD = currentUSD
  fundSnapshot.currentTokens = fund.currentTokens
  fundSnapshot.currentTokensSymbols = fund.currentTokensSymbols
  fundSnapshot.currentTokensDecimals = fund.currentTokensDecimals
  fundSnapshot.currentTokensAmount = fund.currentTokensAmount
  fundSnapshot.currentTokensAmountETH = currentTokensAmountETH
  fundSnapshot.currentTokensAmountUSD = currentTokensAmountUSD
  fundSnapshot.save()
}

// 1, get current token USD
// 2. add current token USD -> tokenAmountXXX (save)
// 3. get pool token USD
// 4. add pool token USD -> tokenAmountXXX (save)
// 5. tokenAmountXXX = current token USD + pool token USD
// 6. tokenAmountXXX -> investorSnapshot (save)
export function investorSnapshot(
  fundId: BigInt, 
  managerAddress: Bytes, 
  investorAddress: Bytes,
  ethPriceInUSD: BigDecimal,
  event: ethereum.Event
): void {
  let investor = Investor.load(getInvestorID(
    fundId, 
    Address.fromString(investorAddress.toHexString())))
  if (!investor) return 

  let timestamp = event.block.timestamp
  let investorSnapshotID = investorAddress.toHexString()
    .concat('-').concat(timestamp.toString())

  let investorSnapshot = InvestorSnapshot.load(investorSnapshotID)
  investorSnapshot = new InvestorSnapshot(investorSnapshotID)
  investorSnapshot.timestamp = timestamp
  investorSnapshot.fundId = fundId.toString()
  investorSnapshot.manager = managerAddress
  investorSnapshot.investor = investorAddress
  investorSnapshot.principalETH = investor.principalETH
  investorSnapshot.principalUSD = investor.principalUSD

  // 1, get current token USD
  const currentTokens = investor.currentTokens

  let currentETH: BigDecimal = ZERO_BD
  let currentUSD: BigDecimal = ZERO_BD
  const currentTokensAmountETH: BigDecimal[] = []
  const currentTokensAmountUSD: BigDecimal[] = []
  for (let i=0; i<currentTokens.length; i++) {
    const tokenAmount = investor.currentTokensAmount[i]
    const tokenPriceETH = getTokenPriceETH(Address.fromBytes(currentTokens[i]))
    if (tokenPriceETH === null) return
    const amountETH = tokenAmount.times(tokenPriceETH)
    const amountUSD = amountETH.times(ethPriceInUSD)
    currentETH = currentETH.plus(amountETH)
    currentUSD = currentUSD.plus(amountUSD)
    currentTokensAmountETH.push(amountETH)
    currentTokensAmountUSD.push(amountUSD)
  }
  investorSnapshot.currentETH = currentETH
  investorSnapshot.currentUSD = currentUSD

  // 2. add current token USD -> tokenAmountXXX (save)
  const tokens: Bytes[] = []
  const tokensSymbols: string[] = []
  const tokensDecimals: BigInt[] = []
  const tokensAmountETH: BigDecimal[] = []
  const tokensAmountUSD: BigDecimal[] = []
  for (let i=0; i<currentTokens.length; i++) {
    tokens.push(currentTokens[i])
    tokensSymbols.push(investor.currentTokensSymbols[i])
    tokensDecimals.push(investor.currentTokensDecimals[i])
    tokensAmountETH.push(currentTokensAmountETH[i])
    tokensAmountUSD.push(currentTokensAmountUSD[i])
  }

  // 3. get pool token USD
  let tokenIds: BigInt[] = []
  const dotolifund = DotoliFund.bind(Address.fromString(DOTOLI_FUND_ADDRESS))
  const investorTokenIds = dotolifund.getTokenIds(fundId, Address.fromBytes(investorAddress))
  for (let i=0; i<investorTokenIds.length; i++) {
    const tokenId = investorTokenIds[i]
    tokenIds.push(tokenId)    
  }
  
  let poolETH: BigDecimal = ZERO_BD
  let poolUSD: BigDecimal = ZERO_BD
  const liquidityRouter = LiquidityRouter.bind(Address.fromString(LIQUIDITY_ROUTER_ADDRESS))
  for (let i=0; i<tokenIds.length; i++) {
    const poolTokens = liquidityRouter.getPositionTokenAmount(tokenIds[i])
    
    // 4-1. add pool token0 USD -> tokenAmountXXX (save)
    const token0 = poolTokens.getToken0()
    const amount0 = poolTokens.getAmount0()
    const decimal0 = fetchTokenDecimals(token0)
    if (decimal0 === null) {
      log.debug('the decimals on {} token was null', [token0.toHexString()])
      return
    }
    const token0Decimal = exponentToBigDecimal(decimal0)
    const deAmount0 = amount0.divDecimal(token0Decimal)
    const token0PriceETH = getTokenPriceETH(token0)
    if (token0PriceETH === null) return
    const amount0ETH = deAmount0.times(token0PriceETH)
    const amount0USD = amount0ETH.times(ethPriceInUSD)
    const token0Index = tokens.indexOf(token0)
    if (token0Index >= 0) {
      tokensAmountETH[token0Index] = tokensAmountETH[token0Index].plus(amount0ETH)
      tokensAmountUSD[token0Index] = tokensAmountUSD[token0Index].plus(amount0USD)
    } else {
      tokens.push(token0)
      tokensSymbols.push(fetchTokenSymbol(token0))
      tokensDecimals.push(BigInt.fromString(decimal0.toString()))
      tokensAmountETH.push(amount0ETH)
      tokensAmountUSD.push(amount0USD)
    }
    poolETH = poolETH.plus(amount0ETH)
    poolUSD = poolUSD.plus(amount0USD)

    // 4-2. add pool token1 USD -> tokenAmountXXX (save)
    const token1 = poolTokens.getToken1()
    const amount1 = poolTokens.getAmount1()
    const decimal1 = fetchTokenDecimals(token1)
    if (decimal1 === null) {
      log.debug('the decimals on {} token was null', [token1.toHexString()])
      return
    }
    const token1Decimal = exponentToBigDecimal(decimal1)
    const deAmount1 = amount1.divDecimal(token1Decimal)
    const token1PriceETH = getTokenPriceETH(token1)
    if (token1PriceETH === null) return
    const amount1ETH = deAmount1.times(token1PriceETH)
    const amount1USD = amount1ETH.times(ethPriceInUSD)
    const token1Index = tokens.indexOf(token1)
    if (token1Index >= 0) {
      tokensAmountETH[token1Index] = tokensAmountETH[token1Index].plus(amount1ETH)
      tokensAmountUSD[token1Index] = tokensAmountUSD[token1Index].plus(amount1USD)
    } else {
      tokens.push(token1)
      tokensSymbols.push(fetchTokenSymbol(token1))
      tokensDecimals.push(BigInt.fromString(decimal1.toString()))
      tokensAmountETH.push(amount1ETH)
      tokensAmountUSD.push(amount1USD)
    }
    poolETH = poolETH.plus(amount1ETH)
    poolUSD = poolUSD.plus(amount1USD)
  }
  // 5. tokenAmountXXX = current token USD + pool token USD

  // 6. tokenAmountXXX -> investorSnapshot (save)
  investorSnapshot.tokens = tokens
  investorSnapshot.tokensSymbols = tokensSymbols
  investorSnapshot.tokensDecimals = tokensDecimals
  investorSnapshot.tokensAmountETH = tokensAmountETH
  investorSnapshot.tokensAmountUSD = tokensAmountUSD
  investorSnapshot.poolETH = poolETH
  investorSnapshot.poolUSD = poolUSD
  investorSnapshot.save()
}

import { BigDecimal, Address, Bytes, BigInt, log } from '@graphprotocol/graph-ts'
import { Investor } from '../types/schema'
import {
  LIQUIDITY_ORACLE_ADDRESS,
  ZERO_BD,
  ZERO_BI,
  ONE_BD,
  TYPE_DEPOSIT,
  TYPE_WITHDRAW,
  DOTOLI_INFO_ADDRESS,
} from './constants'
import { getTokenPriceETH } from './pricing'
import { DotoliInfo } from '../types/DotoliInfo/DotoliInfo'
import { LiquidityOracle } from '../types/DotoliFund/LiquidityOracle'
import { safeDiv } from '../utils'
import { fetchTokenSymbol, fetchTokenDecimals } from '../utils/token'
import { exponentToBigDecimal } from "../utils"


export function getInvestorID(fundId: BigInt, investor: Address): string {
  const investorID = fundId.toString() + '-' + investor.toHexString().toUpperCase()
  return investorID
}

export function updateInvestor(
  fundId: BigInt,
  investorAddress: Address,
  ethPriceInUSD: BigDecimal
): void {
  let investor = Investor.load(getInvestorID(fundId, investorAddress))
  if (!investor) return
  
  const dotoliInfo = DotoliInfo.bind(Address.fromString(DOTOLI_INFO_ADDRESS))
  const currentTokens: Bytes[] = []
  const currentTokensSymbols: string[] = []
  const currentTokensDecimals: BigInt[] = []
  const currentTokensAmount: BigDecimal[] = []
  let currentETH: BigDecimal = ZERO_BD
  let currentUSD: BigDecimal = ZERO_BD
  const tokensInfo = dotoliInfo.getInvestorTokens(fundId, investorAddress)
  for (let i=0; i<tokensInfo.length; i++) {
    const tokenAddress = tokensInfo[i].token
    currentTokens.push(tokenAddress)
    currentTokensSymbols.push(fetchTokenSymbol(tokenAddress))
    const amount = tokensInfo[i].amount
    const decimals = fetchTokenDecimals(tokenAddress)
    if (decimals === ZERO_BI) {
      log.debug('the decimals on {} token was null', [tokenAddress.toHexString()])
      return
    }
    const tokenDecimal = exponentToBigDecimal(decimals)
    currentTokensDecimals.push(decimals)
    const deAmount = amount.divDecimal(tokenDecimal)
    currentTokensAmount.push(deAmount)
    const tokenPriceETH = getTokenPriceETH(tokenAddress)
    if (tokenPriceETH === null) return
    const amountETH = deAmount.times(tokenPriceETH)
    const amountUSD = amountETH.times(ethPriceInUSD)
    currentETH = currentETH.plus(amountETH)
    currentUSD = currentUSD.plus(amountUSD)
  }
  investor.currentTokens = currentTokens
  investor.currentTokensSymbols = currentTokensSymbols
  investor.currentTokensDecimals = currentTokensDecimals
  investor.currentTokensAmount = currentTokensAmount
  investor.currentETH = currentETH
  investor.currentUSD = currentUSD
  investor.save()
}

export function updateInvestorProfit(
  fundId: BigInt,
  investorAddress: Address,
  ethPriceInUSD: BigDecimal,
  type: number,
  _amountETH: BigDecimal,
  _amountUSD: BigDecimal
  ): void {
  let investor = Investor.load(getInvestorID(fundId, investorAddress))
  if (!investor) return
  
  const dotoliInfo = DotoliInfo.bind(Address.fromString(DOTOLI_INFO_ADDRESS))
  const liquidityOracle = LiquidityOracle.bind(Address.fromString(LIQUIDITY_ORACLE_ADDRESS))

  let poolETH: BigDecimal = ZERO_BD
  let poolUSD: BigDecimal = ZERO_BD

  const investorTokenIds = dotoliInfo.getTokenIds(fundId, investorAddress)
  for (let i=0; i<investorTokenIds.length; i++) {
    const tokenId = investorTokenIds[i]
    const positionTokens = liquidityOracle.getPositionTokenAmount(tokenId)
  
    const token0 = positionTokens.getToken0()
    const amount0 = positionTokens.getAmount0()
    const decimal0 = fetchTokenDecimals(token0)
    if (decimal0 === ZERO_BI) {
      log.debug('the decimals on {} token was null', [token0.toHexString()])
      return
    }
    const token0Decimal = exponentToBigDecimal(decimal0)
    const deAmount0 = amount0.divDecimal(token0Decimal)
    const token0PriceETH = getTokenPriceETH(token0)
    if (token0PriceETH === null) return
    const amount0ETH = deAmount0.times(token0PriceETH)
    const amount0USD = amount0ETH.times(ethPriceInUSD)
    poolETH = poolETH.plus(amount0ETH)
    poolUSD = poolUSD.plus(amount0USD)

    const token1 = positionTokens.getToken1()
    const amount1 = positionTokens.getAmount1()
    const decimal1 = fetchTokenDecimals(token1)
    if (decimal1 === ZERO_BI) {
      log.debug('the decimals on {} token was null', [token1.toHexString()])
      return
    }
    const token1Decimal = exponentToBigDecimal(decimal1)
    const deAmount1 = amount1.divDecimal(token1Decimal)
    const token1PriceETH = getTokenPriceETH(token1)
    if (token1PriceETH === null) return
    const amount1ETH = deAmount1.times(token1PriceETH)
    const amount1USD = amount1ETH.times(ethPriceInUSD)
    poolETH = poolETH.plus(amount1ETH)
    poolUSD = poolUSD.plus(amount1USD)
  }

  if (type == TYPE_DEPOSIT) {
    investor.principalETH = investor.principalETH.plus(_amountETH)
    investor.principalUSD = investor.principalUSD.plus(_amountUSD)
  } else if (type == TYPE_WITHDRAW) {
    // withdraw
    const prevVolumeETH = investor.currentETH.plus(poolETH).plus(_amountETH)
    const withdrawRatioETH = safeDiv(_amountETH, prevVolumeETH)
    const afterWithdrawETH = ONE_BD.minus(withdrawRatioETH)
    investor.principalETH = investor.principalETH.times(afterWithdrawETH)

    const prevVolumeUSD = investor.currentUSD.plus(poolUSD).plus(_amountUSD)
    const withdrawRatioUSD = safeDiv(_amountUSD, prevVolumeUSD)
    const afterWithdrawUSD= ONE_BD.minus(withdrawRatioUSD)
    investor.principalUSD = investor.principalUSD.times(afterWithdrawUSD)
  } 
  
  investor.profitETH = investor.currentETH.plus(poolETH).minus(investor.principalETH)
  investor.profitUSD = investor.currentUSD.plus(poolUSD).minus(investor.principalUSD)
  investor.profitRatio = safeDiv(investor.profitUSD, investor.principalUSD).times(BigDecimal.fromString('100'))

  investor.save()
}
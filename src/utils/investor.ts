import { BigDecimal, Address, Bytes, BigInt } from '@graphprotocol/graph-ts'
import { Investor } from '../types/schema'
import {
  LIQUIDITY_ORACLE_ADDRESS,
  ZERO_BD,
  ONE_BD,
  TYPE_DEPOSIT,
  TYPE_WITHDRAW,
} from './constants'
import { getTokenPriceETH } from './pricing'
import { DotoliFund } from '../types/templates/DotoliFund/DotoliFund'
import { ERC20 } from '../types/templates/DotoliFund/ERC20'
import { LiquidityOracle  } from '../types/templates/DotoliFund/LiquidityOracle'
import { safeDiv } from '../utils'

export function getInvestorID(fund: Address, investor: Address): string {
  const investorID = fund.toHexString().toUpperCase() + '-' + investor.toHexString().toUpperCase()
  return investorID
}

export function updateInvestor(
  fundAddress: Address,
  investorAddress: Address,
  ethPriceInUSD: BigDecimal
): void {
  let investor = Investor.load(getInvestorID(fundAddress, investorAddress))
  if (!investor) return
  
  const dotolifund = DotoliFund.bind(fundAddress)
  const currentTokens: Bytes[] = []
  const currentTokensSymbols: string[] = []
  const currentTokensDecimals: BigInt[] = []
  const currentTokensAmount: BigDecimal[] = []
  let currentETH: BigDecimal = ZERO_BD
  let currentUSD: BigDecimal = ZERO_BD
  const tokensInfo = dotolifund.getInvestorTokens(investorAddress)
  for (let i=0; i<tokensInfo.length; i++) {
    const tokenAddress = tokensInfo[i].tokenAddress
    currentTokens.push(tokenAddress)
    const symbol = ERC20.bind(tokenAddress).try_symbol()
    if (symbol.reverted) {
      currentTokensSymbols.push(tokenAddress.toHexString())
    } else {
      currentTokensSymbols.push(symbol.value)
    }
    const amount = tokensInfo[i].amount
    const decimals = ERC20.bind(tokenAddress).decimals()
    currentTokensDecimals.push(BigInt.fromString(decimals.toString()))
    const deAmount = amount.divDecimal(BigDecimal.fromString(f64(10 ** decimals).toString()))
    currentTokensAmount.push(deAmount)
    const tokenPriceETH = getTokenPriceETH(tokenAddress)
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
  fundAddress: Address,
  investorAddress: Address,
  ethPriceInUSD: BigDecimal,
  type: number,
  _amountETH: BigDecimal,
  _amountUSD: BigDecimal
  ): void {
  let investor = Investor.load(getInvestorID(fundAddress, investorAddress))
  if (!investor) return
  
  const dotolifund = DotoliFund.bind(fundAddress)
  const liquidityOracle = LiquidityOracle.bind(Address.fromString(LIQUIDITY_ORACLE_ADDRESS))

  let poolETH: BigDecimal = ZERO_BD
  let poolUSD: BigDecimal = ZERO_BD

  const investorTokenIds = dotolifund.getPositionTokenIds(investorAddress)
  for (let i=0; i<investorTokenIds.length; i++) {
    const tokenId = investorTokenIds[i]
    const positionTokens = liquidityOracle.getPositionTokenAmount(tokenId)
  
    const token0 = positionTokens.getToken0()
    const amount0 = positionTokens.getAmount0()
    const decimal0 = ERC20.bind(token0).decimals()
    const deAmount0 = amount0.divDecimal(BigDecimal.fromString(f64(10 ** decimal0).toString()))
    const token0PriceETH = getTokenPriceETH(token0)
    const amount0ETH = deAmount0.times(token0PriceETH)
    const amount0USD = amount0ETH.times(ethPriceInUSD)
    poolETH = poolETH.plus(amount0ETH)
    poolUSD = poolUSD.plus(amount0USD)

    const token1 = positionTokens.getToken1()
    const amount1 = positionTokens.getAmount1()
    const decimal1 = ERC20.bind(token1).decimals()
    const deAmount1 = amount1.divDecimal(BigDecimal.fromString(f64(10 ** decimal1).toString()))
    const token1PriceETH = getTokenPriceETH(token1)
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
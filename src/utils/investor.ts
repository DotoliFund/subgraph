import { BigDecimal, Address, Bytes, BigInt } from '@graphprotocol/graph-ts'
import { Investor } from '../types/schema'
import {
  LIQUIDITY_ORACLE_ADDRESS,
  ZERO_BD,
  ONE_BD,
  TYPE_DEPOSIT,
} from './constants'
import { getPriceETH } from './pricing'
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
  const currentTokensAmountETH: BigDecimal[] = []
  const currentTokensAmountUSD: BigDecimal[] = []
  const currentETH: BigDecimal = ZERO_BD
  const currentUSD: BigDecimal = ZERO_BD
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
    const amountETH = getPriceETH(tokenAddress, amount)
    const amountUSD = amountETH.times(ethPriceInUSD)
    currentTokensAmountETH.push(amountETH)
    currentTokensAmountUSD.push(amountUSD)
    currentETH.plus(amountETH)
    currentUSD.plus(amountUSD)
  }
  investor.currentTokens = currentTokens
  investor.currentTokensSymbols = currentTokensSymbols
  investor.currentTokensDecimals = currentTokensDecimals
  investor.currentTokensAmount = currentTokensAmount
  investor.currentTokensAmountETH = currentTokensAmountETH
  investor.currentTokensAmountUSD = currentTokensAmountUSD
  investor.currentETH = currentETH
  investor.currentUSD = currentUSD

  let tokenIds: BigInt[] = []
  const investorTokenIds = dotolifund.getPositionTokenIds(investorAddress)
  for (let i=0; i<investorTokenIds.length; i++) {
    const tokenId = investorTokenIds[i]
    tokenIds.push(tokenId)    
  }
  investor.tokenIds = tokenIds

  investor.save()
}

export function updateInvestAmount(
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
    const amount0ETH = getPriceETH(token0, amount0)
    const amount0USD = amount0ETH.times(ethPriceInUSD)
    poolETH = poolETH.plus(amount0ETH)
    poolUSD = poolUSD.plus(amount0USD)

    const token1 = positionTokens.getToken1()
    const amount1 = positionTokens.getAmount1()
    const amount1ETH = getPriceETH(token1, amount1)
    const amount1USD = amount1ETH.times(ethPriceInUSD)
    poolETH = poolETH.plus(amount1ETH)
    poolUSD = poolUSD.plus(amount1USD)
  }

  if (type == TYPE_DEPOSIT) {
    investor.investAmountETH = investor.investAmountETH.plus(_amountETH)
    investor.investAmountUSD = investor.investAmountUSD.plus(_amountUSD)
  } else {
    // withdraw
    const prevVolumeETH = investor.currentETH.plus(poolETH).plus(_amountETH)
    const withdrawRatioETH = safeDiv(_amountETH, prevVolumeETH)
    const afterWithdrawETH = ONE_BD.minus(withdrawRatioETH)
    investor.investAmountETH = investor.investAmountETH.times(afterWithdrawETH)

    const prevVolumeUSD = investor.currentUSD.plus(poolUSD).plus(_amountUSD)
    const withdrawRatioUSD = safeDiv(_amountUSD, prevVolumeUSD)
    const afterWithdrawUSD= ONE_BD.minus(withdrawRatioUSD)
    investor.investAmountUSD = investor.investAmountUSD.times(afterWithdrawUSD)
  }
  investor.save()
}
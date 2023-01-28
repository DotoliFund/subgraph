import { BigDecimal, Address, Bytes, BigInt } from '@graphprotocol/graph-ts'
import { Investor } from '../types/schema'
import {
  LIQUIDITY_ORACLE_ADDRESS,
  ZERO_BD
} from './constants'
import { 
  getPriceETH,
} from './pricing'
import { DotoliFund } from '../types/templates/DotoliFund/DotoliFund'
import { ERC20 } from '../types/templates/DotoliFund/ERC20'
import { LiquidityOracle  } from '../types/templates/DotoliFund/LiquidityOracle'


export function getInvestorID(fund: Address, investor: Address): string {
  const investorID = fund.toHexString().toUpperCase() + '-' + investor.toHexString().toUpperCase()
  return investorID
}

export function getInvestorTokens(_fund: Address, _investor: Address): string[] {
  const dotolifund = DotoliFund.bind(_fund)

  let investorTokens: string[] = []
  const _investorTokens = dotolifund.getInvestorTokens(_investor)
  for (let i=0; i<_investorTokens.length; i++) {
    investorTokens.push(_investorTokens[i].tokenAddress.toHexString())
  }
  return investorTokens
}

export function updateInvestorVolume(
  fundAddress: Address,
  investorAddress: Address,
  ethPriceInUSD: BigDecimal
): void {
  let investor = Investor.load(getInvestorID(fundAddress, investorAddress))
  if (!investor) return

  investor.volumeETH = getInvestorVolumeETH(fundAddress, investorAddress)
  investor.volumeUSD = investor.volumeETH.times(ethPriceInUSD)
  investor.save()
}

export function updateInvestorTokens(
  fundAddress: Address,
  investorAddress: Address,
  ethPriceInUSD: BigDecimal
): void {
  let investor = Investor.load(getInvestorID(fundAddress, investorAddress))
  if (!investor) return
  
  const dotolifund = DotoliFund.bind(fundAddress)
  let investorTokens: Bytes[] = []
  let investorSymbols: string[] = []
  let investorDecimals: BigInt[] = []
  let investorTokensAmount: BigDecimal[] = []
  let investorTokensVolumeETH: BigDecimal[] = []
  let investorTokensVolumeUSD: BigDecimal[] = []
  const tokensInfo = dotolifund.getInvestorTokens(investorAddress)
  for (let i=0; i<tokensInfo.length; i++) {
    const tokenAddress = tokensInfo[i].tokenAddress
    investorTokens.push(tokenAddress)
    const symbol = ERC20.bind(tokenAddress).try_symbol()
    if (symbol.reverted) {
      investorSymbols.push(tokenAddress.toHexString())
    } else {
      investorSymbols.push(symbol.value)
    }
    const amount = tokensInfo[i].amount
    const decimals = ERC20.bind(tokenAddress).decimals()
    investorDecimals.push(BigInt.fromString(decimals.toString()))
    const deAmount = amount.divDecimal(BigDecimal.fromString(f64(10 ** decimals).toString()))
    investorTokensAmount.push(deAmount)
    const amountETH = getPriceETH(tokenAddress, amount)
    const amountUSD = amountETH.times(ethPriceInUSD)
    investorTokensVolumeETH.push(amountETH)
    investorTokensVolumeUSD.push(amountUSD)
  }
  investor.tokens = investorTokens
  investor.symbols = investorSymbols
  investor.decimals = investorDecimals
  investor.tokensAmount = investorTokensAmount
  investor.tokensVolumeETH = investorTokensVolumeETH
  investor.tokensVolumeUSD = investorTokensVolumeUSD
  investor.save()
}

export function updateInvestorLiquidityTokens(
  fundAddress: Address,
  investorAddress: Address,
): void {
  let investor = Investor.load(getInvestorID(fundAddress, investorAddress))
  if (!investor) return
  
  const dotolifund = DotoliFund.bind(fundAddress)
  const liquidityOracle = LiquidityOracle.bind(Address.fromString(LIQUIDITY_ORACLE_ADDRESS))

  let liquidityTokens: Bytes[] = []
  let liquiditySymbols: string[] = []
  let liquidityDecimals: BigInt[] = []
  let liquidityTokensAmount: BigDecimal[] = []

  const investorTokenIds = dotolifund.getPositionTokenIds(investorAddress)
  for (let i=0; i<investorTokenIds.length; i++) {
    const tokenId = investorTokenIds[i]
    const positionTokens = liquidityOracle.getPositionTokenAmount(tokenId)
  
    const token0 = positionTokens.getToken0()
    const amount0 = positionTokens.getAmount0()
    const decimal0 = ERC20.bind(token0).decimals()
    const deAmount0 = amount0.divDecimal(BigDecimal.fromString(f64(10 ** decimal0).toString()))
    const token0Index = liquidityTokens.indexOf(token0)
    if (token0Index >= 0) {
      liquidityTokensAmount[token0Index] = liquidityTokensAmount[token0Index].plus(deAmount0)
    } else {
      liquidityTokens.push(token0)
      const symbol = ERC20.bind(token0).try_symbol()
      if (symbol.reverted) {
        liquiditySymbols.push(token0.toHexString())
      } else {
        liquiditySymbols.push(symbol.value)
      }
      liquidityDecimals.push(BigInt.fromString(decimal0.toString()))
      liquidityTokensAmount.push(deAmount0)
    }

    const token1 = positionTokens.getToken1()
    const amount1 = positionTokens.getAmount1()
    const decimal1 = ERC20.bind(token1).decimals()
    const deAmount1 = amount1.divDecimal(BigDecimal.fromString(f64(10 ** decimal1).toString()))
    const token1Index = liquidityTokens.indexOf(token1)
    if (token1Index >= 0) {
      liquidityTokensAmount[token1Index] = liquidityTokensAmount[token1Index].plus(deAmount1)
    } else {
      liquidityTokens.push(token1)
      const symbol = ERC20.bind(token1).try_symbol()
      if (symbol.reverted) {
        liquiditySymbols.push(token1.toHexString())
      } else {
        liquiditySymbols.push(symbol.value)
      }
      liquidityDecimals.push(BigInt.fromString(decimal1.toString()))
      liquidityTokensAmount.push(deAmount1)
    }
  }
  investor.liquidityTokens = liquidityTokens
  investor.liquiditySymbols = liquiditySymbols
  investor.liquidityDecimals = liquidityDecimals
  investor.liquidityTokensAmount = liquidityTokensAmount
  investor.save()
}

export function getInvestorVolumeETH(fund: Address, investor: Address): BigDecimal {
  const dotolifund = DotoliFund.bind(fund)

  let investorTvlETH = ZERO_BD

  // not liquidity volume
  const investorTokens = dotolifund.getInvestorTokens(investor)
  for (let i=0; i<investorTokens.length; i++) {
    const tokenAddress = investorTokens[i].tokenAddress
    const amount = investorTokens[i].amount
    const amountETH = getPriceETH(tokenAddress, amount)
    const deAmountETH = amountETH
    investorTvlETH = investorTvlETH.plus(deAmountETH)
  }
  return investorTvlETH
}

export function getInvestorLiquidityVolumeETH(fund: Address, investor: Address): BigDecimal {
  const dotolifund = DotoliFund.bind(fund)
  const liquidityOracle = LiquidityOracle.bind(Address.fromString(LIQUIDITY_ORACLE_ADDRESS))

  let investorTvlETH = ZERO_BD

  // liquidity volume
  const investorTokenIds = dotolifund.getPositionTokenIds(investor)
  for (let i=0; i<investorTokenIds.length; i++) {
    const tokenId = investorTokenIds[i]
    const positionTokens = liquidityOracle.getPositionTokenAmount(tokenId)
  
    const token0 = positionTokens.getToken0()
    const token1 = positionTokens.getToken1()
    const amount0 = positionTokens.getAmount0()
    const amount1 = positionTokens.getAmount1()

    const token0VolumeETH = getPriceETH(token0, amount0)
    const token1VolumeETH = getPriceETH(token1, amount1)
    const deVolumeETH = token0VolumeETH.plus(token1VolumeETH)
    investorTvlETH = investorTvlETH.plus(deVolumeETH)     
  }
  return investorTvlETH
}
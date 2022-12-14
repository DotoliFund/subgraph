import { BigDecimal, Address, Bytes } from '@graphprotocol/graph-ts'
import { Investor } from '../types/schema'
import {
  LIQUIDITY_ORACLE_ADDRESS
} from './constants'
import { 
  getPriceETH,
} from './pricing'
import { XXXFund2 } from '../types/templates/XXXFund2/XXXFund2'
import { ERC20 } from '../types/templates/XXXFund2/ERC20'
import { LiquidityOracle  } from '../types/templates/XXXFund2/LiquidityOracle'


export function getInvestorID(fund: Address, investor: Address): string {
  const investorID = fund.toHexString().toUpperCase() + '-' + investor.toHexString().toUpperCase()
  return investorID
}

export function getInvestorTokens(_fund: Address, _investor: Address): string[] {
  const xxxFund2 = XXXFund2.bind(_fund)

  let investorTokens: string[] = []
  const _investorTokens = xxxFund2.getInvestorTokens(_investor)
  for (let i=0; i<_investorTokens.length; i++) {
    investorTokens.push(_investorTokens[i].tokenAddress.toHexString())
  }
  return investorTokens
}


export function updateInvestorTokens(
  fundAddress: Address,
  investorAddress: Address,
  ethPriceInUSD: BigDecimal
): void {
  let investor = Investor.load(getInvestorID(fundAddress, investorAddress))
  if (!investor) return
  
  const xxxFund2 = XXXFund2.bind(fundAddress)
  let investorTokens: Bytes[] = []
  let investorSymbols: string[] = []
  let investorTokensAmount: BigDecimal[] = []
  let investorTokensVolumeETH: BigDecimal[] = []
  let investorTokensVolumeUSD: BigDecimal[] = []
  const tokensInfo = xxxFund2.getInvestorTokens(investorAddress)
  for (let i=0; i<tokensInfo.length; i++) {
    const tokenAddress = tokensInfo[i].tokenAddress
    investorTokens.push(tokenAddress)
    investorSymbols.push(ERC20.bind(tokenAddress).symbol())
    const amount = tokensInfo[i].amount
    const decimals = ERC20.bind(tokenAddress).decimals()
    const deAmount = amount.divDecimal(BigDecimal.fromString(f64(10 ** decimals).toString()))
    investorTokensAmount.push(deAmount)
    const amountETH = getPriceETH(tokenAddress, amount)
    const amountUSD = amountETH.times(ethPriceInUSD)
    investorTokensVolumeETH.push(amountETH)
    investorTokensVolumeUSD.push(amountUSD)
  }
  investor.tokens = investorTokens
  investor.symbols = investorSymbols
  investor.tokensAmount = investorTokensAmount
  investor.tokensVolumeETH = investorTokensVolumeETH
  investor.tokensVolumeUSD = investorTokensVolumeUSD
  investor.save()
}

export function updateInvestorLiquidityTokens(
  fundAddress: Address,
  investorAddress: Address,
  ethPriceInUSD: BigDecimal
): void {
  let investor = Investor.load(getInvestorID(fundAddress, investorAddress))
  if (!investor) return
  
  const xxxFund2 = XXXFund2.bind(fundAddress)
  const liquidityOracle = LiquidityOracle.bind(Address.fromString(LIQUIDITY_ORACLE_ADDRESS))

  let liquidityTokens: Bytes[] = []
  let liquiditySymbols: string[] = []
  let liquidityTokensAmount: BigDecimal[] = []
  let liquidityTokensVolumeETH: BigDecimal[] = []
  let liquidityTokensVolumeUSD: BigDecimal[] = []

  const investorTokenIds = xxxFund2.getPositionTokenIds(investorAddress)
  for (let i=0; i<investorTokenIds.length; i++) {
    const tokenId = investorTokenIds[i]
    const positionTokens = liquidityOracle.getPositionTokenAmount(tokenId)
  
    const token0 = positionTokens.getToken0()
    const amount0 = positionTokens.getAmount0()
    const decimal0 = ERC20.bind(token0).decimals()
    const deAmount0 = amount0.divDecimal(BigDecimal.fromString(f64(10 ** decimal0).toString()))
    const token0Index = liquidityTokens.indexOf(token0)
    if (token0Index > 0) {
      const amount0ETH = getPriceETH(token0, amount0)
      const amount0USD = amount0ETH.times(ethPriceInUSD)
      liquidityTokensAmount[token0Index] = liquidityTokensAmount[token0Index].plus(deAmount0)
      liquidityTokensVolumeETH[token0Index] = liquidityTokensVolumeETH[token0Index].plus(amount0ETH)
      liquidityTokensVolumeUSD[token0Index] = liquidityTokensVolumeUSD[token0Index].plus(amount0USD)
    } else {
      liquidityTokens.push(token0)
      liquiditySymbols.push(ERC20.bind(token0).symbol())
      liquidityTokensAmount.push(deAmount0)
      liquidityTokensVolumeETH.push(getPriceETH(token0, amount0))
      liquidityTokensVolumeUSD.push(deAmount0.times(ethPriceInUSD))
    }

    const token1 = positionTokens.getToken1()
    const amount1 = positionTokens.getAmount1()
    const decimal1 = ERC20.bind(token1).decimals()
    const deAmount1 = amount1.divDecimal(BigDecimal.fromString(f64(10 ** decimal1).toString()))
    const token1Index = liquidityTokens.indexOf(token1)
    if (token1Index > 0) {
      const amount1ETH = getPriceETH(token1, amount1)
      const amount1USD = amount1ETH.times(ethPriceInUSD)
      liquidityTokensAmount[token1Index] = liquidityTokensAmount[token1Index].plus(deAmount1)
      liquidityTokensVolumeETH[token1Index] = liquidityTokensVolumeETH[token1Index].plus(amount1ETH)
      liquidityTokensVolumeUSD[token1Index] = liquidityTokensVolumeUSD[token1Index].plus(amount1USD)
    } else {
      liquidityTokens.push(token1)
      liquiditySymbols.push(ERC20.bind(token1).symbol())
      liquidityTokensAmount.push(deAmount1)
      liquidityTokensVolumeETH.push(getPriceETH(token1, amount1))
      liquidityTokensVolumeUSD.push(deAmount1.times(ethPriceInUSD))
    }
  }
  investor.liquidityTokens = liquidityTokens
  investor.liquiditySymbols = liquiditySymbols
  investor.liquidityTokensAmount = liquidityTokensAmount
  investor.liquidityTokensVolumeETH = liquidityTokensVolumeETH
  investor.liquidityTokensVolumeUSD = liquidityTokensVolumeUSD
  investor.save()
}
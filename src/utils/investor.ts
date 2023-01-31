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

export function updateInvestorCurrent(
  fundAddress: Address,
  investorAddress: Address,
  ethPriceInUSD: BigDecimal
): void {
  let investor = Investor.load(getInvestorID(fundAddress, investorAddress))
  if (!investor) return

  investor.currentETH = getInvestorCurrentETH(fundAddress, investorAddress)
  investor.currentUSD = investor.currentETH.times(ethPriceInUSD)
  investor.save()
}

export function updateInvestorCurrentTokens(
  fundAddress: Address,
  investorAddress: Address,
  ethPriceInUSD: BigDecimal
): void {
  let investor = Investor.load(getInvestorID(fundAddress, investorAddress))
  if (!investor) return
  
  const dotolifund = DotoliFund.bind(fundAddress)
  const investorTokens: Bytes[] = []
  const investorSymbols: string[] = []
  const investorDecimals: BigInt[] = []
  const investorTokensAmount: BigDecimal[] = []
  const investorTokensAmountETH: BigDecimal[] = []
  const investorTokensAmountUSD: BigDecimal[] = []
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
    investorTokensAmountETH.push(amountETH)
    investorTokensAmountUSD.push(amountUSD)
  }
  investor.currentTokens = investorTokens
  investor.currentTokensSymbols = investorSymbols
  investor.currentTokensDecimals = investorDecimals
  investor.currentTokensAmount = investorTokensAmount
  investor.currentTokensAmountETH = investorTokensAmountETH
  investor.currentTokensAmountUSD = investorTokensAmountUSD
  investor.save()
}


export function updateInvestorTokenIds(
  fundAddress: Address,
  investorAddress: Address,
): void {
  let investor = Investor.load(getInvestorID(fundAddress, investorAddress))
  if (!investor) return
  
  const dotolifund = DotoliFund.bind(fundAddress)
  let tokenIds: BigInt[] = []

  const investorTokenIds = dotolifund.getPositionTokenIds(investorAddress)
  for (let i=0; i<investorTokenIds.length; i++) {
    const tokenId = investorTokenIds[i]
    tokenIds.push(tokenId)    
  }
  investor.tokenIds = tokenIds
  investor.save()
}

export function updateInvestorPoolTokens(
  fundAddress: Address,
  investorAddress: Address,
): void {
  let investor = Investor.load(getInvestorID(fundAddress, investorAddress))
  if (!investor) return
  
  const dotolifund = DotoliFund.bind(fundAddress)
  const liquidityOracle = LiquidityOracle.bind(Address.fromString(LIQUIDITY_ORACLE_ADDRESS))

  let poolTokens: Bytes[] = []
  let poolTokensSymbols: string[] = []
  let poolTokensDecimals: BigInt[] = []
  let poolTokensAmount: BigDecimal[] = []
  let poolTokensAmountETH: BigDecimal[] = []
  let poolTokensAmountUSD: BigDecimal[] = []

  const investorTokenIds = dotolifund.getPositionTokenIds(investorAddress)
  for (let i=0; i<investorTokenIds.length; i++) {
    const tokenId = investorTokenIds[i]
    const positionTokens = liquidityOracle.getPositionTokenAmount(tokenId)
  
    const token0 = positionTokens.getToken0()
    const amount0 = positionTokens.getAmount0()
    const decimal0 = ERC20.bind(token0).decimals()
    const deAmount0 = amount0.divDecimal(BigDecimal.fromString(f64(10 ** decimal0).toString()))
    const token0Index = poolTokens.indexOf(token0)
    if (token0Index >= 0) {
      poolTokensAmount[token0Index] = poolTokensAmount[token0Index].plus(deAmount0)
    } else {
      poolTokens.push(token0)
      const symbol = ERC20.bind(token0).try_symbol()
      if (symbol.reverted) {
        poolTokensSymbols.push(token0.toHexString())
      } else {
        poolTokensSymbols.push(symbol.value)
      }
      poolTokensDecimals.push(BigInt.fromString(decimal0.toString()))
      poolTokensAmount.push(deAmount0)
    }

    const token1 = positionTokens.getToken1()
    const amount1 = positionTokens.getAmount1()
    const decimal1 = ERC20.bind(token1).decimals()
    const deAmount1 = amount1.divDecimal(BigDecimal.fromString(f64(10 ** decimal1).toString()))
    const token1Index = poolTokens.indexOf(token1)
    if (token1Index >= 0) {
      poolTokensAmount[token1Index] = poolTokensAmount[token1Index].plus(deAmount1)
    } else {
      poolTokens.push(token1)
      const symbol = ERC20.bind(token1).try_symbol()
      if (symbol.reverted) {
        poolTokensSymbols.push(token1.toHexString())
      } else {
        poolTokensSymbols.push(symbol.value)
      }
      poolTokensDecimals.push(BigInt.fromString(decimal1.toString()))
      poolTokensAmount.push(deAmount1)
    }
  }
  investor.poolTokens = poolTokens
  investor.poolTokensSymbols = poolTokensSymbols
  investor.poolTokensDecimals = poolTokensDecimals
  investor.poolTokensAmount = poolTokensAmount
  investor.poolTokensAmountETH = poolTokensAmountETH
  investor.poolTokensAmountUSD = poolTokensAmountUSD
  investor.save()
}

export function getInvestorCurrentETH(fund: Address, investor: Address): BigDecimal {
  const dotolifund = DotoliFund.bind(fund)

  let investorTvlETH = ZERO_BD

  // no pool amount
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

export function getInvestorPoolETH(fund: Address, investor: Address): BigDecimal {
  const dotolifund = DotoliFund.bind(fund)
  const liquidityOracle = LiquidityOracle.bind(Address.fromString(LIQUIDITY_ORACLE_ADDRESS))

  let investorTvlETH = ZERO_BD

  // pool amount
  const investorTokenIds = dotolifund.getPositionTokenIds(investor)
  for (let i=0; i<investorTokenIds.length; i++) {
    const tokenId = investorTokenIds[i]
    const positionTokens = liquidityOracle.getPositionTokenAmount(tokenId)
  
    const token0 = positionTokens.getToken0()
    const token1 = positionTokens.getToken1()
    const amount0 = positionTokens.getAmount0()
    const amount1 = positionTokens.getAmount1()

    const token0CurrentETH = getPriceETH(token0, amount0)
    const token1CurrentETH = getPriceETH(token1, amount1)
    const deCurrentETH = token0CurrentETH.plus(token1CurrentETH)
    investorTvlETH = investorTvlETH.plus(deCurrentETH)     
  }
  return investorTvlETH
}
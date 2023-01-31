import { BigDecimal, Address, Bytes, log, BigInt } from '@graphprotocol/graph-ts'
import { Fund, Factory } from '../types/schema'
import {
  DOTOLI_FACTORY_ADDRESS,
  ZERO_BI,
  ZERO_BD
} from './constants'
import { 
  getEthPriceInUSD,
  getPriceETH
} from './pricing'
import { ERC20 } from '../types/templates/DotoliFund/ERC20'
import { DotoliFund } from '../types/templates/DotoliFund/DotoliFund'

export function updateFundCurrent(
  fundAddress: Address,
  ethPriceInUSD: BigDecimal
): void {
  let factory = Factory.load(Bytes.fromHexString(DOTOLI_FACTORY_ADDRESS))
  if (!factory) return

  let fund = Fund.load(fundAddress)
  if (!fund) return

  factory.totalCurrentETH = factory.totalCurrentETH.minus(fund.currentETH)
  fund.currentETH = getFundCurrentETH(fundAddress)
  fund.currentUSD = fund.currentETH.times(ethPriceInUSD)
  factory.totalCurrentETH = factory.totalCurrentETH.plus(fund.currentETH)
  factory.totalCurrentUSD = factory.totalCurrentETH.times(ethPriceInUSD)
  fund.save()
  factory.save()
}

export function updateFundTokens(fundAddress: Address): void {
  let fund = Fund.load(fundAddress)
  if (!fund) return
  
  const ethPriceInUSD = getEthPriceInUSD()
  const tokens = fund.currentTokens
  
  let tokensAmount: BigDecimal[] = []
  let tokensCurrentETH: BigDecimal[] = []
  let tokensCurrentUSD: BigDecimal[] = []

  for (let i=0; i<tokens.length; i++) {
    const balance = ERC20.bind(Address.fromBytes(tokens[i])).balanceOf(fundAddress)
    const decimals = ERC20.bind(Address.fromBytes(tokens[i])).decimals()
    const tokenAmount = balance.divDecimal(BigDecimal.fromString(f64(10 ** decimals).toString()))
    tokensAmount.push(tokenAmount)
    
    const amountETH = getPriceETH(Address.fromBytes(tokens[i]), balance)
    tokensCurrentETH.push(amountETH)

    const deAmountETH = amountETH
    const amountUSD = deAmountETH.times(ethPriceInUSD)
    tokensCurrentUSD.push(amountUSD)
  }

  fund.currentTokensAmount = tokensAmount
  fund.currentTokensAmountETH = tokensCurrentETH
  fund.currentTokensAmountUSD = tokensCurrentUSD
  fund.save()
}

export function isNewFundToken(fundTokens: Bytes[], token: Bytes): bool {
  for (let i=0; i<fundTokens.length; i++) {
    if(fundTokens[i].equals(token)) return false
  }
  return true
}

export function isEmptyFundToken(fund: Address, token: Bytes): bool {
  const balance = ERC20.bind(Address.fromBytes(token)).balanceOf(fund)
  if (balance.equals(ZERO_BI)) {
    return true
  } else {
    return false
  }
}

export function updateEmptyFundToken(
  fundAddress: Address,
  token: Bytes
): void {
  let fund = Fund.load(fundAddress)
  if (!fund) return

  // if token amount 0, remove from fund token list
  if (isEmptyFundToken(fundAddress, token)) {
    let fundTokens: Bytes[] = []
    let fundSymbols: string[] = []
    let fundDecimals: BigInt[] = []
    for (let i=0; i<fund.currentTokens.length; i++) {
      if(fund.currentTokens[i].equals(token)) continue
      fundTokens.push(fund.currentTokens[i])
      fundSymbols.push(fund.currentTokensSymbols[i])
      fundDecimals.push(fund.currentTokensDecimals[i])
    }
    fund.currentTokens = fundTokens
    fund.currentTokensSymbols = fundSymbols
    fund.currentTokensDecimals = fundDecimals
    fund.save()
  }
}

export function updateNewFundToken(
  fundAddress: Address,
  token: Bytes,
  tokenSymbol: string,
  tokenDecimal: BigInt
): void {
  let fund = Fund.load(fundAddress)
  if (!fund) return

  if (isNewFundToken(fund.currentTokens, token)) {
    let fundTokens: Bytes[] = fund.currentTokens
    let fundSymbols: string[] = fund.currentTokensSymbols
    let fundDecimals: BigInt[] = fund.currentTokensDecimals

    fundTokens.push(token)
    fundSymbols.push(tokenSymbol)
    fundDecimals.push(tokenDecimal)
    fund.currentTokens = fundTokens
    fund.currentTokensSymbols = fundSymbols
    fund.currentTokensDecimals = fundDecimals
    fund.save()
  }
}

export function getFundCurrentETH(fundAddress: Address): BigDecimal {
  let fund = Fund.load(fundAddress)
  if (!fund) return ZERO_BD

  let fundTvlETH = ZERO_BD

  const fundTokens = fund.currentTokens
  for (let i=0; i<fundTokens.length; i++) {
    const tokenAddress = fundTokens[i]
    const amount = ERC20.bind(Address.fromBytes(tokenAddress)).balanceOf(fundAddress)
    const amountETH = getPriceETH(Address.fromBytes(tokenAddress), amount)
    const deAmountETH = amountETH
    fundTvlETH = fundTvlETH.plus(deAmountETH)
  }
  return fundTvlETH
}

export function updateFeeTokens(fundAddress: Address): void {
  let fund = Fund.load(fundAddress)
  if (!fund) return

  const dotolifund = DotoliFund.bind(fundAddress)
  const feeTokensInfo = dotolifund.getFeeTokens()

  let feeTokens: Bytes[] = []
  let feeSymbols: string[] = []
  let feeTokensAmount: BigDecimal[] = []

  for (let i=0; i<feeTokensInfo.length; i++) {
    const tokenAddress = feeTokensInfo[i].tokenAddress
    feeTokens.push(tokenAddress)
    const symbol = ERC20.bind(tokenAddress).try_symbol()
    if (symbol.reverted) {
      feeSymbols.push(tokenAddress.toHexString())
    } else {
      feeSymbols.push(symbol.value)
    }
    const amount = feeTokensInfo[i].amount
    const decimal = ERC20.bind(tokenAddress).decimals()
    const deAmount = amount.divDecimal(BigDecimal.fromString(f64(10 ** decimal).toString()))
    feeTokensAmount.push(deAmount)
  }

  fund.feeTokens = feeTokens
  fund.feeSymbols = feeSymbols
  fund.feeTokensAmount = feeTokensAmount

  fund.save()
}
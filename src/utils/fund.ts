import { BigDecimal, Address, Bytes, log, BigInt } from '@graphprotocol/graph-ts'
import { Fund, Factory } from '../types/schema'
import { DOTOLI_FACTORY_ADDRESS, ZERO_BI, ZERO_BD } from './constants'
import { getPriceETH } from './pricing'
import { ERC20 } from '../types/templates/DotoliFund/ERC20'
import { DotoliFund } from '../types/templates/DotoliFund/DotoliFund'


export function updateFundCurrent(fundAddress: Address, ethPriceInUSD: BigDecimal): void {
  let factory = Factory.load(Bytes.fromHexString(DOTOLI_FACTORY_ADDRESS))
  if (!factory) return

  let fund = Fund.load(fundAddress)
  if (!fund) return
  
  const tokens = fund.currentTokens
  
  const currentTokensAmount: BigDecimal[] = []
  const currentTokensAmountETH: BigDecimal[] = []
  const currentTokensAmountUSD: BigDecimal[] = []
  let currentETH: BigDecimal = ZERO_BD
  let currentUSD: BigDecimal = ZERO_BD

  factory.totalCurrentETH = factory.totalCurrentETH.minus(fund.currentETH)

  for (let i=0; i<tokens.length; i++) {
    const amount = ERC20.bind(Address.fromBytes(tokens[i])).balanceOf(fundAddress)
    const decimals = ERC20.bind(Address.fromBytes(tokens[i])).decimals()
    const tokenAmount = amount.divDecimal(BigDecimal.fromString(f64(10 ** decimals).toString()))
    const amountETH = getPriceETH(Address.fromBytes(tokens[i]), amount)
    const amountUSD = amountETH.times(ethPriceInUSD)
    currentTokensAmount.push(tokenAmount)
    currentTokensAmountETH.push(amountETH)
    currentTokensAmountUSD.push(amountUSD)
    currentETH = currentETH.plus(amountETH)
    currentUSD = currentUSD.plus(amountUSD)
  }

  fund.currentTokensAmount = currentTokensAmount
  fund.currentTokensAmountETH = currentTokensAmountETH
  fund.currentTokensAmountUSD = currentTokensAmountUSD
  fund.currentETH = currentETH
  fund.currentUSD = currentUSD

  factory.totalCurrentETH = factory.totalCurrentETH.plus(fund.currentETH)
  factory.totalCurrentUSD = factory.totalCurrentETH.times(ethPriceInUSD)

  fund.save()
  factory.save()
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
    const fundTokens: Bytes[] = []
    const fundSymbols: string[] = []
    const fundDecimals: BigInt[] = []
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
    const fundTokens: Bytes[] = fund.currentTokens
    const fundSymbols: string[] = fund.currentTokensSymbols
    const fundDecimals: BigInt[] = fund.currentTokensDecimals

    fundTokens.push(token)
    fundSymbols.push(tokenSymbol)
    fundDecimals.push(tokenDecimal)
    fund.currentTokens = fundTokens
    fund.currentTokensSymbols = fundSymbols
    fund.currentTokensDecimals = fundDecimals
    fund.save()
  }
}

export function updateFundFee(fundAddress: Address): void {
  let fund = Fund.load(fundAddress)
  if (!fund) return

  const dotolifund = DotoliFund.bind(fundAddress)
  const feeTokensInfo = dotolifund.getFeeTokens()

  const feeTokens: Bytes[] = []
  const feeSymbols: string[] = []
  const feeTokensAmount: BigDecimal[] = []

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
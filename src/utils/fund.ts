


import { BigDecimal, Address, Bytes, log } from '@graphprotocol/graph-ts'
import { Fund, Factory } from '../types/schema'
import {
  FACTORY_ADDRESS,
  ZERO_BI,
  ZERO_BD
} from './constants'
import { 
  getEthPriceInUSD,
  getPriceETH
} from './pricing'
import { ERC20 } from '../types/templates/XXXFund2/ERC20'
import { XXXFund2 } from '../types/templates/XXXFund2/XXXFund2'

export function updateFundVolume(
  fundAddress: Address,
  ethPriceInUSD: BigDecimal
): void {
  let factory = Factory.load(Bytes.fromHexString(FACTORY_ADDRESS))
  if (!factory) return

  let fund = Fund.load(fundAddress)
  if (!fund) return

  factory.totalVolumeETH = factory.totalVolumeETH.minus(fund.volumeETH)
  fund.volumeETH = getFundVolumeETH(fundAddress)
  fund.volumeUSD = fund.volumeETH.times(ethPriceInUSD)
  factory.totalVolumeETH = factory.totalVolumeETH.plus(fund.volumeETH)
  factory.totalVolumeUSD = factory.totalVolumeETH.times(ethPriceInUSD)
  fund.save()
  factory.save()
}

export function updateFundTokens(fundAddress: Address): void {
  let fund = Fund.load(fundAddress)
  if (!fund) return
  
  const ethPriceInUSD = getEthPriceInUSD()
  const tokens = fund.tokens
  
  let tokensAmount: BigDecimal[] = []
  let tokensVolumeETH: BigDecimal[] = []
  let tokensVolumeUSD: BigDecimal[] = []

  for (let i=0; i<tokens.length; i++) {
    const balance = ERC20.bind(Address.fromBytes(tokens[i])).balanceOf(fundAddress)
    const decimals = ERC20.bind(Address.fromBytes(tokens[i])).decimals()
    const tokenAmount = balance.divDecimal(BigDecimal.fromString(f64(10 ** decimals).toString()))
    tokensAmount.push(tokenAmount)
    
    const amountETH = getPriceETH(Address.fromBytes(tokens[i]), balance)
    tokensVolumeETH.push(amountETH)

    const deAmountETH = amountETH
    const amountUSD = deAmountETH.times(ethPriceInUSD)
    tokensVolumeUSD.push(amountUSD)
  }

  fund.tokensAmount = tokensAmount
  fund.tokensVolumeETH = tokensVolumeETH
  fund.tokensVolumeUSD = tokensVolumeUSD
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
    for (let i=0; i<fund.tokens.length; i++) {
      if(fund.tokens[i].equals(token)) continue
      fundTokens.push(fund.tokens[i])
      fundSymbols.push(fund.symbols[i])
    }
    fund.tokens = fundTokens
    fund.symbols = fundSymbols
    fund.save()
  }
}

export function updateNewFundToken(
  fundAddress: Address,
  token: Bytes,
  tokenSymbol: string
): void {
  let fund = Fund.load(fundAddress)
  if (!fund) return

  if (isNewFundToken(fund.tokens, token)) {
    let fundTokens: Bytes[] = fund.tokens
    let fundSymbols: string[] = fund.symbols

    fundTokens.push(token)
    fundSymbols.push(tokenSymbol)
    fund.tokens = fundTokens
    fund.symbols = fundSymbols
    fund.save()
  }
}

export function getFundVolumeETH(fundAddress: Address): BigDecimal {
  let fund = Fund.load(fundAddress)
  if (!fund) return ZERO_BD

  let fundTvlETH = ZERO_BD

  const fundTokens = fund.tokens
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

  const xxxFund2 = XXXFund2.bind(fundAddress)
  const feeTokensInfo = xxxFund2.getFeeTokens()

  let feeTokens: Bytes[] = []
  let feeSymbols: string[] = []
  let feeTokensAmount: BigDecimal[] = []

  for (let i=0; i<feeTokensInfo.length; i++) {
    const tokenAddress = feeTokensInfo[i].tokenAddress
    const symbol = ERC20.bind(Address.fromBytes(tokenAddress)).symbol()

    feeTokens.push(tokenAddress)
    feeSymbols.push(symbol)
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
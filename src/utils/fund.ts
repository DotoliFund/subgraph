import { BigDecimal, Address, Bytes, log, BigInt } from '@graphprotocol/graph-ts'
import { Fund, Factory } from '../types/schema'
import { DOTOLI_FACTORY_ADDRESS, ZERO_BI, ZERO_BD, DOTOLI_FUND_ADDRESS } from './constants'
import { getTokenPriceETH } from './pricing'
import { DotoliFund } from '../types/DotoliFund/DotoliFund'
import { fetchTokenSymbol, fetchTokenDecimals } from '../utils/token'
import { exponentToBigDecimal } from "../utils"


export function updateFundCurrent(fundId: BigInt, ethPriceInUSD: BigDecimal): void {
  let factory = Factory.load(Bytes.fromHexString(DOTOLI_FACTORY_ADDRESS))
  if (!factory) return

  let fund = Fund.load(fundId.toString())
  if (!fund) return
  
  const tokens = fund.currentTokens
  
  let currentETH: BigDecimal = ZERO_BD
  let currentUSD: BigDecimal = ZERO_BD
  const currentTokensAmount: BigDecimal[] = []

  factory.totalCurrentETH = factory.totalCurrentETH.minus(fund.currentETH)

  for (let i=0; i<tokens.length; i++) {
    const amount = DotoliFund.bind(Address.fromString(DOTOLI_FUND_ADDRESS)).getFundTokenAmount(fundId, Address.fromBytes(tokens[i]))
    const decimals = fetchTokenDecimals(Address.fromBytes(tokens[i]))
    if (decimals === null) {
      log.debug('the decimals on {} token was null', [tokens[i].toHexString()])
      return
    }
    const tokenDecimal = exponentToBigDecimal(decimals)
    const tokenAmount = amount.divDecimal(tokenDecimal)
    const tokenPriceETH = getTokenPriceETH(Address.fromBytes(tokens[i]))
    if (tokenPriceETH === null) return
    const amountETH = tokenAmount.times(tokenPriceETH)
    const amountUSD = amountETH.times(ethPriceInUSD)
    currentETH = currentETH.plus(amountETH)
    currentUSD = currentUSD.plus(amountUSD)
    currentTokensAmount.push(tokenAmount)
  }

  fund.currentETH = currentETH
  fund.currentUSD = currentUSD
  fund.currentTokensAmount = currentTokensAmount

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

export function isEmptyFundToken(fundId: BigInt, token: Bytes): bool {
  const tokenAmount = DotoliFund.bind(Address.fromString(DOTOLI_FUND_ADDRESS)).getFundTokenAmount(fundId, Address.fromBytes(token))
  if (tokenAmount.equals(ZERO_BI)) {
    return true
  } else {
    return false
  }
}

export function updateEmptyFundToken(
  fundId: BigInt,
  token: Bytes
): void {
  let fund = Fund.load(fundId.toString())
  if (!fund) return

  // if token amount 0, remove from fund token list
  if (isEmptyFundToken(fundId, token)) {
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
  fundId: BigInt,
  token: Bytes,
  tokenSymbol: string,
  tokenDecimal: BigInt
): void {
  let fund = Fund.load(fundId.toString())
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

export function updateFundFee(fundId: BigInt): void {
  let fund = Fund.load(fundId.toString())
  if (!fund) return

  const dotolifund = DotoliFund.bind(Address.fromString(DOTOLI_FUND_ADDRESS))
  const feeTokensInfo = dotolifund.getFeeTokens(fundId)

  const feeTokens: Bytes[] = []
  const feeSymbols: string[] = []
  const feeTokensAmount: BigDecimal[] = []

  for (let i=0; i<feeTokensInfo.length; i++) {
    const tokenAddress = feeTokensInfo[i].tokenAddress
    feeTokens.push(tokenAddress)
    feeSymbols.push(fetchTokenSymbol(tokenAddress))
    const amount = feeTokensInfo[i].amount

    const decimals = fetchTokenDecimals(tokenAddress)
    if (decimals === null) {
      log.debug('the decimals on {} token was null', [tokenAddress.toHexString()])
      return
    }
    const tokenDecimal = exponentToBigDecimal(decimals)
    const deAmount = amount.divDecimal(tokenDecimal)
    feeTokensAmount.push(deAmount)
  }

  fund.feeTokens = feeTokens
  fund.feeSymbols = feeSymbols
  fund.feeTokensAmount = feeTokensAmount

  fund.save()
}
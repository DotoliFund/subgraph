


import { BigDecimal, Address, Bytes, log } from '@graphprotocol/graph-ts'
import { Fund } from '../types/schema'
import {
  ZERO_BI,
} from './constants'
import { 
  getEthPriceInUSD,
  getPriceETH
} from './pricing'
import { ERC20 } from '../types/templates/XXXFund2/ERC20'

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
    log.info('aaaa updateFundTokens 1: {}', [tokens[i].toString()])
    log.info('aaaa updateFundTokens 2: {}', [balance.toString()])

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
  log.info('aaaa isEmptyFundToken 1: {}', [token.toHexString()])
  log.info('aaaa isEmptyFundToken 2: {}', [balance.toString()])
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
      log.info('aaaa updateEmptyFundToken :{}', [fund.tokens[i].toHexString()])
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
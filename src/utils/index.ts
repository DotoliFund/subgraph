/* eslint-disable prefer-const */
import { BigDecimal, Address, ethereum, Bytes, log } from '@graphprotocol/graph-ts'
import { Factory, Fund, Investor, Transaction } from '../types/schema'
import {
  ZERO_BD,
  ZERO_BI,
  FACTORY_ADDRESS
} from './constants'
import { getEthPriceInUSD, getPriceETH, getInvestorTvlETH, getManagerFeeTvlETH } from './pricing'
import { XXXFund2 } from '../types/templates/XXXFund2/XXXFund2'
import { ERC20 } from '../types/templates/XXXFund2/ERC20'

export function getFundID(fund: Address): string {
  const fundID = fund.toHexString().toUpperCase()
  return fundID
}

export function getInvestorID(fund: Address, investor: Address): string {
  const investorID = fund.toHexString().toUpperCase() + '-' + investor.toHexString().toUpperCase()
  return investorID
}

export function loadTransaction(event: ethereum.Event): Transaction {
  let transaction = Transaction.load(event.transaction.hash.toHexString())
  if (transaction === null) {
    transaction = new Transaction(event.transaction.hash.toHexString())
  }
  transaction.blockNumber = event.block.number
  transaction.timestamp = event.block.timestamp
  transaction.save()
  return transaction as Transaction
}

export function updateFundTokensVolumeUSD(fundAddress: Address): void {
  let fund = Fund.load(getFundID(fundAddress))
  if (!fund) return
  fund.tokensVolumeUSD = getTokensVolumeUSD(fundAddress, fund.tokens)
  fund.save()
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

export function getTokensVolumeUSD(owner: Address, tokens: Bytes[]): BigDecimal[] {
  const ethPriceInUSD = getEthPriceInUSD()
  
  let tokensVolumeUSD: BigDecimal[] = []
  for (let i=0; i<tokens.length; i++) {
    const balance = ERC20.bind(Address.fromBytes(tokens[i])).balanceOf(owner)
    const amountETH = getPriceETH(Address.fromBytes(tokens[i]), balance)
    const deAmountETH = amountETH
    const amountUSD = deAmountETH.times(ethPriceInUSD)
    tokensVolumeUSD.push(amountUSD)
  }
  return tokensVolumeUSD
}

// return 0 if denominator is 0 in division
export function safeDiv(amount0: BigDecimal, amount1: BigDecimal): BigDecimal {
  if (amount1.equals(ZERO_BD)) {
    return ZERO_BD
  } else {
    return amount0.div(amount1)
  }
}

export function updateVolume(
  fundAddress: Address,
  investorAddress: Address,
  ethPriceInUSD: BigDecimal
): void {
  let factory = Factory.load(FACTORY_ADDRESS)
  if (!factory) return

  let fund = Fund.load(getFundID(fundAddress))
  if (!fund) return

  let investor = Investor.load(getInvestorID(fundAddress, investorAddress))
  if (!investor) return

  factory.totalVolumeETH = factory.totalVolumeETH.minus(fund.volumeETH)
  fund.volumeETH = fund.volumeETH.minus(investor.volumeETH)
  fund.volumeETH = fund.volumeETH.minus(fund.feeVolumeETH)

  investor.volumeETH = getInvestorTvlETH(fundAddress, investorAddress)
  investor.volumeUSD = investor.volumeETH.times(ethPriceInUSD)

  fund.feeVolumeETH = getManagerFeeTvlETH(fundAddress)
  fund.feeVolumeUSD = fund.feeVolumeETH.times(ethPriceInUSD)

  fund.volumeETH = fund.volumeETH.plus(investor.volumeETH)
  fund.volumeETH = fund.volumeETH.plus(fund.feeVolumeETH)
  fund.volumeUSD = fund.volumeETH.times(ethPriceInUSD)
  factory.totalVolumeETH = factory.totalVolumeETH.plus(fund.volumeETH)
  factory.totalVolumeUSD = factory.totalVolumeETH.times(ethPriceInUSD)
  
  factory.save()
  fund.save()
  investor.save()
}

export function updateInvestorTokens(
  fundAddress: Address,
  investorAddress: Address,
  ethPriceInUSD: BigDecimal
): void {
  let investor = Investor.load(getInvestorID(fundAddress, investorAddress))
  if (!investor) return
  
  const xxxFund2 = XXXFund2.bind(fundAddress)
  let _investorTokens: Bytes[] = []
  let _investorSymbols: string[] = []
  let _investorTokensVolumeUSD: BigDecimal[] = []
  const investorTokens = xxxFund2.getInvestorTokens(investorAddress)
  for (let i=0; i<investorTokens.length; i++) {
    const tokenAddress = investorTokens[i].tokenAddress
    _investorTokens.push(tokenAddress)
    _investorSymbols.push(ERC20.bind(tokenAddress).symbol())
    const amount = investorTokens[i].amount
    const amountETH = getPriceETH(tokenAddress, amount)
    const amountUSD = amountETH.times(ethPriceInUSD)
    _investorTokensVolumeUSD.push(amountUSD)
  }
  investor.tokens = _investorTokens
  investor.symbols = _investorSymbols
  investor.tokensVolumeUSD = _investorTokensVolumeUSD
  investor.save()
}

// updateProfit must be after update principalUSD
export function updateProfit(
  fundAddress: Address,
  investorAddress: Address
): void {
  let fund = Fund.load(getFundID(fundAddress))
  if (!fund) return

  let investor = Investor.load(getInvestorID(fundAddress, investorAddress))
  if (!investor) return

  investor.profitETH = investor.volumeETH.minus(investor.principalETH)
  investor.profitUSD = investor.volumeUSD.minus(investor.principalUSD)
  investor.profitRatio = safeDiv(investor.profitETH, investor.principalETH).times(BigDecimal.fromString('100'))
  fund.profitETH = fund.volumeETH.minus(fund.principalETH)
  fund.profitUSD = fund.volumeUSD.minus(fund.principalUSD)
  fund.profitRatio = safeDiv(fund.profitETH, fund.principalETH).times(BigDecimal.fromString('100'))

  fund.save()
  investor.save()
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

export function handleEmptyFundToken(
  fundAddress: Address,
  token: Bytes
): void {
  let fund = Fund.load(getFundID(fundAddress))
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
    fund.tokensVolumeUSD = getTokensVolumeUSD(fundAddress, fund.tokens)
    fund.save()
  }
}

export function handleNewFundToken(
  fundAddress: Address,
  token: Bytes,
  tokenSymbol: string
): void {
  let fund = Fund.load(getFundID(fundAddress))
  if (!fund) return

  if (isNewFundToken(fund.tokens, token)) {
    let fundTokens: Bytes[] = fund.tokens
    let fundSymbols: string[] = fund.symbols
    fundTokens.push(token)
    fundSymbols.push(tokenSymbol)
    fund.tokens = fundTokens
    fund.symbols = fundSymbols
    fund.tokensVolumeUSD = getTokensVolumeUSD(fundAddress, fund.tokens)
    fund.save()
  }
}
/* eslint-disable prefer-const */
import { BigDecimal, Address, ethereum, Bytes, log } from '@graphprotocol/graph-ts'
import { Factory, Fund, Investor, Transaction } from '../types/schema'
import {
  WETH_DECIMAL,
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

export function getProfitUSD(princial: BigDecimal, volume: BigDecimal): BigDecimal {
  let profitUSD: BigDecimal = ZERO_BD 
  return profitUSD
}

export function getProfitRatio(princial: BigDecimal, volume: BigDecimal): BigDecimal {
  let profitRatio: BigDecimal = ZERO_BD 
  return profitRatio
}

export function isNewToken(fundTokens: Bytes[], token: Bytes): bool {
  for (let i=0; i<fundTokens.length; i++) {
    if(fundTokens[i].equals(token)) return false
  }
  return true
}

export function isTokenEmpty(owner: Address, token: Address): bool {
  const balnce = ERC20.bind(token).balanceOf(owner)
  if (balnce.gt(ZERO_BI)) {
    return false
  } else {
    return true
  }
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
    const balnce = ERC20.bind(Address.fromBytes(tokens[i])).balanceOf(owner)
    const amountETH = getPriceETH(Address.fromBytes(tokens[i]), balnce)
    const deAmountETH = amountETH.div(WETH_DECIMAL)
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

export function updateVolume(fundAddress: Address, investorAddress: Address, fund: Fund, investor: Investor, ethPriceInUSD: BigDecimal) {
  let factory = Factory.load(FACTORY_ADDRESS)
  if (!factory) return

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

export function updateInvestorTokens(fundAddress: Address, investorAddress: Address, investor: Investor) {
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
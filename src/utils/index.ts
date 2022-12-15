/* eslint-disable prefer-const */
import { BigDecimal, Address, ethereum, Bytes, log, BigInt } from '@graphprotocol/graph-ts'
import { Factory, Fund, Investor, Transaction } from '../types/schema'
import {
  ZERO_BD,
  ZERO_BI,
  FACTORY_ADDRESS,
  LIQUIDITY_ORACLE_ADDRESS
} from './constants'
import { 
  getEthPriceInUSD,
  getPriceETH,
  getInvestorVolumeETH,
  getInvestorLiquidityVolumeETH,
  getManagerFeeTvlETH
} from './pricing'
import { XXXFund2 } from '../types/templates/XXXFund2/XXXFund2'
import { ERC20 } from '../types/templates/XXXFund2/ERC20'
import { LiquidityOracle  } from '../types/templates/XXXFund2/LiquidityOracle'
import { getFundID } from './fund'
import { getInvestorID } from './investor'


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

  investor.volumeETH = getInvestorVolumeETH(fundAddress, investorAddress)
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

export function updateLiquidityVolume(
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

  factory.totalLiquidityVolumeETH = factory.totalLiquidityVolumeETH.minus(fund.liquidityVolumeETH)
  fund.liquidityVolumeETH = fund.liquidityVolumeETH.minus(investor.liquidityVolumeETH)

  investor.liquidityVolumeETH = getInvestorLiquidityVolumeETH(fundAddress, investorAddress)
  investor.liquidityVolumeUSD = investor.liquidityVolumeETH.times(ethPriceInUSD)

  fund.liquidityVolumeETH = fund.liquidityVolumeETH.plus(investor.liquidityVolumeETH)
  fund.liquidityVolumeUSD = fund.liquidityVolumeETH.times(ethPriceInUSD)
  
  factory.totalLiquidityVolumeETH = factory.totalLiquidityVolumeETH.plus(fund.liquidityVolumeETH)
  factory.totalLiquidityVolumeUSD = factory.totalLiquidityVolumeETH.times(ethPriceInUSD)

  factory.save()
  fund.save()
  investor.save()
}

// updateProfit must be after update principalUSD
export function updateProfit(
  fundAddress: Address,
  investorAddress: Address,
  ethPriceInUSD: BigDecimal
): void {
  let fund = Fund.load(getFundID(fundAddress))
  if (!fund) return

  let investor = Investor.load(getInvestorID(fundAddress, investorAddress))
  if (!investor) return

  investor.profitETH = investor.volumeETH.plus(investor.liquidityVolumeETH).minus(investor.principalETH)
  investor.profitUSD = investor.profitETH.times(ethPriceInUSD)
  investor.profitRatio = safeDiv(investor.profitUSD, investor.principalUSD).times(BigDecimal.fromString('100'))
  fund.profitETH = fund.volumeETH.plus(fund.liquidityVolumeETH).minus(fund.principalETH)
  fund.profitUSD = fund.profitETH.times(ethPriceInUSD)
  fund.profitRatio = safeDiv(fund.profitUSD, fund.principalUSD).times(BigDecimal.fromString('100'))
  
  fund.save()
  investor.save()
}

export function getTokensVolumeETH(owner: Address, tokens: Bytes[]): BigDecimal[] {
  let tokensVolumeETH: BigDecimal[] = []
  for (let i=0; i<tokens.length; i++) {
    const balance = ERC20.bind(Address.fromBytes(tokens[i])).balanceOf(owner)
    const amountETH = getPriceETH(Address.fromBytes(tokens[i]), balance)
    tokensVolumeETH.push(amountETH)
  }
  return tokensVolumeETH
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
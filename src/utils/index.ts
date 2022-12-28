/* eslint-disable prefer-const */
import { BigDecimal, Address, ethereum, Bytes } from '@graphprotocol/graph-ts'
import { Factory, Fund, Investor, Transaction } from '../types/schema'
import {
  ZERO_BD,
  FACTORY_ADDRESS,
} from './constants'
import { 
  getEthPriceInUSD,
  getPriceETH,
} from './pricing'
import { ERC20 } from '../types/templates/XXXFund2/ERC20'
import { getInvestorID } from './investor'
import { getInvestorLiquidityVolumeETH } from './investor'

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

export function updateLiquidityVolume(
  fundAddress: Address,
  investorAddress: Address,
  ethPriceInUSD: BigDecimal
): void {
  let factory = Factory.load(Bytes.fromHexString(FACTORY_ADDRESS))
  if (!factory) return

  let fund = Fund.load(fundAddress)
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
  let fund = Fund.load(fundAddress)
  if (!fund) return

  let investor = Investor.load(getInvestorID(fundAddress, investorAddress))
  if (!investor) return

  investor.profitETH = investor.volumeETH.plus(investor.liquidityVolumeETH).minus(investor.principalETH)
  investor.profitUSD = investor.volumeUSD.plus(investor.liquidityVolumeUSD).minus(investor.principalUSD)
  investor.profitRatio = safeDiv(investor.profitUSD, investor.principalUSD).times(BigDecimal.fromString('100'))
  fund.profitETH = fund.volumeETH.plus(fund.liquidityVolumeETH).minus(fund.principalETH)
  fund.profitUSD = fund.volumeUSD.plus(fund.liquidityVolumeUSD).minus(fund.principalUSD)
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
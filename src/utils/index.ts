/* eslint-disable prefer-const */
import { BigInt, BigDecimal, Address, ethereum } from '@graphprotocol/graph-ts'
import { Transaction } from '../types/schema'
import { ONE_BI, ZERO_BI, ZERO_BD, ONE_BD, ADDRESS_ZERO } from './constants'

export function loadTransaction(event: ethereum.Event): Transaction {
  let transaction = Transaction.load(event.transaction.hash.toHexString())
  if (transaction === null) {
    transaction = new Transaction(event.transaction.hash.toHexString())
  }
  transaction.blockNumber = event.block.number
  transaction.timestamp = event.block.timestamp
  transaction.fund = event.address
  transaction.investor = Address.fromString(ADDRESS_ZERO)
  transaction.save()
  return transaction as Transaction
}

export function getProfitETH(princial: BigInt, volume: BigInt): BigInt {
  let profitETH: BigInt = ZERO_BI 
  return profitETH
}

export function getProfitUSD(princial: BigInt, volume: BigInt): BigInt {
  let profitUSD: BigInt = ZERO_BI 
  return profitUSD
}

export function getProfitRatioETH(princial: BigInt, volume: BigInt): BigInt {
  let profitRatioETH: BigInt = ZERO_BI 
  return profitRatioETH
}

export function getProfitRatioUSD(princial: BigInt, volume: BigInt): BigInt {
  let profitRatioUSD: BigInt = ZERO_BI 
  return profitRatioUSD
}
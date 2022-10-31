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
  transaction.save()
  return transaction as Transaction
}

export function getProfitETH(princial: BigDecimal, volume: BigDecimal): BigDecimal {
  let profitETH: BigDecimal = ZERO_BD
  return profitETH
}

export function getProfitUSD(princial: BigDecimal, volume: BigDecimal): BigDecimal {
  let profitUSD: BigDecimal = ZERO_BD 
  return profitUSD
}

export function getProfitRatioETH(princial: BigDecimal, volume: BigDecimal): BigDecimal {
  let profitRatioETH: BigDecimal = ZERO_BD 
  return profitRatioETH
}

export function getProfitRatioUSD(princial: BigDecimal, volume: BigDecimal): BigDecimal {
  let profitRatioUSD: BigDecimal = ZERO_BD 
  return profitRatioUSD
}
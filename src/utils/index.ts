/* eslint-disable prefer-const */
import { BigInt, BigDecimal, Address, ethereum } from '@graphprotocol/graph-ts'
import { Transaction } from '../types/schema'
import { ONE_BI, ZERO_BI, ZERO_BD, ONE_BD } from './constants'

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

export function getAmountETH(token: String, amount: BigInt): BigDecimal {
  let amountUSD: BigDecimal = ZERO_BD 
  return amountUSD
}

export function getAmountUSD(token: String, amount: BigInt): BigDecimal {
  let amountUSD: BigDecimal = ZERO_BD 
  return amountUSD
}

export function getXXXFund2VolumeETH(): BigDecimal {
  let volumeETH: BigDecimal = ZERO_BD 
  return volumeETH
}

export function getXXXFund2VolumeUSD(): BigDecimal {
  let volumeUSD: BigDecimal = ZERO_BD 
  return volumeUSD
}

export function getFundVolumeETH(fund: String): BigDecimal {
  let volumeETH: BigDecimal = ZERO_BD 
  return volumeETH
}

export function getFundVolumeUSD(fund: String): BigDecimal {
  let volumeUSD: BigDecimal = ZERO_BD 
  return volumeUSD
}

export function getManagerVolumeETH(manager: String): BigDecimal {
  let volumeETH: BigDecimal = ZERO_BD 
  return volumeETH
}

export function getManagerVolumeUSD(manager: String): BigDecimal {
  let volumeUSD: BigDecimal = ZERO_BD 
  return volumeUSD
}

export function getManagerFeeVolumeETH(manager: String): BigDecimal {
  let volumeETH: BigDecimal = ZERO_BD 
  return volumeETH
}

export function getManagerFeeVolumeUSD(manager: String): BigDecimal {
  let volumeUSD: BigDecimal = ZERO_BD 
  return volumeUSD
}

export function getInvestorVolumeETH(investor: String): BigDecimal {
  let volumeETH: BigDecimal = ZERO_BD 
  return volumeETH
}

export function getInvestorVolumeUSD(investor: String): BigDecimal {
  let volumeUSD: BigDecimal = ZERO_BD 
  return volumeUSD
}

export function getProfitETH(princial: BigDecimal, volume: BigDecimal): BigInt {
  let profitETH: BigInt = ZERO_BI 
  return profitETH
}

export function getProfitUSD(princial: BigDecimal, volume: BigDecimal): BigInt {
  let profitUSD: BigInt = ZERO_BI 
  return profitUSD
}
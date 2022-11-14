/* eslint-disable prefer-const */
import { BigInt, BigDecimal, Address, ethereum } from '@graphprotocol/graph-ts'
import { Transaction } from '../types/schema'
import { ONE_BI, ZERO_BI, ZERO_BD, ONE_BD, ADDRESS_ZERO } from './constants'
import {
  Fund,
  Investor,
} from "../types/schema"

export function getFundID(fund: Address) {
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

export function getInvestorTokens(_fund: Address, _investor: Address): string[] {
  let fund = Fund.load(getFundID(_fund))
  fund?.tokens

  let investor = Investor.load(getInvestorID(_fund, _investor))
  investor?.tokens

  return []
}

export function getFundTokens(fundAddress: string): string[] {
  return []
}

export function getTokenVolumeETH(tokens: string[]): BigDecimal[] {
  return [ZERO_BD]
}

export function getTokenVolumeUSD(tokensVolumeETH: BigDecimal[]): BigDecimal[] {
  return [ZERO_BD]
}
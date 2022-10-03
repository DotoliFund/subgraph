/* eslint-disable prefer-const */
import { BigInt, BigDecimal, ethereum } from '@graphprotocol/graph-ts'
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
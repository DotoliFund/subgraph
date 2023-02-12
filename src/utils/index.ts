/* eslint-disable prefer-const */
import { BigDecimal, BigInt, Address } from '@graphprotocol/graph-ts'
import { ZERO_BD } from './constants'
import { Fund, Investor } from '../types/schema'
import { getInvestorID } from './investor'

// return 0 if denominator is 0 in division
export function safeDiv(amount0: BigDecimal, amount1: BigDecimal): BigDecimal {
  if (amount1.equals(ZERO_BD)) {
    return ZERO_BD
  } else {
    return amount0.div(amount1)
  }
}

export function updateUpdatedAtTime(fundAddress: Address, investorAddress: Address, timestamp: BigInt): void {
  let investor = Investor.load(getInvestorID(fundAddress, investorAddress))
  if (!investor) return
  investor.updatedAtTimestamp = timestamp
  investor.save()

  let fund = Fund.load(fundAddress)
  if (!fund) return
  fund.updatedAtTimestamp = timestamp
  fund.save()
}
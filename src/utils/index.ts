/* eslint-disable prefer-const */
import { BigDecimal, BigInt, Address } from '@graphprotocol/graph-ts'
import { ZERO_BD, ZERO_BI, ONE_BI } from './constants'
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

export function updateUpdatedAtTime(fundId: BigInt, investorAddress: Address, timestamp: BigInt): void {
  let investor = Investor.load(getInvestorID(fundId, investorAddress))
  if (!investor) return
  investor.updatedAtTimestamp = timestamp
  investor.save()

  let fund = Fund.load(fundId.toString())
  if (!fund) return
  fund.updatedAtTimestamp = timestamp
  fund.save()
}

export function exponentToBigDecimal(decimals: BigInt): BigDecimal {
  let bd = BigDecimal.fromString('1')
  for (let i = ZERO_BI; i.lt(decimals as BigInt); i = i.plus(ONE_BI)) {
    bd = bd.times(BigDecimal.fromString('10'))
  }
  return bd
}
import { ZERO_BD, ZERO_BI, ONE_BI } from './constants'
/* eslint-disable prefer-const */
import {
  Factory,
  Fund,
  FundDaySnapshot,
  FundToken,
  Investor,
  InvestorDaySnapshot,
  InvestorToken,
  Reward,
  RewardDaySnapshot,
  RewardToken
} from '../types/schema'
import { FACTORY_ADDRESS } from './constants'
import { ethereum } from '@graphprotocol/graph-ts'

export function fundDaySnapshot(event: ethereum.Event): FundDaySnapshot {
  let timestamp = event.block.timestamp.toI32()
  let dayID = timestamp / 86400
  let dayStartTimestamp = dayID * 86400
  let dayFundID = event.address
    .toHexString()
    .concat('-')
    .concat(dayID.toString())
  let fund = Fund.load(event.address.toHexString())
  if (fund !== null) {
    let fundDaySnapshot = FundDaySnapshot.load(dayFundID)
    if (fundDaySnapshot === null) {
      fundDaySnapshot = new FundDaySnapshot(dayFundID)
      fundDaySnapshot.date = dayStartTimestamp
      fundDaySnapshot.fund = fund.id
      fundDaySnapshot.volumeUSD = ZERO_BD
    }
    //TODO FundToken
    fundDaySnapshot.volumeUSD
    fundDaySnapshot.save()
  }

  return fundDaySnapshot as FundDaySnapshot
}

export function investorDaySnapshot(event: ethereum.Event): InvestorDaySnapshot {
  let timestamp = event.block.timestamp.toI32()
  let dayID = timestamp / 86400
  let dayStartTimestamp = dayID * 86400
  let dayPoolID = event.address
    .toHexString()
    .concat('-')
    .concat(dayID.toString())
  let investor = Investor.load(event.address.toHexString())
  if (investor !== null) {
    let investorDaySnapshot = InvestorDaySnapshot.load(dayPoolID)
    if (investorDaySnapshot === null) {
      investorDaySnapshot = new InvestorDaySnapshot(dayPoolID)
      investorDaySnapshot.date = dayStartTimestamp
      investorDaySnapshot.investor = investor.id
      investorDaySnapshot.volumeUSD = ZERO_BD
    }
    //TODO InvestorToken
    investorDaySnapshot.volumeUSD
    investorDaySnapshot.save()
  }

  return investorDaySnapshot as InvestorDaySnapshot
}

export function rewardDaySnapshot(event: ethereum.Event): RewardDaySnapshot {
  let timestamp = event.block.timestamp.toI32()
  let dayID = timestamp / 86400
  let dayStartTimestamp = dayID * 86400
  let dayPoolID = event.address
    .toHexString()
    .concat('-')
    .concat(dayID.toString())
  let pool = Pool.load(event.address.toHexString())
  let poolDayData = PoolDayData.load(dayPoolID)
  if (poolDayData === null) {
    poolDayData = new PoolDayData(dayPoolID)
    poolDayData.date = dayStartTimestamp
    poolDayData.pool = pool.id
    // things that dont get initialized always
    poolDayData.volumeToken0 = ZERO_BD
    poolDayData.volumeToken1 = ZERO_BD
    poolDayData.volumeUSD = ZERO_BD
    poolDayData.feesUSD = ZERO_BD
    poolDayData.txCount = ZERO_BI
    poolDayData.feeGrowthGlobal0X128 = ZERO_BI
    poolDayData.feeGrowthGlobal1X128 = ZERO_BI
    poolDayData.open = pool.token0Price
    poolDayData.high = pool.token0Price
    poolDayData.low = pool.token0Price
    poolDayData.close = pool.token0Price
  }

  if (pool.token0Price.gt(poolDayData.high)) {
    poolDayData.high = pool.token0Price
  }
  if (pool.token0Price.lt(poolDayData.low)) {
    poolDayData.low = pool.token0Price
  }

  poolDayData.liquidity = pool.liquidity
  poolDayData.sqrtPrice = pool.sqrtPrice
  poolDayData.feeGrowthGlobal0X128 = pool.feeGrowthGlobal0X128
  poolDayData.feeGrowthGlobal1X128 = pool.feeGrowthGlobal1X128
  poolDayData.token0Price = pool.token0Price
  poolDayData.token1Price = pool.token1Price
  poolDayData.tick = pool.tick
  poolDayData.tvlUSD = pool.totalValueLockedUSD
  poolDayData.txCount = poolDayData.txCount.plus(ONE_BI)
  poolDayData.save()

  return rewardDaySnapshot as RewardDaySnapshot
}

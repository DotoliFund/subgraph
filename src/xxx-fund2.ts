import { BigInt } from "@graphprotocol/graph-ts"
import {
  Initialize,
  Deposit as DepositEvent,
  Withdraw as WithdrawEvent,
  Swap as SwapEvent,
  DepositReward as DepositRewardEvent,
  WithdrawReward as WithdrawRewardEvent,
  IncreaseInvestorToken,
  DecreaseInvestorToken,
} from './types/templates/XXXFund2/XXXFund2'
import { 
  Factory,
  Fund,
  Investor,
  FundToken,
  InvestorToken,
  RewardToken,
  Transaction,
  Deposit,
  Withdraw,
  Swap,
  DepositReward,
  WithdrawReward,
  FundDaySnapshot,
  InvestorDaySnapshot,
  RewardDaySnapshot
} from "./types/schema"
import { 
  FACTORY_ADDRESS,
  FACTORY_OWNER,
  SWAP_ROUTER_ADDRESS,
  WHITELIST_TOKENS,
  ZERO_BD,
  ZERO_BI,
  ONE_BI
} from './utils/constants'
import { 
  fundDaySnapshot,
  investorDaySnapshot,
  rewardDaySnapshot
} from './utils/snapshots'

export function handleInitialize(event: Initialize): void {
  let fund = Fund.load(event.address.toHexString())
  if (fund !== null) {
    fundDaySnapshot(event)
    fund.save()
  }
}

export function handleDeposit(event: DepositEvent): void {}
export function handleWithdraw(event: WithdrawEvent): void {}
export function handleSwap(event: SwapEvent): void {}
export function handleIncreaseInvestorToken(event: IncreaseInvestorToken): void {}
export function handleDecreaseInvestorToken(event: DecreaseInvestorToken): void {}
export function handleDepositReward(event: DepositReward): void {}
export function handleWithdrawReward(event: WithdrawReward): void {}
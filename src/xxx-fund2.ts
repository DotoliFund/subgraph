import { BigInt } from "@graphprotocol/graph-ts"
import {
  Initialize,
  Deposit as DepositEvent,
  Withdraw as WithdrawEvent,
  Swap as SwapEvent,
  IncreaseInvestorToken,
  DecreaseInvestorToken,
  IncreaseReward,
  DecreaseReward,
  WithdrawReward
} from './types/templates/XXXFund2/XXXFund2'
import { 
  Factory,
  Fund,
  Investor,
  FundToken,
  InvestorToken,
  RewardToken,
  Deposit,
  Withdraw,
  Swap,
  FundDaySnapshot,
  InvestorDaySnapshot,
  RewardDaySnapshot
} from "./types/schema"

export function handleInitialize(event: Initialize): void {

}

export function handleDeposit(event: DepositEvent): void {}
export function handleWithdraw(event: WithdrawEvent): void {}
export function handleSwap(event: SwapEvent): void {}
export function handleWithdrawReward(event: WithdrawReward): void {}
export function handleIncreaseInvestorToken(event: IncreaseInvestorToken): void {}
export function handleDecreaseInvestorToken(event: DecreaseInvestorToken): void {}
export function handleIncreaseReward(event: IncreaseReward): void {}
export function handleDecreaseReward(event: DecreaseReward): void {}
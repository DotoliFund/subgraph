import { BigInt } from "@graphprotocol/graph-ts"
import {
  XXXFund2,
  Initialize,
  Deposit as DepositEvent,
  Withdraw as WithdrawEvent,
  Swap as SwapEvent
} from './types/templates/XXXFund2/XXXFund2'
import { ExampleEntity } from "./types/schema"

export function handleInitialize(event: Initialize): void {

}

export function handleDeposit(event: DepositEvent): void {}
export function handleWithdraw(event: WithdrawEvent): void {}
export function handleSwap(event: SwapEvent): void {}
export function handleFundCreated(event: FundCreated): void {}
export function handleFundCreated(event: FundCreated): void {}
import { BigInt, Address, BigDecimal } from "@graphprotocol/graph-ts"
import {
  ManagerFeeOut as ManagerFeeOutEvent,
  Deposit as DepositEvent,
  Withdraw as WithdrawEvent,
  Swap as SwapEvent,
} from './types/templates/XXXFund2/XXXFund2'
import {
  Factory,
  Fund,
  Investor,
  ManagerFeeOut,
  Deposit,
  Withdraw,
  Swap,
} from "./types/schema"
import { 
  WETH_DECIMAL,
  USDC_DECIMAL,
  FACTORY_ADDRESS,
  ZERO_BD,
  ZERO_BI,
  factoryContract,
  ADDRESS_ZERO
} from './utils/constants'
import { 
  fundSnapshot,
  investorSnapshot,
  xxxfund2Snapshot,
} from './utils/snapshots'
import { 
  loadTransaction,
  getProfitETH,
  getProfitUSD,
  getProfitRatioETH,
  getProfitRatioUSD
} from './utils'
import { XXXFund2 as XXXFund2Contract } from './types/templates/XXXFund2/XXXFund2'


// export function handleManagerFeeOut(event: ManagerFeeOutEvent): void {
//   let factory = Factory.load(FACTORY_ADDRESS)
//   if (!factory) return
//   let fund = Fund.load(event.params.fund.toHexString())
//   if (!fund)  return

//   const xxxfund2Contract = XXXFund2Contract.bind(event.params.fund)
//   const ethPriceInUSD = new BigDecimal(xxxfund2Contract.getETHPriceInUSD()).div(USDC_DECIMAL)
//   let transaction = loadTransaction(event)

//   factory.totalVolumeETH = factory.totalVolumeETH.minus(fund.volumeETH)
//   fund.volumeETH = fund.volumeETH.minus(fund.feeVolumeETH)

//   let managerFeeOut = new ManagerFeeOut(event.transaction.hash.toHexString())
//   managerFeeOut.transaction = transaction.id
//   managerFeeOut.timestamp = transaction.timestamp
//   managerFeeOut.fund = event.params.fund
//   managerFeeOut.manager = event.params.manager
//   managerFeeOut.token = event.params.token
//   managerFeeOut.amount = event.params.amount
//   managerFeeOut.amountETH = new BigDecimal(event.params.amountETH).div(WETH_DECIMAL)
//   managerFeeOut.amountUSD = managerFeeOut.amountETH.times(ethPriceInUSD)
//   managerFeeOut.origin = event.transaction.from
//   managerFeeOut.logIndex = event.logIndex

//   fund.feeVolumeETH = new BigDecimal(xxxfund2Contract.getManagerFeeTotalValueLockedETH()).div(WETH_DECIMAL)
//   fund.feeVolumeUSD = fund.feeVolumeETH.times(ethPriceInUSD)
//   fund.volumeETH = fund.volumeETH.plus(fund.feeVolumeETH)
//   fund.volumeUSD = fund.volumeETH.times(ethPriceInUSD)
//   factory.totalVolumeETH = factory.totalVolumeETH.plus(fund.volumeETH)
//   factory.totalVolumeUSD = factory.totalVolumeETH.times(ethPriceInUSD)

//   managerFeeOut.save()
//   fund.save()
//   factory.save()
//   fundSnapshot(event.params.fund, event.params.manager, event)
//   xxxfund2Snapshot(event)
// }

export function handleDeposit(event: DepositEvent): void {
  let factory = Factory.load(FACTORY_ADDRESS)
  if (!factory) return
  let fund = Fund.load(event.params.fund.toHexString())
  if (!fund) return

  const xxxfund2Contract = XXXFund2Contract.bind(event.params.fund)
  const ethPriceInUSD = xxxfund2Contract.getETHPriceInUSD()
  let transaction = loadTransaction(event)
  let deposit = new Deposit(event.transaction.hash.toHexString())
  deposit.transaction = transaction.id
  deposit.timestamp = transaction.timestamp
  deposit.fund = event.params.fund
  deposit.investor = event.params.investor
  deposit.token = event.params.token
  deposit.amount = event.params.amount
  const depositETH = event.params.amountETH
  deposit.amountETH = depositETH
  deposit.amountUSD = deposit.amountETH.times(ethPriceInUSD)
  deposit.origin = event.transaction.from
  deposit.logIndex = event.logIndex

  const investorID = 
    event.params.fund.toHexString().toUpperCase() 
    + '-' 
    + event.params.investor.toHexString().toUpperCase()

  let investor = Investor.load(investorID)
  if (investor !== null) {
    factory.totalVolumeETH = factory.totalVolumeETH.minus(fund.volumeETH)
    fund.volumeETH = fund.volumeETH.minus(investor.volumeETH)
    fund.volumeETH = fund.volumeETH.minus(fund.feeVolumeETH)

    investor.principalETH = investor.principalETH.minus(depositETH)
    investor.principalUSD = investor.principalUSD.minus(ethPriceInUSD)
    investor.volumeETH = xxxfund2Contract.getInvestorTotalValueLockedETH(event.params.investor)
    investor.volumeUSD = investor.volumeETH.times(ethPriceInUSD)
    investor.profitETH = getProfitETH(investor.principalETH, investor.volumeETH)
    investor.profitUSD = getProfitUSD(investor.principalUSD, investor.volumeUSD)
    investor.profitRatioETH = getProfitRatioETH(investor.principalETH, investor.volumeETH)
    investor.profitRatioUSD = getProfitRatioUSD(investor.principalUSD, investor.volumeUSD)

    fund.feeVolumeETH = xxxfund2Contract.getManagerFeeTotalValueLockedETH()
    fund.feeVolumeUSD = fund.feeVolumeETH.times(ethPriceInUSD)
    fund.volumeETH = fund.volumeETH.plus(investor.volumeETH)
    fund.volumeETH = fund.volumeETH.plus(fund.feeVolumeETH)
    fund.volumeUSD = fund.volumeETH.times(ethPriceInUSD)
    factory.totalVolumeETH = factory.totalVolumeETH.plus(fund.volumeETH)
    factory.totalVolumeUSD = factory.totalVolumeETH.times(ethPriceInUSD)

    deposit.save()
    investor.save()
    fund.save()
    factory.save()
    investorSnapshot(event.params.fund, event.params.manager, event.params.investor, event)
    fundSnapshot(event.params.fund, event.params.manager, event)
    xxxfund2Snapshot(event)
  }
}

// export function handleWithdraw(event: WithdrawEvent): void {
//   let factory = Factory.load(FACTORY_ADDRESS)
//   if (!factory) return
//   let fund = Fund.load(event.params.fund.toHexString())
//   if (!fund) return

//   const xxxfund2Contract = XXXFund2Contract.bind(event.params.fund)
//   const ethPriceInUSD = new BigDecimal(xxxfund2Contract.getETHPriceInUSD()).div(USDC_DECIMAL)
//   let transaction = loadTransaction(event)
//   let withdraw = new Withdraw(event.transaction.hash.toHexString())
//   withdraw.transaction = transaction.id
//   withdraw.timestamp = transaction.timestamp
//   withdraw.fund = event.params.fund
//   withdraw.investor = event.params.investor
//   withdraw.token = event.params.token
//   withdraw.amount = event.params.amount
//   const withdrawETH = new BigDecimal(event.params.amountETH).div(WETH_DECIMAL)
//   withdraw.amountETH = withdrawETH
//   withdraw.amountUSD = withdraw.amountETH.times(ethPriceInUSD)
//   withdraw.origin = event.transaction.from
//   withdraw.logIndex = event.logIndex

//   const investorID = 
//     event.params.fund.toHexString().toUpperCase() 
//     + '-' 
//     + event.params.investor.toHexString().toUpperCase()

//   let investor = Investor.load(investorID)
//   if (investor !== null) {
//     factory.totalVolumeETH = factory.totalVolumeETH.minus(fund.volumeETH)
//     fund.volumeETH = fund.volumeETH.minus(investor.volumeETH)
//     fund.volumeETH = fund.volumeETH.minus(fund.feeVolumeETH)

//     investor.volumeETH = new BigDecimal(xxxfund2Contract.getInvestorTotalValueLockedETH(event.params.investor)).div(WETH_DECIMAL)
//     investor.volumeUSD = investor.volumeETH.times(ethPriceInUSD)
//     investor.principalETH = investor.principalETH
//     investor.principalUSD = investor.principalUSD
//     investor.profitETH = getProfitETH(investor.principalETH, investor.volumeETH)
//     investor.profitUSD = getProfitUSD(investor.principalUSD, investor.volumeUSD)
//     investor.profitRatioETH = getProfitRatioETH(investor.principalETH, investor.volumeETH)
//     investor.profitRatioUSD = getProfitRatioUSD(investor.principalUSD, investor.volumeUSD)

//     fund.feeVolumeETH = new BigDecimal(xxxfund2Contract.getManagerFeeTotalValueLockedETH()).div(WETH_DECIMAL)
//     fund.feeVolumeUSD = fund.feeVolumeETH.times(ethPriceInUSD)
//     fund.volumeETH = fund.volumeETH.plus(investor.volumeETH)
//     fund.volumeETH = fund.volumeETH.plus(fund.feeVolumeETH)
//     fund.volumeUSD = fund.volumeETH.times(ethPriceInUSD)
//     factory.totalVolumeETH = factory.totalVolumeETH.plus(fund.volumeETH)
//     factory.totalVolumeUSD = factory.totalVolumeETH.times(ethPriceInUSD)

//     withdraw.save()
//     investor.save()
//     fund.save()
//     factory.save()
//     investorSnapshot(event.params.fund, event.params.manager, event.params.investor, event)
//     fundSnapshot(event.params.fund, event.params.manager, event)
//     xxxfund2Snapshot(event)
//   }
// }

// export function handleSwap(event: SwapEvent): void {
//   let factory = Factory.load(FACTORY_ADDRESS)
//   if (!factory) return
//   let fund = Fund.load(event.params.fund.toHexString())
//   if (!fund) return
//   const xxxfund2Contract = XXXFund2Contract.bind(event.params.fund)
//   const ethPriceInUSD = new BigDecimal(xxxfund2Contract.getETHPriceInUSD()).div(USDC_DECIMAL)
//   const tokenIn = event.params.tokenIn.toHexString()
//   const tokenOut = event.params.tokenOut.toHexString()
//   const amountIn = event.params.amountIn
//   const amountOut = event.params.amountOut

//   let transaction = loadTransaction(event)
//   let swap = new Swap(event.transaction.hash.toHexString())
//   swap.transaction = transaction.id
//   swap.timestamp = transaction.timestamp
//   swap.fund =  event.params.fund
//   swap.manager = event.params.manager
//   swap.investor = event.params.investor
//   swap.token0 = tokenIn
//   swap.token1 = tokenOut
//   swap.amount0 = amountIn
//   swap.amount1 = amountOut
//   swap.amountETH = new BigDecimal(event.params.amountETH).div(WETH_DECIMAL)
//   swap.amountUSD = swap.amountETH.times(ethPriceInUSD)
//   swap.origin = event.transaction.from
//   swap.logIndex = event.logIndex
  
//   //investor account swap
//   const investorID = 
//     event.params.fund.toHexString().toUpperCase() 
//     + '-' 
//     + event.params.investor.toHexString().toUpperCase()

//   let investor = Investor.load(investorID)
//   if (investor !== null) {
//     factory.totalVolumeETH = factory.totalVolumeETH.minus(fund.volumeETH)
//     fund.volumeETH = fund.volumeETH.minus(investor.volumeETH)
//     fund.volumeETH = fund.volumeETH.minus(fund.feeVolumeETH)

//     investor.volumeETH = new BigDecimal(xxxfund2Contract.getInvestorTotalValueLockedETH(event.params.investor)).div(WETH_DECIMAL)
//     investor.volumeUSD = investor.volumeETH.times(ethPriceInUSD)
//     investor.profitETH = getProfitETH(investor.principalETH, investor.volumeETH)
//     investor.profitUSD = getProfitUSD(investor.principalUSD, investor.volumeUSD)
//     investor.profitRatioETH = getProfitRatioETH(investor.principalETH, investor.volumeETH)
//     investor.profitRatioUSD = getProfitRatioUSD(investor.principalUSD, investor.volumeUSD)

//     fund.feeVolumeETH = new BigDecimal(xxxfund2Contract.getManagerFeeTotalValueLockedETH()).div(WETH_DECIMAL)
//     fund.feeVolumeUSD = fund.feeVolumeETH.times(ethPriceInUSD)
//     fund.volumeETH = fund.volumeETH.plus(investor.volumeETH)
//     fund.volumeETH = fund.volumeETH.plus(fund.feeVolumeETH)
//     fund.volumeUSD = fund.volumeETH.times(ethPriceInUSD)
//     factory.totalVolumeETH = factory.totalVolumeETH.plus(fund.volumeETH)
//     factory.totalVolumeUSD = factory.totalVolumeETH.times(ethPriceInUSD)

//     swap.save()
//     investor.save()
//     fund.save()
//     factory.save()
//     investorSnapshot(event.params.fund, event.params.manager, event.params.investor, event)
//     fundSnapshot(event.params.fund, event.params.manager, event)
//     xxxfund2Snapshot(event)
//   }
// }
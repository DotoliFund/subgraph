import { BigInt, Address } from "@graphprotocol/graph-ts"
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
  FACTORY_ADDRESS,
  ZERO_BD,
  ZERO_BI,
  factoryContract,
  ADDRESS_ZERO
} from './utils/constants'
import { 
  fundSnapshot,
  investorSnapshot,
} from './utils/snapshots'
import { 
  loadTransaction,
  getProfitETH,
  getProfitUSD,
  getProfitRatioETH,
  getProfitRatioUSD
} from './utils'
import { XXXFund2 as XXXFund2Contract } from './types/templates/XXXFund2/XXXFund2'


export function handleManagerFeeOut(event: ManagerFeeOutEvent): void {
  let fund = Fund.load(event.params.fund.toHexString())
  if (fund !== null) {
    const xxxfund2Contract = XXXFund2Contract.bind(event.params.fund)
    let transaction = loadTransaction(event)
    let managerFeeOut = new ManagerFeeOut(event.transaction.hash.toHexString())
    managerFeeOut.transaction = transaction.id
    managerFeeOut.timestamp = transaction.timestamp
    managerFeeOut.fund = event.params.fund
    managerFeeOut.manager = event.params.manager
    managerFeeOut.token = event.params.token
    managerFeeOut.amount = event.params.amount
    managerFeeOut.amountETH = event.params.amountETH
    managerFeeOut.ethPriceUSD = event.params.ethPriceUSD
    managerFeeOut.origin = event.transaction.from
    managerFeeOut.logIndex = event.logIndex

    fund.volumeETH = xxxfund2Contract.getFundVolumeETH()
    fund.volumeUSD = xxxfund2Contract.getFundVolumeUSD()

    managerFeeOut.save()
    fund.save()
    fundSnapshot(event.params.fund, event.params.manager, event)
  }
}

export function handleDeposit(event: DepositEvent): void {
  let fund = Fund.load(event.params.fund.toHexString())
  if (fund !== null) {
    const xxxfund2Contract = XXXFund2Contract.bind(event.params.fund)
    let transaction = loadTransaction(event)
    let deposit = new Deposit(event.transaction.hash.toHexString())
    deposit.transaction = transaction.id
    deposit.timestamp = transaction.timestamp
    deposit.fund = event.params.fund
    deposit.investor = event.params.investor
    deposit.token = event.params.token
    deposit.amount = event.params.amount
    const depositETH = event.params.amountETH
    const ethPriceUSD = event.params.ethPriceUSD
    deposit.amountETH = depositETH
    deposit.ethPriceUSD = ethPriceUSD
    deposit.origin = event.transaction.from
    deposit.logIndex = event.logIndex

    const investorID = 
      event.params.fund.toHexString().toUpperCase() 
      + '-' 
      + event.params.investor.toHexString().toUpperCase()
    let investor = Investor.load(investorID)
    if (investor !== null) {
      investor.principalETH = investor.principalETH.minus(depositETH)
      investor.principalUSD = investor.principalUSD.minus(ethPriceUSD)
      investor.volumeETH = xxxfund2Contract.getInvestorVolumeETH(event.params.investor)
      investor.volumeUSD = xxxfund2Contract.getInvestorVolumeUSD(event.params.investor)
      investor.profitETH = getProfitETH(investor.principalETH, investor.volumeETH)
      investor.profitUSD = getProfitUSD(investor.principalUSD, investor.volumeUSD)
      investor.profitRatioETH = getProfitRatioETH(investor.principalETH, investor.volumeETH)
      investor.profitRatioUSD = getProfitRatioUSD(investor.principalUSD, investor.volumeUSD)

      fund.volumeETH = xxxfund2Contract.getFundVolumeETH()
      fund.volumeUSD = xxxfund2Contract.getFundVolumeUSD()

      deposit.save()
      investor.save()
      fund.save()
      investorSnapshot(event.params.fund, event.params.manager, event.params.investor, event)
      fundSnapshot(event.params.fund, event.params.manager, event)
    }
  }
}

export function handleWithdraw(event: WithdrawEvent): void {
  let fund = Fund.load(event.params.fund.toHexString())
  if (fund !== null) {
    const xxxfund2Contract = XXXFund2Contract.bind(event.params.fund)
    let transaction = loadTransaction(event)
    let withdraw = new Withdraw(event.transaction.hash.toHexString())
    withdraw.transaction = transaction.id
    withdraw.timestamp = transaction.timestamp
    withdraw.fund = event.params.fund
    withdraw.investor = event.params.investor
    withdraw.token = event.params.token
    withdraw.amount = event.params.amount
    const withdrawETH = event.params.amountETH
    const ethPriceUSD = event.params.ethPriceUSD
    withdraw.amountETH = withdrawETH
    withdraw.ethPriceUSD = ethPriceUSD
    withdraw.origin = event.transaction.from
    withdraw.logIndex = event.logIndex

    const investorID = 
      event.params.fund.toHexString().toUpperCase() 
      + '-' 
      + event.params.investor.toHexString().toUpperCase()
    let investor = Investor.load(investorID)
    if (investor !== null) {
      // investor.volumeETH = xxxfund2Contract.getInvestorVolumeETH(event.params.investor)
      // investor.volumeUSD = xxxfund2Contract.getInvestorVolumeUSD(event.params.investor)
      // const prevVolumeETH = investor.volumeETH.plus(withdrawETH)
      // const prevVolumeUSD = investor.volumeUSD.plus(withdrawUSD)
      // const investorPrincipalETHToMinus = investor.principalETH.div(investor.principalETH.plus(prevVolumeETH)).times(withdrawETH)
      // const investorPrincipalUSDToMinus = investor.principalUSD.div(investor.principalUSD.plus(prevVolumeUSD)).times(withdrawUSD)
      // investor.principalETH = investor.principalETH.minus(investorPrincipalETHToMinus)
      // investor.principalUSD = investor.principalUSD.minus(investorPrincipalUSDToMinus)
      // investor.profitETH = getProfitETH(investor.principalETH, investor.volumeETH)
      // investor.profitUSD = getProfitUSD(investor.principalUSD, investor.volumeUSD)
      // investor.profitRatioETH = getProfitRatioETH(investor.principalETH, investor.volumeETH)
      // investor.profitRatioUSD = getProfitRatioUSD(investor.principalUSD, investor.volumeUSD)

      investor.volumeETH = xxxfund2Contract.getInvestorVolumeETH(event.params.investor)
      investor.volumeUSD = xxxfund2Contract.getInvestorVolumeUSD(event.params.investor)
      investor.principalETH = investor.principalETH
      investor.principalUSD = investor.principalUSD
      investor.profitETH = getProfitETH(investor.principalETH, investor.volumeETH)
      investor.profitUSD = getProfitUSD(investor.principalUSD, investor.volumeUSD)
      investor.profitRatioETH = getProfitRatioETH(investor.principalETH, investor.volumeETH)
      investor.profitRatioUSD = getProfitRatioUSD(investor.principalUSD, investor.volumeUSD)

      fund.volumeETH = xxxfund2Contract.getFundVolumeETH()
      fund.volumeUSD = xxxfund2Contract.getFundVolumeUSD()

      withdraw.save()
      investor.save()
      fund.save()

      investorSnapshot(event.params.fund, event.params.manager, event.params.investor, event)
      fundSnapshot(event.params.fund, event.params.manager, event)
    }
  }
}

export function handleSwap(event: SwapEvent): void {
  let fund = Fund.load(event.params.fund.toHexString())
  if (fund !== null) {
    const xxxfund2Contract = XXXFund2Contract.bind(event.params.fund)
    const tokenIn = event.params.tokenIn.toHexString()
    const tokenOut = event.params.tokenOut.toHexString()
    const amountIn = event.params.amountIn
    const amountOut = event.params.amountOut

    let transaction = loadTransaction(event)
    let swap = new Swap(event.transaction.hash.toHexString())
    swap.transaction = transaction.id
    swap.timestamp = transaction.timestamp
    swap.fund =  event.params.fund
    swap.manager = event.params.manager
    swap.investor = event.params.investor
    swap.token0 = tokenIn
    swap.token1 = tokenOut
    swap.amount0 = amountIn
    swap.amount1 = amountOut
    swap.amountETH = event.params.amountETH
    swap.ethPriceUSD = event.params.ethPriceUSD
    swap.origin = event.transaction.from
    swap.logIndex = event.logIndex
    
    //investor account swap
    const investorID = 
      event.params.fund.toHexString().toUpperCase() 
      + '-' 
      + event.params.investor.toHexString().toUpperCase()
    let investor = Investor.load(investorID)
    if (investor !== null) {
      investor.volumeETH = xxxfund2Contract.getInvestorVolumeETH(event.params.investor)
      investor.volumeUSD = xxxfund2Contract.getInvestorVolumeUSD(event.params.investor)
      investor.profitETH = getProfitETH(investor.principalETH, investor.volumeETH)
      investor.profitUSD = getProfitUSD(investor.principalUSD, investor.volumeUSD)
      investor.profitRatioETH = getProfitRatioETH(investor.principalETH, investor.volumeETH)
      investor.profitRatioUSD = getProfitRatioUSD(investor.principalUSD, investor.volumeUSD)

      fund.volumeETH = xxxfund2Contract.getFundVolumeETH()
      fund.volumeUSD = xxxfund2Contract.getFundVolumeUSD()
      
      swap.save()
      investor.save()
      fund.save()
    
      investorSnapshot(event.params.fund, event.params.manager, event.params.investor, event)
      fundSnapshot(event.params.fund, event.params.manager, event)
    }
  }
}
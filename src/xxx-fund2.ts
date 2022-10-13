import { BigInt, Address } from "@graphprotocol/graph-ts"
import {
  Initialize as InitializeEvent,
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
  Initialize,
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


export function handleInitialize(event: InitializeEvent): void {
  let fund = Fund.load(event.params.fund.toHexString())
  if (fund !== null) {
    let transaction = loadTransaction(event)
    let initialize = new Initialize(event.address.toHexString())
    initialize.transaction = transaction.id
    initialize.timestamp = transaction.timestamp
    initialize.manager = event.params.manager
    initialize.origin = event.transaction.from
    initialize.logIndex = event.logIndex

    initialize.save()
    fundSnapshot(event.params.fund, event.params.manager, event)
  }
}

export function handleManagerFeeOut(event: ManagerFeeOutEvent): void {
  let fund = Fund.load(event.params.fund.toHexString())
  if (fund !== null) {
    const xxxfund2Contract = XXXFund2Contract.bind(event.params.fund)
    let transaction = loadTransaction(event)
    let managerFeeOut = new ManagerFeeOut(event.address.toHexString())
    managerFeeOut.transaction = transaction.id
    managerFeeOut.timestamp = transaction.timestamp
    managerFeeOut.fund = event.params.fund
    managerFeeOut.manager = event.params.manager
    managerFeeOut.token = event.params.token
    managerFeeOut.amount = event.params.amount
    managerFeeOut.amountETH = event.params.amountETH
    managerFeeOut.amountUSD = event.params.amountUSD
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
    let investorDeposit = new Deposit(event.address.toHexString())
    investorDeposit.transaction = transaction.id
    investorDeposit.timestamp = transaction.timestamp
    investorDeposit.fund = event.params.fund
    investorDeposit.investor = event.params.investor
    investorDeposit.token = event.params.token
    investorDeposit.amount = event.params.amount
    const depositETH = event.params.amountETH
    const depositUSD = event.params.amountUSD
    investorDeposit.amountETH = event.params.amountETH
    investorDeposit.amountUSD = event.params.amountUSD
    investorDeposit.origin = event.transaction.from
    investorDeposit.logIndex = event.logIndex

    let investor = Investor.load(event.params.investor.toHexString())
    if (investor !== null) {
      investor.principalETH = investor.principalETH.minus(depositETH)
      investor.principalUSD = investor.principalUSD.minus(depositUSD)
      investor.volumeETH = xxxfund2Contract.getInvestorVolumeETH(event.address)
      investor.volumeUSD = xxxfund2Contract.getInvestorVolumeUSD(event.address)
      investor.profitETH = getProfitETH(investor.principalETH, investor.volumeETH)
      investor.profitUSD = getProfitUSD(investor.principalUSD, investor.volumeUSD)
      investor.profitRatioETH = getProfitRatioETH(investor.principalETH, investor.volumeETH)
      investor.profitRatioUSD = getProfitRatioUSD(investor.principalUSD, investor.volumeUSD)

      fund.volumeETH = xxxfund2Contract.getFundVolumeETH()
      fund.volumeUSD = xxxfund2Contract.getFundVolumeUSD()

      investorDeposit.save()
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
    let investorWithdraw = new Withdraw(event.address.toHexString())
    investorWithdraw.transaction = transaction.id
    investorWithdraw.timestamp = transaction.timestamp
    investorWithdraw.fund = event.params.fund
    investorWithdraw.investor = event.params.investor
    investorWithdraw.token = event.params.token
    investorWithdraw.amount = event.params.amount
    const withdrawETH = event.params.amountETH
    const withdrawUSD = event.params.amountUSD
    investorWithdraw.amountETH = withdrawETH
    investorWithdraw.amountUSD = withdrawUSD
    investorWithdraw.origin = event.transaction.from
    investorWithdraw.logIndex = event.logIndex

    let investor = Investor.load(event.params.investor.toHexString())
    if (investor !== null) {
      investor.volumeETH = xxxfund2Contract.getInvestorVolumeETH(event.address)
      investor.volumeUSD = xxxfund2Contract.getInvestorVolumeUSD(event.address)
      const prevVolumeETH = investor.volumeETH.plus(withdrawETH)
      const prevVolumeUSD = investor.volumeUSD.plus(withdrawUSD)
      const investorPrincipalETHToMinus = investor.principalETH.div(investor.principalETH.plus(prevVolumeETH)).times(withdrawETH)
      const investorPrincipalUSDToMinus = investor.principalUSD.div(investor.principalUSD.plus(prevVolumeUSD)).times(withdrawUSD)
      investor.principalETH = investor.principalETH.minus(investorPrincipalETHToMinus)
      investor.principalUSD = investor.principalUSD.minus(investorPrincipalUSDToMinus)
      investor.profitETH = getProfitETH(investor.principalETH, investor.volumeETH)
      investor.profitUSD = getProfitUSD(investor.principalUSD, investor.volumeUSD)
      investor.profitRatioETH = getProfitRatioETH(investor.principalETH, investor.volumeETH)
      investor.profitRatioUSD = getProfitRatioUSD(investor.principalUSD, investor.volumeUSD)

      fund.volumeETH = xxxfund2Contract.getFundVolumeETH()
      fund.volumeUSD = xxxfund2Contract.getFundVolumeUSD()

      investorWithdraw.save()
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
    let swap = new Swap(event.address.toHexString())
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
    swap.amountUSD = event.params.amountUSD
    swap.origin = event.transaction.from
    swap.logIndex = event.logIndex
    
    //investor account swap
    let investor = Investor.load(event.params.investor.toHexString())
    if (investor !== null) {
      investor.volumeETH = xxxfund2Contract.getInvestorVolumeETH(event.address)
      investor.volumeUSD = xxxfund2Contract.getInvestorVolumeUSD(event.address)
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
import { BigInt } from "@graphprotocol/graph-ts"
import {
  Initialize as InitializeEvent,
  ManagerDeposit as ManagerDepositEvent,
  ManagerWithdraw as ManagerWithdrawEvent,
  ManagerFeeOut as ManagerFeeOutEvent,
  InvestorDeposit as InvestorDepositEvent,
  InvestorWithdraw as InvestorWithdrawEvent,
  Swap as SwapEvent,
} from './types/templates/XXXFund2/XXXFund2'
import {
  Factory,
  Fund,
  Manager,
  Investor,
  ManagerDeposit,
  ManagerWithdraw,
  ManagerFeeOut,
  InvestorDeposit,
  InvestorWithdraw,
  Swap,
  Initialize,
} from "./types/schema"
import { 
  FACTORY_ADDRESS,
  ZERO_BD,
  ZERO_BI,
  factoryContract,
} from './utils/constants'
import { 
  fundSnapshot,
  managerSnapshot,
  investorSnapshot,
} from './utils/snapshots'
import { 
  loadTransaction,
  getProfitETH,
  getProfitUSD,
} from './utils'
import { XXXFund2 as XXXFund2Contract } from './types/templates/XXXFund2/XXXFund2'


export function handleInitialize(event: InitializeEvent): void {
  let fund = Fund.load(event.address.toHexString())
  if (fund !== null) {
    let transaction = loadTransaction(event)
    let initialize = new Initialize(event.address.toHexString())
    initialize.transaction = transaction.id
    initialize.timestamp = transaction.timestamp
    initialize.manager = event.params.manager
    initialize.origin = event.transaction.from
    initialize.logIndex = event.logIndex

    let manager = Manager.load(event.params.manager.toHexString())
    if (manager === null) {
      manager = new Manager(event.params.manager.toHexString())
      manager.createdAtTimestamp = event.block.timestamp
      manager.createdAtBlockNumber = event.block.number
      manager.fund = event.address
      manager.principalETH = ZERO_BI
      manager.principalUSD = ZERO_BI
      manager.volumeETH = ZERO_BI
      manager.volumeUSD = ZERO_BI
      manager.profitETH = ZERO_BI
      manager.profitUSD = ZERO_BI
    }

    initialize.save()
    manager.save()
    managerSnapshot(event)
    fundSnapshot(event)
  }
}

export function handleManagerDeposit(event: ManagerDepositEvent): void {
  let fund = Fund.load(event.address.toHexString())
  if (fund !== null) {
    const xxxfund2Contract = XXXFund2Contract.bind(event.address)
    let transaction = loadTransaction(event)
    let managerDeposit = new ManagerDeposit(event.address.toHexString())
    managerDeposit.transaction = transaction.id
    managerDeposit.timestamp = transaction.timestamp
    managerDeposit.fund = event.transaction.from.toHexString()
    managerDeposit.manager = event.params.manager
    managerDeposit.token = event.params.token
    managerDeposit.amount = event.params.amount
    const depositETH = event.params.amountETH
    const depositUSD = event.params.amountUSD
    managerDeposit.amountETH = depositETH
    managerDeposit.amountUSD = depositUSD
    managerDeposit.logIndex = event.logIndex

    let manager = Manager.load(event.params.manager.toHexString())
    if (manager !== null) {
      manager.principalETH = manager.principalETH.plus(depositETH)
      manager.principalUSD = manager.principalUSD.plus(depositUSD)
      manager.volumeETH = xxxfund2Contract.getManagerVolumeETH()
      manager.volumeUSD = xxxfund2Contract.getManagerVolumeUSD()
      manager.profitETH = getProfitETH(manager.principalETH, manager.volumeETH)
      manager.profitUSD = getProfitUSD(manager.principalUSD, manager.volumeUSD)

      fund.volumeETH = xxxfund2Contract.getFundVolumeETH()
      fund.volumeUSD = xxxfund2Contract.getFundVolumeUSD()

      managerDeposit.save()
      manager.save()
      fund.save()

      managerSnapshot(event)
      fundSnapshot(event)
    }
  }
}

export function handleManagerWithdraw(event: ManagerWithdrawEvent): void {
  let fund = Fund.load(event.address.toHexString())
  if (fund !== null) {
    const xxxfund2Contract = XXXFund2Contract.bind(event.address)
    let transaction = loadTransaction(event)
    let managerWithdraw = new ManagerWithdraw(event.address.toHexString())
    managerWithdraw.transaction = transaction.id
    managerWithdraw.timestamp = transaction.timestamp
    managerWithdraw.fund = event.transaction.from.toHexString()
    managerWithdraw.manager = event.params.manager
    managerWithdraw.token = event.params.token
    managerWithdraw.amount = event.params.amount
    const withdrawETH = event.params.amountETH
    const withdrawUSD = event.params.amountUSD
    managerWithdraw.amountETH = event.params.amountETH
    managerWithdraw.amountUSD = event.params.amountUSD
    managerWithdraw.logIndex = event.logIndex

    let manager = Manager.load(event.params.manager.toHexString())
    if (manager !== null) {
      manager.volumeETH = xxxfund2Contract.getManagerVolumeETH()
      manager.volumeUSD = xxxfund2Contract.getManagerVolumeUSD()
      const prevVolumeETH = manager.volumeETH.plus(withdrawETH)
      const prevVolumeUSD = manager.volumeUSD.plus(withdrawUSD)
      const managerPrincipalETHToMinus = manager.principalETH.div(manager.principalETH.plus(prevVolumeETH)).times(withdrawETH)
      const managerPrincipalUSDToMinus = manager.principalUSD.div(manager.principalUSD.plus(prevVolumeUSD)).times(withdrawUSD)
      manager.principalETH = manager.principalETH.minus(managerPrincipalETHToMinus)
      manager.principalUSD = manager.principalUSD.minus(managerPrincipalUSDToMinus)
      manager.profitETH = getProfitETH(manager.principalETH, manager.volumeETH)
      manager.profitUSD = getProfitUSD(manager.principalUSD, manager.volumeUSD)

      fund.volumeETH = xxxfund2Contract.getFundVolumeETH()
      fund.volumeUSD = xxxfund2Contract.getFundVolumeUSD()

      managerWithdraw.save()
      manager.save()
      fund.save()

      managerSnapshot(event)
      fundSnapshot(event)
    }
  }
}

export function handleManagerFeeOut(event: ManagerFeeOutEvent): void {
  let fund = Fund.load(event.address.toHexString())
  if (fund !== null) {
    const xxxfund2Contract = XXXFund2Contract.bind(event.address)
    let transaction = loadTransaction(event)
    let managerFeeOut = new ManagerFeeOut(event.address.toHexString())
    managerFeeOut.transaction = transaction.id
    managerFeeOut.timestamp = transaction.timestamp
    managerFeeOut.fund = event.transaction.from.toHexString()
    managerFeeOut.manager = event.params.manager
    managerFeeOut.token = event.params.token
    managerFeeOut.amount = event.params.amount
    managerFeeOut.amountETH = event.params.amountETH
    managerFeeOut.amountUSD = event.params.amountUSD
    managerFeeOut.logIndex = event.logIndex

    let manager = Manager.load(event.params.manager.toHexString())
    if (manager !== null) {
      manager.volumeETH = xxxfund2Contract.getManagerVolumeETH()
      manager.volumeUSD = xxxfund2Contract.getManagerVolumeUSD()
      manager.profitETH = getProfitETH(manager.principalETH, manager.volumeETH)
      manager.profitUSD = getProfitUSD(manager.principalUSD, manager.volumeUSD)
      manager.feeVolumeETH = xxxfund2Contract.getManagerFeeVolumeETH()
      manager.feeVolumeUSD = xxxfund2Contract.getManagerFeeVolumeUSD()

      fund.volumeETH = xxxfund2Contract.getFundVolumeETH()
      fund.volumeUSD = xxxfund2Contract.getFundVolumeUSD()

      managerFeeOut.save()
      manager.save()
      fund.save()

      managerSnapshot(event)
      fundSnapshot(event)
    }
  }
}

export function handleInvestorDeposit(event: InvestorDepositEvent): void {
  let fund = Fund.load(event.address.toHexString())
  if (fund !== null) {
    const xxxfund2Contract = XXXFund2Contract.bind(event.address)
    let transaction = loadTransaction(event)
    let investorDeposit = new InvestorDeposit(event.address.toHexString())
    investorDeposit.transaction = transaction.id
    investorDeposit.timestamp = transaction.timestamp
    investorDeposit.fund = event.transaction.from.toHexString()
    investorDeposit.investor = event.params.investor
    investorDeposit.token = event.params.token
    investorDeposit.amount = event.params.amount
    const depositETH = event.params.amountETH
    const depositUSD = event.params.amountUSD
    investorDeposit.amountETH = event.params.amountETH
    investorDeposit.amountUSD = event.params.amountUSD
    investorDeposit.logIndex = event.logIndex

    let investor = Investor.load(event.params.investor.toHexString())
    if (investor !== null) {
      investor.principalETH = investor.principalETH.minus(depositETH)
      investor.principalUSD = investor.principalUSD.minus(depositUSD)
      investor.volumeETH = xxxfund2Contract.getInvestorVolumeETH(event.address)
      investor.volumeUSD = xxxfund2Contract.getInvestorVolumeUSD(event.address)
      investor.profitETH = getProfitETH(investor.principalETH, investor.volumeETH)
      investor.profitUSD = getProfitUSD(investor.principalUSD, investor.volumeUSD)

      fund.volumeETH = xxxfund2Contract.getFundVolumeETH()
      fund.volumeUSD = xxxfund2Contract.getFundVolumeUSD()

      investorDeposit.save()
      investor.save()
      fund.save()
    
      investorSnapshot(event)
      fundSnapshot(event)
    }
  }
}

export function handleInvestorWithdraw(event: InvestorWithdrawEvent): void {
  let fund = Fund.load(event.address.toHexString())
  if (fund !== null) {
    const xxxfund2Contract = XXXFund2Contract.bind(event.address)
    let transaction = loadTransaction(event)
    let investorWithdraw = new InvestorWithdraw(event.address.toHexString())
    investorWithdraw.transaction = transaction.id
    investorWithdraw.timestamp = transaction.timestamp
    investorWithdraw.fund = event.transaction.from.toHexString()
    investorWithdraw.investor = event.params.investor
    investorWithdraw.token = event.params.token
    investorWithdraw.amount = event.params.amount
    const withdrawETH = event.params.amountETH
    const withdrawUSD = event.params.amountUSD
    investorWithdraw.amountETH = withdrawETH
    investorWithdraw.amountUSD = withdrawUSD
    investorWithdraw.logIndex = event.logIndex

    let investor = Investor.load(event.params.investor.toHexString())
    let manager = Manager.load(fund.manager.toHexString())
    if (investor !== null && manager !== null) {
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

      manager.feeVolumeETH = xxxfund2Contract.getManagerFeeVolumeETH()
      manager.feeVolumeUSD = xxxfund2Contract.getManagerFeeVolumeUSD()

      fund.volumeETH = xxxfund2Contract.getFundVolumeETH()
      fund.volumeUSD = xxxfund2Contract.getFundVolumeUSD()

      investorWithdraw.save()
      investor.save()
      manager.save()
      fund.save()

      investorSnapshot(event)
      fundSnapshot(event)
    }
  }
}

export function handleSwap(event: SwapEvent): void {
  let fund = Fund.load(event.address.toHexString())
  if (fund !== null) {
    const xxxfund2Contract = XXXFund2Contract.bind(event.address)
    const manager = event.params.manager
    const investor = event.params.investor
    const tokenIn = event.params.tokenIn.toHexString()
    const tokenOut = event.params.tokenOut.toHexString()
    const amountIn = event.params.amountIn
    const amountOut = event.params.amountOut

    let transaction = loadTransaction(event)
    let swap = new Swap(event.address.toHexString())
    swap.transaction = transaction.id
    swap.timestamp = transaction.timestamp
    swap.fund =  event.transaction.from.toHexString()
    swap.manager = event.params.manager
    swap.investor = event.params.investor
    swap.token0 = tokenIn
    swap.token1 = tokenOut
    swap.amount0 = amountIn
    swap.amount1 = amountOut
    swap.amountETH = event.params.amountETH
    swap.amountUSD = event.params.amountUSD
    swap.logIndex = event.logIndex

    if (manager == investor) {
      //manager account swap
      let manager = Manager.load(event.params.manager.toHexString())
      if (manager !== null) {
        manager.volumeETH = xxxfund2Contract.getManagerVolumeETH()
        manager.volumeUSD = xxxfund2Contract.getManagerVolumeUSD()
        manager.profitETH = getProfitETH(manager.principalETH, manager.volumeETH)
        manager.profitUSD = getProfitUSD(manager.principalUSD, manager.volumeUSD)
  
        fund.volumeETH = xxxfund2Contract.getFundVolumeETH()
        fund.volumeUSD = xxxfund2Contract.getFundVolumeUSD()
  
        swap.save()
        manager.save()
        fund.save()

        managerSnapshot(event)
        fundSnapshot(event)
      }
    } else {
      //investor account swap
      let investor = Investor.load(event.params.investor.toHexString())
      if (investor !== null) {
        investor.volumeETH = xxxfund2Contract.getInvestorVolumeETH(event.address)
        investor.volumeUSD = xxxfund2Contract.getInvestorVolumeUSD(event.address)
        investor.profitETH = getProfitETH(investor.principalETH, investor.volumeETH)
        investor.profitUSD = getProfitUSD(investor.principalUSD, investor.volumeUSD)
  
        fund.volumeETH = xxxfund2Contract.getFundVolumeETH()
        fund.volumeUSD = xxxfund2Contract.getFundVolumeUSD()
  
        swap.save()
        investor.save()
        fund.save()
      
        investorSnapshot(event)
        fundSnapshot(event)
      }
    }
  }
}
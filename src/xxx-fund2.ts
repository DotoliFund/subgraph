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
} from './utils/constants'
import { 
  fundSnapshot,
  managerSnapshot,
  investorSnapshot,
  xxxfund2Snapshot,
} from './utils/snapshots'
import { 
  loadTransaction,
  getAmountETH,
  getAmountUSD,
  getXXXFund2VolumeETH,
  getXXXFund2VolumeUSD,
  getFundVolumeETH,
  getFundVolumeUSD,
  getManagerVolumeETH,
  getManagerVolumeUSD,
  getManagerFeeVolumeETH,
  getManagerFeeVolumeUSD,
  getInvestorVolumeETH,
  getInvestorVolumeUSD,
  getProfitETH,
  getProfitUSD,
} from './utils'

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
      manager.principalETH = ZERO_BD
      manager.principalUSD = ZERO_BD
      manager.volumeETH = ZERO_BD
      manager.volumeUSD = ZERO_BD
      manager.profitETH = ZERO_BI
      manager.profitUSD = ZERO_BI
    }

    initialize.save()
    manager.save()
    managerSnapshot(event)
    fundSnapshot(event)
    xxxfund2Snapshot(event)
  }
}

export function handleManagerDeposit(event: ManagerDepositEvent): void {
  let factory = Factory.load(FACTORY_ADDRESS)
  let fund = Fund.load(event.address.toHexString())
  if (factory !== null && fund !== null) {
    let transaction = loadTransaction(event)
    let managerDeposit = new ManagerDeposit(event.address.toHexString())
    managerDeposit.transaction = transaction.id
    managerDeposit.timestamp = transaction.timestamp
    managerDeposit.fund = event.transaction.from.toHexString()
    managerDeposit.manager = event.params.manager
    managerDeposit.token = event.params.token
    managerDeposit.amount = event.params.amount
    managerDeposit.amountUSD = getAmountUSD(event.params.token.toHexString(), event.params.amount)
    managerDeposit.logIndex = event.logIndex

    let manager = Manager.load(event.params.manager.toHexString())
    if (manager !== null) {
      const depositETH = getAmountETH(managerDeposit.token.toHexString(), managerDeposit.amount)
      const depositUSD = getAmountUSD(managerDeposit.token.toHexString(), managerDeposit.amount)

      manager.principalETH = manager.principalETH.plus(depositETH)
      manager.principalUSD = manager.principalUSD.plus(depositUSD)
      manager.volumeETH = getManagerVolumeETH(fund.manager.toHexString())
      manager.volumeUSD = getManagerVolumeUSD(fund.manager.toHexString())
      manager.profitETH = getProfitETH(manager.principalETH, manager.volumeETH)
      manager.profitUSD = getProfitUSD(manager.principalUSD, manager.volumeUSD)

      fund.volumeETH = getFundVolumeETH(event.address.toHexString())
      fund.volumeUSD = getFundVolumeUSD(event.address.toHexString())

      factory.totalVolumeETH = getXXXFund2VolumeETH()
      factory.totalVolumeUSD = getXXXFund2VolumeUSD()

      managerDeposit.save()
      manager.save()
      fund.save()
      factory.save()

      managerSnapshot(event)
      fundSnapshot(event)
      xxxfund2Snapshot(event)
    }
  }
}

export function handleManagerWithdraw(event: ManagerWithdrawEvent): void {
  let factory = Factory.load(FACTORY_ADDRESS)
  let fund = Fund.load(event.address.toHexString())
  if (factory !== null && fund !== null) {
    let transaction = loadTransaction(event)
    let managerWithdraw = new ManagerWithdraw(event.address.toHexString())
    managerWithdraw.transaction = transaction.id
    managerWithdraw.timestamp = transaction.timestamp
    managerWithdraw.fund = event.transaction.from.toHexString()
    managerWithdraw.manager = event.params.manager
    managerWithdraw.token = event.params.token
    managerWithdraw.amount = event.params.amount
    managerWithdraw.amountUSD = getAmountUSD(event.params.token.toHexString(), event.params.amount)
    managerWithdraw.logIndex = event.logIndex

    let manager = Manager.load(event.params.manager.toHexString())
    if (manager !== null) {
      manager.volumeETH = getManagerVolumeETH(fund.manager.toHexString())
      manager.volumeUSD = getManagerVolumeUSD(fund.manager.toHexString())
      const withdrawETH = getAmountETH(managerWithdraw.token.toHexString(), managerWithdraw.amount)
      const withdrawUSD = getAmountUSD(managerWithdraw.token.toHexString(), managerWithdraw.amount)
      const prevVolumeETH = manager.volumeETH.plus(withdrawETH)
      const prevVolumeUSD = manager.volumeUSD.plus(withdrawUSD)
      const managerPrincipalETHToMinus = manager.principalETH.div(manager.principalETH.plus(prevVolumeETH)).times(withdrawETH)
      const managerPrincipalUSDToMinus = manager.principalUSD.div(manager.principalUSD.plus(prevVolumeUSD)).times(withdrawUSD)
      manager.principalETH = manager.principalETH.minus(managerPrincipalETHToMinus)
      manager.principalUSD = manager.principalUSD.minus(managerPrincipalUSDToMinus)
      manager.profitETH = getProfitETH(manager.principalETH, manager.volumeETH)
      manager.profitUSD = getProfitUSD(manager.principalUSD, manager.volumeUSD)

      fund.volumeETH = getFundVolumeETH(event.address.toHexString())
      fund.volumeUSD = getFundVolumeUSD(event.address.toHexString())

      factory.totalVolumeETH = getXXXFund2VolumeETH()
      factory.totalVolumeUSD = getXXXFund2VolumeUSD()

      managerWithdraw.save()
      manager.save()
      fund.save()
      factory.save()

      managerSnapshot(event)
      fundSnapshot(event)
      xxxfund2Snapshot(event)
    }
  }
}

export function handleManagerFeeOut(event: ManagerFeeOutEvent): void {
  let factory = Factory.load(FACTORY_ADDRESS)
  let fund = Fund.load(event.address.toHexString())
  if (factory !== null && fund !== null) {
    let transaction = loadTransaction(event)
    let managerFeeOut = new ManagerFeeOut(event.address.toHexString())
    managerFeeOut.transaction = transaction.id
    managerFeeOut.timestamp = transaction.timestamp
    managerFeeOut.fund = event.transaction.from.toHexString()
    managerFeeOut.manager = event.params.manager
    managerFeeOut.token = event.params.token
    managerFeeOut.amount = event.params.amount
    managerFeeOut.amountUSD = getAmountUSD(event.params.token.toHexString(), event.params.amount)
    managerFeeOut.logIndex = event.logIndex

    let manager = Manager.load(event.params.manager.toHexString())
    if (manager !== null) {
      manager.volumeETH = getManagerVolumeETH(fund.manager.toHexString())
      manager.volumeUSD = getManagerVolumeUSD(fund.manager.toHexString())
      manager.profitETH = getProfitETH(manager.principalETH, manager.volumeETH)
      manager.profitUSD = getProfitUSD(manager.principalUSD, manager.volumeUSD)
      manager.feeVolumeETH = getManagerFeeVolumeETH(fund.manager.toHexString())
      manager.feeVolumeUSD = getManagerFeeVolumeUSD(fund.manager.toHexString())

      fund.volumeETH = getFundVolumeETH(event.address.toHexString())
      fund.volumeUSD = getFundVolumeUSD(event.address.toHexString())

      factory.totalVolumeETH = getXXXFund2VolumeETH()
      factory.totalVolumeUSD = getXXXFund2VolumeUSD()

      managerFeeOut.save()
      manager.save()
      fund.save()
      factory.save()
    
      managerSnapshot(event)
      fundSnapshot(event)
      xxxfund2Snapshot(event)
    }
  }
}

export function handleInvestorDeposit(event: InvestorDepositEvent): void {
  let factory = Factory.load(FACTORY_ADDRESS)
  let fund = Fund.load(event.address.toHexString())
  if (factory !== null && fund !== null) {
    let transaction = loadTransaction(event)
    let investorDeposit = new InvestorDeposit(event.address.toHexString())
    investorDeposit.transaction = transaction.id
    investorDeposit.timestamp = transaction.timestamp
    investorDeposit.fund = event.transaction.from.toHexString()
    investorDeposit.investor = event.params.investor
    investorDeposit.token = event.params.token
    investorDeposit.amount = event.params.amount
    investorDeposit.amountUSD = getAmountUSD(event.params.token.toHexString(), event.params.amount)
    investorDeposit.logIndex = event.logIndex

    let investor = Investor.load(event.params.investor.toHexString())
    if (investor !== null) {
      const depositETH = getAmountETH(investorDeposit.token.toHexString(), investorDeposit.amount)
      const depositUSD = getAmountUSD(investorDeposit.token.toHexString(), investorDeposit.amount)
      
      investor.principalETH = investor.principalETH.minus(depositETH)
      investor.principalUSD = investor.principalUSD.minus(depositUSD)
      investor.volumeETH = getInvestorVolumeETH(event.params.investor.toHexString())
      investor.volumeUSD = getInvestorVolumeUSD(event.params.investor.toHexString())
      investor.profitETH = getProfitETH(investor.principalETH, investor.volumeETH)
      investor.profitUSD = getProfitUSD(investor.principalUSD, investor.volumeUSD)

      fund.volumeETH = getFundVolumeETH(event.address.toHexString())
      fund.volumeUSD = getFundVolumeUSD(event.address.toHexString())

      factory.totalVolumeETH = getXXXFund2VolumeETH()
      factory.totalVolumeUSD = getXXXFund2VolumeUSD()

      investorDeposit.save()
      investor.save()
      fund.save()
      factory.save()
    
      investorSnapshot(event)
      fundSnapshot(event)
      xxxfund2Snapshot(event)
    }
  }
}

export function handleInvestorWithdraw(event: InvestorWithdrawEvent): void {
  let factory = Factory.load(FACTORY_ADDRESS)
  let fund = Fund.load(event.address.toHexString())
  if (factory !== null && fund !== null) {
    let transaction = loadTransaction(event)
    let investorWithdraw = new InvestorWithdraw(event.address.toHexString())
    investorWithdraw.transaction = transaction.id
    investorWithdraw.timestamp = transaction.timestamp
    investorWithdraw.fund = event.transaction.from.toHexString()
    investorWithdraw.investor = event.params.investor
    investorWithdraw.token = event.params.token
    investorWithdraw.amount = event.params.amount
    investorWithdraw.amountUSD = getAmountUSD(event.params.token.toHexString(), event.params.amount)
    investorWithdraw.logIndex = event.logIndex

    let investor = Investor.load(event.params.investor.toHexString())
    let manager = Manager.load(fund.manager.toHexString())
    if (investor !== null && manager !== null) {
      investor.volumeETH = getInvestorVolumeETH(event.params.investor.toHexString())
      investor.volumeUSD = getInvestorVolumeUSD(event.params.investor.toHexString())
      const withdrawETH = getAmountETH(investorWithdraw.token.toHexString(), investorWithdraw.amount)
      const withdrawUSD = getAmountUSD(investorWithdraw.token.toHexString(), investorWithdraw.amount)
      const prevVolumeETH = investor.volumeETH.plus(withdrawETH)
      const prevVolumeUSD = investor.volumeUSD.plus(withdrawUSD)
      const investorPrincipalETHToMinus = investor.principalETH.div(investor.principalETH.plus(prevVolumeETH)).times(withdrawETH)
      const investorPrincipalUSDToMinus = investor.principalUSD.div(investor.principalUSD.plus(prevVolumeUSD)).times(withdrawUSD)
      investor.principalETH = investor.principalETH.minus(investorPrincipalETHToMinus)
      investor.principalUSD = investor.principalUSD.minus(investorPrincipalUSDToMinus)
      investor.profitETH = getProfitETH(investor.principalETH, investor.volumeETH)
      investor.profitUSD = getProfitUSD(investor.principalUSD, investor.volumeUSD)

      manager.feeVolumeETH = getManagerFeeVolumeETH(fund.manager.toHexString())
      manager.feeVolumeUSD = getManagerFeeVolumeUSD(fund.manager.toHexString())

      fund.volumeETH = getFundVolumeETH(event.address.toHexString())
      fund.volumeUSD = getFundVolumeUSD(event.address.toHexString())

      factory.totalVolumeETH = getXXXFund2VolumeETH()
      factory.totalVolumeUSD = getXXXFund2VolumeUSD()

      investorWithdraw.save()
      investor.save()
      manager.save()
      fund.save()
      factory.save()

      investorSnapshot(event)
      fundSnapshot(event)
      xxxfund2Snapshot(event)
    }
  }
}

export function handleSwap(event: SwapEvent): void {
  let factory = Factory.load(FACTORY_ADDRESS)
  let fund = Fund.load(event.address.toHexString())
  if (factory !== null && fund !== null) {
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
    swap.amountUSD = getAmountUSD(tokenIn, amountIn)
    swap.logIndex = event.logIndex

    if (manager == investor) {
      //manager account swap
      let manager = Manager.load(event.params.manager.toHexString())
      if (manager !== null) {
        manager.volumeETH = getManagerVolumeETH(fund.manager.toHexString())
        manager.volumeUSD = getManagerVolumeUSD(fund.manager.toHexString())
        manager.profitETH = getProfitETH(manager.principalETH, manager.volumeETH)
        manager.profitUSD = getProfitUSD(manager.principalUSD, manager.volumeUSD)
  
        fund.volumeETH = getFundVolumeETH(event.address.toHexString())
        fund.volumeUSD = getFundVolumeUSD(event.address.toHexString())
  
        factory.totalVolumeETH = getXXXFund2VolumeETH()
        factory.totalVolumeUSD = getXXXFund2VolumeUSD()
  
        swap.save()
        manager.save()
        fund.save()
        factory.save()

        managerSnapshot(event)
        fundSnapshot(event)
        xxxfund2Snapshot(event)
      }
    } else {
      //investor account swap
      let investor = Investor.load(event.params.investor.toHexString())
      if (investor !== null) {
        investor.volumeETH = getInvestorVolumeETH(event.params.investor.toHexString())
        investor.volumeUSD = getInvestorVolumeUSD(event.params.investor.toHexString())
        investor.profitETH = getProfitETH(investor.principalETH, investor.volumeETH)
        investor.profitUSD = getProfitUSD(investor.principalUSD, investor.volumeUSD)
  
        fund.volumeETH = getFundVolumeETH(event.address.toHexString())
        fund.volumeUSD = getFundVolumeUSD(event.address.toHexString())
  
        factory.totalVolumeETH = getXXXFund2VolumeETH()
        factory.totalVolumeUSD = getXXXFund2VolumeUSD()
  
        swap.save()
        investor.save()
        fund.save()
        factory.save()
      
        investorSnapshot(event)
        fundSnapshot(event)
        xxxfund2Snapshot(event)
      }
    }
  }
}
import { BigInt } from "@graphprotocol/graph-ts"
import {
  Initialize as InitializeEvent,
  ManagerDeposit as ManagerDepositEvent,
  ManagerWithdraw as ManagerWithdrawEvent,
  ManagerFeeIn as ManagerFeeInEvent,
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
  Transaction,
  ManagerDeposit,
  ManagerWithdraw,
  ManagerFeeIn,
  ManagerFeeOut,
  InvestorDeposit,
  InvestorWithdraw,
  Swap,
  FundSnapshot,
  ManagerSnapshot,
  InvestorSnapshot,
  Initialize,
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
  fundSnapshot,
  managerSnapshot,
  investorSnapshot,
  xxxfund2Snapshot,
} from './utils/snapshots'
import { loadTransaction } from './utils'

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
  let fund = Fund.load(event.address.toHexString())
  if (fund !== null) {
    let transaction = loadTransaction(event)
    let managerDeposit = new ManagerDeposit(event.address.toHexString())
    managerDeposit.transaction = transaction.id
    managerDeposit.timestamp = transaction.timestamp
    managerDeposit.fund =  event.transaction.from.toHexString()
    managerDeposit.manager = event.params.manager
    managerDeposit.token = event.params.token
    managerDeposit.amount = event.params.amount
    managerDeposit.amountUSD = getUSDprice(event.params.token, event.params.amount)
    managerDeposit.logIndex = event.logIndex

    let manager = Manager.load(event.params.manager.toHexString())
    if (manager !== null) {
      manager.principalETH = manager.principalETH.plus()
      manager.principalUSD = manager.principalUSD.plus()
      manager.volumeETH = getManagerVolumeETH(fund.manager)
      manager.volumeUSD = getManagerVolumeUSD(fund.manager)
      manager.profitETH = getProfitETH(manager.principalETH, manager.volumeETH)
      manager.profitUSD = getProfitUSD(manager.principalUSD, manager.volumeUSD)

      fund.principalETH = fund.principalETH.plus()
      fund.principalUSD = fund.principalUSD.plus()
      fund.volumeETH = getFundVolumeETH(event.address.toHexString())
      fund.volumeUSD = getFundVolumeUSD(event.address.toHexString())
      fund.profitETH = getProfitETH(fund.principalETH, fund.volumeETH)
      fund.profitUSD = getProfitUSD(fund.principalUSD, fund.volumeUSD)

      managerDeposit.save()
      manager.save()
      fund.save()
    
      managerSnapshot(event)
      fundSnapshot(event)
      xxxfund2Snapshot(event)
    }
  }
}

export function handleManagerWithdraw(event: ManagerWithdrawEvent): void {
  let fund = Fund.load(event.address.toHexString())
  if (fund !== null) {
    let transaction = loadTransaction(event)
    let managerWithdraw = new ManagerWithdraw(event.address.toHexString())
    managerWithdraw.transaction = transaction.id
    managerWithdraw.timestamp = transaction.timestamp
    managerWithdraw.fund =  event.transaction.from.toHexString()
    managerWithdraw.manager = event.params.manager
    managerWithdraw.token = event.params.token
    managerWithdraw.amount = event.params.amount
    managerWithdraw.amountUSD = getUSDprice(event.params.token, event.params.amount)
    managerWithdraw.logIndex = event.logIndex

    let manager = Manager.load(event.params.manager.toHexString())
    if (manager !== null) {
      manager.principalETH = manager.principalETH.minus()
      manager.principalUSD = manager.principalUSD.minus()
      manager.volumeETH = getManagerVolumeETH(fund.manager)
      manager.volumeUSD = getManagerVolumeUSD(fund.manager)
      manager.profitETH = getProfitETH(manager.principalETH, manager.volumeETH)
      manager.profitUSD = getProfitUSD(manager.principalUSD, manager.volumeUSD)

      fund.principalETH = fund.principalETH.minus()
      fund.principalUSD = fund.principalUSD.minus()
      fund.volumeETH = getFundVolumeETH(event.address.toHexString())
      fund.volumeUSD = getFundVolumeUSD(event.address.toHexString())
      fund.profitETH = getProfitETH(fund.principalETH, fund.volumeETH)
      fund.profitUSD = getProfitUSD(fund.principalUSD, fund.volumeUSD)

      manager.save()
      fund.save()
    
      managerSnapshot(event)
      fundSnapshot(event)
      xxxfund2Snapshot(event)
    }
  }
}

// export function handleManagerFeeIn(event: ManagerFeeInEvent): void {
//   let fund = Fund.load(event.address.toHexString())
//   if (fund !== null) {

//     let transaction = loadTransaction(event)
//     let managerFeeIn = new ManagerFeeIn(event.address.toHexString())
//     managerFeeIn.transaction = transaction.id
//     managerFeeIn.timestamp = transaction.timestamp
//     managerFeeIn.fund =  event.transaction.from.toHexString()
//     managerFeeIn.manager = event.params.manager
//     managerFeeIn.token = event.params.token
//     managerFeeIn.amount = event.params.amount
//     managerFeeIn.amountUSD = getUSDprice(event.params.token, event.params.amount)
//     managerFeeIn.logIndex = event.logIndex

//     let manager = Manager.load(event.params.manager.toHexString())
//     if (manager !== null) {
//       manager.volumeETH = getManagerVolumeETH(fund.manager)
//       manager.volumeUSD = getManagerVolumeUSD(fund.manager)
//       manager.feeVolumeETH = getManagerFeeVolumeETH(fund.manager)
//       manager.feeVolumeUSD = getManagerFeeVolumeUSD(fund.manager)

//       fund.principalETH = fund.principalETH.minus()
//       fund.principalUSD = fund.principalUSD.minus()
//       fund.volumeETH = getFundVolumeETH(event.address.toHexString())
//       fund.volumeUSD = getFundVolumeUSD(event.address.toHexString())
//       fund.profitETH = getProfitETH(fund.principalETH, fund.volumeETH)
//       fund.profitUSD = getProfitUSD(fund.principalUSD, fund.volumeUSD)

//       manager.save()
//       fund.save()
    
//       managerSnapshot(event)
//       fundSnapshot(event)
//     }
//   }
// }

export function handleManagerFeeOut(event: ManagerFeeOutEvent): void {
  let fund = Fund.load(event.address.toHexString())
  if (fund !== null) {

    let transaction = loadTransaction(event)
    let managerFeeOut = new ManagerFeeOut(event.address.toHexString())
    managerFeeOut.transaction = transaction.id
    managerFeeOut.timestamp = transaction.timestamp
    managerFeeOut.fund =  event.transaction.from.toHexString()
    managerFeeOut.manager = event.params.manager
    managerFeeOut.token = event.params.token
    managerFeeOut.amount = event.params.amount
    managerFeeOut.amountUSD = getUSDprice(event.params.token, event.params.amount)
    managerFeeOut.logIndex = event.logIndex

    let manager = Manager.load(event.params.manager.toHexString())
    if (manager !== null) {
      manager.feeVolumeETH = getManagerFeeVolumeETH()
      manager.feeVolumeUSD = getManagerFeeVolumeUSD()

      fund.principalETH = fund.principalETH.minus()
      fund.principalUSD = fund.principalUSD.minus()
      fund.volumeETH = getFundVolumeETH(event.address.toHexString())
      fund.volumeUSD = getFundVolumeUSD(event.address.toHexString())
      fund.profitETH = getProfitETH(fund.principalETH, fund.volumeETH)
      fund.profitUSD = getProfitUSD(fund.principalUSD, fund.volumeUSD)

      manager.save()
      fund.save()
    
      managerSnapshot(event)
      fundSnapshot(event)
      xxxfund2Snapshot(event)
    }
  }
}

export function handleInvestorDeposit(event: InvestorDepositEvent): void {
  let fund = Fund.load(event.address.toHexString())
  if (fund !== null) {

    let transaction = loadTransaction(event)
    let investorDeposit = new InvestorDeposit(event.address.toHexString())
    investorDeposit.transaction = transaction.id
    investorDeposit.timestamp = transaction.timestamp
    investorDeposit.fund =  event.transaction.from.toHexString()
    investorDeposit.investor = event.params.investor
    investorDeposit.token = event.params.token
    investorDeposit.amount = event.params.amount
    investorDeposit.amountUSD = getUSDprice(event.params.token, event.params.amount)
    investorDeposit.logIndex = event.logIndex

    let investor = Investor.load(event.params.investor.toHexString())
    if (investor !== null) {
      investor.principalETH = investor.principalETH.minus()
      investor.principalUSD = investor.principalUSD.minus()
      investor.volumeETH = getInvestorVolumeETH(fund.investor)
      investor.volumeUSD = getInvestorVolumeUSD(fund.investor)
      investor.profitETH = getProfitETH(investor.principalETH, investor.volumeETH)
      investor.profitUSD = getProfitUSD(investor.principalUSD, investor.volumeUSD)

      fund.principalETH = fund.principalETH.plus()
      fund.principalUSD = fund.principalUSD.plus()
      fund.volumeETH = getFundVolumeETH(event.address.toHexString())
      fund.volumeUSD = getFundVolumeUSD(event.address.toHexString())
      fund.profitETH = getProfitETH(fund.principalETH, fund.volumeETH)
      fund.profitUSD = getProfitUSD(fund.principalUSD, fund.volumeUSD)

      investor.save()
      fund.save()
    
      investorSnapshot(event)
      fundSnapshot(event)
      xxxfund2Snapshot(event)
    }
  }
}

export function handleInvestorWithdraw(event: InvestorWithdrawEvent): void {
  let fund = Fund.load(event.address.toHexString())
  if (fund !== null) {

    let transaction = loadTransaction(event)
    let investorWithdraw = new InvestorWithdraw(event.address.toHexString())
    investorWithdraw.transaction = transaction.id
    investorWithdraw.timestamp = transaction.timestamp
    investorWithdraw.fund =  event.transaction.from.toHexString()
    investorWithdraw.investor = event.params.investor
    investorWithdraw.token = event.params.token
    investorWithdraw.amount = event.params.amount
    investorWithdraw.amountUSD = getUSDprice(event.params.token, event.params.amount)
    investorWithdraw.logIndex = event.logIndex

    let investor = Investor.load(event.params.investor.toHexString())
    if (investor !== null) {
      investor.principalETH = investor.principalETH.minus()
      investor.principalUSD = investor.principalUSD.minus()
      investor.volumeETH = getInvestorVolumeETH(fund.investor)
      investor.volumeUSD = getInvestorVolumeUSD(fund.investor)
      investor.profitETH = getProfitETH(investor.principalETH, investor.volumeETH)
      investor.profitUSD = getProfitUSD(investor.principalUSD, investor.volumeUSD)

      fund.principalETH = fund.principalETH.plus()
      fund.principalUSD = fund.principalUSD.plus()
      fund.volumeETH = getFundVolumeETH(event.address.toHexString())
      fund.volumeUSD = getFundVolumeUSD(event.address.toHexString())
      fund.profitETH = getProfitETH(fund.principalETH, fund.volumeETH)
      fund.profitUSD = getProfitUSD(fund.principalUSD, fund.volumeUSD)

      investor.save()
      fund.save()
    
      investorSnapshot(event)
      fundSnapshot(event)
      xxxfund2Snapshot(event)
    }
  }
}

export function handleSwap(event: SwapEvent): void {
  let fund = Fund.load(event.address.toHexString())
  if (fund !== null) {
    const manager = event.params.manager
    const investor = event.params.investor

    let transaction = loadTransaction(event)
    let swap = new Swap(event.address.toHexString())
    swap.transaction = transaction.id
    swap.timestamp = transaction.timestamp
    swap.fund =  event.transaction.from.toHexString()
    swap.manager =  event.params.manager
    swap.investor = event.params.investor
    swap.token0 = event.params.tokenIn.toHexString()
    swap.token1 = event.params.tokenOut.toHexString()
    swap.amount0 = event.params.amountIn
    swap.amount1 = event.params.amountOut
    swap.amountUSD = getUSDprice(event.params.token, event.params.amount)
    swap.logIndex = event.logIndex

    if (manager == investor) {
      //manager account swap
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
      }

      manager.
      manager.
      manager.
      manager.

      manager.save()
      managerSnapshot(event)
    } else {
      //investor account swap
      let investor = Investor.load(event.params.investor.toHexString())
      if (investor === null) {
        investor = new Investor(event.params.investor.toHexString())
        investor.createdAtTimestamp = event.block.timestamp
        investor.createdAtBlockNumber = event.block.number
        investor.fund = event.address
        investor.principalETH = ZERO_BD
        investor.principalUSD = ZERO_BD
        investor.volumeETH = ZERO_BD
        investor.volumeUSD = ZERO_BD
      }
    
      investor.
      investor.
      investor.
      investor.

      investor.save()
      investorSnapshot(event)
    }

    fund.
    fund.
    fund.
    fund.

    fund.save()
    fundSnapshot(event)
    xxxfund2Snapshot(event)
  }
}
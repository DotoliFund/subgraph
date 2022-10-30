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
  FACTORY_ADDRESS,
  PRICEORACLE_ADDRESS,
  WETH9,
  USDC,
  ZERO_BD,
  ZERO_BI,
  factoryContract,
  ADDRESS_ZERO,
  ONE_BD,
  WETH_DECIMAL,
  WETH_INT,
  USDC_DECIMAL,
  USDC_INT
} from './utils/constants'
import { 
  fundSnapshot,
  investorSnapshot,
  xxxfund2Snapshot
} from './utils/snapshots'
import { 
  loadTransaction,
  getProfitETH,
  getProfitUSD,
  getProfitRatioETH,
  getProfitRatioUSD,
  safeDiv
} from './utils'
import { 
  getPriceETH,
  getPriceUSD,
  getInvestorTvlETH,
  getManagerFeeTvlETH
} from './utils/pricing'

export function handleManagerFeeOut(event: ManagerFeeOutEvent): void {
  let factory = Factory.load(FACTORY_ADDRESS)
  if (!factory) return
  let fund = Fund.load(event.params.fund.toHexString())
  if (!fund) return

  const ethPriceInUSD = getPriceUSD(Address.fromString(WETH9), WETH_INT, Address.fromString(USDC))

  factory.totalVolumeETH = factory.totalVolumeETH.minus(fund.volumeETH)
  fund.volumeETH = fund.volumeETH.minus(fund.feeVolumeETH)

  let transaction = loadTransaction(event)
  let managerFeeOut = new ManagerFeeOut(event.transaction.hash.toHexString())
  managerFeeOut.transaction = transaction.id
  managerFeeOut.timestamp = transaction.timestamp
  managerFeeOut.fund = event.params.fund
  managerFeeOut.manager = event.params.manager
  managerFeeOut.token = event.params.token
  managerFeeOut.amount = event.params.amount
  const deFeeOutAmountETH = getPriceETH(event.params.token, event.params.amount, Address.fromString(WETH9))
  managerFeeOut.amountETH = deFeeOutAmountETH
  managerFeeOut.amountUSD = managerFeeOut.amountETH.times(ethPriceInUSD)
  managerFeeOut.origin = event.transaction.from
  managerFeeOut.logIndex = event.logIndex

  fund.feeVolumeUSD = getManagerFeeTvlETH(event.params.fund)
  fund.volumeETH = fund.volumeETH.plus(fund.feeVolumeETH)
  fund.volumeUSD = fund.volumeETH.times(ethPriceInUSD)
  factory.totalVolumeETH = factory.totalVolumeETH.plus(fund.volumeETH)
  factory.totalVolumeUSD = factory.totalVolumeETH.times(ethPriceInUSD)

  managerFeeOut.save()
  fund.save()
  factory.save()
  fundSnapshot(event.params.fund, event.params.manager, event)
  xxxfund2Snapshot(event)
}

export function handleDeposit(event: DepositEvent): void {
  let factory = Factory.load(FACTORY_ADDRESS)
  if (!factory) return
  let fund = Fund.load(event.params.fund.toHexString())
  if (!fund) return

  const ethPriceInUSD = getPriceUSD(Address.fromString(WETH9), WETH_INT, Address.fromString(USDC))

  let transaction = loadTransaction(event)
  let deposit = new Deposit(event.transaction.hash.toHexString())
  deposit.transaction = transaction.id
  deposit.timestamp = transaction.timestamp
  deposit.fund = event.params.fund
  deposit.investor = event.params.investor
  deposit.token = event.params.token
  deposit.amount = event.params.amount
  //const depositAmountETH = BigDecimal.fromString('1')
  const depositAmountETH = getPriceETH(event.params.token, event.params.amount, Address.fromString(WETH9))
  deposit.amountETH = depositAmountETH
  deposit.amountUSD = depositAmountETH.times(ethPriceInUSD)
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
    fund.principalETH = fund.principalETH.minus(investor.principalETH)
    fund.principalUSD = fund.principalUSD.minus(investor.principalUSD)

    investor.volumeETH = getInvestorTvlETH(event.params.fund, event.params.investor)
    investor.volumeUSD = investor.volumeETH.times(ethPriceInUSD)

    fund.feeVolumeETH = getManagerFeeTvlETH(event.params.fund)
    fund.feeVolumeUSD = fund.feeVolumeETH.times(ethPriceInUSD)

    investor.principalETH = investor.principalETH.plus(depositAmountETH)
    investor.principalUSD = investor.principalUSD.plus(depositAmountETH.times(ethPriceInUSD))
    investor.profitETH = getProfitETH(investor.principalETH, investor.volumeETH)
    investor.profitUSD = getProfitUSD(investor.principalUSD, investor.volumeUSD)
    investor.profitRatioETH = getProfitRatioETH(investor.principalETH, investor.volumeETH)
    investor.profitRatioUSD = getProfitRatioUSD(investor.principalUSD, investor.volumeUSD)

    fund.principalETH = fund.principalETH.plus(investor.principalETH)
    fund.principalUSD = fund.principalUSD.plus(investor.principalUSD)
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

export function handleWithdraw(event: WithdrawEvent): void {
  let factory = Factory.load(FACTORY_ADDRESS)
  if (!factory) return
  let fund = Fund.load(event.params.fund.toHexString())
  if (!fund) return

  const ethPriceInUSD = getPriceUSD(Address.fromString(WETH9), WETH_INT, Address.fromString(USDC))

  let transaction = loadTransaction(event)
  let withdraw = new Withdraw(event.transaction.hash.toHexString())
  withdraw.transaction = transaction.id
  withdraw.timestamp = transaction.timestamp
  withdraw.fund = event.params.fund
  withdraw.investor = event.params.investor
  withdraw.token = event.params.token
  withdraw.amount = event.params.amount
  const withdrawAmountETH = getPriceETH(event.params.token, event.params.amount, Address.fromString(WETH9))
  withdraw.amountETH = withdrawAmountETH
  withdraw.amountUSD = withdrawAmountETH.times(ethPriceInUSD)
  withdraw.origin = event.transaction.from
  withdraw.logIndex = event.logIndex

  const investorID = 
    event.params.fund.toHexString().toUpperCase() 
    + '-' 
    + event.params.investor.toHexString().toUpperCase()
  let investor = Investor.load(investorID)

  if (investor !== null) {
    factory.totalVolumeETH = factory.totalVolumeETH.minus(fund.volumeETH)
    fund.volumeETH = fund.volumeETH.minus(investor.volumeETH)
    fund.volumeETH = fund.volumeETH.minus(fund.feeVolumeETH)
    fund.principalETH = fund.principalETH.minus(investor.principalETH)
    fund.principalUSD = fund.principalUSD.minus(investor.principalUSD)

    investor.volumeETH = getInvestorTvlETH(event.params.fund, event.params.investor)
    investor.volumeUSD = investor.volumeETH.times(ethPriceInUSD)

    fund.feeVolumeETH = getManagerFeeTvlETH(event.params.fund)
    fund.feeVolumeUSD = fund.feeVolumeETH.times(ethPriceInUSD)

    const prevVolumeETH = investor.volumeETH.plus(withdraw.amountETH)
    const prevVolumeUSD = investor.volumeUSD.plus(withdraw.amountUSD)
    const withdrawRatioETH = ONE_BD.minus(withdraw.amountETH.div(prevVolumeETH))
    const withdrawRatioUSD = ONE_BD.minus(withdraw.amountUSD.div(prevVolumeUSD))
    investor.principalETH = investor.principalETH.times(withdrawRatioETH)
    investor.principalUSD = investor.principalUSD.times(withdrawRatioUSD)
    investor.profitETH = getProfitETH(investor.principalETH, investor.volumeETH)
    investor.profitUSD = getProfitUSD(investor.principalUSD, investor.volumeUSD)
    investor.profitRatioETH = getProfitRatioETH(investor.principalETH, investor.volumeETH)
    investor.profitRatioUSD = getProfitRatioUSD(investor.principalUSD, investor.volumeUSD)

    fund.principalETH = fund.principalETH.plus(investor.principalETH)
    fund.principalUSD = fund.principalUSD.plus(investor.principalUSD)
    fund.volumeETH = fund.volumeETH.plus(investor.volumeETH)
    fund.volumeETH = fund.volumeETH.plus(fund.feeVolumeETH)
    fund.volumeUSD = fund.volumeETH.times(ethPriceInUSD)
    factory.totalVolumeETH = factory.totalVolumeETH.plus(fund.volumeETH)
    factory.totalVolumeUSD = factory.totalVolumeETH.times(ethPriceInUSD)

    withdraw.save()
    investor.save()
    fund.save()
    factory.save()
    investorSnapshot(event.params.fund, event.params.manager, event.params.investor, event)
    fundSnapshot(event.params.fund, event.params.manager, event)
    xxxfund2Snapshot(event)
  }
}

export function handleSwap(event: SwapEvent): void {
  let factory = Factory.load(FACTORY_ADDRESS)
  if (!factory) return
  let fund = Fund.load(event.params.fund.toHexString())
  if (!fund) return

  const ethPriceInUSD = getPriceUSD(Address.fromString(WETH9), WETH_INT, Address.fromString(USDC))

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
  const swapAmountETH = getPriceETH(event.params.tokenOut, event.params.amountOut, Address.fromString(WETH9))
  const deSwapAmountETH = BigDecimal.fromString(swapAmountETH.toString()).div(WETH_DECIMAL)
  swap.amountETH = deSwapAmountETH
  swap.amountUSD = deSwapAmountETH.times(ethPriceInUSD)
  swap.origin = event.transaction.from
  swap.logIndex = event.logIndex
  
  //investor account swap
  const investorID = 
    event.params.fund.toHexString().toUpperCase() 
    + '-' 
    + event.params.investor.toHexString().toUpperCase()
  let investor = Investor.load(investorID)

  if (investor !== null) {
    factory.totalVolumeETH = factory.totalVolumeETH.minus(fund.volumeETH)
    fund.volumeETH = fund.volumeETH.minus(investor.volumeETH)
    fund.volumeETH = fund.volumeETH.minus(fund.feeVolumeETH)

    investor.volumeETH = getInvestorTvlETH(event.params.fund, event.params.investor)
    investor.volumeUSD = investor.volumeETH.times(ethPriceInUSD)

    fund.feeVolumeETH = getManagerFeeTvlETH(event.params.fund)
    fund.feeVolumeUSD = fund.feeVolumeETH.times(ethPriceInUSD)

    investor.profitETH = getProfitETH(investor.principalETH, investor.volumeETH)
    investor.profitUSD = getProfitUSD(investor.principalUSD, investor.volumeUSD)
    investor.profitRatioETH = getProfitRatioETH(investor.principalETH, investor.volumeETH)
    investor.profitRatioUSD = getProfitRatioUSD(investor.principalUSD, investor.volumeUSD)

    fund.volumeETH = fund.volumeETH.plus(investor.volumeETH)
    fund.volumeETH = fund.volumeETH.plus(fund.feeVolumeETH)
    fund.volumeUSD = fund.volumeETH.times(ethPriceInUSD)
    factory.totalVolumeETH = factory.totalVolumeETH.plus(fund.volumeETH)
    factory.totalVolumeUSD = factory.totalVolumeETH.times(ethPriceInUSD)

    swap.save()
    investor.save()
    fund.save()
    factory.save()
    investorSnapshot(event.params.fund, event.params.manager, event.params.investor, event)
    fundSnapshot(event.params.fund, event.params.manager, event)
    xxxfund2Snapshot(event)
  }
}
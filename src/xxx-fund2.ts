import { BigDecimal, Address, log } from "@graphprotocol/graph-ts"
import {
  ManagerFeeOut as ManagerFeeOutEvent,
  Deposit as DepositEvent,
  Withdraw as WithdrawEvent,
  Swap as SwapEvent,
  MintNewPosition as MintNewPositionEvent,
  IncreaseLiquidity as IncreaseLiquidityEvent,
  CollectPositionFee as CollectPositionFeeEvent,
  DecreaseLiquidity as DecreaseLiquidityEvent
} from './types/templates/XXXFund2/XXXFund2'
import {
  Fund,
  Investor,
  ManagerFeeOut,
  Deposit,
  Withdraw,
  Swap,
  MintNewPosition,
  IncreaseLiquidity,
  CollectPositionFee,
  DecreaseLiquidity
} from "./types/schema"
import { 
  ONE_BD,
} from './utils/constants'
import { 
  fundSnapshot,
  investorSnapshot,
  xxxfund2Snapshot
} from './utils/snapshots'
import {
  loadTransaction,
  safeDiv,
  updateLiquidityVolume,
  updateProfit,
} from './utils'
import {
  updateFundVolume,
  updateFundTokens,
  updateEmptyFundToken,
  updateNewFundToken,
  updateFeeTokens
} from "./utils/fund"
import {
  getInvestorID,
  updateInvestorTokens,
  updateInvestorLiquidityTokens,
  updateInvestorVolume
} from "./utils/investor"
import { 
  getEthPriceInUSD,
  getPriceETH,
} from './utils/pricing'
import { ERC20 } from './types/templates/XXXFund2/ERC20'
import { XXXFund2 } from './types/templates/XXXFund2/XXXFund2'


export function handleManagerFeeOut(event: ManagerFeeOutEvent): void {
  const fundAddress = event.address
  const managerAddress = XXXFund2.bind(fundAddress).manager()
  const ethPriceInUSD = getEthPriceInUSD()

  let transaction = loadTransaction(event)
  let managerFeeOut = new ManagerFeeOut(event.transaction.hash.toHexString())
  managerFeeOut.transaction = transaction.id
  managerFeeOut.timestamp = transaction.timestamp
  managerFeeOut.fund = fundAddress
  managerFeeOut.manager = managerAddress
  managerFeeOut.token = event.params.token
  const symbol = ERC20.bind(Address.fromBytes(event.params.token)).try_symbol()
  if (symbol.reverted) {
    managerFeeOut.tokenSymbol = event.params.token.toHexString()
  } else {
    managerFeeOut.tokenSymbol = symbol.value
  }
  const decimals = ERC20.bind(event.params.token).decimals()
  const tokenDecimal = BigDecimal.fromString(Math.pow(10,decimals).toString())
  managerFeeOut.amount = event.params.amount.divDecimal(tokenDecimal)
  const feeOutAmountETH = getPriceETH(event.params.token, event.params.amount)
  managerFeeOut.amountETH = feeOutAmountETH
  managerFeeOut.amountUSD = managerFeeOut.amountETH.times(ethPriceInUSD)
  managerFeeOut.origin = event.transaction.from
  managerFeeOut.logIndex = event.logIndex
  managerFeeOut.save()
  
  updateEmptyFundToken(fundAddress, managerFeeOut.token)
  updateFundTokens(fundAddress)
  updateFeeTokens(fundAddress)

  // update volume must be after update tokens
  updateFundVolume(fundAddress, ethPriceInUSD)

  fundSnapshot(fundAddress, managerAddress, event)
  xxxfund2Snapshot(event)
}

export function handleDeposit(event: DepositEvent): void {
  const fundAddress = event.address
  const managerAddress = XXXFund2.bind(fundAddress).manager()
  const ethPriceInUSD = getEthPriceInUSD()

  let transaction = loadTransaction(event)
  let deposit = new Deposit(event.transaction.hash.toHexString())
  deposit.transaction = transaction.id
  deposit.timestamp = transaction.timestamp
  deposit.fund = fundAddress
  deposit.investor = event.params.investor
  deposit.token = event.params.token
  const symbol = ERC20.bind(Address.fromBytes(event.params.token)).try_symbol()
  if (symbol.reverted) {
    deposit.tokenSymbol = event.params.token.toHexString()
  } else {
    deposit.tokenSymbol = symbol.value
  }
  const decimals = ERC20.bind(event.params.token).decimals()
  const tokenDecimal = BigDecimal.fromString(Math.pow(10,decimals).toString())
  deposit.amount = event.params.amount.divDecimal(tokenDecimal)
  const depositAmountETH = getPriceETH(event.params.token, event.params.amount)
  deposit.amountETH = depositAmountETH
  deposit.amountUSD = depositAmountETH.times(ethPriceInUSD)
  deposit.origin = event.transaction.from
  deposit.logIndex = event.logIndex
  deposit.save()

  updateInvestorTokens(fundAddress, event.params.investor, ethPriceInUSD)
  updateInvestorLiquidityTokens(fundAddress, event.params.investor, ethPriceInUSD)
  updateNewFundToken(fundAddress, deposit.token, deposit.tokenSymbol)
  updateFundTokens(fundAddress)

  // update volume must be after update tokens
  updateInvestorVolume(fundAddress, event.params.investor, ethPriceInUSD)
  updateLiquidityVolume(fundAddress, event.params.investor, ethPriceInUSD)
  updateFundVolume(fundAddress, ethPriceInUSD)

  let investor = Investor.load(getInvestorID(fundAddress, event.params.investor))
  if (!investor) return
  let fund = Fund.load(fundAddress)
  if (!fund) return

  fund.principalETH = fund.principalETH.minus(investor.principalETH)
  investor.principalETH = investor.principalETH.plus(deposit.amountETH)
  fund.principalETH = fund.principalETH.plus(investor.principalETH)

  fund.principalUSD = fund.principalUSD.minus(investor.principalUSD)
  investor.principalUSD = investor.principalUSD.plus(deposit.amountUSD)
  fund.principalUSD = fund.principalUSD.plus(investor.principalUSD)

  investor.save()
  fund.save()

  // updateProfit must be after update principalETH
  updateProfit(fundAddress, event.params.investor, ethPriceInUSD)

  investorSnapshot(fundAddress, managerAddress, event.params.investor, event)
  fundSnapshot(fundAddress, managerAddress, event)
  xxxfund2Snapshot(event)
}

export function handleWithdraw(event: WithdrawEvent): void {
  const fundAddress = event.address
  const managerAddress = XXXFund2.bind(fundAddress).manager()
  const ethPriceInUSD = getEthPriceInUSD()

  let transaction = loadTransaction(event)
  let withdraw = new Withdraw(event.transaction.hash.toHexString())
  withdraw.transaction = transaction.id
  withdraw.timestamp = transaction.timestamp
  withdraw.fund = fundAddress
  withdraw.investor = event.params.investor
  withdraw.token = event.params.token
  const symbol = ERC20.bind(Address.fromBytes(event.params.token)).try_symbol()
  if (symbol.reverted) {
    withdraw.tokenSymbol = event.params.token.toHexString()
  } else {
    withdraw.tokenSymbol = symbol.value
  }
  const decimals = ERC20.bind(event.params.token).decimals()
  const tokenDecimal = BigDecimal.fromString(Math.pow(10,decimals).toString())
  withdraw.amount = event.params.amount.divDecimal(tokenDecimal)
  const withdrawAmountETH = getPriceETH(event.params.token, event.params.amount)
  withdraw.amountETH = withdrawAmountETH
  withdraw.amountUSD = withdrawAmountETH.times(ethPriceInUSD)
  withdraw.origin = event.transaction.from
  withdraw.logIndex = event.logIndex
  withdraw.save()

  updateInvestorTokens(fundAddress, event.params.investor, ethPriceInUSD)
  updateInvestorLiquidityTokens(fundAddress, event.params.investor, ethPriceInUSD)
  updateFeeTokens(fundAddress)
  updateEmptyFundToken(fundAddress, withdraw.token)
  updateFundTokens(fundAddress)

  // update volume must be after update tokens
  updateInvestorVolume(fundAddress, event.params.investor, ethPriceInUSD)
  updateLiquidityVolume(fundAddress, event.params.investor, ethPriceInUSD)
  updateFundVolume(fundAddress, ethPriceInUSD)

  let investor = Investor.load(getInvestorID(fundAddress, event.params.investor))
  if (!investor) return
  let fund = Fund.load(fundAddress)
  if (!fund) return

  const prevVolumeETH = investor.volumeETH.plus(investor.liquidityVolumeETH)
    .plus(withdraw.amountETH)
  const withdrawRatioETH = safeDiv(withdraw.amountETH, prevVolumeETH)
  const afterWithdrawETH = ONE_BD.minus(withdrawRatioETH)
  fund.principalETH = fund.principalETH.minus(investor.principalETH)
  investor.principalETH = investor.principalETH.times(afterWithdrawETH)
  fund.principalETH = fund.principalETH.plus(investor.principalETH)

  const prevVolumeUSD = investor.volumeUSD.plus(investor.liquidityVolumeUSD)
    .plus(withdraw.amountUSD)
  const withdrawRatioUSD = safeDiv(withdraw.amountUSD, prevVolumeUSD)
  const afterWithdrawUSD= ONE_BD.minus(withdrawRatioUSD)
  fund.principalUSD = fund.principalUSD.minus(investor.principalUSD)
  investor.principalUSD = investor.principalUSD.times(afterWithdrawUSD)
  fund.principalUSD = fund.principalUSD.plus(investor.principalUSD)

  investor.save()
  fund.save()

  // updateProfit must be after update principalUSD
  updateProfit(fundAddress, event.params.investor, ethPriceInUSD)

  investorSnapshot(fundAddress, managerAddress, event.params.investor, event)
  fundSnapshot(fundAddress, managerAddress, event)
  xxxfund2Snapshot(event)
}

export function handleSwap(event: SwapEvent): void {
  const fundAddress = event.address
  const managerAddress = XXXFund2.bind(fundAddress).manager()
  const ethPriceInUSD = getEthPriceInUSD()

  const tokenIn = event.params.tokenIn.toHexString()
  const tokenOut = event.params.tokenOut.toHexString()
  const tokenIndecimals = ERC20.bind(event.params.tokenIn).decimals()
  const tokenInDecimal = BigDecimal.fromString(Math.pow(10,tokenIndecimals).toString())
  const tokenOutdecimals = ERC20.bind(event.params.tokenOut).decimals()
  const tokenOutDecimal = BigDecimal.fromString(Math.pow(10,tokenOutdecimals).toString())
  const amountIn = event.params.amountIn.divDecimal(tokenInDecimal)
  const amountOut = event.params.amountOut.divDecimal(tokenOutDecimal)

  let transaction = loadTransaction(event)
  let swap = new Swap(event.transaction.hash.toHexString())
  swap.transaction = transaction.id
  swap.timestamp = transaction.timestamp
  swap.fund = fundAddress
  swap.manager = managerAddress
  swap.investor = event.params.investor
  swap.token0 = tokenIn
  swap.token1 = tokenOut
  const tokenInSymbol = ERC20.bind(Address.fromBytes(event.params.tokenIn)).try_symbol()
  if (tokenInSymbol.reverted) {
    swap.token0Symbol = event.params.tokenIn.toHexString()
  } else {
    swap.token0Symbol = tokenInSymbol.value
  }
  const tokenOutSymbol = ERC20.bind(Address.fromBytes(event.params.tokenOut)).try_symbol()
  if (tokenOutSymbol.reverted) {
    swap.token1Symbol = event.params.tokenOut.toHexString()
  } else {
    swap.token1Symbol = tokenOutSymbol.value
  }
  swap.amount0 = amountIn
  swap.amount1 = amountOut
  const swapAmountETH = getPriceETH(event.params.tokenOut, event.params.amountOut)
  swap.amountETH = swapAmountETH
  swap.amountUSD = swapAmountETH.times(ethPriceInUSD)
  swap.origin = event.transaction.from
  swap.logIndex = event.logIndex
  swap.save()

  updateInvestorTokens(fundAddress, event.params.investor, ethPriceInUSD)
  updateInvestorLiquidityTokens(fundAddress, event.params.investor, ethPriceInUSD)  
  updateEmptyFundToken(fundAddress, event.params.tokenIn)
  updateNewFundToken(fundAddress, event.params.tokenOut, swap.token1Symbol)
  updateFundTokens(fundAddress)

  // update volume must be after update tokens
  updateInvestorVolume(fundAddress, event.params.investor, ethPriceInUSD)
  updateLiquidityVolume(fundAddress, event.params.investor, ethPriceInUSD)
  updateFundVolume(fundAddress, ethPriceInUSD)
  
  updateProfit(fundAddress, event.params.investor, ethPriceInUSD)

  investorSnapshot(fundAddress, managerAddress, event.params.investor, event)
  fundSnapshot(fundAddress, managerAddress, event)
  xxxfund2Snapshot(event)
}

export function handleMintNewPosition(event: MintNewPositionEvent): void {
  const fundAddress = event.address
  const managerAddress = XXXFund2.bind(fundAddress).manager()
  const ethPriceInUSD = getEthPriceInUSD()

  const token0 = event.params.token0.toHexString()
  const token1 = event.params.token1.toHexString()
  const token0decimals = ERC20.bind(event.params.token0).decimals()
  const token0Decimal = BigDecimal.fromString(Math.pow(10,token0decimals).toString())
  const token1decimals = ERC20.bind(event.params.token1).decimals()
  const token1Decimal = BigDecimal.fromString(Math.pow(10,token1decimals).toString())
  const amount0 = event.params.amount0.divDecimal(token0Decimal)
  const amount1 = event.params.amount1.divDecimal(token1Decimal)

  let transaction = loadTransaction(event)
  let mintNewPosition = new MintNewPosition(event.transaction.hash.toHexString())
  mintNewPosition.transaction = transaction.id
  mintNewPosition.timestamp = transaction.timestamp
  mintNewPosition.fund = fundAddress
  mintNewPosition.manager = managerAddress
  mintNewPosition.investor = event.params.investor
  mintNewPosition.token0 = token0
  mintNewPosition.token1 = token1
  const token0Symbol = ERC20.bind(Address.fromBytes(event.params.token0)).try_symbol()
  if (token0Symbol.reverted) {
    mintNewPosition.token0Symbol = event.params.token0.toHexString()
  } else {
    mintNewPosition.token0Symbol = token0Symbol.value
  }
  const token1Symbol = ERC20.bind(Address.fromBytes(event.params.token1)).try_symbol()
  if (token1Symbol.reverted) {
    mintNewPosition.token1Symbol = event.params.token1.toHexString()
  } else {
    mintNewPosition.token1Symbol = token1Symbol.value
  }
  mintNewPosition.amount0 = amount0
  mintNewPosition.amount1 = amount1
  const token0AmountETH = getPriceETH(event.params.token0, event.params.amount0)
  const token1AmountETH = getPriceETH(event.params.token1, event.params.amount1)
  mintNewPosition.amountETH = token0AmountETH.plus(token1AmountETH)
  mintNewPosition.amountUSD = mintNewPosition.amountETH.times(ethPriceInUSD)
  mintNewPosition.origin = event.transaction.from
  mintNewPosition.logIndex = event.logIndex
  mintNewPosition.save()

  updateInvestorTokens(fundAddress, event.params.investor, ethPriceInUSD)
  updateInvestorLiquidityTokens(fundAddress, event.params.investor, ethPriceInUSD)
  updateFundTokens(fundAddress)

  // update volume must be after update tokens
  updateInvestorVolume(fundAddress, event.params.investor, ethPriceInUSD)
  updateLiquidityVolume(fundAddress, event.params.investor, ethPriceInUSD)
  updateFundVolume(fundAddress, ethPriceInUSD)
  
  updateProfit(fundAddress, event.params.investor, ethPriceInUSD)

  investorSnapshot(fundAddress, managerAddress, event.params.investor, event)
  fundSnapshot(fundAddress, managerAddress, event)
  xxxfund2Snapshot(event)
}

export function handleIncreaseLiquidity(event: IncreaseLiquidityEvent): void {
  const fundAddress = event.address
  const managerAddress = XXXFund2.bind(fundAddress).manager()
  const ethPriceInUSD = getEthPriceInUSD()

  const token0 = event.params.token0.toHexString()
  const token1 = event.params.token1.toHexString()
  const token0decimals = ERC20.bind(event.params.token0).decimals()
  const token0Decimal = BigDecimal.fromString(Math.pow(10,token0decimals).toString())
  const token1decimals = ERC20.bind(event.params.token1).decimals()
  const token1Decimal = BigDecimal.fromString(Math.pow(10,token1decimals).toString())
  const amount0 = event.params.amount0.divDecimal(token0Decimal)
  const amount1 = event.params.amount1.divDecimal(token1Decimal)

  let transaction = loadTransaction(event)
  let increaseLiquidity = new IncreaseLiquidity(event.transaction.hash.toHexString())
  increaseLiquidity.transaction = transaction.id
  increaseLiquidity.timestamp = transaction.timestamp
  increaseLiquidity.fund = fundAddress
  increaseLiquidity.manager = managerAddress
  increaseLiquidity.investor = event.params.investor
  increaseLiquidity.token0 = token0
  increaseLiquidity.token1 = token1
  const token0Symbol = ERC20.bind(Address.fromBytes(event.params.token0)).try_symbol()
  if (token0Symbol.reverted) {
    increaseLiquidity.token0Symbol = event.params.token0.toHexString()
  } else {
    increaseLiquidity.token0Symbol = token0Symbol.value
  }
  const token1Symbol = ERC20.bind(Address.fromBytes(event.params.token1)).try_symbol()
  if (token1Symbol.reverted) {
    increaseLiquidity.token1Symbol = event.params.token1.toHexString()
  } else {
    increaseLiquidity.token1Symbol = token1Symbol.value
  }
  increaseLiquidity.amount0 = amount0
  increaseLiquidity.amount1 = amount1
  const token0AmountETH = getPriceETH(event.params.token0, event.params.amount0)
  const token1AmountETH = getPriceETH(event.params.token1, event.params.amount1)
  increaseLiquidity.amountETH = token0AmountETH.plus(token1AmountETH)
  increaseLiquidity.amountUSD = increaseLiquidity.amountETH.times(ethPriceInUSD)
  increaseLiquidity.origin = event.transaction.from
  increaseLiquidity.logIndex = event.logIndex
  increaseLiquidity.save()

  updateInvestorTokens(fundAddress, event.params.investor, ethPriceInUSD)
  updateInvestorLiquidityTokens(fundAddress, event.params.investor, ethPriceInUSD)
  updateFundTokens(fundAddress)
  
  // update volume must be after update tokens
  updateInvestorVolume(fundAddress, event.params.investor, ethPriceInUSD)
  updateLiquidityVolume(fundAddress, event.params.investor, ethPriceInUSD)
  updateFundVolume(fundAddress, ethPriceInUSD)
  
  updateProfit(fundAddress, event.params.investor, ethPriceInUSD)

  investorSnapshot(fundAddress, managerAddress, event.params.investor, event)
  fundSnapshot(fundAddress, managerAddress, event)
  xxxfund2Snapshot(event)
}

export function handleCollectPositionFee(event: CollectPositionFeeEvent): void {
  const fundAddress = event.address
  const managerAddress = XXXFund2.bind(fundAddress).manager()
  const ethPriceInUSD = getEthPriceInUSD()

  const token0 = event.params.token0.toHexString()
  const token1 = event.params.token1.toHexString()
  const token0decimals = ERC20.bind(event.params.token0).decimals()
  const token0Decimal = BigDecimal.fromString(Math.pow(10,token0decimals).toString())
  const token1decimals = ERC20.bind(event.params.token1).decimals()
  const token1Decimal = BigDecimal.fromString(Math.pow(10,token1decimals).toString())
  const amount0 = event.params.amount0.divDecimal(token0Decimal)
  const amount1 = event.params.amount1.divDecimal(token1Decimal)

  let transaction = loadTransaction(event)
  let collectPositionFee = new CollectPositionFee(event.transaction.hash.toHexString())
  collectPositionFee.transaction = transaction.id
  collectPositionFee.timestamp = transaction.timestamp
  collectPositionFee.fund = fundAddress
  collectPositionFee.manager = managerAddress
  collectPositionFee.investor = event.params.investor
  collectPositionFee.token0 = token0
  collectPositionFee.token1 = token1
  const token0Symbol = ERC20.bind(Address.fromBytes(event.params.token0)).try_symbol()
  if (token0Symbol.reverted) {
    collectPositionFee.token0Symbol = event.params.token0.toHexString()
  } else {
    collectPositionFee.token0Symbol = token0Symbol.value
  }
  const token1Symbol = ERC20.bind(Address.fromBytes(event.params.token1)).try_symbol()
  if (token1Symbol.reverted) {
    collectPositionFee.token1Symbol = event.params.token1.toHexString()
  } else {
    collectPositionFee.token1Symbol = token1Symbol.value
  }
  collectPositionFee.amount0 = amount0
  collectPositionFee.amount1 = amount1
  const token0AmountETH = getPriceETH(event.params.token0, event.params.amount0)
  const token1AmountETH = getPriceETH(event.params.token1, event.params.amount1)
  collectPositionFee.amountETH = token0AmountETH.plus(token1AmountETH)
  collectPositionFee.amountUSD = collectPositionFee.amountETH.times(ethPriceInUSD)
  collectPositionFee.origin = event.transaction.from
  collectPositionFee.logIndex = event.logIndex
  collectPositionFee.save()

  updateInvestorTokens(fundAddress, event.params.investor, ethPriceInUSD)
  updateInvestorLiquidityTokens(fundAddress, event.params.investor, ethPriceInUSD)
  updateFundTokens(fundAddress)

  // update volume must be after update tokens
  updateInvestorVolume(fundAddress, event.params.investor, ethPriceInUSD)
  updateLiquidityVolume(fundAddress, event.params.investor, ethPriceInUSD)
  updateFundVolume(fundAddress, ethPriceInUSD)
  
  updateProfit(fundAddress, event.params.investor, ethPriceInUSD)

  investorSnapshot(fundAddress, managerAddress, event.params.investor, event)
  fundSnapshot(fundAddress, managerAddress, event)
  xxxfund2Snapshot(event)
}

export function handleDecreaseLiquidity(event: DecreaseLiquidityEvent): void {
  const fundAddress = event.address
  const managerAddress = XXXFund2.bind(fundAddress).manager()
  const ethPriceInUSD = getEthPriceInUSD()

  const token0 = event.params.token0.toHexString()
  const token1 = event.params.token1.toHexString()
  const token0decimals = ERC20.bind(event.params.token0).decimals()
  const token0Decimal = BigDecimal.fromString(Math.pow(10,token0decimals).toString())
  const token1decimals = ERC20.bind(event.params.token1).decimals()
  const token1Decimal = BigDecimal.fromString(Math.pow(10,token1decimals).toString())
  const amount0 = event.params.amount0.divDecimal(token0Decimal)
  const amount1 = event.params.amount1.divDecimal(token1Decimal)

  let transaction = loadTransaction(event)
  let decreaseLiquidity = new DecreaseLiquidity(event.transaction.hash.toHexString())
  decreaseLiquidity.transaction = transaction.id
  decreaseLiquidity.timestamp = transaction.timestamp
  decreaseLiquidity.fund = fundAddress
  decreaseLiquidity.manager = managerAddress
  decreaseLiquidity.investor = event.params.investor
  decreaseLiquidity.token0 = token0
  decreaseLiquidity.token1 = token1
  const token0Symbol = ERC20.bind(Address.fromBytes(event.params.token0)).try_symbol()
  if (token0Symbol.reverted) {
    decreaseLiquidity.token0Symbol = event.params.token0.toHexString()
  } else {
    decreaseLiquidity.token0Symbol = token0Symbol.value
  }
  const token1Symbol = ERC20.bind(Address.fromBytes(event.params.token1)).try_symbol()
  if (token1Symbol.reverted) {
    decreaseLiquidity.token1Symbol = event.params.token1.toHexString()
  } else {
    decreaseLiquidity.token1Symbol = token1Symbol.value
  }
  decreaseLiquidity.amount0 = amount0
  decreaseLiquidity.amount1 = amount1
  const token0AmountETH = getPriceETH(event.params.token0, event.params.amount0)
  const token1AmountETH = getPriceETH(event.params.token1, event.params.amount1)
  decreaseLiquidity.amountETH = token0AmountETH.plus(token1AmountETH)
  decreaseLiquidity.amountUSD = decreaseLiquidity.amountETH.times(ethPriceInUSD)
  decreaseLiquidity.origin = event.transaction.from
  decreaseLiquidity.logIndex = event.logIndex
  decreaseLiquidity.save()

  updateInvestorTokens(fundAddress, event.params.investor, ethPriceInUSD)
  updateInvestorLiquidityTokens(fundAddress, event.params.investor, ethPriceInUSD)
  updateFundTokens(fundAddress)

  // update volume must be after update tokens
  updateInvestorVolume(fundAddress, event.params.investor, ethPriceInUSD)
  updateLiquidityVolume(fundAddress, event.params.investor, ethPriceInUSD)
  updateFundVolume(fundAddress, ethPriceInUSD)
  
  updateProfit(fundAddress, event.params.investor, ethPriceInUSD)

  investorSnapshot(fundAddress, managerAddress, event.params.investor, event)
  fundSnapshot(fundAddress, managerAddress, event)
  xxxfund2Snapshot(event)
}
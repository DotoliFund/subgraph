import { Address, BigInt, log } from "@graphprotocol/graph-ts"
import {
  Deposit as DepositEvent,
  Withdraw as WithdrawEvent,
  Swap as SwapEvent,
  WithdrawFee as WithdrawFeeEvent,
  MintNewPosition as MintNewPositionEvent,
  IncreaseLiquidity as IncreaseLiquidityEvent,
  CollectPositionFee as CollectPositionFeeEvent,
  DecreaseLiquidity as DecreaseLiquidityEvent
} from './types/DotoliFund/DotoliFund'
import {
  Fund,
  Deposit,
  Withdraw,
  Swap,
  WithdrawFee,
  MintNewPosition,
  IncreaseLiquidity,
  CollectPositionFee,
  DecreaseLiquidity
} from "./types/schema"
import { 
  TYPE_DEPOSIT, 
  TYPE_WITHDRAW, 
  TYPE_NORMAL, 
  ZERO_BD,
  DOTOLI_INFO_ADDRESS,
} from './utils/constants'
import { updateUpdatedAtTime, exponentToBigDecimal } from "./utils"
import { 
  fundSnapshot,
  investorSnapshot,
  infoSnapshot
} from './utils/snapshots'
import {
  updateFundCurrent,
  updateEmptyFundToken,
  updateNewFundToken,
  updateFundFee
} from "./utils/fund"
import {
  updateInvestor,
  updateInvestorProfit,
} from "./utils/investor"
import { 
  getEthPriceInUSD,
  getTokenPriceETH,
} from './utils/pricing'
import { fetchTokenSymbol, fetchTokenDecimals } from './utils/token'
import { DotoliInfo } from "./types/DotoliInfo/DotoliInfo"


export function handleDeposit(event: DepositEvent): void {
  const fundId = event.params.fundId
  const managerAddress = DotoliInfo.bind(Address.fromString(DOTOLI_INFO_ADDRESS))
    .manager(fundId)
  
  let deposit = new Deposit(event.transaction.hash.toHexString())
  deposit.timestamp = event.block.timestamp
  deposit.fundId = fundId.toString()
  deposit.manager = managerAddress
  deposit.investor = event.params.investor
  deposit.token = event.params.token
  deposit.tokenSymbol = fetchTokenSymbol(event.params.token)
  const decimals = fetchTokenDecimals(event.params.token)
  if (decimals === null) {
    log.debug('the decimals on {} token was null', [event.params.token.toHexString()])
    return
  }

  const tokenDecimal = exponentToBigDecimal(decimals)
  const tokenPriceETH = getTokenPriceETH(event.params.token)
  if (tokenPriceETH === null) return
  const ethPriceInUSD = getEthPriceInUSD()

  deposit.amount = event.params.amount.divDecimal(tokenDecimal)
  deposit.amountETH = deposit.amount.times(tokenPriceETH)
  deposit.amountUSD =  deposit.amountETH.times(ethPriceInUSD)
  deposit.save()

  updateInvestor(fundId, event.params.investor, ethPriceInUSD)
  updateNewFundToken(
    fundId,
    deposit.token,
    deposit.tokenSymbol,
    BigInt.fromString(decimals.toString())
  )
  // update fund current must be after update tokens
  updateFundCurrent(fundId, ethPriceInUSD)
  updateInvestorProfit(
    fundId,
    event.params.investor,
    ethPriceInUSD,
    TYPE_DEPOSIT,
    deposit.amountETH,
    deposit.amountUSD
  )
  updateUpdatedAtTime(fundId, event.params.investor, event.block.timestamp)

  investorSnapshot(fundId, managerAddress, event.params.investor, ethPriceInUSD, event)
  fundSnapshot(fundId, managerAddress, event, ethPriceInUSD)
  infoSnapshot(event)
}

export function handleWithdraw(event: WithdrawEvent): void {
  const fundId = event.params.fundId
  const managerAddress = DotoliInfo.bind(Address.fromString(DOTOLI_INFO_ADDRESS))
    .manager(fundId)

  let withdraw = new Withdraw(event.transaction.hash.toHexString())
  withdraw.timestamp = event.block.timestamp
  withdraw.fundId = fundId.toString()
  withdraw.manager = managerAddress
  withdraw.investor = event.params.investor
  withdraw.token = event.params.token
  withdraw.tokenSymbol = fetchTokenSymbol(event.params.token)
  const decimals = fetchTokenDecimals(event.params.token)
  if (decimals === null) {
    log.debug('the decimals on {} token was null', [event.params.token.toHexString()])
    return
  }
  const tokenDecimal = exponentToBigDecimal(decimals)
  const tokenPriceETH = getTokenPriceETH(event.params.token)
  if (tokenPriceETH === null) return
  const ethPriceInUSD = getEthPriceInUSD()
  withdraw.amount = event.params.amount.divDecimal(tokenDecimal)
  withdraw.amountETH = withdraw.amount.times(tokenPriceETH)
  withdraw.amountUSD = withdraw.amountETH.times(ethPriceInUSD)
  withdraw.save()

  updateInvestor(fundId, event.params.investor, ethPriceInUSD)
  updateFundFee(fundId)
  updateEmptyFundToken(fundId, withdraw.token)
  // update volume must be after update tokens
  updateFundCurrent(fundId, ethPriceInUSD)
  updateInvestorProfit(
    fundId,
    event.params.investor,
    ethPriceInUSD,
    TYPE_WITHDRAW,
    withdraw.amountETH,
    withdraw.amountUSD
  )
  updateUpdatedAtTime(fundId, event.params.investor, event.block.timestamp)

  investorSnapshot(fundId, managerAddress, event.params.investor, ethPriceInUSD, event)
  fundSnapshot(fundId, managerAddress, event, ethPriceInUSD)
  infoSnapshot(event)
}

export function handleSwap(event: SwapEvent): void {
  const fundId = event.params.fundId
  const managerAddress = DotoliInfo.bind(Address.fromString(DOTOLI_INFO_ADDRESS))
    .manager(fundId)

  const tokenIn = event.params.tokenIn.toHexString()
  const tokenOut = event.params.tokenOut.toHexString()

  let swap = new Swap(event.transaction.hash.toHexString())
  swap.timestamp = event.block.timestamp
  swap.fundId = fundId.toString()
  swap.manager = managerAddress
  swap.investor = event.params.investor
  swap.token0 = tokenIn
  swap.token1 = tokenOut
  swap.token0Symbol = fetchTokenSymbol(event.params.tokenIn)
  swap.token1Symbol = fetchTokenSymbol(event.params.tokenOut)

  const tokenIndecimals = fetchTokenDecimals(event.params.tokenIn)
  if (tokenIndecimals === null) {
    log.debug('the decimals on {} token was null', [event.params.tokenIn.toHexString()])
    return
  }
  const tokenInDecimal = exponentToBigDecimal(tokenIndecimals)
  const tokenOutdecimals = fetchTokenDecimals(event.params.tokenOut)
  if (tokenOutdecimals === null) {
    log.debug('the decimals on {} token was null', [event.params.tokenOut.toHexString()])
    return
  }
  const tokenOutDecimal = exponentToBigDecimal(tokenOutdecimals)
  const amountIn = event.params.amountIn.divDecimal(tokenInDecimal)
  const amountOut = event.params.amountOut.divDecimal(tokenOutDecimal)
  swap.amount0 = amountIn
  swap.amount1 = amountOut
  const tokenOutPriceETH = getTokenPriceETH(event.params.tokenOut)
  if (tokenOutPriceETH === null) return
  const ethPriceInUSD = getEthPriceInUSD()
  swap.amountETH = amountOut.times(tokenOutPriceETH)
  swap.amountUSD = swap.amountETH.times(ethPriceInUSD)
  swap.save()

  updateInvestor(fundId, event.params.investor, ethPriceInUSD)
  updateEmptyFundToken(fundId, event.params.tokenIn)
  updateNewFundToken(
    fundId,
    event.params.tokenOut,
    swap.token1Symbol,
    tokenOutdecimals
  )
  // update volume must be after update tokens
  updateFundCurrent(fundId, ethPriceInUSD)
  updateInvestorProfit(fundId, event.params.investor, ethPriceInUSD, TYPE_NORMAL, ZERO_BD, ZERO_BD)
  updateUpdatedAtTime(fundId, event.params.investor, event.block.timestamp)

  investorSnapshot(fundId, managerAddress, event.params.investor, ethPriceInUSD, event)
  fundSnapshot(fundId, managerAddress, event, ethPriceInUSD)
  infoSnapshot(event)
}

export function handleWithdrawFee(event: WithdrawFeeEvent): void {
  const fundId = event.params.fundId
  const managerAddress = DotoliInfo.bind(Address.fromString(DOTOLI_INFO_ADDRESS))
    .manager(fundId)

  let withdrawFee = new WithdrawFee(event.transaction.hash.toHexString())
  withdrawFee.timestamp = event.block.timestamp
  withdrawFee.fundId = fundId.toString()
  withdrawFee.manager = managerAddress
  withdrawFee.token = event.params.token
  withdrawFee.tokenSymbol = fetchTokenSymbol(event.params.token)
  const decimals = fetchTokenDecimals(event.params.token)
  if (decimals === null) {
    log.debug('the decimals on {} token was null', [event.params.token.toHexString()])
    return
  }
  const tokenDecimal = exponentToBigDecimal(decimals)
  const tokenPriceETH = getTokenPriceETH(event.params.token)
  if (tokenPriceETH === null) return
  const ethPriceInUSD = getEthPriceInUSD()
  withdrawFee.amount = event.params.amount.divDecimal(tokenDecimal)
  withdrawFee.amountETH = withdrawFee.amount.times(tokenPriceETH)
  withdrawFee.amountUSD = withdrawFee.amountETH.times(ethPriceInUSD)
  withdrawFee.save()
  
  updateEmptyFundToken(fundId, withdrawFee.token)
  updateFundFee(fundId)
  // update current must be after update tokens
  updateFundCurrent(fundId, ethPriceInUSD)

  let fund = Fund.load(fundId.toString())
  if (!fund) return
  fund.updatedAtTimestamp = event.block.timestamp
  fund.save()

  fundSnapshot(fundId, managerAddress, event, ethPriceInUSD)
  infoSnapshot(event)
}

export function handleMintNewPosition(event: MintNewPositionEvent): void {
  const fundId = event.params.fundId
  const managerAddress = DotoliInfo.bind(Address.fromString(DOTOLI_INFO_ADDRESS))
    .manager(fundId)

  const token0 = event.params.token0.toHexString()
  const token1 = event.params.token1.toHexString()
  const token0decimals = fetchTokenDecimals(event.params.token0)
  if (token0decimals === null) {
    log.debug('the decimals on {} token was null', [event.params.token0.toHexString()])
    return
  }
  const token0Decimal = exponentToBigDecimal(token0decimals)
  const token1decimals = fetchTokenDecimals(event.params.token1)
  if (token1decimals === null) {
    log.debug('the decimals on {} token was null', [event.params.token1.toHexString()])
    return
  }
  const token1Decimal = exponentToBigDecimal(token1decimals)
  const amount0 = event.params.amount0.divDecimal(token0Decimal)
  const amount1 = event.params.amount1.divDecimal(token1Decimal)

  let mintNewPosition = new MintNewPosition(event.transaction.hash.toHexString())
  mintNewPosition.timestamp = event.block.timestamp
  mintNewPosition.fundId = fundId.toString()
  mintNewPosition.manager = managerAddress
  mintNewPosition.investor = event.params.investor
  mintNewPosition.token0 = token0
  mintNewPosition.token1 = token1
  mintNewPosition.token0Symbol = fetchTokenSymbol(event.params.token0)
  mintNewPosition.token1Symbol = fetchTokenSymbol(event.params.token1)
  mintNewPosition.amount0 = amount0
  mintNewPosition.amount1 = amount1
  const token0PriceETH = getTokenPriceETH(event.params.token0)
  if (token0PriceETH === null) return
  const token1PriceETH = getTokenPriceETH(event.params.token1)
  if (token1PriceETH === null) return
  const ethPriceInUSD = getEthPriceInUSD()
  const token0AmountETH = amount0.times(token0PriceETH)
  const token1AmountETH = amount1.times(token1PriceETH)
  mintNewPosition.amountETH = token0AmountETH.plus(token1AmountETH)
  mintNewPosition.amountUSD = mintNewPosition.amountETH.times(ethPriceInUSD)
  mintNewPosition.save()

  updateInvestor(fundId, event.params.investor, ethPriceInUSD)
  updateFundCurrent(fundId, ethPriceInUSD)
  updateInvestorProfit(fundId, event.params.investor, ethPriceInUSD, TYPE_NORMAL, ZERO_BD, ZERO_BD)
  updateUpdatedAtTime(fundId, event.params.investor, event.block.timestamp)

  investorSnapshot(fundId, managerAddress, event.params.investor, ethPriceInUSD, event)
  fundSnapshot(fundId, managerAddress, event, ethPriceInUSD)
  infoSnapshot(event)
}

export function handleIncreaseLiquidity(event: IncreaseLiquidityEvent): void {
  const fundId = event.params.fundId
  const managerAddress = DotoliInfo.bind(Address.fromString(DOTOLI_INFO_ADDRESS))
    .manager(fundId)

  const token0 = event.params.token0.toHexString()
  const token1 = event.params.token1.toHexString()
  const token0decimals = fetchTokenDecimals(event.params.token0)
  if (token0decimals === null) {
    log.debug('the decimals on {} token was null', [event.params.token0.toHexString()])
    return
  }
  const token0Decimal = exponentToBigDecimal(token0decimals)
  const token1decimals = fetchTokenDecimals(event.params.token1)
  if (token1decimals === null) {
    log.debug('the decimals on {} token was null', [event.params.token1.toHexString()])
    return
  }
  const token1Decimal = exponentToBigDecimal(token1decimals)
  const amount0 = event.params.amount0.divDecimal(token0Decimal)
  const amount1 = event.params.amount1.divDecimal(token1Decimal)

  let increaseLiquidity = new IncreaseLiquidity(event.transaction.hash.toHexString())
  increaseLiquidity.timestamp = event.block.timestamp
  increaseLiquidity.fundId = fundId.toString()
  increaseLiquidity.manager = managerAddress
  increaseLiquidity.investor = event.params.investor
  increaseLiquidity.token0 = token0
  increaseLiquidity.token1 = token1
  increaseLiquidity.token0Symbol = fetchTokenSymbol(event.params.token0)
  increaseLiquidity.token1Symbol = fetchTokenSymbol(event.params.token1)
  increaseLiquidity.amount0 = amount0
  increaseLiquidity.amount1 = amount1
  const token0PriceETH = getTokenPriceETH(event.params.token0)
  if (token0PriceETH === null) return
  const token1PriceETH = getTokenPriceETH(event.params.token1)
  if (token1PriceETH === null) return
  const ethPriceInUSD = getEthPriceInUSD()
  const token0AmountETH = amount0.times(token0PriceETH)
  const token1AmountETH = amount1.times(token1PriceETH)
  increaseLiquidity.amountETH = token0AmountETH.plus(token1AmountETH)
  increaseLiquidity.amountUSD = increaseLiquidity.amountETH.times(ethPriceInUSD)
  increaseLiquidity.save()

  updateInvestor(fundId, event.params.investor, ethPriceInUSD)
  updateFundCurrent(fundId, ethPriceInUSD)
  updateInvestorProfit(fundId, event.params.investor, ethPriceInUSD, TYPE_NORMAL, ZERO_BD, ZERO_BD)
  updateUpdatedAtTime(fundId, event.params.investor, event.block.timestamp)

  investorSnapshot(fundId, managerAddress, event.params.investor, ethPriceInUSD, event)
  fundSnapshot(fundId, managerAddress, event, ethPriceInUSD)
  infoSnapshot(event)
}

export function handleCollectPositionFee(event: CollectPositionFeeEvent): void {
  const fundId = event.params.fundId
  const managerAddress = DotoliInfo.bind(Address.fromString(DOTOLI_INFO_ADDRESS))
    .manager(fundId)

  const token0 = event.params.token0.toHexString()
  const token1 = event.params.token1.toHexString()
  const token0decimals = fetchTokenDecimals(event.params.token0)
  if (token0decimals === null) {
    log.debug('the decimals on {} token was null', [event.params.token0.toHexString()])
    return
  }
  const token0Decimal = exponentToBigDecimal(token0decimals)
  const token1decimals = fetchTokenDecimals(event.params.token1)
  if (token1decimals === null) {
    log.debug('the decimals on {} token was null', [event.params.token1.toHexString()])
    return
  }
  const token1Decimal = exponentToBigDecimal(token1decimals)
  const amount0 = event.params.amount0.divDecimal(token0Decimal)
  const amount1 = event.params.amount1.divDecimal(token1Decimal)

  let collectPositionFee = new CollectPositionFee(event.transaction.hash.toHexString())
  collectPositionFee.timestamp = event.block.timestamp
  collectPositionFee.fundId = fundId.toString()
  collectPositionFee.manager = managerAddress
  collectPositionFee.investor = event.params.investor
  collectPositionFee.token0 = token0
  collectPositionFee.token1 = token1
  collectPositionFee.token0Symbol = fetchTokenSymbol(event.params.token0)
  collectPositionFee.token1Symbol = fetchTokenSymbol(event.params.token1)
  collectPositionFee.amount0 = amount0
  collectPositionFee.amount1 = amount1
  const token0PriceETH = getTokenPriceETH(event.params.token0)
  if (token0PriceETH === null) return
  const token1PriceETH = getTokenPriceETH(event.params.token1)
  if (token1PriceETH === null) return
  const ethPriceInUSD = getEthPriceInUSD()
  const token0AmountETH = amount0.times(token0PriceETH)
  const token1AmountETH = amount1.times(token1PriceETH)
  collectPositionFee.amountETH = token0AmountETH.plus(token1AmountETH)
  collectPositionFee.amountUSD = collectPositionFee.amountETH.times(ethPriceInUSD)
  collectPositionFee.save()

  updateInvestor(fundId, event.params.investor, ethPriceInUSD)
  updateFundCurrent(fundId, ethPriceInUSD)
  updateInvestorProfit(fundId, event.params.investor, ethPriceInUSD, TYPE_NORMAL, ZERO_BD, ZERO_BD)
  updateUpdatedAtTime(fundId, event.params.investor, event.block.timestamp)

  investorSnapshot(fundId, managerAddress, event.params.investor, ethPriceInUSD, event)
  fundSnapshot(fundId, managerAddress, event, ethPriceInUSD)
  infoSnapshot(event)
}

export function handleDecreaseLiquidity(event: DecreaseLiquidityEvent): void {
  const fundId = event.params.fundId
  const managerAddress = DotoliInfo.bind(Address.fromString(DOTOLI_INFO_ADDRESS))
    .manager(fundId)

  const token0 = event.params.token0.toHexString()
  const token1 = event.params.token1.toHexString()
  const token0decimals = fetchTokenDecimals(event.params.token0)
  if (token0decimals === null) {
    log.debug('the decimals on {} token was null', [event.params.token0.toHexString()])
    return
  }
  const token0Decimal = exponentToBigDecimal(token0decimals)
  const token1decimals = fetchTokenDecimals(event.params.token1)
  if (token1decimals === null) {
    log.debug('the decimals on {} token was null', [event.params.token1.toHexString()])
    return
  }
  const token1Decimal = exponentToBigDecimal(token1decimals)
  const amount0 = event.params.amount0.divDecimal(token0Decimal)
  const amount1 = event.params.amount1.divDecimal(token1Decimal)

  let decreaseLiquidity = new DecreaseLiquidity(event.transaction.hash.toHexString())
  decreaseLiquidity.timestamp = event.block.timestamp
  decreaseLiquidity.fundId = fundId.toString()
  decreaseLiquidity.manager = managerAddress
  decreaseLiquidity.investor = event.params.investor
  decreaseLiquidity.token0 = token0
  decreaseLiquidity.token1 = token1
  decreaseLiquidity.token0Symbol = fetchTokenSymbol(event.params.token0)
  decreaseLiquidity.token1Symbol = fetchTokenSymbol(event.params.token1)
  decreaseLiquidity.amount0 = amount0
  decreaseLiquidity.amount1 = amount1
  const token0PriceETH = getTokenPriceETH(event.params.token0)
  if (token0PriceETH === null) return
  const token1PriceETH = getTokenPriceETH(event.params.token1)
  if (token1PriceETH === null) return
  const ethPriceInUSD = getEthPriceInUSD()
  const token0AmountETH = amount0.times(token0PriceETH)
  const token1AmountETH = amount1.times(token1PriceETH)
  decreaseLiquidity.amountETH = token0AmountETH.plus(token1AmountETH)
  decreaseLiquidity.amountUSD = decreaseLiquidity.amountETH.times(ethPriceInUSD)
  decreaseLiquidity.save()

  updateInvestor(fundId, event.params.investor, ethPriceInUSD)
  updateFundCurrent(fundId, ethPriceInUSD)
  updateInvestorProfit(fundId, event.params.investor, ethPriceInUSD, TYPE_NORMAL, ZERO_BD, ZERO_BD)
  updateUpdatedAtTime(fundId, event.params.investor, event.block.timestamp)

  investorSnapshot(fundId, managerAddress, event.params.investor, ethPriceInUSD, event)
  fundSnapshot(fundId, managerAddress, event, ethPriceInUSD)
  infoSnapshot(event)
}
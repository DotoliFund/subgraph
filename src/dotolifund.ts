import { BigDecimal, Address, BigInt, log } from "@graphprotocol/graph-ts"
import {
  ManagerFeeOut as ManagerFeeOutEvent,
  Deposit as DepositEvent,
  Withdraw as WithdrawEvent,
  Swap as SwapEvent,
  MintNewPosition as MintNewPositionEvent,
  IncreaseLiquidity as IncreaseLiquidityEvent,
  CollectPositionFee as CollectPositionFeeEvent,
  DecreaseLiquidity as DecreaseLiquidityEvent
} from './types/templates/DotoliFund/DotoliFund'
import {
  Fund,
  ManagerFeeOut,
  Deposit,
  Withdraw,
  Swap,
  MintNewPosition,
  IncreaseLiquidity,
  CollectPositionFee,
  DecreaseLiquidity
} from "./types/schema"
import { TYPE_DEPOSIT, TYPE_WITHDRAW, TYPE_NORMAL, ZERO_BD } from './utils/constants'
import { updateUpdatedAtTime } from "./utils"
import { 
  fundSnapshot,
  investorSnapshot,
  factorySnapshot
} from './utils/snapshots'
import {
  updateFundCurrent,
  updateEmptyFundToken,
  updateNewFundToken,
  updateFundFee
} from "./utils/fund"
import {
  updateInvestor,
  updateInvestorProfit
} from "./utils/investor"
import { 
  getEthPriceInUSD,
  getTokenPriceETH,
} from './utils/pricing'
import { ERC20 } from './types/templates/DotoliFund/ERC20'
import { DotoliFund } from './types/templates/DotoliFund/DotoliFund'


export function handleManagerFeeOut(event: ManagerFeeOutEvent): void {
  const fundAddress = event.address
  const managerAddress = DotoliFund.bind(fundAddress).manager()
  const ethPriceInUSD = getEthPriceInUSD()

  let managerFeeOut = new ManagerFeeOut(event.transaction.hash.toHexString())
  managerFeeOut.timestamp = event.block.timestamp
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
  const tokenPriceETH = getTokenPriceETH(event.params.token)
  managerFeeOut.amount = event.params.amount.divDecimal(tokenDecimal)
  managerFeeOut.amountETH = managerFeeOut.amount.times(tokenPriceETH)
  managerFeeOut.amountUSD = managerFeeOut.amountETH.times(ethPriceInUSD)
  managerFeeOut.save()
  
  updateEmptyFundToken(fundAddress, managerFeeOut.token)
  updateFundFee(fundAddress)
  // update current must be after update tokens
  updateFundCurrent(fundAddress, ethPriceInUSD)

  let fund = Fund.load(fundAddress)
  if (!fund) return
  fund.updatedAtTimestamp = event.block.timestamp
  fund.save()

  fundSnapshot(fundAddress, managerAddress, event, ethPriceInUSD)
  factorySnapshot(event)
}

export function handleDeposit(event: DepositEvent): void {
  const fundAddress = event.address
  const managerAddress = DotoliFund.bind(fundAddress).manager()
  const ethPriceInUSD = getEthPriceInUSD()

  let deposit = new Deposit(event.transaction.hash.toHexString())
  deposit.timestamp = event.block.timestamp
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
  const tokenPriceETH = getTokenPriceETH(event.params.token)
  deposit.amount = event.params.amount.divDecimal(tokenDecimal)
  deposit.amountETH = deposit.amount.times(tokenPriceETH)
  deposit.amountUSD =  deposit.amountETH.times(ethPriceInUSD)
  deposit.save()

  updateInvestor(fundAddress, event.params.investor, ethPriceInUSD)
  updateNewFundToken(
    fundAddress,
    deposit.token,
    deposit.tokenSymbol,
    BigInt.fromString(decimals.toString())
  )
  // update fund current must be after update tokens
  updateFundCurrent(fundAddress, ethPriceInUSD)
  updateInvestorProfit(
    fundAddress,
    event.params.investor,
    ethPriceInUSD,
    TYPE_DEPOSIT,
    deposit.amountETH,
    deposit.amountUSD
  )
  updateUpdatedAtTime(fundAddress, event.params.investor, event.block.timestamp)

  investorSnapshot(fundAddress, managerAddress, event.params.investor, ethPriceInUSD, event)
  fundSnapshot(fundAddress, managerAddress, event, ethPriceInUSD)
  factorySnapshot(event)
}

export function handleWithdraw(event: WithdrawEvent): void {
  const fundAddress = event.address
  const managerAddress = DotoliFund.bind(fundAddress).manager()
  const ethPriceInUSD = getEthPriceInUSD()

  let withdraw = new Withdraw(event.transaction.hash.toHexString())
  withdraw.timestamp = event.block.timestamp
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
  const tokenPriceETH = getTokenPriceETH(event.params.token)
  withdraw.amount = event.params.amount.divDecimal(tokenDecimal)
  withdraw.amountETH = withdraw.amount.times(tokenPriceETH)
  withdraw.amountUSD = withdraw.amountETH.times(ethPriceInUSD)
  withdraw.save()

  updateInvestor(fundAddress, event.params.investor, ethPriceInUSD)
  updateFundFee(fundAddress)
  updateEmptyFundToken(fundAddress, withdraw.token)
  // update volume must be after update tokens
  updateFundCurrent(fundAddress, ethPriceInUSD)
  updateInvestorProfit(
    fundAddress,
    event.params.investor,
    ethPriceInUSD,
    TYPE_WITHDRAW,
    withdraw.amountETH,
    withdraw.amountUSD
  )
  updateUpdatedAtTime(fundAddress, event.params.investor, event.block.timestamp)

  investorSnapshot(fundAddress, managerAddress, event.params.investor, ethPriceInUSD, event)
  fundSnapshot(fundAddress, managerAddress, event, ethPriceInUSD)
  factorySnapshot(event)
}

export function handleSwap(event: SwapEvent): void {
  const fundAddress = event.address
  const managerAddress = DotoliFund.bind(fundAddress).manager()
  const ethPriceInUSD = getEthPriceInUSD()

  const tokenIn = event.params.tokenIn.toHexString()
  const tokenOut = event.params.tokenOut.toHexString()
  const tokenIndecimals = ERC20.bind(event.params.tokenIn).decimals()
  const tokenInDecimal = BigDecimal.fromString(Math.pow(10,tokenIndecimals).toString())
  const tokenOutdecimals = ERC20.bind(event.params.tokenOut).decimals()
  const tokenOutDecimal = BigDecimal.fromString(Math.pow(10,tokenOutdecimals).toString())
  const amountIn = event.params.amountIn.divDecimal(tokenInDecimal)
  const amountOut = event.params.amountOut.divDecimal(tokenOutDecimal)

  let swap = new Swap(event.transaction.hash.toHexString())
  swap.timestamp = event.block.timestamp
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
  const tokenOutDecimals = ERC20.bind(Address.fromBytes(event.params.tokenOut)).try_decimals()
  let _tokenOutDecimals = BigInt.fromString('0')
  if (!tokenOutDecimals.reverted) {
    _tokenOutDecimals = BigInt.fromString(tokenOutDecimals.value.toString())
  }
  swap.amount0 = amountIn
  swap.amount1 = amountOut
  const tokenOutPriceETH = getTokenPriceETH(event.params.tokenOut)
  swap.amountETH = amountOut.times(tokenOutPriceETH)
  swap.amountUSD = swap.amountETH.times(ethPriceInUSD)
  swap.save()

  updateInvestor(fundAddress, event.params.investor, ethPriceInUSD)
  updateEmptyFundToken(fundAddress, event.params.tokenIn)
  updateNewFundToken(
    fundAddress,
    event.params.tokenOut,
    swap.token1Symbol,
    _tokenOutDecimals
  )
  // update volume must be after update tokens
  updateFundCurrent(fundAddress, ethPriceInUSD)
  updateInvestorProfit(fundAddress, event.params.investor, ethPriceInUSD, TYPE_NORMAL, ZERO_BD, ZERO_BD)
  updateUpdatedAtTime(fundAddress, event.params.investor, event.block.timestamp)

  investorSnapshot(fundAddress, managerAddress, event.params.investor, ethPriceInUSD, event)
  fundSnapshot(fundAddress, managerAddress, event, ethPriceInUSD)
  factorySnapshot(event)
}

export function handleMintNewPosition(event: MintNewPositionEvent): void {
  const fundAddress = event.address
  const managerAddress = DotoliFund.bind(fundAddress).manager()
  const ethPriceInUSD = getEthPriceInUSD()

  const token0 = event.params.token0.toHexString()
  const token1 = event.params.token1.toHexString()
  const token0decimals = ERC20.bind(event.params.token0).decimals()
  const token0Decimal = BigDecimal.fromString(Math.pow(10,token0decimals).toString())
  const token1decimals = ERC20.bind(event.params.token1).decimals()
  const token1Decimal = BigDecimal.fromString(Math.pow(10,token1decimals).toString())
  const amount0 = event.params.amount0.divDecimal(token0Decimal)
  const amount1 = event.params.amount1.divDecimal(token1Decimal)

  let mintNewPosition = new MintNewPosition(event.transaction.hash.toHexString())
  mintNewPosition.timestamp = event.block.timestamp
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
  const token0PriceETH = getTokenPriceETH(event.params.token0)
  const token1PriceETH = getTokenPriceETH(event.params.token1)
  const token0AmountETH = amount0.times(token0PriceETH)
  const token1AmountETH = amount1.times(token1PriceETH)
  mintNewPosition.amountETH = token0AmountETH.plus(token1AmountETH)
  mintNewPosition.amountUSD = mintNewPosition.amountETH.times(ethPriceInUSD)
  mintNewPosition.save()

  updateInvestor(fundAddress, event.params.investor, ethPriceInUSD)
  updateFundCurrent(fundAddress, ethPriceInUSD)
  updateInvestorProfit(fundAddress, event.params.investor, ethPriceInUSD, TYPE_NORMAL, ZERO_BD, ZERO_BD)
  updateUpdatedAtTime(fundAddress, event.params.investor, event.block.timestamp)

  investorSnapshot(fundAddress, managerAddress, event.params.investor, ethPriceInUSD, event)
  fundSnapshot(fundAddress, managerAddress, event, ethPriceInUSD)
  factorySnapshot(event)
}

export function handleIncreaseLiquidity(event: IncreaseLiquidityEvent): void {
  const fundAddress = event.address
  const managerAddress = DotoliFund.bind(fundAddress).manager()
  const ethPriceInUSD = getEthPriceInUSD()

  const token0 = event.params.token0.toHexString()
  const token1 = event.params.token1.toHexString()
  const token0decimals = ERC20.bind(event.params.token0).decimals()
  const token0Decimal = BigDecimal.fromString(Math.pow(10,token0decimals).toString())
  const token1decimals = ERC20.bind(event.params.token1).decimals()
  const token1Decimal = BigDecimal.fromString(Math.pow(10,token1decimals).toString())
  const amount0 = event.params.amount0.divDecimal(token0Decimal)
  const amount1 = event.params.amount1.divDecimal(token1Decimal)

  let increaseLiquidity = new IncreaseLiquidity(event.transaction.hash.toHexString())
  increaseLiquidity.timestamp = event.block.timestamp
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
  const token0PriceETH = getTokenPriceETH(event.params.token0)
  const token1PriceETH = getTokenPriceETH(event.params.token1)
  const token0AmountETH = amount0.times(token0PriceETH)
  const token1AmountETH = amount1.times(token1PriceETH)
  increaseLiquidity.amountETH = token0AmountETH.plus(token1AmountETH)
  increaseLiquidity.amountUSD = increaseLiquidity.amountETH.times(ethPriceInUSD)
  increaseLiquidity.save()

  updateInvestor(fundAddress, event.params.investor, ethPriceInUSD)
  updateFundCurrent(fundAddress, ethPriceInUSD)
  updateInvestorProfit(fundAddress, event.params.investor, ethPriceInUSD, TYPE_NORMAL, ZERO_BD, ZERO_BD)
  updateUpdatedAtTime(fundAddress, event.params.investor, event.block.timestamp)

  investorSnapshot(fundAddress, managerAddress, event.params.investor, ethPriceInUSD, event)
  fundSnapshot(fundAddress, managerAddress, event, ethPriceInUSD)
  factorySnapshot(event)
}

export function handleCollectPositionFee(event: CollectPositionFeeEvent): void {
  const fundAddress = event.address
  const managerAddress = DotoliFund.bind(fundAddress).manager()
  const ethPriceInUSD = getEthPriceInUSD()

  const token0 = event.params.token0.toHexString()
  const token1 = event.params.token1.toHexString()
  const token0decimals = ERC20.bind(event.params.token0).decimals()
  const token0Decimal = BigDecimal.fromString(Math.pow(10,token0decimals).toString())
  const token1decimals = ERC20.bind(event.params.token1).decimals()
  const token1Decimal = BigDecimal.fromString(Math.pow(10,token1decimals).toString())
  const amount0 = event.params.amount0.divDecimal(token0Decimal)
  const amount1 = event.params.amount1.divDecimal(token1Decimal)

  let collectPositionFee = new CollectPositionFee(event.transaction.hash.toHexString())
  collectPositionFee.timestamp = event.block.timestamp
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
  const token0PriceETH = getTokenPriceETH(event.params.token0)
  const token1PriceETH = getTokenPriceETH(event.params.token1)
  const token0AmountETH = amount0.times(token0PriceETH)
  const token1AmountETH = amount1.times(token1PriceETH)
  collectPositionFee.amountETH = token0AmountETH.plus(token1AmountETH)
  collectPositionFee.amountUSD = collectPositionFee.amountETH.times(ethPriceInUSD)
  collectPositionFee.save()

  updateInvestor(fundAddress, event.params.investor, ethPriceInUSD)
  updateFundCurrent(fundAddress, ethPriceInUSD)
  updateInvestorProfit(fundAddress, event.params.investor, ethPriceInUSD, TYPE_NORMAL, ZERO_BD, ZERO_BD)
  updateUpdatedAtTime(fundAddress, event.params.investor, event.block.timestamp)


  investorSnapshot(fundAddress, managerAddress, event.params.investor, ethPriceInUSD, event)
  fundSnapshot(fundAddress, managerAddress, event, ethPriceInUSD)
  factorySnapshot(event)
}

export function handleDecreaseLiquidity(event: DecreaseLiquidityEvent): void {
  const fundAddress = event.address
  const managerAddress = DotoliFund.bind(fundAddress).manager()
  const ethPriceInUSD = getEthPriceInUSD()

  const token0 = event.params.token0.toHexString()
  const token1 = event.params.token1.toHexString()
  const token0decimals = ERC20.bind(event.params.token0).decimals()
  const token0Decimal = BigDecimal.fromString(Math.pow(10,token0decimals).toString())
  const token1decimals = ERC20.bind(event.params.token1).decimals()
  const token1Decimal = BigDecimal.fromString(Math.pow(10,token1decimals).toString())
  const amount0 = event.params.amount0.divDecimal(token0Decimal)
  const amount1 = event.params.amount1.divDecimal(token1Decimal)

  let decreaseLiquidity = new DecreaseLiquidity(event.transaction.hash.toHexString())
  decreaseLiquidity.timestamp = event.block.timestamp
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
  const token0PriceETH = getTokenPriceETH(event.params.token0)
  const token1PriceETH = getTokenPriceETH(event.params.token1)
  const token0AmountETH = amount0.times(token0PriceETH)
  const token1AmountETH = amount1.times(token1PriceETH)
  decreaseLiquidity.amountETH = token0AmountETH.plus(token1AmountETH)
  decreaseLiquidity.amountUSD = decreaseLiquidity.amountETH.times(ethPriceInUSD)
  decreaseLiquidity.save()

  updateInvestor(fundAddress, event.params.investor, ethPriceInUSD)
  updateFundCurrent(fundAddress, ethPriceInUSD)
  updateInvestorProfit(fundAddress, event.params.investor, ethPriceInUSD, TYPE_NORMAL, ZERO_BD, ZERO_BD)
  updateUpdatedAtTime(fundAddress, event.params.investor, event.block.timestamp)

  investorSnapshot(fundAddress, managerAddress, event.params.investor, ethPriceInUSD, event)
  fundSnapshot(fundAddress, managerAddress, event, ethPriceInUSD)
  factorySnapshot(event)
}
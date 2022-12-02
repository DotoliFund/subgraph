import { Address, BigDecimal, Bytes, log } from "@graphprotocol/graph-ts"
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
  Factory,
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
  FACTORY_ADDRESS,
  WETH9,
  USDC,
  ONE_BD,
  WETH_INT,
} from './utils/constants'
import { 
  fundSnapshot,
  investorSnapshot,
  xxxfund2Snapshot
} from './utils/snapshots'
import {
  getInvestorID,
  getFundID,
  loadTransaction,
  isNewToken,
  isTokenEmpty,
  getTokensVolumeUSD
} from './utils'
import { 
  getEthPriceInUSD,
  getPriceETH,
  getInvestorTvlETH,
  getManagerFeeTvlETH
} from './utils/pricing'
import { ERC20 } from './types/templates/XXXFund2/ERC20'
import { XXXFund2 } from './types/templates/XXXFund2/XXXFund2'

export function handleManagerFeeOut(event: ManagerFeeOutEvent): void {
  const fundAddress = event.address
  const managerAddress = XXXFund2.bind(fundAddress).manager()

  let factory = Factory.load(FACTORY_ADDRESS)
  if (!factory) return
  let fund = Fund.load(getFundID(fundAddress))
  if (!fund) return

  const ethPriceInUSD = getEthPriceInUSD()

  factory.totalVolumeETH = factory.totalVolumeETH.minus(fund.volumeETH)
  fund.volumeETH = fund.volumeETH.minus(fund.feeVolumeETH)

  let transaction = loadTransaction(event)
  let managerFeeOut = new ManagerFeeOut(event.transaction.hash.toHexString())
  managerFeeOut.transaction = transaction.id
  managerFeeOut.timestamp = transaction.timestamp
  managerFeeOut.fund = fundAddress
  managerFeeOut.manager = managerAddress
  managerFeeOut.token = event.params.token
  managerFeeOut.tokenSymbol = ERC20.bind(event.params.token).symbol()
  const decimals = ERC20.bind(event.params.token).decimals()
  const tokenDecimal = BigDecimal.fromString(Math.pow(10,decimals).toString())
  managerFeeOut.amount = event.params.amount.divDecimal(tokenDecimal)
  const feeOutAmountETH = getPriceETH(event.params.token, event.params.amount)
  managerFeeOut.amountETH = feeOutAmountETH
  managerFeeOut.amountUSD = managerFeeOut.amountETH.times(ethPriceInUSD)
  managerFeeOut.origin = event.transaction.from
  managerFeeOut.logIndex = event.logIndex

  managerFeeOut.save()
  
  fund.feeVolumeUSD = getManagerFeeTvlETH(fundAddress)
  fund.volumeETH = fund.volumeETH.plus(fund.feeVolumeETH)
  fund.volumeUSD = fund.volumeETH.times(ethPriceInUSD)
  factory.totalVolumeETH = factory.totalVolumeETH.plus(fund.volumeETH)
  factory.totalVolumeUSD = factory.totalVolumeETH.times(ethPriceInUSD)

  fund.save()
  factory.save()
  fundSnapshot(
    fundAddress,
    managerAddress,
    event
  )
  xxxfund2Snapshot(event)
}

export function handleDeposit(event: DepositEvent): void {
  const fundAddress = event.address
  const managerAddress = XXXFund2.bind(fundAddress).manager()
  log.info('00000: {},{}', [fundAddress.toHexString(), managerAddress.toHexString()])

  let factory = Factory.load(FACTORY_ADDRESS)
  if (!factory) return
  log.info('12345: {},{}', [fundAddress.toHexString(), managerAddress.toHexString()])

  let fund = Fund.load(getFundID(fundAddress))
  if (!fund) return
  log.info('11111: {}', [fundAddress.toHexString()])
  const ethPriceInUSD = getEthPriceInUSD()
  log.info('22222 ethPriceInUSD : {}', [ethPriceInUSD.toString()])
  let transaction = loadTransaction(event)
  let deposit = new Deposit(event.transaction.hash.toHexString())
  deposit.transaction = transaction.id
  deposit.timestamp = transaction.timestamp
  deposit.fund = fundAddress
  deposit.investor = event.params.investor
  deposit.token = event.params.token
  deposit.tokenSymbol = ERC20.bind(event.params.token).symbol()
  const decimals = ERC20.bind(event.params.token).decimals()
  const tokenDecimal = BigDecimal.fromString(Math.pow(10,decimals).toString())
  deposit.amount = event.params.amount.divDecimal(tokenDecimal)
  const depositAmountETH = getPriceETH(event.params.token, event.params.amount)
  deposit.amountETH = depositAmountETH
  deposit.amountUSD = depositAmountETH.times(ethPriceInUSD)
  deposit.origin = event.transaction.from
  deposit.logIndex = event.logIndex

  deposit.save()

  let investor = Investor.load(getInvestorID(fundAddress, event.params.investor))

  if (investor !== null) {
    factory.totalVolumeETH = factory.totalVolumeETH.minus(fund.volumeETH)
    fund.volumeETH = fund.volumeETH.minus(investor.volumeETH)
    fund.volumeETH = fund.volumeETH.minus(fund.feeVolumeETH)
    fund.principalUSD = fund.principalUSD.minus(investor.principalUSD)

    investor.volumeETH = getInvestorTvlETH(fundAddress, event.params.investor)
    investor.volumeUSD = investor.volumeETH.times(ethPriceInUSD)

    fund.feeVolumeETH = getManagerFeeTvlETH(fundAddress)
    fund.feeVolumeUSD = fund.feeVolumeETH.times(ethPriceInUSD)

    investor.principalUSD = investor.principalUSD.plus(depositAmountETH.times(ethPriceInUSD))

    fund.principalUSD = fund.principalUSD.plus(investor.principalUSD)
    fund.volumeETH = fund.volumeETH.plus(investor.volumeETH)
    fund.volumeETH = fund.volumeETH.plus(fund.feeVolumeETH)
    fund.volumeUSD = fund.volumeETH.times(ethPriceInUSD)
    factory.totalVolumeETH = factory.totalVolumeETH.plus(fund.volumeETH)
    factory.totalVolumeUSD = factory.totalVolumeETH.times(ethPriceInUSD)

    const xxxFund2 = XXXFund2.bind(fundAddress)
    let _investorTokens: Bytes[] = []
    let _investorSymbols: string[] = []
    let _investorTokensVolumeUSD: BigDecimal[] = []
    const investorTokens = xxxFund2.getInvestorTokens(event.params.investor)
    for (let i=0; i<investorTokens.length; i++) {
      const tokenAddress = investorTokens[i].tokenAddress
      _investorTokens.push(tokenAddress)
      _investorSymbols.push(ERC20.bind(tokenAddress).symbol())
      const amount = investorTokens[i].amount
      const amountETH = getPriceETH(tokenAddress, amount)
      const amountUSD = amountETH.times(ethPriceInUSD)
      _investorTokensVolumeUSD.push(amountUSD)
    }
    investor.tokens = _investorTokens
    investor.symbols = _investorSymbols
    investor.tokensVolumeUSD = _investorTokensVolumeUSD
    
    if (isNewToken(fund.tokens, deposit.token)) {
      let fundTokens: Bytes[] = fund.tokens
      let fundSymbols: string[] = fund.symbols
      fundTokens.push(deposit.token)
      fundSymbols.push(deposit.tokenSymbol)
      fund.tokens = fundTokens
      fund.symbols = fundSymbols
    }
    fund.tokensVolumeUSD = getTokensVolumeUSD(fundAddress, fund.tokens)

    investor.profitUSD = investor.volumeUSD.minus(investor.principalUSD)
    investor.profitRatio = investor.volumeUSD.minus(investor.principalUSD).div(investor.principalUSD).times(BigDecimal.fromString('100'))
    fund.profitUSD = fund.volumeUSD.minus(fund.principalUSD)
    fund.profitRatio = fund.volumeUSD.minus(fund.principalUSD).div(fund.principalUSD).times(BigDecimal.fromString('100'))

    investor.save()
    fund.save()
    factory.save()
    investorSnapshot(
      fundAddress,
      managerAddress,
      event.params.investor,
      event
    )
    fundSnapshot(
      fundAddress,
      managerAddress,
      event
    )
    xxxfund2Snapshot(event)
  }
}

export function handleWithdraw(event: WithdrawEvent): void {
  const fundAddress = event.address
  const managerAddress = XXXFund2.bind(fundAddress).manager()

  let factory = Factory.load(FACTORY_ADDRESS)
  if (!factory) return
  let fund = Fund.load(getFundID(fundAddress))
  if (!fund) return

  const ethPriceInUSD = getEthPriceInUSD()

  let transaction = loadTransaction(event)
  let withdraw = new Withdraw(event.transaction.hash.toHexString())
  withdraw.transaction = transaction.id
  withdraw.timestamp = transaction.timestamp
  withdraw.fund = fundAddress
  withdraw.investor = event.params.investor
  withdraw.token = event.params.token
  withdraw.tokenSymbol = ERC20.bind(event.params.token).symbol()
  const decimals = ERC20.bind(event.params.token).decimals()
  const tokenDecimal = BigDecimal.fromString(Math.pow(10,decimals).toString())
  withdraw.amount = event.params.amount.divDecimal(tokenDecimal)
  const withdrawAmountETH = getPriceETH(event.params.token, event.params.amount)
  withdraw.amountETH = withdrawAmountETH
  withdraw.amountUSD = withdrawAmountETH.times(ethPriceInUSD)
  withdraw.origin = event.transaction.from
  withdraw.logIndex = event.logIndex

  withdraw.save()

  let investor = Investor.load(getInvestorID(fundAddress, event.params.investor))
  if (investor !== null) {
    factory.totalVolumeETH = factory.totalVolumeETH.minus(fund.volumeETH)
    fund.volumeETH = fund.volumeETH.minus(investor.volumeETH)
    fund.volumeETH = fund.volumeETH.minus(fund.feeVolumeETH)
    fund.principalUSD = fund.principalUSD.minus(investor.principalUSD)

    investor.volumeETH = getInvestorTvlETH(fundAddress, event.params.investor)
    investor.volumeUSD = investor.volumeETH.times(ethPriceInUSD)

    fund.feeVolumeETH = getManagerFeeTvlETH(fundAddress)
    fund.feeVolumeUSD = fund.feeVolumeETH.times(ethPriceInUSD)

    const prevVolumeUSD = investor.volumeUSD.plus(withdraw.amountUSD)
    const withdrawRatioUSD = ONE_BD.minus(withdraw.amountUSD.div(prevVolumeUSD))
    investor.principalUSD = investor.principalUSD.times(withdrawRatioUSD)

    fund.principalUSD = fund.principalUSD.plus(investor.principalUSD)
    fund.volumeETH = fund.volumeETH.plus(investor.volumeETH)
    fund.volumeETH = fund.volumeETH.plus(fund.feeVolumeETH)
    fund.volumeUSD = fund.volumeETH.times(ethPriceInUSD)
    factory.totalVolumeETH = factory.totalVolumeETH.plus(fund.volumeETH)
    factory.totalVolumeUSD = factory.totalVolumeETH.times(ethPriceInUSD)

    const xxxFund2 = XXXFund2.bind(fundAddress)
    let _investorTokens: Bytes[] = []
    let _investorSymbols: string[] = []
    let _investorTokensVolumeUSD: BigDecimal[] = []
    const investorTokens = xxxFund2.getInvestorTokens(event.params.investor)
    for (let i=0; i<investorTokens.length; i++) {
      const tokenAddress = investorTokens[i].tokenAddress
      _investorTokens.push(tokenAddress)
      _investorSymbols.push(ERC20.bind(tokenAddress).symbol())
      const amount = investorTokens[i].amount
      const amountETH = getPriceETH(tokenAddress, amount)
      const amountUSD = amountETH.times(ethPriceInUSD)
      _investorTokensVolumeUSD.push(amountUSD)
    }
    investor.tokens = _investorTokens
    investor.symbols = _investorSymbols
    investor.tokensVolumeUSD = _investorTokensVolumeUSD
    
    // if token amount 0, remove from fund token list
    if (isTokenEmpty(fundAddress, event.params.token)) {
      let fundTokens: Bytes[] = []
      let fundSymbols: string[] = []
      for (let i=0; i<fund.tokens.length; i++) {
        if(fund.tokens[i] === withdraw.token) continue
        fundTokens.push(fund.tokens[i])
        fundSymbols.push(fund.symbols[i])
      }
      fund.tokens = fundTokens
      fund.symbols = fundSymbols
    }
    fund.tokensVolumeUSD = getTokensVolumeUSD(fundAddress, fund.tokens)

    investor.profitUSD = investor.volumeUSD.minus(investor.principalUSD)
    investor.profitRatio = investor.volumeUSD.minus(investor.principalUSD).div(investor.principalUSD).times(BigDecimal.fromString('100'))
    fund.profitUSD = fund.volumeUSD.minus(fund.principalUSD)
    fund.profitRatio = fund.volumeUSD.minus(fund.principalUSD).div(fund.principalUSD).times(BigDecimal.fromString('100'))

    investor.save()
    fund.save()
    factory.save()
    investorSnapshot(
      fundAddress,
      managerAddress,
      event.params.investor,
      event
    )
    fundSnapshot(
      fundAddress,
      managerAddress,
      event
    )
    xxxfund2Snapshot(event)
  }
}

export function handleSwap(event: SwapEvent): void {
  const fundAddress = event.address
  const managerAddress = XXXFund2.bind(fundAddress).manager()

  let factory = Factory.load(FACTORY_ADDRESS)
  if (!factory) return
  let fund = Fund.load(getFundID(fundAddress))
  if (!fund) return

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
  swap.token0Symbol = ERC20.bind(event.params.tokenIn).symbol()
  swap.token1Symbol = ERC20.bind(event.params.tokenOut).symbol()
  swap.amount0 = amountIn
  swap.amount1 = amountOut
  const swapAmountETH = getPriceETH(event.params.tokenOut, event.params.amountOut)
  swap.amountETH = swapAmountETH
  swap.amountUSD = swapAmountETH.times(ethPriceInUSD)
  swap.origin = event.transaction.from
  swap.logIndex = event.logIndex
  
  swap.save()

  let investor = Investor.load(getInvestorID(fundAddress, event.params.investor))
  if (investor !== null) {
    factory.totalVolumeETH = factory.totalVolumeETH.minus(fund.volumeETH)
    fund.volumeETH = fund.volumeETH.minus(investor.volumeETH)
    fund.volumeETH = fund.volumeETH.minus(fund.feeVolumeETH)

    investor.volumeETH = getInvestorTvlETH(fundAddress, event.params.investor)
    investor.volumeUSD = investor.volumeETH.times(ethPriceInUSD)

    fund.feeVolumeETH = getManagerFeeTvlETH(fundAddress)
    fund.feeVolumeUSD = fund.feeVolumeETH.times(ethPriceInUSD)

    fund.volumeETH = fund.volumeETH.plus(investor.volumeETH)
    fund.volumeETH = fund.volumeETH.plus(fund.feeVolumeETH)
    fund.volumeUSD = fund.volumeETH.times(ethPriceInUSD)
    factory.totalVolumeETH = factory.totalVolumeETH.plus(fund.volumeETH)
    factory.totalVolumeUSD = factory.totalVolumeETH.times(ethPriceInUSD)

    const xxxFund2 = XXXFund2.bind(fundAddress)
    let _investorTokens: Bytes[] = []
    let _investorSymbols: string[] = []
    let _tokensVolumeUSD: BigDecimal[] = []
    const investorTokens = xxxFund2.getInvestorTokens(event.params.investor)
    for (let i=0; i<investorTokens.length; i++) {
      const tokenAddress = investorTokens[i].tokenAddress
      _investorTokens.push(tokenAddress)
      _investorSymbols.push(ERC20.bind(tokenAddress).symbol())
      const amount = investorTokens[i].amount
      const amountETH = getPriceETH(tokenAddress, amount)
      const amountUSD = amountETH.times(ethPriceInUSD)
      _tokensVolumeUSD.push(amountUSD)
    }
    investor.tokens = _investorTokens
    investor.symbols = _investorSymbols
    investor.tokensVolumeUSD = _tokensVolumeUSD
    
    // if token amount 0, remove from fund token list
    if (isTokenEmpty(fundAddress, event.params.tokenIn)) {
      let fundTokens: Bytes[] = []
      let fundSymbols: string[] = []
      for (let i=0; i<fund.tokens.length; i++) {
        if(fund.tokens[i] === event.params.tokenIn) continue
        fundTokens.push(fund.tokens[i])
        fundSymbols.push(fund.symbols[i])
      }
      fund.tokens = fundTokens
      fund.symbols = fundSymbols
    }
    fund.tokensVolumeUSD = getTokensVolumeUSD(fundAddress, fund.tokens)

    if (isNewToken(fund.tokens, event.params.tokenOut)) {
      let fundTokens: Bytes[] = fund.tokens
      let fundSymbols: string[] = fund.symbols
      fundTokens.push(event.params.tokenOut)
      fundSymbols.push(ERC20.bind(event.params.tokenOut).symbol())
      fund.tokens = fundTokens
      fund.symbols = fundSymbols
    }
    fund.tokensVolumeUSD = getTokensVolumeUSD(fundAddress, fund.tokens)

    investor.profitUSD = investor.volumeUSD.minus(investor.principalUSD)
    investor.profitRatio = investor.volumeUSD.minus(investor.principalUSD).div(investor.principalUSD).times(BigDecimal.fromString('100'))
    fund.profitUSD = fund.volumeUSD.minus(fund.principalUSD)
    fund.profitRatio = fund.volumeUSD.minus(fund.principalUSD).div(fund.principalUSD).times(BigDecimal.fromString('100'))

    investor.save()
    fund.save()
    factory.save()
    investorSnapshot(
      fundAddress,
      managerAddress,
      event.params.investor,
      event
    )
    fundSnapshot(
      fundAddress,
      managerAddress,
      event
    )
    xxxfund2Snapshot(event)
  }
}

export function handleMintNewPosition(event: MintNewPositionEvent): void {
  const fundAddress = event.address
  const managerAddress = XXXFund2.bind(fundAddress).manager()

  let factory = Factory.load(FACTORY_ADDRESS)
  if (!factory) return
  let fund = Fund.load(getFundID(fundAddress))
  if (!fund) return

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
  mintNewPosition.token0Symbol = ERC20.bind(event.params.token0).symbol()
  mintNewPosition.token1Symbol = ERC20.bind(event.params.token1).symbol()
  mintNewPosition.amount0 = amount0
  mintNewPosition.amount1 = amount1
  const token0AmountETH = getPriceETH(event.params.token0, event.params.amount0)
  const token1AmountETH = getPriceETH(event.params.token1, event.params.amount1)
  mintNewPosition.amountETH = token0AmountETH.plus(token1AmountETH)
  mintNewPosition.amountUSD = mintNewPosition.amountETH.times(ethPriceInUSD)
  mintNewPosition.origin = event.transaction.from
  mintNewPosition.logIndex = event.logIndex
  
  mintNewPosition.save()

  let investor = Investor.load(getInvestorID(fundAddress, event.params.investor))
  if (investor !== null) {
    factory.totalVolumeETH = factory.totalVolumeETH.minus(fund.volumeETH)
    fund.volumeETH = fund.volumeETH.minus(investor.volumeETH)
    fund.volumeETH = fund.volumeETH.minus(fund.feeVolumeETH)

    investor.volumeETH = getInvestorTvlETH(fundAddress, event.params.investor)
    investor.volumeUSD = investor.volumeETH.times(ethPriceInUSD)

    fund.feeVolumeETH = getManagerFeeTvlETH(fundAddress)
    fund.feeVolumeUSD = fund.feeVolumeETH.times(ethPriceInUSD)

    fund.volumeETH = fund.volumeETH.plus(investor.volumeETH)
    fund.volumeETH = fund.volumeETH.plus(fund.feeVolumeETH)
    fund.volumeUSD = fund.volumeETH.times(ethPriceInUSD)
    factory.totalVolumeETH = factory.totalVolumeETH.plus(fund.volumeETH)
    factory.totalVolumeUSD = factory.totalVolumeETH.times(ethPriceInUSD)


    const xxxFund2 = XXXFund2.bind(fundAddress)
    let _tokensVolumeUSD: BigDecimal[] = []
    const investorTokens = xxxFund2.getInvestorTokens(event.params.investor)
    for (let i=0; i<investorTokens.length; i++) {
      const tokenAddress = investorTokens[i].tokenAddress
      const amount = investorTokens[i].amount
      const amountETH = getPriceETH(tokenAddress, amount)
      const amountUSD = amountETH.times(ethPriceInUSD)
      _tokensVolumeUSD.push(amountUSD)
    }
    investor.tokensVolumeUSD = _tokensVolumeUSD
    
    fund.tokensVolumeUSD = getTokensVolumeUSD(fundAddress, fund.tokens)

    investor.profitUSD = investor.volumeUSD.minus(investor.principalUSD)
    investor.profitRatio = investor.volumeUSD.minus(investor.principalUSD).div(investor.principalUSD).times(BigDecimal.fromString('100'))
    fund.profitUSD = fund.volumeUSD.minus(fund.principalUSD)
    fund.profitRatio = fund.volumeUSD.minus(fund.principalUSD).div(fund.principalUSD).times(BigDecimal.fromString('100'))

    investor.save()
    fund.save()
    factory.save()
    investorSnapshot(
      fundAddress,
      managerAddress,
      event.params.investor,
      event
    )
    fundSnapshot(
      fundAddress,
      managerAddress,
      event
    )
    xxxfund2Snapshot(event)
  }
}

export function handleIncreaseLiquidity(event: IncreaseLiquidityEvent): void {
  const fundAddress = event.address
  const managerAddress = XXXFund2.bind(fundAddress).manager()

  let factory = Factory.load(FACTORY_ADDRESS)
  if (!factory) return
  let fund = Fund.load(getFundID(fundAddress))
  if (!fund) return

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
  increaseLiquidity.token0Symbol = ERC20.bind(event.params.token0).symbol()
  increaseLiquidity.token1Symbol = ERC20.bind(event.params.token1).symbol()
  increaseLiquidity.amount0 = amount0
  increaseLiquidity.amount1 = amount1
  const token0AmountETH = getPriceETH(event.params.token0, event.params.amount0)
  const token1AmountETH = getPriceETH(event.params.token1, event.params.amount1)
  increaseLiquidity.amountETH = token0AmountETH.plus(token1AmountETH)
  increaseLiquidity.amountUSD = increaseLiquidity.amountETH.times(ethPriceInUSD)
  increaseLiquidity.origin = event.transaction.from
  increaseLiquidity.logIndex = event.logIndex
  
  increaseLiquidity.save()

  let investor = Investor.load(getInvestorID(fundAddress, event.params.investor))
  if (investor !== null) {
    factory.totalVolumeETH = factory.totalVolumeETH.minus(fund.volumeETH)
    fund.volumeETH = fund.volumeETH.minus(investor.volumeETH)
    fund.volumeETH = fund.volumeETH.minus(fund.feeVolumeETH)

    investor.volumeETH = getInvestorTvlETH(fundAddress, event.params.investor)
    investor.volumeUSD = investor.volumeETH.times(ethPriceInUSD)

    fund.feeVolumeETH = getManagerFeeTvlETH(fundAddress)
    fund.feeVolumeUSD = fund.feeVolumeETH.times(ethPriceInUSD)

    fund.volumeETH = fund.volumeETH.plus(investor.volumeETH)
    fund.volumeETH = fund.volumeETH.plus(fund.feeVolumeETH)
    fund.volumeUSD = fund.volumeETH.times(ethPriceInUSD)
    factory.totalVolumeETH = factory.totalVolumeETH.plus(fund.volumeETH)
    factory.totalVolumeUSD = factory.totalVolumeETH.times(ethPriceInUSD)


    const xxxFund2 = XXXFund2.bind(fundAddress)
    let _tokensVolumeUSD: BigDecimal[] = []
    const investorTokens = xxxFund2.getInvestorTokens(event.params.investor)
    for (let i=0; i<investorTokens.length; i++) {
      const tokenAddress = investorTokens[i].tokenAddress
      const amount = investorTokens[i].amount
      const amountETH = getPriceETH(tokenAddress, amount)
      const amountUSD = amountETH.times(ethPriceInUSD)
      _tokensVolumeUSD.push(amountUSD)
    }
    investor.tokensVolumeUSD = _tokensVolumeUSD
    
    fund.tokensVolumeUSD = getTokensVolumeUSD(fundAddress, fund.tokens)

    investor.profitUSD = investor.volumeUSD.minus(investor.principalUSD)
    investor.profitRatio = investor.volumeUSD.minus(investor.principalUSD).div(investor.principalUSD).times(BigDecimal.fromString('100'))
    fund.profitUSD = fund.volumeUSD.minus(fund.principalUSD)
    fund.profitRatio = fund.volumeUSD.minus(fund.principalUSD).div(fund.principalUSD).times(BigDecimal.fromString('100'))

    investor.save()
    fund.save()
    factory.save()
    investorSnapshot(
      fundAddress,
      managerAddress,
      event.params.investor,
      event
    )
    fundSnapshot(
      fundAddress,
      managerAddress,
      event
    )
    xxxfund2Snapshot(event)
  }
}

export function handleCollectPositionFee(event: CollectPositionFeeEvent): void {
  const fundAddress = event.address
  const managerAddress = XXXFund2.bind(fundAddress).manager()

  let factory = Factory.load(FACTORY_ADDRESS)
  if (!factory) return
  let fund = Fund.load(getFundID(fundAddress))
  if (!fund) return

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
  collectPositionFee.token0Symbol = ERC20.bind(event.params.token0).symbol()
  collectPositionFee.token1Symbol = ERC20.bind(event.params.token1).symbol()
  collectPositionFee.amount0 = amount0
  collectPositionFee.amount1 = amount1
  const token0AmountETH = getPriceETH(event.params.token0, event.params.amount0)
  const token1AmountETH = getPriceETH(event.params.token1, event.params.amount1)
  collectPositionFee.amountETH = token0AmountETH.plus(token1AmountETH)
  collectPositionFee.amountUSD = collectPositionFee.amountETH.times(ethPriceInUSD)
  collectPositionFee.origin = event.transaction.from
  collectPositionFee.logIndex = event.logIndex
  
  collectPositionFee.save()

  let investor = Investor.load(getInvestorID(fundAddress, event.params.investor))
  if (investor !== null) {
    factory.totalVolumeETH = factory.totalVolumeETH.minus(fund.volumeETH)
    fund.volumeETH = fund.volumeETH.minus(investor.volumeETH)
    fund.volumeETH = fund.volumeETH.minus(fund.feeVolumeETH)

    investor.volumeETH = getInvestorTvlETH(fundAddress, event.params.investor)
    investor.volumeUSD = investor.volumeETH.times(ethPriceInUSD)

    fund.feeVolumeETH = getManagerFeeTvlETH(fundAddress)
    fund.feeVolumeUSD = fund.feeVolumeETH.times(ethPriceInUSD)

    fund.volumeETH = fund.volumeETH.plus(investor.volumeETH)
    fund.volumeETH = fund.volumeETH.plus(fund.feeVolumeETH)
    fund.volumeUSD = fund.volumeETH.times(ethPriceInUSD)
    factory.totalVolumeETH = factory.totalVolumeETH.plus(fund.volumeETH)
    factory.totalVolumeUSD = factory.totalVolumeETH.times(ethPriceInUSD)

    const xxxFund2 = XXXFund2.bind(fundAddress)
    let _tokensVolumeUSD: BigDecimal[] = []
    const investorTokens = xxxFund2.getInvestorTokens(event.params.investor)
    for (let i=0; i<investorTokens.length; i++) {
      const tokenAddress = investorTokens[i].tokenAddress
      const amount = investorTokens[i].amount
      const amountETH = getPriceETH(tokenAddress, amount)
      const amountUSD = amountETH.times(ethPriceInUSD)
      _tokensVolumeUSD.push(amountUSD)
    }
    investor.tokensVolumeUSD = _tokensVolumeUSD
    
    fund.tokensVolumeUSD = getTokensVolumeUSD(fundAddress, fund.tokens)

    investor.profitUSD = investor.volumeUSD.minus(investor.principalUSD)
    investor.profitRatio = investor.volumeUSD.minus(investor.principalUSD).div(investor.principalUSD).times(BigDecimal.fromString('100'))
    fund.profitUSD = fund.volumeUSD.minus(fund.principalUSD)
    fund.profitRatio = fund.volumeUSD.minus(fund.principalUSD).div(fund.principalUSD).times(BigDecimal.fromString('100'))

    investor.save()
    fund.save()
    factory.save()
    investorSnapshot(
      fundAddress,
      managerAddress,
      event.params.investor,
      event
    )
    fundSnapshot(
      fundAddress,
      managerAddress,
      event
    )
    xxxfund2Snapshot(event)
  }
}

export function handleDecreaseLiquidity(event: DecreaseLiquidityEvent): void {
  const fundAddress = event.address
  const managerAddress = XXXFund2.bind(fundAddress).manager()

  let factory = Factory.load(FACTORY_ADDRESS)
  if (!factory) return
  let fund = Fund.load(getFundID(fundAddress))
  if (!fund) return

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
  decreaseLiquidity.token0Symbol = ERC20.bind(event.params.token0).symbol()
  decreaseLiquidity.token1Symbol = ERC20.bind(event.params.token1).symbol()
  decreaseLiquidity.amount0 = amount0
  decreaseLiquidity.amount1 = amount1
  const token0AmountETH = getPriceETH(event.params.token0, event.params.amount0)
  const token1AmountETH = getPriceETH(event.params.token1, event.params.amount1)
  decreaseLiquidity.amountETH = token0AmountETH.plus(token1AmountETH)
  decreaseLiquidity.amountUSD = decreaseLiquidity.amountETH.times(ethPriceInUSD)
  decreaseLiquidity.origin = event.transaction.from
  decreaseLiquidity.logIndex = event.logIndex

  decreaseLiquidity.save()

  let investor = Investor.load(getInvestorID(fundAddress, event.params.investor))
  if (investor !== null) {
    factory.totalVolumeETH = factory.totalVolumeETH.minus(fund.volumeETH)
    fund.volumeETH = fund.volumeETH.minus(investor.volumeETH)
    fund.volumeETH = fund.volumeETH.minus(fund.feeVolumeETH)

    investor.volumeETH = getInvestorTvlETH(fundAddress, event.params.investor)
    investor.volumeUSD = investor.volumeETH.times(ethPriceInUSD)

    fund.feeVolumeETH = getManagerFeeTvlETH(fundAddress)
    fund.feeVolumeUSD = fund.feeVolumeETH.times(ethPriceInUSD)

    fund.volumeETH = fund.volumeETH.plus(investor.volumeETH)
    fund.volumeETH = fund.volumeETH.plus(fund.feeVolumeETH)
    fund.volumeUSD = fund.volumeETH.times(ethPriceInUSD)
    factory.totalVolumeETH = factory.totalVolumeETH.plus(fund.volumeETH)
    factory.totalVolumeUSD = factory.totalVolumeETH.times(ethPriceInUSD)

    const xxxFund2 = XXXFund2.bind(fundAddress)
    let _tokensVolumeUSD: BigDecimal[] = []
    const investorTokens = xxxFund2.getInvestorTokens(event.params.investor)
    for (let i=0; i<investorTokens.length; i++) {
      const tokenAddress = investorTokens[i].tokenAddress
      const amount = investorTokens[i].amount
      const amountETH = getPriceETH(tokenAddress, amount)
      const amountUSD = amountETH.times(ethPriceInUSD)
      _tokensVolumeUSD.push(amountUSD)
    }
    investor.tokensVolumeUSD = _tokensVolumeUSD
    
    fund.tokensVolumeUSD = getTokensVolumeUSD(fundAddress, fund.tokens)

    investor.profitUSD = investor.volumeUSD.minus(investor.principalUSD)
    investor.profitRatio = investor.volumeUSD.minus(investor.principalUSD).div(investor.principalUSD).times(BigDecimal.fromString('100'))
    fund.profitUSD = fund.volumeUSD.minus(fund.principalUSD)
    fund.profitRatio = fund.volumeUSD.minus(fund.principalUSD).div(fund.principalUSD).times(BigDecimal.fromString('100'))

    investor.save()
    fund.save()
    factory.save()
    investorSnapshot(
      fundAddress,
      managerAddress,
      event.params.investor,
      event
    )
    fundSnapshot(
      fundAddress,
      managerAddress,
      event
    )
    xxxfund2Snapshot(event)
  }
}
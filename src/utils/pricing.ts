/* eslint-disable prefer-const */
import { BigInt, BigDecimal, Address, log } from '@graphprotocol/graph-ts'
import {
    PRICE_ORACLE_ADDRESS,
    WETH9,
    WETH_DECIMAL,
    USDC_DECIMAL,
    ZERO_BD,
    LIQUIDITY_ORACLE_ADDRESS,
    USDC,
    UNISWAP_V3_FACTORY,
    ADDRESS_ZERO,
    ZERO_BI
} from './constants'
import { LiquidityOracle  } from '../types/templates/XXXFund2/LiquidityOracle'
import { XXXFund2 } from '../types/templates/XXXFund2/XXXFund2'
import { exponentToBigDecimal, safeDiv } from '../utils'
import { ERC20 } from '../types/templates/XXXFund2/ERC20'
import { UniswapV3Factory } from '../types/templates/XXXFund2/UniswapV3Factory'
import { UniswapV3Pool } from '../types/templates/XXXFund2/UniswapV3Pool'

const Q192 = 2 ** 192

export function sqrtPriceX96ToTokenPrices(sqrtPriceX96: BigInt, token0: Address, token1: Address): BigDecimal[] {
  let num = sqrtPriceX96.times(sqrtPriceX96).toBigDecimal()
  let denom = BigDecimal.fromString(Q192.toString())
  const token0Decimals = ERC20.bind(token0).decimals()
  const token1Decimals = ERC20.bind(token1).decimals()
  log.info('5555 : {}, {}', [(2 ** 192).toString(), Q192.toString()])
  log.info('66666 : {}, {}', [num.toString(), denom.toString()])
  log.info('77777 : {}, {}', [exponentToBigDecimal(BigInt.fromString(token0Decimals.toString())).toString(), 
    exponentToBigDecimal(BigInt.fromString(token1Decimals.toString())).toString()])

  let price1 = num
    .div(denom)
    .times(exponentToBigDecimal(BigInt.fromString(token0Decimals.toString())))
    .div(exponentToBigDecimal(BigInt.fromString(token1Decimals.toString())))

  log.info('88888 : {}', [price1.toString()])
  
  let price0 = safeDiv(BigDecimal.fromString('1'), price1)
  return [price0, price1]
}

export function getEthPriceInUSD(): BigDecimal {
  const wethAddress = Address.fromString(WETH9)
  const usdcAddress = Address.fromString(USDC)
  const fees = [500, 3000, 10000]

  let ethPrice = ZERO_BD
  let largestLiquidity = ZERO_BI
  log.info('33333 getEthPriceInUSD : {}, {}', [wethAddress.toHexString(), usdcAddress.toHexString()])

  for (let i=0; i<fees.length; i++) {
    const poolAddress = UniswapV3Factory.bind(Address.fromString(UNISWAP_V3_FACTORY))
      .getPool(wethAddress, usdcAddress, fees[i])
    const pool = UniswapV3Pool.bind(poolAddress)
    const liquidity = pool.liquidity()
    log.info('44444 poolAddress, liquidity : {}, {}', [poolAddress.toHexString(), liquidity.toString()])

    if (liquidity.gt(ZERO_BI) && liquidity.gt(largestLiquidity)) {
      const sqrtPriceX96 = pool.slot0().getSqrtPriceX96()
      ethPrice = sqrtPriceX96ToTokenPrices(sqrtPriceX96, wethAddress, usdcAddress)[0]
      largestLiquidity = liquidity
      log.info('55555 sqrtPriceX96 : {}, {}', [sqrtPriceX96.toString(), ethPrice.toString()])
    }
  }
  return ethPrice
}

export function getPriceETH(token: Address, amountIn: BigInt): BigDecimal {
  const tokenAddress = token
  const wethAddress = Address.fromString(WETH9)
  const fees = [500, 3000, 10000]

  let price = ZERO_BD
  let largestLiquidity = ZERO_BI

  for (let i=0; i<fees.length; i++) {
    const poolAddress = UniswapV3Factory.bind(Address.fromString(UNISWAP_V3_FACTORY))
      .getPool(tokenAddress, wethAddress, fees[i])
    const pool = UniswapV3Pool.bind(poolAddress)
    const liquidity = pool.liquidity()

    if (liquidity.gt(ZERO_BI) && liquidity.gt(largestLiquidity)) {
      const sqrtPriceX96 = pool.slot0().getSqrtPriceX96()
      price = sqrtPriceX96ToTokenPrices(sqrtPriceX96, tokenAddress, wethAddress)[0]
      largestLiquidity = liquidity
    }
  }
  return price.times(amountIn.toBigDecimal())
}

export function getPriceUSD(token: Address, amountIn: BigInt): BigDecimal {
  return getPriceETH(token, amountIn).times(getEthPriceInUSD())
}

export function getInvestorTvlETH(fund: Address, investor: Address): BigDecimal {
  const xxxFund2 = XXXFund2.bind(fund)
  const liquidityOracle = LiquidityOracle.bind(Address.fromString(LIQUIDITY_ORACLE_ADDRESS))

  let investorTvlETH = ZERO_BD

  // not liquidity volume
  const investorTokens = xxxFund2.getInvestorTokens(investor)
  for (let i=0; i<investorTokens.length; i++) {
    const tokenAddress = investorTokens[i].tokenAddress
    const amount = investorTokens[i].amount
    const amountETH = getPriceETH(tokenAddress, amount)
    const deAmountETH = amountETH.div(WETH_DECIMAL)
    investorTvlETH = investorTvlETH.plus(deAmountETH)
  }

  // liquidity volume
  const investorTokenIds = xxxFund2.getPositionTokenIds(investor)
  for (let i=0; i<investorTokenIds.length; i++) {
    const tokenId = investorTokenIds[i]
    const positionTokenAmount = liquidityOracle.getPositionTokenAmount(tokenId)
  
    const token0 = positionTokenAmount.getToken0()
    const token1 = positionTokenAmount.getToken1()
    const amount0 = positionTokenAmount.getAmount0()
    const amount1 = positionTokenAmount.getAmount1()

    const token0VolumeETH = getPriceETH(token0, amount0)
    const token1VolumeETH = getPriceETH(token1, amount1)
    const deVolumeETH = token0VolumeETH.plus(token1VolumeETH).div(WETH_DECIMAL)
    investorTvlETH = investorTvlETH.plus(deVolumeETH)     
  }

  return investorTvlETH
}

export function getManagerFeeTvlETH(fund: Address): BigDecimal {
  const xxxFund2 = XXXFund2.bind(fund)
  const feeTokens = xxxFund2.getFeeTokens()

  let feeTvlETH = ZERO_BD
  for (let i=0; i<feeTokens.length; i++) {
    const token = feeTokens[i]
    const tokenAddress = token.tokenAddress
    const amount = token.amount
    const amountETH = getPriceETH(tokenAddress, amount)
    feeTvlETH = feeTvlETH.plus(amountETH)
  }
  return feeTvlETH
}
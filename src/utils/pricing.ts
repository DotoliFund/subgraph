/* eslint-disable prefer-const */
import { BigInt, BigDecimal, Address, log } from '@graphprotocol/graph-ts'
import {
    WETH9,
    WETH_DECIMAL,
    ZERO_BD,
    USDC,
    UNISWAP_V3_FACTORY,
    ZERO_BI,
} from './constants'
import { XXXFund2 } from '../types/templates/XXXFund2/XXXFund2'
import { safeDiv } from '../utils'
import { ERC20 } from '../types/templates/XXXFund2/ERC20'
import { UniswapV3Factory } from '../types/templates/XXXFund2/UniswapV3Factory'
import { UniswapV3Pool } from '../types/templates/XXXFund2/UniswapV3Pool'

const Q192 = f64(2 ** 192)
export function sqrtPriceX96ToTokenPrices(sqrtPriceX96: BigInt, token0: Address, token1: Address): BigDecimal[] {
  let num = sqrtPriceX96.times(sqrtPriceX96).toBigDecimal()
  let denom = BigDecimal.fromString(Q192.toString())
  const token0Decimals = ERC20.bind(token0).decimals()
  const token1Decimals = ERC20.bind(token1).decimals()

  let price1 = num
    .div(denom)
    .times(BigDecimal.fromString(f64(10 ** token1Decimals).toString()))
    .div(BigDecimal.fromString(f64(10 ** token0Decimals).toString()))

  let price0 = safeDiv(BigDecimal.fromString('1'), price1)
  
  return [price0, price1]
}

export function getEthPriceInUSD(): BigDecimal {
  const wethAddress = Address.fromString(WETH9)
  const usdcAddress = Address.fromString(USDC)
  const fees = [500, 3000, 10000]

  let ethPrice = ZERO_BD
  let largestLiquidity = ZERO_BI

  for (let i=0; i<fees.length; i++) {
    const poolAddress = UniswapV3Factory.bind(Address.fromString(UNISWAP_V3_FACTORY))
      .getPool(wethAddress, usdcAddress, fees[i])
    const liquidity = UniswapV3Pool.bind(poolAddress).liquidity()

    if (liquidity.gt(ZERO_BI) && liquidity.gt(largestLiquidity)) {
      const slot0 = UniswapV3Pool.bind(poolAddress).slot0()
      const sqrtPriceX96 = slot0.getSqrtPriceX96()
      ethPrice = sqrtPriceX96ToTokenPrices(sqrtPriceX96, wethAddress, usdcAddress)[0]
      largestLiquidity = liquidity
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

  if (token.equals(Address.fromString(WETH9))) {
    return amountIn.toBigDecimal().div(WETH_DECIMAL)
  }

  for (let i=0; i<fees.length; i++) {
    const poolAddress = UniswapV3Factory.bind(Address.fromString(UNISWAP_V3_FACTORY))
      .getPool(tokenAddress, wethAddress, fees[i])
    const liquidity = UniswapV3Pool.bind(poolAddress).liquidity()
    if (liquidity.gt(ZERO_BI) && liquidity.gt(largestLiquidity)) {
      const sqrtPriceX96 = UniswapV3Pool.bind(poolAddress).slot0().getSqrtPriceX96()
      price = sqrtPriceX96ToTokenPrices(sqrtPriceX96, tokenAddress, wethAddress)[0]
      largestLiquidity = liquidity
    }
  }
  return price.times(amountIn.toBigDecimal().div(WETH_DECIMAL))
}
/* eslint-disable prefer-const */
import { BigInt, BigDecimal, Address, log } from '@graphprotocol/graph-ts'
import {
    WETH9,
    ZERO_BD,
    USDC,
    UNISWAP_V3_FACTORY,
    ZERO_BI,
    ONE_BD,
} from './constants'
import { safeDiv } from '../utils'
import { ERC20 } from '../types/templates/DotoliFund/ERC20'
import { UniswapV3Factory } from '../types/templates/DotoliFund/UniswapV3Factory'
import { UniswapV3Pool } from '../types/templates/DotoliFund/UniswapV3Pool'

const Q192 = f64(2 ** 192)

export function sqrtPriceX96ToTokenPrices(sqrtPriceX96: BigInt, token0: Address, token1: Address): BigDecimal[] {
  let num = sqrtPriceX96.times(sqrtPriceX96).toBigDecimal()
  let denom = BigDecimal.fromString(Q192.toString())
  const token0Decimals = ERC20.bind(token0).decimals()
  const token1Decimals = ERC20.bind(token1).decimals()

  let price1 = num
    .div(denom)
    .times(BigDecimal.fromString(f64(10 ** token0Decimals).toString()))
    .div(BigDecimal.fromString(f64(10 ** token1Decimals).toString()))

  let price0 = safeDiv(BigDecimal.fromString('1'), price1)

  return [price0, price1]
}


export function getEthPriceInUSD(): BigDecimal {
  const wethAddress = Address.fromString(WETH9)
  const usdcAddress = Address.fromString(USDC)
  const fees = [500, 3000, 10000]

  let ethPriceInUSD = ZERO_BD
  let largestLiquidity = ZERO_BI

  for (let i=0; i<fees.length; i++) {
    const poolAddress = UniswapV3Factory.bind(Address.fromString(UNISWAP_V3_FACTORY))
      .try_getPool(wethAddress, usdcAddress, fees[i])
    if (poolAddress.reverted) {
      continue
    }
    const liquidity = UniswapV3Pool.bind(poolAddress.value).try_liquidity()
    if (liquidity.reverted) {
      continue
    }
    if (liquidity.value.gt(ZERO_BI) && liquidity.value.gt(largestLiquidity)) {
      const token0 = UniswapV3Pool.bind(poolAddress.value).token0()
      const token1 = UniswapV3Pool.bind(poolAddress.value).token1()
      const slot0 = UniswapV3Pool.bind(poolAddress.value).slot0()
      const sqrtPriceX96 = slot0.getSqrtPriceX96()
      if (token0.equals(Address.fromHexString(WETH9))) {
        ethPriceInUSD = sqrtPriceX96ToTokenPrices(sqrtPriceX96, token0, token1)[1]
      } else {
        ethPriceInUSD = sqrtPriceX96ToTokenPrices(sqrtPriceX96, token0, token1)[0]
      }
      largestLiquidity = liquidity.value
    }
  }

  return ethPriceInUSD
}

export function getTokenPriceETH(token: Address): BigDecimal {
  const tokenAddress = token
  const wethAddress = Address.fromString(WETH9)
  const fees = [500, 3000, 10000]

  let tokenPriceETH = ZERO_BD
  let largestLiquidity = ZERO_BI

  if (token.equals(Address.fromString(WETH9))) {
    return ONE_BD
  }

  for (let i=0; i<fees.length; i++) {
    const poolAddress = UniswapV3Factory.bind(Address.fromString(UNISWAP_V3_FACTORY))
      .try_getPool(tokenAddress, wethAddress, fees[i])
    if (poolAddress.reverted) {
      continue
    }
    const liquidity = UniswapV3Pool.bind(poolAddress.value).try_liquidity()
    if (liquidity.reverted) {
      continue
    }
    if (liquidity.value.gt(ZERO_BI) && liquidity.value.gt(largestLiquidity)) {
      const token0 = UniswapV3Pool.bind(poolAddress.value).token0()
      const token1 = UniswapV3Pool.bind(poolAddress.value).token1()
      const sqrtPriceX96 = UniswapV3Pool.bind(poolAddress.value).slot0().getSqrtPriceX96()
      if (token0.equals(tokenAddress)) {
        tokenPriceETH = sqrtPriceX96ToTokenPrices(sqrtPriceX96, token0, token1)[1]
        log.info('test111 getPriceETH() token0 = tokenAddress: {}, {}, {}', [token0.toHexString(), token1.toHexString(), tokenPriceETH.toString()])
      } else {
        tokenPriceETH = sqrtPriceX96ToTokenPrices(sqrtPriceX96, token0, token1)[0]
        log.info('test111 getPriceETH() token0 = tokenAddress: {}, {}, {}', [token0.toHexString(), token1.toHexString(), tokenPriceETH.toString()])
      }
      largestLiquidity = liquidity.value
    }
  }
  log.info('test111 getPriceETH() return tokenPriceETH: {}, {}, {}', [tokenAddress.toHexString(), wethAddress.toHexString(), tokenPriceETH.toString()])

  return tokenPriceETH
}
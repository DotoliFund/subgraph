import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { UniswapV3Factory } from '../types/templates/XXXFund2/UniswapV3Factory'
import { UniswapV3PoolState } from '../types/templates/XXXFund2/UniswapV3PoolState'
import { PriceOracle } from '../types/templates/XXXFund2/PriceOracle'
import { NonfungiblePositionManager } from '../types/templates/XXXFund2/NonfungiblePositionManager'
import {
  UNISWAP_V3_FACTORY,
  PRICEORACLE_ADDRESS,
  NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
  WETH9,
  ZERO_BI,
} from './constants'
import { getSqrtRatioAtTick, getAmount0Delta, getAmount1Delta } from './math'

function getPoolAddress(tokenA: Address, tokenB: Address, fee: number): Address {
	const uniswapV3Factory = UniswapV3Factory.bind(Address.fromString(UNISWAP_V3_FACTORY))
	return uniswapV3Factory.getPool(tokenA, tokenB, fee)
}

function getToken0Amount(
  tickCurrent: number,
  tickLower: number,
  tickUpper: number,
  sqrtRatioX96: BigInt,
  positionLiquidity: BigInt
) : BigInt {
  if (tickCurrent < tickLower) {
    return getAmount0Delta(
      getSqrtRatioAtTick(tickLower),
      getSqrtRatioAtTick(tickUpper),
      positionLiquidity,
      false
    )
  } else if (tickCurrent < tickUpper) {
    return getAmount0Delta(
      sqrtRatioX96,
      getSqrtRatioAtTick(tickUpper),
      positionLiquidity,
      false
    )
  } else {
    return ZERO_BI
  }
}

function getToken1Amount(
  tickCurrent: number,
  tickLower: number,
  tickUpper: number,
  sqrtRatioX96: BigInt,
  positionLiquidity: BigInt
) : BigInt {
  if (tickCurrent < tickLower) {
    return ZERO_BI
  } else if (tickCurrent < tickUpper) {
    return getAmount1Delta(
      getSqrtRatioAtTick(tickLower),
      sqrtRatioX96,
      positionLiquidity,
      false
    )
  } else {
    return getAmount1Delta(
      getSqrtRatioAtTick(tickLower),
      getSqrtRatioAtTick(tickUpper),
      positionLiquidity,
      false
    )
  }
}


export function getLiquidityVolumeETH(tokenId: BigInt) : BigDecimal {
  const nonfungiblePositionManager = NonfungiblePositionManager.bind(Address.fromString(NONFUNGIBLE_POSITION_MANAGER_ADDRESS))
  const positionInfo = nonfungiblePositionManager.positions(tokenId)
  const priceOracle = PriceOracle.bind(Address.fromString(PRICEORACLE_ADDRESS))

  const token0 = positionInfo.getToken0()
  const token1 = positionInfo.getToken1()
  const feeAmount = positionInfo.getFee()
  const positionLiquidity = positionInfo.getLiquidity()
  const tickLower = positionInfo.getTickLower()
  const tickUpper = positionInfo.getTickUpper()

  const poolAddress = getPoolAddress(token0, token1, feeAmount)
	const uniswapV3PoolState = UniswapV3PoolState.bind(poolAddress)

	const slot0 = uniswapV3PoolState.slot0()
  const tickCurrent = slot0.getTick()
  const sqrtPriceX96 = slot0.getSqrtPriceX96()
  

  const amount0 = getToken0Amount(tickCurrent, tickLower, tickUpper, sqrtPriceX96, positionLiquidity)
  const amount1 = getToken1Amount(tickCurrent, tickLower, tickUpper, sqrtPriceX96, positionLiquidity)

  const token0VolumeETH = priceOracle.getPriceETH(token0, amount0, Address.fromString(WETH9))
  const token1VolumeETH = priceOracle.getPriceETH(token1, amount1, Address.fromString(WETH9))
  const liquidityVolumeETH = BigDecimal.fromString(token0VolumeETH.plus(token1VolumeETH).toString())

  return liquidityVolumeETH
}
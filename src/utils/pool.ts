import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { UNISWAP_V3_FACTORY } from './constants'
import { UniswapV3PoolState } from '../types/templates/XXXFund2/UniswapV3PoolState'
import { PriceOracle } from '../types/templates/XXXFund2/PriceOracle'
import { NonfungiblePositionManager } from '../types/templates/XXXFund2/NonfungiblePositionManager'
import { XXXFund2 } from '../types/templates/XXXFund2/XXXFund2'
import { ERC20 } from '../types/templates/XXXFund2/ERC20'
import {
  PRICEORACLE_ADDRESS,
  NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
  WETH9,
  USDC,
  WETH_INT,
  WETH_DECIMAL,
  USDC_DECIMAL,
  ZERO_BD,
  ONE_BD,
  ADDRESS_ZERO
} from './constants'

function getPoolAddress(factoryAddress: string, tokenA: Token, tokenB: Token, fee: FeeAmount): string {
	const { address: addressA } = tokenA
	const { address: addressB } = tokenB
	const key = `${factoryAddress}:${addressA}:${addressB}:${fee.toString()}`
	const address = {
		key,
		address: computePoolAddress({
			factoryAddress,
			tokenA,
			tokenB,
			fee,
		}),
	}
	return address.address
}

function getPool(
  tokenA: Token | undefined,
  tokenB: Token | undefined,
  feeAmount: FeeAmount | undefined
): Pool | null {
	if (!tokenA || !tokenB || !feeAmount) return null

	let poolTokens: ([Token, Token, FeeAmount] | undefined) 
	if (tokenA.sortsBefore(tokenB)) {
		poolTokens = [tokenA, tokenB, feeAmount]
	} else {
		poolTokens = [tokenB, tokenA, feeAmount]
	}

  let poolAddress: string = getPoolAddress(UNISWAP_V3_FACTORY, tokenA, tokenB, feeAmount)
	const uniswapV3PoolState = UniswapV3PoolState.bind(Address.fromString(poolAddress))

	const slot0 = uniswapV3PoolState.slot0()
	const liquidity = uniswapV3PoolState.liquidity()

	const pool = new Pool(tokenA, tokenB, feeAmount, slot0.getSqrtPriceX96().toU32(), liquidity.toU32(), slot0.getTick())
	return pool
}

export function getLiquidityVolumeETH(tokenId: BigInt) : BigDecimal {
  const nonfungiblePositionManager = NonfungiblePositionManager.bind(Address.fromString(NONFUNGIBLE_POSITION_MANAGER_ADDRESS))
  const positionInfo = nonfungiblePositionManager.positions(tokenId)
  const priceOracle = PriceOracle.bind(Address.fromString(PRICEORACLE_ADDRESS))

  const token0 = positionInfo.getToken0()
  const token1 = positionInfo.getToken1()
  const feeAmount = positionInfo.getFee()
  const liquidity = positionInfo.getLiquidity()
  const tickLower = positionInfo.getTickLower()
  const tickUpper = positionInfo.getTickUpper()
  
  const token0Contract = ERC20.bind(Address.fromString(token0.toHexString()))
  const token1Contract = ERC20.bind(Address.fromString(token1.toHexString()))

  let poolAddress: string = getPoolAddress(UNISWAP_V3_FACTORY, tokenA, tokenB, feeAmount)
	const uniswapV3PoolState = UniswapV3PoolState.bind(Address.fromString(poolAddress))

	const slot0 = uniswapV3PoolState.slot0()
	const liquidity = uniswapV3PoolState.liquidity()


  if (!pool) return ZERO_BD
  

  const amount0 =
  const amount1 =

  const token0VolumeETH = priceOracle.getPriceETH(token0, BigInt.fromString(amount0), Address.fromString(WETH9))
  const token1VolumeETH = priceOracle.getPriceETH(token1, BigInt.fromString(amount1), Address.fromString(WETH9))
  const liquidityVolumeETH = BigDecimal.fromString(token0VolumeETH.plus(token1VolumeETH).toString())

  return liquidityVolumeETH
}
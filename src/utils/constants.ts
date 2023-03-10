/* eslint-disable prefer-const */
import { BigInt, BigDecimal, Address } from '@graphprotocol/graph-ts'
import { DotoliFactory as FactoryContract } from '../types/DotoliFactory/DotoliFactory'

export const DOTOLI_FACTORY_ADDRESS = '0xD17d0A17BAe5941b81aEE173f2575e5D69450fe0'
export const UNISWAP_V3_FACTORY = '0x1F98431c8aD98523631AE4a59f267346ea31F984'
export const LIQUIDITY_ORACLE_ADDRESS = '0xCBF81C94BD8B73e93f0eB6fB60af0A1fA227e289'
export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'
export const DECIMAL_18 = '1000000000000000000'
export const DECIMAL_6 = '1000000'

export const UNKNWON_SYMBOL = 'Unknown'

export const TYPE_NORMAL = 0
export const TYPE_DEPOSIT = 1
export const TYPE_WITHDRAW = 2

export let ZERO_BI = BigInt.fromI32(0)
export let ONE_BI = BigInt.fromI32(1)
export let ZERO_BD = BigDecimal.fromString('0')
export let ONE_BD = BigDecimal.fromString('1')
export let BI_18 = BigInt.fromI32(18)

export const WETH_DECIMAL = BigDecimal.fromString(DECIMAL_18)
export const USDC_DECIMAL = BigDecimal.fromString(DECIMAL_6)

export let factoryContract = FactoryContract.bind(Address.fromString(DOTOLI_FACTORY_ADDRESS))

// //mainnet
// export const WETH9 = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
// export const WBTC = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'
// export const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
// export const DAI = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
// export const UNI = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'
// export const DTL = '0xEAE906dC299ccd9Cd94584377d0F96Ce144c942f'

//goerli
export const WETH9 = '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6'
// export const WBTC = '0xC04B0d3107736C32e19F1c62b2aF67BE61d63a05'
export const USDC = '0x07865c6E87B9F70255377e024ace6630C1Eaa37F'
// export const DAI = '0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844'
// export const UNI = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'
export const DTL = '0x73860D5Df254461cB325A66AB2367eB51a8EeB33'
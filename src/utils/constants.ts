/* eslint-disable prefer-const */
import { BigInt, BigDecimal, Address } from '@graphprotocol/graph-ts'
import { XXXFactory as FactoryContract } from '../types/XXXFactory/XXXFactory'

//owner is timelock contract
export const FACTORY_OWNER = '0x0203A2F161909893d06C0e3cCb386D7E0919E887'
export const FACTORY_ADDRESS = '0xbC9A8c51c64BD41A7fAfAE05D78f4c6E796184bc'
export const UNISWAP_V3_FACTORY = '0x1F98431c8aD98523631AE4a59f267346ea31F984'
export const SWAP_ROUTER_ADDRESS = '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45'
export const PRICE_ORACLE_ADDRESS = '0xf36DC7B5656B444F1203ce56cB53c458AA6A3393'
export const LIQUIDITY_ORACLE_ADDRESS = '0xCBF81C94BD8B73e93f0eB6fB60af0A1fA227e289'
export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'

// //mainnet
// export const WETH9 = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
// export const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

//goerli
export const WETH9 = '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6'
export const USDC = '0x07865c6E87B9F70255377e024ace6630C1Eaa37F'

export let ZERO_BI = BigInt.fromI32(0)
export let ONE_BI = BigInt.fromI32(1)
export let ZERO_BD = BigDecimal.fromString('0')
export let ONE_BD = BigDecimal.fromString('1')
export let BI_18 = BigInt.fromI32(18)

export const WETH_DECIMAL = BigDecimal.fromString('1000000000000000000')
export const USDC_DECIMAL = BigDecimal.fromString('1000000')

export let factoryContract = FactoryContract.bind(Address.fromString(FACTORY_ADDRESS))
/* eslint-disable prefer-const */
import { BigInt, BigDecimal, Address } from '@graphprotocol/graph-ts'
import { XXXFactory as FactoryContract } from '../types/XXXFactory/XXXFactory'

//owner is timelock contract
export const FACTORY_OWNER = '0x0203A2F161909893d06C0e3cCb386D7E0919E887'
export const FACTORY_ADDRESS = '0x087B5e35D3Ae235Bf65326B1a5f1925482E8767c'
export const SWAP_ROUTER_ADDRESS = '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45'
export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'
export const WHITELIST_TOKENS = [
  '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', //WETH mainnet
  '0xc778417E063141139Fce010982780140Aa0cD5Ab', //WETH9 rinkeby testnet
  '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', //WBTC
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', //USDC
  '0x6B175474E89094C44Da98b954EedeAC495271d0F', //DAI
  '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984' //UNI
]

export let ZERO_BI = BigInt.fromI32(0)
export let ONE_BI = BigInt.fromI32(1)
export let ZERO_BD = BigDecimal.fromString('0')
export let ONE_BD = BigDecimal.fromString('1')
export let BI_18 = BigInt.fromI32(18)

export const WETH_DECIMAL = BigDecimal.fromString('1000000000000000000')
export const USDC_DECIMAL = BigDecimal.fromString('1000000')

export let factoryContract = FactoryContract.bind(Address.fromString(FACTORY_ADDRESS))
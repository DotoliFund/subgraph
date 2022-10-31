/* eslint-disable prefer-const */
import { BigInt, BigDecimal, Address } from '@graphprotocol/graph-ts'
import { XXXFactory as FactoryContract } from '../types/XXXFactory/XXXFactory'

//owner is timelock contract
export const FACTORY_OWNER = '0x0203A2F161909893d06C0e3cCb386D7E0919E887'
export const FACTORY_ADDRESS = '0x5AE83c66c9a9714C4644e89EaBE671CA1408C4E4'
export const UNISWAP_V3_FACTORY = '0x1F98431c8aD98523631AE4a59f267346ea31F984'
export const SWAP_ROUTER_ADDRESS = '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45'
export const NONFUNGIBLE_POSITION_MANAGER_ADDRESS = '0x91ae842A5Ffd8d12023116943e72A606179294f3'
export const PRICEORACLE_ADDRESS = '0x2E69559784b482d0EB90c5C968869c489233A459'
export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'

// //mainnet
// export const WETH9 = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
// export const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

//goerli
export const WETH9 = '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6'
export const USDC = '0xD87Ba7A50B2E7E660f678A895E4B72E7CB4CCd9C'

export let ZERO_BI = BigInt.fromI32(0)
export let ONE_BI = BigInt.fromI32(1)
export let ZERO_BD = BigDecimal.fromString('0')
export let ONE_BD = BigDecimal.fromString('1')
export let BI_18 = BigInt.fromI32(18)

export const WETH_DECIMAL = BigDecimal.fromString('1000000000000000000')
export const WETH_INT = BigInt.fromString('1000000000000000000')
export const USDC_DECIMAL = BigDecimal.fromString('1000000')
export const USDC_INT = BigInt.fromString('1000000')

export let factoryContract = FactoryContract.bind(Address.fromString(FACTORY_ADDRESS))
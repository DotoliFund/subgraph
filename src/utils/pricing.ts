/* eslint-disable prefer-const */
import { BigInt, BigDecimal, Address, ethereum } from '@graphprotocol/graph-ts'
import { Transaction } from '../types/schema'
import {
    PRICEORACLE_ADDRESS,
    WETH9,
    USDC,
    WETH_INT,
    WETH_DECIMAL,
    USDC_DECIMAL,
    ZERO_BD,
    ONE_BD,
    ADDRESS_ZERO
} from './constants'
import { PriceOracle as PriceOracleContract } from '../types/templates/XXXFund2/PriceOracle'
import { XXXFund2 as XXXFund2Contract } from '../types/templates/XXXFund2/XXXFund2'

export function getPriceETH(token: Address, amountIn: BigInt, weth: Address): BigDecimal {
    const priceOracleContract = PriceOracleContract.bind(Address.fromString(PRICEORACLE_ADDRESS))
    const tokenPriceInETH = priceOracleContract.getPriceETH(token, amountIn, weth)
    const deTokenPriceInETH = new BigDecimal(tokenPriceInETH).div(WETH_DECIMAL)
    return deTokenPriceInETH
}

export function getPriceUSD(token: Address, amountIn: BigInt, usd: Address): BigDecimal {
    const priceOracleContract = PriceOracleContract.bind(Address.fromString(PRICEORACLE_ADDRESS))
    const tokenPriceInUSD = priceOracleContract.getPriceUSD(token, amountIn, usd)
    const deTokenPriceInUSD = new BigDecimal(tokenPriceInUSD).div(USDC_DECIMAL)
    return deTokenPriceInUSD
}

export function getInvestorTvlETH(fund: Address, investor: Address): BigDecimal {
    const priceOracleContract = PriceOracleContract.bind(Address.fromString(PRICEORACLE_ADDRESS))
    const xxxFund2Contract = XXXFund2Contract.bind(fund)
    const investorTokens = xxxFund2Contract.getInvestorTokens(investor)

    const investorTvlETH = ZERO_BD
    for (let i=0; i<investorTokens.length; i++) {
        const token = investorTokens[i]
        const tokenAddress = token.tokenAddress
        const amount = token.amount
        const tokenVolumeETH = priceOracleContract.getPriceETH(tokenAddress, amount, Address.fromString(WETH9))
        const deTokenVolumeETH = BigDecimal.fromString(tokenVolumeETH.toString())
        investorTvlETH.plus(deTokenVolumeETH)
    }
    return investorTvlETH.div(WETH_DECIMAL)
}

export function getManagerFeeTvlETH(fund: Address): BigDecimal {
    const priceOracleContract = PriceOracleContract.bind(Address.fromString(PRICEORACLE_ADDRESS))
    const xxxFund2Contract = XXXFund2Contract.bind(fund)
    const feeTokens = xxxFund2Contract.getFeeTokens()

    const feeTvlETH = ZERO_BD
    for (let i=0; i<feeTokens.length; i++) {
        const token = feeTokens[i]
        const tokenAddress = token.tokenAddress
        const amount = token.amount
        const tokenVolumeETH = priceOracleContract.getPriceETH(tokenAddress, amount, Address.fromString(WETH9))
        const deTokenVolumeETH = BigDecimal.fromString(tokenVolumeETH.toString())
        feeTvlETH.plus(deTokenVolumeETH)
    }
    return feeTvlETH.div(WETH_DECIMAL)
}
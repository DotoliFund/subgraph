/* eslint-disable prefer-const */
import { BigDecimal, Address, ethereum, Bytes, log } from '@graphprotocol/graph-ts'
import { Transaction } from '../types/schema'
import { 
  PRICE_ORACLE_ADDRESS,
  USDC,
  USDC_DECIMAL,
  WETH9,
  WETH_DECIMAL,
  ZERO_BD,
  ZERO_BI,
  WETH_INT
} from './constants'
import { getPriceUSD } from './pricing'
import { XXXFund2 } from '../types/templates/XXXFund2/XXXFund2'
import { PriceOracle } from '../types/templates/XXXFund2/PriceOracle'
import { ERC20 } from '../types/templates/XXXFund2/ERC20'

export function getFundID(fund: Address): string {
  const fundID = fund.toHexString().toUpperCase()
  return fundID
}

export function getInvestorID(fund: Address, investor: Address): string {
  const investorID = fund.toHexString().toUpperCase() + '-' + investor.toHexString().toUpperCase()
  return investorID
}

export function loadTransaction(event: ethereum.Event): Transaction {
  let transaction = Transaction.load(event.transaction.hash.toHexString())
  if (transaction === null) {
    transaction = new Transaction(event.transaction.hash.toHexString())
  }
  transaction.blockNumber = event.block.number
  transaction.timestamp = event.block.timestamp
  transaction.save()
  return transaction as Transaction
}

export function getProfitUSD(princial: BigDecimal, volume: BigDecimal): BigDecimal {
  let profitUSD: BigDecimal = ZERO_BD 
  return profitUSD
}

export function getProfitRatio(princial: BigDecimal, volume: BigDecimal): BigDecimal {
  let profitRatio: BigDecimal = ZERO_BD 
  return profitRatio
}

export function isNewToken(fundTokens: Bytes[], token: Bytes): bool {
  for (let i=0; i<fundTokens.length; i++) {
    if(fundTokens[i].equals(token)) return false
  }
  return true
}

export function isTokenEmpty(owner: Address, token: Address): bool {
  const balnce = ERC20.bind(token).balanceOf(owner)
  if (balnce.gt(ZERO_BI)) {
    return false
  } else {
    return true
  }
}

export function getInvestorTokens(_fund: Address, _investor: Address): string[] {
  const xxxFund2 = XXXFund2.bind(_fund)

  let investorTokens: string[] = []
  const _investorTokens = xxxFund2.getInvestorTokens(_investor)
  for (let i=0; i<_investorTokens.length; i++) {
    investorTokens.push(_investorTokens[i].tokenAddress.toHexString())
  }
  return investorTokens
}

export function getTokensVolumeUSD(owner: Address, tokens: Bytes[]): BigDecimal[] {
  const priceOracle = PriceOracle.bind(Address.fromString(PRICE_ORACLE_ADDRESS))

  const ethPriceInUSD = getPriceUSD(Address.fromString(WETH9), WETH_INT, Address.fromString(USDC))
  
  let tokensVolumeUSD: BigDecimal[] = []
  for (let i=0; i<tokens.length; i++) {
    const balnce = ERC20.bind(Address.fromBytes(tokens[i])).balanceOf(owner)
    const amountETH = priceOracle.getPriceETH(Address.fromBytes(tokens[i]), balnce, Address.fromString(WETH9))
    const deAmountETH = new BigDecimal(amountETH).div(WETH_DECIMAL)
    const amountUSD = deAmountETH.times(ethPriceInUSD)
    tokensVolumeUSD.push(amountUSD)
    log.info('ethPriceInUSD, amountETH, amountUSD: {}, {}, {}', [ethPriceInUSD.toString(), amountETH.toString(), amountUSD.toString()])
  }
  return tokensVolumeUSD
}
import { BigInt, Address } from '@graphprotocol/graph-ts'
import { ERC20 } from '../types/DotoliFund/ERC20'
import { UNKNWON, ZERO_BI } from './constants'

export function fetchTokenSymbol(tokenAddress: Address): string {
    let contract = ERC20.bind(tokenAddress)
  
    // try types string and bytes32 for symbol
    let symbolValue = UNKNWON
    let symbolResult = contract.try_symbol()
    if (symbolResult.reverted) {

    } else {
      symbolValue = symbolResult.value
    }
    return symbolValue
  }
  
  export function fetchTokenDecimals(tokenAddress: Address): BigInt {
    let contract = ERC20.bind(tokenAddress)
    // try types uint8 for decimals
    let decimalResult = contract.try_decimals()
    if (decimalResult.reverted) {
      return ZERO_BI
    } else {
      return BigInt.fromI32(decimalResult.value as i32)
    }
  }
import { Address, Bytes, BigInt, log } from "@graphprotocol/graph-ts"
import {
  SettingCreated,
  OwnerChanged,
  MinPoolAmountChanged,
  ManagerFeeChanged,
  WhiteListTokenAdded,
  WhiteListTokenRemoved
} from './types/DotoliSetting/DotoliSetting'
import { 
  Setting,
  WhiteListToken
} from "./types/schema"
import { 
  DOTOLI_SETTING_ADDRESS,
  ADDRESS_ZERO,
  DECIMAL_18,
  WETH9,
  DTL
} from './utils/constants'
import { fetchTokenSymbol, fetchTokenDecimals } from './utils/token'


export function handleSettingCreated(event: SettingCreated): void {
  let setting = Setting.load(Bytes.fromHexString(DOTOLI_SETTING_ADDRESS))
  if (setting === null) {
    setting = new Setting(Bytes.fromHexString(DOTOLI_SETTING_ADDRESS))
    setting.managerFee = BigInt.fromString("10000")
    setting.minPoolAmount = BigInt.fromString(DECIMAL_18)
    setting.owner = Address.fromString(ADDRESS_ZERO)
    setting.save()
  }
  
  const weth9 = new WhiteListToken(Address.fromHexString(WETH9))
  weth9.id = Bytes.fromHexString(WETH9)
  weth9.address = Bytes.fromHexString(WETH9)
  weth9.decimals = fetchTokenDecimals(Address.fromString(WETH9))
  if (weth9.decimals === null) {
    log.debug('the decimals on weth9 token was null', [])
    return
  }
  weth9.symbol = fetchTokenSymbol(Address.fromString(WETH9))
  weth9.updatedTimestamp = event.block.timestamp
  weth9.isWhiteListToken = true
  weth9.save()

  const dtl = new WhiteListToken(Address.fromHexString(DTL))
  dtl.id = Bytes.fromHexString(DTL)
  dtl.address = Bytes.fromHexString(DTL)
  dtl.decimals = fetchTokenDecimals(Address.fromString(DTL))
  if (dtl.decimals === null) {
    log.debug('the decimals on dtl token was null', [])
    return
  }
  dtl.symbol = fetchTokenSymbol(Address.fromString(DTL))
  dtl.updatedTimestamp = event.block.timestamp
  dtl.isWhiteListToken = true
  dtl.save()
}

export function handleOwnerChanged(event: OwnerChanged): void {
  let setting = Setting.load(Bytes.fromHexString(DOTOLI_SETTING_ADDRESS))
  if (!setting) return
  
  setting.owner = event.params.newOwner
  setting.save()
}

export function handleMinPoolAmountChanged(event: MinPoolAmountChanged): void {
  let setting = Setting.load(Bytes.fromHexString(DOTOLI_SETTING_ADDRESS))
  if (!setting) return
  setting.minPoolAmount = event.params.amount
  setting.save()
}

export function handleManagerFeeChanged(event: ManagerFeeChanged): void {
  let setting = Setting.load(Bytes.fromHexString(DOTOLI_SETTING_ADDRESS))
  if (!setting) return
  setting.managerFee = event.params.managerFee
  setting.save()
}

export function handleWhiteListTokenAdded(event: WhiteListTokenAdded): void {
  let token = WhiteListToken.load(event.params.token)
  if (!token) {
    token = new WhiteListToken(event.params.token)
    token.id = event.params.token
    token.address = event.params.token
    token.decimals = fetchTokenDecimals(event.params.token)
    if (token.decimals === null) {
      log.debug('the decimals on {} token was null', [event.params.token.toHexString()])
      return
    }
    token.symbol = fetchTokenSymbol(event.params.token)
    token.updatedTimestamp = event.block.timestamp
    token.isWhiteListToken = true
    token.save()
  } else {
    token.updatedTimestamp = event.block.timestamp
    token.isWhiteListToken = true
    token.save()
  }
}

export function handleWhiteListTokenRemoved(event: WhiteListTokenRemoved): void {
  let token = WhiteListToken.load(event.params.token)
  if (token) {
    token.updatedTimestamp = event.block.timestamp
    token.isWhiteListToken = false
    token.save()
  }
}
import { newMockEvent } from "matchstick-as"
import { ethereum, Address } from "@graphprotocol/graph-ts"
import { FundCreated, OwnerChanged } from "../generated/XXXFactory/XXXFactory"

export function createFundCreatedEvent(
  param0: Address,
  param1: Address
): FundCreated {
  let fundCreatedEvent = changetype<FundCreated>(newMockEvent())

  fundCreatedEvent.parameters = new Array()

  fundCreatedEvent.parameters.push(
    new ethereum.EventParam("param0", ethereum.Value.fromAddress(param0))
  )
  fundCreatedEvent.parameters.push(
    new ethereum.EventParam("param1", ethereum.Value.fromAddress(param1))
  )

  return fundCreatedEvent
}

export function createOwnerChangedEvent(
  oldOwner: Address,
  newOwner: Address
): OwnerChanged {
  let ownerChangedEvent = changetype<OwnerChanged>(newMockEvent())

  ownerChangedEvent.parameters = new Array()

  ownerChangedEvent.parameters.push(
    new ethereum.EventParam("oldOwner", ethereum.Value.fromAddress(oldOwner))
  )
  ownerChangedEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return ownerChangedEvent
}

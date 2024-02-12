import { ethereum, BigInt }  from "@graphprotocol/graph-ts"
// This is generated from our ABI.
import {
  Approval as ApprovalEvent,
  ApprovalForAll as ApprovalForAllEvent,
  EIP712DomainChanged as EIP712DomainChangedEvent,
  OperatorAllowlistRegistryUpdated as OperatorAllowlistRegistryUpdatedEvent,
  RoleAdminChanged as RoleAdminChangedEvent,
  RoleGranted as RoleGrantedEvent,
  RoleRevoked as RoleRevokedEvent,
  Transfer as TransferEvent
} from "../generated/guild/guild"

// This is generated from our `schema.graph` file.
import {Owner, Token, Transfer} from "../generated/schema"
import { normalize } from "./helpers";

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

function createEventID(event: ethereum.Event): string
{
  return event.block.number.toString().concat('-').concat(event.logIndex.toString());
}

export function handleTransfer(event: TransferEvent): void {
  let token    = Token.load(event.params.tokenId.toString());
  let from     = Owner.load(event.params.from.toHex());
  let to       = Owner.load(event.params.to.toHex());
  let transfer = new Transfer(createEventID(event));

  if (from == null) {
    from = new Owner(event.params.from.toHex());
    from.tokensOwned = BigInt.fromI32(1);
  }

  if (from.id != ZERO_ADDRESS) {
    from.tokensOwned -= BigInt.fromI32(1);
  }
  from.save();

  if (to == null) {
    to = new Owner(event.params.to.toHex());
    to.tokensOwned = BigInt.fromI32(0);
  }
  to.tokensOwned += BigInt.fromI32(1);
  to.save();
  
  if (token == null) {
    token = new Token(event.params.tokenId.toString());
    token.mintTime = event.block.timestamp;
    token.transferCount = BigInt.fromI32(0);
  }
  token.owner = to.id;
  token.transferCount += BigInt.fromI32(1);
  token.save();

  transfer.token       = token.id;
  transfer.from        = from.id;
  transfer.to          = to.id;
  transfer.transaction = event.transaction.hash;
  transfer.timestamp   = event.block.timestamp;
  transfer.save();

}


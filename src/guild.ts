import { Address, BigInt, log } from "@graphprotocol/graph-ts"
// This is generated from our ABI.
import {
  Approval as ApprovalEvent,
  ApprovalForAll as ApprovalForAllEvent,
  EIP712DomainChanged as EIP712DomainChangedEvent,
  OperatorAllowlistRegistryUpdated as OperatorAllowlistRegistryUpdatedEvent,
  RoleAdminChanged as RoleAdminChangedEvent,
  RoleGranted as RoleGrantedEvent,
  RoleRevoked as RoleRevokedEvent,
  Transfer as TransferEvent,
  guild as Contract
} from "../generated/guild/guild"

// This is generated from our `schema.graph` file.
import {Owner, OwnerTokenLookup, Token, TokenContract} from "../generated/schema"

import { normalize } from "./helpers";

export function handleTransfer(event: TransferEvent): void {
  // The names of `params` are derived directly from the provided ABI.
  let tokenId = event.params.tokenId;
  // In our example, a custom ID isn't needed, but consider that this would be useful if we were
  // indexing multiple contracts handling different tokens.
  let id = event.address.toHex() + '_' + tokenId.toString();
  let contractId = event.address.toHex();

  let contract = Contract.bind(event.address);

  // In our mappings, we can read previously stored values, and if they
  // don't exist, we can create new a new entity to store.
  let tokenContract = TokenContract.load(contractId);
  if(tokenContract == null) {
    tokenContract = new TokenContract(contractId)
    // See documentation for accessing public state:
    // https://thegraph.com/docs/en/developing/graph-ts/api/#access-to-smart-contract-state
    // This generates an `eth_call` which is costly and can take time, so try to limit use.
    let name = contract.try_name();
    if(!name.reverted) {
        // This is a handy function to normalize strings. You don't always know what will end up on-chain,
        // but certain values like \u0000 can't be stored in the graph-node database (Postgres).
        tokenContract.name = normalize(name.value);
    }
    let symbol = contract.try_symbol();
    if(!symbol.reverted) {
        tokenContract.symbol = normalize(symbol.value);
    }
    tokenContract.save()
  }
  let token = Token.load(id)
  if(token == null){
    token = new Token(id)
    token.contract = tokenContract.id;
    token.tokenID = tokenId;
    token.mintTime = event.block.timestamp;
    let metadataURI = contract.try_tokenURI(tokenId);
    if(!metadataURI.reverted) {
        token.tokenURI = normalize(metadataURI.value);
    } else {
        token.tokenURI = "";
    }
    token.save()
  }

  // Load owner or save new owner. Ignore "zero" address used to mint.
  // In reality, we should always have an owner for a token that was previously minted,
  // reality is often surprising on-chain though!
  if (event.params.from != Address.zero()) {
    log.warning("zero address",[])

    let from = Owner.load(event.params.from.toHex())
    if (from == null) {
        from = new Owner(event.params.from.toHex())
        from.save()
    }

  }

  // Same as above, but checking the to address. "zero" here would be a burn.
  if (event.params.to != Address.zero()) {
    let to = Owner.load(event.params.to.toHex())
    if (to == null){
        to = new Owner(event.params.to.toHex())
        to.save()
    }
  }

  handleLookupQuantity(contract,event.params.from,event.params.to,token,BigInt.fromI32(1));
}

function handleLookupQuantity(contract:Contract,from:Address,to:Address,token:Token,quantity:BigInt=BigInt.fromI32('1')):void{

  let wasMinted: boolean = from == Address.zero();

  let isBurned: boolean = to == Address.zero();

  // If it was minted, the FROM address is the Zero address, therefore we don't create a lookup for it. (it won't work)
  if (wasMinted == false) {
    // I denote look-ups with the id `UserAddress_ContractAddress_tokenId`
    let fromLookupId = from.toHex() + "_" + token.id;

    let fromLookup = OwnerTokenLookup.load(fromLookupId);
    if (fromLookup == null) {
      // Lookup doesn't exist so we create a new one.
      fromLookup = new OwnerTokenLookup(fromLookupId);
      fromLookup.owner = from.toHex();
      fromLookup.contract = token.contract;
      fromLookup.token = token.id;
      fromLookup.quantity = new BigInt(0);
      fromLookup.save();
    }

    log.debug("Getting balance of from: {}", [from.toHex()]);

    // We hit the contract of that collection and ask it how much the FROM user owns.
    let balFrom = contract.try_balanceOf(from);

    if (!balFrom.reverted) {
      // if contract responded, set the quantity FROM user owns.
      fromLookup.quantity = balFrom.value;
    } else if (fromLookup.quantity >= quantity) {
      // if contract badly responded, we attempt to do simple math and remove the quantity sent.
      let amount = fromLookup.quantity.toI32() - quantity.toI32();
      fromLookup.quantity = new BigInt(amount);
    } else {
      // Else if the value sent is greater than previous quantity, we set it to 0.
      fromLookup.quantity = new BigInt(0);
    }
    fromLookup.save();
  }

  // If it was burned, the TO address is the Zero address, therefore we don't create a lookup for it. (it won't work)
  if (isBurned == false) {
    // I denote look-ups with the id `UserAddress_contractAddress_tokenId`
    let toLookupId = to.toHex() + "_" + token.id;
    // to lookup handler
    let toLookup = OwnerTokenLookup.load(toLookupId);
    if (toLookup == null) {
      toLookup = new OwnerTokenLookup(toLookupId);
      toLookup.owner = to.toHex();
      toLookup.contract = token.contract;
      toLookup.token = token.id;
      toLookup.quantity = new BigInt(0);
      toLookup.save();
    }

    // This collectible was minted and sent to this user, therefore we know the user now owns the full value.
    if (wasMinted) {
      toLookup.quantity = quantity;
    } else {
      // Else, we hit the contract of this collectible's collection to know how much TO owns.
      let balTo = contract.try_balanceOf(to);

      if (!balTo.reverted) {
        // If replied nicely, we set the quantity that user owns for this collectible.
        toLookup.quantity = balTo.value;
      } else {
        // if contract badly responded, we attempt to do simple math and add the quantity received.
        let amount = toLookup.quantity.toI32() + quantity.toI32();
        toLookup.quantity = new BigInt(amount);
      }
      //Check the quantity is valid:
      // if (toLookup.quantity == null) {
      //   toLookup.quantity = new BigInt(1);
      // }
    }

    toLookup.save();
  }
}

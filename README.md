# Subgraph 101

## Basic subgraph with `graph init`

We'll be indexing an [ERC-721 NFT contract](https://explorer.testnet.immutable.com/token/0xD2c0e3119C67d7A21fFC74383fB10e510F706A45) on Immutable Testnet.

What you'll need for your own:
- Contract Address
- ABI
- Start Block

Caveat: Immutable isn't included in The Graph CLI's list of supported networks so some manual editing is needed.

## Mutable data and aggregates

Much of the code for this example was borrowed from [Benjythebee](https://github.com/Benjythebee/erc721-and-erc1155-subgraph).

## Can we make it faster?

The previous subgraph has a lot of eth_calls, can we get the same result w/o them?

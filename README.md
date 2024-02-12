# Subgraph 101

Tools to install:
- Node / NPM
- The Graph CLI: `npm install -g @graphprotocol/graph-cli`
- Goldsky CLI: `curl https://goldsky.com | sh` : MacOS Silicon caveat: `/usr/sbin/softwareupdate --install-rosetta --agree-to-license`

## Basic subgraph with `graph init`

We'll be indexing an [ERC-721 NFT contract](https://explorer.testnet.immutable.com/token/0xD2c0e3119C67d7A21fFC74383fB10e510F706A45) on Immutable Testnet.

What you'll need for your own:
- Contract Address
- ABI
- Start Block

Caveat: Immutable isn't included in The Graph CLI's list of supported networks so some manual editing is needed.

## Mutable data and aggregates (upgraded branch: `git switch upgraded`)

Much of the code for this example was borrowed from [Benjythebee](https://github.com/Benjythebee/erc721-and-erc1155-subgraph).

## Can we make it faster? (anotherway branch: `git switch anotherway`)

The previous subgraph has a lot of eth_calls, can we get the same result w/o them?

This subgraph borrwos a lot from the [POAP subgraph](https://github.com/poap-xyz/poap-subgraph).

## Other fun subgraph resources

- [The Graph's](https://thegraph.com/docs/en/quick-start/) documentation for subgraphs.
  - [Creating a Subgraph](https://thegraph.com/docs/en/developing/creating-a-subgraph/).
  - [AssemblyScript API](https://thegraph.com/docs/en/developing/graph-ts/README/).
- [Messari subgraphs](https://github.com/messari/subgraphs): A collection of hand crafted subgraphs that cover a lot of different protocols. Lots of tooling is involved to build these, ping me if you need help.
- [Nouns](https://github.com/nounsDAO/nouns-monorepo/tree/master/packages/nouns-subgraph): A solid example of a DAO subgraph.

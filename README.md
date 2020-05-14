# symbol-token-standards

[![npm version](https://badge.fury.io/js/symbol-token-standards.svg)](https://badge.fury.io/js/symbol-token-standards)
[![Build Status](https://travis-ci.com/nemfoundation/symbol-token-standards.svg?branch=master)](https://travis-ci.com/nemfoundation/symbol-token-standards)
[![Slack](https://img.shields.io/badge/chat-on%20slack-green.svg)](https://symbol.slack.com/messages/CB0UU89GS//)

*The author of this package cannot be held responsible for any loss of money or any malintentioned usage forms of this package. Please use this package with caution.*

Symbol Token Standards library to create security tokens / financial instruments for the Symbol platform.

This is a PoC to validate the proposed [NIP13 - Security Token Standard](https://github.com/nemtech/NIP/blob/master/NIPs/nip-0013.md). When stable, the repository will be moved to the [nemtech](https://github.com/nemtech) organization.

## Installation

`npm install symbol-token-standards`

## Example Library Usage

:warning: The following example usage for the `symbol-token-standards` library is subject to change.

```javascript
import { AggregateTransaction, PublicAccount, SignedTransaction } from 'symbol-sdk'
import { MnemonicPassPhrase } from 'symbol-hd-wallets'
import { NIP13, NetworkConfig, TransactionParameters } from 'symbol-token-standards'
import { TransactionURI } from 'symbol-uri-scheme'

// :warning: The following settings are network specific and may need changes
const transactionParams = new TransactionParameters(
  Deadline.create(),
  750000, // maxFee
)

// :warning: You should create separate backups of
// authorities and security token pass phrases.
const authKeys = MnemonicPassPhrase.createRandom() // backup the resulting 24-words safely!
const tokenKeys = MnemonicPassPhrase.createRandom() // backup the resulting 24-words safely!

// :warning: It is recommended to create operator
// keys offline and using a separate device.
const operators = [
  new PublicAccount('PUBLIC_KEY_OPERATOR_1', 'ADDRESS_OPERATOR_1'),
  new PublicAccount('PUBLIC_KEY_OPERATOR_2', 'ADDRESS_OPERATOR_2'),
  // ...
]

// initialize NIP13 library
const network = new NetworkConfig(...)
const tokenAuthority = new NIP13.TokenAuthority(network, authKeys)
const securityToken = new NIP13.Token(network, tokenKeys)

// offline creation of the `CreateToken` security token contract
const metadata = new SecuritiesMetadata(
  'MIC',
  'ISIN',
  'ISO_10962',
  'Website',
  'Sector',
  'Industry',
  {
    'customKey1': 'metadata',
    // ...
  },
)
const tokenId = securityToken.create(
  'My Awesome Security Token', // security token name
  securityToken.getTarget().publicAccount, // actor
  tokenAuthority.getAuthority().publicAccount, // token authority
  operators,
  123456789, // total outstanding shares
  metadata,
  transactionParams,
)

// get the transaction URI for `CreateToken` execution
const resultURI: TransactionURI = securityToken.result

// :warning: It is recommended to sign the resulting transactions
// using a hardware wallet rather than any type of software generated
// wallets.
const transaction: AggregateTransaction = resultURI.toTransaction()
const signedTransaction: SignedTransaction = securityToken.getTarget().sign(transaction, 'networkGenerationHash')

// `signedTransaction` can now be broadcast to the Symbol network of choice.

// It is important to denote that given the **aggregate** nature of security
// token contracts, multiple parties MAY be involved in the transaction and
// it is therefor required to issue a HashLockTransaction before announcing
// the aggregate bonded transaction that represents the contract.
```

## License

Copyright 2020-present NEM

Licensed under the [Apache v2.0 License](LICENSE).

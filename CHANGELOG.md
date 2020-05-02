# CHANGELOG
All notable changes to this project will be documented in this file.

The changelog format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [v0.3.2][v0.3.2]

- Added NIP13/models/SecuritiesMetadata
- Removed Standard.create() and Standard.publish() to decouple creation/publication parameters
- Added NIP13.TokenStandard.create() metadata parameter
- Added MosaicMetadataTransaction for ISO_10383, ISO_6166 and ISO_10962

## [v0.3.0][v0.3.0] - 02 May 2020

- Added NetworkConfig and TransactionParameters
- Added network and parameters to Context
- Refactored NIP13 commands to be more network agnostic

## [v0.2.0][v0.2.0]

#### Added

- Added draft implementation of NIP13 token standard
- Added draft implementation of NIP13 CreateToken command
- Added draft implementation of NIP13 PublishToken command
- Added draft implementation of NIP13 TransferOwnership command
- Added package snapshot releases following NIP14 (travis/)
- Added gh-pages to repository for automatic github pages deploy


[v0.3.2]: https://github.com/nemfoundation/symbol-token-standards/releases/tag/v0.3.2
[v0.3.0]: https://github.com/nemfoundation/symbol-token-standards/releases/tag/v0.3.0
[v0.2.0]: https://github.com/nemfoundation/symbol-token-standards/releases/tag/v0.2.0


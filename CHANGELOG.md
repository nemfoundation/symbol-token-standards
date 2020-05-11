# CHANGELOG
All notable changes to this project will be documented in this file.

The changelog format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [v0.5.1][v0.5.1]

- (NIP13) Added draft implementation for NIP13 token command `AttachDocument`
- (NIP13) Added draft implementation for NIP13 token command `BatchTransferOwnership`
- (NIP13) Added draft implementation for NIP13 token command `BatchTransferOwnershipWithData`
- (NIP13) Added draft implementation for NIP13 token command `DelegateIssuerPower`
- (NIP13) Added draft implementation for NIP13 token command `ForcedTransfer`
- (NIP13) Added draft implementation for NIP13 token command `LockBalance`
- (NIP13) Added draft implementation for NIP13 token command `ModifyMetadata`
- (NIP13) Added draft implementation for NIP13 token command `ModifyRestriction`
- (NIP13) Added draft implementation for NIP13 token command `RevokeIssuerPower`
- (NIP13) Added draft implementation for NIP13 token command `TransferOwnershipWithData`
- (NIP13) Added draft implementation for NIP13 token command `UnlockBalance`

## [v0.5.0][v0.5.0]

- (NIP13) Decoupled helpers/Derivation from library level to include in NIP13/services
- (NIP13) Removed _namespaces_ in built library in favor for exported modules
- (NIP13) Added TokenAuthority draft for allowing multiple token registrars
- (NIP13) Added 'authority' public account argument to NIP13 CreateToken command

## [v0.4.2][v0.4.2]

- (NIP13) Changed Command interface to remove synchronize and move inside Standard interface
- (NIP13) NIP13.TokenStandard now synchronizes operators, partitions and mosaicInfo
- (NIP13) Fixed NIP13/services/PartitionService
- (NIP13) Added NIP13/services/TransactionService for getWithdrawals
- (NIP13) Added NIP13 `CreateToken` transactions for 'NIP13' token identifier in AccountMetadata and MosaicMetadata
- (NIP13) Fixed derivation index overflow in getPathForPartition
- (NIP13) Added TransferOwnership functionality for TARGET->PARTITION & PARTITION->PARTITION
- (NIP13) Refactored TransferOwnership with createPartition() 

## [v0.4.1][v0.4.1]

- (NIP13) Fixed multi-signature account conversion for target account
- (NIP13) Added custom mosaic metadata capacity

## [v0.4.0][v0.4.0]

- (NIP13) Decoupled transactions/accounts from library level
- (NIP13) Changed PublishToken to TransferOwnership with first draft
- (NIP13) Added mosaic metadata for securities NAME
- (NIP13) Added account metadata for partition account NAME
- (NIP13) Added partition account multi-signature account conversion
- (NIP13) Added partition creation / update / transfer in TransferOwnership

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


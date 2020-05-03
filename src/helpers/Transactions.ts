/**
 * Copyright 2020 NEM
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {
  AccountMosaicRestrictionTransaction,
  AccountRestrictionFlags,
  Address,
  EmptyMessage,
  KeyGenerator,
  Mosaic,
  MosaicAddressRestrictionTransaction,
  MosaicDefinitionTransaction,
  MosaicFlags,
  MosaicGlobalRestrictionTransaction,
  MosaicId,
  MosaicNonce,
  MosaicRestrictionType,
  MosaicSupplyChangeAction,
  MosaicSupplyChangeTransaction,
  MultisigAccountModificationTransaction,
  NamespaceId,
  NamespaceRegistrationTransaction,
  PlainMessage,
  PublicAccount,
  TransferTransaction,
  UInt64,
  MosaicAliasTransaction,
  AliasAction,
  MosaicMetadataTransaction,
} from 'symbol-sdk'

// internal dependencies
import { Context } from '../contracts/Context'

/**
 * @namespace Transactions
 * @package NIP13 Helpers
 * @description Namespace that wraps all helper functions to handle Transactions.
 * @link https://nemtech.github.io/concepts/transaction.html#transaction-types
 */
export namespace Transactions {
  /**
   * @function NIP13.Transactions.createMosaicDefinition()
   * @description Helper function to create a mosaic definition transaction.
   * @link https://nemtech.github.io/concepts/mosaic.html#mosaic-definition-transaction
   */
  export const createMosaicDefinition = (
    context: Context,
    nonce: MosaicNonce,
    mosaicId: MosaicId,
    duration: number,
    withFee: boolean = false,
  ): MosaicDefinitionTransaction => {
    return MosaicDefinitionTransaction.create(
      context.parameters.deadline,
      nonce,
      mosaicId,
      MosaicFlags.create(true, false, true), // always non-transferable.
      0,
      UInt64.fromUint(duration),
      context.network.networkType,
      withFee ? context.parameters.maxFee : undefined,
    )
  }

  /**
   * @function NIP13.Transactions.createMosaicSupplyChange()
   * @description Helper function to create a mosaic supply change transaction.
   * @link https://nemtech.github.io/concepts/mosaic.html#mosaic-supply-change-transaction
   */
  export const createMosaicSupplyChange = (
    context: Context,
    supply: number,
    mosaicId: MosaicId,
    action: MosaicSupplyChangeAction = MosaicSupplyChangeAction.Increase,
    withFee: boolean = false,
  ): MosaicSupplyChangeTransaction => {
    return MosaicSupplyChangeTransaction.create(
      context.parameters.deadline,
      mosaicId,
      action,
      UInt64.fromUint(supply),
      context.network.networkType,
      withFee ? context.parameters.maxFee : undefined,
    )
  }

  /**
   * @function NIP13.Transactions.createNamespaceRegistration()
   * @description Helper function to create a namespace registration transaction.
   * @link https://nemtech.github.io/concepts/namespace.html#namespace-registration-transaction
   */
  export const createNamespaceRegistration = (
    context: Context,
    duration: number,
    name: string,
    parent?: string,
    withFee: boolean = false,
  ): NamespaceRegistrationTransaction => {
    if (undefined === parent || !parent.length) {
      return NamespaceRegistrationTransaction.createRootNamespace(
        context.parameters.deadline,
        name,
        UInt64.fromUint(duration),
        context.network.networkType,
        withFee ? context.parameters.maxFee : undefined,
      )
    }

    return NamespaceRegistrationTransaction.createSubNamespace(
      context.parameters.deadline,
      name,
      parent,
      context.network.networkType,
      withFee ? context.parameters.maxFee : undefined,
    )
  }

  /**
   * @function NIP13.Transactions.createMultisigAccountModification()
   * @description Helper function to create a multisig account modification transaction.
   * @link https://nemtech.github.io/concepts/multisig-account.html#multisig-account-modification-transaction
   */
  export const createMultisigAccountModification = (
    context: Context,
    minimumOperators: number,
    operators: PublicAccount[],
    withFee: boolean = false,
  ): MultisigAccountModificationTransaction => {
    return MultisigAccountModificationTransaction.create(
      context.parameters.deadline,
      minimumOperators,
      minimumOperators,
      operators,
      [],
      context.network.networkType,
      withFee ? context.parameters.maxFee : undefined,
    )
  }

  /**
   * @function NIP13.Transactions.createAccountMosaicRestriction()
   * @description Helper function to create a account mosaic restriction transaction.
   * @link https://nemtech.github.io/concepts/account-restriction.html#account-mosaic-restriction-transaction
   */
  export const createAccountMosaicRestriction = (
    context: Context,
    targets: (MosaicId | NamespaceId)[],
    flags: AccountRestrictionFlags = AccountRestrictionFlags.AllowMosaic,
    withFee: boolean = false,
  ): AccountMosaicRestrictionTransaction => {
    return AccountMosaicRestrictionTransaction.create(
      context.parameters.deadline,
      flags,
      targets,
      [],
      context.network.networkType,
      withFee ? context.parameters.maxFee : undefined,
    )
  }

  /**
   * @function NIP13.Transactions.createMosaicGlobalRestriction()
   * @description Helper function to create a mosaic global restriction transaction.
   * @link https://nemtech.github.io/concepts/mosaic-restriction.html#mosaic-global-restriction-transaction
   */
  export const createMosaicGlobalRestriction = (
    context: Context,
    mosaicId: MosaicId,
    restrictionKey: string,
    type: MosaicRestrictionType = MosaicRestrictionType.EQ,
    value: number = 1,
    withFee: boolean = false,
  ): MosaicGlobalRestrictionTransaction => {
    const key = KeyGenerator.generateUInt64Key(restrictionKey.toLowerCase())
    return MosaicGlobalRestrictionTransaction.create(
      context.parameters.deadline,
      mosaicId,
      key,
      UInt64.fromUint(0), // previousRestrictionValue
      MosaicRestrictionType.NONE,
      UInt64.fromUint(value), // newRestrictionValue
      type, // newRestrictionType
      context.network.networkType,
      undefined, // referenceMosaicId
      withFee ? context.parameters.maxFee : undefined,
    )
  }

  /**
   * @function NIP13.Transactions.createMosaicAddressRestriction()
   * @description Helper function to create a mosaic address restriction transaction.
   * @link https://nemtech.github.io/concepts/mosaic-restriction.html#mosaicaddressrestrictiontransaction
   */
  export const createMosaicAddressRestriction = (
    context: Context,
    mosaicId: MosaicId,
    restrictionKey: string,
    target: Address,
    value: number,
    withFee: boolean = false,
  ): MosaicAddressRestrictionTransaction => {
    const key = KeyGenerator.generateUInt64Key(restrictionKey.toLowerCase())
    return MosaicAddressRestrictionTransaction.create(
      context.parameters.deadline,
      mosaicId,
      key,
      target,
      UInt64.fromUint(value), // newRestrictionValue
      context.network.networkType,
      undefined,
      withFee ? context.parameters.maxFee : undefined,
    )
  }

  /**
   * @function NIP13.Transactions.createMosaicAlias()
   * @description Helper function to create a mosaic alias transaction.
   * @link https://nemtech.github.io/concepts/namespace.html#mosaic-alias-transaction
   */
  export const createMosaicAlias = (
    context: Context,
    namespaceId: NamespaceId,
    mosaicId: MosaicId,
    withFee: boolean = false,
  ): MosaicAliasTransaction => {
    return MosaicAliasTransaction.create(
      context.parameters.deadline,
      AliasAction.Link,
      namespaceId,
      mosaicId,
      context.network.networkType,
      withFee ? context.parameters.maxFee : undefined,
    )
  }

  /**
   * @function NIP13.Transactions.createMosaicMetadata()
   * @description Helper function to create a mosaic metadata transaction.
   * @link https://nemtech.github.io/concepts/metadata.html#mosaic-metadata-transaction
   */
  export const createMosaicMetadata = (
    context: Context,
    mosaicId: MosaicId,
    targetAccount: PublicAccount,
    metadataKey: string,
    metadataValue: string,
    withFee: boolean = false,
  ): MosaicMetadataTransaction => {
    return MosaicMetadataTransaction.create(
      context.parameters.deadline,
      targetAccount.publicKey,
      KeyGenerator.generateUInt64Key(metadataKey),
      mosaicId,
      metadataValue.length,
      metadataValue,
      context.network.networkType,
      withFee ? context.parameters.maxFee : undefined,
    )
  }

  /**
   * @function NIP13.Transactions.createTransfer()
   * @description Helper function to create a transfer transaction.
   * @link https://nemtech.github.io/concepts/transfer-transaction.html#id1
   */
  export const createTransfer = (
    context: Context,
    recipient: Address,
    mosaicId?: MosaicId,
    amount?: number,
    message?: string,
    withFee: boolean = false,
  ): TransferTransaction => {
    return TransferTransaction.create(
      context.parameters.deadline,
      recipient,
      mosaicId && amount !== undefined ? [
        new Mosaic(mosaicId, UInt64.fromUint(amount)),
      ] : [],
      message ? PlainMessage.create(message) : EmptyMessage,
      context.network.networkType,
      withFee ? context.parameters.maxFee : undefined,
    )
  }
}

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
} from 'symbol-sdk'

// internal dependencies
import { Context } from '../../index'

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
  ): MosaicDefinitionTransaction => {
    return MosaicDefinitionTransaction.create(
      context.deadline,
      nonce,
      mosaicId,
      MosaicFlags.create(true, false, true), // always non-transferable.
      0,
      UInt64.fromUint(duration),
      context.networkType,
      context.maxFee,
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
  ): MosaicSupplyChangeTransaction => {
    return MosaicSupplyChangeTransaction.create(
      context.deadline,
      mosaicId,
      action,
      UInt64.fromUint(supply),
      context.networkType,
      context.maxFee,
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
  ): NamespaceRegistrationTransaction => {
    if (undefined === parent || !parent.length) {
      return NamespaceRegistrationTransaction.createRootNamespace(
        context.deadline,
        name,
        UInt64.fromUint(duration),
        context.networkType,
        context.maxFee,
      )
    }

    return NamespaceRegistrationTransaction.createSubNamespace(
      context.deadline,
      name,
      parent,
      context.networkType,
      context.maxFee,
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
  ): MultisigAccountModificationTransaction => {
    return MultisigAccountModificationTransaction.create(
      context.deadline,
      minimumOperators,
      minimumOperators,
      operators,
      [],
      context.networkType,
      context.maxFee,
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
  ): AccountMosaicRestrictionTransaction => {
    return AccountMosaicRestrictionTransaction.create(
      context.deadline,
      flags,
      targets,
      [],
      context.networkType,
      context.maxFee,
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
  ): MosaicGlobalRestrictionTransaction => {
    const key = KeyGenerator.generateUInt64Key(restrictionKey.toLowerCase())
    return MosaicGlobalRestrictionTransaction.create(
      context.deadline,
      mosaicId,
      key,
      UInt64.fromUint(0), // previousRestrictionValue
      MosaicRestrictionType.NONE,
      UInt64.fromUint(value), // newRestrictionValue
      type, // newRestrictionType
      context.networkType,
      undefined, // referenceMosaicId
      context.maxFee,
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
  ): MosaicAddressRestrictionTransaction => {
    const key = KeyGenerator.generateUInt64Key(restrictionKey.toLowerCase())
    return MosaicAddressRestrictionTransaction.create(
      context.deadline,
      mosaicId,
      key,
      target,
      UInt64.fromUint(value), // newRestrictionValue
      context.networkType,
      undefined,
      context.maxFee,
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
  ): TransferTransaction => {
    return TransferTransaction.create(
      context.deadline,
      recipient,
      mosaicId && amount !== undefined ? [
        new Mosaic(mosaicId, UInt64.fromUint(amount)),
      ] : [],
      message ? PlainMessage.create(message) : EmptyMessage,
      context.networkType,
      context.maxFee,
    )
  }
}

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
  InnerTransaction,
  Transaction,
  PublicAccount,
  TransferTransaction,
  PlainMessage,
  Mosaic,
  UInt64,
  EmptyMessage,
  MultisigAccountModificationTransaction,
  AccountMetadataTransaction,
  KeyGenerator,
  AccountMosaicRestrictionTransaction,
  AccountRestrictionFlags,
  MosaicAddressRestrictionTransaction,
} from 'symbol-sdk'

// internal dependencies
import { AbstractCommand } from './AbstractCommand'

/**
 * @class NIP13.LockBalance
 * @package NIP13 Token Commands
 * @since v0.1.0
 * @description Class that describes a token command for locking (part of) balances of NIP13 compliant tokens.
 * @summary This token command prepares one aggregate bonded transaction with following inner transactions:
 *
 *  - Transaction 01: MultisigAccountModificationTransaction
 *  - Transaction 02: AccountMetadataTransaction attaching `Is_Lock`
 *  - Transaction 03: AccountMosaicRestrictionTransaction for mosaicId & fee
 *  - Transaction 04: MosaicAddressRestriction with `User_Role = Locker` for locker
 *  - Transaction 05: First send back the amount to the target account
 *  - Transaction 06: Add ownership transfer transaction to locker account
 */
export class LockBalance extends AbstractCommand {
  /**
   * @description List of **required** arguments for this token command.
   */
  public arguments: string[] = [
    'partition',
    'locker',
    'amount',
  ]

  // region abstract methods
  /**
   * @description Getter for the command name.
   * @see {BaseCommand.name}
   **/
  public get name(): string {
    return 'LockBalance'
  }

  /**
   * Getter for the command descriptor.
   *
   * @return {string}
   **/
  public get descriptor(): string {
    return 'NIP13(v' + this.context.revision + ')' + ':lock:' + this.identifier.id
  }

  /**
   * @description Builds the inner transactions necessary for the
   *              execution of a `LockBalance` command.
   * @see {AbstractCommand.transactions}
   * @return {Transaction[]} Aggregate bonded transaction
   **/
  protected get transactions(): Transaction[] {
    // read external arguments
    const partition = this.context.getInput('partition', new PublicAccount())
    const locker = this.context.getInput('locker', new PublicAccount())
    const amount = this.context.getInput('amount', 0)

    // find partition
    const the_partition = this.partitions.find(
      p => p.account.address.equals(partition.address)
    )

    // 'LockBalance' is only possible for existing partitions
    if (undefined === the_partition) {
      // the partition doesn't exist
      return []
    }

    // prepare output
    const transactions: InnerTransaction[] = []
    const signers: PublicAccount[] = []

    // Transaction 01: MultisigAccountModificationTransaction
    // Transaction 02: AccountMetadataTransaction attaching `Is_Lock`
    // Transaction 03: AccountMosaicRestrictionTransaction for mosaicId & fee
    // Transaction 04: MosaicAddressRestriction with `User_Role = Locker` for locker
    const payload = this.createBalanceLock(partition, locker)
    payload.transactions.map((t, i) => {
      transactions.push(t)
      signers.push(payload.signers[i])
    })

    // Transaction 05: First send back the amount to the target account
    transactions.push(TransferTransaction.create(
      this.context.parameters.deadline,
      this.target.address, // back to target account (non-transferrable)
      [
        new Mosaic(
          this.identifier.toMosaicId(),
          UInt64.fromUint(amount),
        )
      ],
      EmptyMessage, // This transaction does not need a marker
      this.context.network.networkType,
      undefined,
    ))

    // Transaction 05 is issued by **partition** account
    signers.push(partition)

    // Transaction 06: Transfer to locker account
    transactions.push(TransferTransaction.create(
      this.context.parameters.deadline,
      locker.address, // mosaics will be owned by new locker account
      [
        new Mosaic(
          this.identifier.toMosaicId(),
          UInt64.fromUint(amount),
        )
      ],
      PlainMessage.create(this.descriptor),
      this.context.network.networkType,
      undefined,
    ))

    // Transaction 06 is issued by **target** account
    signers.push(this.target)

    // return transactions issued by assigned signer
    return transactions.map(
      (transaction, i) => transaction.toAggregate(signers[i])
    )
  }
  // end-region abstract methods

  /**
   * Helper method for creating partitions on Symbol networks.
   *
   * @param {PublicAccount} partition 
   * @param {PublicAccount} locker
   */
  protected createBalanceLock(
    partition: PublicAccount,
    locker: PublicAccount,
  ): { transactions: InnerTransaction[], signers: PublicAccount[] } {
    // prepare output
    const transactions: InnerTransaction[] = []
    const signers: PublicAccount[] = []

    // Transaction 01: MultisigAccountModificationTransaction
    // :warning: Only operators are allowed to manage lockers
    transactions.push(MultisigAccountModificationTransaction.create(
      this.context.parameters.deadline,
      this.operators.length, // all operators for minApproval
      this.operators.length - 1, // all except one for minRemoval
      [this.target], // **target** account is made cosignatory (multi-level)
      [],
      this.context.network.networkType,
      undefined, // maxFee 0 for inner
    ))

    // Transaction 01 is issued by **locker** account
    signers.push(locker)

    // Transaction 02: AccountMetadataTransaction
    transactions.push(AccountMetadataTransaction.create(
      this.context.parameters.deadline,
      partition.publicKey,
      KeyGenerator.generateUInt64Key('Is_Lock'),
      1,
      '1',
      this.context.network.networkType,
      undefined, // maxFee 0 for inner
    ))

    // Transaction 02 is issued by **partition** account
    signers.push(locker)

    // Transaction 03: AccountMosaicRestrictionTransaction
    // :note: This transaction authorizes mosaicId and networkCurrencyMosaicId for partition
    transactions.push(AccountMosaicRestrictionTransaction.create(
      this.context.parameters.deadline,
      AccountRestrictionFlags.AllowMosaic,
      [this.identifier.toMosaicId(), this.context.network.feeMosaicId], // MosaicId & networkCurrencyMosaicId
      [],
      this.context.network.networkType,
      undefined, // maxFee 0 for inner
    ))

    // Transaction 03 is issued by **target** account (multisig)
    signers.push(locker)

    // Transaction 04: MosaicAddressRestriction for locker address
    // :note: This transaction authorizes the locker account by adding a User_Role=3 (Locker)
    transactions.push(MosaicAddressRestrictionTransaction.create(
      this.context.parameters.deadline,
      this.identifier.toMosaicId(),
      KeyGenerator.generateUInt64Key('User_Role'),
      locker.address,
      UInt64.fromUint(3), // newRestrictionValue: 3 = Locker
      this.context.network.networkType,
      undefined, // previousRestrictionValue
      undefined, // maxFee 0 for inner
    ))

    // Transaction 04 is issued by the target account
    signers.push(this.target)

    return {
      transactions,
      signers,
    }
  }
}
  
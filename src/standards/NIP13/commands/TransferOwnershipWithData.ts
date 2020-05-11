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
  MultisigAccountModificationTransaction,
  AccountMosaicRestrictionTransaction,
  AccountRestrictionFlags,
  MosaicAddressRestrictionTransaction,
  KeyGenerator,
  AccountMetadataTransaction,
  EmptyMessage,
} from 'symbol-sdk'

// internal dependencies
import { TransferOwnership } from './TransferOwnership'

/**
 * @class NIP13.TransferOwnershipWithData
 * @package NIP13 Token Commands
 * @since v0.1.0
 * @description Class that describes a token command for transferring NIP13 compliant tokens and attaching data.
 * @summary This token command prepares one aggregate bonded transaction with following inner transactions:
 *
 * @see TransferOwnership Transactions of the parent class are prepended to this command's transactions.
 *  - Transaction 01: Execution proof transaction
 *  - Transaction 02: Attaching signed data
 */
export class TransferOwnershipWithData extends TransferOwnership {
  /**
   * @description List of **required** arguments for this token command.
   */
  public arguments: string[] = [
    'name',
    'sender',
    'partition',
    'recipient',
    'amount',
    'data',
  ]

  // region abstract methods
  /**
   * @description Getter for the command name.
   * @see {BaseCommand.name}
   **/
  public get name(): string {
    return 'TransferOwnershipWithData'
  }

  /**
   * Getter for the command descriptor.
   *
   * @return {string}
   **/
  public get dataDescriptor(): string {
    return 'NIP13(v' + this.context.revision + ')' + ':data:' + this.identifier.id
  }

  /**
   * @description Builds the inner transactions necessary for the
   *              execution of a `TransferOwnershipWithData` command.
   * @see {AbstractCommand.transactions}
   * @return {Transaction[]} Aggregate bonded transaction
   **/
  protected get transactions(): Transaction[] {
    // TransferOwnershipWithData extends TransferOwnership
    const parentTransactions = super.transactions

    // read external arguments
    const partition = this.context.getInput('partition', new PublicAccount())
    const plainData = this.context.getInput('data', '')

    // find partition
    const the_partition = this.partitions.find(
      p => p.account.address.equals(partition.address)
    )

    // prepare output
    const transactions: InnerTransaction[] = []
    const signers: PublicAccount[] = []

    // :warning: Transactions from `TransferOwnership` command are
    // :warning: prepended to the following transactions.
    // :warning: @see TransferOwnership.transactions

    // Transaction 01: Add execution proof transaction
    transactions.push(TransferTransaction.create(
      this.context.parameters.deadline,
      partition.address,
      [],
      PlainMessage.create(this.dataDescriptor),
      this.context.network.networkType,
      undefined,
    ))

    // Transaction 01 is issued by **target** account
    signers.push(this.target)

    // Transaction 02: Add data to partition account
    transactions.push(TransferTransaction.create(
      this.context.parameters.deadline,
      partition.address,
      [],
      PlainMessage.create(plainData),
      this.context.network.networkType,
      undefined,
    ))

    // Transaction 02 is signer by **partition** account
    signers.push(partition)

    // return transactions issued by assigned signer
    return parentTransactions.concat(transactions.map(
      (transaction, i) => transaction.toAggregate(signers[i])
    ))
  }
  // end-region abstract methods
}

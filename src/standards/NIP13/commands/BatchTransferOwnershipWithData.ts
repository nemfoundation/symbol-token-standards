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
import { TransferOwnershipWithData } from './TransferOwnershipWithData'

/**
 * @class NIP13.BatchTransferOwnershipWithData
 * @package NIP13 Token Commands
 * @since v0.1.0
 * @description Class that describes a token command for batch transferring NIP13 compliant tokens and attaching data.
 * @summary This token command prepares one aggregate bonded transaction with following inner transactions:
 *
 *  - Transaction 01: Execution proof transaction *
 * @see TransferOwnership Transactions of the parent class are appended to this command's transactions.
 */
export class BatchTransferOwnershipWithData extends TransferOwnershipWithData {
  /**
   * @description List of **required** arguments for this token command.
   */
  public arguments: string[] = [
      'name',
      'sender',
      'partitions', // plural
      'recipients', // plural
      'amount',
      'data',
  ]

  // region abstract methods
  /**
   * @description Getter for the command name.
   * @see {BaseCommand.name}
   **/
  public get name(): string {
    return 'BatchTransferOwnershipWithData'
  }

  /**
   * Getter for the command descriptor.
   *
   * @return {string}
   **/
  public get batchDescriptor(): string {
    return 'NIP13(v' + this.context.revision + ')' + ':batch:' + this.identifier.id
  }

  /**
   * @description Builds the inner transactions necessary for the
   *              execution of a `BatchTransferOwnershipWithData` command.
   * @see {AbstractCommand.transactions}
   * @return {Transaction[]} Aggregate bonded transaction
   **/
  protected get transactions(): Transaction[] {
    // read external arguments
    const partitions = this.context.getInput('partitions', [])
    const recipients = this.context.getInput('recipients', [])

    // prepare output
    const transactions: InnerTransaction[] = []
    const signers: PublicAccount[] = []

    // Transaction 01: Add execution proof transaction
    transactions.push(TransferTransaction.create(
      this.context.parameters.deadline,
      this.target.address,
      [],
      PlainMessage.create(this.batchDescriptor),
      this.context.network.networkType,
      undefined,
    ))

    // Transaction 01 is issued by **target** account
    signers.push(this.target)

    // :warning: Each partition listed in `partitions`
    // :warning: will produce the execution on one `TransferOwnershipWithData`
    let parentTransactions: InnerTransaction[] = []
    for (let i = 0, m = partitions.length; i < m; i++) {
      const the_partition: PublicAccount = partitions[i]
      const the_recipient: PublicAccount = recipients[i]

      // set `TransferOwnership` command arguments
      this.context.setInput('partition', the_partition)
      this.context.setInput('recipient', the_recipient)

      parentTransactions = parentTransactions.concat(super.transactions)
    }

    // return transactions issued by assigned signer
    return transactions.map(
      (transaction, i) => transaction.toAggregate(signers[i])
    ).concat(parentTransactions)
  }
  // end-region abstract methods
}

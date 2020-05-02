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
} from 'symbol-sdk'

// internal dependencies
import { TransactionsHelpers } from '../../../../index'
import { AbstractCommand } from './AbstractCommand'
import { TokenPartition } from '../../../models/TokenPartition'

/**
 * @class NIP13.TransferOwnership
 * @package NIP13 Token Commands
 * @since v0.1.0
 * @description Class that describes a token command for transfering (partial) ownership of NIP13 compliant tokens.
 */
export class TransferOwnership extends AbstractCommand {
  // region abstract methods
  /**
   * @description Getter for the command name.
   * @see {BaseCommand.name}
   **/
  public get name(): string {
    return 'TransferOwnership'
  }

  /**
   * @description Builds the inner transactions necessary for the
   *              execution of a `TransferOwnership` command.
   * @see {AbstractCommand.transactions}
   * @return {Transaction[]} Aggregate bonded transaction
   **/
  protected get transactions(): Transaction[] {
    // read external arguments
    const partitionName = this.context.getInput('partition', '')
    const recipient = this.context.getInput('recipient', undefined)
    const amount = this.context.getInput('amount', 0)

    // prepare output
    const transactions: InnerTransaction[] = []
    const signers: PublicAccount[] = []

    // find partition
    const partition = this.partitions.find(
      (part) => part.name === partitionName,
    )

    // if partition or recipient not found, exit
    // @see caller "prepare" should throw errors/FailureEmptyContract
    if (partition === undefined || recipient === undefined) {
      return []
    }

    // derive old partition owner multisig
    const oldAccount = partition.deriveAccount(
      this.keyProvider,
     this.context.network.networkType,
    ).publicAccount

    // create new partition owner multisig
    const newAccount = (new TokenPartition(partitionName, recipient, amount)).deriveAccount(
      this.keyProvider,
     this.context.network.networkType,
    ).publicAccount

    // Transaction 01: MultisigAccountModificationTransaction
    // :warning: minApproval is always n-1 to permit loss of up to 1 key.
    transactions.push(TransactionsHelpers.createMultisigAccountModification(
      this.context,
      this.operators.length - 1,
      this.operators
          .map((op) => op.account) // operators
          .concat(recipient) // + partition owner
    ))

    // Transaction 01 is issued by partition **recipient** (new owner)
    signers.push(newAccount)

    // Transaction 02: Transfer ownership to partition **recipient** (new owner)
    transactions.push(TransactionsHelpers.createTransfer(
      this.context,
      newAccount.address,
      this.identifier.toMosaicId(),
      amount,
      'NIP13(v' + this.context.revision + '):partition:' + this.identifier.id
    ))

    // Transaction 01 is issued by **old** partition account (old owner)
    signers.push(oldAccount)

    // return transactions issued by *target*
    return transactions.map(
      (transaction) => transaction.toAggregate(this.target)
    )
  }
  // end-region abstract methods
}

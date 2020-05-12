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
} from 'symbol-sdk'

// internal dependencies
import { AbstractCommand } from './AbstractCommand'

/**
 * @class NIP13.UnlockBalance
 * @package NIP13 Token Commands
 * @since v0.5.0
 * @description Class that describes a token command for unlocking (part of) balances of NIP13 compliant tokens.
 * @summary
 * This token command accepts the following arguments:
 *
 * | Argument | Description | Example |
 * | --- | --- | --- |
 * | partition | Token holder partition account (gets unlocked) | `new PublicAccount(...)` |
 * | locker | Token locker account (sends back shares) | `new PublicAccount(...)` |
 * | amount | Number of shares to be unlocked | `1` |
 */
export class UnlockBalance extends AbstractCommand {
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
    return 'UnlockBalance'
  }

  /**
   * Getter for the command descriptor.
   *
   * @return {string}
   **/
  public get descriptor(): string {
    return 'NIP13(v' + this.context.revision + ')' + ':unlock:' + this.identifier.id
  }

  /**
   * Getter for the command descriptor.
   *
   * @return {string}
   **/
  public get transferDescriptor(): string {
    return 'NIP13(v' + this.context.revision + ')' + ':transfer:' + this.identifier.id
  }

  /**
   * @description Builds the inner transactions necessary for the
   *              execution of a `UnlockBalance` command.
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

    // 'UnlockBalance' is only possible for existing partitions
    if (undefined === the_partition) {
      // the partition doesn't exist
      return []
    }

    // prepare output
    const transactions: InnerTransaction[] = []
    const signers: PublicAccount[] = []

    // Transaction 01: Add execution proof transaction
    transactions.push(TransferTransaction.create(
      this.context.parameters.deadline,
      the_partition.account.address,
      [],
      PlainMessage.create(this.descriptor),
      this.context.network.networkType,
      undefined,
    ))

    // Transaction 01 is issued by **target** account
    signers.push(this.target)

    // Transaction 02: First send back the amount to the target account
    transactions.push(TransferTransaction.create(
      this.context.parameters.deadline,
      this.target.address, // back to target account (non-transferrable)
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

    // Transaction 02 is issued by **locker** account
    signers.push(locker)

    // Transaction 03: Transfer to partition account
    transactions.push(TransferTransaction.create(
      this.context.parameters.deadline,
      partition.address, // mosaics will be owned by partition account
      [
        new Mosaic(
          this.identifier.toMosaicId(),
          UInt64.fromUint(amount),
        )
      ],
      PlainMessage.create(this.transferDescriptor + ':' + the_partition.name), // use partition name
      this.context.network.networkType,
      undefined,
    ))

    // Transaction 03 is issued by **target** account
    signers.push(this.target)

    // return transactions issued by assigned signer
    return transactions.map(
      (transaction, i) => transaction.toAggregate(signers[i])
    )
  }
  // end-region abstract methods
}

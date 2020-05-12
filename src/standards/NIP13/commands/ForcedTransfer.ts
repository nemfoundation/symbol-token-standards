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
} from 'symbol-sdk'

// internal dependencies
import { AbstractCommand } from './AbstractCommand'

/**
 * @class NIP13.ForcedTransfer
 * @package NIP13 Token Commands
 * @since v0.5.0
 * @description Class that describes a token command for force-transferring NIP13 compliant tokens.
 * @summary
 * This token command accepts the following arguments:
 *
 * | Argument | Description | Example |
 * | --- | --- | --- |
 * | sender | Sender token holder partition account | `new PublicAccount(...)` |
 * | recipient | Recipient token holder partition account | `new PublicAccount(...)` |
 * | amount | Number of shares to be transferred | `1` |
 */
export class ForcedTransfer extends AbstractCommand {
  /**
   * @description List of **required** arguments for this token command.
   */
  public arguments: string[] = [
    'sender',
    'recipient', // must be a PARTITION ACCOUNT
    'amount',
  ]

  // region abstract methods
  /**
   * @description Getter for the command name.
   * @see {BaseCommand.name}
   **/
  public get name(): string {
    return 'ForcedTransfer'
  }

  /**
   * Getter for the command descriptor.
   *
   * @return {string}
   **/
  public get descriptor(): string {
    return 'NIP13(v' + this.context.revision + ')' + ':forced-transfer:' + this.identifier.id
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
   *              execution of a `ForcedTransfer` command.
   * @see {AbstractCommand.transactions}
   * @return {Transaction[]} Aggregate bonded transaction
   **/
  protected get transactions(): Transaction[] {
    // read external arguments
    const sender = this.context.getInput('sender', new PublicAccount())
    const recipient = this.context.getInput('recipient', new PublicAccount())
    const amount = this.context.getInput('amount', 0)

    // find sender partition
    const sender_partition = this.partitions.find(
      (p) => p.account.address.equals(sender.address)
    )

    // find recipient partition
    const recipient_partition = this.partitions.find(
      p => p.account.address.equals(recipient.address)
    )

    // 'ForcedTransfer' is only possible between partitions or back to target
    if (undefined === sender_partition) {
      // sender partition doesn't exist
      return []
    }

    // prepare output
    const transactions: InnerTransaction[] = []
    const signers: PublicAccount[] = []

    // Transaction 0.01: Add execution proof transaction
    transactions.push(TransferTransaction.create(
      this.context.parameters.deadline,
      sender_partition.account.address,
      [],
      PlainMessage.create(this.descriptor),
      this.context.network.networkType,
      undefined,
    ))

    // Transaction 0.01 is issued by **target** account
    signers.push(this.target)

    // 1) sending back the amount to the target account
    if (recipient.address.equals(this.target.address)) {
      // Transaction 1.01: Send back the amount to the target account
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

      // Transaction 1.01 is issued by **sender** account
      signers.push(sender)
    }
    // 2) force-sending the amount to a partition
    else {
      if (undefined === recipient_partition) {
        // Error: recipient partition doesn't exist
        return []
      }

      // Transaction 2.01: Send back the amount to the target account
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

      // Transaction 2.01 is issued by **sender** account
      signers.push(sender)

      // Transaction 2.02: Add ownership transfer transaction
      transactions.push(TransferTransaction.create(
        this.context.parameters.deadline,
        recipient_partition.account.address, // new recipient is the recipient partition account
        [
          new Mosaic(
            this.identifier.toMosaicId(),
            UInt64.fromUint(amount),
          )
        ],
        // use recipient partition name
        PlainMessage.create(this.transferDescriptor + ':' + recipient_partition.name),
        this.context.network.networkType,
        undefined,
      ))
  
      // Transaction 2.02 is issued by **target** account
      signers.push(this.target)
    }

    // return transactions issued by assigned signer
    return transactions.map(
      (transaction, i) => transaction.toAggregate(signers[i])
    )
  }
  // end-region abstract methods
}

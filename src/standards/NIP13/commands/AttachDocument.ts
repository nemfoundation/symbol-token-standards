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
  SHA3Hasher,
  Convert,
} from 'symbol-sdk'

// internal dependencies
import { AbstractCommand } from './AbstractCommand'

/**
 * @class NIP13.AttachDocument
 * @package NIP13 Token Commands
 * @since v0.5.0
 * @description Class that describes a token command for attaching documents to NIP13 compliant tokens or to token partitions.
 * @summary This token command prepares one aggregate bonded transaction with following inner transactions:
 *
 *  - Transaction 01: Execution proof transaction
 *  - Transaction 02: Attach document hash to be signed by recipient account
 */
export class AttachDocument extends AbstractCommand {
  /**
   * @description List of **required** arguments for this token command.
   */
  public arguments: string[] = [
    'filenode', // IPNS file name (starts with `Qm`)
    'filename',
    'recipient', // can be either of TARGET or PARTITION accounts
  ]

  // region abstract methods
  /**
   * @description Getter for the command name.
   * @see {BaseCommand.name}
   **/
  public get name(): string {
    return 'AttachDocument'
  }

  /**
   * Getter for the command descriptor.
   *
   * @return {string}
   **/
  public get descriptor(): string {
    return 'NIP13(v' + this.context.revision + ')' + ':document:' + this.identifier.id
  }

  /**
   * @description Builds the inner transactions necessary for the
   *              execution of a `AttachDocument` command.
   * @see {AbstractCommand.transactions}
   * @return {Transaction[]} Aggregate bonded transaction
   **/
  protected get transactions(): Transaction[] {
    // read external arguments
    const filenode = this.context.getInput('filenode', '')
    const filename = this.context.getInput('filename', '')
    const recipient = this.context.getInput('recipient', new PublicAccount())

    if (!filenode.length || !filename.length) {
      // Error: Invalid arguments
      return []
    }

    if (!filenode.startsWith('Qm')) {
      // Error: Invalid IPFS file hash
      return []
    }

    if (!recipient.address.equals(this.target.address)) {
      const the_partition = this.partitions.find(
        (p) => p.account.address.equals(recipient.address)
      )

      // AttachDocument is only possible for target account or existing partitions
      if (undefined === the_partition) {
        // Error: partition does not exist
        return []
      }
    }

    // prepare output
    const transactions: InnerTransaction[] = []
    const signers: PublicAccount[] = []

    // Transaction 01: Add execution proof transaction
    transactions.push(TransferTransaction.create(
      this.context.parameters.deadline,
      recipient.address,
      [],
      PlainMessage.create(this.descriptor),
      this.context.network.networkType,
      undefined,
    ))

    // Transaction 01 is issued by **recipient** account
    signers.push(recipient)

    // Transaction 02: Attach document hash to be signed by recipient account
    transactions.push(TransferTransaction.create(
      this.context.parameters.deadline,
      recipient.address,
      [],
      PlainMessage.create(filename + ':' + filenode),
      this.context.network.networkType,
      undefined,
    ))

    // Transaction 02 is issued by **recipient** account
    signers.push(recipient)

    // return transactions issued by assigned signer
    return transactions.map(
      (transaction, i) => transaction.toAggregate(signers[i])
    )
  }
  // end-region abstract methods
}

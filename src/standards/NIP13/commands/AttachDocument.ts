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
 * @description Class that describes a token command for attaching document to NIP13 compliant tokens.
 * @summary This token command prepares one aggregate bonded transaction with following inner transactions:
 *
 *  - Transaction 01: Execution proof transaction
 *  - Transaction 02: Attach document hash to be signed by target account
 */
export class AttachDocument extends AbstractCommand {
  /**
   * @description List of **required** arguments for this token command.
   */
  public arguments: string[] = [
    'algorithm', // one of 'SHA3-256', 'SHA3-512'
    'document', // binary data
    'filename',
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
    const algorithm = this.context.getInput('algorithm', 'SHA3-256')
    const document = this.context.getInput('document', '')
    const filename = this.context.getInput('locker', new PublicAccount())

    // determine hash size by algorithm
    let hashSize: number = 32
    switch (algorithm.toUpperCase()) {
      default:
      case 'SHA3-256': hashSize = 32; break;
      case 'SHA3-512': hashSize = 64; break;
    }

    // generate deterministic document hash
    const hash = new Uint8Array(64)
    SHA3Hasher.func(hash, Convert.utf8ToUint8(document), 64)

    // convert to hexadecimal
    const documentHash = Convert.uint8ToHex(hash)

    // prepare output
    const transactions: InnerTransaction[] = []
    const signers: PublicAccount[] = []

    // Transaction 01: Add execution proof transaction
    transactions.push(TransferTransaction.create(
      this.context.parameters.deadline,
      this.target.address,
      [],
      PlainMessage.create(this.descriptor),
      this.context.network.networkType,
      undefined,
    ))

    // Transaction 01 is issued by **target** account
    signers.push(this.target)

    // Transaction 02: Attach document hash to be signed by target account
    transactions.push(TransferTransaction.create(
      this.context.parameters.deadline,
      this.target.address,
      [],
      PlainMessage.create(filename + ':' + documentHash),
      this.context.network.networkType,
      undefined,
    ))

    // Transaction 02 is issued by **target** account
    signers.push(this.target)

    // return transactions issued by assigned signer
    return transactions.map(
      (transaction, i) => transaction.toAggregate(signers[i])
    )
  }
  // end-region abstract methods
}

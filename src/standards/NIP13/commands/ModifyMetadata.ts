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
 * @class NIP13.ModifyMetadata
 * @package NIP13 Token Commands
 * @since v0.1.0
 * @description Class that describes a token command for force-transferring NIP13 compliant tokens.
 * @summary This token command prepares one aggregate bonded transaction with following inner transactions:
 *
 * 1) In case of sending back the amount to the target account
 *   - Transaction 1.01: Send back the amount to the target account
 *
 * 2) In case of sending the amount to another partition
 *   - Transaction 2.01: First send back the amount to the target account
 *   - Transaction 2.02: Add ownership transfer transaction
 */
export class ModifyMetadata extends AbstractCommand {
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
    return 'ModifyMetadata'
  }

  /**
   * Getter for the command descriptor.
   *
   * @return {string}
   **/
  public get descriptor(): string {
    return 'NIP13(v' + this.context.revision + ')' + ':metadata:' + this.identifier.id
  }

  /**
   * @description Builds the inner transactions necessary for the
   *              execution of a `ModifyMetadata` command.
   * @see {AbstractCommand.transactions}
   * @return {Transaction[]} Aggregate bonded transaction
   **/
  protected get transactions(): Transaction[] {
    // read external arguments
    const fields = this.context.getInput('fields', [])

    // prepare output
    const transactions: InnerTransaction[] = []
    const signers: PublicAccount[] = []

    //XXX should have `this.metadata` available for `previousValues`

    // return transactions issued by assigned signer
    return transactions.map(
      (transaction, i) => transaction.toAggregate(signers[i])
    )
  }
  // end-region abstract methods
}

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
 * @class NIP13.PublishToken
 * @package NIP13 Token Commands
 * @since v0.1.0
 * @description Class that describes a token command for publishing NIP13 compliant tokens.
 */
export class PublishToken extends AbstractCommand {
  /**
   * @description List of **required** arguments for this token command.
   */
  public arguments: string[] = [
    'partitions',
  ]

  // region abstract methods
  /**
   * @description Getter for the command name.
   * @see {BaseCommand.name}
   **/
  public get name(): string {
    return 'PublishToken'
  }

  /**
   * @description Builds the inner transactions necessary for the
   *              execution of a `PublishToken` command.
   * @see {AbstractCommand.transactions}
   * @return {Transaction[]} Aggregate bonded transaction
   **/
  protected get transactions(): Transaction[] {

    // read external arguments
    const partitions = this.context.getInput('partitions', [])

    // prepare output
    const transactions: InnerTransaction[] = []
    const signers: PublicAccount[] = []

    // Transaction 01: Add execution proof transaction
    transactions.push(TransactionsHelpers.createTransfer(
      this.context,
      this.target.address,
      undefined,
      undefined,
      'NIP13(v' + this.context.revision + '):publish:' + this.identifier.id.toHex()
    ))

    // Transaction 01 is issued by **target** account (multisig)
    signers.push(this.target)

    // :note: the next block affects all accounts listed as partitions.
    for (let i = 0, m = partitions.length; i < m; i ++) {
      const partition = partitions[i] as TokenPartition
      const account = partition.deriveAccount(
        this.keyProvider,
        this.context.networkType,
      ).publicAccount

      // Transaction 02: MultisigAccountModificationTransaction
      // :warning: minApproval is always n-1 to permit loss of up to 1 key.
      transactions.push(TransactionsHelpers.createMultisigAccountModification(
        this.context,
        this.operators.length - 1,
        this.operators
            .map((op) => op.account) // operators
            .concat(partition.owner) // + partition owner
      ))

      // Transaction 02 is issued by partition owner
      signers.push(account)

      // Transaction 03: MosaicAddressRestriction for partition owner
      // :warning: this gives the partition owner Holder access to the token.
      transactions.push(TransactionsHelpers.createMosaicAddressRestriction(
        this.context,
        this.identifier.toMosaicId(),
        'User_Role',
        account.address,
        2, // 2 = Holder
      ))

      // Transaction 03 is issued by **target** account (multisig)
      signers.push(this.target)

      // Transaction 04: TransferTransaction adding partition label and transferring ownership.
      transactions.push(TransactionsHelpers.createTransfer(
        this.context,
        account.address,
        this.identifier.toMosaicId(),
        partition.amount,
        'NIP13(v' + this.context.revision + '):partition:' + partition.name
      ))

      // Transaction 04 is issued by **target** account (multisig)
      signers.push(this.target)
    }

    // return transactions issued by assigned signer
    return transactions.map(
      (transaction, i) => transaction.toAggregate(signers[i])
    )
  }
  // end-region abstract methods
}

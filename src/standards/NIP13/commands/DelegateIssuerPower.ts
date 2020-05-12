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
  MultisigAccountModificationTransaction,
} from 'symbol-sdk'

// internal dependencies
import { AbstractCommand } from './AbstractCommand'

/**
 * @class NIP13.DelegateIssuerPower
 * @package NIP13 Token Commands
 * @since v0.5.0
 * @description Class that describes a token command for adding operators for NIP13 compliant tokens.
 * @summary
 * This token command accepts the following arguments:
 *
 * | Argument | Description | Example |
 * | --- | --- | --- |
 * | `operator` | Operator account that will be added | `new PublicAccount(...)` |
 */
export class DelegateIssuerPower extends AbstractCommand {
  /**
   * @description List of **required** arguments for this token command.
   */
  public arguments: string[] = [
    'operator',
  ]

  // region abstract methods
  /**
   * @description Getter for the command name.
   * @see {BaseCommand.name}
   **/
  public get name(): string {
    return 'DelegateIssuerPower'
  }

  /**
   * Getter for the command descriptor.
   *
   * @return {string}
   **/
  public get descriptor(): string {
    return 'NIP13(v' + this.context.revision + ')' + ':add-operator:' + this.identifier.id
  }

  /**
   * @description Builds the inner transactions necessary for the
   *              execution of a `DelegateIssuerPower` command.
   * @see {AbstractCommand.transactions}
   * @return {Transaction[]} Aggregate bonded transaction
   **/
  protected get transactions(): Transaction[] {
    // read external arguments
    const operator = this.context.getInput('operator', new PublicAccount())

    // find operator
    const the_operator = this.operators.find(
      o => o.address.equals(operator.address)
    )

    // `DelegateIssuerPower` should only be executed to add operators
    if (undefined !== the_operator) {
      return []
    }

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

    // Transaction 02: MultisigAccountModificationTransaction
    transactions.push(MultisigAccountModificationTransaction.create(
      this.context.parameters.deadline,
      1, // adding 1 operator
      1, // adding 1 operator
      [operator],
      [],
      this.context.network.networkType,
      undefined, // maxFee 0 for inner
    ))

    // Transaction 02 is issued by **target** account
    signers.push(this.target)

    // For each partition, the operator must be made a cosignatory
    for (let i = 0, m = this.partitions.length; i < m; i++) {
      const the_partition = this.partitions[i]

      // Transaction 03: MultisigAccountModificationTransaction
      transactions.push(MultisigAccountModificationTransaction.create(
        this.context.parameters.deadline,
        1, // adding 1 operator
        1, // adding 1 operator
        [operator],
        [],
        this.context.network.networkType,
        undefined, // maxFee 0 for inner
      ))

      // Transaction 03 is issued by **partition** account
      signers.push(the_partition.account)
    }

    // return transactions issued by assigned signer
    return transactions.map(
      (transaction, i) => transaction.toAggregate(signers[i])
    )
  }
  // end-region abstract methods
}

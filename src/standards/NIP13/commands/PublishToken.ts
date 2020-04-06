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
import { TransactionURI } from 'symbol-uri-scheme'
import {
  AggregateTransaction,
  InnerTransaction,
  PublicAccount,
  Transaction,
} from 'symbol-sdk'

// internal dependencies
import {
  AllowanceResult,
  BaseCommand,
  CommandOption,
  TransactionsHelpers,
} from '../../../index'

/**
 * @class NIP13.PublishToken
 * @package NIP13 Token Commands
 * @since v0.1.0
 * @description Class that describes a token command for publishing NIP13 compliant tokens.
 */
export class PublishToken extends BaseCommand {
  /**
   * @description Getter for the command name.
   * @see {BaseCommand.name}
   **/
  public get name(): string {
    return 'PublishToken'
  }

  /**
   * @description Method that verifies the allowance of an operator to 
   *              execute the token command `PublishToken`.
   * @see {BaseCommand.canExecute}
   **/
  public canExecute(
    actor: PublicAccount,
    argv?: CommandOption[]
  ): AllowanceResult {
    // XXX read "operators"
    const hasActor = actor && actor.address
    const hasArgv = undefined !== argv || true

    // allows everyone to publish tokens
    return new AllowanceResult(hasActor && hasArgv)
  }

  /**
   * @description Method that executes the token command `PublishToken`.
   * @see {BaseCommand.execute}
   **/
  public execute(
    actor: PublicAccount,
    argv?: CommandOption[]
  ): TransactionURI {
    // verify authorization to execute
    super.assertExecutionAllowance(actor, argv)

    // validate mandatory inputs
    super.assertHasMandatoryArguments(argv, []) // no args

    // create the blockchain contract
    const contract = this.prepare()

    // return result
    return new TransactionURI(contract.serialize())
  }

  /**
   * @description Wrap the command's transactions inside an aggregate transaction.
   * @see {BaseCommand.wrap}
   * @return {AggregateTransaction[]} Aggregate bonded transaction
   **/
  protected prepare(): AggregateTransaction | Transaction {
    // create aggregate bonded
    return AggregateTransaction.createBonded(
      this.context.deadline,
      this.transactions,
      this.context.networkType,
      [],
      this.context.maxFee,
    )
  }

  /**
   * @description Build a command's transactions. Transactions returned here will
   *              be formatted to a transaction URI in the `execute()` step.
   * @see {BaseCommand.transactions}
   * @return {AggregateTransaction[]} Aggregate bonded transaction
   **/
  protected get transactions(): Transaction[] {

    // prepare output
    const transactions: InnerTransaction[] = []

    // Transaction 01: Add token identifier to
    transactions.push(TransactionsHelpers.createTransfer(
      this.context,
      this.context.target.address,
      undefined,
      undefined,
      'NIP13(v' + this.context.revision + '):' + this.identifier.id.toHex()
    ))

    // return transactions issued by *target*
    return transactions.map(
      (transaction) => transaction.toAggregate(this.context.target)
    )
  }
}

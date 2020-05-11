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
  MosaicInfo,
  MultisigAccountInfo,
  PublicAccount,
  Transaction,
} from 'symbol-sdk'
import { Wallet } from 'symbol-hd-wallets'

// internal dependencies
import {
  AllowanceResult,
  BaseCommand,
  CommandOption,
  Context,
  TokenIdentifier,
  TokenPartition,
} from '../../../../index'
import { MultisigService } from '../services/MultisigService'
import { PartitionService } from '../services/PartitionService'
import { FailureEmptyContract } from '../errors/FailureEmptyContract'
import { TransactionParameters } from '../../../models/TransactionParameters'
import { SecuritiesMetadata } from '../models/SecuritiesMetadata'

/**
 * @class NIP13.AbstractCommand
 * @package NIP13 Token Commands
 * @since v0.1.0
 * @description Abstract class that describes a token command for NIP13 compliant tokens.
 */
export abstract class AbstractCommand extends BaseCommand {
  /**
   * @description The deterministic public account representing the token.
   */
  public target: PublicAccount

  /**
   * @description List of operators of said token.
   */
  public operators: PublicAccount[] = []

  /**
   * @description Mosaic information (read from network).
   */
  public mosaicInfo: MosaicInfo | undefined

  /**
   * @description Partition records of said token.
   */
  public partitions: TokenPartition[] = []

  /**
   * @description The securities metadata
   */
  public metadata: SecuritiesMetadata | undefined

  /**
   * @description List of **required** arguments for this token command.
   */
  public arguments: string[] = []

  /**
   * Construct a NIP13 command object around `context`
   * and `identifier`
   *
   * @param {Context} context 
   */
  public constructor(
    /**
     * @description Execution context
     */
    public readonly context: Context,

    /**
     * @description Token identifier
     */
    protected readonly identifier: TokenIdentifier,

    /**
     * @description The key provider used for the command execution.
     */
    public keyProvider: Wallet, 
  ) {
    super(context)
    this.target = this.identifier.target
  }

  // region abstract methods
  /**
   * @description Getter for the command name.
   * @see {BaseCommand.name}
   **/
  public abstract get name(): string

  /**
   * Getter for the command descriptor.
   *
   * @return {string}
   **/
  public abstract get descriptor(): string

  /**
   * @description Build a command's transactions. Transactions returned here will
   *              be formatted to a transaction URI in the `execute()` step.
   * @see {BaseCommand.transactions}
   * @return {AggregateTransaction[]} Aggregate bonded transaction
   **/
  protected abstract get transactions(): Transaction[]
  // end-region abstract methods

  /**
   * @description Method that verifies the allowance of an operator to 
   *              execute the token command `TransferOwnership`.
   * @see {BaseCommand.canExecute}
   **/
  public canExecute(
    actor: PublicAccount,
    argv?: CommandOption[]
  ): AllowanceResult {
    // validate mandatory inputs
    super.assertHasMandatoryArguments(argv, this.arguments)

    // by default, only operators can execute commands
    const isOperator = this.operators.some(
      (p: PublicAccount) => {
        return p.publicKey === actor.publicKey
      })

    // allows only operators to transfer ownership tokens
    return new AllowanceResult(isOperator)
  }

  /**
   * @description Method that executes the token command `TransferOwnership`.
   * @see {BaseCommand.execute}
   **/
  public execute(
    actor: PublicAccount,
    argv?: CommandOption[]
  ): TransactionURI {
    // verify authorization to execute
    super.assertExecutionAllowance(actor, argv)

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
    if (!this.transactions.length) {
      throw new FailureEmptyContract('No transactions result of this contract execution.')
    }

    // create aggregate bonded
    return AggregateTransaction.createBonded(
      this.context.parameters.deadline,
      this.transactions,
      this.context.network.networkType,
      [],
      this.context.parameters.maxFee,
    )
  }
}

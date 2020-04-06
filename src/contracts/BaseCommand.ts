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
  AggregateTransaction,
  PublicAccount,
  Transaction,
} from 'symbol-sdk'
import { TransactionURI } from 'symbol-uri-scheme'

// internal dependencies
import {
  AllowanceResult,
  Command,
  CommandOption,
  Context,
  FailureOperationForbidden,
} from '../index'
import { FailureMissingArgument } from '../errors/FailureMissingArgument'
import { TokenIdentifier } from '../models/TokenIdentifier'

/**
 * @class BaseCommand
 * @package contracts
 * @since v0.1.0
 * @description Abstract class that describes a command interface for NIP13 token commands.
 * @link https://github.com/nemtech/NIP/blob/master/NIPs/nip-0013.md#token-commands
 */
export abstract class BaseCommand implements Command {
  /**
   * Construct a command object around `context`
   *
   * @param {Context} context 
   */
  public constructor(
    /**
     * @description Execution context
     */
    protected readonly context: Context,

    /**
     * @description Token identifier
     */
    protected readonly identifier: TokenIdentifier,
  ) {}

  /// region abstract methods
  /**
   * Getter for the command name.
   *
   * @return {string}
   **/
  public abstract get name(): string

  /**
   * Verifies **allowance** of `actor` to execute command.  Arguments to
   * the command execution can be passed in `argv`.
   *
   * @param   {PublicAccount}                actor
   * @param   {Array<CommandOption>}   argv
   * @return  {AllowanceResult}
   **/
  public abstract canExecute(
    actor: PublicAccount,
    argv: CommandOption[] | undefined,
  ): AllowanceResult

  /**
   * Execute the command with `actor` operator account. Arguments to
   * the command execution can be passed in `argv`.
   *
   * @param   {PublicAccount}         actor
   * @param   {Array<CommandOption>}   argv
   * @return  {TransactionURI}
   **/
  public abstract execute(
    actor: PublicAccount,
    argv: CommandOption[] | undefined,
  ): TransactionURI

  /**
   * Prepare the command's transactions. Some commands may require
   * the atomic execution of all their transactions and therefor
   * need the prepare method to wrap transactions inside an aggregate
   * transaction.
   *
   * @param   {PublicAccount}         actor
   * @param   {Array<CommandOption>}   argv
   * @return  {TransactionURI}
   **/
  protected abstract prepare(): AggregateTransaction | Transaction

  /**
   * Build a command's transactions. Transactions returned here will
   * be formatted to a transaction URI in the `execute()` step.
   *
   * @return {Transaction}
   **/
  protected abstract get transactions(): Transaction[]
  /// end-region abstract methods

  /**
   * Asserts the allowance of `actor` to execute the command.
   *
   * @param {PublicAccount} actor 
   * @param {CommandOption[]} argv 
   * @throws {FailureOperationForbidden} On denial of authorization
   */
  protected assertExecutionAllowance(
    actor: PublicAccount,
    argv: CommandOption[] | undefined,
  ): boolean {
    // check that `actor` is allowed to execute
    const authResult = this.canExecute(actor, argv)
    if (!authResult.status) {
      throw new FailureOperationForbidden('Operation forbidden (' + this.name + ')')
    }

    return true
  }

  /**
   * Asserts the presence of `fields` in `argv`.
   *
   * @param {CommandOption[]} argv
   * @param {string[]} fields
   * @throws {FailureMissingArgument} On missing mandatory argument(s).
   */
  protected assertHasMandatoryArguments(
    argv: CommandOption[] | undefined,
    fields: string[]
  ): boolean {
    // check that all `fields` are present in context
    for (let i = 0, m = fields.length; i < m; i ++) {
      const value = this.context.getInput(fields[i], null)
      if (null === value) {
        throw new FailureMissingArgument('Missing argument "' + fields[i] + '"')
      }
    }

    return true
  }
}

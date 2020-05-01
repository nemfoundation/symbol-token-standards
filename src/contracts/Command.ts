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
import { PublicAccount } from 'symbol-sdk'
import { TransactionURI } from 'symbol-uri-scheme'

// internal dependencies
import {
  AllowanceResult,
  CommandOption,
} from '../../index'

/**
 * @interface Command
 * @package contracts
 * @since v0.1.0
 * @description Interface that describes token commands.
 * @link https://github.com/nemtech/NIP/blob/master/NIPs/nip-0013.md#token-commands
 */
export interface Command {

  readonly name: string

  /**
   * Synchronize the command execution with the network. This method shall
   * be used to fetch data required for execution.
   *
   * @async
   * @return {Promise<boolean>}
   */
  synchronize(): Promise<boolean>

  /**
   * Verifies **allowance** of `actor` to execute command.  Arguments to
   * the command execution can be passed in `argv`.
   *
   * @param   {PublicAccount}                actor
   * @param   {Array<CommandOption>}   argv
   * @return  {AllowanceResult}
   **/
  canExecute(
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
  execute(
    actor: PublicAccount,
    argv: CommandOption[] | undefined,
  ): TransactionURI
}

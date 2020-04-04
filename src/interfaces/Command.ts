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
import { Address } from 'symbol-sdk'

// internal dependencies
import {
  AllowanceResult,
  CommandOption,
  CommandResult,
  TokenIdentifier,
} from '../index'

/**
 * @interface Command
 * @package interfaces
 * @since v0.1.0
 * @description Interface for describing token commands.
 */
export interface Command {
  /**
   * Verifies **allowance** of `operator` to execute command with `tokenId` security token
   * for `account`. Parameters `account` and `operators` will be the same when the account
   * is supposed to execute the command directly.
   *
   * @param   {Address}         operator
   * @param   {Address}         account
   * @param   {TokenIdentifier} tokenId
   * @param   {Array<CommandOption>}   argv
   * @return  {AllowanceResult}
   **/
  canExecute(
    operator: Address,
    account: Address,
    tokenId: TokenIdentifier,
    argv: CommandOption[]): AllowanceResult

  /**
   * Execute `command` for Security Token with identifier `tokenId`. Arguments
   * the command execution can be passed in `argv`. Parameters `account` and `operators` 
   * will be the same when the account is supposed to execute the command directly.
   *
   * @param   {Address}         operator
   * @param   {Address}         account
   * @param   {TokenIdentifier} tokenId
   * @param   {Array<CommandOption>}   argv
   * @return  {CommandResult}
   **/
  execute(
    operator: Address,
    account: Address,
    tokenId: TokenIdentifier,
    argv: CommandOption[]): CommandResult
}

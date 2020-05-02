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
import { PublicAccount, Deadline, UInt64 } from 'symbol-sdk'
import { TransactionURI } from 'symbol-uri-scheme'

// internal dependencies
import {
  AccountMetadata,
  AccountRestriction,
  AllowanceResult,
  Command,
  CommandOption,
  Context,
  Notification,
  NotificationProof,
  TokenIdentifier,
  TokenMetadata,
  TokenPartition,
  TokenRestriction,
  NetworkConfig,
  TransactionParameters,
} from '../../index'

/**
 * @interface Standard
 * @package contracts
 * @since v0.1.0
 * @description Interface that describes security token standards.
 */
export interface Standard {
  /**
   * @description The network configuration object.
   */
  readonly network: NetworkConfig

  /**
   * Notify an account `account` about `notification`
   *
   * @param   {TokenIdentifier} tokenId
   * @param   {PublicAccount}   account
   * @param   {Notification}    notification
   * @param   {TransactionParameters} parameters
   * @return  {NotificationProof}
   **/
  notify(
    tokenId: TokenIdentifier,
    account: PublicAccount,
    notification: Notification,
    parameters: TransactionParameters,
  ): NotificationProof

  /**
   * Verifies **allowance** of `sender` to transfer `tokenId` security token.
   *
   * @param   {PublicAccount}         sender
   * @param   {TokenIdentifier} tokenId
   * @return  {AllowanceResult}
   **/
  canTransfer(
    sender: PublicAccount,
    tokenId: TokenIdentifier,
  ): AllowanceResult

  /**
   * Verifies **allowance** of `operator` to execute `command` with `tokenId` security token.
   *
   * @internal This method MUST use the `Command.canExecute()` method.
   * @param   {PublicAccount}         actor
   * @param   {TokenIdentifier}       tokenId
   * @param   {string}                command
   * @param   {Array<CommandOption>}  argv
   * @return  {AllowanceResult}
   **/
  canExecute(
    actor: PublicAccount,
    tokenId: TokenIdentifier,
    command: string,
    argv: CommandOption[]
  ): AllowanceResult

  /**
   * Execute `command` for Security Token with identifier `tokenId`. Arguments
   * the command execution can be passed in `argv`.
   *
   * @internal This method MUST use the `Command.execute()` method.
   * @param   {PublicAccount}         actor
   * @param   {TokenIdentifier}       tokenId
   * @param   {string}                command
   * @param   {TransactionParameters} parameters
   * @param   {Array<CommandOption>}  argv
   * @return  {TransactionURI}
   **/
  execute(
    actor: PublicAccount,
    tokenId: TokenIdentifier,
    command: string,
    parameters: TransactionParameters,
    argv: CommandOption[],
  ): TransactionURI

  /**
   * Gets an execution context
   *
   * @param   {PublicAccount}   actor
   * @param   {TransactionParameters} parameters
   * @param   {CommandOption[]} argv
   * @return  {Context}
   **/
  getContext(
    actor: PublicAccount,
    parameters: TransactionParameters,
    argv?: CommandOption[],
  ): Context

  /**
   * Gets a command instance around `context` and `tokenId`.
   *
   * @param {TokenIdentifier} tokenId 
   * @param {string}          command 
   * @param {Context}         context 
   * @return {Command}
   */
  getCommand(
    tokenId: TokenIdentifier,
    command: string,
    context: Context,
  ): Command

  /**
   * Read operators of a token.
   * 
   * @param   {PublicAccount}         target
   * @return  {Array<PublicAccount>}
   **/
  getOperators(
    target: PublicAccount,
  ): PublicAccount[]

  /**
   * Read metadata of a previously created Security Token with identifier `tokenId`.
   * 
   * @param   {TokenIdentifier}       tokenId
   * @return  {Array<TokenMetadata>}
   **/
  getMetadata(
    tokenId: TokenIdentifier,
  ): [TokenMetadata|AccountMetadata]

  /**
   * Read restrictions of a previously created Security Token with identifier `tokenId`.
   * 
   * @param   {TokenIdentifier}       tokenId
   * @param   {PublicAccount|undefined}     account (Optional)
   * @return  {Array<TokenRestriction|AccountRestriction>}
   **/
  getRestrictions(
    tokenId: TokenIdentifier,
    account: PublicAccount|undefined,
  ): [TokenRestriction|AccountRestriction]

  // XXX getOperators
  // XXX addOperator
  // XXX getPartitions
  // XXX setPartitions
  // XXX addPartition
}

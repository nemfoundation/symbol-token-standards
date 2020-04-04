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
  AccountMetadata,
  AccountRestriction,
  AllowanceResult,
  Command,
  CommandOption,
  CommandResult,
  Notification,
  NotificationProof,
  PublicationProof,
  TokenIdentifier,
  TokenMetadata,
  TokenRestriction,
  TokenSource,
} from '../index'

/**
 * @interface Standard
 * @package interfaces
 * @since v0.1.0
 * @description Interface for describing security token standards.
 */
export interface Standard {
  /**
   * Creates a new Security Token with pre-defined Symbol feature set.
   *
   * @param   {string}          name
   * @param   {Address}         owner
   * @param   {TokenSource}     source
   * @param   {Array<Address>}  operators
   * @return  {TokenIdentifier}
   **/
  create(
    name: string,
    owner: Address,
    source: TokenSource,
    operators: [Address]): TokenIdentifier

  /**
   * Publish a previously created Security Token with identifier `tokenId`.
   *
   * @internal This method MUST use the `PublishToken` command.
   * @param   {string}          name
   * @param   {Address}         owner
   * @param   {Array<Address>}  operators
   * @return  {PublicationProof}
   **/
  publish(
    tokenId: TokenIdentifier): PublicationProof

  /**
   * Notify an account `account` about `notification`
   *
   * @param   {TokenIdentifier} tokenId
   * @param   {Address}         account
   * @param   {Notification}    notification
   * @return  {NotificationProof}
   **/
  notify(
    tokenId: TokenIdentifier,
    account: Address,
    notification: Notification): NotificationProof

  /**
   * Verifies **allowance** of `sender` to transfer `tokenId` security token.
   *
   * @param   {Address}         sender
   * @param   {TokenIdentifier} tokenId
   * @return  {AllowanceResult}
   **/
  canTransfer(
    sender: Address,
    tokenId: TokenIdentifier): AllowanceResult

  /**
   * Verifies **allowance** of `operator` to execute `command` with `tokenId` security token.
   *
   * @internal This method MUST use the `Command.canExecute()` method.
   * @param   {Address}         operator
   * @param   {Address}         account
   * @param   {TokenIdentifier} tokenId
   * @param   {Command}         command
   * @param   {Array<CommandOption>}   argv
   * @return  {AllowanceResult}
   **/
  canExecute(
    operator: Address,
    account: Address,
    tokenId: TokenIdentifier,
    command: Command,
    argv: CommandOption[]): AllowanceResult

  /**
   * Execute `command` for Security Token with identifier `tokenId`. Arguments
   * the command execution can be passed in `argv`.
   *
   * @internal This method MUST use the `Command.execute()` method.
   * @param   {Address}         operator
   * @param   {Address}         account
   * @param   {TokenIdentifier} tokenId
   * @param   {Command}         command
   * @param   {Array<CommandOption>}   argv
   * @return  {CommandResult}
   **/
  execute(
    operator: Address,
    account: Address,
    tokenId: TokenIdentifier,
    command: Command,
    argv: CommandOption[]): CommandResult

  /**
   * Read metadata of a previously created Security Token with identifier `tokenId`.
   * 
   * @param   {TokenIdentifier}       tokenId
   * @return  {Array<TokenMetadata>}
   **/
  getMetadata(
    tokenId: TokenIdentifier): [TokenMetadata|AccountMetadata]

  /**
   * Read restrictions of a previously created Security Token with identifier `tokenId`.
   * 
   * @param   {TokenIdentifier}       tokenId
   * @param   {Address|undefined}     account (Optional)
   * @return  {Array<TokenRestriction|AccountRestriction>}
   **/
  getRestrictions(
    tokenId: TokenIdentifier,
    account: Address|undefined): [TokenRestriction|AccountRestriction]

  // XXX getOperators
  // XXX getPartitions
  // XXX setPartitions
  // XXX addPartition
}

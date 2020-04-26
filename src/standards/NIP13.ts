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
  PublicAccount,
  UInt64,
  Deadline,
  SHA3Hasher,
  RepositoryFactoryHttp,
  NetworkType,
} from 'symbol-sdk'
import {
  ExtendedKey,
  MnemonicPassPhrase,
  Network,
  Wallet,
} from 'symbol-hd-wallets'

// internal dependencies
import { NIP13 as CommandsImpl } from './NIP13/index'
import {
  AccountMetadata,
  AccountRestriction,
  AllowanceResult,
  Command,
  CommandOption,
  FailureInvalidCommand,
  Notification,
  NotificationProof,
  PublicationProof,
  Standard,
  TokenIdentifier,
  TokenMetadata,
  TokenPartition,
  TokenRestriction,
  TokenRestrictionType,
  TokenSource,
  Context,
  DerivationHelpers,
} from '../index'
import { AbstractCommand } from './NIP13/commands/AbstractCommand'

export namespace NIP13 {

  /**
   * @type NIP13.CommandFn
   * @package standards
   * @since v0.1.0
   * @description Type that describes NIP13 token command functions
   */
  export type CommandFn = (c: Context, i: TokenIdentifier, k: Wallet) => Command

  /**
   * @type NIP13.CommandsList
   * @package standards
   * @since v0.1.0
   * @description Type that describes NIP13 token command lists
   */
  export type CommandsList = {
    [id: string]: CommandFn
  }

  /**
   * @var NIP13.TokenCommands
   * @package standards
   * @since v0.1.0
   * @description Object that describes NIP13 available token commands
   * @link https://github.com/nemtech/NIP/blob/master/NIPs/nip-0013.md#token-commands
   */
  export const TokenCommands: CommandsList = {
    'CreateToken': (c, i, k): Command => new CommandsImpl.CreateToken(c, i, k),
    'PublishToken': (c, i, k): Command => new CommandsImpl.PublishToken(c, i, k),
    'TransferOwnership': (c, i, k): Command => new CommandsImpl.TransferOwnership(c, i, k),
  }

  /**
   * @var NIP13.Revision
   * @package standards
   * @since v0.1.0
   * @description Object that describes the count of NIP13 security token revisions
   */
  export const Revision: number = 1

  /**
   * @class NIP13.TokenStandard
   * @package standards
   * @since v0.1.0
   * @description Class that describes NIP13 security tokens standard
   * @link https://github.com/nemtech/NIP/blob/master/NIPs/nip-0013.md
   */
  export class TokenStandard implements Standard {

    /**
     * @description The deterministic public account representing the token.
     */
    public target: PublicAccount

    /**
     * @description The key provider for said token.
     */
    public keyProvider: Wallet

    /**
     * @description Last token command execution result. URIs must be executed
     *              outside of the token standard.
     */
    public result?: TransactionURI

    /**
     * Constructs a NIP13 token standard object.
     *
     * @param {string} nodeUrl 
     */
    public constructor(
      /**
       * @description The endpoint URL that will be used to connect.
       */
      public readonly nodeUrl: string,

      /**
       * @description The endpoint network type.
       */
      public readonly networkType: NetworkType,

      /**
       * @description The BIP39 mnemonic pass phrase used with said token.
       */
      public readonly bip39: MnemonicPassPhrase
    ) {
      // initialize key provider
      this.keyProvider = new Wallet(
        ExtendedKey.createFromSeed(
          this.bip39.toSeed().toString('hex'),
          Network.CATAPULT
        )
      )

      // derive base keys
      this.target = this.keyProvider.getChildPublicAccount(
        DerivationHelpers.DEFAULT_HDPATH,
        this.networkType,
      )
    }

    /**
     * Creates a new NIP13 Token and configures operators.
     *
     * @param   {string}                name
     * @param   {PublicAccount}         actor
     * @param   {PublicAccount}         target
     * @param   {TokenSource}           source
     * @param   {Array<PublicAccount>}  operators
     * @param   {number}                supply
     * @return  {TokenIdentifier}
     **/
    public create(
      name: string,
      actor: PublicAccount,
      source: TokenSource,
      operators: PublicAccount[],
      supply: number,
    ): TokenIdentifier {

      // prepare deterministic token identifier
      const hash = new Uint8Array(64)
      const data = this.target.address.plain()
                 + '-' + supply.toString()
                 + '-' + name
                 + '-' + source.source
                 + '-' + operators.map((p) => p.address.plain()).join(',')
      SHA3Hasher.func(hash, data, 64)

      // 4 left-most bytes for the mosaic nonce
      const left4b = parseInt(hash.slice(0, 4).join(''), 16)
      const tokenId = new TokenIdentifier(UInt64.fromUint(left4b), source, this.target)

      // execute token command `CreateToken`
      this.result = this.execute(actor, tokenId, 'CreateToken', [
        new CommandOption('name', name),
        new CommandOption('source', source),
        new CommandOption('operators', operators),
        new CommandOption('supply', supply),
      ])

      return tokenId
    }

    /**
     * Publish a previously created Security Token with identifier `tokenId`.
     *
     * @internal This method MUST use the `PublishToken` command.
     * @param   {PublicAccount}         actor
     * @param   {TokenIdentifier}       tokenId
     * @param   {TokenPartition[]}      partitions (Optional) partitions records
     * @return  {PublicationProof}
     **/
    public publish(
      actor: PublicAccount,
      tokenId: TokenIdentifier,
      partitions: TokenPartition[] = [],
    ): TransactionURI {
      // execute token command `PublishToken`
      this.result = this.execute(actor, tokenId, 'PublishToken', [
        new CommandOption('partitions', partitions),
      ])

      return this.result
    }

    /**
     * Notify an account `account` about `notification`
     *
     * @param   {TokenIdentifier} tokenId
     * @param   {PublicAccount}         account
     * @param   {Notification}    notification
     * @return  {NotificationProof}
     **/
    public notify(
      tokenId: TokenIdentifier,
      account: PublicAccount,
      notification: Notification
    ): NotificationProof {
      return new NotificationProof('')
    }

    /**
     * Verifies **allowance** of `sender` to transfer `tokenId` security token.
     *
     * @param   {PublicAccount}         sender
     * @param   {TokenIdentifier} tokenId
     * @return  {AllowanceResult}
     **/
    public canTransfer(
      sender: PublicAccount,
      tokenId: TokenIdentifier
    ): AllowanceResult {
      return new AllowanceResult(true)
    }

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
    public canExecute(
      actor: PublicAccount,
      tokenId: TokenIdentifier,
      command: string,
      argv: CommandOption[]
    ): AllowanceResult {
      try {
        // instanciate command and context
        const cmdFn = this.getCommand(tokenId, command, this.getContext(
          actor,
          Deadline.create(),
          undefined,
          argv,
        ))

        // use `canExecute` for token command
        return cmdFn.canExecute(actor, argv)
      }
      catch (f) {
        // XXX error notifications / events
        throw f
      }
    }

    /**
     * Execute `command` for Security Token with identifier `tokenId`. Arguments
     * the command execution can be passed in `argv`.
     *
     * @internal This method MUST use the `Command.execute()` method.
     * @param   {PublicAccount}         actor  The execution `actor`
     * @param   {TokenIdentifier}       tokenId
     * @param   {string}                command
     * @param   {Array<CommandOption>}  argv
     * @return  {TransactionURI}
     **/
    public execute(
      actor: PublicAccount,
      tokenId: TokenIdentifier,
      command: string,
      argv: CommandOption[],
    ): TransactionURI {
      try {
        // instanciate command and context
        const cmdFn = this.getCommand(tokenId, command, this.getContext(
          actor,
          Deadline.create(),
          undefined,
          argv,
        ))

        // execute token command
        return cmdFn.execute(actor, argv)
      }
      catch (f) {
        // XXX error notifications / events
        throw f
      }
    }

    /**
     * Gets an execution context
     *
     * @param   {PublicAccount}   actor
     * @param   {PublicAccount}   target
     * @param   {Deadline}        deadline
     * @param   {UInt64}          maxFee
     * @param   {CommandOption[]} argv
     * @return  {Context}
     */
    public getContext(
      actor: PublicAccount,
      deadline?: Deadline,
      maxFee?: UInt64,
      argv?: CommandOption[],
    ): Context {
      return new Context(
        Revision,
        actor,
        new RepositoryFactoryHttp(this.nodeUrl),
        this.networkType,
        deadline,
        maxFee,
        argv
      )
    }

    /**
     * Gets a command instance around `context` and `tokenId`.
     *
     * @param {TokenIdentifier} tokenId 
     * @param {string}          command 
     * @param {Context}         context 
     * @return {Command}
     */
    public getCommand(
      tokenId: TokenIdentifier,
      command: string,
      context: Context,
    ): Command {
      // validate token command
      if (!TokenCommands || !TokenCommands[command]) {
        throw new FailureInvalidCommand('Invalid token command.')
      }

      return TokenCommands[command](context, tokenId, this.keyProvider)
    }

    /**
     * Read operators of a previously created Security Token with identifier `tokenId`.
     * 
     * @param   {PublicAccount}         target
     * @return  {Array<PublicAccount>}
     **/
    public getOperators(
      target: PublicAccount,
    ): PublicAccount[] {
      return []
    }

    /**
     * Read metadata of a previously created Security Token with identifier `tokenId`.
     * 
     * @param   {TokenIdentifier}       tokenId
     * @return  {Array<TokenMetadata|AccountMetadata>}
     **/
    public getMetadata(
      tokenId: TokenIdentifier
    ): [TokenMetadata|AccountMetadata] {
      return [new TokenMetadata(tokenId, 'dummy', '')]
    }

    /**
     * Read restrictions of a previously created Security Token with identifier `tokenId`.
     * 
     * @param   {TokenIdentifier}       tokenId
     * @param   {PublicAccount|undefined}     account (Optional)
     * @return  {Array<TokenRestriction|AccountRestriction>}
     **/
    getRestrictions(
      tokenId: TokenIdentifier,
      account: PublicAccount|undefined
    ): [TokenRestriction|AccountRestriction] {
      return [new TokenRestriction(tokenId, TokenRestrictionType.AddressRestriction, 'EQ', 'dummy', '')]
    }
  }

  /**
   * @class NIP13.Token
   * @package standards
   * @since v0.1.0
   * @description Class that describes NIP13 compliant security tokens
   * @link https://github.com/nemtech/NIP/blob/master/NIPs/nip-0013.md
   */
  export class Token extends TokenStandard {}

}

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
  Convert,
  PublicAccount,
  SHA3Hasher,
  MosaicInfo,
  MosaicId,
} from 'symbol-sdk'
import {
  MnemonicPassPhrase,
  Wallet,
} from 'symbol-hd-wallets'

// internal dependencies
import { NIP13 as CommandsImpl } from './NIP13/index'
import {
  AllowanceResult,
  Command,
  CommandOption,
  FailureInvalidCommand,
  NetworkConfig,
  Notification,
  NotificationProof,
  Standard,
  TokenIdentifier,
  TokenPartition,
  TokenSource,
  Context,
  TransactionParameters,
} from '../../index'
import { SecuritiesMetadata } from './NIP13/models/SecuritiesMetadata'
import { SecuritiesRestrictions } from './NIP13/models/SecuritiesRestrictions'
import { Accountable } from './NIP13/contracts/Accountable'
import { MultisigService } from './NIP13/services/MultisigService'
import { MetadataService } from './NIP13/services/MetadataService'
import { RestrictionService } from './NIP13/services/RestrictionService'
import { PartitionService } from './NIP13/services/PartitionService'
import { MosaicService } from './NIP13/services/MosaicService'
import { AbstractCommand } from './NIP13/commands/AbstractCommand'

/**
 * @type NIP13.CommandFn
 * @package standards
 * @since v0.1.0
 * @internal
 * @description Type that describes NIP13 token command functions
 */
type CommandFn = (c: Context, i: TokenIdentifier, k: Wallet) => Command

/**
 * @type NIP13.CommandsList
 * @package standards
 * @since v0.1.0
 * @internal
 * @description Type that describes NIP13 token command lists
 */
type CommandsList = {
  [id: string]: CommandFn
}

/**
 * @type NIP13.TokenMetadata
 * @package standards
 * @since v0.3.3
 * @description Class that describes NIP13 token metadata
 * @see {SecuritiesMetadata}
 */
export class TokenMetadata extends SecuritiesMetadata {}

/**
 * @type NIP13.TokenRestrictions
 * @package standards
 * @since v0.5.1
 * @description Class that describes NIP13 token restrictions
 * @see {SecuritiesRestrictions}
 */
export class TokenRestrictions extends SecuritiesRestrictions {}

/**
 * @type NIP13.TokenAuthority
 * @package standards
 * @since v0.3.3
 * @description Class that describes NIP13 token authorities
 */
export class TokenAuthority extends Accountable {
  /**
   * @description The deterministic public account representing the authority.
   */
  public publicAccount: PublicAccount

  /**
   * Constructs a NIP13 token authority object.
   *
   * @param {NetworkConfig}       network
   * @param {MnemonicPassPhrase}  bip39 
   */
  public constructor(
    /**
     * @description The network configuration
     */
    public readonly network: NetworkConfig,

    /**
     * @description The BIP39 mnemonic pass phrase used with said token.
     */
    protected readonly bip39: MnemonicPassPhrase,
  ) {
    // @see {Accountable}
    super(network, bip39)

    // derive base keys
    this.publicAccount = this.getAuthority().publicAccount
  }

  /**
   * List a token authority's security tokens. A token authority
   * is used to prove the existance of said security tokens on
   * a network.
   *
   * @param {TokenAuthority} authority
   * @return {MosaicId[]}
   */
  public static async getTokens(
    authority: PublicAccount | TokenAuthority,
    network: NetworkConfig,
  ): Promise<MosaicId[]> {
    const account = authority instanceof PublicAccount
      ? authority as PublicAccount
      : authority.publicAccount

    // prepare context
    const context = new Context(
      Revision,
      account,
      network,
      new TransactionParameters(),
      undefined
    )

    // use NIP13 mosaic service
    const service = new MosaicService(context)

    // prepare output
    const mosaics: MosaicId[] = await service.getMosaicsFromNetwork(
      account,
      'NIP13(v' + context.revision + '):create:' // mosaicId & name after this
    )

    return mosaics
  }
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
  'CreatePartition': (c, i, k): Command => new CommandsImpl.CreatePartition(c, i, k),
  'TransferOwnership': (c, i, k): Command => new CommandsImpl.TransferOwnership(c, i, k),
  'TransferOwnershipWithData': (c, i, k): Command => new CommandsImpl.TransferOwnershipWithData(c, i, k),
  'BatchTransferOwnership': (c, i, k): Command => new CommandsImpl.BatchTransferOwnership(c, i, k),
  'BatchTransferOwnershipWithData': (c, i, k): Command => new CommandsImpl.BatchTransferOwnershipWithData(c, i, k),
  'ForcedTransfer': (c, i, k): Command => new CommandsImpl.ForcedTransfer(c, i, k),
  'LockBalance': (c, i, k): Command => new CommandsImpl.LockBalance(c, i, k),
  'UnlockBalance': (c, i, k): Command => new CommandsImpl.UnlockBalance(c, i, k),
  'ModifyMetadata': (c, i, k): Command => new CommandsImpl.ModifyMetadata(c, i, k),
  'ModifyRestriction': (c, i, k): Command => new CommandsImpl.ModifyRestriction(c, i, k),
  'DelegateIssuerPower': (c, i, k): Command => new CommandsImpl.DelegateIssuerPower(c, i, k),
  'RevokeIssuerPower': (c, i, k): Command => new CommandsImpl.RevokeIssuerPower(c, i, k),
  'AttachDocument': (c, i, k): Command => new CommandsImpl.AttachDocument(c, i, k),
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
export class TokenStandard extends Accountable implements Standard {

  /**
   * @description The deterministic public account representing the token.
   */
  public target: PublicAccount

  /**
   * @description The token source (network generation hash).
   */
  public source: TokenSource

  /**
   * @description Mosaic information (read from network).
   */
  public mosaicInfo: MosaicInfo | undefined

  /**
   * @description List of operators of said token.
   */
  public operators: PublicAccount[] = []

  /**
   * @description Partition records of said token.
   */
  public partitions: TokenPartition[] = []

  /**
   * @description The securities metadata
   */
  public metadata: SecuritiesMetadata | undefined

  /**
   * @description The securities metadata
   */
  public restrictions: SecuritiesRestrictions | undefined

  /**
   * @description Last token command execution result. URIs must be executed
   *              outside of the token standard.
   */
  public result?: TransactionURI

  /**
   * Constructs a NIP13 token standard object.
   *
   * @param {NetworkConfig}       network
   * @param {MnemonicPassPhrase}  bip39 
   */
  public constructor(
    /**
     * @description The network configuration
     */
    public readonly network: NetworkConfig,

    /**
     * @description The BIP39 mnemonic pass phrase used with said token.
     */
    protected readonly bip39: MnemonicPassPhrase,
  ) {
    // @see {Accountable}
    super(network, bip39)

    // derive base keys
    this.target = this.getTarget().publicAccount

    // set network configuration
    this.source = new TokenSource(this.network.generationHash)
  }

  /**
   * Getter for the deterministic token identifier.
   *
   * @return {TokenIdentifier}
   */
  public get identifier(): TokenIdentifier {
    // prepare deterministic token identifier (sha3-512)
    const hash = new Uint8Array(64)
    const data = this.target.address.plain() + '-' + this.source.source
    SHA3Hasher.func(hash, Convert.utf8ToUint8(data), 64)

    // 4 left-most bytes for the identifier
    const left4b: string = hash.slice(0, 4).reduce(
      (s, b) => s + b.toString(16).padStart(2, '0'),
      '', // initialValue
    )

    return new TokenIdentifier(left4b, this.source, this.target)
  }

  /**
   * Synchronize the command execution with the network. This method shall
   * be used to fetch data required for execution.
   *
   * @async
   * @return {Promise<boolean>}
   */
  public async synchronize(): Promise<boolean> {
    // prepare
    const target = this.target.address
    const context = this.getContext(this.target, new TransactionParameters())
    const multisig = new MultisigService(context)
    const metadata = new MetadataService(context)
    const restrictions = new RestrictionService(context)
    const partitions = new PartitionService(context)

    // initialize REST
    const multisigHttp = context.network.factoryHttp.createMultisigRepository()
    const mosaicHttp   = context.network.factoryHttp.createMosaicRepository()

    // consolidate/reduce graph
    const graph = await multisigHttp.getMultisigAccountGraphInfo(target).toPromise()
    this.operators = multisig.getMultisigAccountInfoFromGraph(graph).map(
      m => m.cosignatories
    ).reduce((prev, it) => prev.concat(it))

    // read mosaic
    this.mosaicInfo = await mosaicHttp.getMosaic(this.identifier.toMosaicId()).toPromise()

    // read partitions
    this.partitions = await partitions.getPartitionsFromNetwork(
      this.identifier,
      this.target,
      this.operators,
      'NIP13(v' + context.revision + '):partition:' + this.identifier.id + ':' // label after this
    )

    // read token metadata
    this.metadata = await metadata.getMetadataFromNetwork(this.identifier)

    // read token restrictions
    this.restrictions = await restrictions.getRestrictionsFromNetwork(this.identifier)

    // success exit
    return true
  }

  /**
   * Creates a new NIP13 Token and configures operators.
   *
   * @param   {string}                  name
   * @param   {PublicAccount}           actor
   * @param   {PublicAccount}           authority
   * @param   {Array<PublicAccount>}    operators
   * @param   {number}                  supply
   * @param   {SecuritiesMetadata}      metadata
   * @param   {TransactionParameters}   parameters
   * @return  {TokenIdentifier}
   **/
  public create(
    name: string,
    actor: PublicAccount,
    authority: PublicAccount,
    operators: PublicAccount[],
    supply: number,
    metadata: SecuritiesMetadata,
    parameters: TransactionParameters,
  ): TokenIdentifier {
    // generate deterministic token identifier
    const tokenId = this.identifier

    // execute token command `CreateToken` (synchronize() not needed)
    this.result = this.executeWithoutSync(actor, tokenId, 'CreateToken', parameters, [
      new CommandOption('name', name),
      new CommandOption('source', this.source),
      new CommandOption('authority', authority),
      new CommandOption('operators', operators),
      new CommandOption('supply', supply),
      new CommandOption('metadata', metadata),
    ])

    return tokenId
  }

  /**
   * Add a token holder partition for \a holder with deterministic
   * \a partition account.
   *
   * @param {PublicAccount} actor 
   * @param partition 
   * @param holder 
   */
  public async addPartition(
    actor: PublicAccount,
    partition: PublicAccount,
    holder: PublicAccount,
    name: string,
    parameters: TransactionParameters,
  ): Promise<TransactionURI> {
    // generate deterministic token identifier
    const tokenId = this.identifier

    // execute token command `CreatePartition`
    this.result = await this.execute(actor, tokenId, 'CreatePartition', parameters, [
      new CommandOption('name', name),
      new CommandOption('partition', partition),
      new CommandOption('holder', holder),
    ])

    return this.result
  }

  /**
   * Transfer shares of a Security Token with identifier `tokenId`.
   *
   * @internal This method MUST use the `TransferOwnership` command.
   * @param   {PublicAccount}         actor
   * @param   {PublicAccount}         sender
   * @param   {PublicAccount}         recipient   MUST be a partition account
   * @param   {number}                amount
   * @param   {TransactionParameters} parameters
   * @return  {TransactionURI}
   **/
  public async transfer(
    actor: PublicAccount,
    sender: PublicAccount,
    recipient: PublicAccount,
    amount: number,
    parameters: TransactionParameters,
  ): Promise<TransactionURI> {
    // generate deterministic token identifier
    const tokenId = this.identifier

    // execute token command `TransferOwnership`
    this.result = await this.execute(actor, tokenId, 'TransferOwnership', parameters, [
      new CommandOption('sender', sender),
      new CommandOption('recipient', recipient),
      new CommandOption('amount', amount),
    ])

    return this.result
  }

  /**
   * Transfer shares of a Security Token with identifier `tokenId` and attach 
   * plain text-, signed-, encrypted- data.
   *
   * @internal This method MUST use the `TransferOwnershipWithData` command.
   * @param   {PublicAccount}         actor
   * @param   {PublicAccount}         sender
   * @param   {PublicAccount}         recipient   MUST be a partition account
   * @param   {number}                amount
   * @param   {string}                data
   * @param   {TransactionParameters} parameters
   * @return  {TransactionURI}
   **/
  public async transferWithData(
    actor: PublicAccount,
    sender: PublicAccount,
    recipient: PublicAccount,
    amount: number,
    data: string,
    parameters: TransactionParameters,
  ): Promise<TransactionURI> {
    // generate deterministic token identifier
    const tokenId = this.identifier

    // execute token command `TransferOwnership`
    this.result = await this.execute(actor, tokenId, 'TransferOwnershipWithData', parameters, [
      new CommandOption('sender', sender),
      new CommandOption('recipient', recipient),
      new CommandOption('amount', amount),
      new CommandOption('data', data),
    ])

    return this.result
  }

  /**
   * Notify an account `account` about `notification`
   *
   * @param   {TokenIdentifier} tokenId
   * @param   {PublicAccount}   account
   * @param   {Notification}    notification
   * @return  {NotificationProof}
   **/
  public notify(
    tokenId: TokenIdentifier,
    account: PublicAccount,
    notification: Notification,
    parameters: TransactionParameters,
  ): NotificationProof {
    return new NotificationProof('')
  }

  /**
   * Verifies **allowance** of `sender` to transfer `tokenId` security token
   * to `recipient` with a number of shares attached of `amount`.
   *
   * @param   {TokenIdentifier} tokenId
   * @param   {PublicAccount}   sender
   * @param   {PublicAccount}   recipient
   * @param   {number}          amount
   * @return  {AllowanceResult}
   **/
  public canTransfer(
    tokenId: TokenIdentifier,
    sender: PublicAccount,
    recipient: PublicAccount,
    amount: number,
  ): AllowanceResult {
    return this.canExecute(sender, tokenId, 'TransferOwnership', [
      new CommandOption('sender', sender),
      new CommandOption('recipient', recipient),
      new CommandOption('amount', amount),
    ])
  }

  /**
   * Verifies **allowance** of `sender` to transfer `tokenId` security token
   * to `recipient` with a number of shares attached of `amount` and attaching
   * `data` plain text-, signed- or encrypted- data.
   *
   * @param   {TokenIdentifier} tokenId
   * @param   {PublicAccount}   sender
   * @param   {PublicAccount}   recipient
   * @param   {number}          amount
   * @param   {string}          data
   * @return  {AllowanceResult}
   **/
  public canTransferWithData(
    tokenId: TokenIdentifier,
    sender: PublicAccount,
    recipient: PublicAccount,
    amount: number,
    data: string
  ): AllowanceResult {
    return this.canExecute(sender, tokenId, 'TransferOwnershipWithData', [
      new CommandOption('sender', sender),
      new CommandOption('recipient', recipient),
      new CommandOption('amount', amount),
      new CommandOption('data', data)
    ])
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
    // instanciate command and context
    const params = new TransactionParameters()
    const context = this.getContext(actor, params, argv)
    const cmdFn = this.getCommand(tokenId, command, context) as AbstractCommand

    // populate async data
    cmdFn.mosaicInfo = this.mosaicInfo
    cmdFn.operators = this.operators
    cmdFn.partitions = this.partitions

    // use `canExecute` for token command
    return cmdFn.canExecute(actor, argv)
  }

  /**
   * Execute `command` for Security Token with identifier `tokenId`. Arguments
   * the command execution can be passed in `argv`.
   * 
   * This method MUST call the `synchronize()` method.
   *
   * @internal This method MUST use the `Command.execute()` method.
   * @param   {PublicAccount}         actor
   * @param   {TokenIdentifier}       tokenId
   * @param   {string}                command
   * @param   {TransactionParameters} parameters
   * @param   {Array<CommandOption>}  argv
   * @return  {Promise<TransactionURI>}
   **/
  public async execute(
    actor: PublicAccount,
    tokenId: TokenIdentifier,
    command: string,
    parameters: TransactionParameters,
    argv: CommandOption[],
  ): Promise<TransactionURI> {
    // read state from REST API
    await this.synchronize()

    try {
      // instanciate command and context
      const context = this.getContext(actor, parameters, argv)
      const cmdFn = this.getCommand(tokenId, command, context) as AbstractCommand

      // populate async data
      cmdFn.mosaicInfo = this.mosaicInfo
      cmdFn.operators = this.operators
      cmdFn.partitions = this.partitions
      cmdFn.metadata = this.metadata
      cmdFn.restrictions = this.restrictions

      // execute token command
      return cmdFn.execute(actor, argv)
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
   * This method MUST NOT call the `synchronize()` method.
   *
   * @internal This method MUST use the `Command.execute()` method.
   * @param   {PublicAccount}         actor
   * @param   {TokenIdentifier}       tokenId
   * @param   {string}                command
   * @param   {TransactionParameters} parameters
   * @param   {Array<CommandOption>}  argv
   * @return  {TransactionURI}
   **/
  public executeWithoutSync(
    actor: PublicAccount,
    tokenId: TokenIdentifier,
    command: string,
    parameters: TransactionParameters,
    argv: CommandOption[],
  ): TransactionURI {
    try {
      // instanciate command and context
      const context = this.getContext(actor, parameters, argv)
      const cmdFn = this.getCommand(tokenId, command, context) as AbstractCommand

      // populate async data
      cmdFn.mosaicInfo = this.mosaicInfo
      cmdFn.operators = this.operators
      cmdFn.partitions = this.partitions
      cmdFn.metadata = this.metadata
      cmdFn.restrictions = this.restrictions

      // execute token command
      return cmdFn.execute(actor, argv)
    }
    catch (f) {
      // XXX error notifications / events
      throw f
    }
  }

  /// region protected methods
  /**
   * Gets an execution context
   *
   * @param   {PublicAccount}           actor
   * @param   {TransactionParameters}   parameters
   * @param   {CommandOption[]}         argv
   * @return  {Context}
   */
  protected getContext(
    actor: PublicAccount,
    parameters: TransactionParameters,
    argv?: CommandOption[],
  ): Context {
    return new Context(
      Revision,
      actor,
      this.network,
      parameters,
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
  protected getCommand(
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
  /// end-region protected methods
}

/**
 * @class NIP13.Token
 * @package standards
 * @since v0.1.0
 * @description Class that describes NIP13 compliant security tokens
 * @link https://github.com/nemtech/NIP/blob/master/NIPs/nip-0013.md
 */
export class Token extends TokenStandard {}

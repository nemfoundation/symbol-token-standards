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
  MosaicId,
  MosaicNonce,
  MosaicRestrictionType,
  PublicAccount,
  Transaction,
  NamespaceId,
  MultisigAccountModificationTransaction,
  TransferTransaction,
  PlainMessage,
  UInt64,
  NamespaceRegistrationTransaction,
  MosaicDefinitionTransaction,
  MosaicFlags,
  MosaicSupplyChangeTransaction,
  MosaicSupplyChangeAction,
  MosaicAliasTransaction,
  AliasAction,
  MosaicMetadataTransaction,
  KeyGenerator,
  AccountMosaicRestrictionTransaction,
  AccountRestrictionFlags,
  MosaicGlobalRestrictionTransaction,
  MosaicAddressRestrictionTransaction,
  AccountMetadataTransaction,
} from 'symbol-sdk'

// internal dependencies
import { CommandOption, AllowanceResult } from '../../../../index'
import { AbstractCommand } from './AbstractCommand'
import { SecuritiesMetadata } from '../models/SecuritiesMetadata'

/**
 * @class NIP13.CreateToken
 * @package NIP13 Token Commands
 * @since v0.1.0
 * @description Class that describes a token command for creating NIP13 compliant tokens.
 * @transactions This token command prepares one aggregate bonded transaction with following inner transactions:
 *   - Transaction 01: TransferTransaction with NIP13 `CreateToken` command descriptor
 *   - Transaction 02: MultisigAccountModificationTransaction
 *   - Transaction 03: AccountMetadataTransaction attaching `NIP13` token identifier
 *   - Transaction 04: NamespaceRegistrationtTransaction
 *   - Transaction 05: MosaicDefinitionTransaction
 *   - Transaction 06: MosaicSupplyChangeTransaction
 *   - Transaction 07: MosaicAliasTransaction
 *   - Transaction 08: MosaicMetadataTransaction attaching `NIP13` token identifier
 *   - Transaction 09: MosaicMetadataTransaction attaching `NAME`
 *   - Transaction 10: MosaicMetadataTransaction attaching `MIC` market identifier code
 *   - Transaction 11: MosaicMetadataTransaction attaching `ISIN` if non-empty option provided
 *   - Transaction 12: MosaicMetadataTransaction attaching `ISO_10962` if non-empty option provided
 *   - Transaction 13: MosaicMetadataTransaction attaching custom metadata if non-empty option provided
 *   - Transaction 14: AccountMosaicRestrictionTransaction with targets = [mosaicId, feeMosaicId] to allow mosaic and fees for TARGET account
 *   - Transaction 15: MosaicGlobalRestriction with mosaicId (refId 0) (User_Role <= 2)
 *   - Transaction 16: MosaicAddressRestriction for target account (User_Role = Target)
 *
 * :note: `Transaction 04` represents the root namespace registration transaction. Any sub namespace registration
 * transaction will be automatically added to this list.
 *
 * :note: `Transaction 10` will only be added if a non-empty value is provided for the `source` command option.
 *
 * :note: `Transaction 11` will only be added if a non-empty value is provided for the `isin` command option.
 *
 * :note: `Transaction 12` will only be added if a non-empty value is provided for the `iso10962` command option.
 *
 * :note: `Transaction 13` will only be added if a non-empty value is provided for custom metadata fields.
 */
export class CreateToken extends AbstractCommand {
  /**
   * @description List of **required** arguments for this token command.
   * @link https://en.wikipedia.org/wiki/International_Securities_Identification_Number
   * @link https://en.wikipedia.org/wiki/ISO_10962
   * @link https://en.wikipedia.org/wiki/Market_Identifier_Code
   */
  public arguments: string[] = [
    'name',
    'source', // Can be Symbol generation hash or MIC (e.g. XNAS)
    'operators',
    'supply',
    'metadata', // @see {NIP13/models/SecuritiesMetadata}
  ]

  /**
   * Synchronize the command execution with the network. This method shall
   * be used to fetch data required for execution.
   *
   * @async
   * @override The 'CreateToken' command does not need synchronization.
   * @return {Promise<boolean>}
   */
  public async synchronize(): Promise<boolean> {
    // no-data
    return true
  }

  /**
   * @description Method that verifies the allowance of an operator to 
   *              execute the token command `CreateToken`.
   * @see {BaseCommand.canExecute}
   **/
  public canExecute(
    actor: PublicAccount,
    argv?: CommandOption[]
  ): AllowanceResult {
    // validate mandatory inputs
    super.assertHasMandatoryArguments(argv, this.arguments)

    // allows anyone to create tokens
    return new AllowanceResult(true)
  }

  // region abstract methods
  /**
   * @description Getter for the command name.
   * @see {AbstractCommand.name}
   **/
  public get name(): string {
    return 'CreateToken'
  }

  /**
   * Getter for the command descriptor.
   *
   * @return {string}
   **/
  public get descriptor(): string {
    return 'NIP13(v' + this.context.revision + ')' + ':create:' + this.identifier.id
  }

  /**
   * @description Builds the inner transactions necessary for the
   *              execution of a `CreateToken` command.
   * @see {AbstractCommand.transactions}
   * @return {Transaction[]} Aggregate bonded transaction
   **/
  protected get transactions(): Transaction[] {
    // read execution context
    const target = this.target
    const identifier = this.identifier.id

    // read external arguments
    const fullName = this.context.getInput('name', '')
    const operators = this.context.getInput('operators', [])
    const supply = this.context.getInput('supply', 1)
    const metadata = this.context.getInput('metadata', new SecuritiesMetadata(
      '', // ISO_10962 (MIC)
      '', // ISO_6166 (ISIN)
      '', // ISO_10383,
      {}, // customMetadata
    ))

    // prepare output
    const transactions: InnerTransaction[] = []
    const signers: PublicAccount[] = []

    // Transaction 01: Add execution proof transaction
    transactions.push(TransferTransaction.create(
      this.context.parameters.deadline,
      this.target.address,
      [], // no mosaics
      PlainMessage.create(this.descriptor),
      this.context.network.networkType,
      undefined,
    ))

    // Transaction 01 is issued by **target** account (multisig)
    signers.push(this.target)

    // Transaction 02: MultisigAccountModificationTransaction
    // :warning: minRemoval is always n-1 to permit loss of up to 1 key.
    transactions.push(MultisigAccountModificationTransaction.create(
      this.context.parameters.deadline,
      operators.length, // all operators for minApproval
      operators.length - 1, // all except one for minRemoval
      operators,
      [],
      this.context.network.networkType,
      undefined, // maxFee 0 for inner
    ))

    // Transaction 02 is issued by **target** account (multisig)
    signers.push(this.target)

    // Transaction 03: AccountMetadataTransaction
    transactions.push(AccountMetadataTransaction.create(
      this.context.parameters.deadline,
      this.target.publicKey,
      KeyGenerator.generateUInt64Key('NIP13'),
      this.identifier.id.length,
      this.identifier.id,
      this.context.network.networkType,
      undefined, // maxFee 0 for inner
    ))

    // Transaction 03 is issued by **partition** account
    signers.push(this.target)

    // Transaction 03: NamespaceRegistrationtTransaction
    // :note: up to `maxNamespacesDepth` levels are allowed
    const parts = fullName.split('.')
    for (let i = 0, m = parts.length; i < m; i ++) {
      let transaction: NamespaceRegistrationTransaction
      if (i == 0) { 
        transaction = NamespaceRegistrationTransaction.createRootNamespace(
          this.context.parameters.deadline,
          parts[i], // namespaceName
          UInt64.fromUint(2010240), // 1 year at 15 sec / block
          this.context.network.networkType,
          undefined, // maxFee 0 for inner
        )
      }
      else { 
        transaction = NamespaceRegistrationTransaction.createSubNamespace(
          this.context.parameters.deadline,
          name,
          parts.slice(0, i - 1).join('.'), // parent
          this.context.network.networkType,
          undefined, // maxFee 0 for inner
        )
      }

      transactions.push(transaction)

      // Transaction 03 is issued by **target** account (multisig)
      signers.push(this.target)
    }

    // Transaction 04: MosaicDefinitionTransaction
    const mosaicNonce = MosaicNonce.createFromHex(identifier)
    const mosaicId = MosaicId.createFromNonce(mosaicNonce, target)
    transactions.push(MosaicDefinitionTransaction.create(
      this.context.parameters.deadline,
      mosaicNonce,
      mosaicId,
      MosaicFlags.create(true, false, true), // always non-transferable.
      0,
      UInt64.fromUint(2010240), // 1 year at 15 sec / block
      this.context.network.networkType,
      undefined, // maxFee 0 for inner
    ))

    // Transaction 04 is issued by **target** account (multisig)
    signers.push(this.target)

    if (0 < supply) {
      // Transaction 05: MosaicSupplyChangeTransaction
      transactions.push(MosaicSupplyChangeTransaction.create(
        this.context.parameters.deadline,
        mosaicId,
        MosaicSupplyChangeAction.Increase,
        UInt64.fromUint(supply),
        this.context.network.networkType,
        undefined, // maxFee 0 for inner
      ))

      // Transaction 05 is issued by **target** account (multisig)
      signers.push(this.target)
    }

    // Transaction 06: MosaicAliasTransaction
    transactions.push(MosaicAliasTransaction.create(
      this.context.parameters.deadline,
      AliasAction.Link,
      new NamespaceId(fullName),
      mosaicId,
      this.context.network.networkType,
      undefined, // maxFee 0 for inner
    ))

    // Transaction 06 is issued by **target** account (multisig)
    signers.push(this.target)

    // Transaction 07: MosaicMetadataTransaction attaching `NAME`
    transactions.push(MosaicMetadataTransaction.create(
      this.context.parameters.deadline,
      this.target.publicKey,
      KeyGenerator.generateUInt64Key('NIP13'),
      mosaicId,
      this.identifier.id.length,
      this.identifier.id,
      this.context.network.networkType,
      undefined, // maxFee 0 for inner
    ))

    // Transaction 07 is issued by **target** account (multisig)
    signers.push(this.target)

    // Transaction 07: MosaicMetadataTransaction attaching `NAME`
    transactions.push(MosaicMetadataTransaction.create(
      this.context.parameters.deadline,
      this.target.publicKey,
      KeyGenerator.generateUInt64Key('NAME'),
      mosaicId,
      fullName.length,
      fullName,
      this.context.network.networkType,
      undefined, // maxFee 0 for inner
    ))

    // Transaction 07 is issued by **target** account (multisig)
    signers.push(this.target)

    if (metadata.mic.length) {
      // Transaction 08: MosaicMetadataTransaction attaching `MIC` market identifier code
      transactions.push(MosaicMetadataTransaction.create(
        this.context.parameters.deadline,
        this.target.publicKey,
        KeyGenerator.generateUInt64Key('MIC'),
        mosaicId,
        metadata.mic.length,
        metadata.mic,
        this.context.network.networkType,
        undefined, // maxFee 0 for inner
      ))

      // Transaction 08 is issued by **target** account (multisig)
      signers.push(this.target)
    }

    if (metadata.isin.length) {
      // Transaction 09: MosaicMetadataTransaction attaching `ISIN` International Securities Identification Number
      transactions.push(MosaicMetadataTransaction.create(
        this.context.parameters.deadline,
        this.target.publicKey,
        KeyGenerator.generateUInt64Key('ISIN'),
        mosaicId,
        metadata.isin.length,
        metadata.isin,
        this.context.network.networkType,
        undefined, // maxFee 0 for inner
      ))

      // Transaction 09 is issued by **target** account (multisig)
      signers.push(this.target)
    }

    if (metadata.classification.length) {
      // Transaction 10: MosaicMetadataTransaction attaching `ISIN` International Securities Identification Number
      transactions.push(MosaicMetadataTransaction.create(
        this.context.parameters.deadline,
        this.target.publicKey,
        KeyGenerator.generateUInt64Key('ISO_10962'),
        mosaicId,
        metadata.classification.length,
        metadata.classification,
        this.context.network.networkType,
        undefined, // maxFee 0 for inner
      ))

      // Transaction 10 is issued by **target** account (multisig)
      signers.push(this.target)
    }

    const customKeys = Object.keys(metadata.customMetadata)
    if (customKeys.length) {
      for (let k = 0; k < customKeys.length; k++) {
        // Transaction 11: MosaicMetadataTransaction attaching custom metadata
        transactions.push(MosaicMetadataTransaction.create(
          this.context.parameters.deadline,
          this.target.publicKey,
          KeyGenerator.generateUInt64Key(customKeys[k]),
          mosaicId,
          metadata.customMetadata[customKeys[k]].length,
          metadata.customMetadata[customKeys[k]],
          this.context.network.networkType,
          undefined, // maxFee 0 for inner
        ))

        // Transaction 11 is issued by **target** account (multisig)
        signers.push(this.target)
      }
    }

    // Transaction 12: AccountMosaicRestrictionTransaction with MosaicId = mosaicId
    transactions.push(AccountMosaicRestrictionTransaction.create(
      this.context.parameters.deadline,
      AccountRestrictionFlags.AllowMosaic,
      [mosaicId, this.context.network.feeMosaicId], // MosaicId & networkCurrencyMosaicId
      [],
      this.context.network.networkType,
      undefined, // maxFee 0 for inner
    ))

    // Transaction 12 is issued by **target** account (multisig)
    signers.push(this.target)

    // Transaction 13: MosaicGlobalRestriction with mosaicId (refId 0)
    // :warning: This restricts the **mosaic** to accounts who have the 
    //           'User_Role' flag set to at least 2 ("Holder" | "Target").
    transactions.push(MosaicGlobalRestrictionTransaction.create(
      this.context.parameters.deadline,
      mosaicId,
      KeyGenerator.generateUInt64Key('User_Role'),
      UInt64.fromUint(0), // previousRestrictionValue
      MosaicRestrictionType.NONE, // previousRestrictionType
      UInt64.fromUint(2), // newRestrictionValue: 1 = Target ; 2 = Holder ; 3 = Guest ; 4 = Locked
      MosaicRestrictionType.LE, // newRestrictionType: `less or equal to`
      this.context.network.networkType,
      undefined, // referenceMosaicId: empty means "self"
      undefined, // maxFee 0 for inner
    ))

    // Transaction 13 is issued by **target** account (multisig)
    signers.push(this.target)

    // Transaction 14: MosaicAddressRestriction for target address
    transactions.push(MosaicAddressRestrictionTransaction.create(
      this.context.parameters.deadline,
      mosaicId,
      KeyGenerator.generateUInt64Key('User_Role'),
      this.target.address,
      UInt64.fromUint(1), // newRestrictionValue: 1 = Target
      this.context.network.networkType,
      undefined, // previousRestrictionValue
      undefined, // maxFee 0 for inner
    ))

    // Transaction 14 is issued by the target account
    signers.push(this.target)

    // return transactions issued by assigned signer
    return transactions.map(
      (transaction, i) => transaction.toAggregate(signers[i])
    )
  }
  // end-region abstract methods
}

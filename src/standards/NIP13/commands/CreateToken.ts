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
  Account,
  InnerTransaction,
  MosaicId,
  MosaicNonce,
  MosaicRestrictionType,
  PublicAccount,
  Transaction,
  NamespaceId,
} from 'symbol-sdk'

// internal dependencies
import { TransactionsHelpers, CommandOption, AllowanceResult } from '../../../../index'
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
 *   - Transaction 03: NamespaceRegistrationtTransaction
 *   - Transaction 04: MosaicDefinitionTransaction
 *   - Transaction 05: MosaicSupplyChangeTransaction
 *   - Transaction 06: MosaicAliasTransaction
 *   - Transaction 07: MosaicMetadataTransaction attaching `MIC` market identifier code
 *   - Transaction 08: MosaicMetadataTransaction attaching `ISIN` if non-empty option provided
 *   - Transaction 09: MosaicMetadataTransaction attaching `ISO_10962` if non-empty option provided
 *   - Transaction 10: AccountMosaicRestrictionTransaction with MosaicId = mosaicId to allow mosaic for TARGET account
 *   - Transaction 11: AccountMosaicRestrictionTransaction with MosaicId = feeMosaicId to allow paying fees for TARGET account
 *   - Transaction 12: MosaicGlobalRestriction with mosaicId (refId 0) (User_Role <= 2)
 *   - Transaction 13: MosaicAddressRestriction for target account (User_Role = Target)
 *
 * :note: `Transaction 03` represents the root namespace registration transaction. Any sub namespace registration
 * transaction will be automatically added to this list.
 *
 * :note: `Transaction 07` will only be added if a non-empty value is provided for the `source` command option.
 *
 * :note: `Transaction 08` will only be added if a non-empty value is provided for the `isin` command option.
 *
 * :note: `Transaction 09` will only be added if a non-empty value is provided for the `iso10962` command option.
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
      '', // ISO_10383
    ))

    // prepare output
    const transactions: InnerTransaction[] = []
    const signers: PublicAccount[] = []

    // Transaction 01: Add execution proof transaction
    transactions.push(TransactionsHelpers.createTransfer(
      this.context,
      this.target.address,
      undefined,
      undefined,
      this.descriptor,
    ))

    // Transaction 01 is issued by **target** account (multisig)
    signers.push(this.target)

    // Transaction 02: MultisigAccountModificationTransaction
    // :warning: minApproval is always n-1 to permit loss of up to 1 key.
    transactions.push(TransactionsHelpers.createMultisigAccountModification(
      this.context,
      operators.length - 1,
      operators
    ))

    // Transaction 02 is issued by **target** account (multisig)
    signers.push(this.target)

    // Transaction 03: NamespaceRegistrationtTransaction
    // :note: up to `maxNamespacesDepth` levels are allowed
    const parts = fullName.split('.')
    for (let i = 0, m = parts.length; i < m; i ++) {
      transactions.push(TransactionsHelpers.createNamespaceRegistration(
        this.context,
        2010240, // 1 year at 15 sec / block
        parts[i],
        i === 0 ? undefined : parts.slice(0, i - 1).join('.'),
      ))

      // Transaction 03 is issued by **target** account (multisig)
      signers.push(this.target)
    }

    // Transaction 04: MosaicDefinitionTransaction
    const mosaicNonce = MosaicNonce.createFromHex(identifier)
    const mosaicId = MosaicId.createFromNonce(mosaicNonce, target)
    transactions.push(TransactionsHelpers.createMosaicDefinition(
      this.context,
      mosaicNonce,
      mosaicId,
      2010240, // 1 year at 15 sec / block
    ))

    // Transaction 04 is issued by **target** account (multisig)
    signers.push(this.target)

    if (0 < supply) {
      // Transaction 05: MosaicSupplyChangeTransaction
      transactions.push(TransactionsHelpers.createMosaicSupplyChange(
        this.context,
        supply,
        mosaicId,
        // action=Increase
      ))

      // Transaction 05 is issued by **target** account (multisig)
      signers.push(this.target)
    }

    // Transaction 06: MosaicAliasTransaction
    transactions.push(TransactionsHelpers.createMosaicAlias(
      this.context,
      new NamespaceId(fullName),
      mosaicId,
    ))

    // Transaction 06 is issued by **target** account (multisig)
    signers.push(this.target)

    if (metadata.mic.length) {
      // Transaction 07: MosaicMetadataTransaction attaching `MIC` market identifier code
      transactions.push(TransactionsHelpers.createMosaicMetadata(
        this.context,
        mosaicId,
        this.target,
        'MIC',
        metadata.mic,
      ))

      // Transaction 07 is issued by **target** account (multisig)
      signers.push(this.target)
    }

    if (metadata.isin.length) {
      // Transaction 08: MosaicMetadataTransaction attaching `ISIN` International Securities Identification Number
      transactions.push(TransactionsHelpers.createMosaicMetadata(
        this.context,
        mosaicId,
        this.target,
        'ISIN',
        metadata.isin,
      ))

      // Transaction 08 is issued by **target** account (multisig)
      signers.push(this.target)
    }

    if (metadata.classification.length) {
      // Transaction 09: MosaicMetadataTransaction attaching `ISIN` International Securities Identification Number
      transactions.push(TransactionsHelpers.createMosaicMetadata(
        this.context,
        mosaicId,
        this.target,
        'ISO_10962',
        metadata.classification,
      ))

      // Transaction 09 is issued by **target** account (multisig)
      signers.push(this.target)
    }

    // Transaction 10: AccountMosaicRestrictionTransaction with MosaicId = mosaicId
    transactions.push(TransactionsHelpers.createAccountMosaicRestriction(
      this.context,
      [mosaicId],
      // flags=Allow_Mosaic
    ))

    // Transaction 10 is issued by **target** account (multisig)
    signers.push(this.target)

    // Transaction 11: AccountMosaicRestrictionTransaction with MosaicId = NETWORK_FEE_MOSAIC_ID
    transactions.push(TransactionsHelpers.createAccountMosaicRestriction(
      this.context,
      [this.context.network.feeMosaicId],
      // flags=Allow_Mosaic
    ))

    // Transaction 11 is issued by **target** account (multisig)
    signers.push(this.target)

    // Transaction 12: MosaicGlobalRestriction with mosaicId (refId 0)
    // :warning: This restricts the **mosaic** to accounts who have the 
    //           'User_Role' flag set to at least 2 ("Holder" | "Target").
    transactions.push(TransactionsHelpers.createMosaicGlobalRestriction(
      this.context,
      mosaicId,
      'User_Role',
      MosaicRestrictionType.LE, // `less or equal then`
      2, // 1 = Target ; 2 = Holder ; 3 = Guest ; 4 = Locked
    ))

    // Transaction 12 is issued by **target** account (multisig)
    signers.push(this.target)

    // Transaction 13: MosaicAddressRestriction for target address
    transactions.push(TransactionsHelpers.createMosaicAddressRestriction(
      this.context,
      mosaicId,
      'User_Role',
      this.target.address,
      1, // 1 = Target
    ))

    // Transaction 13 is issued by the target account
    signers.push(this.target)

    // return transactions issued by assigned signer
    return transactions.map(
      (transaction, i) => transaction.toAggregate(signers[i])
    )
  }
  // end-region abstract methods
}

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
} from 'symbol-sdk'

// internal dependencies
import { TransactionsHelpers, CommandOption, AllowanceResult } from '../../../../index'
import { AbstractCommand } from './AbstractCommand'

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
 *   - Transaction 06: AccountMosaicRestrictionTransaction with MosaicId = mosaicId to allow mosaic for TARGET account
 *   - Transaction 07: AccountMosaicRestrictionTransaction with MosaicId = feeMosaicId to allow paying fees for TARGET account
 *   - Transaction 08: MosaicGlobalRestriction with mosaicId (refId 0) (User_Role <= 2)
 *   - Transaction 09: MosaicAddressRestriction for target account (User_Role = Target)
 *
 * :note: `Transaction 03` represents the root namespace registration transaction. Any sub namespace registration
 * transaction will be automatically added to this list.
 */
export class CreateToken extends AbstractCommand {
  /**
   * @description List of **required** arguments for this token command.
   */
  public arguments: string[] = [
    'name',
    'source',
    'operators',
    'supply',
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
    const source = this.context.getInput('source', '')
    const supply = this.context.getInput('supply', 1)

    // prepare output
    const transactions: InnerTransaction[] = []
    const signers: PublicAccount[] = []

    // Transaction 01: Add execution proof transaction
    transactions.push(TransactionsHelpers.createTransfer(
      this.context,
      this.target.address,
      undefined,
      undefined,
      'NIP13(v' + this.context.revision + '):create:' + this.identifier.id
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

    // Transaction 05: MosaicSupplyChangeTransaction
    if (0 < supply) {
      transactions.push(TransactionsHelpers.createMosaicSupplyChange(
        this.context,
        supply,
        mosaicId,
        // action=Increase
      ))

      // Transaction 05 is issued by **target** account (multisig)
      signers.push(this.target)
    }

    // Transaction 06: AccountMosaicRestrictionTransaction with MosaicId = mosaicId
    transactions.push(TransactionsHelpers.createAccountMosaicRestriction(
      this.context,
      [mosaicId],
      // flags=Allow_Mosaic
    ))

    // Transaction 06 is issued by **target** account (multisig)
    signers.push(this.target)

    // Transaction 07: AccountMosaicRestrictionTransaction with MosaicId = NETWORK_FEE_MOSAIC_ID
    transactions.push(TransactionsHelpers.createAccountMosaicRestriction(
      this.context,
      [this.context.network.feeMosaicId],
      // flags=Allow_Mosaic
    ))

    // Transaction 07 is issued by **target** account (multisig)
    signers.push(this.target)

    // Transaction 08: MosaicGlobalRestriction with mosaicId (refId 0)
    // :warning: This restricts the **mosaic** to accounts who have the 
    //           'User_Role' flag set to at least 2 ("Holder" | "Target").
    transactions.push(TransactionsHelpers.createMosaicGlobalRestriction(
      this.context,
      mosaicId,
      'User_Role',
      MosaicRestrictionType.LE, // `less or equal then`
      2, // 1 = Target ; 2 = Holder ; 3 = Guest ; 4 = Locked
    ))

    // Transaction 08 is issued by **target** account (multisig)
    signers.push(this.target)

    // Transaction 09: MosaicAddressRestriction for target address
    transactions.push(TransactionsHelpers.createMosaicAddressRestriction(
      this.context,
      mosaicId,
      'User_Role',
      this.target.address,
      1, // 1 = Target
    ))

    // Transaction 09 is issued by the target account
    signers.push(this.target)

    // return transactions issued by assigned signer
    return transactions.map(
      (transaction, i) => transaction.toAggregate(signers[i])
    )
  }
  // end-region abstract methods
}

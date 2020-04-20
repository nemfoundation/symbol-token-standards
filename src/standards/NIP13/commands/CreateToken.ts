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
  AggregateTransaction,
  InnerTransaction,
  MosaicId,
  MosaicNonce,
  MosaicRestrictionType,
  PublicAccount,
  Transaction,
} from 'symbol-sdk'

// internal dependencies
import {
  AllowanceResult,
  BaseCommand,
  CommandOption,
  FailureMinimumRequiredOperators,
  TransactionsHelpers,
} from '../../../index'

/**
 * @class NIP13.CreateToken
 * @package NIP13 Token Commands
 * @since v0.1.0
 * @description Class that describes a token command for creating NIP13 compliant tokens.
 * @summary This token command prepares one aggregate bonded transaction with following inner transactions: 
 *   - Transaction 01: MultisigAccountModificationTransaction
 *   - Transaction 02: NamespaceRegistrationtTransaction
 *   - Transaction 03: MosaicDefinitionTransaction
 *   - Transaction 04: MosaicSupplyChangeTransaction
 *   - Transaction 05: AccountMosaicRestrictionTransaction with MosaicId = mosaicId
 *   - Transaction 06: MosaicGlobalRestriction with mosaicId (refId 0)
 *   - Transaction 07: MosaicAddressRestriction for operator address
 *
 * :note: `Transaction 02` represents the root namespace registration transaction. Any sub namespace registration
 * transaction will be automatically added to this list.
 *
 * :note: `Transaction 07` represents the first operator address restriction transaction, there will be one of these
 * for each of the token operators.
 */
export class CreateToken extends BaseCommand {
  /**
   * @description Getter for the command name.
   * @see {BaseCommand.name}
   **/
  public get name(): string {
    return 'CreateToken'
  }

  /**
   * Synchronize the command execution with the network. This method shall
   * be used to fetch data required for execution.
   *
   * @async
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
    const hasActor = actor && actor.address
    const hasArgv = undefined !== argv || true

    // allows everyone to create tokens
    return new AllowanceResult(hasActor && hasArgv)
  }

  /**
   * @description Method that executes the token command `CreateToken`.
   * @see {BaseCommand.execute}
   **/
  public execute(
    actor: PublicAccount,
    argv?: CommandOption[]
  ): TransactionURI {
    // verify authorization to execute
    super.assertExecutionAllowance(actor, argv)

    // validate mandatory inputs
    super.assertHasMandatoryArguments(argv, [
      'name',
      'source',
      'identifier',
      'operators',
    ])

    // enforce a minimum of 2 operators
    const operators = this.context.getInput('operators', [])
    if (!operators.length || operators.length < 2) {
      throw new FailureMinimumRequiredOperators('NIP13 requires a minimum of 2 operators')
    }

    // create the blockchain contract
    const contract = this.prepare()

    // return result
    return new TransactionURI(contract.serialize())
  }

  /**
   * @description Wrap the command's transactions inside an aggregate transaction.
   * @see {BaseCommand.wrap}
   * @return {AggregateTransaction[]} Aggregate bonded transaction
   **/
  protected prepare(): AggregateTransaction | Transaction {
    // create aggregate bonded
    return AggregateTransaction.createBonded(
      this.context.deadline,
      this.transactions,
      this.context.networkType,
      [],
      this.context.maxFee,
    )
  }

  /**
   * @description Build a command's transactions. Transactions returned here will
   *              be formatted to a transaction URI in the `execute()` step.
   * @see {BaseCommand.transactions}
   * @return {AggregateTransaction[]} Aggregate bonded transaction
   **/
  protected get transactions(): Transaction[] {

    const identifier = this.context.getInput('identifier', '')
    const owner = this.context.getInput('owner', this.context.actor)
    const supply = this.context.getInput('supply', 1)
    const fullName = this.context.getInput('name', 'UnknownToken')
    const operators = this.context.getInput('operators', [])

    // prepare output
    const transactions: InnerTransaction[] = []

    // Transaction 01: MultisigAccountModificationTransaction
    // :warning: minApproval is always n-1 to permit loss of up to 1 key.
    transactions.push(TransactionsHelpers.createMultisigAccountModification(
      this.context,
      operators.length - 1,
      operators
    ))

    // Transaction 02: NamespaceRegistrationtTransaction
    // :note: up to `maxNamespacesDepth` levels are allowed
    const parts = fullName.split('.')
    for (let i = 0, m = parts.length; i < m; i ++) {
      transactions.push(TransactionsHelpers.createNamespaceRegistration(
        this.context,
        2010240, // 1 year at 15 sec / block
        parts[i],
        i === 0 ? undefined : parts.slice(0, i - 1).join('.'),
      ))
    }

    // Transaction 03: MosaicDefinitionTransaction
    const mosaicNonce = MosaicNonce.createFromHex(identifier)
    const mosaicId = MosaicId.createFromNonce(mosaicNonce, owner)
    transactions.push(TransactionsHelpers.createMosaicDefinition(
      this.context,
      mosaicNonce,
      mosaicId,
      2010240, // 1 year at 15 sec / block
    ))

    // Transaction 04: MosaicSupplyChangeTransaction
    if (0 < supply) {
      transactions.push(TransactionsHelpers.createMosaicSupplyChange(
        this.context,
        supply,
        mosaicId,
        // action=Increase
      ))
    }

    // Transaction 05: AccountMosaicRestrictionTransaction with MosaicId = mosaicId
    transactions.push(TransactionsHelpers.createAccountMosaicRestriction(
      this.context,
      [mosaicId],
      // flags=Allow_Mosaic
    ))

    // Transaction 06: MosaicGlobalRestriction with mosaicId (refId 0)
    // :warning: This restricts the **mosaic** to accounts who have the 'Is_Operator' flag set.
    transactions.push(TransactionsHelpers.createMosaicGlobalRestriction(
      this.context,
      mosaicId,
      'Is_Operator',
      MosaicRestrictionType.EQ,
      1, // value
    ))

    // Transaction 07: MosaicAddressRestriction for operator address
    // :note: This affects the **operators** the 'Is_Operator' flag for said mosaic.
    for (let i = 0, m = operators.length; i < m; i ++) {
      const operator = operators[i] as PublicAccount
      transactions.push(TransactionsHelpers.createMosaicAddressRestriction(
        this.context,
        mosaicId,
        'Is_Operator',
        operator.address,
      ))
    }

    // return transactions issued by *target*
    return transactions.map(
      (transaction) => transaction.toAggregate(this.context.target)
    )
  }
}

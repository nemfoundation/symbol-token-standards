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
  Transaction,
  PublicAccount,
  TransferTransaction,
  PlainMessage,
  UInt64,
  MultisigAccountModificationTransaction,
  AccountMosaicRestrictionTransaction,
  AccountRestrictionFlags,
  MosaicAddressRestrictionTransaction,
  KeyGenerator,
  AccountMetadataTransaction,
} from 'symbol-sdk'

// internal dependencies
import { AbstractCommand } from './AbstractCommand'

/**
 * @class NIP13.CreatePartition
 * @package NIP13 Token Commands
 * @since v0.5.1
 * @description Class that describes a token command for creating token holder partitions for NIP13 compliant tokens.
 * @summary
 * This token command accepts the following arguments:
 *
 * | Argument | Description | Example |
 * | --- | --- | --- |
 * | name | Name of the token holder partition | `"NIP13 Example"` |
 * | partition | Token holder partition account | `new PublicAccount(...)` |
 * | holder | Actual token holder public account | `new PublicAccount(...)` |
 */
export class CreatePartition extends AbstractCommand {
  /**
   * @description List of **required** arguments for this token command.
   */
  public arguments: string[] = [
    'name',
    'partition',
    'holder',
  ]

  // region abstract methods
  /**
   * @description Getter for the command name.
   * @see {BaseCommand.name}
   **/
  public get name(): string {
    return 'CreatePartition'
  }

  /**
   * Getter for the command descriptor.
   *
   * @return {string}
   **/
  public get descriptor(): string {
    return 'NIP13(v' + this.context.revision + ')' + ':partition:' + this.identifier.id
  }

  /**
   * @description Builds the inner transactions necessary for the
   *              execution of a `CreatePartition` command.
   * @see {AbstractCommand.transactions}
   * @return {Transaction[]} Aggregate bonded transaction
   **/
  protected get transactions(): Transaction[] {
    // read external arguments
    const name = this.context.getInput('name', 'default')
    const partition = this.context.getInput('partition', new PublicAccount())
    const holder = this.context.getInput('holder', new PublicAccount())

    // find partition
    const the_partition = this.partitions.find(
      p => p.account.address.equals(partition.address)
    )

    if (undefined !== the_partition) {
      //XXX partition already exists
      return []
    }

    // prepare output
    const transactions: InnerTransaction[] = []
    const signers: PublicAccount[] = []

    // Transaction 01: MultisigAccountModificationTransaction
    // :warning: Token holder is made optional in both minApproval and minRemoval.
    transactions.push(MultisigAccountModificationTransaction.create(
      this.context.parameters.deadline,
      this.operators.length, // all operators for minApproval (holder is optional)
      this.operators.length, // all except one for minRemoval (holder is optional)
      this.operators // operators
          .concat([holder]), // + token holder
      [],
      this.context.network.networkType,
      undefined, // maxFee 0 for inner
    ))

    // Transaction 01 is issued by **partition** account
    signers.push(partition)

    // Transaction 02: AccountMetadataTransaction
    transactions.push(AccountMetadataTransaction.create(
      this.context.parameters.deadline,
      partition.publicKey,
      KeyGenerator.generateUInt64Key('NAME'),
      name.length,
      name,
      this.context.network.networkType,
      undefined, // maxFee 0 for inner
    ))

    // Transaction 02 is issued by **partition** account
    signers.push(partition)

    // Transaction 03: AccountMosaicRestrictionTransaction
    // :note: This transaction authorizes mosaicId and networkCurrencyMosaicId for partition
    transactions.push(AccountMosaicRestrictionTransaction.create(
      this.context.parameters.deadline,
      AccountRestrictionFlags.AllowMosaic,
      [this.identifier.toMosaicId(), this.context.network.feeMosaicId], // MosaicId & networkCurrencyMosaicId
      [],
      this.context.network.networkType,
      undefined, // maxFee 0 for inner
    ))

    // Transaction 03 is issued by **target** account (multisig)
    signers.push(partition)

    // Transaction 04: MosaicAddressRestriction for target address
    // :note: This transaction authorizes the partition account by adding a User_Role=2 (Holder)
    transactions.push(MosaicAddressRestrictionTransaction.create(
      this.context.parameters.deadline,
      this.identifier.toMosaicId(),
      KeyGenerator.generateUInt64Key('User_Role'),
      partition.address,
      UInt64.fromUint(2), // newRestrictionValue: 2 = Holder
      this.context.network.networkType,
      undefined, // previousRestrictionValue
      undefined, // maxFee 0 for inner
    ))

    // Transaction 04 is issued by the target account
    signers.push(this.target)

    // Transaction 05: Add execution proof transaction
    transactions.push(TransferTransaction.create(
      this.context.parameters.deadline,
      partition.address,
      [],
      PlainMessage.create(this.descriptor + ':' + name),
      this.context.network.networkType,
      undefined,
    ))

    // Transaction 1.05 is issued by **target** account
    signers.push(this.target)

    // return transactions issued by assigned signer
    return transactions.map(
      (transaction, i) => transaction.toAggregate(signers[i])
    )
  }
  // end-region abstract methods
}

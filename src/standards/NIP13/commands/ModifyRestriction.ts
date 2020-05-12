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
  UInt64,
  KeyGenerator,
  MosaicAddressRestrictionTransaction,
  TransferTransaction,
  PlainMessage,
  MosaicGlobalRestrictionTransaction,
  MosaicRestrictionType,
} from 'symbol-sdk'

// internal dependencies
import { AbstractCommand } from './AbstractCommand'

/**
 * @class NIP13.ModifyRestriction
 * @package NIP13 Token Commands
 * @since v0.5.0
 * @description Class that describes a token command for modifying restrictions of NIP13 compliant tokens.
 * @summary
 * This token command accepts the following arguments:
 *
 * | Argument | Description | Example |
 * | --- | --- | --- |
 * | `restrictee` | Target account or partition account ("target of the restriction") | `new PublicAccount(...)` |
 * | `field` | Name of the restriction | `new PublicAccount(...)` |
 * | `value` | Minimumv value required for said restriction | `1` |
 */
export class ModifyRestriction extends AbstractCommand {
  /**
   * @description List of **required** arguments for this token command.
   */
  public arguments: string[] = [
    'restrictee',
    'field',
    'value',
  ]

  // region abstract methods
  /**
   * @description Getter for the command name.
   * @see {BaseCommand.name}
   **/
  public get name(): string {
    return 'ModifyRestriction'
  }

  /**
   * Getter for the command descriptor.
   *
   * @return {string}
   **/
  public get descriptor(): string {
    return 'NIP13(v' + this.context.revision + ')' + ':restriction:' + this.identifier.id
  }

  /**
   * @description Builds the inner transactions necessary for the
   *              execution of a `ModifyRestriction` command.
   * @see {AbstractCommand.transactions}
   * @return {Transaction[]} Aggregate bonded transaction
   **/
  protected get transactions(): Transaction[] {
    // read external arguments
    const restrictee = this.context.getInput('restrictee', new PublicAccount())
    const field: string = this.context.getInput('field', '')
    const value: number = this.context.getInput('value', 0)

    // prepare output
    const transactions: InnerTransaction[] = []
    const signers: PublicAccount[] = []

    // Transaction 0.01: Execution proof transaction
    transactions.push(TransferTransaction.create(
      this.context.parameters.deadline,
      restrictee.address,
      [],
      PlainMessage.create(this.descriptor),
      this.context.network.networkType,
      undefined,
    ))

    // Transaction 0.01 is issued by **target** account
    signers.push(this.target)

    // 1) Modify **target** restrictions (MosaicGlobalRestriction)
    // :warning: Executing this command may render the affected
    //           token incompliant with NIP13 requirements.
    // :warning: Please, use this token command with care.
    if (restrictee.address.equals(this.target.address)) {

      const previousType: MosaicRestrictionType = field === 'User_Role'
        ? MosaicRestrictionType.LE
        : MosaicRestrictionType.NONE

      const previousValue: number = field === 'User_Role'
        ? 3 // 3 = default minimum value of "User_Role"
        : 0 // no previous value

      // Transaction 02: MosaicGlobalRestriction with mosaicId (refId 0)
      transactions.push(MosaicGlobalRestrictionTransaction.create(
        this.context.parameters.deadline,
        this.identifier.toMosaicId(),
        KeyGenerator.generateUInt64Key(field),
        UInt64.fromUint(previousValue), // previousRestrictionValue
        previousType, // previousRestrictionType
        UInt64.fromUint(value), // newRestrictionValue: 1 = Target ; 2 = Holder ; 3 = Locker ; 4 = Guest
        MosaicRestrictionType.LE, // newRestrictionType: `less or equal to`
        this.context.network.networkType,
        undefined, // referenceMosaicId: empty means "self"
        undefined, // maxFee 0 for inner
      ))

      // Transaction 02 is issued by **target** account (multisig)
      signers.push(this.target)
    }
    // 2) Modify **partition** restrictions (MosaicAddressRestriction)
    else {
      // find partition
      const the_partition = this.partitions.find(
        p => p.account.address.equals(restrictee.address)
      )

      // 'ModifyRestriction' is only possible for existing partitions
      if (undefined === the_partition) {
        // the partition doesn't exist
        return []
      }

      // Transaction 02: MosaicAddressRestriction for account address
      transactions.push(MosaicAddressRestrictionTransaction.create(
        this.context.parameters.deadline,
        this.identifier.toMosaicId(),
        KeyGenerator.generateUInt64Key(field),
        the_partition.account.address,
        UInt64.fromUint(value), // newRestrictionValue
        this.context.network.networkType,
        UInt64.fromUint(2), // previousRestrictionValue: 2 = Holder
        undefined, // maxFee 0 for inner
      ))

      // Transaction 02 is issued by the target account
      signers.push(this.target)
    }

    // return transactions issued by assigned signer
    return transactions.map(
      (transaction, i) => transaction.toAggregate(signers[i])
    )
  }
  // end-region abstract methods
}

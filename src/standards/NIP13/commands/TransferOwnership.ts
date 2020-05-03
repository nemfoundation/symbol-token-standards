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
  Address,
  Mosaic,
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
import { TokenPartition } from '../../../models/TokenPartition'

/**
 * @class NIP13.TransferOwnership
 * @package NIP13 Token Commands
 * @since v0.1.0
 * @description Class that describes a token command for publishing NIP13 compliant tokens.
 * @summary This token command prepares one aggregate bonded transaction with following inner transactions:
 *   - Transaction 01: TransferTransaction with NIP13 `TransferOwnership` command descriptor
 *   - Transaction 02: MultisigAccountModificationTransaction
 *   - Transaction 03: AccountMosaicRestrictionTransaction with MosaicId = mosaicId to allow mosaic for PARTITION account
 *   - Transaction 04: AccountMosaicRestrictionTransaction with MosaicId = feeMosaicId to allow fees for PARTITION account
 *   - Transaction 05: MosaicAddressRestriction for partition account (User_Role = Holder)
 *   - Transaction 06: TransferTransaction with NIP13 `TransferOwnership` command descriptor (initial partitioning)
 */
export class TransferOwnership extends AbstractCommand {
  /**
   * @description List of **required** arguments for this token command.
   */
  public arguments: string[] = [
    'partition',
    'recipient',
    'amount',
  ]

  // region abstract methods
  /**
   * @description Getter for the command name.
   * @see {BaseCommand.name}
   **/
  public get name(): string {
    return 'TransferOwnership'
  }

  /**
   * Getter for the command descriptor.
   *
   * @return {string}
   **/
  public get descriptor(): string {
    return 'NIP13(v' + this.context.revision + ')' + ':transfer:' + this.identifier.id
  }

  /**
   * @description Builds the inner transactions necessary for the
   *              execution of a `TransferOwnership` command.
   * @see {AbstractCommand.transactions}
   * @return {Transaction[]} Aggregate bonded transaction
   **/
  protected get transactions(): Transaction[] {

    // read external arguments
    const name = this.context.getInput('name', '')
    const sender = this.context.getInput('sender', new PublicAccount())
    const partition = this.context.getInput('partition', new PublicAccount())
    const recipient = this.context.getInput('recipient', new PublicAccount())
    const amount = this.context.getInput('amount', 0)

    // prepare output
    const transactions: InnerTransaction[] = []
    const signers: PublicAccount[] = []

    // 1) sending from **target** account,
    //    should create new partition multisig + transfer
    if (sender.address.equals(this.target.address)) {

      // Transaction 1.01: MultisigAccountModificationTransaction
      // :warning: Recipient is made optional in both minApproval and minRemoval.
      transactions.push(MultisigAccountModificationTransaction.create(
        this.context.parameters.deadline,
        this.operators.length, // all operators for minApproval (recipient is optional)
        this.operators.length, // all except one for minRemoval (recipient is optional)
        this.operators
            .map(op => op.account)
            .concat([recipient]),
        [],
        this.context.network.networkType,
        undefined, // maxFee 0 for inner
      ))

      // Transaction 1.01 is issued by **partition** account
      signers.push(partition)

      // Transaction 1.02: AccountMetadataTransaction
      transactions.push(AccountMetadataTransaction.create(
        this.context.parameters.deadline,
        partition.publicKey,
        KeyGenerator.generateUInt64Key('NAME'),
        name.length,
        name,
        this.context.network.networkType,
        undefined, // maxFee 0 for inner
      ))

      // Transaction 1.02 is issued by **partition** account
      signers.push(partition)

      // Transaction 1.03: AccountMosaicRestrictionTransaction
      // :note: This transaction authorizes mosaicId and networkCurrencyMosaicId for partition
      transactions.push(AccountMosaicRestrictionTransaction.create(
        this.context.parameters.deadline,
        AccountRestrictionFlags.AllowMosaic,
        [this.identifier.toMosaicId(), this.context.network.feeMosaicId], // MosaicId & networkCurrencyMosaicId
        [],
        this.context.network.networkType,
        undefined, // maxFee 0 for inner
      ))

      // Transaction 1.03 is issued by **target** account (multisig)
      signers.push(partition)

      // Transaction 1.04: MosaicAddressRestriction for target address
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

      // Transaction 1.04 is issued by the target account
      signers.push(this.target)

      // Transaction 1.05: Add ownership transfer transaction
      transactions.push(TransferTransaction.create(
        this.context.parameters.deadline,
        partition.address,
        [
          new Mosaic(
            this.identifier.toMosaicId(),
            UInt64.fromUint(amount),
          )
        ], // mosaics will be owned by partition account
        PlainMessage.create(this.descriptor + ':' + name),
        this.context.network.networkType,
        undefined,
      ))

      // Transaction 1.05 is issued by **sender** account
      signers.push(sender)
    }
    // 2) sending from **partition** account (not target account)
    //    should change ownership from **owner** to **recipient**
    else {

      const part = this.partitions.find(
        (p) => partition.address.equals(p.account.address)
      )

      if (part === undefined) {
        // Error: partition does not exist
        return []
      }

      // 2.1) In case the new recipient is another partition,
      //      the amount will be sent to the other partition.
      if (this.partitions.some(p => p.account.address.equals(recipient.address))) {
        // Transaction 2.1.01: Add ownership transfer transaction
        transactions.push(TransferTransaction.create(
          this.context.parameters.deadline,
          recipient.address,
          [
            new Mosaic(
              this.identifier.toMosaicId(),
              UInt64.fromUint(amount),
            )
          ],
          PlainMessage.create(this.descriptor + ':' + name),
          this.context.network.networkType,
          undefined,
        ))

        // Transaction 2.1.01 is issued by **partition** account
        signers.push(partition)
      }
      // 2.2) In case the new recipient is not a partition,
      //      the recipient will be made a cosignatory of
      //      the partition account and old owner removed.
      else {
        // Transaction 2.2.01: Add ownership transfer transaction
        transactions.push(TransferTransaction.create(
          this.context.parameters.deadline,
          partition.address,
          [], // no mosaics (already owned by partition account)
          PlainMessage.create(this.descriptor + ':' + name),
          this.context.network.networkType,
          undefined,
        ))

        // Transaction 2.2.01 is issued by **partition** account
        signers.push(partition)

        // Transaction 2.2.02: MultisigAccountModificationTransaction
        transactions.push(MultisigAccountModificationTransaction.create(
          this.context.parameters.deadline,
          0, // no change to minApproval
          0, // no change to minRemoval
          [recipient], // add recipient as new owner
          [sender], // remove old owner
          this.context.network.networkType,
          undefined, // maxFee 0 for inner
        ))

        // Transaction 2.2.02 is issued by **partition** account
        signers.push(partition)
      }
    }

    // return transactions issued by assigned signer
    return transactions.map(
      (transaction, i) => transaction.toAggregate(signers[i])
    )
  }
  // end-region abstract methods
}

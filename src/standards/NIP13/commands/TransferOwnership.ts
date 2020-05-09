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
  Mosaic,
  UInt64,
  MultisigAccountModificationTransaction,
  AccountMosaicRestrictionTransaction,
  AccountRestrictionFlags,
  MosaicAddressRestrictionTransaction,
  KeyGenerator,
  AccountMetadataTransaction,
  EmptyMessage,
} from 'symbol-sdk'

// internal dependencies
import { AbstractCommand } from './AbstractCommand'

/**
 * @class NIP13.TransferOwnership
 * @package NIP13 Token Commands
 * @since v0.1.0
 * @description Class that describes a token command for transferring NIP13 compliant tokens.
 * @summary This token command prepares one aggregate bonded transaction with following inner transactions:
 *
 * 1) sending from **target** account, should create new partition multisig + transfer
 *   - Transaction 1.01: MultisigAccountModificationTransaction
 *   - Transaction 1.02: AccountMetadataTransaction attaching `NAME`
 *   - Transaction 1.03: AccountMosaicRestrictionTransaction for mosaicId & fee
 *   - Transaction 1.04: MosaicAddressRestriction with `User_Role = Holder` for partition
 *   - Transaction 1.05: Add ownership transfer transaction
 *
 * 2) sending from **partition** account (not target account), should change ownership
 *    from **owner** to **recipient**
 *
 *   2.1) In case the new recipient is another partition, the amount must be sent back to
 *        the target account, then send to the new partition account.
 *   - Transaction 2.1.01: First send back the amount to the target account
 *   - Transaction 2.1.02: Add ownership transfer transaction
 *
 *   2.2) In case the new recipient is not a partition, a new partition will be created and
 *        the amount will be transferred to it.
 *   - Transaction 2.2.01: MultisigAccountModificationTransaction
 *   - Transaction 2.2.02: AccountMetadataTransaction attaching `NAME`
 *   - Transaction 2.2.03: AccountMosaicRestrictionTransaction for mosaicId & fee
 *   - Transaction 2.2.04: MosaicAddressRestriction with `User_Role = Holder` for partition
 *   - Transaction 2.2.05: First send back the amount to the target account
 *   - Transaction 2.2.06: Add ownership transfer transaction
 */
export class TransferOwnership extends AbstractCommand {
  /**
   * @description List of **required** arguments for this token command.
   */
  public arguments: string[] = [
    'name',
    'sender',
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

    // find partition
    const the_partition = this.partitions.find(
      p => p.account.address.equals(partition.address)
    )

    // prepare output
    const transactions: InnerTransaction[] = []
    const signers: PublicAccount[] = []

    // 1) sending from **target** account,
    //    should create new partition multisig + transfer
    if (sender.address.equals(this.target.address)) {

      // In case of non-existing partition, set new name
      // In case of existing partition, use partition name
      let partitionName: string = undefined !== the_partition ? the_partition.name : name

      // Transaction 1.01: MultisigAccountModificationTransaction
      // Transaction 1.02: AccountMetadataTransaction attaching `NAME`
      // Transaction 1.03: AccountMosaicRestrictionTransaction for mosaicId & fee
      // Transaction 1.04: MosaicAddressRestriction with `User_Role = Holder` for partition
      if (undefined === the_partition) {
        const payload = this.createPartition(partition, recipient, name)
        payload.transactions.map((t, i) => {
          transactions.push(t)
          signers.push(payload.signers[i])
        })
      }

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
        PlainMessage.create(this.descriptor + ':' + partitionName),
        this.context.network.networkType,
        undefined,
      ))

      // Transaction 1.05 is issued by **sender** account
      signers.push(sender)
    }
    // 2) sending from **partition** account (not target account)
    //    should change ownership from **owner** to **recipient**
    else {

      // find sender partition
      const part = this.partitions.find(
        (p) => p.account.address.equals(sender.address)
      )

      if (part === undefined) {
        // Error: partition does not exist
        return []
      }

      // 2.1) In case the new recipient is another partition,
      //      the amount must be sent back to the target account,
      //      then send to the new partition account.
      if (undefined !== the_partition) {

        // Transaction 2.1.01: First send back the amount to the target account
        transactions.push(TransferTransaction.create(
          this.context.parameters.deadline,
          this.target.address, // back to target account (non-transferrable)
          [
            new Mosaic(
              this.identifier.toMosaicId(),
              UInt64.fromUint(amount),
            )
          ],
          EmptyMessage, // This transaction does not need a marker
          this.context.network.networkType,
          undefined,
        ))

        // Transaction 2.1.01 is issued by **sender** account
        signers.push(sender)

        // Transaction 2.1.02: Add ownership transfer transaction
        transactions.push(TransferTransaction.create(
          this.context.parameters.deadline,
          the_partition.account.address, // new recipient is the recipient partition account
          [
            new Mosaic(
              this.identifier.toMosaicId(),
              UInt64.fromUint(amount),
            )
          ],
          PlainMessage.create(this.descriptor + ':' + the_partition.name), // use recipient partition name
          this.context.network.networkType,
          undefined,
        ))

        // Transaction 2.1.02 is issued by **target** account
        signers.push(this.target)
      }
      // 2.2) In case the new recipient is not a partition,
      //      a new partition will be created and the amount
      //      will be transferred to it.
      else {

        // Transaction 2.2.01: MultisigAccountModificationTransaction
        // Transaction 2.2.02: AccountMetadataTransaction attaching `NAME`
        // Transaction 2.2.03: AccountMosaicRestrictionTransaction for mosaicId & fee
        // Transaction 2.2.04: MosaicAddressRestriction with `User_Role = Holder` for partition
        const payload = this.createPartition(partition, recipient, name)
        payload.transactions.map((t, i) => {
          transactions.push(t)
          signers.push(payload.signers[i])
        })

        // Transaction 2.2.05: First send back the amount to the target account
        transactions.push(TransferTransaction.create(
          this.context.parameters.deadline,
          this.target.address, // back to target account (non-transferrable)
          [
            new Mosaic(
              this.identifier.toMosaicId(),
              UInt64.fromUint(amount),
            )
          ],
          EmptyMessage, // This transaction does not need a marker
          this.context.network.networkType,
          undefined,
        ))

        // Transaction 2.2.05 is issued by **sender** account
        signers.push(sender)

        // Transaction 2.2.06: Add ownership transfer transaction
        transactions.push(TransferTransaction.create(
          this.context.parameters.deadline,
          partition.address, // mosaics will be owned by new partition account
          [
            new Mosaic(
              this.identifier.toMosaicId(),
              UInt64.fromUint(amount),
            )
          ],
          PlainMessage.create(this.descriptor + ':' + name), // use recipient partition name
          this.context.network.networkType,
          undefined,
        ))

        // Transaction 2.2.06 is issued by **sender** account
        signers.push(this.target)
      }
    }

    // return transactions issued by assigned signer
    return transactions.map(
      (transaction, i) => transaction.toAggregate(signers[i])
    )
  }
  // end-region abstract methods

  /**
   * Helper method for creating partitions on Symbol networks.
   *
   * @param {PublicAccount} partition 
   * @param {PublicAccount} recipient 
   * @param {string}        name 
   */
  protected createPartition(
    partition: PublicAccount,
    recipient: PublicAccount,
    name: string,
  ): { transactions: InnerTransaction[], signers: PublicAccount[] } {
    // prepare output
    const transactions: InnerTransaction[] = []
    const signers: PublicAccount[] = []

    // Transaction 1.01: MultisigAccountModificationTransaction
    // :warning: Recipient is made optional in both minApproval and minRemoval.
    transactions.push(MultisigAccountModificationTransaction.create(
      this.context.parameters.deadline,
      this.operators.length, // all operators for minApproval (recipient is optional)
      this.operators.length, // all except one for minRemoval (recipient is optional)
      this.operators // operators
          .concat([recipient]), // + recipient
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

    return {
      transactions,
      signers,
    }
  }
}

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
  KeyGenerator,
  MosaicMetadataTransaction,
  TransferTransaction,
  PlainMessage,
} from 'symbol-sdk'

// internal dependencies
import { AbstractCommand } from './AbstractCommand'
import { SecuritiesMetadata } from '../models/SecuritiesMetadata'

/**
 * @class NIP13.ModifyMetadata
 * @package NIP13 Token Commands
 * @since v0.5.0
 * @description Class that describes a token command for modifying metadata of NIP13 compliant tokens.
 * @summary
 * This token command accepts the following arguments:
 *
 * | Argument | Description | Example |
 * | --- | --- | --- |
 * | `metadata` | Metadata associated at token level | `{'MIC': 'XNAS', ...}` |
 */
export class ModifyMetadata extends AbstractCommand {
  /**
   * @description List of **required** arguments for this token command.
   */
  public arguments: string[] = [
    'metadata',
  ]

  // region abstract methods
  /**
   * @description Getter for the command name.
   * @see {BaseCommand.name}
   **/
  public get name(): string {
    return 'ModifyMetadata'
  }

  /**
   * Getter for the command descriptor.
   *
   * @return {string}
   **/
  public get descriptor(): string {
    return 'NIP13(v' + this.context.revision + ')' + ':metadata:' + this.identifier.id
  }

  /**
   * @description Builds the inner transactions necessary for the
   *              execution of a `ModifyMetadata` command.
   * @see {AbstractCommand.transactions}
   * @return {Transaction[]} Aggregate bonded transaction
   **/
  protected get transactions(): Transaction[] {
    // read external arguments
    const metadata = this.context.getInput('metadata', new SecuritiesMetadata('', '', '', '', '', '', {}))

    // prepare output
    const transactions: InnerTransaction[] = []
    const signers: PublicAccount[] = []

    // Transaction 01: Execution proof transaction
    transactions.push(TransferTransaction.create(
      this.context.parameters.deadline,
      this.target.address,
      [],
      PlainMessage.create(this.descriptor),
      this.context.network.networkType,
      undefined,
    ))

    // Transaction 01 is issued by **target** account
    signers.push(this.target)

    if (metadata.mic.length) {
      // Transaction 02: MosaicMetadataTransaction updating `MIC`
      transactions.push(MosaicMetadataTransaction.create(
        this.context.parameters.deadline,
        this.target.publicKey,
        KeyGenerator.generateUInt64Key('MIC'),
        this.identifier.toMosaicId(),
        metadata.mic.length - this.metadata!.mic.length,
        metadata.mic,
        this.context.network.networkType,
        undefined, // maxFee 0 for inner
      ))

      // Transaction 02 is issued by **target** account (multisig)
      signers.push(this.target)
    }

    if (metadata.isin.length) {
      // Transaction 03: MosaicMetadataTransaction updating `ISIN`
      transactions.push(MosaicMetadataTransaction.create(
        this.context.parameters.deadline,
        this.target.publicKey,
        KeyGenerator.generateUInt64Key('ISIN'),
        this.identifier.toMosaicId(),
        metadata.isin.length - this.metadata!.isin.length,
        metadata.isin,
        this.context.network.networkType,
        undefined, // maxFee 0 for inner
      ))

      // Transaction 03 is issued by **target** account (multisig)
      signers.push(this.target)
    }

    if (metadata.classification.length) {
      // Transaction 04: MosaicMetadataTransaction updating `ISO_10962`
      transactions.push(MosaicMetadataTransaction.create(
        this.context.parameters.deadline,
        this.target.publicKey,
        KeyGenerator.generateUInt64Key('ISO_10962'),
        this.identifier.toMosaicId(),
        metadata.classification.length - this.metadata!.classification.length,
        metadata.classification,
        this.context.network.networkType,
        undefined, // maxFee 0 for inner
      ))

      // Transaction 04 is issued by **target** account (multisig)
      signers.push(this.target)
    }

    if (metadata.website.length) {
      // Transaction 05: MosaicMetadataTransaction attaching `Website`
      transactions.push(MosaicMetadataTransaction.create(
        this.context.parameters.deadline,
        this.target.publicKey,
        KeyGenerator.generateUInt64Key('Website'),
        this.identifier.toMosaicId(),
        metadata.website.length - this.metadata!.website.length,
        metadata.website,
        this.context.network.networkType,
        undefined, // maxFee 0 for inner
      ))

      // Transaction 05 is issued by **target** account (multisig)
      signers.push(this.target)
    }

    if (metadata.sector.length) {
      // Transaction 06: MosaicMetadataTransaction attaching `Sector`
      transactions.push(MosaicMetadataTransaction.create(
        this.context.parameters.deadline,
        this.target.publicKey,
        KeyGenerator.generateUInt64Key('Sector'),
        this.identifier.toMosaicId(),
        metadata.sector.length - this.metadata!.sector.length,
        metadata.sector,
        this.context.network.networkType,
        undefined, // maxFee 0 for inner
      ))

      // Transaction 06 is issued by **target** account (multisig)
      signers.push(this.target)
    }

    if (metadata.industry.length) {
      // Transaction 07: MosaicMetadataTransaction attaching `Industry`
      transactions.push(MosaicMetadataTransaction.create(
        this.context.parameters.deadline,
        this.target.publicKey,
        KeyGenerator.generateUInt64Key('Industry'),
        this.identifier.toMosaicId(),
        metadata.industry.length - this.metadata!.industry.length,
        metadata.industry,
        this.context.network.networkType,
        undefined, // maxFee 0 for inner
      ))

      // Transaction 07 is issued by **target** account (multisig)
      signers.push(this.target)
    }

    const customKeys = Object.keys(metadata.customMetadata)
    if (customKeys.length) {
      for (let k = 0; k < customKeys.length; k++) {
        // Transaction 08: MosaicMetadataTransaction updating custom metadata
        const oldValue = customKeys[k] in metadata.customMetadata
          ? metadata.customMetadata[customKeys[k]]
          : ''

        transactions.push(MosaicMetadataTransaction.create(
          this.context.parameters.deadline,
          this.target.publicKey,
          KeyGenerator.generateUInt64Key(customKeys[k]),
          this.identifier.toMosaicId(),
          metadata.customMetadata[customKeys[k]].length - oldValue.length,
          metadata.customMetadata[customKeys[k]],
          this.context.network.networkType,
          undefined, // maxFee 0 for inner
        ))

        // Transaction 08 is issued by **target** account (multisig)
        signers.push(this.target)
      }
    }

    // return transactions issued by assigned signer
    return transactions.map(
      (transaction, i) => transaction.toAggregate(signers[i])
    )
  }
  // end-region abstract methods
}

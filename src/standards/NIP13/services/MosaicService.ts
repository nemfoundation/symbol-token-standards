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
  PublicAccount,
  Address,
  QueryParams,
  Metadata,
  MetadataType,
  MosaicId,
  TransferTransaction,
} from 'symbol-sdk'

// internal dependencies
import {
  Service,
} from '../../../../index'
import { TransactionService } from './TransactionService'

/**
 * @class MosaicService
 * @package services
 * @since v0.1.0
 * @description Class that describes a service around token metadata features.
 */
export class MosaicService extends Service {
  /**
   * Read published security tokens. Security tokens MUST publish
   * a creation proof transaction on the authority account.
   *
   * @param {PublicAccount}       authority
   * @return {SecuritiesMetadata}
   */
  public async getMosaicsFromNetwork(
    authority: PublicAccount,
    descriptor: string = '',
  ): Promise<MosaicId[]> {
    // initialize APIs
    const service = new TransactionService(
      this.context.network.factoryHttp.createAccountRepository(),
      this.context.network.factoryHttp.createChainRepository(),
      this.context.network.factoryHttp.createTransactionRepository(),
      this.context.network.factoryHttp.createReceiptRepository(),
      100, // pageSize
    )

    // Step 1) read transfers to find partition accounts
    const transactions: TransferTransaction[] = await service.getTransfers(
      authority.address,
      undefined,
      0, // no more than 1 block confirmation required
    ).toPromise()

    // filter partition transfer transactions
    const markedTransfers: TransferTransaction[] = transactions.filter(
      tx => tx.message.payload.startsWith(descriptor)
    )

    // read recipients to find partition accounts
    const mosaicIds: MosaicId[] = markedTransfers.map(t => t.message).map(
      message => {
        // identifier:mosaicId:name
        const mosaicId = message.payload.substr(descriptor.length).split(':')[1]
        return new MosaicId(mosaicId)
      })

    return mosaicIds
  }
}

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
  MultisigAccountInfo,
  PublicAccount,
  AccountInfo,
  TransferTransaction,
  Address,
} from 'symbol-sdk'

// internal dependencies
import {
  Service,
  TokenPartition,
  TokenIdentifier,
} from '../../../../index'
import { TransactionService } from './TransactionService'
import { MultisigService } from './MultisigService'

/**
 * @class PartitionService
 * @package services
 * @since v0.1.0
 * @description Class that describes a service around token partition features.
 */
export class PartitionService extends Service {
  /**
   * Read token partitions from token operators
   * network information.
   *
   * @param {TokenIdentifier}       tokenId     The token identifier.
   * @param {PublicAccount}         target      The deterministic account that represents the token.
   * @param {PublicAccount[]}       operators   The list of operators of said token.
   * @param {string}                descriptor  The token command descriptor used as a marker.
   * @return {TokenPartition[]}
   */
  public async getPartitionsFromNetwork(
    tokenId: TokenIdentifier,
    target: PublicAccount,
    operators: PublicAccount[],
    descriptor: string = '',
  ): Promise<TokenPartition[]> {
    // initialize APIs
    const accountHttp = this.context.network.factoryHttp.createAccountRepository()
    const multisigHttp = this.context.network.factoryHttp.createMultisigRepository()
    const multisig = new MultisigService(this.context)
    const service = new TransactionService(
      accountHttp,
      this.context.network.factoryHttp.createChainRepository(),
      this.context.network.factoryHttp.createTransactionRepository(),
      this.context.network.factoryHttp.createReceiptRepository(),
      100
    )

    // prepare output
    const partitions: TokenPartition[] = []

    // Step 1) read transfers to find partition accounts
    const transactions: TransferTransaction[] = await service.getWithdrawals(
      target.address,
      tokenId.toMosaicId(),
      0, // no more than 1 block confirmation required
    ).toPromise()

    // filter partition transfer transactions
    const markedTransfers: TransferTransaction[] = transactions.filter(
      tx => tx.message.payload.startsWith(descriptor)
    )

    // read recipients to find partition accounts
    const addresses: Address[] = markedTransfers.map(t => t.recipientAddress as Address).filter(
      addr => !addr.equals(target.address)
    )

    // Step 2) read partition accounts information from network
    const infos = await accountHttp.getAccountsInfo(addresses).toPromise()

    // Step 3) iterate partition accounts
    for (let i = 0, m = infos.length; i < m; i ++) {
      const accountInfo: AccountInfo = infos[i]

      // Step 3.1) get partition account multisig graph
      const graph = await multisigHttp.getMultisigAccountGraphInfo(accountInfo.address).toPromise()
      const owner: PublicAccount = multisig.getMultisigAccountInfoFromGraph(graph).map(
        (cosig: MultisigAccountInfo) => cosig.cosignatories
      ).reduce((prev, it) => {
        // filter out operators
        const ops = operators.map(o => o.address.plain())
        return prev.concat(it.filter(c => !ops.includes(c.address.plain())))
      })[0] // force one

      // Step 3.2) fetch partition account incoming transaction
      const lastMarker = markedTransfers.filter(
        tx => (tx.recipientAddress as Address).equals(accountInfo.address)
      ).shift()

      if (lastMarker === undefined) {
        // invalid partition configuration
        continue
      }

      // Step 3.3) read payload to identify partition label
      const payload = lastMarker.message.payload
      const label = payload.substr(descriptor.length) // take everything to the right of the descriptor

      // amount is either of 0 or partition amount
      let partitionAmount = 0
      if (accountInfo.mosaics.length) {
        // Step 3.4) read partition amount
        const tokenEntry = accountInfo.mosaics.filter(
          mosaic => mosaic.id.equals(tokenId.toMosaicId())
        ).shift()

        if (tokenEntry !== undefined) {
          partitionAmount = tokenEntry.amount.compact()
        }
      }

      // Step 3.5) register partition
      partitions.push(new TokenPartition(
        label,
        owner,
        accountInfo.publicAccount,
        partitionAmount,
      ))
    }

    return partitions
  }
}

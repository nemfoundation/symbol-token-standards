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
  MultisigAccountGraphInfo,
  MultisigAccountInfo,
  PublicAccount,
  RepositoryFactoryHttp,
  AccountInfo,
  Transaction,
  TransactionType,
  TransferTransaction,
  Convert,
} from 'symbol-sdk'

// internal dependencies
import {
  Service,
  TokenPartition,
  TokenIdentifier,
} from '../../../index'

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
   * @param {PublicAccount}         target      The deterministic account that represents the token.
   * @param {MultisigAccountInfo[]} operators   The list of operators of said token.
   * @return {MultisigAccountInfo[]}
   */
  public async getPartitionsFromNetwork(
    factory: RepositoryFactoryHttp,
    tokenId: TokenIdentifier,
    operators: MultisigAccountInfo[],
    descriptor: string = '',
  ): Promise<TokenPartition[]> {
    const partitions: TokenPartition[] = []
    const accounts: PublicAccount[] = []

    // reduce partition accounts
    operators.map(
      (operator: MultisigAccountInfo) => operator.multisigAccounts
    ).reduce((prev, it) => accounts.concat(it))

    // read from network
    const accountHttp = factory.createAccountRepository()
    const infos = await accountHttp.getAccountsInfo(accounts.map(pub => pub.address)).toPromise()

    // iterate partition accounts
    for (let i = 0, m = infos.length; i < m; i ++) {
      // fetch partition owner incoming transaction
      // XXX sequential fetcher / pagination
      const accountInfo: AccountInfo = infos[i]
      const transactions: Transaction[] = await accountHttp.getAccountIncomingTransactions(accountInfo.address).toPromise()

      // filter partition label transaction
      const nameTransaction = transactions.filter(
        tx => tx.type === TransactionType.TRANSFER
      ).map(
        _ => _ as TransferTransaction
      ).filter(
        tx => tx.message.payload.startsWith(Convert.utf8ToHex(descriptor))
      ).shift()

      // label is either of index or partition label
      let partitionLabel = i.toString()
      if (nameTransaction !== undefined) {
        // read payload to identify partition label
        const payload = nameTransaction.message.payload
        partitionLabel = payload.substr(descriptor.length) // take everything to the right of the descriptor
      }

      // amount is either of 0 or partition amount
      let partitionAmount = 0
      if (nameTransaction !== undefined && nameTransaction.mosaics.length) {
        // read partition amount
        const tokenEntry = nameTransaction.mosaics.filter(
          mosaic => mosaic.id.equals(tokenId.toMosaicId())
        ).shift()

        if (tokenEntry !== undefined) {
          partitionAmount = tokenEntry.amount.compact()
        }
      }

      // register partition
      partitions.push(new TokenPartition(
        partitionLabel,
        accountInfo.publicAccount,
        partitionAmount
      ))
    }

    return partitions
  }
}

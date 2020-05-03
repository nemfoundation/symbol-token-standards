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
   * @param {PublicAccount}         target      The deterministic account that represents the token.
   * @param {MultisigAccountInfo[]} operators   The list of operators of said token.
   * @return {MultisigAccountInfo[]}
   */
  public async getPartitionsFromNetwork(
    factory: RepositoryFactoryHttp,
    tokenId: TokenIdentifier,
    target: PublicAccount,
    operators: MultisigAccountInfo[],
    descriptor: string = '',
  ): Promise<TokenPartition[]> {
    // prepare output
    const partitions: TokenPartition[] = []
    const accounts: PublicAccount[] = []

    // Step 1) reduce operators to read partition accounts
    operators.map(
      (operator: MultisigAccountInfo) => operator.multisigAccounts
    ).reduce((prev, it) => {
      // filter out target
      return accounts.concat(it.filter(
        p => !p.address.equals(target.address)
      ))
    })

    // Step 2) read accounts from network
    const accountHttp = factory.createAccountRepository()
    const multisigHttp = factory.createMultisigRepository()
    const infos = await accountHttp.getAccountsInfo(
      accounts.map(pub => pub.address)
    ).toPromise()

    // initialize transactions service
    const multisig = new MultisigService(this.context)
    const service = new TransactionService(
      accountHttp,
      factory.createChainRepository(),
      factory.createTransactionRepository(),
      factory.createReceiptRepository(),
      100
    )

    // Step 3) iterate partition accounts
    for (let i = 0, m = infos.length; i < m; i ++) {
      const accountInfo: AccountInfo = infos[i]

      // Step 3.1) get partition account multisig graph
      const graph = await multisigHttp.getMultisigAccountGraphInfo(accountInfo.address).toPromise()
      const owner: PublicAccount = multisig.getMultisigAccountInfoFromGraph(graph).map(
        (cosig: MultisigAccountInfo) => cosig.multisigAccounts
      ).reduce((prev, it) => {
        // filter out operators
        const ops = operators.map(o => o.account.address.plain())
        return prev.concat(it.filter(
          c => !ops.includes(c.address.plain())
        ))
      })[0] // force one

      // Step 3.2) fetch partition account incoming transaction
      const transactions: TransferTransaction[] = await service.getTransfers(
        accountInfo.address,
        tokenId.toMosaicId(),
        10,
      ).toPromise()

      // filter partition label transaction (take latest)
      const lastMarker = transactions.filter(
        tx => tx.message.payload.startsWith(Convert.utf8ToHex(descriptor))
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

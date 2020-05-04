/*
 * Copyright 2019-present NEM Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {EMPTY, Observable} from 'rxjs'
import {concatMap, expand, map, mergeMap, toArray} from 'rxjs/operators'
import {
  AccountRepository,
  Address,
  AggregateTransaction,
  AggregateTransactionInfo,
  ChainRepository,
  MosaicId,
  Order,
  PlainMessage,
  QueryParams,
  ReceiptRepository,
  Transaction,
  TransactionFilter,
  TransactionInfo,
  TransactionRepository,
  TransactionService as LibTransactionService,
  TransactionType,
  TransferTransaction,
  UInt64,
} from 'symbol-sdk'

export class TransactionService {

  private readonly transactionService: LibTransactionService;

  constructor(private readonly accountRepository: AccountRepository,
              private readonly chainRepository: ChainRepository,
              private readonly transactionHttp: TransactionRepository,
              private readonly receiptHttp: ReceiptRepository,
              private pageSize: number) {
    this.transactionService = new LibTransactionService(transactionHttp, receiptHttp)
  }

  /* start block flattenAggregateTransactions */
  /**
   * Processes the list of transactions. In case there is an aggregate transaction,
   * removes the envelop returning separately each inner transaction.
   *
   * @param transactions List of transactions.
   * @returns Transaction[]
   */
  public static flattenAggregateTransactions(transactions: Transaction[])
    : Transaction[] {
    const txes: TransferTransaction[] = []
    return txes.concat(transactions.map((transaction: Transaction) => {
      let flattenTransactions;
      if (transaction instanceof AggregateTransaction) {
        flattenTransactions = transaction.innerTransactions;
      } else {
        flattenTransactions = [transaction];
      }
      return TransactionService.filterTransferTransactions(flattenTransactions);
    }).reduce((prev, it: TransferTransaction[]) => prev.concat(it)))
  }
  /* end block flattenAggregateTransactions */

  /* start block filterTransferTransactions */
  /**
   * Given an array of transactions, returns the ones with type TRANSFER.
   *
   * @param transactions List of transactions.
   * @returns TransferTransaction[]
   */
  public static filterTransferTransactions(transactions: Transaction[])
    : TransferTransaction[] {
    return transactions
      .filter((transaction) => (transaction.type === TransactionType.TRANSFER))
      .map((transaction) => (transaction as TransferTransaction))
  }
  /* end block filterTransferTransactions */

  /* start block getTransactionHash */
  /**
   * Gets the transaction hash.
   * If it is an aggregate transaction, returns an aggregate transaction hash.
   *
   * @param transaction Transaction.
   * @returns string | undefined
   */
  public static getTransactionHash(transaction: Transaction)
    : string | undefined {
    const transactionInfo = transaction.transactionInfo;
    let hash;
    if (transactionInfo instanceof AggregateTransactionInfo) {
      hash = transactionInfo.aggregateHash;
    } else if (transactionInfo instanceof TransactionInfo) {
      hash = transactionInfo.hash;
    }
    return hash
  }
  /* end block getTransactionHash */

  /* start block filterElligibleDeposits */
  /**
   * Given an array of transactions, returns the ones that are eligible to be deposits.
   * A transaction is an eligible deposit when:
   * - It has type TRANSFER.
   * - The recipient address is the exchange address.
   * - Contains tokenId's units.
   * - Does not contain mosaics different to tokenId.
   * - The message field is not empty.
   *
   * @param transactions Array of transactions that could be eligible deposits.
   * @param exchangeAddress Exchange central account address.
   * @param tokenId Mosaic identifier to filter.
   * @returns TransferTransaction[]
   */
  public static filterElligibleDeposits(transactions: Transaction[], exchangeAddress: Address, tokenId: MosaicId)
    : TransferTransaction[] {
    return TransactionService.filterTransferTransactions(transactions)
      .filter((transaction) => (
        transaction.recipientAddress instanceof Address
        && transaction.recipientAddress.equals(exchangeAddress)
      ))
      .filter((transaction) => (
        transaction.mosaics.length === 1
        && transaction.mosaics[0].id instanceof MosaicId
        && transaction.mosaics[0].id.equals(tokenId)
      ))
      .filter((transaction) => (
        transaction.message instanceof PlainMessage
        && transaction.message.payload.length !== 0),
      )
  }
  /* end block filterElligibleDeposits */

  /* start block filterElligibleWithdrawals */
  /**
   * Given an array of transactions, returns the ones that are eligible to be deposits.
   * A transaction is an eligible deposit when:
   * - It has type TRANSFER.
   * - The signer public key is the exchange address.
   * - Contains tokenId's units.
   * - Does not contain mosaics different to tokenId.
   * - The message field is not empty.
   *
   * @param transactions Array of transactions that could be eligible deposits.
   * @param exchangeAddress Exchange central account address.
   * @param tokenId Mosaic identifier to filter.
   * @returns TransferTransaction[]
   */
  public static filterElligibleWithdrawals(transactions: Transaction[], exchangeAddress: Address, tokenId: MosaicId)
  : TransferTransaction[] {
    return TransactionService.filterTransferTransactions(transactions)
      .filter((transaction) => (
        transaction.signer!.address.equals(exchangeAddress)
      ))
      .filter((transaction) => (
        transaction.mosaics.length === 1
        && transaction.mosaics[0].id instanceof MosaicId
        && transaction.mosaics[0].id.equals(tokenId)
      ))
      .filter((transaction) => (
        transaction.message instanceof PlainMessage
        && transaction.message.payload.length !== 0),
      )
  }
/* end block filterElligibleWithdrawals */

  /* start block getDeposits */
  /**
   * Gets the transactions eligible to be deposits pending to be processed.
   * @param exchangeAddress Exchange central account address.
   * @param tokenId Mosaic identifier.
   * @param requiredConfirmations Confirmations to consider a transaction persistent.
   * @param lastTransactionId Resource identifier of the last transaction already processed.
   * @returns Observable <TransferTransaction[]>
   */
  public getDeposits(exchangeAddress: Address,
                      tokenId: MosaicId,
                      requiredConfirmations: number,
                      lastTransactionId?: string)
    : Observable<TransferTransaction[]> {
    return this.getUnprocessedTransactions(exchangeAddress, lastTransactionId).pipe(
      mergeMap((transactions) =>
        this.resolveTransactionsAliases(transactions)),
      map((transactions) =>
        TransactionService.flattenAggregateTransactions(transactions)),
      mergeMap((transactions) =>
        this.filterTransactionsWithEnoughConfirmations(transactions, requiredConfirmations)),
      map((transactions) =>
        TransactionService.filterElligibleDeposits(transactions, exchangeAddress, tokenId)),
    )
  }
  /* end block getDeposits */

  /* start block getWithdrawals */
  /**
   * Gets the transactions eligible to be withdrawals pending to be processed.
   * @param exchangeAddress Exchange central account address.
   * @param tokenId Mosaic identifier.
   * @param requiredConfirmations Confirmations to consider a transaction persistent.
   * @param lastTransactionId Resource identifier of the last transaction already processed.
   * @returns Observable <TransferTransaction[]>
   */
  public getWithdrawals(exchangeAddress: Address,
                      tokenId: MosaicId,
                      requiredConfirmations: number,
                      lastTransactionId?: string)
    : Observable<TransferTransaction[]> {
    return this.getUnprocessedTransactions(exchangeAddress, lastTransactionId).pipe(
      mergeMap((transactions) =>
        this.resolveTransactionsAliases(transactions)),
      map((transactions) =>
        TransactionService.flattenAggregateTransactions(transactions)),
      mergeMap((transactions) =>
        this.filterTransactionsWithEnoughConfirmations(transactions, requiredConfirmations)),
      map((transactions) =>
        TransactionService.filterElligibleWithdrawals(transactions, exchangeAddress, tokenId)),
    )
  }
  /* end block getWithdrawals */

  /* start block getUnprocessedTransactions */
  /**
   * Gets the list of transactions pending to be processed.
   * @param exchangeAddress Exchange central account address.
   * @param lastTransactionId Resource identifier of the last transaction already processed.
   * @returns Observable <Transaction[]>
   */
  public getUnprocessedTransactions(exchangeAddress: Address, lastTransactionId?: string)
    : Observable<Transaction[]> {
    const queryParams = new QueryParams({pageSize: this.pageSize, order: Order.ASC, id: lastTransactionId});
    // Filter transfer and aggregate transactions
    const transactionFilter = new TransactionFilter({types: [
      TransactionType.TRANSFER,
      TransactionType.AGGREGATE_COMPLETE,
      TransactionType.AGGREGATE_BONDED
    ]});
    return this.accountRepository
      .getAccountTransactions(exchangeAddress, queryParams, transactionFilter).pipe(
        // Get all transactions pending to be processed
        expand((transactions) => {
          if (transactions.length === this.pageSize) {
            return this.accountRepository.getAccountTransactions(
              exchangeAddress,
              new QueryParams({pageSize: this.pageSize,
                order: Order.ASC,
                id: transactions[transactions.length - 1].transactionInfo!.id}),
              transactionFilter);
          }

          return EMPTY;
        }),
        concatMap((_) => _),
        toArray())
  }
  /* end block getUnprocessedTransactions */

  /* start block filterTransactionsWithEnoughConfirmations */
  /**
   * Gets deposits with enough confirmations.
   * @param transactions Array of transactions to check.
   * @param requiredConfirmations Number of confirmations to consider a transaction valid.
   * @returns Observable <Transaction[]>
   */
  public filterTransactionsWithEnoughConfirmations(transactions: Transaction[], requiredConfirmations: number)
    : Observable<Transaction[]> {
    return this.chainRepository.getBlockchainHeight().pipe(
      // Determine if the transactions have received enough confirmations.
      map((currentHeight) => transactions.filter((transaction) => {
        const transactionHeight = transaction.transactionInfo!.height;
        return (currentHeight.subtract(transactionHeight)
          .compare(UInt64.fromUint(requiredConfirmations)) >= 0);
      }))
    )
  }
  /* end block filterTransactionsWithEnoughConfirmations */

  /* start block resolveTransactionsAliases */
  /**
   * Resolves the aliases behind an announced transaction.
   * @param transactions Array of transactions to resolve.
   * @returns Observable <Transaction[]>
   */
  public resolveTransactionsAliases(transactions: Transaction[])
    : Observable<Transaction[]> {
    const transactionHashes = transactions.map(
      ((transaction) => transaction.transactionInfo!.hash
    )) as string[]
    return this.transactionService.resolveAliases(transactionHashes)
  }
  /* end block resolveTransactionsAliases */

}
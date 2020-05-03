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
  Account,
  Convert,
  MosaicId,
  MosaicNonce,
  PublicAccount,
  UInt64,
  SHA3Hasher,
  NetworkType,
} from 'symbol-sdk'
import { Wallet } from 'symbol-hd-wallets'

/**
 * @class TokenPartition
 * @package models
 * @since v0.1.0
 * @description Model that describes partitions of tokens. A partition
 *              is created around an \a owner public key (32 bytes) and
 *              an \a amount (1-8 bytes) and a \a name
 */
export class TokenPartition {
  /**
   * Constructor for TokenIdentifier objects
   *
   * @param {UInt64} id
   */
  public constructor(
    /**
     * @description The partition name
     */
    public name: string,

    /**
     * @description The partition owner
     */
    public owner: PublicAccount,

    /**
     * @description The partition account
     */
    public account: PublicAccount,

    /**
     * @description The amount of the partition
     */
    public amount: number,
  )
  {
  }

  /**
   * Comparison operator
   *
   * @param {TokenPartition} rhs 
   * @return {boolean}
   */
  public equals(
    rhs: TokenPartition
  ): boolean {
    return this.owner.publicKey === rhs.owner.publicKey
        && this.owner.address.equals(rhs.owner.address)
        && this.account.publicKey === rhs.account.publicKey
        && this.account.address.equals(rhs.account.address)
        && this.amount === rhs.amount
        && this.name === rhs.name
  }
}

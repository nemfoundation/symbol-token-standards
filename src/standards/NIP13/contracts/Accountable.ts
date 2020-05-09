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
  PublicAccount,
  SHA3Hasher,
} from 'symbol-sdk'
import {
  ExtendedKey,
  MnemonicPassPhrase,
  Network,
  Wallet,
} from 'symbol-hd-wallets'

// internal dependencies
import {
  NetworkConfig,
} from '../../../../index'
import { Derivation } from '../services/HDService'

/**
 * @class Accountable
 * @package NIP13/contracts
 * @since v0.3.0
 * @description Class that describes an object able to create accounts.
 */
export class Accountable {
  /**
   * @description The key provider (Wallet instanciated through BIP32 extended key).
   */
  protected keyProvider: Wallet

  /**
   * Construct an `Accountable` object around \a bip39 mnemonic pass phrase.
   *
   * @param {MnemonicPassPhrase} bip39 
   */
  public constructor(
    /**
     * @description The network configuration
     */
    protected readonly network: NetworkConfig,

    /**
     * @description The BIP39 mnemonic pass phrase used with said token.
     */
    protected readonly bip39: MnemonicPassPhrase,
  ) {
    this.keyProvider = new Wallet(
      ExtendedKey.createFromSeed(
        this.bip39.toSeed().toString('hex'),
        Network.CATAPULT
      ))
  }

  /**
   * Derive a child account
   *
   * @param {string}    derivationPath
   * @return {Account}
   */
  protected getAccount(
    derivationPath: string,
  ): Account {
    return this.keyProvider.getChildAccount(
      derivationPath,
      this.network.networkType,
    )
  }

  /**
   * Derive an **authority** account
   *
   * @return {Account}
   */
  public getAuthority(): Account {
    return this.getAccount(Derivation.AUTH_NIP13)
  }

  /**
   * Derive a **target** account
   *
   * @return {Account}
   */
  public getTarget(): Account {
    return this.getAccount(Derivation.PATH_NIP13)
  }

  /**
   * Derive an **operator** account
   *
   * @internal Operator account derivation paths use the REMOTE (BIP44=CHANGE) path level.
   * @param {number}  at
   * @return {Account}
   */
  public getOperator(
    at: number = 1
  ): Account {
    // prepare derivation
    const start = Derivation.PATH_NIP13
    const level = Derivation.DerivationPathLevels.Remote

    // derive operator
    const path = Derivation.HDService.incrementPathLevel(start, level, at)
    return this.getAccount(path)
  }

  /**
   * Derive a **partition** account
   *
   * @internal Partition account derivation paths use the ADDRESS path level.
   * @param {PublicAccount}  owner
   * @return {Account}
   */
  public getPartition(
    owner: PublicAccount
  ): Account {
    const path = this.getPathForPartition(owner)
    return this.getAccount(path)
  }

  /**
   * Get the BIP44 path for a partition owned by `owner`
   *
   * @internal Partition account derivation paths use the ADDRESS path level.
   * @param {PublicAccount} owner 
   * @return {string}
   */
  public getPathForPartition(
    owner: PublicAccount,
  ): string {
    // prepare derivation
    const start = Derivation.PATH_NIP13
    const level = Derivation.DerivationPathLevels.Address

    // prepare deterministic
    const hash = new Uint8Array(64)
    const data = owner.address.plain()
    SHA3Hasher.func(hash, Convert.utf8ToUint8(data), 64)

    // 3 right-most bytes for partition id
    // :warning: cannot be more than 3 bytes because of hardened
    //           derivation index overflow at 2147483647 (2^31-1)
    const right3b = parseInt(hash.slice(-3).reduce(
      (s, b) => s + b.toString(16).padStart(2, '0'),
      '', // initialValue
    ), 16)

    // derive partition
    return Derivation.HDService.incrementPathLevel(start, level, right3b)
  }
}

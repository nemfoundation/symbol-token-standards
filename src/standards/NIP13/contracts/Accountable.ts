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
  DerivationHelpers,
  NetworkConfig,
} from '../../../../index'

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
   * @param {string}      derivationPath 
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
   * Derive a **target** account
   */
  public getTarget(): Account {
    return this.getAccount(DerivationHelpers.PATH_NIP13)
  }

  /**
   * Derive an **operator** account
   *
   * @internal Operator account derivation paths use the REMOTE (BIP44=CHANGE) path level.
   * @param {number}  at
   */
  public getOperator(
    at: number = 1
  ): Account {
    // prepare derivation
    const start = DerivationHelpers.PATH_NIP13
    const level = DerivationHelpers.DerivationPathLevels.Remote

    // derive operator
    const path = DerivationHelpers.incrementPathLevel(start, level, at)
    return this.getAccount(path)
  }

  /**
   * Derive a **partition** account
   *
   * @internal Operator account derivation paths use the ADDRESS path level.
   * @param {PublicAccount}  owner
   */
  public getPartition(
    owner: PublicAccount
  ): Account {
    // prepare derivation
    const start = DerivationHelpers.PATH_NIP13
    const level = DerivationHelpers.DerivationPathLevels.Address

    // prepare deterministic
    const hash = new Uint8Array(64)
    const data = owner.address.plain()
    SHA3Hasher.func(hash, Convert.utf8ToUint8(data), 64)

    // 4 left-most bytes for partition id
    const left4b = parseInt(hash.slice(0, 4).join(''), 16)

    // derive operator
    const path = DerivationHelpers.incrementPathLevel(start, level, left4b)
    return this.getAccount(path)
  }
}

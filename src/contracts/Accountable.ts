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
import { Account, NetworkType } from 'symbol-sdk'
import {
  ExtendedKey,
  MnemonicPassPhrase,
  Network,
  Wallet,
} from 'symbol-hd-wallets'

// internal dependencies
import { NetworkConfig } from '../../index'

/**
 * @class Accountable
 * @package contracts
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
   * @param {NetworkType} networkType 
   */
  public getAccount(
    derivationPath: string,
  ): Account {
    return this.keyProvider.getChildAccount(
      derivationPath,
      this.network.networkType,
    )
  }
}

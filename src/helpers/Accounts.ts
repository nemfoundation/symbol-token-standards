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
  NetworkType,
  Password,
} from 'symbol-sdk'
import {
  ExtendedKey,
  MnemonicPassPhrase,
  Wallet,
} from 'symbol-hd-wallets'

// internal dependencies
import {
  DerivationHelpers,
} from '../index'

/**
 * @namespace Accounts
 * @package NIP13 Helpers
 * @description Namespace that wraps all helper functions to handle accounts.
 */
export namespace Accounts {
  /**
   * @type RandomNumberGeneratorFn
   * @description Type that permits to override the random number
   *              generator function.
   */
  export type RandomNumberGeneratorFn = (size: number) => Buffer

  /**
   * @function NIP13.Accounts.createMnemonic()
   * @description Helper function to create a random mnemonic pass phrase.
   */
  export const createMnemonic = (
    randomNumberFn: RandomNumberGeneratorFn = MnemonicPassPhrase.CATAPULT_RNG
  ): MnemonicPassPhrase => {
    return MnemonicPassPhrase.createRandom(
      MnemonicPassPhrase.DEFAULT_LANGUAGE,
      MnemonicPassPhrase.DEFAULT_STRENGTH,
      randomNumberFn
    )
  }

  /**
   * @function NIP13.Accounts.createAccount()
   * @description Helper function to create and derive an account from
   *              a mnemonic pass phrase and derivation path.
   */
  export const createAccount = (
    mnemonic: MnemonicPassPhrase,
    path: string = DerivationHelpers.DEFAULT_HDPATH,
    password?: Password,
    networkType: NetworkType = NetworkType.TEST_NET
  ): Account => {
    // encrypt mnemonic
    const pw = undefined === password ? '' : password.value
    const seed = mnemonic.toSeed(pw).toString('hex')

    // create extended key from mnemonic
    const xKey = ExtendedKey.createFromSeed(seed)

    // create wallet
    const wallet = new Wallet(xKey)
    return wallet.getChildAccount(path, networkType)
  }

  /**
   * @function NIP13.Accounts.createAccounts()
   * @description Helper function to create and derive multiple accounts
   *              from a mnemonic pass phrase and derivation paths.
   */
  export const createAccounts = (
    mnemonic: MnemonicPassPhrase,
    size: number = 1,
    password?: Password,
    networkType: NetworkType = NetworkType.TEST_NET
  ): Account[] => {
    // encrypt mnemonic
    const pw = undefined === password ? '' : password.value
    const seed = mnemonic.toSeed(pw).toString('hex')

    // create extended key from mnemonic
    const xKey = ExtendedKey.createFromSeed(seed)

    // create wallet
    const wallet = new Wallet(xKey)

    // get `size` number of derivation paths to be derived
    const paths = DerivationHelpers.getPaths(
      DerivationHelpers.DEFAULT_HDPATH, 
      size
    )

    // derive path and create account from resulting private key
    return paths.map(
      (path: string): Account => wallet.getChildAccount(path, networkType)
    )
  }
}

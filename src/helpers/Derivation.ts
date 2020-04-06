/**
 * Copyright 2020 NEM Foundation (https://nem.io)
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

// internal dependencies
import {
  FailureInvalidDerivationPath,
} from '../index'

/**
 * @namespace Derivation
 * @package NIP13 Helpers
 * @description Namespace that wraps all helper functions to handle HD wallets derivation.
 */
export namespace Derivation {
  /**
   * @description The first operator account's derivation path
   */
  export const DEFAULT_HDPATH: string = 'm/44\'/4343\'/131313\'/0\'/0\''

  /**
   * @enum DerivationPathLevels
   * @description Enumeration of available derivation path levels (as of BIP44).
   * @link https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki#path-levels
   */
  export enum DerivationPathLevels {
    Purpose = 1,
    CoinType = 2,
    Account = 3,
    Remote = 4, // BIP44=change
    Address = 5,
  }

  /**
   * @function NIP13.Derivation.isValidPath()
   * @description Helper function to validate a derivation path.
   */
  export const isValidPath = (
    path: string,
  ): boolean => {
    if (path.match(/^m\/44'\/4343'\/[0-9]+'\/[0-9]+'\/[0-9]+'/)) {
      return true
    }

    return false
  }

  /**
   * @function NIP13.Derivation.assertValidPath()
   * @description Helper function to assert whether a path is a valid derivation path.
   * @throws {FailureInvalidDerivationPath} On invalid derivation path provided.
   */
  export const assertValidPath = (
    path: string,
  ): void => {
    if (!isValidPath(path)) {
      throw new FailureInvalidDerivationPath(`Invalid derivation path: ${path}`)
    }
  }

  /**
   * @function NIP13.Derivation.assertCanModifyLevel()
   * @description Helper function to assert whether a derivation path level can be modified.
   * @throws {FailureInvalidDerivationPath} On invalid derivation path level provided.
   */
  export const assertCanModifyLevel = (
    which: DerivationPathLevels
  ): void => {
    const protect = [
      DerivationPathLevels.Purpose,
      DerivationPathLevels.CoinType,
    ]
    if (undefined !== protect.find(type => which === type)) {
      throw new FailureInvalidDerivationPath('Cannot modify a derivation path\'s purpose and coin type levels.')
    }
  }

  /**
   * @function NIP13.Derivation.incrementPathLevel()
   * @description Helper function to increment a derivation path level.
   * @throws {FailureInvalidDerivationPath} On invalid derivation path or derivation path level provided.
   */
  export const incrementPathLevel = (
    path: string,
    which: DerivationPathLevels = DerivationPathLevels.Account,
    step: number = 1,
  ): string => {

    // make sure derivation path is valid
    assertValidPath(path)

    // purpose and coin type cannot be changed
    assertCanModifyLevel(which)

    // read levels and increment 
    const index = which as number
    const parts = path.split('/')
    
    // calculate next index (increment)
    const next = (step <= 1 ? 1 : step) + parseInt(parts[index].replace(/'/, ''))

    // modify affected level only
    return parts.map((level, idx) => {
      if (idx !== index) {
        return level
      }
      return `${next}'`
    }).join('/')
  }

  /**
   * @function NIP13.Derivation.decrementPathLevel()
   * @description Helper function to decrement a derivation path level.
   * @throws {FailureInvalidDerivationPath} On invalid derivation path or derivation path level provided.
   */
  export const decrementPathLevel = (
    path: string,
    which: DerivationPathLevels = DerivationPathLevels.Account,
    step: number = 1,
  ): string => {
    // make sure derivation path is valid
    assertValidPath(path)

    // purpose and coin type cannot be changed
    assertCanModifyLevel(which)

    // read levels and increment 
    const index = which as number
    const parts = path.split('/')

    // calculate next index (decrement)
    let next = parseInt(parts[index].replace(/'/, '')) - (step <= 1 ? 1 : step)
    if (next < 0) next = 0

    // modify affected level only
    return parts.map((level, idx) => {
      if (idx !== index) {
        return level
      }
      return `${next}'`
    }).join('/')
  }

  /**
   * @function NIP13.Derivation.decrementPathLevel()
   * @description Helper function to decrement a derivation path level.
   * @throws {FailureInvalidDerivationPath} On invalid derivation path or derivation path level provided.
   */
  export const getPaths = (
    startPath: string = DEFAULT_HDPATH,
    size: number = 1,
  ): string[] => {
    if (size <= 1) {
      return [startPath]
    }

    // iterate for next paths creation
    const paths: string[] = [startPath]
    let current: string = startPath

    while (paths.length < size) {
      // :warning: incrementing `address` level because `account` level is locked (@see DEFAULT_HDPATH)
      const nextPath: string = incrementPathLevel(current, DerivationPathLevels.Address)

      // move to next
      paths.push(nextPath)
      current = nextPath
    }

    return paths
  }
}

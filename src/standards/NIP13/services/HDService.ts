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
  Service
} from '../../../../index'
import { FailureInvalidDerivationPath } from '../errors/FailureInvalidDerivationPath'

/**
 * @namespace Derivation
 * @package NIP13 services
 * @since v0.5.0
 * @description Namespace that encapsulates HD keys derivation features.
 */
export namespace Derivation {
  /**
   * @description The authorities accounts' derivation paths for NIP13
   */
  export const AUTH_NIP13: string = 'm/44\'/4343\'/1313\'/1313\'/1313\''

  /**
   * @description The target account's derivation path for NIP13
   */
  export const PATH_NIP13: string = 'm/44\'/4343\'/1313\'/0\'/0\''

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
   * @class MosaicService
   * @package services
   * @since v0.1.0
   * @description Class that describes a service around token metadata features.
   */
  export class HDService extends Service {

    /**
     * @function NIP13.HDService.isValidPath()
     * @description Helper function to validate a derivation path.
     */
    public static isValidPath = (
      path: string,
    ): boolean => {
      if (path.match(/^m\/44'\/4343'\/[0-9]+'\/[0-9]+'\/[0-9]+'/)) {
        return true
      }

      return false
    }

    /**
     * @function NIP13.HDService.assertValidPath()
     * @description Helper function to assert whether a path is a valid derivation path.
     * @throws {FailureInvalidDerivationPath} On invalid derivation path provided.
     */
    public static assertValidPath = (
      path: string,
    ): void => {
      if (!HDService.isValidPath(path)) {
        throw new FailureInvalidDerivationPath(`Invalid derivation path: ${path}`)
      }
    }

    /**
     * @function NIP13.HDService.assertCanModifyLevel()
     * @description Helper function to assert whether a derivation path level can be modified.
     * @throws {FailureInvalidDerivationPath} On invalid derivation path level provided.
     */
    public static assertCanModifyLevel = (
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
     * @function NIP13.HDService.incrementPathLevel()
     * @description Helper function to increment a derivation path level.
     * @throws {FailureInvalidDerivationPath} On invalid derivation path or derivation path level provided.
     */
    public static incrementPathLevel = (
      path: string,
      which: DerivationPathLevels = DerivationPathLevels.Account,
      step: number = 1,
    ): string => {

      // make sure derivation path is valid
      HDService.assertValidPath(path)

      // purpose and coin type cannot be changed
      HDService.assertCanModifyLevel(which)

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
     * @function NIP13.HDService.decrementPathLevel()
     * @description Helper function to decrement a derivation path level.
     * @throws {FailureInvalidDerivationPath} On invalid derivation path or derivation path level provided.
     */
    public static decrementPathLevel = (
      path: string,
      which: DerivationPathLevels = DerivationPathLevels.Account,
      step: number = 1,
    ): string => {
      // make sure derivation path is valid
      HDService.assertValidPath(path)

      // purpose and coin type cannot be changed
      HDService.assertCanModifyLevel(which)

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
     * @function NIP13.HDService.decrementPathLevel()
     * @description Helper function to decrement a derivation path level.
     * @throws {FailureInvalidDerivationPath} On invalid derivation path or derivation path level provided.
     */
    public static getPaths = (
      startPath: string,
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
        const nextPath: string = HDService.incrementPathLevel(current, DerivationPathLevels.Address)

        // move to next
        paths.push(nextPath)
        current = nextPath
      }

      return paths
    }
  }
}

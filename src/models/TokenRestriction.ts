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
// internal dependencies
import { TokenIdentifier } from './TokenIdentifier'
import { TokenRestrictionType } from './TokenRestrictionType'

/**
 * @class TokenRestriction
 * @package models
 * @since v0.1.0
 * @description Model that describes restrictions related to a token.
 */
export class TokenRestriction {
  /**
   * Constructor for TokenRestriction objects
   *
   * @param {TokenIdentifier} tokenId
   * @param {TokenRestrictionType} type
   * @param {string} operator
   * @param {string} field
   * @param {string} value
   */
  public constructor(
    /**
     * @description The token identifier (reference token)
     */
    public tokenId: TokenIdentifier,

    /**
     * @description The token restriction type
     */
    public type: TokenRestrictionType,

    /**
     * @description The token restriction operator
     * @link https://nemtech.github.io/concepts/mosaic-restriction.html#mosaic-restriction-type
     */
    public operator: string,

    /**
     * @description The token restriction key
     */
    public field: string,

    /**
     * @description The token restriction value
     */
    public value: string,
  )
  {}
}

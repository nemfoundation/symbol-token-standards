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
import { TokenIdentifier } from './TokenIdentifier'

/**
 * @class TokenMetadata
 * @package models
 * @since v0.1.0
 * @description Model that describes metadata related to a token.
 */
export class TokenMetadata {
  /**
   * Constructor for TokenMetadata objects
   *
   * @param {TokenIdentifier} tokenId
   * @param {string} field 
   * @param {string} value 
   */
  public constructor(
    /**
     * @description The token identifier
     */
    public tokenId: TokenIdentifier,

    /**
     * @description The metadata key
     */
    public field: string,

    /**
     * @description The metadata value
     */
    public value: string,
  )
  {}
}
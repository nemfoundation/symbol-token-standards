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
  MosaicId,
  MosaicNonce,
  PublicAccount,
  UInt64,
} from 'symbol-sdk'

// internal dependencies
import { TokenSource } from '../index'

/**
 * @class TokenIdentifier
 * @package models
 * @since v0.1.0
 * @description Model that describes identifiers of tokens. An identifier
 *              is created around an \a id (4 bytes), a \a source (up to 32 bytes)
 *              and an \a owner public account (32 bytes)
 */
export class TokenIdentifier {
  /**
   * Constructor for TokenIdentifier objects
   *
   * @param {UInt64} id
   */
  public constructor(
    /**
     * @description The token identifier
     */
    public id: UInt64,

    /**
     * @description The token source
     */
    public source: TokenSource,

    /**
     * @description The deterministic account that represents the token.
     *              This account is also the owner of the mosaic on the network.
     */
    public target: PublicAccount,
  )
  {}

  /**
   * Getter for the readonly property `nonce`.
   *
   * @return {MosaicNonce}
   */
  public get nonce(): MosaicNonce {
    return MosaicNonce.createFromHex(this.id.toHex())
  }

  /**
   * Get mosaic id representation of an instance.
   *
   * @return {MosaicId}
   */
  public toMosaicId(): MosaicId {
    return MosaicId.createFromNonce(this.nonce, this.target)
  }
}

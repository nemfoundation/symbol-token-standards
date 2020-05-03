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

/**
 * @class SecuritiesMetadata
 * @package models
 * @since v0.1.0
 * @description Model that describes the metadata of internal securities.
 * @link https://en.wikipedia.org/wiki/International_Securities_Identification_Number
 * @link https://en.wikipedia.org/wiki/ISO_10962
 * @link https://en.wikipedia.org/wiki/Market_Identifier_Code
 */
export class SecuritiesMetadata {
  /**
   * Constructor for SecuritiesMetadata objects
   *
   * @param {string} source
   */
  public constructor(
    /**
     * @description The market identifier code
     * @link https://en.wikipedia.org/wiki/Market_Identifier_Code
     */
    public mic: string,

    /**
     * @description The international securities identification number
     * @link https://en.wikipedia.org/wiki/International_Securities_Identification_Number
     */
    public isin: string,

    /**
     * @description The classification of the financial instrument
     * @link https://en.wikipedia.org/wiki/ISO_10962
     */
    public classification: string,

    /**
     * @description Custom metadata entries
     */
    public customMetadata: {[k: string]: string} = {},
  )
  {}
}

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
 * @class TokenSource
 * @package models
 * @since v0.1.0
 * @description Model for describing the source network of a token.
 */
export class TokenSource {
  /**
   * Constructor for TokenSource objects
   *
   * @param {string} source
   */
  public constructor(
    /**
     * @description The source network generation hash
     */
    public source: string,
  )
  {}
}

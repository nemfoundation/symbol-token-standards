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
  Deadline,
  UInt64,
} from 'symbol-sdk'

/**
 * @class TransactionParameters
 * @package contracts
 * @since v0.3.0
 * @description Class that describes common transaction parameters for NIP13 tokens commands.
 */
export class TransactionParameters {
  /**
   * @description The transaction maxFee
   */
  public maxFee: UInt64 | undefined = undefined

  /**
   * Construct an execution parameters instance
   *
   * @param {Deadline}            Deadline
   * @param {UInt64|undefined}    maxFee
   */
  public constructor(
    /**
     * @description The transaction deadline
     */
    public deadline: Deadline = Deadline.create(),

    /**
     * @description The transaction maxFee
     */
    public maxFeeInt?: number,

  ) {
    if (this.maxFeeInt !== undefined) {
      this.maxFee = UInt64.fromUint(this.maxFeeInt)
    }
  }
}

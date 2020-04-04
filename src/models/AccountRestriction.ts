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
  Address,
  AccountRestrictionFlags,
} from 'symbol-sdk'

/**
 * @class AccountRestriction
 * @package models
 * @since v0.1.0
 * @description Model for describing restrictions related to an account.
 */
export class AccountRestriction {
  /**
   * Constructor for AccountRestriction objects
   *
   * @param {Address} account 
   * @param {AccountRestrictionFlags} type 
   * @param {Address} target 
   */
  public constructor(
    /**
     * @description The account address
     */
    public account: Address,

    /**
     * @description The account restriction type
     */
    public type: AccountRestrictionFlags,

    /**
     * @description The account restriction target
     */
    public target: Address,
  )
  {}
}

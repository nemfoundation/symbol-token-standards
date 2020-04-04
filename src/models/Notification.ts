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
import { Address } from 'symbol-sdk'

// internal dependencies
import { TokenIdentifier } from './TokenIdentifier'

/**
 * @class Notification
 * @package models
 * @since v0.1.0
 * @description Model for describing a notification.
 */
export class Notification {
  /**
   * Constructor for Notification objects
   *
   * @param {Address|TokenIdentifier} target
   * @param {string} message
   */
  public constructor(
    /**
     * @description The notification target
     */
    public target: Address|TokenIdentifier,

    /**
     * @description The notification message
     */
    public message: string,
  )
  {}
}

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
  MosaicGlobalRestrictionItem,
} from 'symbol-sdk'

// internal dependencies
import {
  Service,
  TokenIdentifier,
} from '../../../../index'
import {
  SecuritiesRestriction,
  SecuritiesRestrictions,
  SecuritiesRestrictionSet,
} from '../models/SecuritiesRestrictions'

/**
 * @class RestrictionService
 * @package services
 * @since v0.5.1
 * @description Class that describes a service around token restrictions features.
 */
export class RestrictionService extends Service {
  /**
   * Read token restrictions from network
   *
   * @param {TokenIdentifier}       tokenId     The token identifier.
   * @return {SecuritiesRestrictions}
   */
  public async getRestrictionsFromNetwork(
    tokenId: TokenIdentifier,
  ): Promise<SecuritiesRestrictions> {
    // read restriction entries for token from network
    const config = await this.context.network.factoryHttp.createRestrictionMosaicRepository()
      .getMosaicGlobalRestriction(tokenId.toMosaicId())
      .toPromise()

    const restrictions: SecuritiesRestrictionSet = {}
    config.restrictions.forEach(
      (value: MosaicGlobalRestrictionItem, key: string) => {
        const entry: SecuritiesRestriction = {
          [value.restrictionType]: parseInt(value.restrictionValue)
        }

        restrictions[key] = entry
      })

    // XXX map known restriction keys

    return new SecuritiesRestrictions(restrictions)
  }
}

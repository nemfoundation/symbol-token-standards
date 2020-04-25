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
  MultisigAccountGraphInfo,
  MultisigAccountInfo,
} from 'symbol-sdk'

// internal dependencies
import { Service } from '../../../index'

/**
 * @class MultisigService
 * @package services
 * @since v0.1.0
 * @description Class that describes a service around multi-signature features.
 */
export class MultisigService extends Service {
  /**
   * Reduce a multisig graph to an array of multisig
   * account information.
   *
   * @param {MultisigAccountGraphInfo} graph 
   * @return {MultisigAccountInfo[]}
   */
  public getMultisigAccountInfoFromGraph(
    graph: MultisigAccountGraphInfo,
  ): MultisigAccountInfo[] {
    // get addresses
    const infos = [...graph.multisigAccounts.keys()]
      .sort((a, b) => b - a) // sort from top to bottom
      .map((key) => graph.multisigAccounts.get(key) || [])
      .filter((x) => x.length > 0)

    // flatten output
    return infos.reduce((
      prev: MultisigAccountInfo[],
      it: MultisigAccountInfo[]) => [...it]
    )
  }
}

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
  RepositoryFactoryHttp,
  NetworkType,
  NetworkConfiguration,
  MosaicId,
} from 'symbol-sdk'

/**
 * @class NetworkConfig
 * @package contracts
 * @since v0.3.0
 * @description Class that describes a network configuration for NIP13 tokens.
 */
export class NetworkConfig {
  /**
   * @description Repository factory (symbol-sdk)
   */
  public factoryHttp: RepositoryFactoryHttp

  /**
   * Construct a network configuration object
   *
   * @param {string}      gatewayUrl
   * @param {NetworkType} networkType
   * @param {string}      generationHash
   * @param {MosaicId}    feeMosaicId
   */
  public constructor(
    /**
     * @description The REST endpoint URL
     */
    public gatewayUrl: string,

    /**
     * @description The network type
     */
    public networkType: NetworkType,

    /**
     * @description The network generation hash
     */
    public generationHash: string,

    /**
     * @description The network fee mosaic id
     */
    public feeMosaicId: MosaicId,
  ) {
    this.factoryHttp = new RepositoryFactoryHttp(gatewayUrl, networkType, generationHash)
  }
}
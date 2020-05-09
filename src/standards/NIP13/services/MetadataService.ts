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
  PublicAccount,
  Address,
  QueryParams,
  Metadata,
  MetadataType,
} from 'symbol-sdk'

// internal dependencies
import {
  Service,
  TokenIdentifier,
} from '../../../../index'
import { SecuritiesMetadata } from '../models/SecuritiesMetadata'

type FormattedMetadata = {
  scopedMetadataKey: string,
  senderAddress: Address,
  targetAddress: Address,
  metadataType: MetadataType,
  targetId: string | undefined,
  metadataValue: string
}

/**
 * @class MetadataService
 * @package services
 * @since v0.1.0
 * @description Class that describes a service around token metadata features.
 */
export class MetadataService extends Service {
  /**
   * @description Known NIP13 metadata keys
   */
  static KNOWN_METADATAS: {[k: string]: string} = {
    'D434152406E75CA0': 'nip13_token_identifier',
    '8B5DD479E6AB718A': 'nip13_name',
    'BC2FC3ACFF58FF89': 'nip13_isin',
    'D92F12883E1687AA': 'nip13_mic',
    '9E600698F53ED4F8': 'nip13_iso10962',
    '985A5AFB4D783C53': 'nip13_website'
  }

  /**
   * Helper function to retrieve known mosaic metadata keys
   *
   * @param {string}  hexKey
   * @return {string}
   */
  static getKnownMetadataKey = (hexKey: string): string => {
    return hexKey in MetadataService.KNOWN_METADATAS
      ? MetadataService.KNOWN_METADATAS[hexKey]
      : hexKey
  }

  /**
   * Helper function to format metadata entries
   *
   * @param {Metadata} metadataEntry 
   * @return {any}
   */
  protected formatMetadata(
    metadata: Metadata,
  ): FormattedMetadata {
    const metadataEntry = metadata.metadataEntry
    return ({
      ...metadataEntry,
      scopedMetadataKey: metadataEntry.scopedMetadataKey.toHex(),
      senderAddress: Address.createFromPublicKey(metadataEntry.senderPublicKey, this.context.network.networkType),
      targetAddress: Address.createFromPublicKey(metadataEntry.targetPublicKey, this.context.network.networkType),
      metadataType: MetadataType.Mosaic,
      targetId: metadataEntry.targetId ? metadataEntry.targetId.toHex() : undefined,
      metadataValue: metadataEntry.value
    })
  }

  /**
   * Read token partitions from token operators
   * network information.
   *
   * @param {TokenIdentifier}       tokenId     The token identifier.
   * @return {SecuritiesMetadata}
   */
  public async getMetadataFromNetwork(
    tokenId: TokenIdentifier,
  ): Promise<SecuritiesMetadata> {
    // read metadata entries for token from network
    const entries = await this.context.network.factoryHttp.createMetadataRepository()
      .getMosaicMetadata(tokenId.toMosaicId(), new QueryParams({ pageSize: 10, id: undefined }))
      .toPromise()

    const mosaicMetadata = entries.map((metadata: Metadata) => this.formatMetadata(metadata))

    // overwrite `scopeMetadataKey` values to rewrite keys
    const metadataFields = Object.keys(MetadataService.KNOWN_METADATAS)
    mosaicMetadata.sort((a: FormattedMetadata, b: FormattedMetadata) => {
      const indexA = metadataFields.findIndex(v => v === a.scopedMetadataKey)
      const indexB = metadataFields.findIndex(v => v === b.scopedMetadataKey)
      return indexA - indexB
    })

    // read only known metadata
    let known: {[k: string]: string} = {}
    for (let i = 0, m = metadataFields.length; i < m; i++) {
      const entry = mosaicMetadata[i]

      if (metadataFields.indexOf(entry.scopedMetadataKey) !== -1) {
        const key = MetadataService.getKnownMetadataKey(entry.scopedMetadataKey)
        known[key] = entry.metadataValue
      }
    }

    return new SecuritiesMetadata(
      known['nip13_mic'],
      known['nip13_isin'],
      known['nip13_iso10962'],
      {
        'nip13_token_identifier': known['nip13_token_identifier'],
        'nip13_name': known['nip13_name'],
        'nip13_website': known['nip13_website'],
      }
    )
  }
}

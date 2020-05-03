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

import { expect } from 'chai'
import { describe, it } from 'mocha'
import { MosaicId, NetworkType } from 'symbol-sdk'

// internal dependencies
import { getTestMnemonic } from '../mocks/index'
import { NIP13 } from '../../index'
import { NetworkConfig } from '../../src/models/NetworkConfig'

// prepare
const mnemonic = getTestMnemonic()
const token = new NIP13.Token(
  new NetworkConfig(
    'http://api-01.us-west-1.symboldev.network:3000',
    NetworkType.TEST_NET,
    'ACECD90E7B248E012803228ADB4424F0D966D24149B72E58987D2BF2F2AF03C4',
    new MosaicId('519FC24B9223E0B4'),
  ),
  mnemonic,
)
const defaultNIP13 = 'TDEE6S3YUMS6A37XSW3JB7VPT7QTMYCYKDUACQU4' // m/44'/4343'/1313'/0'/0'

describe('NIP13 Standard --->', () => {
  it('Revision should be 1', () => {
    // assert
    expect(NIP13.Revision).to.be.equal(1)
  })

  it('export Token class', () => {
    expect(NIP13.Token).not.to.be.undefined
  })

  it('export TokenMetadata class', () => {
    expect(NIP13.TokenMetadata).not.to.be.undefined
  })

  describe('constructor() should', () => {
    it('derive default NIP13 derivation path', () => {
      // assert
      expect(token.target.address.plain()).to.be.equal(defaultNIP13)
    })
  })
})

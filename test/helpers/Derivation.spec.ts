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

// internal dependencies
import { DerivationHelpers } from '../../src/index'

describe('helpers/Derivation --->', () => {
  describe('isValidPath() should', () => {
    it('validate BIP44 and Symbol compliance', () => {
      // act
      const result_t = DerivationHelpers.isValidPath("m/44'/4343'/0'/0'/0'")
      const result_f = DerivationHelpers.isValidPath("invalidPath")
      const nonBIP44 = DerivationHelpers.isValidPath("m/0'/4343'/0'/0'/0'")
      const nonSymbol = DerivationHelpers.isValidPath("m/44'/123'/0'/0'/0'")
      const missingOne = DerivationHelpers.isValidPath("m/44'/4343'/0'/0'")

      // assert
      expect(result_t).to.be.equal(true)
      expect(result_f).to.be.equal(false)
      expect(nonBIP44).to.be.equal(false)
      expect(nonSymbol).to.be.equal(false)
      expect(missingOne).to.be.equal(false)
    })

    it('accept any account level overwrite', () => {
      // act
      const acct1 = DerivationHelpers.isValidPath("m/44'/4343'/1'/0'/0'")
      const acct123 = DerivationHelpers.isValidPath("m/44'/4343'/123'/0'/0'")
      const acct9 = DerivationHelpers.isValidPath("m/44'/4343'/999999999'/0'/0'")

      // assert
      expect(acct1).to.be.equal(true)
      expect(acct123).to.be.equal(true)
      expect(acct9).to.be.equal(true)
    })

    it('accept any change level overwrite', () => {
      // act
      const change1 = DerivationHelpers.isValidPath("m/44'/4343'/0'/1'/0'")
      const change123 = DerivationHelpers.isValidPath("m/44'/4343'/0'/123'/0'")
      const change9 = DerivationHelpers.isValidPath("m/44'/4343'/0'/999999999'/0'")

      // assert
      expect(change1).to.be.equal(true)
      expect(change123).to.be.equal(true)
      expect(change9).to.be.equal(true)
    })

    it('accept any address level overwrite', () => {
      // act
      const addr1 = DerivationHelpers.isValidPath("m/44'/4343'/0'/0'/1'")
      const addr123 = DerivationHelpers.isValidPath("m/44'/4343'/0'/0'/123'")
      const addr9 = DerivationHelpers.isValidPath("m/44'/4343'/0'/0'/999999999'")

      // assert
      expect(addr1).to.be.equal(true)
      expect(addr123).to.be.equal(true)
      expect(addr9).to.be.equal(true)
    })
  })

  describe('assertValidPath() should', () => {
    it('throw when given an invalid derivation path', () => {
      expect(() => {
        DerivationHelpers.assertValidPath('invalidPath')
      }).to.throw('Invalid derivation path: invalidPath')
    })

    it('not throw when given a valid derivation path', () => {
      expect(() => {
        DerivationHelpers.assertValidPath("m/44'/4343'/0'/0'/0'")
      }).to.not.throw()
    })
  })

  describe('assertCanModifyLevel() should', () => {
    it('throw when given Purpose or CoinType path levels', () => {
      expect(() => {
        const purpose = DerivationHelpers.DerivationPathLevels.Purpose
        DerivationHelpers.assertCanModifyLevel(purpose)
      }).to.throw('Cannot modify a derivation path\'s purpose and coin type levels.')

      expect(() => {
        const coinType = DerivationHelpers.DerivationPathLevels.CoinType
        DerivationHelpers.assertCanModifyLevel(coinType)
      }).to.throw('Cannot modify a derivation path\'s purpose and coin type levels.')
    })

    it('not throw when other path levels (account, remote, address)', () => {
      expect(() => {
        const acct = DerivationHelpers.DerivationPathLevels.Account
        const remote = DerivationHelpers.DerivationPathLevels.Remote
        const addr = DerivationHelpers.DerivationPathLevels.Address

        DerivationHelpers.assertCanModifyLevel(acct)
        DerivationHelpers.assertCanModifyLevel(remote)
        DerivationHelpers.assertCanModifyLevel(addr)
      }).to.not.throw()
    })
  })

  describe('incrementPathLevel() should', () => {
    it('throw when given Purpose or CoinType path levels', () => {
      expect(() => {
        const purpose = DerivationHelpers.DerivationPathLevels.Purpose
        DerivationHelpers.incrementPathLevel("m/44'/4343'/0'/0'/0'", purpose)
      }).to.throw('Cannot modify a derivation path\'s purpose and coin type levels.')
    })

    it('use account level and step 1 given no parameters', () => {
      // act
      const path1 = DerivationHelpers.incrementPathLevel("m/44'/4343'/0'/0'/0'")
      const path2 = DerivationHelpers.incrementPathLevel("m/44'/4343'/100'/0'/0'")

      // assert
      expect(path1).to.be.equal("m/44'/4343'/1'/0'/0'")
      expect(path2).to.be.equal("m/44'/4343'/101'/0'/0'")
    })

    it('accept path level account, remote and change', () => {
      // prepare
      const acct = DerivationHelpers.DerivationPathLevels.Account
      const remote = DerivationHelpers.DerivationPathLevels.Remote
      const addr = DerivationHelpers.DerivationPathLevels.Address

      // act
      const path_acct = DerivationHelpers.incrementPathLevel("m/44'/4343'/0'/0'/0'", acct)
      const path_remote = DerivationHelpers.incrementPathLevel("m/44'/4343'/0'/0'/0'", remote)
      const path_addr = DerivationHelpers.incrementPathLevel("m/44'/4343'/0'/0'/0'", addr)

      // assert
      expect(path_acct).to.be.equal("m/44'/4343'/1'/0'/0'")
      expect(path_remote).to.be.equal("m/44'/4343'/0'/1'/0'")
      expect(path_addr).to.be.equal("m/44'/4343'/0'/0'/1'")
    })

    it('accept custom step', () => {
      // act
      const path = DerivationHelpers.incrementPathLevel("m/44'/4343'/0'/0'/0'", undefined, 5)

      // assert
      expect(path).to.be.equal("m/44'/4343'/5'/0'/0'")
    })
  })

  describe('decrementPathLevel() should', () => {
    it('throw when given Purpose or CoinType path levels', () => {
      expect(() => {
        const purpose = DerivationHelpers.DerivationPathLevels.Purpose
        DerivationHelpers.decrementPathLevel("m/44'/4343'/0'/0'/0'", purpose)
      }).to.throw('Cannot modify a derivation path\'s purpose and coin type levels.')
    })

    it('use account path level and step 1 given no parameters', () => {
      // act
      const path1 = DerivationHelpers.decrementPathLevel("m/44'/4343'/1'/0'/0'")
      const path2 = DerivationHelpers.decrementPathLevel("m/44'/4343'/101'/0'/0'")

      // assert
      expect(path1).to.be.equal("m/44'/4343'/0'/0'/0'")
      expect(path2).to.be.equal("m/44'/4343'/100'/0'/0'")
    })

    it('accept path level account, remote and change', () => {
      // prepare
      const acct = DerivationHelpers.DerivationPathLevels.Account
      const remote = DerivationHelpers.DerivationPathLevels.Remote
      const addr = DerivationHelpers.DerivationPathLevels.Address

      // act
      const path_acct = DerivationHelpers.decrementPathLevel("m/44'/4343'/1'/0'/0'", acct)
      const path_remote = DerivationHelpers.decrementPathLevel("m/44'/4343'/0'/1'/0'", remote)
      const path_addr = DerivationHelpers.decrementPathLevel("m/44'/4343'/0'/0'/1'", addr)

      // assert
      expect(path_acct).to.be.equal("m/44'/4343'/0'/0'/0'")
      expect(path_remote).to.be.equal("m/44'/4343'/0'/0'/0'")
      expect(path_addr).to.be.equal("m/44'/4343'/0'/0'/0'")
    })

    it('accept custom step', () => {
      // act
      const path = DerivationHelpers.decrementPathLevel("m/44'/4343'/10'/0'/0'", undefined, 5)

      // assert
      expect(path).to.be.equal("m/44'/4343'/5'/0'/0'")
    })

    it('overwrite negative indexes with 0', () => {
      // act
      const path = DerivationHelpers.decrementPathLevel("m/44'/4343'/0'/0'/0'")

      // assert
      expect(path).to.be.equal("m/44'/4343'/0'/0'/0'") // no-change
    })
  })

  describe('getPaths() should', () => {
    it('use NIP13 default path given no parameters', () => {
      // act
      const paths = DerivationHelpers.getPaths()

      // assert
      expect(paths).to.not.be.undefined
      expect(paths.length).to.be.equal(1)
      expect(paths[0]).to.be.equal(DerivationHelpers.DEFAULT_HDPATH)
    })

    it('increment paths based on address path level', () => {
      // act
      const paths = DerivationHelpers.getPaths(undefined, 3)

      // assert
      expect(paths).to.not.be.undefined
      expect(paths.length).to.be.equal(3)
      expect(paths[0]).to.be.equal("m/44'/4343'/131313'/0'/0'")
      expect(paths[1]).to.be.equal("m/44'/4343'/131313'/0'/1'")
      expect(paths[2]).to.be.equal("m/44'/4343'/131313'/0'/2'")
    })

    it('accept custom start path (BIP44+Symbol compliant)', () => {
      // act
      const paths = DerivationHelpers.getPaths("m/44'/4343'/14'/0'/0'", 2)

      // assert
      expect(paths).to.not.be.undefined
      expect(paths.length).to.be.equal(2)
      expect(paths[0]).to.be.equal("m/44'/4343'/14'/0'/0'")
      expect(paths[1]).to.be.equal("m/44'/4343'/14'/0'/1'")
    })
  })
})

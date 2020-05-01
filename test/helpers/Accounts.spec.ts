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
import { Crypto, Password } from 'symbol-sdk'

// internal dependencies
import { getTestMnemonic } from '../mocks/index'
import { AccountsHelpers } from '../../index'
import { MnemonicPassPhrase } from 'symbol-hd-wallets'

// prepare
const mnemonic = getTestMnemonic()
const account = AccountsHelpers.createAccount(mnemonic)
const addresses = {
  defaultNIP13_0: 'TC2FSWC466WFRJBLTE7GZBFGFSISSSWMJLOSSVWN', // m/44'/4343'/131313'/0'/0'
  defaultNIP13_1: 'TAXWYALHO5Y3YC4HMJXVBL5UVART7UGOLDVUAMWF', // m/44'/4343'/131313'/1'/0'
  defaultNIP13_2: 'TBQHX4WVYSCILYB6MC6MU47ZST5HLOMCWG2RIB5Z', // m/44'/4343'/131313'/2'/0'
  passwordNIP13: 'TB6YJBJUMPBLD2AU5OPUAYGLAN4WU6Q7STJHVTOK',
  customPath: 'TB7IMNOYR72HUBNVJYXF44AKCAVP6EN3FNIEPTV2', // m/44'/4343'/131313'/123456'/0'
}

describe('helpers/Accounts --->', () => {
  describe('createMnemonic() should', () => {
    it('use default strength', () => {
      // act
      const mnemonic2 = AccountsHelpers.createMnemonic()

      // assert
      expect(mnemonic2).to.not.be.undefined
      expect(mnemonic2.toArray().length).to.be.equal(24)
    })

    it('permit overwrite of RNG', () => {
      // act
      const mnemonic = AccountsHelpers.createMnemonic(
        (size: number) => Crypto.randomBytes(size)
      )

      // assert
      expect(mnemonic).to.not.be.undefined
    })
  })

  describe('createAccount() should', () => {
    it('use default NIP13 derivation path', () => {
      // assert
      expect(account).to.not.be.undefined
      expect(account.publicAccount.address.plain()).to.be.equal(addresses.defaultNIP13_0)
    })

    it('use password for seed hardening', () => {
      // act
      const account2 = AccountsHelpers.createAccount(
        mnemonic,
        undefined, // use default path
        new Password("password"),
      )

      // assert
      expect(account2).to.not.be.undefined
      expect(account2.publicAccount.address.plain()).to.be.equal(addresses.passwordNIP13)
    })

    it('derive correct account using custom path', () => {
      // act
      const account2 = AccountsHelpers.createAccount(
        mnemonic,
        `m/44'/4343'/131313'/123456'/0'`,
      )

      // assert
      expect(account2).to.not.be.undefined
      expect(account2.publicAccount.address.plain()).to.be.equal(addresses.customPath)
    })
  })

  describe('createAccounts() should', () => {
    // prepare
    const accounts = AccountsHelpers.createAccounts(mnemonic, 3)

    it('use default NIP13 derivation path', () => {
      // assert
      expect(accounts).to.not.be.undefined
      expect(accounts.length).to.be.equal(3)
      expect(accounts[0].publicAccount.address.plain()).to.be.equal(addresses.defaultNIP13_0)
    })

    it('use password for seed hardening', () => {
      // act
      const account2 = AccountsHelpers.createAccounts(
        mnemonic,
        1,
        new Password("password"),
      )[0]

      // assert
      expect(account2).to.not.be.undefined
      expect(account2.publicAccount.address.plain()).to.be.equal(addresses.passwordNIP13)
    })

    it('correctly increment default NIP13 derivation path', () => {
      // assert
      expect(accounts).to.not.be.undefined
      expect(accounts.length).to.be.equal(3)
      expect(accounts[1].publicAccount.address.plain()).to.be.equal(addresses.defaultNIP13_1)
      expect(accounts[2].publicAccount.address.plain()).to.be.equal(addresses.defaultNIP13_2)
    })
  })
})

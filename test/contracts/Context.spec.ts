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

import {expect} from 'chai'
import {describe, it} from 'mocha'

// internal dependencies
import { getTestAccount } from '../mocks/index'
import { CommandOption, Context } from '../../index'
import { Deadline, NetworkType, RepositoryFactoryHttp } from 'symbol-sdk'

const context = new Context(
  1,
  getTestAccount('operator1'),
  new RepositoryFactoryHttp('http://api-01.us-west-1.symboldev.network:3000', NetworkType.TEST_NET),
  getTestAccount('operator1').address.networkType,
  Deadline.create(),
  undefined,
  undefined,
)

const contextWithArgs = new Context(
  1,
  getTestAccount('operator1'),
  new RepositoryFactoryHttp('http://api-01.us-west-1.symboldev.network:3000', NetworkType.TEST_NET),
  getTestAccount('operator1').address.networkType,
  Deadline.create(),
  undefined,
  [new CommandOption('identifier', 'id')],
)

describe('contracts/Context --->', () => {
  describe('getInput() should', () => {
    it('use default value given no arguments', () => {
      // act
      const identifier = context.getInput('identifier', 'default')

      // assert
      expect(identifier).to.not.be.undefined
      expect(identifier).to.be.equal('default')
    })

    it('use correct value given argument', () => {
      // act
      const identifier = contextWithArgs.getInput('identifier', 'default')

      // assert
      expect(identifier).to.not.be.undefined
      expect(identifier).to.be.equal('id')
    })
  })
})

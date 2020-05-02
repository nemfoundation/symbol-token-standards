/**
 * Copyright 2020 NEM
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {
  Deadline,
  NetworkType,
  RepositoryFactoryHttp,
  MosaicId,
} from 'symbol-sdk'

// internal dependencies
import { getTestAccount } from './Accounts'
import { Context, NetworkConfig, TransactionParameters } from '../../index'

export const getTestContext = (
  nodeUrl: string,
  actor?: string
): Context => {
  return new Context(
    1,
    getTestAccount(actor || 'operator1'),
    new NetworkConfig(
      nodeUrl,
      getTestAccount('operator1').address.networkType,
      'ACECD90E7B248E012803228ADB4424F0D966D24149B72E58987D2BF2F2AF03C4',
      new MosaicId('519FC24B9223E0B4'),
    ),
    new TransactionParameters(
      Deadline.create(),
      undefined, // maxFee
    ),
    undefined,
  )
}

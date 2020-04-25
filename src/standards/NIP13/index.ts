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

// commands
import { CreateToken as CreateTokenImpl } from './commands/CreateToken'
import { PublishToken as PublishTokenImpl } from './commands/PublishToken'
import { TransferOwnership as TransferOwnershipImpl } from './commands/TransferOwnership'

export namespace NIP13 {
  /**
   * @class NIP13.CreateToken
   * @package interfaces
   * @since v0.1.0
   * @description Class that describes a token command for creating NIP13 compliant tokens.
   */
  export class CreateToken extends CreateTokenImpl {}

  /**
   * @class NIP13.PublishToken
   * @package interfaces
   * @since v0.1.0
   * @description Class that describes a token command for publishing NIP13 compliant tokens.
   */
  export class PublishToken extends PublishTokenImpl {}

  /**
   * @class NIP13.TransferOwnership
   * @package interfaces
   * @since v0.1.0
   * @description Class that describes a token command for transferring the ownership of NIP13 compliant tokens.
   */
  export class TransferOwnership extends TransferOwnershipImpl {}
}

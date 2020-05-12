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
import { CreatePartition as CreatePartitionImpl } from './commands/CreatePartition'
import { TransferOwnership as TransferOwnershipImpl } from './commands/TransferOwnership'
import { TransferOwnershipWithData as TransferOwnershipWithDataImpl } from './commands/TransferOwnershipWithData'
import { BatchTransferOwnership as BatchTransferOwnershipImpl } from './commands/BatchTransferOwnership'
import { BatchTransferOwnershipWithData as BatchTransferOwnershipWithDataImpl } from './commands/BatchTransferOwnershipWithData'
import { ForcedTransfer as ForcedTransferImpl } from './commands/ForcedTransfer'
import { LockBalance as LockBalanceImpl } from './commands/LockBalance'
import { UnlockBalance as UnlockBalanceImpl } from './commands/UnlockBalance'
import { ModifyMetadata as ModifyMetadataImpl } from './commands/ModifyMetadata'
import { ModifyRestriction as ModifyRestrictionImpl } from './commands/ModifyRestriction'
import { DelegateIssuerPower as DelegateIssuerPowerImpl } from './commands/DelegateIssuerPower'
import { RevokeIssuerPower as RevokeIssuerPowerImpl } from './commands/RevokeIssuerPower'
import { AttachDocument as AttachDocumentImpl } from './commands/AttachDocument'

export namespace NIP13 {
  /**
   * @class NIP13.CreateToken
   * @package interfaces
   * @since v0.1.0
   * @description Class that describes a token command for creating NIP13 compliant tokens.
   */
  export class CreateToken extends CreateTokenImpl {}

  /**
   * @class NIP13.CreatePartition
   * @package interfaces
   * @since v0.1.0
   * @description Class that describes a token command for creating NIP13 token holder partitions.
   */
  export class CreatePartition extends CreatePartitionImpl {}

  /**
   * @class NIP13.TransferOwnership
   * @package interfaces
   * @since v0.1.0
   * @description Class that describes a token command for transferring the ownership of NIP13 compliant tokens.
   */
  export class TransferOwnership extends TransferOwnershipImpl {}

  /**
   * @class NIP13.TransferOwnershipWithData
   * @package interfaces
   * @since v0.1.0
   * @description Class that describes a token command for transferring the ownership of NIP13 compliant tokens and attaching data.
   */
  export class TransferOwnershipWithData extends TransferOwnershipWithDataImpl {}

  /**
   * @class NIP13.BatchTransferOwnership
   * @package interfaces
   * @since v0.1.0
   * @description Class that describes a token command for batch transferring the ownership of NIP13 compliant tokens.
   */
  export class BatchTransferOwnership extends BatchTransferOwnershipImpl {}

  /**
   * @class NIP13.BatchTransferOwnershipWithData
   * @package interfaces
   * @since v0.1.0
   * @description Class that describes a token command for batch transferring the ownership of NIP13 compliant tokens and attaching data.
   */
  export class BatchTransferOwnershipWithData extends BatchTransferOwnershipWithDataImpl {}

  /**
   * @class NIP13.ForcedTransfer
   * @package interfaces
   * @since v0.1.0
   * @description Class that describes a token command for force-transferring the ownership of NIP13 compliant tokens.
   */
  export class ForcedTransfer extends ForcedTransferImpl {}

  /**
   * @class NIP13.LockBalance
   * @package interfaces
   * @since v0.1.0
   * @description Class that describes a token command for locking a (part of) NIP13 token holder partition balance.
   */
  export class LockBalance extends LockBalanceImpl {}

  /**
   * @class NIP13.UnlockBalance
   * @package interfaces
   * @since v0.1.0
   * @description Class that describes a token command for unlocking a (part of) NIP13 token holder partition balance.
   */
  export class UnlockBalance extends UnlockBalanceImpl {}

  /**
   * @class NIP13.ModifyMetadata
   * @package interfaces
   * @since v0.1.0
   * @description Class that describes a token command for modifying metadata of NIP13 compliant tokens.
   */
  export class ModifyMetadata extends ModifyMetadataImpl {}

  /**
   * @class NIP13.ModifyRestriction
   * @package interfaces
   * @since v0.1.0
   * @description Class that describes a token command for modifying restrictions of NIP13 compliant tokens.
   */
  export class ModifyRestriction extends ModifyRestrictionImpl {}

  /**
   * @class NIP13.DelegateIssuerPower
   * @package interfaces
   * @since v0.1.0
   * @description Class that describes a token command for adding operators to NIP13 compliant tokens.
   */
  export class DelegateIssuerPower extends DelegateIssuerPowerImpl {}

  /**
   * @class NIP13.RevokeIssuerPower
   * @package interfaces
   * @since v0.1.0
   * @description Class that describes a token command for removing operators from NIP13 compliant tokens.
   */
  export class RevokeIssuerPower extends RevokeIssuerPowerImpl {}

  /**
   * @class NIP13.AttachDocument
   * @package interfaces
   * @since v0.1.0
   * @description Class that describes a token command for attaching documents to NIP13 compliant tokens or token holder partitions.
   */
  export class AttachDocument extends AttachDocumentImpl {}
}

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
import { PublicAccount } from 'symbol-sdk'

// internal dependencies
import {
  CommandOption,
  NetworkConfig,
  TransactionParameters,
} from '../../index'

/**
 * @class AbstractCommand
 * @package contracts
 * @since v0.1.0
 * @description Class that describes a token command for creating NIP13 compliant tokens.
 */
export class Context {

  public constructor(
    /**
     * @description Standard revision
     */
    public revision: number,

    /**
     * @description Execution actor
     */
    public actor: PublicAccount,

    /**
     * @description Network configuration
     */
    public network: NetworkConfig,

    /**
     * @description Transaction parameters
     */
    public parameters: TransactionParameters,

    /**
     * @description Execution parameters
     */
    protected argv: CommandOption[] | undefined,
  ) {}

  /**
   * Read an input by its' `name` in `argv` options.
   *
   * @param   {string} name
   * @param   {Array<CommandOption>}   argv
   * @param   {any} defaultValue
   * @return  {CommandOption|undefined}
   */
  public getInput<ValueType>(
    name: string,
    defaultValue: ValueType,
  ): ValueType {
    if (undefined === this.argv || !this.argv.length) {
      return defaultValue
    }

    // find by name and return value
    const it = this.argv.find(opt => opt.name === name)
    return it ? it.value as ValueType : defaultValue
  }

  /**
   * Set the value of an input by its' `name` in `argv` options.
   *
   * @param   {string}      name
   * @param   {ValueType}   value
   * @return  {Context}
   */
  public setInput<ValueType>(
    name: string,
    value: ValueType,
  ): Context {
    if (undefined === this.argv) {
      this.argv = []
    }

    this.argv.push(new CommandOption(
      name,
      value,
    ))

    return this
  }
}

'use strict';

/**
 * Equity balance data for account
 * @typedef {Object} EquityBalanceData
 * @property {number} equity account equity
 * @property {number} balance account balance
 */

/**
 * Equity balance event listener for handling a stream of equity and balance updates
 */
export default class EquityBalanceListener {

  /**
   * Processes an update event when equity or balance changes
   * @param {EquityBalanceData} equityBalanceData equity and balance updated data
   */
  async onEquityOrBalanceUpdated(equityBalanceData) {
    throw Error('Abstract method onEquityOrBalanceUpdated has no implementation');
  }

  /**
   * Processes an event which occurs when connection has been established
   */
  async onConnected() {
    throw Error('Abstract method onConnected has no implementation');
  }

  /**
   * Processes an event which occurs when connection has been lost
   */
  async onDisconnected() {
    throw Error('Abstract method onDisconnected has no implementation');
  }

}
'use strict';

/**
 * Defines interface for a synchronization listener class
 */
export default class SynchronizationListener {

  /**
   * Invoked when connection to MetaTrader terminal established
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onConnected() {}

  /**
   * Invoked when connection to MetaTrader terminal terminated
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onDisconnected() {}

  /**
   * Invoked when broker connection satus have changed
   * @param {Boolean} connected is MetaTrader terminal is connected to broker
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onBrokerConnectionStatusChanged(connected) {}

  /**
   * Invoked when MetaTrader terminal state synchronization is started
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onSynchronizationStarted() {}

  /**
   * Invoked when MetaTrader account information is updated
   * @param {MetatraderAccountInformation} accountInformation updated MetaTrader account information
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onAccountInformationUpdated(accountInformation) {}

  /**
   * Invoked when the positions are replaced as a result of initial terminal state synchronization
   * @param {Array<MetatraderPosition>} positions updated array of positions
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onPositionsReplaced(positions) {}

  /**
   * Invoked when MetaTrader position is updated
   * @param {MetatraderPosition} position updated MetaTrader position
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onPositionUpdated(position) {}

  /**
   * Invoked when MetaTrader position is removed
   * @param {String} positionId removed MetaTrader position id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onPositionRemoved(positionId) {}

  /**
   * Invoked when the orders are replaced as a result of initial terminal state synchronization
   * @param {Array<MetatraderOrder>} orders updated array of orders
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onOrdersReplaced(orders) {}

  /**
   * Invoked when MetaTrader order is updated
   * @param {MetatraderOrder} order updated MetaTrader order
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onOrderUpdated(order) {}

  /**
   * Invoked when MetaTrader order is completed (executed or canceled)
   * @param {String} orderId completed MetaTrader order id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onOrderCompleted(orderId) {}

  /**
   * Invoked when a new MetaTrader history order is added
   * @param {MetatraderOrder} historyOrder new MetaTrader history order
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onHistoryOrderAdded(historyOrder) {}

  /**
   * Invoked when a new MetaTrader history deal is added
   * @param {MetatraderDeal} deal new MetaTrader history deal
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onDealAdded(deal) {}

  /**
   * Invoked when a synchronization of history deals on a MetaTrader account have finished
   * @param {String} synchronizationId synchronization request id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onDealSynchronizationFinished(synchronizationId) {}

  /**
   * Invoked when a synchronization of history orders on a MetaTrader account have finished
   * @param {String} synchronizationId synchronization request id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onOrderSynchronizationFinished(synchronizationId) {}

  /**
   * Invoked when a symbol specification was updated
   * @param {MetatraderSymbolSpecification} specification updated MetaTrader symbol specification
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onSymbolSpecificationUpdated(specification) {}

  /**
   * Invoked when a symbol price was updated
   * @param {MetatraderSymbolPrice} price updated MetaTrader symbol price
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onSymbolPriceUpdated(price) {}

  /**
   * Invoked when prices for several symbols were updated
   * @param {Array<MetatraderSymbolPrice>} prices updated MetaTrader symbol prices
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onSymbolPricesUpdated(prices) {}

}

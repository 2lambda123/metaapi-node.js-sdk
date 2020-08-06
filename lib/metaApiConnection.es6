'use strict';

import TerminalState from './terminalState';
import MemoryHistoryStorage from './memoryHistoryStorage';
import SynchronizationListener from './clients/synchronizationListener';
import TimeoutError from './clients/timeoutError';
import randomstring from 'randomstring';

/**
 * Exposes MetaApi MetaTrader API connection to consumers
 */
export default class MetaApiConnection extends SynchronizationListener {

  /**
   * Constructs MetaApi MetaTrader Api connection
   * @param {MetaApiWebsocketClient} websocketClient MetaApi websocket client
   * @param {String} accountId MetaTrader account id to connect to
   * @param {HistoryStorage} local terminal history storage. Use for accounts in user synchronization mode. By default
   * an instance of MemoryHistoryStorage will be used.
   */
  constructor(websocketClient, account, historyStorage) {
    super();
    this._websocketClient = websocketClient;
    this._account = account;
    this._ordersSynchronized = {};
    this._dealsSynchronized = {};
    this._lastSynchronizationId = undefined;
    if (account.synchronizationMode === 'user') {
      this._terminalState = new TerminalState();
      this._historyStorage = historyStorage || new MemoryHistoryStorage();
      this._websocketClient.addSynchronizationListener(account.id, this);
      this._websocketClient.addSynchronizationListener(account.id, this._terminalState);
      this._websocketClient.addSynchronizationListener(account.id, this._historyStorage);
      this._websocketClient.addReconnectListener(this);
    }
  }

  /**
   * Returns account information (see
   * https://metaapi.cloud/docs/client/websocket/api/readTradingTerminalState/readAccountInformation/).
   * @returns {Promise<MetatraderAccountInformation>} promise resolving with account information
   */
  getAccountInformation() {
    return this._websocketClient.getAccountInformation(this._account.id);
  }

  /**
   * Returns positions (see
   * https://metaapi.cloud/docs/client/websocket/api/readTradingTerminalState/readPositions/).
   * @returns {Promise<Array<MetatraderPosition>} promise resolving with array of open positions
   */
  getPositions() {
    return this._websocketClient.getPositions(this._account.id);
  }

  /**
   * Returns specific position (see
   * https://metaapi.cloud/docs/client/websocket/api/readTradingTerminalState/readPosition/).
   * @param {String} positionId position id
   * @return {Promise<MetatraderPosition>} promise resolving with MetaTrader position found
   */
  getPosition(positionId) {
    return this._websocketClient.getPosition(this._account.id, positionId);
  }

  /**
   * Returns open orders (see
   * https://metaapi.cloud/docs/client/websocket/api/readTradingTerminalState/readOrders/).
   * @return {Promise<Array<MetatraderOrder>>} promise resolving with open MetaTrader orders
   */
  getOrders(accountId) {
    return this._websocketClient.getOrders(this._account.id);
  }

  /**
   * Returns specific open order (see
   * https://metaapi.cloud/docs/client/websocket/api/readTradingTerminalState/readOrder/).
   * @param {String} orderId order id (ticket number)
   * @return {Promise<MetatraderOrder>} promise resolving with metatrader order found
   */
  getOrder(orderId) {
    return this._websocketClient.getOrder(this._account.id, orderId);
  }

  /**
   * Returns the history of completed orders for a specific ticket number (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveHistoricalData/readHistoryOrdersByTicket/).
   * @param {String} ticket ticket number (order id)
   * @returns {Promise<MetatraderHistoryOrders>} promise resolving with request results containing history orders found
   */
  getHistoryOrdersByTicket(ticket) {
    return this._websocketClient.getHistoryOrdersByTicket(this._account.id, ticket);
  }

  /**
   * Returns the history of completed orders for a specific position id (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveHistoricalData/readHistoryOrdersByPosition/)
   * @param {String} positionId position id
   * @returns {Promise<MetatraderHistoryOrders>} promise resolving with request results containing history orders found
   */
  getHistoryOrdersByPosition(positionId) {
    return this._websocketClient.getHistoryOrdersByPosition(this._account.id, positionId);
  }

  /**
   * Returns the history of completed orders for a specific time range (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveHistoricalData/readHistoryOrdersByTimeRange/)
   * @param {Date} startTime start of time range, inclusive
   * @param {Date} endTime end of time range, exclusive
   * @param {Number} offset pagination offset, default is 0
   * @param {Number} limit pagination limit, default is 1000
   * @returns {Promise<MetatraderHistoryOrders>} promise resolving with request results containing history orders found
   */
  getHistoryOrdersByTimeRange(startTime, endTime, offset = 0, limit = 1000) {
    return this._websocketClient.getHistoryOrdersByTimeRange(this._account.id, startTime, endTime, offset, limit);
  }

  /**
   * Returns history deals with a specific ticket number (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveHistoricalData/readDealsByTicket/).
   * @param {String} ticket ticket number (deal id for MT5 or order id for MT4)
   * @returns {Promise<MetatraderDeals>} promise resolving with request results containing deals found
   */
  getDealsByTicket(ticket) {
    return this._websocketClient.getDealsByTicket(this._account.id, ticket);
  }

  /**
   * Returns history deals for a specific position id (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveHistoricalData/readDealsByPosition/).
   * @param {String} positionId position id
   * @returns {Promise<MetatraderDeals>} promise resolving with request results containing deals found
   */
  getDealsByPosition(positionId) {
    return this._websocketClient.getDealsByPosition(this._account.id, positionId);
  }

  /**
   * Returns history deals with for a specific time range (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveHistoricalData/readDealsByTimeRange/).
   * @param {Date} startTime start of time range, inclusive
   * @param {Date} endTime end of time range, exclusive
   * @param {Number} offset pagination offset, default is 0
   * @param {Number} limit pagination limit, default is 1000
   * @returns {Promise<MetatraderDeals>} promise resolving with request results containing deals found
   */
  getDealsByTimeRange(startTime, endTime, offset = 0, limit = 1000) {
    return this._websocketClient.getDealsByTimeRange(this._account.id, startTime, endTime, offset, limit);
  }

  /**
   * Clears the order and transaction history of a specified account so that it can be synchronized from scratch (see
   * https://metaapi.cloud/docs/client/websocket/api/removeHistory/).
   * @return {Promise} promise resolving when the history is cleared
   */
  removeHistory() {
    return this._websocketClient.removeHistory(this._account.id);
  }

  /**
   * Creates a market buy order (see https://metaapi.cloud/docs/client/websocket/api/trade/).
   * @param {String} symbol symbol to trade
   * @param {Number} volume order volume
   * @param {Number} stopLoss optional stop loss price
   * @param {Number} takeProfit optional take profit price
   * @param {String} comment optional order comment. The sum of the line lengths of the comment and the clientId
   * must be less than or equal to 27. For more information see https://metaapi.cloud/docs/client/clientIdUsage/
   * @param {String} clientId optional client-assigned id. The id value can be assigned when submitting a trade and
   * will be present on position, history orders and history deals related to the trade. You can use this field to bind
   * your trades to objects in your application and then track trade progress. The sum of the line lengths of the
   * comment and the clientId must be less than or equal to 27. For more information see
   * https://metaapi.cloud/docs/client/clientIdUsage/
   * @returns {Promise<TradeResponse>} promise resolving with trade result
   * @throws {TradeError} on trade error
   */
  createMarketBuyOrder(symbol, volume, stopLoss, takeProfit, comment, clientId) {
    return this._websocketClient.trade(this._account.id, {actionType: 'ORDER_TYPE_BUY', symbol, volume, stopLoss,
      takeProfit, comment, clientId});
  }

  /**
   * Creates a market sell order (see https://metaapi.cloud/docs/client/websocket/api/trade/).
   * @param {String} symbol symbol to trade
   * @param {Number} volume order volume
   * @param {Number} stopLoss optional stop loss price
   * @param {Number} takeProfit optional take profit price
   * @param {String} comment optional order comment. The sum of the line lengths of the comment and the clientId
   * must be less than or equal to 27. For more information see https://metaapi.cloud/docs/client/clientIdUsage/
   * @param {String} clientId optional client-assigned id. The id value can be assigned when submitting a trade and
   * will be present on position, history orders and history deals related to the trade. You can use this field to bind
   * your trades to objects in your application and then track trade progress. The sum of the line lengths of the
   * comment and the clientId must be less than or equal to 27. For more information see
   * https://metaapi.cloud/docs/client/clientIdUsage/
   * @returns {Promise<TradeResponse>} promise resolving with trade result
   * @throws {TradeError} on trade error
   */
  createMarketSellOrder(symbol, volume, stopLoss, takeProfit, comment, clientId) {
    return this._websocketClient.trade(this._account.id, {actionType: 'ORDER_TYPE_SELL', symbol, volume, stopLoss,
      takeProfit, comment, clientId});
  }

  /**
   * Creates a limit buy order (see https://metaapi.cloud/docs/client/websocket/api/trade/).
   * @param {String} symbol symbol to trade
   * @param {Number} volume order volume
   * @param {Number} openPrice order limit price
   * @param {Number} stopLoss optional stop loss price
   * @param {Number} takeProfit optional take profit price
   * @param {String} comment optional order comment. The sum of the line lengths of the comment and the clientId
   * must be less than or equal to 27. For more information see https://metaapi.cloud/docs/client/clientIdUsage/
   * @param {String} clientId optional client-assigned id. The id value can be assigned when submitting a trade and
   * will be present on position, history orders and history deals related to the trade. You can use this field to bind
   * your trades to objects in your application and then track trade progress. The sum of the line lengths of the
   * comment and the clientId must be less than or equal to 27. For more information see
   * https://metaapi.cloud/docs/client/clientIdUsage/
   * @returns {Promise<TradeResponse>} promise resolving with trade result
   * @throws {TradeError} on trade error
   */
  createLimitBuyOrder(symbol, volume, openPrice, stopLoss, takeProfit, comment, clientId) {
    return this._websocketClient.trade(this._account.id, {actionType: 'ORDER_TYPE_BUY_LIMIT', symbol, volume, openPrice,
      stopLoss, takeProfit, comment, clientId});
  }

  /**
   * Creates a limit sell order (see https://metaapi.cloud/docs/client/websocket/api/trade/).
   * @param {String} symbol symbol to trade
   * @param {Number} volume order volume
   * @param {Number} openPrice order limit price
   * @param {Number} stopLoss optional stop loss price
   * @param {Number} takeProfit optional take profit price
   * @param {String} comment optional order comment. The sum of the line lengths of the comment and the clientId
   * must be less than or equal to 27. For more information see https://metaapi.cloud/docs/client/clientIdUsage/
   * @param {String} clientId optional client-assigned id. The id value can be assigned when submitting a trade and
   * will be present on position, history orders and history deals related to the trade. You can use this field to bind
   * your trades to objects in your application and then track trade progress. The sum of the line lengths of the
   * comment and the clientId must be less than or equal to 27. For more information see
   * https://metaapi.cloud/docs/client/clientIdUsage/
   * @returns {Promise<TradeResponse>} promise resolving with trade result
   * @throws {TradeError} on trade error
   */
  createLimitSellOrder(symbol, volume, openPrice, stopLoss, takeProfit, comment, clientId) {
    return this._websocketClient.trade(this._account.id, {actionType: 'ORDER_TYPE_SELL_LIMIT', symbol, volume,
      openPrice, stopLoss, takeProfit, comment, clientId});
  }

  /**
   * Creates a stop buy order (see https://metaapi.cloud/docs/client/websocket/api/trade/).
   * @param {String} symbol symbol to trade
   * @param {Number} volume order volume
   * @param {Number} openPrice order stop price
   * @param {Number} stopLoss optional stop loss price
   * @param {Number} takeProfit optional take profit price
   * @param {String} comment optional order comment. The sum of the line lengths of the comment and the clientId
   * must be less than or equal to 27. For more information see https://metaapi.cloud/docs/client/clientIdUsage/
   * @param {String} clientId optional client-assigned id. The id value can be assigned when submitting a trade and
   * will be present on position, history orders and history deals related to the trade. You can use this field to bind
   * your trades to objects in your application and then track trade progress. The sum of the line lengths of the
   * comment and the clientId must be less than or equal to 27. For more information see
   * https://metaapi.cloud/docs/client/clientIdUsage/
   * @returns {Promise<TradeResponse>} promise resolving with trade result
   * @throws {TradeError} on trade error
   */
  createStopBuyOrder(symbol, volume, openPrice, stopLoss, takeProfit, comment, clientId) {
    return this._websocketClient.trade(this._account.id, {actionType: 'ORDER_TYPE_BUY_STOP', symbol, volume, openPrice,
      stopLoss, takeProfit, comment, clientId});
  }

  /**
   * Creates a stop sell order (see https://metaapi.cloud/docs/client/websocket/api/trade/).
   * @param {String} symbol symbol to trade
   * @param {Number} volume order volume
   * @param {Number} openPrice order stop price
   * @param {Number} stopLoss optional stop loss price
   * @param {Number} takeProfit optional take profit price
   * @param {String} comment optional order comment. The sum of the line lengths of the comment and the clientId
   * must be less than or equal to 27. For more information see https://metaapi.cloud/docs/client/clientIdUsage/
   * @param {String} clientId optional client-assigned id. The id value can be assigned when submitting a trade and
   * will be present on position, history orders and history deals related to the trade. You can use this field to bind
   * your trades to objects in your application and then track trade progress. The sum of the line lengths of the
   * comment and the clientId must be less than or equal to 27. For more information see
   * https://metaapi.cloud/docs/client/clientIdUsage/
   * @returns {Promise<TradeResponse>} promise resolving with trade result
   * @throws {TradeError} on trade error
   */
  createStopSellOrder(symbol, volume, openPrice, stopLoss, takeProfit, comment, clientId) {
    return this._websocketClient.trade(this._account.id, {actionType: 'ORDER_TYPE_SELL_STOP', symbol, volume, openPrice,
      stopLoss, takeProfit, comment, clientId});
  }

  /**
   * Modifies a position (see https://metaapi.cloud/docs/client/websocket/api/trade/).
   * @param {String} positionId position id to modify
   * @param {Number} stopLoss optional stop loss price
   * @param {Number} takeProfit optional take profit price
   * @returns {Promise<TradeResponse>} promise resolving with trade result
   * @throws {TradeError} on trade error
   */
  modifyPosition(positionId, stopLoss, takeProfit) {
    return this._websocketClient.trade(this._account.id, {actionType: 'POSITION_MODIFY', positionId, stopLoss,
      takeProfit});
  }

  /**
   * Partially closes a position (see https://metaapi.cloud/docs/client/websocket/api/trade/).
   * @param {String} positionId position id to modify
   * @param {Number} volume volume to close
   * @param {String} comment optional order comment. The sum of the line lengths of the comment and the clientId
   * must be less than or equal to 27. For more information see https://metaapi.cloud/docs/client/clientIdUsage/
   * @param {String} clientId optional client-assigned id. The id value can be assigned when submitting a trade and
   * will be present on position, history orders and history deals related to the trade. You can use this field to bind
   * your trades to objects in your application and then track trade progress. The sum of the line lengths of the
   * comment and the clientId must be less than or equal to 27. For more information see
   * https://metaapi.cloud/docs/client/clientIdUsage/
   * @returns {Promise<TradeResponse>} promise resolving with trade result
   * @throws {TradeError} on trade error
   */
  closePositionPartially(positionId, volume, comment, clientId) {
    return this._websocketClient.trade(this._account.id, {actionType: 'POSITION_PARTIAL', positionId, volume, comment,
      clientId});
  }

  /**
   * Fully closes a position (see https://metaapi.cloud/docs/client/websocket/api/trade/).
   * @param {String} positionId position id to modify
   * @param {String} comment optional order comment. The sum of the line lengths of the comment and the clientId
   * must be less than or equal to 27. For more information see https://metaapi.cloud/docs/client/clientIdUsage/
   * @param {String} clientId optional client-assigned id. The id value can be assigned when submitting a trade and
   * will be present on position, history orders and history deals related to the trade. You can use this field to bind
   * your trades to objects in your application and then track trade progress. The sum of the line lengths of the
   * comment and the clientId must be less than or equal to 27. For more information see
   * https://metaapi.cloud/docs/client/clientIdUsage/
   * @returns {Promise<TradeResponse>} promise resolving with trade result
   * @throws {TradeError} on trade error
   */
  closePosition(positionId, comment, clientId) {
    return this._websocketClient.trade(this._account.id, {actionType: 'POSITION_CLOSE_ID', positionId, comment,
      clientId});
  }

  /**
   * Closes position by a symbol. Available on MT5 netting accounts only. (see
   * https://metaapi.cloud/docs/client/websocket/api/trade/).
   * @param {String} symbol symbol to trade
   * @param {String} comment optional order comment. The sum of the line lengths of the comment and the clientId
   * must be less than or equal to 27. For more information see https://metaapi.cloud/docs/client/clientIdUsage/
   * @param {String} clientId optional client-assigned id. The id value can be assigned when submitting a trade and
   * will be present on position, history orders and history deals related to the trade. You can use this field to bind
   * your trades to objects in your application and then track trade progress. The sum of the line lengths of the
   * comment and the clientId must be less than or equal to 27. For more information see
   * https://metaapi.cloud/docs/client/clientIdUsage/
   * @returns {Promise<TradeResponse>} promise resolving with trade result
   * @throws {TradeError} on trade error
   */
  closePositionBySymbol(symbol, comment, clientId) {
    return this._websocketClient.trade(this._account.id, {actionType: 'POSITION_CLOSE_SYMBOL', symbol, comment,
      clientId});
  }

  /**
   * Modifies a pending order (see https://metaapi.cloud/docs/client/websocket/api/trade/).
   * @param {String} orderId order id (ticket number)
   * @param {Number} openPrice order stop price
   * @param {Number} stopLoss optional stop loss price
   * @param {Number} takeProfit optional take profit price
   * @returns {Promise<TradeResponse>} promise resolving with trade result
   * @throws {TradeError} on trade error
   */
  modifyOrder(orderId, openPrice, stopLoss, takeProfit) {
    return this._websocketClient.trade(this._account.id, {actionType: 'ORDER_MODIFY', orderId, openPrice,
      stopLoss, takeProfit});
  }

  /**
   * Cancels order (see https://metaapi.cloud/docs/client/websocket/api/trade/).
   * @param {String} orderId order id (ticket number)
   * @returns {Promise<TradeResponse>} promise resolving with trade result
   * @throws {TradeError} on trade error
   */
  cancelOrder(orderId) {
    return this._websocketClient.trade(this._account.id, {actionType: 'ORDER_CANCEL', orderId});
  }

  /**
   * Reconnects to the Metatrader terminal (see https://metaapi.cloud/docs/client/websocket/api/reconnect/).
   * @returns {Promise} promise which resolves when reconnection started
   */
  reconnect() {
    return this._websocketClient.reconnect(this._account.id);
  }

  /**
   * Requests the terminal to start synchronization process. Use it if user synchronization mode is set to user for the
   * account (see https://metaapi.cloud/docs/client/websocket/synchronizing/synchronize/). Use only for user
   * synchronization mode.
   * @returns {Promise} promise which resolves when synchronization started
   */
  async synchronize() {
    if (this._account.synchronizationMode === 'user') {
      let startingHistoryOrderTime = await this._historyStorage.lastHistoryOrderTime();
      let startingDealTime = await this._historyStorage.lastDealTime();
      let synchronizationId = randomstring.generate(32);
      this._lastSynchronizationId = synchronizationId;
      return this._websocketClient.synchronize(this._account.id, synchronizationId, startingHistoryOrderTime,
        startingDealTime);
    }
  }

  /**
   * Initiates subscription to MetaTrader terminal
   * @returns {Promise} promise which resolves when subscription is initiated
   */
  async subscribe() {
    return this._websocketClient.subscribe(this._account.id);
  }

  /**
   * Subscribes on market data of specified symbol (see
   * https://metaapi.cloud/docs/client/websocket/marketDataStreaming/subscribeToMarketData/).
   * @param {String} symbol symbol (e.g. currency pair or an index)
   * @returns {Promise} promise which resolves when subscription request was processed
   */
  subscribeToMarketData(symbol) {
    return this._websocketClient.subscribeToMarketData(this._account.id, symbol);
  }

  /**
   * Retrieves specification for a symbol (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveMarketData/getSymbolSpecification/).
   * @param {String} symbol symbol to retrieve specification for
   * @returns {Promise} promise which resolves when specification is retrieved
   */
  getSymbolSpecification(symbol) {
    return this._websocketClient.getSymbolSpecification(this._account.id, symbol);
  }

  /**
   * Retrieves specification for a symbol (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveMarketData/getSymbolPrice/).
   * @param {String} symbol symbol to retrieve price for
   * @returns {Promise} promise which resolves when price is retrieved
   */
  getSymbolPrice(symbol) {
    return this._websocketClient.getSymbolPrice(this._account.id, symbol);
  }

  /**
   * Returns local copy of terminal state. Use this method for accounts in user synchronization mode
   * @returns {TerminalState} local copy of terminal state
   */
  get terminalState() {
    return this._terminalState;
  }

  /**
   * Returns local history storage. Use this method for accounts in user synchronization mode
   * @returns {HistoryStorage} local history storage
   */
  get historyStorage() {
    return this._historyStorage;
  }

  /**
   * Adds synchronization listener. Use this method for accounts in user synchronization mode
   * @param {SynchronizationListener} listener synchronization listener to add
   */
  addSynchronizationListener(listener) {
    if (this._account.synchronizationMode === 'user') {
      this._websocketClient.addSynchronizationListener(this._account.id, listener);
    }
  }

  /**
   * Removes synchronization listener for specific account. Use this method for accounts in user synchronization mode
   * @param {SynchronizationListener} listener synchronization listener to remove
   */
  removeSynchronizationListener(listener) {
    if (this._account.synchronizationMode === 'user') {
      this._websocketClient.removeSynchronizationListener(this._account.id, listener);
    }
  }

  /**
   * Invoked when connection to MetaTrader terminal established
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onConnected() {
    await this.synchronize();
  }

  /**
   * Invoked when connection to MetaTrader terminal terminated
   */
  onDisconnected() {
    this._lastSynchronizationId = undefined;
  }

  /**
   * Invoked when a synchronization of history deals on a MetaTrader account have finished
   * @param {String} synchronizationId synchronization request id
   */
  async onDealSynchronizationFinished(synchronizationId) {
    this._dealsSynchronized[synchronizationId] = true;
  }

  /**
   * Invoked when a synchronization of history orders on a MetaTrader account have finished
   * @param {String} synchronizationId synchronization request id
   */
  async onOrderSynchronizationFinished(synchronizationId) {
    this._ordersSynchronized[synchronizationId] = true;
  }

  /**
   * Invoked when connection to MetaApi websocket API restored after a disconnect
   * @return {Promise} promise which resolves when connection to MetaApi websocket API restored after a disconnect
   */
  async onReconnected() {
    await this.subscribe();
  }

  /**
   * Returns flag indicating status of state synchronization with MetaTrader terminal
   * @param {String} synchronizationId optional synchronization request id, last synchronization request id will be used
   * by default
   * @return {Promise<Boolean>} promise resolving with a flag indicating status of state synchronization with MetaTrader
   * terminal
   */
  async isSynchronized(synchronizationId) {
    synchronizationId = synchronizationId || this._lastSynchronizationId;
    if (this._account.synchronizationMode === 'user') {
      return !!this._ordersSynchronized[synchronizationId] && !!this._dealsSynchronized[synchronizationId];
    } else {
      let result = await this.getDealsByTimeRange(new Date(), new Date());
      return !result.synchronizing;
    }
  }

  /**
   * Waits until synchronization to MetaTrader terminal is completed
   * @param {String} synchronizationId optional synchronization id, last synchronization request id will be used by
   * default
   * @param {Number} timeoutInSeconds wait timeout in seconds, default is 5m
   * @param {Number} intervalInMilliseconds interval between account reloads while waiting for a change, default is 1s
   * @return {Promise} promise which resolves when synchronization to MetaTrader terminal is completed
   * @throws {TimeoutError} if application failed to synchronize with the teminal withing timeout allowed
   */
  async waitSynchronized(synchronizationId = undefined, timeoutInSeconds = 300, intervalInMilliseconds = 1000) {
    let startTime = Date.now();
    while (!(await this.isSynchronized(synchronizationId)) && (startTime + timeoutInSeconds * 1000) > Date.now()) {
      await new Promise(res => setTimeout(res, intervalInMilliseconds));
    }
    if (!(await this.isSynchronized(synchronizationId))) {
      throw new TimeoutError('Timed out waiting for MetaApi to synchronize to MetaTrader account ' +
        this._account.id + ', synchronization id ' + synchronizationId);
    }
  }

  /**
   * Closes the connection. The instance of the class should no longer be used after this method is invoked.
   */
  close() {
    if (this._account.synchronizationMode === 'user') {
      this._websocketClient.removeSynchronizationListener(this._account.id, this);
      this._websocketClient.removeSynchronizationListener(this._account.id, this._terminalState);
      this._websocketClient.removeSynchronizationListener(this._account.id, this._historyStorage);
    }
  }

}

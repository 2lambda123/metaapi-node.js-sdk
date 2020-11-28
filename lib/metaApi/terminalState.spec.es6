'use strict';

import should from 'should';
import sinon from 'sinon';
import TerminalState from './terminalState';

/**
 * @test {TerminalState}
 */
describe('TerminalState', () => {

  let state;

  beforeEach(() => {
    state = new TerminalState();
  });

  /**
   * @test {TerminalState#onConnected}
   * @test {TerminalState#onDisconnected}
   * @test {TerminalState#connected}
   */
  it('should return connection state', () => {
    state.connected.should.be.false();
    state.onConnected();
    state.connected.should.be.true();
    state.onDisconnected();
    state.connected.should.be.false();
  });

  /**
   * @test {TerminalState#onBrokerConnectionStatus}
   * @test {TerminalState#connectedToBroker}
   */
  it('should return broker connection state', async () => {
    const clock = sinon.useFakeTimers();
    state.connectedToBroker.should.be.false();
    state.onBrokerConnectionStatusChanged(true);
    state.connectedToBroker.should.be.true();
    state.onBrokerConnectionStatusChanged(false);
    state.connectedToBroker.should.be.false();
    state.onBrokerConnectionStatusChanged(true);
    state.onDisconnected();
    state.connectedToBroker.should.be.false();
    await clock.tickAsync(65000);
    clock.restore();
  });

  /**
   * @test {TerminalState#onBrokerConnectionStatus}
   */
  it('should call an onDisconnect if there was no signal for a long time', async () => {
    const clock = sinon.useFakeTimers();
    state.onBrokerConnectionStatusChanged(true);
    await clock.tickAsync(65000);
    state.connectedToBroker.should.be.false();
    state.connected.should.be.false();
    clock.restore();
  });

  /**
   * @test {TerminalState#onAccountInformationUpdated}
   * @test {TerminalState#accountInformation}
   */
  it('should return account information', () => {
    should.not.exist(state.accountInformation);
    state.onAccountInformationUpdated({balance: 1000});
    state.accountInformation.should.match({balance: 1000});
  });

  /**
   * @test {TerminalState#onPositionUpdated}
   * @test {TerminalState#onPositionRemoved}
   * @test {TerminalState#positions}
   */
  it('should return positions', () => {
    state.positions.length.should.equal(0);
    state.onPositionUpdated({id: '1', profit: 10});
    state.onPositionUpdated({id: '2'});
    state.onPositionUpdated({id: '1', profit: 11});
    state.onPositionRemoved('2');
    state.positions.length.should.equal(1);
    state.positions.should.match([{id: '1', profit: 11}]);
  });

  /**
   * @test {TerminalState#onOrderUpdated}
   * @test {TerminalState#onOrderCompleted}
   * @test {TerminalState#orders}
   */
  it('should return orders', () => {
    state.orders.length.should.equal(0);
    state.onOrderUpdated({id: '1', openPrice: 10});
    state.onOrderUpdated({id: '2'});
    state.onOrderUpdated({id: '1', openPrice: 11});
    state.onOrderCompleted('2');
    state.orders.length.should.equal(1);
    state.orders.should.match([{id: '1', openPrice: 11}]);
  });

  /**
   * @test {TerminalState#onSymbolSpecificationUpdated}
   * @test {TerminalState#specifications}
   * @test {TerminalState#specification}
   */
  it('should return specifications', () => {
    state.specifications.length.should.equal(0);
    state.onSymbolSpecificationUpdated({symbol: 'EURUSD', tickSize: 0.00001});
    state.onSymbolSpecificationUpdated({symbol: 'GBPUSD'});
    state.onSymbolSpecificationUpdated({symbol: 'EURUSD', tickSize: 0.0001});
    state.specifications.length.should.equal(2);
    state.specifications.should.match([{symbol: 'EURUSD', tickSize: 0.0001}, {symbol: 'GBPUSD'}]);
    state.specification('EURUSD').should.match({symbol: 'EURUSD', tickSize: 0.0001});
  });

  /**
   * @test {TerminalState#onSymbolPricesUpdated}
   * @test {TerminalState#price}
   */
  it('should return price', () => {
    should.not.exist(state.price('EURUSD'));
    state.onSymbolPricesUpdated([{symbol: 'EURUSD', bid: 1, ask: 1.1}]);
    state.onSymbolPricesUpdated([{symbol: 'GBPUSD'}]);
    state.onSymbolPricesUpdated([{symbol: 'EURUSD', bid: 1, ask: 1.2}]);
    state.price('EURUSD').should.match({symbol: 'EURUSD', bid: 1, ask: 1.2});
  });

  /**
   * @test {TerminalState#onSymbolPricesUpdated}
   * @test {TerminalState#accountInformation}
   * @test {TerminalState#positions}
   */
  it('should update account equity and position profit on price update', () => {
    state.onAccountInformationUpdated({equity: 1000, balance: 800});
    state.onPositionsReplaced([{
      id: '1',
      symbol: 'EURUSD',
      type: 'POSITION_TYPE_BUY',
      currentPrice: 9,
      currentTickValue: 0.5,
      openPrice: 8,
      profit: 100,
      volume: 2
    }]);
    state.onPositionUpdated({
      id: '2',
      symbol: 'AUDUSD',
      type: 'POSITION_TYPE_BUY',
      currentPrice: 9,
      currentTickValue: 0.5,
      openPrice: 8,
      profit: 100,
      volume: 2
    });
    state.onSymbolSpecificationUpdated({symbol: 'EURUSD', tickSize: 0.01});
    state.onSymbolSpecificationUpdated({symbol: 'AUDUSD', tickSize: 0.01});
    state.onSymbolPricesUpdated([
      {
        symbol: 'EURUSD',
        profitTickValue: 0.5,
        lossTickValue: 0.5,
        bid: 10,
        ask: 11
      },
      {
        symbol: 'AUDUSD',
        profitTickValue: 0.5,
        lossTickValue: 0.5,
        bid: 10,
        ask: 11
      }
    ]);
    state.positions.map(p => p.profit).should.match([200, 200]);
    state.positions.map(p => p.unrealizedProfit).should.match([200, 200]);
    state.positions.map(p => p.currentPrice).should.match([10, 10]);
    state.accountInformation.equity.should.equal(1200);
  });

  /**
   * @test {TerminalState#onSymbolPriceUpdated}
   * @test {TerminalState#orders}
   */
  it('should update order currentPrice on price update', () => {
    state.onOrderUpdated({
      id: '1',
      symbol: 'EURUSD',
      type: 'ORDER_TYPE_BUY_LIMIT',
      currentPrice: 9
    });
    state.onOrderUpdated({
      id: '2',
      symbol: 'AUDUSD',
      type: 'ORDER_TYPE_SELL_LIMIT',
      currentPrice: 9
    });
    state.onSymbolSpecificationUpdated({symbol: 'EURUSD', tickSize: 0.01});
    state.onSymbolPricesUpdated([{
      symbol: 'EURUSD',
      profitTickValue: 0.5,
      lossTickValue: 0.5,
      bid: 10,
      ask: 11
    }]);
    state.orders.map(o => o.currentPrice).should.match([11, 9]);
  });

});

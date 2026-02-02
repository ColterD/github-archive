# Cryptocurrency Algorithmic Trading System

A comprehensive, modular cryptocurrency trading system designed to maximize profits through automated trading strategies. This system is built using free and open-source tools and can be deployed on Windows and Linux environments.

## Features

- **High Performance Architecture**: Designed to capture both long-term trends and extremely short-lived opportunities
- **Modular Design**: Easily expandable and maintainable with clear component separation
- **Multiple Trading Strategies**: Includes grid trading, momentum-based, and customizable strategy framework
- **Advanced Risk Management**: Position sizing, stop-loss mechanisms, and exposure controls
- **Comprehensive Backtesting**: Test strategies against historical data with realistic order matching
- **Real-time Analysis**: Processes market data with technical indicators and pattern recognition
- **Multiple Operation Modes**: Backtest, simulation, paper trading, and live trading modes

## System Architecture

The system consists of the following core components:

1. **Data Collection**: Gathers real-time and historical market data from exchanges
2. **Analysis Engine**: Processes market data using technical indicators and pattern recognition
3. **Trading Strategies**: Implements various trading approaches (grid, momentum, etc.)
4. **Risk Management**: Controls position sizing and monitors risk metrics
5. **Backtesting Engine**: Tests strategies against historical data
6. **Execution Engine**: Executes trades on the exchange with precision
7. **System Orchestrator**: Coordinates all components and manages the system lifecycle

## Getting Started

### Prerequisites

- Python 3.8 or higher
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/crypto-trading-system.git
   cd crypto-trading-system
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create configuration files:
   ```bash
   python -m src.core.config
   ```

5. Edit the configuration files in the `config` directory to set up your API keys and trading preferences.

### Running the System

#### Backtesting Mode

Test your strategies against historical data:

```bash
python main.py --config config/backtest.json
```

#### Simulation Mode

Run the system with real-time data but simulated trades:

```bash
python main.py --config config/simulation.json
```

#### Paper Trading Mode

Run the system with real-time data and exchange API but no real trades:

```bash
python main.py --config config/paper.json
```

#### Live Trading Modes

Run the system with real trades using a small amount of capital:

```bash
python main.py --config config/live_micro.json
```

Run the system with full capital allocation:

```bash
python main.py --config config/live_full.json
```

## Configuration

The system is configured using JSON files in the `config` directory. The main configuration options include:

- **Exchange Settings**: API keys, rate limits, and fees
- **Market Selection**: Which markets to trade
- **Strategy Parameters**: Settings for the trading strategies
- **Risk Parameters**: Position sizing and risk controls
- **System Settings**: Logging, data storage, and operational mode

Example configuration:

```json
{
  "system": {
    "mode": "simulation",
    "name": "CryptoTradingSystem",
    "version": "0.1.0"
  },
  "exchange": {
    "name": "TradeOgre",
    "api_key": "",
    "api_secret": "",
    "fee_rate": 0.002
  },
  "markets": [
    "BTC-XMR",
    "BTC-ETH",
    "BTC-LTC"
  ],
  "strategy": {
    "type": "grid",
    "params": {
      "grid_levels": 10,
      "grid_spacing_pct": 1.0,
      "price_range_pct": 10.0
    }
  },
  "risk": {
    "max_position_pct": 5.0,
    "max_total_exposure_pct": 30.0,
    "quote_currency": "BTC"
  }
}
```

## Extending the System

### Adding New Strategies

Create a new strategy by inheriting from the base Strategy class:

```python
from src.strategies.base import Strategy, Order

class MyCustomStrategy(Strategy):
    async def generate_signals(self, market_data):
        # Your signal generation logic here
        return signals
        
    async def generate_orders(self, signals, account_data):
        # Your order generation logic here
        return orders
```

### Adding New Indicators

Add new technical indicators to the analysis engine:

```python
from src.analysis.indicators import Indicator

class MyCustomIndicator(Indicator):
    def calculate(self, df):
        # Your indicator calculation logic here
        return df_with_indicator
        
    def generate_signal(self, df):
        # Your signal generation logic here
        return signal
```

### Adding New Exchange Support

Implement support for a new exchange:

```python
from src.data_collection.exchange_api import ExchangeAPI

class MyExchangeAPI(ExchangeAPI):
    # Implement the required methods for your exchange
    async def get_markets(self):
        # ...
```

## Warning and Disclaimer

**Trading cryptocurrencies involves significant risk and can result in the loss of your invested capital. This software is provided for educational and research purposes only. Use it at your own risk.**

The creators and contributors of this system are not responsible for any financial losses incurred from using this software. Always start with small amounts of capital and thoroughly test any strategy before deploying it with substantial funds.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [CCXT](https://github.com/ccxt/ccxt) - Cryptocurrency exchange trading library
- [TA-Lib](https://github.com/mrjbq7/ta-lib) - Technical analysis library
- [Pandas](https://github.com/pandas-dev/pandas) - Data analysis library
- [AsyncIO](https://docs.python.org/3/library/asyncio.html) - Asynchronous I/O library
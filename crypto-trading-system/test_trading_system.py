"""
Basic end-to-end test script for the cryptocurrency trading system.
"""

import os
import sys
import asyncio
import logging
import json
from datetime import datetime, timedelta
import pandas as pd
import argparse

# Try to load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Add src directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Import modules
from src.modules.data_collection.tradeogre_api import TradeOgreAPI
from src.modules.data_collection.simple_storage import SimpleStorage
from src.modules.analysis.basic_indicators import analyze_market_data
from src.modules.strategies.basic_grid import BasicGridStrategy, Order

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('data/logs/test_run.log')
    ]
)

logger = logging.getLogger("test_script")

async def collect_market_data(api: TradeOgreAPI, markets: list) -> dict:
    """
    Collect market data for specified markets.
    
    Args:
        api: TradeOgre API instance
        markets: List of markets to collect data for
        
    Returns:
        Dictionary of market data
    """
    market_data = {}
    
    for market in markets:
        try:
            logger.info(f"Collecting data for {market}...")
            data = await api.get_market_data(market)
            market_data[market] = data
            logger.info(f"Collected data for {market} - Price: {data['ticker']['price']}")
        except Exception as e:
            logger.error(f"Error collecting data for {market}: {e}")
    
    return market_data

async def store_market_data(storage: SimpleStorage, market_data: dict) -> bool:
    """
    Store market data in storage.
    
    Args:
        storage: Storage instance
        market_data: Market data to store
        
    Returns:
        Success status
    """
    success = True
    
    for market, data in market_data.items():
        try:
            logger.info(f"Storing data for {market}...")
            result = storage.store_market_data(data)
            if result:
                logger.info(f"Successfully stored data for {market}")
            else:
                logger.warning(f"Failed to store some data for {market}")
                success = False
        except Exception as e:
            logger.error(f"Error storing data for {market}: {e}")
            success = False
    
    return success

def create_candles(storage: SimpleStorage, market: str, timeframe_minutes: int = 60) -> pd.DataFrame:
    """
    Create OHLCV candles from stored ticker data.
    
    Args:
        storage: Storage instance
        market: Market symbol
        timeframe_minutes: Candle timeframe in minutes
        
    Returns:
        DataFrame with OHLCV candles
    """
    logger.info(f"Creating {timeframe_minutes}m candles for {market}...")
    
    # Get ticker history
    ticker_history = storage.get_ticker_history(market, days=7)
    logger.info(f"Retrieved {len(ticker_history)} ticker records")
    
    if len(ticker_history) < 10:
        logger.warning(f"Not enough ticker data for {market}")
        return pd.DataFrame()
    
    # Create candles
    candles = storage.create_ohlcv_candles(ticker_history, timeframe_minutes)
    logger.info(f"Created {len(candles)} candles")
    
    return candles

def analyze_candles(candles: pd.DataFrame) -> pd.DataFrame:
    """
    Analyze candles with technical indicators.
    
    Args:
        candles: DataFrame with OHLCV candles
        
    Returns:
        DataFrame with indicators and signals
    """
    if len(candles) < 20:
        logger.warning("Not enough candle data for analysis")
        return candles
    
    logger.info("Analyzing candles with technical indicators...")
    result = analyze_market_data(candles)
    
    # Log signal summary
    buy_signals = result[result['signal'] == 1]
    sell_signals = result[result['signal'] == -1]
    logger.info(f"Analysis complete - Found {len(buy_signals)} buy signals and {len(sell_signals)} sell signals")
    
    return result

async def run_grid_strategy(market: str, market_data: dict, account_data: dict) -> list:
    """
    Run grid strategy on market data.
    
    Args:
        market: Market symbol
        market_data: Market data
        account_data: Account data
        
    Returns:
        List of generated orders
    """
    logger.info(f"Running grid strategy for {market}...")
    
    # Configure strategy
    config = {
        "grid_levels": 5,
        "grid_spacing_pct": 1.0,
        "price_range_pct": 5.0,
        "position_size_pct": 2.0
    }
    
    strategy = BasicGridStrategy(config)
    
    # Get current price
    current_price = market_data[market]['ticker']['price']
    logger.info(f"Current price: {current_price}")
    
    # Generate grid orders
    orders = strategy.generate_grid_orders(market, current_price, account_data)
    logger.info(f"Generated {len(orders)} grid orders")
    
    # Log orders
    for i, order in enumerate(orders):
        logger.info(f"Order {i+1}: {order}")
    
    return orders

async def simulate_filled_orders(orders: list, market_data: dict) -> list:
    """
    Simulate filled orders for testing.
    
    Args:
        orders: List of orders
        market_data: Market data
        
    Returns:
        List of filled orders
    """
    logger.info("Simulating order fills...")
    
    filled_orders = []
    
    for i, order in enumerate(orders):
        # Simulate that every 3rd order gets filled
        if i % 3 == 0:
            market = order.market
            current_price = market_data[market]['ticker']['price']
            
            # Check if order would be filled based on price
            if (order.side == "BUY" and order.price >= current_price) or \
               (order.side == "SELL" and order.price <= current_price):
                order.status = "FILLED"
                order.filled_quantity = order.quantity
                order.filled_at = datetime.now()
                filled_orders.append(order)
                logger.info(f"Simulated fill for order: {order}")
    
    logger.info(f"Simulated {len(filled_orders)} order fills")
    return filled_orders

async def main():
    """Main test function."""
    try:
        logger.info("Starting basic end-to-end test...")
        
        # Parse command line arguments
        parser = argparse.ArgumentParser(description="Test the cryptocurrency trading system")
        parser.add_argument("--markets", nargs="+", default=["BTC-XMR", "BTC-ETH"], 
                           help="Markets to test (default: BTC-XMR BTC-ETH)")
        parser.add_argument("--data-dir", default="data/test_run", 
                           help="Directory for test data (default: data/test_run)")
        parser.add_argument("--auth", action="store_true", 
                           help="Use authenticated API endpoints if credentials are available")
        args = parser.parse_args()
        
        # Test markets
        markets = args.markets
        
        # Get API credentials from environment
        api_key = os.environ.get("TRADEOGRE_API_KEY", "")
        api_secret = os.environ.get("TRADEOGRE_API_SECRET", "")
        
        # Only use auth if requested and credentials are available
        use_auth = args.auth and api_key and api_secret
        
        # Sample account data (will be overridden with real data if authenticated)
        account_data = {
            "balances": {
                "BTC": 1.0,
                "XMR": 50.0,
                "ETH": 10.0
            }
        }
        
        # Create API instance
        api = TradeOgreAPI(api_key=api_key if use_auth else "", 
                         api_secret=api_secret if use_auth else "")
        logger.info(f"Using {'authenticated' if use_auth else 'anonymous'} API access")
        
        # Create storage instance
        storage = SimpleStorage(data_dir=args.data_dir, storage_type="sqlite")
        
        # Step 1: Collect market data and account data
        async with api:
            # Collect market data
            market_data = await collect_market_data(api, markets)
            
            if not market_data:
                logger.error("Failed to collect market data")
                return
                
            # Fetch real account data if authenticated
            if use_auth:
                try:
                    logger.info("Fetching real account balances...")
                    balances_response = await api.get_balances()
                    
                    if balances_response.get("success") is True:
                        account_data["balances"] = balances_response.get("balances", {})
                        logger.info(f"Successfully retrieved account balances")
                    else:
                        logger.warning(f"Failed to get account balances: {balances_response.get('error', 'Unknown error')}")
                except Exception as e:
                    logger.error(f"Error fetching account balances: {str(e)}")
        
        # Step 2: Store market data
        success = await store_market_data(storage, market_data)
        
        if not success:
            logger.warning("Some market data could not be stored")
        
        # Step 3: Create and analyze candles
        for market in markets:
            candles = create_candles(storage, market, timeframe_minutes=15)
            
            if len(candles) > 0:
                analyzed_candles = analyze_candles(candles)
                
                # Save analyzed candles for inspection
                output_dir = "data/test_run/analysis"
                os.makedirs(output_dir, exist_ok=True)
                analyzed_candles.to_csv(f"{output_dir}/{market}_analyzed.csv")
                logger.info(f"Saved analyzed candles to {output_dir}/{market}_analyzed.csv")
        
        # Step 4: Run grid strategy
        primary_market = markets[0]  # Use first market for strategy test
        orders = await run_grid_strategy(primary_market, market_data, account_data)
        
        # Step 5: Simulate order fills
        filled_orders = await simulate_filled_orders(orders, market_data)
        
        # Save orders to file for inspection
        output_dir = "data/test_run/orders"
        os.makedirs(output_dir, exist_ok=True)
        
        with open(f"{output_dir}/grid_orders.json", "w") as f:
            json.dump([order.to_dict() for order in orders], f, indent=2)
            
        with open(f"{output_dir}/filled_orders.json", "w") as f:
            json.dump([order.to_dict() for order in filled_orders], f, indent=2)
            
        logger.info(f"Saved orders to {output_dir}/grid_orders.json and {output_dir}/filled_orders.json")
        
        logger.info("Basic end-to-end test completed successfully!")
        
    except Exception as e:
        logger.exception(f"Test failed with error: {e}")

if __name__ == "__main__":
    # Create necessary directories
    os.makedirs("data/logs", exist_ok=True)
    os.makedirs("data/test_run", exist_ok=True)
    
    # Run the test
    asyncio.run(main())
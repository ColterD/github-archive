"""
TradeOgre API connector for cryptocurrency trading system.
Handles market data fetching and trading operations.
Implementation based on official API documentation: https://tradeogre.com/help/api
"""

import logging
import aiohttp
import asyncio
import time
import base64
import os
import json
from typing import Dict, List, Any, Optional
from datetime import datetime
from urllib.parse import urlencode

# Try to load .env file if available
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

logger = logging.getLogger(__name__)

# Fix for Windows event loop issue with aiodns
import sys
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

class TradeOgreAPI:
    """
    API connector for the TradeOgre exchange.
    Supports both public and authenticated endpoints.
    """
    
    BASE_URL = "https://tradeogre.com/api/v1"
    
    def __init__(self, api_key: str = "", api_secret: str = ""):
        """
        Initialize the TradeOgre API connector.
        
        Args:
            api_key: API key for authenticated requests
            api_secret: API secret for request signing
        """
        # Try to get API keys from environment if not provided
        self.api_key = api_key or os.environ.get("TRADEOGRE_API_KEY", "")
        self.api_secret = api_secret or os.environ.get("TRADEOGRE_API_SECRET", "")
        
        self.session = None
        self.last_request_time = 0
        self.min_request_interval = 1.0  # Minimum seconds between requests to avoid rate limits
        
        # Log authentication status
        if self.api_key and self.api_secret:
            logger.info("API credentials found. Authenticated requests available.")
        else:
            logger.info("No API credentials found. Only public endpoints available.")
    
    async def __aenter__(self):
        """Async context manager entry"""
        if self.session is None:
            self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
            self.session = None
    
    async def _make_request(self, method: str, endpoint: str, 
                          params: Optional[Dict] = None, 
                          authenticated: bool = False) -> Dict:
        """
        Make an API request with rate limiting.
        
        Args:
            method: HTTP method (GET, POST)
            endpoint: API endpoint
            params: Request parameters
            authenticated: Whether this is an authenticated request
            
        Returns:
            API response as a dictionary
        """
        # Create session if needed
        if self.session is None:
            self.session = aiohttp.ClientSession()
        
        # Implement basic rate limiting
        current_time = time.time()
        time_since_last_request = current_time - self.last_request_time
        if time_since_last_request < self.min_request_interval:
            await asyncio.sleep(self.min_request_interval - time_since_last_request)
        
        # Prepare the request URL
        url = f"{self.BASE_URL}{endpoint}"
        
        # Set up auth headers if authentication is required
        headers = {}
        if authenticated:
            if not self.api_key or not self.api_secret:
                raise ValueError("API key and secret required for authenticated requests")
            
            # TradeOgre API uses HTTP Basic Auth
            auth_str = f"{self.api_key}:{self.api_secret}"
            encoded_auth = base64.b64encode(auth_str.encode()).decode()
            headers["Authorization"] = f"Basic {encoded_auth}"
        
        try:
            # Make the request
            self.last_request_time = time.time()
            
            if method == "GET":
                query_params = params if params else None
                async with self.session.get(url, params=query_params, headers=headers) as response:
                    response.raise_for_status()
                    return await response.json()
            elif method == "POST":
                # TradeOgre uses form data for POST requests, not JSON
                form_data = params if params else None
                async with self.session.post(url, data=form_data, headers=headers) as response:
                    response.raise_for_status()
                    return await response.json()
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
                
        except aiohttp.ClientResponseError as e:
            logger.error(f"API error: {e.status} - {str(e)}")
            # Try to parse error message from response if available
            try:
                error_text = await e.response.text()
                error_json = json.loads(error_text)
                logger.error(f"API error details: {error_json}")
            except:
                pass
            raise
        except aiohttp.ClientError as e:
            logger.error(f"Request error: {str(e)}")
            raise
    
    # Public API Methods
    
    async def get_markets(self) -> Dict[str, Any]:
        """
        Get list of available markets.
        
        Returns:
            Dictionary with market symbols as keys and 24hr volume as values
        """
        result = await self._make_request("GET", "/markets")
        return result
    
    async def get_ticker(self, market: str) -> Dict[str, Any]:
        """
        Get ticker information for a market.
        
        Args:
            market: Market symbol (e.g. BTC-XMR)
            
        Returns:
            Ticker data including price, volume, etc.
        """
        result = await self._make_request("GET", f"/ticker/{market}")
        
        # Check for error
        if result.get("success") is False:
            logger.error(f"Error fetching ticker for {market}: {result.get('error', 'Unknown error')}")
            return {
                "success": False,
                "error": result.get("error", "Unknown error"),
                "timestamp": datetime.now().timestamp()
            }
        
        # Convert string values to appropriate types
        try:
            return {
                "success": True,
                "initialprice": float(result.get("initialprice", 0)),
                "price": float(result.get("price", 0)),
                "high": float(result.get("high", 0)),
                "low": float(result.get("low", 0)),
                "volume": float(result.get("volume", 0)),
                "bid": float(result.get("bid", 0)),
                "ask": float(result.get("ask", 0)),
                "timestamp": datetime.now().timestamp()
            }
        except (ValueError, TypeError) as e:
            logger.error(f"Error parsing ticker data for {market}: {e}")
            return {
                "success": False,
                "error": f"Data parsing error: {str(e)}",
                "timestamp": datetime.now().timestamp()
            }
    
    async def get_order_book(self, market: str) -> Dict[str, Any]:
        """
        Get order book for a market.
        
        Args:
            market: Market symbol (e.g. BTC-XMR)
            
        Returns:
            Order book with buy and sell orders
        """
        result = await self._make_request("GET", f"/orders/{market}")
        
        # Check for success
        if "buy" not in result or "sell" not in result:
            logger.error(f"Error fetching order book for {market}: {result.get('error', 'Invalid response')}")
            return {
                "success": False,
                "error": result.get("error", "Invalid response"),
                "timestamp": datetime.now().timestamp()
            }
        
        # Normalize buy orders
        buy_orders = []
        for order in result.get("buy", []):
            try:
                buy_orders.append({
                    "price": float(order.get("price", 0)),
                    "quantity": float(order.get("quantity", 0))
                })
            except (ValueError, TypeError):
                continue
        
        # Normalize sell orders
        sell_orders = []
        for order in result.get("sell", []):
            try:
                sell_orders.append({
                    "price": float(order.get("price", 0)),
                    "quantity": float(order.get("quantity", 0))
                })
            except (ValueError, TypeError):
                continue
        
        return {
            "success": True,
            "buy": buy_orders,
            "sell": sell_orders,
            "timestamp": datetime.now().timestamp()
        }
    
    async def get_history(self, market: str) -> List[Dict[str, Any]]:
        """
        Get trade history for a market.
        
        Args:
            market: Market symbol (e.g. BTC-XMR)
            
        Returns:
            List of recent trades
        """
        result = await self._make_request("GET", f"/history/{market}")
        
        # Normalize trade data
        trades = []
        for trade in result:
            try:
                trades.append({
                    "date": int(trade.get("date", 0)),
                    "type": trade.get("type", ""),
                    "price": float(trade.get("price", 0)),
                    "quantity": float(trade.get("quantity", 0))
                })
            except (ValueError, TypeError):
                continue
        
        return trades
    
    async def get_market_data(self, market: str) -> Dict[str, Any]:
        """
        Get comprehensive market data for a market.
        
        Args:
            market: Market symbol (e.g. BTC-XMR)
            
        Returns:
            Dictionary with ticker, order book, and recent trades
        """
        # Get data concurrently for efficiency
        ticker_task = asyncio.create_task(self.get_ticker(market))
        order_book_task = asyncio.create_task(self.get_order_book(market))
        history_task = asyncio.create_task(self.get_history(market))
        
        # Wait for all tasks to complete
        ticker = await ticker_task
        order_book = await order_book_task
        history = await history_task
        
        return {
            "market": market,
            "ticker": ticker,
            "order_book": order_book,
            "history": history,
            "timestamp": datetime.now().timestamp()
        }
        
    # Authenticated API Methods
    
    async def get_balances(self) -> Dict[str, Any]:
        """
        Get account balances.
        
        Returns:
            Dictionary with currency balances
        """
        return await self._make_request("GET", "/account/balances", authenticated=True)
    
    async def get_order(self, uuid: str) -> Dict[str, Any]:
        """
        Get information about a specific order.
        
        Args:
            uuid: Order UUID
            
        Returns:
            Order information
        """
        return await self._make_request("GET", "/account/order", {"uuid": uuid}, authenticated=True)
    
    async def get_orders(self, market: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get open orders.
        
        Args:
            market: Optional market to filter by
            
        Returns:
            List of open orders
        """
        endpoint = "/account/orders"
        if market:
            endpoint = f"{endpoint}/{market}"
        
        return await self._make_request("GET", endpoint, authenticated=True)
    
    async def buy(self, market: str, quantity: float, price: float) -> Dict[str, Any]:
        """
        Place a buy order.
        
        Args:
            market: Market symbol (e.g. BTC-XMR)
            quantity: Order quantity
            price: Order price
            
        Returns:
            Order result
        """
        params = {
            "market": market,
            "quantity": str(quantity),
            "price": str(price)
        }
        
        return await self._make_request("POST", "/order/buy", params, authenticated=True)
    
    async def sell(self, market: str, quantity: float, price: float) -> Dict[str, Any]:
        """
        Place a sell order.
        
        Args:
            market: Market symbol (e.g. BTC-XMR)
            quantity: Order quantity
            price: Order price
            
        Returns:
            Order result
        """
        params = {
            "market": market,
            "quantity": str(quantity),
            "price": str(price)
        }
        
        return await self._make_request("POST", "/order/sell", params, authenticated=True)
    
    async def cancel_order(self, uuid: str) -> Dict[str, Any]:
        """
        Cancel an order.
        
        Args:
            uuid: Order UUID
            
        Returns:
            Cancellation result
        """
        params = {"uuid": uuid}
        
        return await self._make_request("POST", "/order/cancel", params, authenticated=True)

async def test_api():
    """Test function for the TradeOgre API connector."""
    # Log configuration
    logging.basicConfig(level=logging.INFO, 
                      format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    
    # Check for API keys in environment
    api_key = os.environ.get("TRADEOGRE_API_KEY", "")
    api_secret = os.environ.get("TRADEOGRE_API_SECRET", "")
    
    # Create API instance
    api = TradeOgreAPI(api_key=api_key, api_secret=api_secret)
    
    try:
        # Use async context manager
        async with api:
            # Test public endpoints
            logger.info("Testing public API endpoints...")
            
            # Get markets
            logger.info("Getting markets...")
            markets_data = await api.get_markets()
            markets = list(markets_data.keys())
            logger.info(f"Found {len(markets)} markets")
            
            if len(markets) > 0:
                # Use BTC-XMR for testing if available
                test_market = "BTC-XMR"
                if test_market not in markets:
                    test_market = markets[0]
                
                logger.info(f"Testing with market: {test_market}")
                
                # Get ticker
                logger.info("Getting ticker...")
                ticker = await api.get_ticker(test_market)
                if ticker.get("success", False) is not False:
                    logger.info(f"Current price: {ticker.get('price', 'N/A')}")
                else:
                    logger.warning(f"Failed to get ticker: {ticker.get('error', 'Unknown error')}")
                
                # Get order book
                logger.info("Getting order book...")
                order_book = await api.get_order_book(test_market)
                if order_book.get("success", False) is not False:
                    logger.info(f"Top bid: {order_book['buy'][0]['price'] if order_book.get('buy', []) else 'N/A'}")
                    logger.info(f"Top ask: {order_book['sell'][0]['price'] if order_book.get('sell', []) else 'N/A'}")
                else:
                    logger.warning(f"Failed to get order book: {order_book.get('error', 'Unknown error')}")
                
                # Get history
                logger.info("Getting trade history...")
                history = await api.get_history(test_market)
                logger.info(f"Recent trades: {len(history)}")
                
                # Get comprehensive market data
                logger.info("Getting comprehensive market data...")
                market_data = await api.get_market_data(test_market)
                logger.info(f"Market data timestamp: {market_data['timestamp']}")
            
            # Test authenticated endpoints if API keys are provided
            if api_key and api_secret:
                logger.info("\nTesting authenticated API endpoints...")
                
                try:
                    # Get account balances
                    logger.info("Getting account balances...")
                    balances = await api.get_balances()
                    
                    if balances.get("success") is True:
                        balance_count = len(balances.get("balances", {}))
                        logger.info(f"Successfully retrieved {balance_count} balances")
                    else:
                        logger.warning(f"Failed to get balances: {balances.get('error', 'Unknown error')}")
                    
                    # Get open orders
                    logger.info("Getting open orders...")
                    open_orders = await api.get_orders()
                    
                    if isinstance(open_orders, list):
                        logger.info(f"Successfully retrieved {len(open_orders)} open orders")
                    else:
                        logger.warning(f"Failed to get open orders: {open_orders.get('error', 'Unknown error')}")
                    
                except Exception as auth_err:
                    logger.error(f"Authenticated API test error: {str(auth_err)}")
            else:
                logger.info("\nSkipping authenticated API tests (no API keys provided)")
            
            logger.info("\nAPI tests completed")
    except Exception as e:
        logger.error(f"API test error: {str(e)}")

if __name__ == "__main__":
    # Run the test function
    asyncio.run(test_api())
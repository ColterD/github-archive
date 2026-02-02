"""
Basic grid trading strategy for cryptocurrency trading system.
"""

import logging
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime

logger = logging.getLogger(__name__)

class Order:
    """Simple order class for the basic grid strategy."""
    
    def __init__(self, market: str, side: str, price: float, quantity: float,
               order_type: str = "LIMIT", order_id: Optional[str] = None):
        """
        Initialize an order.
        
        Args:
            market: Market symbol (e.g., "BTC-XMR")
            side: Order side ("BUY" or "SELL")
            price: Order price
            quantity: Order quantity
            order_type: Order type ("LIMIT" or "MARKET")
            order_id: Optional order ID
        """
        self.market = market
        self.side = side
        self.price = price
        self.quantity = quantity
        self.order_type = order_type
        self.order_id = order_id or f"{side}_{market}_{price}_{datetime.now().timestamp()}"
        self.status = "NEW"
        self.filled_quantity = 0.0
        self.created_at = datetime.now()
        self.filled_at = None
    
    def __repr__(self) -> str:
        """String representation of the order."""
        return (f"Order({self.order_id}, {self.market}, {self.side}, "
                f"{self.price:.8f}, {self.quantity:.8f}, {self.status})")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert order to dictionary."""
        return {
            "order_id": self.order_id,
            "market": self.market,
            "side": self.side,
            "price": self.price,
            "quantity": self.quantity,
            "order_type": self.order_type,
            "status": self.status,
            "filled_quantity": self.filled_quantity,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "filled_at": self.filled_at.isoformat() if self.filled_at else None
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Order':
        """Create order from dictionary."""
        order = cls(
            market=data["market"],
            side=data["side"],
            price=data["price"],
            quantity=data["quantity"],
            order_type=data.get("order_type", "LIMIT"),
            order_id=data.get("order_id")
        )
        
        order.status = data.get("status", "NEW")
        order.filled_quantity = data.get("filled_quantity", 0.0)
        
        if data.get("created_at"):
            order.created_at = datetime.fromisoformat(data["created_at"])
        
        if data.get("filled_at"):
            order.filled_at = datetime.fromisoformat(data["filled_at"])
        
        return order


class BasicGridStrategy:
    """
    Basic implementation of a grid trading strategy.
    
    This strategy places a grid of buy and sell orders around a reference price,
    aiming to profit from price oscillations within a range.
    """
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the grid strategy.
        
        Args:
            config: Strategy configuration
        """
        self.config = config
        self.name = "BasicGridStrategy"
        
        # Extract configuration parameters
        self.grid_levels = config.get("grid_levels", 10)
        self.grid_spacing_pct = config.get("grid_spacing_pct", 1.0) / 100.0
        self.price_range_pct = config.get("price_range_pct", 10.0) / 100.0
        self.position_size_pct = config.get("position_size_pct", 2.0) / 100.0
        
        # Runtime state
        self.reference_price = None
        self.grid_orders = {}  # market -> list of orders
        self.active_orders = {}  # order_id -> order
        self.filled_orders = []
        self.last_update_time = None
    
    def calculate_grid_levels(self, market: str, current_price: float) -> List[float]:
        """
        Calculate price levels for the grid.
        
        Args:
            market: Market symbol
            current_price: Current market price
            
        Returns:
            List of price levels
        """
        # Calculate grid spacing based on configuration
        spacing_pct = self.grid_spacing_pct
        
        # Calculate price range
        half_range_pct = self.price_range_pct / 2
        lower_bound = current_price * (1 - half_range_pct)
        upper_bound = current_price * (1 + half_range_pct)
        
        # Calculate number of levels
        total_levels = self.grid_levels * 2 + 1  # Include reference price
        
        # Generate grid levels
        grid_levels = []
        for i in range(total_levels):
            # Calculate as percentage of the range
            pct = i / (total_levels - 1)
            price = lower_bound + (upper_bound - lower_bound) * pct
            
            # Round to 8 decimal places (common for crypto)
            price = round(price, 8)
            grid_levels.append(price)
        
        return grid_levels
    
    def calculate_order_quantity(self, market: str, price: float, 
                               account_balance: float, side: str) -> float:
        """
        Calculate order quantity for a grid level.
        
        Args:
            market: Market symbol
            price: Order price
            account_balance: Available account balance
            side: Order side ("BUY" or "SELL")
            
        Returns:
            Order quantity
        """
        # Extract the quote currency from the market symbol
        quote_currency = market.split('-')[0]
        
        # Calculate position size as percentage of account balance
        position_size = account_balance * self.position_size_pct / self.grid_levels
        
        # Calculate quantity based on price
        quantity = position_size / price
        
        # Round to 8 decimal places
        quantity = round(quantity, 8)
        
        return quantity
    
    def generate_grid_orders(self, market: str, current_price: float, 
                           account_data: Dict[str, Any]) -> List[Order]:
        """
        Generate grid orders for a market.
        
        Args:
            market: Market symbol
            current_price: Current market price
            account_data: Account data including balances
            
        Returns:
            List of orders for the grid
        """
        # Extract base and quote currencies from market symbol
        parts = market.split('-')
        if len(parts) != 2:
            logger.error(f"Invalid market format: {market}")
            return []
        
        quote_currency, base_currency = parts
        
        # Get account balances
        balances = account_data.get("balances", {})
        quote_balance = balances.get(quote_currency, 0.0)
        base_balance = balances.get(base_currency, 0.0)
        
        # Update reference price
        self.reference_price = current_price
        
        # Calculate grid levels
        grid_levels = self.calculate_grid_levels(market, current_price)
        
        # Generate orders
        orders = []
        
        for price in grid_levels:
            if price < current_price:
                # Buy order
                side = "BUY"
                # Check if we have enough quote currency
                quantity = self.calculate_order_quantity(market, price, quote_balance, side)
                if quantity * price > quote_balance:
                    continue  # Skip if not enough balance
            else:
                # Sell order
                side = "SELL"
                # Check if we have enough base currency
                quantity = self.calculate_order_quantity(market, price, quote_balance, side)
                if quantity > base_balance:
                    continue  # Skip if not enough balance
            
            # Create order
            order = Order(
                market=market,
                side=side,
                price=price,
                quantity=quantity
            )
            
            orders.append(order)
        
        # Store grid orders for this market
        self.grid_orders[market] = orders
        
        # Update active orders
        for order in orders:
            self.active_orders[order.order_id] = order
        
        return orders
    
    def update_grid(self, market: str, current_price: float, 
                  account_data: Dict[str, Any]) -> Tuple[List[Order], List[Order]]:
        """
        Update the grid based on current price.
        
        Args:
            market: Market symbol
            current_price: Current market price
            account_data: Account data including balances
            
        Returns:
            Tuple of (orders_to_cancel, orders_to_create)
        """
        # Check if we need to regenerate the grid
        regenerate = False
        
        # If no reference price or price moved significantly
        if (self.reference_price is None or 
            abs(current_price - self.reference_price) / self.reference_price > 0.05):
            regenerate = True
        
        if regenerate:
            # Get current grid orders for this market
            current_orders = self.grid_orders.get(market, [])
            
            # Generate new grid
            new_orders = self.generate_grid_orders(market, current_price, account_data)
            
            return current_orders, new_orders
        else:
            # No update needed
            return [], []
    
    def handle_filled_order(self, order: Order, current_price: float) -> Optional[Order]:
        """
        Handle a filled order by creating an opposite order.
        
        Args:
            order: Filled order
            current_price: Current market price
            
        Returns:
            New order to place
        """
        # Remove from active orders
        if order.order_id in self.active_orders:
            del self.active_orders[order.order_id]
        
        # Add to filled orders
        self.filled_orders.append(order)
        
        # Calculate opposite order
        opposite_side = "SELL" if order.side == "BUY" else "BUY"
        
        if opposite_side == "SELL":
            # If we bought, create a sell order at a higher price
            new_price = order.price * (1 + self.grid_spacing_pct)
        else:
            # If we sold, create a buy order at a lower price
            new_price = order.price * (1 - self.grid_spacing_pct)
        
        # Create new order
        new_order = Order(
            market=order.market,
            side=opposite_side,
            price=new_price,
            quantity=order.quantity  # Same quantity as filled order
        )
        
        # Add to active orders
        self.active_orders[new_order.order_id] = new_order
        
        return new_order
    
    def analyze_market(self, market: str, market_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze market data for grid strategy.
        
        Args:
            market: Market symbol
            market_data: Market data
            
        Returns:
            Analysis results
        """
        # Basic analysis for grid strategy
        ticker = market_data.get("ticker", {})
        current_price = ticker.get("price", 0.0)
        
        # Update last update time
        self.last_update_time = datetime.now()
        
        return {
            "market": market,
            "current_price": current_price,
            "reference_price": self.reference_price,
            "active_orders": len([o for o in self.active_orders.values() if o.market == market]),
            "filled_orders": len([o for o in self.filled_orders if o.market == market]),
            "timestamp": datetime.now().timestamp()
        }

def test_grid_strategy():
    """Test function for the BasicGridStrategy."""
    # Log configuration
    logging.basicConfig(level=logging.INFO, 
                      format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    
    # Sample market data
    market = "BTC-XMR"
    market_data = {
        "ticker": {
            "price": 0.01234,
            "high": 0.01240,
            "low": 0.01230,
            "volume": 123.45,
            "bid": 0.01233,
            "ask": 0.01235,
            "timestamp": datetime.now().timestamp()
        }
    }
    
    # Sample account data
    account_data = {
        "balances": {
            "BTC": 1.0,
            "XMR": 50.0
        }
    }
    
    # Create strategy
    config = {
        "grid_levels": 5,
        "grid_spacing_pct": 1.0,
        "price_range_pct": 5.0,
        "position_size_pct": 2.0
    }
    
    strategy = BasicGridStrategy(config)
    
    # Test grid level calculation
    logger.info("Testing grid level calculation...")
    grid_levels = strategy.calculate_grid_levels(market, market_data["ticker"]["price"])
    logger.info(f"Grid levels: {[f'{price:.8f}' for price in grid_levels]}")
    
    # Test order generation
    logger.info("Testing grid order generation...")
    orders = strategy.generate_grid_orders(market, market_data["ticker"]["price"], account_data)
    logger.info(f"Generated {len(orders)} grid orders")
    
    for i, order in enumerate(orders):
        logger.info(f"Order {i+1}: {order}")
    
    # Test grid update with price movement
    logger.info("Testing grid update with price movement...")
    new_price = market_data["ticker"]["price"] * 1.06  # 6% move
    orders_to_cancel, orders_to_create = strategy.update_grid(market, new_price, account_data)
    
    logger.info(f"Grid update: {len(orders_to_cancel)} orders to cancel, {len(orders_to_create)} orders to create")
    
    # Test handling filled order
    if orders:
        logger.info("Testing filled order handling...")
        filled_order = orders[0]
        filled_order.status = "FILLED"
        filled_order.filled_quantity = filled_order.quantity
        filled_order.filled_at = datetime.now()
        
        new_order = strategy.handle_filled_order(filled_order, market_data["ticker"]["price"])
        logger.info(f"Filled order: {filled_order}")
        logger.info(f"New order: {new_order}")
    
    # Test market analysis
    logger.info("Testing market analysis...")
    analysis = strategy.analyze_market(market, market_data)
    logger.info(f"Market analysis: {analysis}")
    
    logger.info("Grid strategy test completed")

if __name__ == "__main__":
    # Run the test function
    test_grid_strategy()
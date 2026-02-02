"""
SimpleStorage module for the cryptocurrency trading system.
Provides a lightweight storage solution for market data and trading information.
"""

import os
import json
import sqlite3
import pandas as pd
from datetime import datetime
from typing import Dict, List, Any, Optional, Union


class SimpleStorage:
    """
    A simple storage class for the cryptocurrency trading system.
    Provides methods to store and retrieve market data, trades, and system configuration.
    
    Supports different storage backends:
    - 'file': Store data as CSV and JSON files (default)
    - 'sqlite': Store data in SQLite database
    - 'memory': Store data in memory (for testing)
    """

    def __init__(self, data_dir: str = "data", storage_type: str = "file"):
        """
        Initialize the SimpleStorage instance.
        
        Args:
            data_dir: Base directory for data storage
            storage_type: Storage backend type ('file', 'sqlite', or 'memory')
        """
        self.base_dir = data_dir
        self.storage_type = storage_type.lower()
        self.in_memory_data = {} if self.storage_type == "memory" else None
        self.db_connection = None
        
        # Set up storage backend
        if self.storage_type == "sqlite":
            self._setup_sqlite()
        elif self.storage_type == "file":
            self._ensure_directories()
        elif self.storage_type == "memory":
            self._setup_memory_storage()
        else:
            raise ValueError(f"Unsupported storage type: {storage_type}")
        
    def _setup_sqlite(self) -> None:
        """Set up SQLite storage backend."""
        # Ensure the data directory exists
        os.makedirs(self.base_dir, exist_ok=True)
        
        # Create SQLite database
        db_path = os.path.join(self.base_dir, "trading_data.db")
        self.db_connection = sqlite3.connect(db_path)
        
        # Create tables if they don't exist
        cursor = self.db_connection.cursor()
        
        # Market data table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS market_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol TEXT NOT NULL,
                timeframe TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                open REAL,
                high REAL,
                low REAL,
                close REAL,
                volume REAL,
                data_json TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Trades table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS trades (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                trade_id TEXT,
                symbol TEXT NOT NULL,
                side TEXT NOT NULL,
                price REAL,
                amount REAL,
                cost REAL,
                timestamp TEXT NOT NULL,
                data_json TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Config table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS config (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                data_json TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Logs table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                log_type TEXT NOT NULL,
                message TEXT,
                data_json TEXT,
                timestamp TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        self.db_connection.commit()
    
    def _setup_memory_storage(self) -> None:
        """Set up in-memory storage backend."""
        self.in_memory_data = {
            "market_data": {},
            "trades": {},
            "config": {},
            "logs": []
        }
    
    def _ensure_directories(self) -> None:
        """Create necessary directories if they don't exist."""
        directories = [
            self.base_dir,
            os.path.join(self.base_dir, "market_data"),
            os.path.join(self.base_dir, "trades"),
            os.path.join(self.base_dir, "config"),
            os.path.join(self.base_dir, "logs")
        ]
        
        for directory in directories:
            os.makedirs(directory, exist_ok=True)
    
    def save_market_data(self, symbol: str, timeframe: str, data: pd.DataFrame) -> str:
        """
        Save market data for a specific symbol and timeframe.
        
        Args:
            symbol: Trading pair symbol (e.g., 'BTC-USDT')
            timeframe: Data timeframe (e.g., '1m', '1h', '1d')
            data: DataFrame containing market data
            
        Returns:
            Path to the saved file or identifier
        """
        if self.storage_type == "file":
            return self._save_market_data_file(symbol, timeframe, data)
        elif self.storage_type == "sqlite":
            return self._save_market_data_sqlite(symbol, timeframe, data)
        elif self.storage_type == "memory":
            return self._save_market_data_memory(symbol, timeframe, data)
            
    def _save_market_data_file(self, symbol: str, timeframe: str, data: pd.DataFrame) -> str:
        """Save market data to file."""
        # Ensure data directory exists
        directory = os.path.join(self.base_dir, "market_data", symbol)
        os.makedirs(directory, exist_ok=True)
        
        # Create filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{symbol}_{timeframe}_{timestamp}.csv"
        filepath = os.path.join(directory, filename)
        
        # Save data to CSV
        data.to_csv(filepath, index=True)
        return filepath
    
    def _save_market_data_sqlite(self, symbol: str, timeframe: str, data: pd.DataFrame) -> str:
        """Save market data to SQLite."""
        if self.db_connection is None:
            raise RuntimeError("SQLite database connection not initialized")
        
        # Convert DataFrame to records
        timestamp = datetime.now().isoformat()
        records = []
        
        for idx, row in data.iterrows():
            record_time = idx.isoformat() if hasattr(idx, 'isoformat') else str(idx)
            record = (
                symbol,
                timeframe,
                record_time,
                row.get('open', None),
                row.get('high', None),
                row.get('low', None),
                row.get('close', None),
                row.get('volume', None),
                json.dumps(row.to_dict())
            )
            records.append(record)
        
        # Insert data
        cursor = self.db_connection.cursor()
        cursor.executemany('''
            INSERT INTO market_data 
            (symbol, timeframe, timestamp, open, high, low, close, volume, data_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', records)
        
        self.db_connection.commit()
        
        return f"sqlite:{symbol}_{timeframe}_{timestamp}"
    
    def _save_market_data_memory(self, symbol: str, timeframe: str, data: pd.DataFrame) -> str:
        """Save market data to memory."""
        timestamp = datetime.now().isoformat()
        key = f"{symbol}_{timeframe}_{timestamp}"
        
        if symbol not in self.in_memory_data["market_data"]:
            self.in_memory_data["market_data"][symbol] = {}
            
        if timeframe not in self.in_memory_data["market_data"][symbol]:
            self.in_memory_data["market_data"][symbol][timeframe] = {}
            
        self.in_memory_data["market_data"][symbol][timeframe][timestamp] = data.copy()
        
        return f"memory:{key}"
    
    def load_market_data(self, symbol: str, timeframe: str, 
                         start_date: Optional[str] = None, 
                         end_date: Optional[str] = None) -> pd.DataFrame:
        """
        Load market data for a specific symbol and timeframe.
        
        Args:
            symbol: Trading pair symbol (e.g., 'BTC-USDT')
            timeframe: Data timeframe (e.g., '1m', '1h', '1d')
            start_date: Optional start date filter (format: 'YYYY-MM-DD')
            end_date: Optional end date filter (format: 'YYYY-MM-DD')
            
        Returns:
            DataFrame containing market data
        """
        if self.storage_type == "file":
            return self._load_market_data_file(symbol, timeframe, start_date, end_date)
        elif self.storage_type == "sqlite":
            return self._load_market_data_sqlite(symbol, timeframe, start_date, end_date)
        elif self.storage_type == "memory":
            return self._load_market_data_memory(symbol, timeframe, start_date, end_date)
    
    def _load_market_data_file(self, symbol: str, timeframe: str, 
                              start_date: Optional[str] = None, 
                              end_date: Optional[str] = None) -> pd.DataFrame:
        """Load market data from file."""
        directory = os.path.join(self.base_dir, "market_data", symbol)
        
        if not os.path.exists(directory):
            raise FileNotFoundError(f"No data found for symbol {symbol}")
        
        # Find all matching files
        files = [f for f in os.listdir(directory) if f.startswith(f"{symbol}_{timeframe}") and f.endswith(".csv")]
        
        if not files:
            raise FileNotFoundError(f"No data found for {symbol} with timeframe {timeframe}")
        
        # Sort files by timestamp (newest first)
        files.sort(reverse=True)
        
        # Load the most recent file
        filepath = os.path.join(directory, files[0])
        data = pd.read_csv(filepath, index_col=0, parse_dates=True)
        
        # Apply date filters if provided
        if start_date:
            data = data[data.index >= start_date]
        if end_date:
            data = data[data.index <= end_date]
            
        return data
    
    def _load_market_data_sqlite(self, symbol: str, timeframe: str, 
                               start_date: Optional[str] = None, 
                               end_date: Optional[str] = None) -> pd.DataFrame:
        """Load market data from SQLite."""
        if self.db_connection is None:
            raise RuntimeError("SQLite database connection not initialized")
        
        # Build query
        query = """
            SELECT * FROM market_data 
            WHERE symbol = ? AND timeframe = ?
        """
        params = [symbol, timeframe]
        
        if start_date:
            query += " AND timestamp >= ?"
            params.append(start_date)
        
        if end_date:
            query += " AND timestamp <= ?"
            params.append(end_date)
        
        query += " ORDER BY timestamp DESC"
        
        # Execute query
        cursor = self.db_connection.cursor()
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        if not rows:
            raise FileNotFoundError(f"No data found for {symbol} with timeframe {timeframe}")
        
        # Convert to DataFrame
        columns = [desc[0] for desc in cursor.description]
        df = pd.DataFrame(rows, columns=columns)
        
        # Parse JSON data
        records = []
        for _, row in df.iterrows():
            data = json.loads(row['data_json'])
            data['timestamp'] = row['timestamp']
            records.append(data)
        
        result = pd.DataFrame(records)
        result.set_index('timestamp', inplace=True)
        result.index = pd.to_datetime(result.index)
        
        return result
    
    def _load_market_data_memory(self, symbol: str, timeframe: str, 
                              start_date: Optional[str] = None, 
                              end_date: Optional[str] = None) -> pd.DataFrame:
        """Load market data from memory."""
        if (symbol not in self.in_memory_data["market_data"] or 
            timeframe not in self.in_memory_data["market_data"][symbol]):
            raise FileNotFoundError(f"No data found for {symbol} with timeframe {timeframe}")
        
        # Get the most recent data
        timestamps = list(self.in_memory_data["market_data"][symbol][timeframe].keys())
        timestamps.sort(reverse=True)
        
        data = self.in_memory_data["market_data"][symbol][timeframe][timestamps[0]].copy()
        
        # Apply date filters if provided
        if start_date:
            data = data[data.index >= start_date]
        if end_date:
            data = data[data.index <= end_date]
            
        return data
    
    def save_trade(self, trade_data: Dict[str, Any]) -> str:
        """
        Save trade information.
        
        Args:
            trade_data: Dictionary containing trade details
            
        Returns:
            Path to the saved file or identifier
        """
        if self.storage_type == "file":
            return self._save_trade_file(trade_data)
        elif self.storage_type == "sqlite":
            return self._save_trade_sqlite(trade_data)
        elif self.storage_type == "memory":
            return self._save_trade_memory(trade_data)
    
    def _save_trade_file(self, trade_data: Dict[str, Any]) -> str:
        """Save trade to file."""
        # Add timestamp if not present
        if 'timestamp' not in trade_data:
            trade_data['timestamp'] = datetime.now().isoformat()
            
        # Create trades directory for the symbol if it doesn't exist
        symbol = trade_data.get('symbol', 'unknown')
        directory = os.path.join(self.base_dir, "trades", symbol)
        os.makedirs(directory, exist_ok=True)
        
        # Create filename with trade ID or timestamp
        trade_id = trade_data.get('id', datetime.now().strftime("%Y%m%d_%H%M%S"))
        filename = f"trade_{trade_id}.json"
        filepath = os.path.join(directory, filename)
        
        # Save trade data as JSON
        with open(filepath, 'w') as f:
            json.dump(trade_data, f, indent=4)
            
        return filepath
    
    def _save_trade_sqlite(self, trade_data: Dict[str, Any]) -> str:
        """Save trade to SQLite."""
        if self.db_connection is None:
            raise RuntimeError("SQLite database connection not initialized")
        
        # Add timestamp if not present
        if 'timestamp' not in trade_data:
            trade_data['timestamp'] = datetime.now().isoformat()
        
        # Extract key fields
        trade_id = trade_data.get('id', datetime.now().strftime("%Y%m%d_%H%M%S"))
        symbol = trade_data.get('symbol', 'unknown')
        side = trade_data.get('side', 'unknown')
        price = trade_data.get('price', 0.0)
        amount = trade_data.get('amount', 0.0)
        cost = trade_data.get('cost', price * amount)
        timestamp = trade_data.get('timestamp')
        
        # Insert trade
        cursor = self.db_connection.cursor()
        cursor.execute('''
            INSERT INTO trades 
            (trade_id, symbol, side, price, amount, cost, timestamp, data_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (trade_id, symbol, side, price, amount, cost, timestamp, json.dumps(trade_data)))
        
        self.db_connection.commit()
        
        return f"sqlite:trade_{trade_id}"
    
    def _save_trade_memory(self, trade_data: Dict[str, Any]) -> str:
        """Save trade to memory."""
        # Add timestamp if not present
        if 'timestamp' not in trade_data:
            trade_data['timestamp'] = datetime.now().isoformat()
            
        trade_id = trade_data.get('id', datetime.now().strftime("%Y%m%d_%H%M%S"))
        symbol = trade_data.get('symbol', 'unknown')
        
        if symbol not in self.in_memory_data["trades"]:
            self.in_memory_data["trades"][symbol] = {}
            
        self.in_memory_data["trades"][symbol][trade_id] = trade_data.copy()
        
        return f"memory:trade_{trade_id}"
    
    def load_trades(self, symbol: Optional[str] = None, 
                   start_date: Optional[str] = None,
                   end_date: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Load trade information.
        
        Args:
            symbol: Optional symbol filter
            start_date: Optional start date filter (format: 'YYYY-MM-DD')
            end_date: Optional end date filter (format: 'YYYY-MM-DD')
            
        Returns:
            List of trade dictionaries
        """
        if self.storage_type == "file":
            return self._load_trades_file(symbol, start_date, end_date)
        elif self.storage_type == "sqlite":
            return self._load_trades_sqlite(symbol, start_date, end_date)
        elif self.storage_type == "memory":
            return self._load_trades_memory(symbol, start_date, end_date)
    
    def _load_trades_file(self, symbol: Optional[str] = None, 
                         start_date: Optional[str] = None,
                         end_date: Optional[str] = None) -> List[Dict[str, Any]]:
        """Load trades from file."""
        trades_dir = os.path.join(self.base_dir, "trades")
        
        if symbol:
            symbol_dir = os.path.join(trades_dir, symbol)
            if not os.path.exists(symbol_dir):
                return []
            directories = [symbol_dir]
        else:
            if not os.path.exists(trades_dir):
                return []
            directories = [os.path.join(trades_dir, d) for d in os.listdir(trades_dir) 
                         if os.path.isdir(os.path.join(trades_dir, d))]
        
        trades = []
        
        for directory in directories:
            files = [f for f in os.listdir(directory) if f.startswith("trade_") and f.endswith(".json")]
            
            for filename in files:
                filepath = os.path.join(directory, filename)
                with open(filepath, 'r') as f:
                    trade = json.load(f)
                
                # Apply date filters if provided
                if start_date or end_date:
                    trade_date = trade.get('timestamp', '').split('T')[0]
                    if start_date and trade_date < start_date:
                        continue
                    if end_date and trade_date > end_date:
                        continue
                
                trades.append(trade)
        
        # Sort trades by timestamp
        trades.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        return trades
    
    def _load_trades_sqlite(self, symbol: Optional[str] = None, 
                          start_date: Optional[str] = None,
                          end_date: Optional[str] = None) -> List[Dict[str, Any]]:
        """Load trades from SQLite."""
        if self.db_connection is None:
            raise RuntimeError("SQLite database connection not initialized")
        
        # Build query
        query = "SELECT * FROM trades"
        params = []
        
        conditions = []
        if symbol:
            conditions.append("symbol = ?")
            params.append(symbol)
        
        if start_date:
            conditions.append("timestamp >= ?")
            params.append(start_date)
        
        if end_date:
            conditions.append("timestamp <= ?")
            params.append(end_date)
        
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
        
        query += " ORDER BY timestamp DESC"
        
        # Execute query
        cursor = self.db_connection.cursor()
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        # Convert to trade dictionaries
        trades = []
        columns = [desc[0] for desc in cursor.description]
        
        for row in rows:
            # Create a dictionary from column names and values
            trade_dict = {columns[i]: row[i] for i in range(len(columns))}
            
            # Parse the JSON data
            if 'data_json' in trade_dict and trade_dict['data_json']:
                trade_data = json.loads(trade_dict['data_json'])
                # Remove data_json field
                del trade_dict['data_json']
                # Merge with trade_data (data_json takes precedence)
                trade_dict.update(trade_data)
            
            trades.append(trade_dict)
        
        return trades
    
    def _load_trades_memory(self, symbol: Optional[str] = None, 
                         start_date: Optional[str] = None,
                         end_date: Optional[str] = None) -> List[Dict[str, Any]]:
        """Load trades from memory."""
        trades = []
        
        # Get symbols to process
        symbols = [symbol] if symbol else list(self.in_memory_data["trades"].keys())
        
        for sym in symbols:
            if sym not in self.in_memory_data["trades"]:
                continue
                
            for trade_id, trade in self.in_memory_data["trades"][sym].items():
                # Apply date filters if provided
                if start_date or end_date:
                    trade_date = trade.get('timestamp', '').split('T')[0]
                    if start_date and trade_date < start_date:
                        continue
                    if end_date and trade_date > end_date:
                        continue
                
                trades.append(trade.copy())
        
        # Sort trades by timestamp
        trades.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        return trades
    
    def save_config(self, config_name: str, config_data: Dict[str, Any]) -> str:
        """
        Save configuration data.
        
        Args:
            config_name: Name of the configuration
            config_data: Dictionary containing configuration
            
        Returns:
            Path to the saved file or identifier
        """
        if self.storage_type == "file":
            return self._save_config_file(config_name, config_data)
        elif self.storage_type == "sqlite":
            return self._save_config_sqlite(config_name, config_data)
        elif self.storage_type == "memory":
            return self._save_config_memory(config_name, config_data)
    
    def _save_config_file(self, config_name: str, config_data: Dict[str, Any]) -> str:
        """Save config to file."""
        # Ensure config directory exists
        directory = os.path.join(self.base_dir, "config")
        os.makedirs(directory, exist_ok=True)
        
        # Create filename
        filename = f"{config_name}.json"
        filepath = os.path.join(directory, filename)
        
        # Save config data as JSON
        with open(filepath, 'w') as f:
            json.dump(config_data, f, indent=4)
            
        return filepath
    
    def _save_config_sqlite(self, config_name: str, config_data: Dict[str, Any]) -> str:
        """Save config to SQLite."""
        if self.db_connection is None:
            raise RuntimeError("SQLite database connection not initialized")
        
        # Check if config already exists
        cursor = self.db_connection.cursor()
        cursor.execute("SELECT id FROM config WHERE name = ?", (config_name,))
        result = cursor.fetchone()
        
        timestamp = datetime.now().isoformat()
        
        if result:
            # Update existing config
            cursor.execute('''
                UPDATE config 
                SET data_json = ?, updated_at = ?
                WHERE name = ?
            ''', (json.dumps(config_data), timestamp, config_name))
        else:
            # Insert new config
            cursor.execute('''
                INSERT INTO config 
                (name, data_json, created_at, updated_at)
                VALUES (?, ?, ?, ?)
            ''', (config_name, json.dumps(config_data), timestamp, timestamp))
        
        self.db_connection.commit()
        
        return f"sqlite:config_{config_name}"
    
    def _save_config_memory(self, config_name: str, config_data: Dict[str, Any]) -> str:
        """Save config to memory."""
        self.in_memory_data["config"][config_name] = config_data.copy()
        return f"memory:config_{config_name}"
    
    def load_config(self, config_name: str) -> Dict[str, Any]:
        """
        Load configuration data.
        
        Args:
            config_name: Name of the configuration
            
        Returns:
            Dictionary containing configuration
        """
        if self.storage_type == "file":
            return self._load_config_file(config_name)
        elif self.storage_type == "sqlite":
            return self._load_config_sqlite(config_name)
        elif self.storage_type == "memory":
            return self._load_config_memory(config_name)
    
    def _load_config_file(self, config_name: str) -> Dict[str, Any]:
        """Load config from file."""
        filepath = os.path.join(self.base_dir, "config", f"{config_name}.json")
        
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Configuration {config_name} not found")
        
        with open(filepath, 'r') as f:
            return json.load(f)
    
    def _load_config_sqlite(self, config_name: str) -> Dict[str, Any]:
        """Load config from SQLite."""
        if self.db_connection is None:
            raise RuntimeError("SQLite database connection not initialized")
        
        cursor = self.db_connection.cursor()
        cursor.execute("SELECT data_json FROM config WHERE name = ?", (config_name,))
        result = cursor.fetchone()
        
        if not result:
            raise FileNotFoundError(f"Configuration {config_name} not found")
        
        return json.loads(result[0])
    
    def _load_config_memory(self, config_name: str) -> Dict[str, Any]:
        """Load config from memory."""
        if config_name not in self.in_memory_data["config"]:
            raise FileNotFoundError(f"Configuration {config_name} not found")
        
        return self.in_memory_data["config"][config_name].copy()
    
    def append_log(self, log_type: str, message: str, 
                  data: Optional[Dict[str, Any]] = None) -> None:
        """
        Append a log entry.
        
        Args:
            log_type: Type of log (e.g., 'system', 'trade', 'error')
            message: Log message
            data: Optional additional data to log
        """
        if self.storage_type == "file":
            self._append_log_file(log_type, message, data)
        elif self.storage_type == "sqlite":
            self._append_log_sqlite(log_type, message, data)
        elif self.storage_type == "memory":
            self._append_log_memory(log_type, message, data)
    
    def _append_log_file(self, log_type: str, message: str, 
                       data: Optional[Dict[str, Any]] = None) -> None:
        """Append log to file."""
        # Ensure logs directory exists
        directory = os.path.join(self.base_dir, "logs")
        os.makedirs(directory, exist_ok=True)
        
        # Create log entry
        timestamp = datetime.now().isoformat()
        log_entry = {
            "timestamp": timestamp,
            "type": log_type,
            "message": message
        }
        
        if data:
            log_entry["data"] = data
        
        # Determine log file based on type and current date
        date_str = datetime.now().strftime("%Y%m%d")
        filename = f"{log_type}_{date_str}.log"
        filepath = os.path.join(directory, filename)
        
        # Append log entry as JSON
        with open(filepath, 'a') as f:
            f.write(json.dumps(log_entry) + "\n")
    
    def _append_log_sqlite(self, log_type: str, message: str, 
                         data: Optional[Dict[str, Any]] = None) -> None:
        """Append log to SQLite."""
        if self.db_connection is None:
            raise RuntimeError("SQLite database connection not initialized")
        
        timestamp = datetime.now().isoformat()
        data_json = json.dumps(data) if data else None
        
        cursor = self.db_connection.cursor()
        cursor.execute('''
            INSERT INTO logs 
            (log_type, message, data_json, timestamp)
            VALUES (?, ?, ?, ?)
        ''', (log_type, message, data_json, timestamp))
        
        self.db_connection.commit()
    
    def _append_log_memory(self, log_type: str, message: str, 
                        data: Optional[Dict[str, Any]] = None) -> None:
        """Append log to memory."""
        timestamp = datetime.now().isoformat()
        
        log_entry = {
            "timestamp": timestamp,
            "type": log_type,
            "message": message
        }
        
        if data:
            log_entry["data"] = data
        
        self.in_memory_data["logs"].append(log_entry)
    
    def close(self) -> None:
        """Close any open connections or resources."""
        if self.storage_type == "sqlite" and self.db_connection is not None:
            self.db_connection.close()
            self.db_connection = None
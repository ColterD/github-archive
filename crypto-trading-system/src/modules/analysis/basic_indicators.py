"""
Basic technical indicators module for cryptocurrency trading system.
Provides functions to calculate common technical indicators for market analysis.
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Union, Tuple


def analyze_market_data(data: pd.DataFrame, indicators: Optional[List[str]] = None) -> pd.DataFrame:
    """
    Calculate technical indicators for market data analysis.
    
    Args:
        data: DataFrame with market data (must include 'open', 'high', 'low', 'close', 'volume' columns)
        indicators: Optional list of indicators to calculate. If None, calculates all.
                   Options: 'sma', 'ema', 'rsi', 'macd', 'bollinger', 'atr', 'obv', 'stoch'
                   
    Returns:
        DataFrame with added indicator columns
    """
    # Make a copy to avoid modifying the original DataFrame
    df = data.copy()
    
    # Ensure required columns exist
    required_columns = ['open', 'high', 'low', 'close', 'volume']
    for col in required_columns:
        if col not in df.columns:
            # Check for capitalized column names
            cap_col = col.capitalize()
            if cap_col in df.columns:
                df[col] = df[cap_col]
            else:
                raise ValueError(f"Required column '{col}' not found in data")
    
    # Default indicators if none specified
    if indicators is None:
        indicators = ['sma', 'ema', 'rsi', 'macd', 'bollinger', 'atr', 'obv', 'stoch']
    
    # Calculate specified indicators
    for indicator in indicators:
        if indicator.lower() == 'sma':
            df = add_sma(df, periods=[20, 50, 200])
        elif indicator.lower() == 'ema':
            df = add_ema(df, periods=[9, 21, 55])
        elif indicator.lower() == 'rsi':
            df = add_rsi(df, period=14)
        elif indicator.lower() == 'macd':
            df = add_macd(df, fast=12, slow=26, signal=9)
        elif indicator.lower() == 'bollinger':
            df = add_bollinger_bands(df, period=20, std_dev=2)
        elif indicator.lower() == 'atr':
            df = add_atr(df, period=14)
        elif indicator.lower() == 'obv':
            df = add_obv(df)
        elif indicator.lower() == 'stoch':
            df = add_stochastic(df, k_period=14, d_period=3)
    
    return df


def add_sma(df: pd.DataFrame, periods: List[int] = [20, 50, 200]) -> pd.DataFrame:
    """
    Add Simple Moving Averages to the DataFrame.
    
    Args:
        df: DataFrame with market data
        periods: List of periods for SMA calculation
        
    Returns:
        DataFrame with added SMA columns
    """
    for period in periods:
        df[f'sma_{period}'] = df['close'].rolling(window=period).mean()
    return df


def add_ema(df: pd.DataFrame, periods: List[int] = [9, 21, 55]) -> pd.DataFrame:
    """
    Add Exponential Moving Averages to the DataFrame.
    
    Args:
        df: DataFrame with market data
        periods: List of periods for EMA calculation
        
    Returns:
        DataFrame with added EMA columns
    """
    for period in periods:
        df[f'ema_{period}'] = df['close'].ewm(span=period, adjust=False).mean()
    return df


def add_rsi(df: pd.DataFrame, period: int = 14) -> pd.DataFrame:
    """
    Add Relative Strength Index to the DataFrame.
    
    Args:
        df: DataFrame with market data
        period: Period for RSI calculation
        
    Returns:
        DataFrame with added RSI column
    """
    delta = df['close'].diff()
    gain = delta.where(delta > 0, 0)
    loss = -delta.where(delta < 0, 0)
    
    avg_gain = gain.rolling(window=period).mean()
    avg_loss = loss.rolling(window=period).mean()
    
    # Calculate RS and RSI
    rs = avg_gain / avg_loss
    df['rsi'] = 100 - (100 / (1 + rs))
    
    return df


def add_macd(df: pd.DataFrame, fast: int = 12, slow: int = 26, signal: int = 9) -> pd.DataFrame:
    """
    Add Moving Average Convergence Divergence to the DataFrame.
    
    Args:
        df: DataFrame with market data
        fast: Fast EMA period
        slow: Slow EMA period
        signal: Signal EMA period
        
    Returns:
        DataFrame with added MACD columns
    """
    # Calculate MACD components
    fast_ema = df['close'].ewm(span=fast, adjust=False).mean()
    slow_ema = df['close'].ewm(span=slow, adjust=False).mean()
    
    df['macd_line'] = fast_ema - slow_ema
    df['macd_signal'] = df['macd_line'].ewm(span=signal, adjust=False).mean()
    df['macd_histogram'] = df['macd_line'] - df['macd_signal']
    
    return df


def add_bollinger_bands(df: pd.DataFrame, period: int = 20, std_dev: float = 2) -> pd.DataFrame:
    """
    Add Bollinger Bands to the DataFrame.
    
    Args:
        df: DataFrame with market data
        period: Period for moving average
        std_dev: Number of standard deviations for bands
        
    Returns:
        DataFrame with added Bollinger Bands columns
    """
    df['bb_middle'] = df['close'].rolling(window=period).mean()
    rolling_std = df['close'].rolling(window=period).std()
    
    df['bb_upper'] = df['bb_middle'] + (rolling_std * std_dev)
    df['bb_lower'] = df['bb_middle'] - (rolling_std * std_dev)
    df['bb_width'] = (df['bb_upper'] - df['bb_lower']) / df['bb_middle']
    
    return df


def add_atr(df: pd.DataFrame, period: int = 14) -> pd.DataFrame:
    """
    Add Average True Range to the DataFrame.
    
    Args:
        df: DataFrame with market data
        period: Period for ATR calculation
        
    Returns:
        DataFrame with added ATR column
    """
    # Calculate True Range
    df['tr1'] = abs(df['high'] - df['low'])
    df['tr2'] = abs(df['high'] - df['close'].shift())
    df['tr3'] = abs(df['low'] - df['close'].shift())
    df['tr'] = df[['tr1', 'tr2', 'tr3']].max(axis=1)
    
    # Calculate ATR
    df['atr'] = df['tr'].rolling(window=period).mean()
    
    # Clean up intermediate columns
    df = df.drop(['tr1', 'tr2', 'tr3', 'tr'], axis=1)
    
    return df


def add_obv(df: pd.DataFrame) -> pd.DataFrame:
    """
    Add On-Balance Volume to the DataFrame.
    
    Args:
        df: DataFrame with market data
        
    Returns:
        DataFrame with added OBV column
    """
    df['price_change'] = df['close'].diff()
    df['obv'] = 0
    
    # Initialize first OBV value
    df.loc[1:, 'obv'] = df.loc[1:, 'volume'] * (
        np.where(df.loc[1:, 'price_change'] > 0, 1, 
                np.where(df.loc[1:, 'price_change'] < 0, -1, 0))
    )
    
    # Calculate cumulative OBV
    df['obv'] = df['obv'].cumsum()
    
    # Clean up intermediate columns
    df = df.drop(['price_change'], axis=1)
    
    return df


def add_stochastic(df: pd.DataFrame, k_period: int = 14, d_period: int = 3) -> pd.DataFrame:
    """
    Add Stochastic Oscillator to the DataFrame.
    
    Args:
        df: DataFrame with market data
        k_period: Period for %K calculation
        d_period: Period for %D calculation
        
    Returns:
        DataFrame with added Stochastic columns
    """
    # Calculate %K (Fast Stochastic)
    lowest_low = df['low'].rolling(window=k_period).min()
    highest_high = df['high'].rolling(window=k_period).max()
    
    df['stoch_k'] = 100 * ((df['close'] - lowest_low) / (highest_high - lowest_low))
    
    # Calculate %D (Slow Stochastic)
    df['stoch_d'] = df['stoch_k'].rolling(window=d_period).mean()
    
    return df


def identify_support_resistance(df: pd.DataFrame, window: int = 10, threshold: float = 0.02) -> Dict[str, List[float]]:
    """
    Identify potential support and resistance levels from historical data.
    
    Args:
        df: DataFrame with market data
        window: Window size for peak detection
        threshold: Minimum percentage change to consider a peak/trough
        
    Returns:
        Dictionary with support and resistance levels
    """
    # Create fractional price change filter
    price_change = df['close'].pct_change().abs()
    significant_changes = price_change > threshold
    
    # Find local maxima (potential resistance)
    resistance_points = []
    for i in range(window, len(df) - window):
        if significant_changes.iloc[i]:
            if all(df['high'].iloc[i] > df['high'].iloc[i-window:i]) and \
               all(df['high'].iloc[i] > df['high'].iloc[i+1:i+window+1]):
                resistance_points.append(df['high'].iloc[i])
    
    # Find local minima (potential support)
    support_points = []
    for i in range(window, len(df) - window):
        if significant_changes.iloc[i]:
            if all(df['low'].iloc[i] < df['low'].iloc[i-window:i]) and \
               all(df['low'].iloc[i] < df['low'].iloc[i+1:i+window+1]):
                support_points.append(df['low'].iloc[i])
    
    return {
        'support': support_points,
        'resistance': resistance_points
    }


def detect_divergence(df: pd.DataFrame, indicator: str = 'rsi', window: int = 10) -> pd.DataFrame:
    """
    Detect potential divergences between price and an indicator.
    
    Args:
        df: DataFrame with market data and indicators
        indicator: Indicator to check for divergence (e.g., 'rsi', 'macd_line')
        window: Window size for peak detection
        
    Returns:
        DataFrame with added divergence columns
    """
    if indicator not in df.columns:
        raise ValueError(f"Indicator '{indicator}' not found in DataFrame")
    
    # Make a copy
    result = df.copy()
    
    # Detect price peaks and troughs
    price_peaks = []
    price_troughs = []
    
    for i in range(window, len(df) - window):
        if all(df['high'].iloc[i] >= df['high'].iloc[i-window:i]) and \
           all(df['high'].iloc[i] >= df['high'].iloc[i+1:i+window+1]):
            price_peaks.append(i)
        
        if all(df['low'].iloc[i] <= df['low'].iloc[i-window:i]) and \
           all(df['low'].iloc[i] <= df['low'].iloc[i+1:i+window+1]):
            price_troughs.append(i)
    
    # Detect indicator peaks and troughs
    ind_peaks = []
    ind_troughs = []
    
    for i in range(window, len(df) - window):
        if all(df[indicator].iloc[i] >= df[indicator].iloc[i-window:i]) and \
           all(df[indicator].iloc[i] >= df[indicator].iloc[i+1:i+window+1]):
            ind_peaks.append(i)
        
        if all(df[indicator].iloc[i] <= df[indicator].iloc[i-window:i]) and \
           all(df[indicator].iloc[i] <= df[indicator].iloc[i+1:i+window+1]):
            ind_troughs.append(i)
    
    # Initialize divergence columns
    result['bullish_divergence'] = False
    result['bearish_divergence'] = False
    
    # Detect bullish divergence (price making lower lows but indicator making higher lows)
    for i in range(len(price_troughs) - 1):
        current_trough = price_troughs[i]
        prev_trough = price_troughs[i-1] if i > 0 else None
        
        if prev_trough is not None:
            # Check if price made a lower low
            if df['low'].iloc[current_trough] < df['low'].iloc[prev_trough]:
                # Find closest indicator troughs
                current_ind_trough = min([t for t in ind_troughs if abs(t - current_trough) < window], 
                                        key=lambda x: abs(x - current_trough), default=None)
                prev_ind_trough = min([t for t in ind_troughs if abs(t - prev_trough) < window],
                                     key=lambda x: abs(x - prev_trough), default=None)
                
                # Check if indicator made a higher low
                if (current_ind_trough is not None and prev_ind_trough is not None and 
                    df[indicator].iloc[current_ind_trough] > df[indicator].iloc[prev_ind_trough]):
                    result.loc[current_trough, 'bullish_divergence'] = True
    
    # Detect bearish divergence (price making higher highs but indicator making lower highs)
    for i in range(len(price_peaks) - 1):
        current_peak = price_peaks[i]
        prev_peak = price_peaks[i-1] if i > 0 else None
        
        if prev_peak is not None:
            # Check if price made a higher high
            if df['high'].iloc[current_peak] > df['high'].iloc[prev_peak]:
                # Find closest indicator peaks
                current_ind_peak = min([p for p in ind_peaks if abs(p - current_peak) < window], 
                                      key=lambda x: abs(x - current_peak), default=None)
                prev_ind_peak = min([p for p in ind_peaks if abs(p - prev_peak) < window],
                                   key=lambda x: abs(x - prev_peak), default=None)
                
                # Check if indicator made a lower high
                if (current_ind_peak is not None and prev_ind_peak is not None and 
                    df[indicator].iloc[current_ind_peak] < df[indicator].iloc[prev_ind_peak]):
                    result.loc[current_peak, 'bearish_divergence'] = True
    
    return result


def identify_candlestick_patterns(df: pd.DataFrame) -> pd.DataFrame:
    """
    Identify common candlestick patterns in the data.
    
    Args:
        df: DataFrame with market data (OHLC)
        
    Returns:
        DataFrame with added pattern columns
    """
    # Make a copy
    result = df.copy()
    
    # Calculate candle body and shadows
    result['body'] = abs(result['close'] - result['open'])
    result['upper_shadow'] = result['high'] - result[['open', 'close']].max(axis=1)
    result['lower_shadow'] = result[['open', 'close']].min(axis=1) - result['low']
    
    # Identify doji (tiny body)
    avg_body = result['body'].rolling(window=20).mean()
    result['doji'] = result['body'] < (0.1 * avg_body)
    
    # Hammer and Inverted Hammer
    result['hammer'] = (
        (result['body'] > 0) &  # Bullish
        (result['lower_shadow'] > 2 * result['body']) &  # Long lower shadow
        (result['upper_shadow'] < 0.2 * result['body'])   # Small or no upper shadow
    )
    
    result['inverted_hammer'] = (
        (result['body'] > 0) &  # Bullish
        (result['upper_shadow'] > 2 * result['body']) &  # Long upper shadow
        (result['lower_shadow'] < 0.2 * result['body'])   # Small or no lower shadow
    )
    
    # Engulfing patterns
    result['bullish_engulfing'] = (
        (result['open'].shift(1) > result['close'].shift(1)) &  # Previous red
        (result['close'] > result['open']) &  # Current green
        (result['open'] <= result['close'].shift(1)) &  # Open below previous close
        (result['close'] >= result['open'].shift(1))     # Close above previous open
    )
    
    result['bearish_engulfing'] = (
        (result['open'].shift(1) < result['close'].shift(1)) &  # Previous green
        (result['close'] < result['open']) &  # Current red
        (result['open'] >= result['close'].shift(1)) &  # Open above previous close
        (result['close'] <= result['open'].shift(1))     # Close below previous open
    )
    
    # Morning and Evening Star (simplified)
    result['morning_star'] = (
        (result['close'].shift(2) < result['open'].shift(2)) &  # First red
        (result['body'].shift(1) < 0.5 * result['body'].shift(2)) &  # Second small body
        (result['close'] > result['open']) &  # Third green
        (result['close'] > (result['open'].shift(2) + result['close'].shift(2)) / 2)  # Closed above midpoint of first candle
    )
    
    result['evening_star'] = (
        (result['close'].shift(2) > result['open'].shift(2)) &  # First green
        (result['body'].shift(1) < 0.5 * result['body'].shift(2)) &  # Second small body
        (result['close'] < result['open']) &  # Third red
        (result['close'] < (result['open'].shift(2) + result['close'].shift(2)) / 2)  # Closed below midpoint of first candle
    )
    
    # Clean up intermediate columns
    result = result.drop(['body', 'upper_shadow', 'lower_shadow'], axis=1)
    
    return result
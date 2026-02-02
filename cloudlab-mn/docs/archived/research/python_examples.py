# Python Code Examples for ML Stack
# CloudLab c220g5 Hardware: Dual Xeon E5-2620 v4, Tesla P4 8GB, 64GB RAM

# =============================================================================
# MLFLOW CONFIGURATION AND USAGE
# =============================================================================

import mlflow
from mlflow.tracking import MlflowClient
import psycopg2
from sqlalchemy import create_engine

## MLflow Backend Configuration
MLFLOW_TRACKING_URI = "postgresql://mlflow_user:password@localhost:5432/mlflow"
MLFLOW_ARTIFACT_ROOT = "/tank/mlflow/artifacts"
MLFLOW_REGISTRY_URI = "postgresql://mlflow_user:password@localhost:5432/mlflow"

def setup_mlflow():
    """Configure MLflow with PostgreSQL backend"""
    mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)
    mlflow.set_registry_uri(MLFLOW_REGISTRY_URI)
    
    # Initialize PostgreSQL tables if needed
    engine = create_engine(MLFLOW_TRACKING_URI)
    
    # Create experiment
    experiment = mlflow.get_experiment_by_name("Production_Experiments")
    if not experiment:
        mlflow.create_experiment("Production_Experiments", 
                                 artifact_location=f"{MLFLOW_ARTIFACT_ROOT}/production")
    
    print(f"MLflow configured with URI: {MLFLOW_TRACKING_URI}")

## MLflow Training Example with GPU Support
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import make_classification
import torch
import torch.nn as nn
import torch.optim as optim

def train_with_mlflow(X, y):
    """Training with MLflow tracking"""
    with mlflow.start_run(run_name="gpu_optimized_training"):
        # Log parameters
        mlflow.log_param("model_type", "random_forest")
        mlflow.log_param("n_estimators", 100)
        mlflow.log_param("gpu_enabled", torch.cuda.is_available())
        
        # Train model
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(X, y)
        
        # Log metrics
        accuracy = model.score(X, y)
        mlflow.log_metric("accuracy", accuracy)
        
        # Log model
        mlflow.sklearn.log_model(model, "model")
        
        # Log artifacts
        mlflow.log_artifact("requirements.txt")
        
        return model

## MLflow Model Serving with GPU
import mlflow.pyfunc

class GPUModelWrapper(mlflow.pyfunc.PythonModel):
    """Wrapper for models requiring GPU inference"""
    
    def load_context(self, context):
        """Load model with GPU support"""
        import torch
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        # Load your model here
        self.model = None  # Replace with actual model loading
        
    def predict(self, context, model_input):
        """Run prediction on GPU"""
        import torch
        with torch.no_grad():
            # Convert to tensor, move to GPU
            input_tensor = torch.tensor(model_input.values, dtype=torch.float32).to(self.device)
            output = self.model(input_tensor)
            return output.cpu().numpy()

def serve_mlflow_model(model_uri, port=5001, workers=4):
    """Serve MLflow model with GPU worker configuration"""
    import subprocess
    
    cmd = [
        "mlflow", "models", "serve",
        "-m", model_uri,
        "-p", str(port),
        "-h", "0.0.0.0",
        "--workers", str(workers),
        "--enable-mlserver"
    ]
    
    subprocess.run(cmd)

# =============================================================================
# FEAST FEATURE STORE CONFIGURATION
# =============================================================================

from feast import FeatureStore, FeatureView, Field
from feast.types import Float32, Int64, String
from feast.data_source import FileSource
from datetime import datetime, timedelta

## Feast Repository Structure
# feast/
#   feature_store.yaml
#   features/
#     user_features.py
#     item_features.py

## feature_store.yaml
FEAST_CONFIG = """
project: sovereign_ml
registry: /tank/feast/data/registry.db
offline_store:
  type: postgres
  conn_str: "postgresql://feast_user:password@localhost:5432/feast"
online_store:
  type: redis
  connection_string: "localhost:6379"
"""

def setup_feast():
    """Initialize Feast with PostgreSQL and Redis backends"""
    import yaml
    
    config = yaml.safe_load(FEAST_CONFIG)
    
    store = FeatureStore(config=config)
    
    # Initialize the store
    store.apply()  # This creates the registry and tables
    
    print("Feast configured successfully")
    return store

## Feature View Definition
def create_user_features():
    """Define user feature views"""
    # Define data source (example: batch source from PostgreSQL)
    user_source = FileSource(
        path="/tank/feast/data/user_features.parquet",
        event_timestamp_column="event_timestamp",
        created_timestamp_column="created_timestamp"
    )
    
    user_features = FeatureView(
        name="user_features",
        entities=["user_id"],
        ttl=timedelta(days=1),
        schema=[
            Field(name="total_purchases", dtype=Int64),
            Field(name="avg_order_value", dtype=Float32),
            Field(name="last_purchase_days", dtype=Int64),
            Field(name="user_segment", dtype=String),
        ],
        source=user_source
    )
    
    return user_features

## Feast Materialization
def materialize_features(store, start_date, end_date):
    """Materialize features from offline to online store"""
    store.materialize(
        feature_views=["user_features", "item_features"],
        start_date=start_date,
        end_date=end_date
    )
    print(f"Materialized features from {start_date} to {end_date}")

## Feast Feature Retrieval for Inference
def get_online_features(store, entity_rows):
    """Retrieve online features for inference"""
    feature_vector = store.get_online_features(
        features=[
            "user_features:total_purchases",
            "user_features:avg_order_value",
            "user_features:user_segment",
        ],
        entity_rows=entity_rows
    )
    
    return feature_vector.to_df()

# Feast batch feature retrieval
def get_historical_features(store, entity_df, features):
    """Retrieve historical features for training"""
    job = store.get_historical_features(
        entity_df=entity_df,
        features=features
    )
    
    df = job.to_df()
    return df

# =============================================================================
# RAY DISTRIBUTED COMPUTING
# =============================================================================

import ray
from ray import tune
from ray.train import Checkpoint
import pandas as pd

## Ray Cluster Configuration
RAY_CONFIG = """
# ray-cluster.yaml
cluster_name: sovereign-ml-cluster
max_workers: 8

provider:
  type: local
  head_ip: 10.0.0.100

available_node_types:
  head_node:
    resources:
      CPU: 24
      GPU: 1
    min_workers: 1
    max_workers: 1

  worker_node:
    resources:
      CPU: 24
      GPU: 1
    min_workers: 0
    max_workers: 7

auth:
  ssh_user: ubuntu
  ssh_private_key: ~/.ssh/id_rsa
"""

def initialize_ray():
    """Initialize Ray with GPU support"""
    if not ray.is_initialized():
        ray.init(
            address="auto",  # Connect to existing cluster or start new
            num_cpus=24,
            num_gpus=1,
            object_store_memory=8 * 1024 * 1024 * 1024,  # 8GB
            runtime_env={
                "pip": ["torch", "scikit-learn", "pandas"]
            },
            log_to_driver=True
        )
    print(f"Ray initialized at {ray.get_dashboard_url()}")

## Ray Tune for Hyperparameter Optimization
def objective(config):
    """Objective function for hyperparameter tuning"""
    from sklearn.model_selection import cross_val_score
    from sklearn.ensemble import GradientBoostingClassifier
    
    model = GradientBoostingClassifier(
        n_estimators=config["n_estimators"],
        learning_rate=config["learning_rate"],
        max_depth=config["max_depth"],
        random_state=42
    )
    
    # Use dummy data - replace with actual data
    X, y = make_classification(n_sam

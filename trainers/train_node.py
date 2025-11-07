#!/usr/bin/env python3
"""
Trainer Node Script for Decentralized Ensemble Learning
-------------------------------------------------------
Each trainer:
  1. Loads a malware-detection dataset (CSV).
  2. Samples a subset (bagging simulation).
  3. Trains a RandomForest model.
  4. Saves metrics to JSON.
  5. Uploads metrics file to IPFS.
  6. Prints the CID (used for blockchain submission).
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import json, joblib, subprocess, os, sys, time

# === CONFIG ===
DATA_PATH = "../data/malware_detection.csv"
MODELS_DIR = "../models"
TRAINER_ID = sys.argv[1] if len(sys.argv) > 1 else "0"
TRAIN_SIZE = 0.6

# === 1. LOAD DATA ===
df = pd.read_csv(DATA_PATH)
target_col = "malicious"  # change if your label differs
X = df.drop(columns=[target_col])
y = df[target_col]

# Handle non-numeric columns quickly (drop for now)
X = X.select_dtypes(include=[np.number]).fillna(0)

# === 2. SAMPLE SUBSET (bagging) ===
X_train, _, y_train, _ = train_test_split(
    X, y, train_size=TRAIN_SIZE, stratify=y, random_state=int(TRAINER_ID) + 42
)

# === 3. TRAIN MODEL ===
model = RandomForestClassifier(
    n_estimators=100, random_state=int(TRAINER_ID) + 123, n_jobs=-1
)
model.fit(X_train, y_train)
train_acc = model.score(X_train, y_train)

# === 4. SAVE ARTIFACTS ===
os.makedirs(MODELS_DIR, exist_ok=True)
model_path = os.path.join(MODELS_DIR, f"model_node{TRAINER_ID}.pkl")
metrics_path = os.path.join(MODELS_DIR, f"metrics_node{TRAINER_ID}.json")

joblib.dump(model, model_path)
metrics = {
    "trainer_id": TRAINER_ID,
    "timestamp": int(time.time()),
    "model": "RandomForestClassifier",
    "train_samples": len(X_train),
    "n_features": X.shape[1],
    "train_accuracy": float(train_acc),
}
with open(metrics_path, "w") as f:
    json.dump(metrics, f, indent=2)

print(f"[Trainer {TRAINER_ID}] Model and metrics saved.")
print(f"Metrics file: {metrics_path}")

# === 5. UPLOAD METRICS TO IPFS ===
print(f"[Trainer {TRAINER_ID}] Uploading to IPFS...")
result = subprocess.run(
    ["node", "../src/upload_ipfs.js", metrics_path],
    capture_output=True,
    text=True,
)

# === 6. DISPLAY CID ===
print(result.stdout)
print(result.stderr)
print(f"[Trainer {TRAINER_ID}] Done.")

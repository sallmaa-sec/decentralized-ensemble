# trainers/train_node1.py
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import joblib, json, subprocess, os, random

# -------------------------------------------------------------
# 1. Load the malware dataset
# -------------------------------------------------------------
df = pd.read_csv(os.path.expanduser("~/decentralized-ensemble/data/malware_detection.csv"))
X = df.drop(columns=["classification"])
y = df["classification"]

# -------------------------------------------------------------
# 2. Train on a random subset to simulate decentralization
# -------------------------------------------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y, train_size=0.6, random_state=random.randint(0, 9999)
)

model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
model.fit(X_train, y_train)
acc = accuracy_score(y_test, model.predict(X_test))

# -------------------------------------------------------------
# 3. Save model & metrics
# -------------------------------------------------------------
os.makedirs("../models", exist_ok=True)
model_path = "../models/model_node1.pkl"
joblib.dump(model, model_path)

metrics = {"trainer": "node1", "accuracy": round(acc, 4)}
metrics_path = "../models/metrics_node1.json"
with open(metrics_path, "w") as f:
    json.dump(metrics, f, indent=2)

print(f"✅ Trainer node1 finished training — accuracy = {acc:.4f}")

# -------------------------------------------------------------
# 4. Generate fake CID (since IPFS is not available)
# -------------------------------------------------------------
fake_cid = f"trainer1-model-{int(acc*1000)}acc"
print("🧩 Generated fake CID:", fake_cid)

# -------------------------------------------------------------
# 5. Automatically submit the model CID to the blockchain
# -------------------------------------------------------------
# (Make sure submit_model.js reads CID from process.argv[4])
result = subprocess.run(
    ["npx", "truffle", "exec", "../scripts/submit_model.js", fake_cid],
    capture_output=True, text=True
)

print(result.stdout)
if result.stderr:
    print(result.stderr)

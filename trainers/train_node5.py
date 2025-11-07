# trainers/train_node5.py
import pandas as pd, os, json, joblib, random, subprocess
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score

df = pd.read_csv(os.path.expanduser("~/decentralized-ensemble/data/malware_detection.csv"))
X = df.drop(columns=["classification"])
y = df["classification"]

X_train, X_test, y_train, y_test = train_test_split(X, y, train_size=0.5, random_state=random.randint(0, 9999))
model = DecisionTreeClassifier(max_depth=8)
model.fit(X_train, y_train)
acc = accuracy_score(y_test, model.predict(X_test))

os.makedirs("../models", exist_ok=True)
joblib.dump(model, "../models/model_node5.pkl")

metrics = {"trainer": "node5", "accuracy": round(acc, 4)}
with open("../models/metrics_node5.json", "w") as f:
    json.dump(metrics, f, indent=2)

print(f"✅ Trainer node5 finished training — accuracy = {acc:.4f}")
fake_cid = f"trainer5-model-{int(acc*1000)}acc"
print("🧩 Generated fake CID:", fake_cid)

result = subprocess.run(
    ["npx", "truffle", "exec", "../scripts/submit_model.js", fake_cid, "--network", "development"],
    capture_output=True, text=True
)
print(result.stdout)
if result.stderr:
    print(result.stderr)

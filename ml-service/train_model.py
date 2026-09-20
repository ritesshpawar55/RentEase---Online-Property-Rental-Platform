import os
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error, r2_score, median_absolute_error
import joblib
import json
import warnings
warnings.filterwarnings('ignore')

print("=" * 60)
print("RentEase ML Model Training")
print("=" * 60)

# ── Load Dataset ──
print("\nLoading dataset...")
df = pd.read_csv('data/House_Rent_Dataset.csv')
print(f"Raw dataset: {df.shape[0]} rows, {df.shape[1]} columns")

# ── Deep Analysis ──
print(f"\nCity-wise average rent:")
print(df.groupby('City')['Rent'].mean().sort_values(ascending=False))

print(f"\nRent distribution:")
print(df['Rent'].describe())

# ── Aggressive Outlier Removal ──
print("\nCleaning data...")

# Remove extreme rents — use city-wise percentiles
def remove_city_outliers(df, column='Rent', lower=0.02, upper=0.97):
    cleaned = []
    for city in df['City'].unique():
        city_df = df[df['City'] == city].copy()
        q_low = city_df[column].quantile(lower)
        q_high = city_df[column].quantile(upper)
        cleaned.append(
            city_df[(city_df[column] >= q_low) &
                    (city_df[column] <= q_high)])
    return pd.concat(cleaned, ignore_index=True)

df = remove_city_outliers(df)
print(f"After city-wise outlier removal: {df.shape[0]} rows")

# Remove unrealistic sizes
df = df[(df['Size'] >= 100) & (df['Size'] <= 8000)]

# Cap BHK
df = df[df['BHK'] <= 5]

# Remove bathroom anomalies
df = df[df['Bathroom'] <= 6]

print(f"After all cleaning: {df.shape[0]} rows")

# ── Feature Engineering ──
print("\nEngineering features...")

# Floor extraction
def extract_floor(floor_str):
    s = str(floor_str).lower()
    if 'ground' in s: return 0
    if 'upper basement' in s: return -1
    if 'lower basement' in s: return -2
    try:
        return int(s.split(' out of ')[0])
    except:
        return 0

df['floor_num'] = df['Floor'].apply(extract_floor)

# Total floors extraction
def extract_total_floors(floor_str):
    s = str(floor_str).lower()
    try:
        if 'out of' in s:
            return int(s.split('out of')[1].strip())
        return 5  # default
    except:
        return 5

df['total_floors'] = df['Floor'].apply(extract_total_floors)

# Floor ratio (which floor relative to total)
df['floor_ratio'] = df.apply(
    lambda r: r['floor_num'] / max(r['total_floors'], 1),
    axis=1
)

# Furnishing encoding
furnish_map = {
    'Unfurnished': 0,
    'Semi-Furnished': 1,
    'Furnished': 2
}
df['furnished_num'] = df['Furnishing Status'].map(furnish_map)
df = df.dropna(subset=['furnished_num'])

# Size-based features
df['size_per_bhk'] = df['Size'] / df['BHK'].replace(0, 1)
df['bath_per_bhk'] = df['Bathroom'] / df['BHK'].replace(0, 1)
df['size_log'] = np.log1p(df['Size'])

# City-level median rent (target encoding)
city_median_rent = df.groupby('City')['Rent'].median()
df['city_median_rent'] = df['City'].map(city_median_rent)

# ── Label Encoders ──
city_encoder = LabelEncoder()
locality_encoder = LabelEncoder()

df['city_encoded'] = city_encoder.fit_transform(df['City'])
df['locality_encoded'] = locality_encoder.fit_transform(
        df['Area Locality'])

print(f"Cities: {city_encoder.classes_.tolist()}")
print(f"Unique localities: {df['Area Locality'].nunique()}")

# ── Final Feature Set ──
features = [
    'BHK',
    'Size',
    'size_log',
    'size_per_bhk',
    'floor_num',
    'floor_ratio',
    'furnished_num',
    'Bathroom',
    'bath_per_bhk',
    'city_encoded',
    'city_median_rent',
    'locality_encoded',
]

X = df[features]
y = df['Rent']

print(f"\nFinal feature matrix: {X.shape}")
print(f"\nRent after cleaning:")
print(y.describe())

# ── Rent Distribution Check ──
bins = [0, 10000, 20000, 30000, 50000, 100000, 999999]
labels = ['<10K', '10-20K', '20-30K', '30-50K', '50-100K', '>100K']
df['rent_range'] = pd.cut(df['Rent'], bins=bins, labels=labels)
print(f"\nRent distribution by range:")
print(df['rent_range'].value_counts().sort_index())

# ── Train/Test Split ──
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, shuffle=True
)

print(f"\nTraining: {X_train.shape[0]} | Test: {X_test.shape[0]}")

# ── Train Random Forest ──
print("\nTraining Random Forest (this takes 1-2 mins)...")
rf_model = RandomForestRegressor(
    n_estimators=500,
    max_depth=None,
    min_samples_split=2,
    min_samples_leaf=1,
    max_features='sqrt',
    bootstrap=True,
    random_state=42,
    n_jobs=-1
)
rf_model.fit(X_train, y_train)

# ── Evaluate ──
y_pred = rf_model.predict(X_test)

mae = mean_absolute_error(y_test, y_pred)
median_ae = median_absolute_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)

# MAPE on properties above ₹5000 only (avoids division by small numbers)
mask = y_test > 5000
mape = np.mean(np.abs(
    (y_test[mask] - y_pred[mask]) / y_test[mask])) * 100

print(f"\n{'='*40}")
print(f"Model Performance:")
print(f"  R²:          {r2:.4f}")
print(f"  MAE:         ₹{mae:,.0f}")
print(f"  Median AE:   ₹{median_ae:,.0f}")
print(f"  MAPE:        {mape:.2f}% (on rents > ₹5000)")
print(f"{'='*40}")

# ── Feature Importance ──
importances = pd.Series(
    rf_model.feature_importances_, index=features
).sort_values(ascending=False)
print(f"\nTop feature importances:")
print(importances.head(8))

# ── Sample Predictions ──
print(f"\nSample predictions vs actual:")
sample_idx = X_test.index[:5]
for i, idx in enumerate(sample_idx):
    actual = y_test.loc[idx]
    predicted = y_pred[i]
    city = df.loc[idx, 'City']
    bhk = df.loc[idx, 'BHK']
    print(f"  {city} {bhk}BHK | "
          f"Actual: ₹{actual:,} | "
          f"Predicted: ₹{predicted:,.0f} | "
          f"Error: {abs(actual-predicted)/actual*100:.1f}%")

# ── Save Everything ──
os.makedirs('model', exist_ok=True)

joblib.dump(rf_model, 'model/rent_model.pkl')
joblib.dump(city_encoder, 'model/city_encoder.pkl')
joblib.dump(locality_encoder, 'model/locality_encoder.pkl')

# Save city median rent mapping for Flask API
city_median_rent_dict = city_median_rent.to_dict()

metadata = {
    'features': features,
    'cities': city_encoder.classes_.tolist(),
    'localities': locality_encoder.classes_.tolist(),
    'city_median_rent': city_median_rent_dict,
    'mae': round(mae, 2),
    'median_ae': round(median_ae, 2),
    'r2': round(r2, 4),
    'mape': round(mape, 2),
    'training_samples': len(X_train),
    'test_samples': len(X_test)
}

with open('model/metadata.json', 'w') as f:
    json.dump(metadata, f, indent=2)

print(f"\nModel saved → model/rent_model.pkl")
print(f"Metadata saved → model/metadata.json")
print(f"\nTraining complete!")
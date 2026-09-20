from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import json
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

model = None
city_encoder = None
locality_encoder = None
metadata = None

def load_model():
    global model, city_encoder, locality_encoder, metadata
    try:
        model = joblib.load('model/rent_model.pkl')
        city_encoder = joblib.load('model/city_encoder.pkl')
        locality_encoder = joblib.load('model/locality_encoder.pkl')

        with open('model/metadata.json', 'r') as f:
            metadata = json.load(f)

        logger.info("Model loaded successfully")
        logger.info(f"R²: {metadata['r2']} | "
                   f"MAE: ₹{metadata['mae']:,}")
    except Exception as e:
        logger.error(f"Failed to load model: {e}")

load_model()

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ok",
        "service": "RentEase ML Service",
        "model_loaded": model is not None,
        "model_accuracy": {
            "r2": metadata['r2'],
            "mae": metadata['mae'],
            "median_ae": metadata.get('median_ae'),
            "mape": metadata['mape'],
            "training_samples": metadata['training_samples']
        } if metadata else None
    })

@app.route('/cities', methods=['GET'])
def get_cities():
    if metadata is None:
        return jsonify({"error": "Model not loaded"}), 500
    return jsonify({
        "cities": metadata['cities'],
        "count": len(metadata['cities'])
    })

@app.route('/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({"error": "ML model not loaded"}), 500

    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    try:
        # Extract inputs
        bhk = int(data.get('bhk', 2))
        sqft = float(data.get('sqft', 1000))
        floor_num = int(data.get('floor', 0))
        furnished = int(data.get('furnished', 1))
        bathrooms = int(data.get('bathrooms', bhk))
        city = str(data.get('city', ''))
        locality = str(data.get('locality', ''))

        # Encode city
        cities = metadata['cities']
        if city in cities:
            city_encoded = int(
                city_encoder.transform([city])[0])
            city_median_rent = metadata[
                'city_median_rent'].get(city, 20000)
        else:
            # Default to Hyderabad if city unknown
            fallback_city = 'Hyderabad' if 'Hyderabad' \
                    in cities else cities[0]
            city_encoded = int(
                city_encoder.transform([fallback_city])[0])
            city_median_rent = metadata[
                'city_median_rent'].get(fallback_city, 20000)
            logger.warning(f"Unknown city: {city}, "
                          f"using {fallback_city}")

        # Encode locality
        localities = metadata['localities']
        if locality in localities:
            locality_encoded = int(
                locality_encoder.transform([locality])[0])
        else:
            locality_encoded = len(localities) // 2
            logger.warning(f"Unknown locality: {locality}, "
                          f"using median index")

        # Derived features — must match training exactly
        size_log = np.log1p(sqft)
        size_per_bhk = sqft / max(bhk, 1)
        floor_ratio = floor_num / 10.0  # normalize
        bath_per_bhk = bathrooms / max(bhk, 1)

        # Feature vector — must match training order exactly
        features = np.array([[
            bhk,              # BHK
            sqft,             # Size
            size_log,         # size_log
            size_per_bhk,     # size_per_bhk
            floor_num,        # floor_num
            floor_ratio,      # floor_ratio
            furnished,        # furnished_num
            bathrooms,        # Bathroom
            bath_per_bhk,     # bath_per_bhk
            city_encoded,     # city_encoded
            city_median_rent, # city_median_rent
            locality_encoded, # locality_encoded
        ]])

        # Predict
        predicted_rent = float(model.predict(features)[0])
        predicted_rent = max(predicted_rent, 3000)

        # Range ±15%
        min_rent = int(predicted_rent * 0.85)
        max_rent = int(predicted_rent * 1.15)
        suggested = int(predicted_rent)

        logger.info(
            f"Prediction: {bhk}BHK {sqft}sqft "
            f"in {city}/{locality} → ₹{suggested:,}"
        )

        return jsonify({
            "min_rent": min_rent,
            "suggested": suggested,
            "max_rent": max_rent,
            "currency": "INR",
            "city": city,
            "model_r2": metadata['r2'],
            "inputs": {
                "bhk": bhk,
                "sqft": sqft,
                "floor": floor_num,
                "furnished": furnished,
                "bathrooms": bathrooms,
                "city": city,
                "locality": locality
            }
        })

    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return jsonify({
            "error": f"Prediction failed: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')
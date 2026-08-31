package com.rentease.backend.service;

import com.rentease.backend.dto.RentPredictionRequest;
import com.rentease.backend.dto.RentPredictionResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiPredictionService {

    private final RestTemplate restTemplate;

    @Value("${flask.ml.url:http://localhost:5000}")
    private String flaskUrl;

    public RentPredictionResponse predictRent(
            RentPredictionRequest request) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> body = Map.of(
                    "bhk", request.getBhk(),
                    "sqft", request.getSqft(),
                    "floor", request.getFloor() != null
                            ? request.getFloor() : 0,
                    "furnished", request.getFurnished() != null
                            ? request.getFurnished() : 1,
                    "bathrooms", request.getBathrooms() != null
                            ? request.getBathrooms() : request.getBhk(),
                    "city", request.getCity() != null
                            ? request.getCity() : "",
                    "locality", request.getLocality() != null
                            ? request.getLocality() : ""
            );

            HttpEntity<Map<String, Object>> entity =
                    new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    flaskUrl + "/predict",
                    entity,
                    Map.class
            );

            Map<String, Object> result = response.getBody();

            if (result == null || result.containsKey("error")) {
                log.error("Flask returned error: {}", result);
                return getFallbackPrediction(request);
            }

            RentPredictionResponse prediction =
                    new RentPredictionResponse();
            prediction.setMinRent(
                    ((Number) result.get("min_rent")).intValue());
            prediction.setSuggested(
                    ((Number) result.get("suggested")).intValue());
            prediction.setMaxRent(
                    ((Number) result.get("max_rent")).intValue());
            prediction.setCurrency("INR");
            prediction.setCity(request.getCity());

            log.info("AI prediction for {}: ₹{}",
                    request.getCity(),
                    prediction.getSuggested());

            return prediction;

        } catch (Exception e) {
            log.error("Flask ML service error: {}", e.getMessage());
            return getFallbackPrediction(request);
        }
    }

    // Fallback if Flask is down
    private RentPredictionResponse getFallbackPrediction(
            RentPredictionRequest request) {
        log.warn("Using fallback prediction — Flask unavailable");
        int base = (int) (request.getSqft() * 12)
                + (request.getBhk() * 2000);
        RentPredictionResponse fallback =
                new RentPredictionResponse();
        fallback.setMinRent((int) (base * 0.9));
        fallback.setSuggested(base);
        fallback.setMaxRent((int) (base * 1.1));
        fallback.setCurrency("INR");
        fallback.setNote("Estimated — AI service temporarily unavailable");
        return fallback;
    }
}
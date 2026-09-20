package com.rentease.backend.controller;

import com.rentease.backend.dto.*;
import com.rentease.backend.service.AiPredictionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiPredictionController {

    private final AiPredictionService aiPredictionService;

    @PostMapping("/predict-rent")
    public ResponseEntity<RentPredictionResponse> predictRent(
            @RequestBody RentPredictionRequest request) {
        return ResponseEntity.ok(
                aiPredictionService.predictRent(request));
    }
}
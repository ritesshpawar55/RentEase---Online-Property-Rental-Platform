package com.rentease.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
@Slf4j
public class SseService {

    // Thread-safe list of connected clients
    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    public SseEmitter createEmitter() {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);

        emitters.add(emitter);

        // Remove emitter when connection closes
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError(e -> emitters.remove(emitter));

        log.info("New SSE client connected. Total: {}", emitters.size());
        return emitter;
    }

    public void broadcastNewListing(Object data) {
        List<SseEmitter> deadEmitters = new CopyOnWriteArrayList<>();

        emitters.forEach(emitter -> {
            try {
                emitter.send(SseEmitter.event()
                        .name("new-listing")
                        .data(data));
            } catch (IOException e) {
                deadEmitters.add(emitter);
                log.warn("Dead SSE emitter removed");
            }
        });

        emitters.removeAll(deadEmitters);
    }

    public int getConnectedClients() {
        return emitters.size();
    }
}
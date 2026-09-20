import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function HeroCanvas() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Setup Scene, Camera, Renderer
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    
    // Add subtle ambient fog for depth
    scene.fog = THREE.FogExp2 ? new THREE.FogExp2('#0a0a14', 0.015) : null;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.z = 25;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // 2. Create Animated Grid Particles
    const particlesCount = 80;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particlesCount * 3);
    const initialPositions = [];

    // Initialize particles randomly in a 3D box
    for (let i = 0; i < particlesCount; i++) {
      const x = (Math.random() - 0.5) * 40;
      const y = (Math.random() - 0.5) * 25;
      const z = (Math.random() - 0.5) * 15;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      initialPositions.push({ x, y, z, angle: Math.random() * Math.PI * 2 });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Particle Point Material
    const pointsMaterial = new THREE.PointsMaterial({
      color: '#00D2FF',
      size: 0.18,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    const pointCloud = new THREE.Points(geometry, pointsMaterial);
    scene.add(pointCloud);

    // Lines Connecting Particles (Plexus Grid)
    const lineMaterial = new THREE.LineBasicMaterial({
      color: '#6C47FF',
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
    });

    let lineSegments;

    const updateLines = (coords) => {
      if (lineSegments) scene.remove(lineSegments);

      const linePositions = [];
      const threshold = 8.5; // Max distance to draw a line between nodes

      for (let i = 0; i < particlesCount; i++) {
        for (let j = i + 1; j < particlesCount; j++) {
          const dx = coords[i * 3] - coords[j * 3];
          const dy = coords[i * 3 + 1] - coords[j * 3 + 1];
          const dz = coords[i * 3 + 2] - coords[j * 3 + 2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < threshold) {
            linePositions.push(
              coords[i * 3], coords[i * 3 + 1], coords[i * 3 + 2],
              coords[j * 3], coords[j * 3 + 1], coords[j * 3 + 2]
            );
          }
        }
      }

      const lineGeometry = new THREE.BufferGeometry();
      lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
      lineSegments = new THREE.LineSegments(lineGeometry, lineMaterial);
      scene.add(lineSegments);
    };

    // 3. Animation Loop
    const clock = new THREE.Clock();

    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();
      const coords = geometry.attributes.position.array;

      // Wiggle particles slowly using sine wave offsets
      for (let i = 0; i < particlesCount; i++) {
        const init = initialPositions[i];
        
        // Dynamic offset
        coords[i * 3] = init.x + Math.sin(elapsedTime * 0.4 + init.angle) * 1.2;
        coords[i * 3 + 1] = init.y + Math.cos(elapsedTime * 0.3 + init.angle) * 0.9;
        coords[i * 3 + 2] = init.z + Math.sin(elapsedTime * 0.5 + init.angle) * 0.7;
      }

      geometry.attributes.position.needsUpdate = true;
      updateLines(coords);

      // Rotate whole cloud slightly
      pointCloud.rotation.y = elapsedTime * 0.02;
      pointCloud.rotation.x = elapsedTime * 0.01;
      if (lineSegments) {
        lineSegments.rotation.y = elapsedTime * 0.02;
        lineSegments.rotation.x = elapsedTime * 0.01;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 4. Handle Window Resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;

      camera.aspect = w / h;
      camera.updateProjectionMatrix();

      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // 5. Cleanup On Unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      
      geometry.dispose();
      pointsMaterial.dispose();
      lineMaterial.dispose();
      if (lineSegments) {
        lineSegments.geometry.dispose();
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden" 
    />
  );
}

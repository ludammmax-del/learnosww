import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Floating3DGlassOrbsProps {
  className?: string;
  count?: number;
}

export const Floating3DGlassOrbs: React.FC<Floating3DGlassOrbsProps> = ({
  className = '',
  count = 75,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let animationFrameId: number | null = null;
    let sphereGeom: THREE.SphereGeometry | null = null;
    let sharedMaterials: THREE.ShaderMaterial[] = [];

    const onMouseMove = (e: MouseEvent) => {
      mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 1.5;
      mouse.targetY = -(e.clientY / window.innerHeight - 0.5) * 1.5;
    };
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    let onResize: (() => void) | null = null;

    try {
      let width = container.clientWidth || window.innerWidth;
      let height = container.clientHeight || window.innerHeight;

      // 1. Scene & Camera
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      camera.position.z = 22;

      // 2. Renderer
      renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true,
        powerPreference: 'high-performance'
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      container.appendChild(renderer.domElement);

      // 3. Custom Liquid Glass Shader (NO circular pupil/eye specular dots!)
      const glassVertexShader = `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec2 vUv;
        varying vec3 vWorldPosition;

        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `;

      const glassFragmentShader = `
        uniform float uTime;
        uniform vec3 uColorA; // Deep terracotta / copper
        uniform vec3 uColorB; // Warm glowing amber / peach
        uniform vec3 uColorC; // Luminous cyan / sky-blue reflection
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec2 vUv;
        varying vec3 vWorldPosition;

        void main() {
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewPosition);

          float NdotV = max(dot(normal, viewDir), 0.0);
          float rim = pow(1.0 - NdotV, 2.0);

          float grad = normal.y * 0.55 + normal.x * 0.25 + 0.5;
          grad = smoothstep(0.05, 0.95, grad);

          float wave = sin(vWorldPosition.y * 0.4 + vWorldPosition.x * 0.3 + uTime * 0.35) * 0.08;
          float liquidMix = clamp(grad + wave, 0.0, 1.0);

          vec3 coreLiquid = mix(uColorA, uColorB, liquidMix);
          float upperSheenFactor = smoothstep(0.15, 0.85, normal.y) * 0.65;
          vec3 blendedBody = mix(coreLiquid, uColorC, upperSheenFactor);

          float rimSheen = pow(rim, 1.5) * 0.85;
          vec3 rimGlow = mix(vec3(1.0, 0.98, 0.95), uColorC, 0.35) * rimSheen;

          float softboxBand = exp(-pow((normal.y - 0.42) * 5.0, 2.0)) * 0.22 * (1.0 - NdotV * 0.4);
          vec3 softboxLight = vec3(1.0, 0.99, 0.97) * softboxBand;

          float bottomWarmBounce = pow(max(-normal.y, 0.0), 2.2) * 0.25;
          vec3 bounceLight = uColorA * bottomWarmBounce;

          vec3 finalColor = blendedBody * 0.8 + rimGlow + softboxLight + bounceLight;
          float alpha = clamp(0.72 + rim * 0.26, 0.0, 0.96);

          gl_FragColor = vec4(finalColor, alpha);
        }
      `;

      // 4. Color Palettes
      const colorThemes = [
        {
          a: new THREE.Vector3(0.82, 0.32, 0.22),
          b: new THREE.Vector3(0.96, 0.62, 0.48),
          c: new THREE.Vector3(0.70, 0.85, 0.96),
        },
        {
          a: new THREE.Vector3(0.88, 0.40, 0.28),
          b: new THREE.Vector3(0.98, 0.72, 0.58),
          c: new THREE.Vector3(0.78, 0.89, 0.98),
        },
        {
          a: new THREE.Vector3(0.75, 0.28, 0.20),
          b: new THREE.Vector3(0.94, 0.58, 0.44),
          c: new THREE.Vector3(0.65, 0.82, 0.95),
        }
      ];

      sharedMaterials = colorThemes.map((theme) => {
        return new THREE.ShaderMaterial({
          vertexShader: glassVertexShader,
          fragmentShader: glassFragmentShader,
          uniforms: {
            uTime: { value: 0 },
            uColorA: { value: theme.a },
            uColorB: { value: theme.b },
            uColorC: { value: theme.c },
          },
          transparent: true,
          depthWrite: false,
          blending: THREE.NormalBlending,
        });
      });

      sphereGeom = new THREE.SphereGeometry(1, 32, 32);

      const pseudoRandom = (seed: number) => {
        const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
        return x - Math.floor(x);
      };

      const orbCount = Math.max(count, 75);
      const orbs: {
        mesh: THREE.Mesh;
        initialPos: THREE.Vector3;
        speed: number;
        freqX: number;
        freqY: number;
        freqZ: number;
        ampX: number;
        ampY: number;
        rotSpeed: number;
        themeIdx: number;
      }[] = [];

      for (let i = 0; i < orbCount; i++) {
        const r1 = pseudoRandom(i * 7 + 1);
        const r2 = pseudoRandom(i * 13 + 3);
        const r3 = pseudoRandom(i * 19 + 5);
        const r4 = pseudoRandom(i * 23 + 7);
        const r5 = pseudoRandom(i * 29 + 11);

        let radius: number;
        if (i < 8) {
          radius = 2.2 + r1 * 0.7;
        } else if (i < 30) {
          radius = 1.3 + r1 * 0.7;
        } else if (i < 55) {
          radius = 0.8 + r1 * 0.45;
        } else {
          radius = 0.45 + r1 * 0.35;
        }

        const angle = (i / orbCount) * Math.PI * 4 + r2 * 0.8;
        const dist = 5.0 + r3 * 13.0;
        const x = Math.cos(angle) * dist + (r4 - 0.5) * 6;
        const y = Math.sin(angle) * (dist * 0.75) + (r5 - 0.5) * 5;
        const z = -6.0 + r1 * 10.0;

        const themeIdx = i % sharedMaterials.length;
        const mesh = new THREE.Mesh(sphereGeom, sharedMaterials[themeIdx]);
        mesh.scale.setScalar(radius);
        mesh.position.set(x, y, z);
        scene.add(mesh);

        orbs.push({
          mesh,
          initialPos: new THREE.Vector3(x, y, z),
          speed: 0.5 + r2 * 0.7,
          freqX: 0.25 + r3 * 0.3,
          freqY: 0.2 + r4 * 0.3,
          freqZ: 0.15 + r5 * 0.25,
          ampX: 0.35 + r1 * 0.5,
          ampY: 0.45 + r2 * 0.65,
          rotSpeed: 0.1 + r3 * 0.2,
          themeIdx,
        });
      }

      window.addEventListener('mousemove', onMouseMove, { passive: true });

      onResize = () => {
        if (!container || !renderer) return;
        width = container.clientWidth || window.innerWidth;
        height = container.clientHeight || window.innerHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      };
      window.addEventListener('resize', onResize);

      const startTimestamp = performance.now();

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        const elapsedTime = (performance.now() - startTimestamp) * 0.001;

        mouse.x += (mouse.targetX - mouse.x) * 0.04;
        mouse.y += (mouse.targetY - mouse.y) * 0.04;

        camera.position.x = mouse.x * 1.8;
        camera.position.y = mouse.y * 1.4;
        camera.lookAt(0, 0, 0);

        orbs.forEach((orb, idx) => {
          const t = elapsedTime * orb.speed;
          orb.mesh.position.x = orb.initialPos.x + Math.sin(t * orb.freqX + idx * 0.8) * orb.ampX;
          orb.mesh.position.y = orb.initialPos.y + Math.cos(t * orb.freqY + idx * 1.2) * orb.ampY;
          orb.mesh.position.z = orb.initialPos.z + Math.sin(t * orb.freqZ + idx * 0.6) * 0.35;

          orb.mesh.rotation.y = Math.sin(t * 0.15 + idx) * 0.2;
          orb.mesh.rotation.x = Math.cos(t * 0.12 + idx) * 0.15;
        });

        sharedMaterials.forEach((mat) => {
          mat.uniforms.uTime.value = elapsedTime;
        });

        if (renderer) {
          renderer.render(scene, camera);
        }
      };

      animate();
    } catch (err) {
      console.warn('Three.js / WebGL fallback in Floating3DGlassOrbs:', err);
    }

    // 9. Cleanup
    return () => {
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', onMouseMove);
      if (onResize) window.removeEventListener('resize', onResize);
      if (container && renderer && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      if (renderer) renderer.dispose();
      if (sphereGeom) sphereGeom.dispose();
      sharedMaterials.forEach((m) => m.dispose());
    };
  }, [count]);

  return (
    <div 
      ref={mountRef} 
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
      style={{ zIndex: 1 }}
    />
  );
};


"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import * as random from "maath/random";

function GravitationalStars() {
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(
    () =>
      random.inSphere(new Float32Array(6000), {
        radius: 1.2,
      }),
    [],
  );

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3),
    );
    return geo;
  }, [positions]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
          uMouse: { value: new THREE.Vector2(10, 10) },
          uStrength: { value: 0.045 },
        },
        vertexShader: `
          uniform vec2 uMouse;
          uniform float uStrength;

          void main() {
            vec4 viewPosition =
              modelViewMatrix * vec4(position, 1.0);

            vec4 clipPosition =
              projectionMatrix * viewPosition;

            vec2 screenPosition =
              clipPosition.xy / clipPosition.w;

            vec2 delta = screenPosition - uMouse;
            float distanceToCursor = length(delta);

            float influence =
              exp(-distanceToCursor * 8.0);

            vec2 direction =
              delta / max(distanceToCursor, 0.001);

            // Bend nearby starlight away from the lens.
            screenPosition +=
              direction * influence * uStrength;

            clipPosition.xy =
              screenPosition * clipPosition.w;

            gl_Position = clipPosition;

            gl_PointSize = 2.0;
          }
        `,
        fragmentShader: `
          void main() {
            float distanceFromCenter =
              length(gl_PointCoord - vec2(0.5));

            float glow =
              1.0 - smoothstep(0.15, 0.5, distanceFromCenter);

            gl_FragColor =
              vec4(0.78, 0.84, 1.0, glow);
          }
        `,
      }),
    [],
  );

  useFrame(({ pointer }, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.x -= delta / 10;
      pointsRef.current.rotation.y -= delta / 15;
    }

    // Follow the cursor in the canvas.
    material.uniforms.uMouse.value.copy(pointer);
  });

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      material={material}
    />
  );
}

export const StarBackground = () => {
  return (
    <GravitationalStars />
  );
};

export const StarsCanvas = () => (
  <div className="fixed inset-0 -z-10 h-full w-full pointer-events-auto">
    <Canvas
      camera={{ position: [0, 0, 1] }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: false }}
    >
      <StarBackground />
    </Canvas>
  </div>
);

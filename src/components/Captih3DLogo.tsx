"use client";

import { Canvas, useFrame, type ThreeElements } from "@react-three/fiber";
import { useGLTF, Center, Bounds } from "@react-three/drei";
import { Suspense, useRef } from "react";
import * as THREE from "three";
import { prefersReducedMotion } from "@/lib/motion";

const MODEL_URL = "/captih-3d.glb";

/**
 * Captih's 3D logo (decimated to 16k tris, ~290KB).
 * On-brand motion — "listening" metaphor:
 *  1. Breathing pulse  → subtle scale oscillation, like the mic is alive listening
 *  2. Cursor tracking  → orients toward the user, like a listener facing the speaker
 *  3. Micro idle drift → ambient motion when cursor is still
 * No random bouncing or auto-rotation — every motion ties back to "the tool is listening to you".
 */
// Base resting rotation — orients the model so the C-face shows toward camera.
// Tripo exports tend to face away by default; adjust these if the front isn't visible.
const BASE_ROT_X = 0;                       // tilt forward/back (try 0.1 for slight top-down)
const BASE_ROT_Y = Math.PI + Math.PI / 2;   // 180° flip + 90° right turn = 270°
const BASE_ROT_Z = 0;

function Model() {
  const { scene } = useGLTF(MODEL_URL) as unknown as { scene: THREE.Group };
  const ref = useRef<THREE.Group>(null);
  const reduced = useRef(prefersReducedMotion());

  // Apply brand material once — saffron with subtle metallic sheen
  scene.traverse((child: THREE.Object3D) => {
    const mesh = child as THREE.Mesh;
    if (mesh.isMesh) {
      mesh.material = new THREE.MeshStandardMaterial({
        color: new THREE.Color("#FF5C2B"),
        metalness: 0.25,
        roughness: 0.42,
        envMapIntensity: 1.1,
      });
      mesh.castShadow = false;
      mesh.receiveShadow = false;
    }
  });

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;

    if (!reduced.current) {
      // 1. Breathing pulse — ~50bpm rhythm = calm, attentive respiration
      const pulse = 1 + Math.sin(t * 1.3) * 0.028;
      ref.current.scale.setScalar(pulse);

      // 3. Micro idle drift — keeps the scene alive when cursor is still
      ref.current.position.y = Math.sin(t * 0.7) * 0.04;
    }

    // 2. Cursor-reactive turn — orients toward the user, relative to BASE_ROT
    const mx = state.pointer.x;
    const my = state.pointer.y;
    ref.current.rotation.y = THREE.MathUtils.lerp(
      ref.current.rotation.y,
      BASE_ROT_Y + mx * 0.4,
      0.055
    );
    ref.current.rotation.x = THREE.MathUtils.lerp(
      ref.current.rotation.x,
      BASE_ROT_X + my * -0.3,
      0.055
    );
    ref.current.rotation.z = BASE_ROT_Z;
  });

  return (
    <Bounds fit clip observe margin={1.18}>
      <Center>
        <primitive
          ref={ref}
          object={scene}
          rotation={[BASE_ROT_X, BASE_ROT_Y, BASE_ROT_Z]}
        />
      </Center>
    </Bounds>
  );
}

function Lighting() {
  return (
    <>
      {/* Soft ambient — reads as page-bg light bouncing */}
      <ambientLight intensity={0.55} color="#F4F1EA" />
      {/* Key light — saffron from upper right, mimics the page's radial glow */}
      <directionalLight position={[4, 5, 3]} intensity={2.2} color="#FF5C2B" />
      {/* Fill light — cool green from lower left for rim separation */}
      <directionalLight position={[-4, -2, -1]} intensity={0.9} color="#7CE2B1" />
      {/* Edge light — white pin from behind for silhouette */}
      <pointLight position={[0, 0, -5]} intensity={1.0} color="#F4F1EA" />
    </>
  );
}

export function Captih3DLogo() {
  return (
    <div
      className="relative h-full w-full"
      style={{ minHeight: 560, aspectRatio: "1 / 1" }}
    >
      {/* Ambient saffron glow behind the canvas */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-20 opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(255,92,43,0.22), rgba(255,92,43,0.04) 45%, transparent 70%)",
        }}
      />
      <Canvas
        camera={{ position: [0, 0, 4], fov: 38 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        dpr={[1, 2]}
        className="relative"
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          <Lighting />
          <Model />
        </Suspense>
      </Canvas>
    </div>
  );
}

// Preload the GLB so the hero gets it before paint
useGLTF.preload(MODEL_URL);

// Suppress TS unused-import warning for ThreeElements (kept for future jsx extension)
export type _R3F = ThreeElements;

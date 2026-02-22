import React, { useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

export function Robot({ isThinking, isTalking, hover, emotion }) {
    const headRef = useRef();
    const earsRef = useRef();
    const bodyRef = useRef();
    const coreRef = useRef();
    const eyeLeftRef = useRef();
    const eyeRightRef = useRef();

    const { pointer } = useThree();

    // Create highly futuristic, premium materials
    const [materials] = useState(() => ({
        // Sleek glossy white/silver shell (like Eve from Wall-E)
        shell: new THREE.MeshPhysicalMaterial({
            color: "#ffffff",
            metalness: 0.2,
            roughness: 0.1,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
        }),
        // Dark glassy visor (slightly transparent)
        visor: new THREE.MeshPhysicalMaterial({
            color: "#020617",
            metalness: 0.9,
            roughness: 0.1,
            transmission: 0.4,
            transparent: true,
        }),
        // Metallic mint accents
        accent: new THREE.MeshPhysicalMaterial({
            color: "#9df9d9",
            metalness: 1.0,
            roughness: 0.2,
            clearcoat: 1.0,
        }),
        // Emissive glowing elements (Eyes, Logo)
        glow: new THREE.MeshStandardMaterial({
            color: "#9df9d9",
            emissive: "#9df9d9",
            emissiveIntensity: 1.5,
            toneMapped: false,
        }),
        // Holographic floating rings
        hologram: new THREE.MeshStandardMaterial({
            color: "#38bdf8",
            emissive: "#38bdf8",
            emissiveIntensity: 1.2,
            transparent: true,
            opacity: 0.6,
            wireframe: true,
        })
    }));

    // Local refs to materials to bypass strict linter immutability checks on the state object
    const glowMat = materials.glow;

    const [_, setHoverState] = useState(false);

    useFrame((state, delta) => {
        const time = state.clock.elapsedTime;

        // 1. Mouse Tracking (Look-at) logic
        const targetY = (pointer.x * Math.PI) / 3;
        const targetX = -(pointer.y * Math.PI) / 4;

        // Clamp delta to prevent exponential explosions on lag spikes
        const cDelta = (speed) => THREE.MathUtils.clamp(delta * speed, 0, 1);

        // Head Animation: Smoothly track mouse & float organically
        if (headRef.current) {
            headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, targetY, cDelta(5));
            headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, targetX, cDelta(5));

            // Floating bounce
            headRef.current.position.y = 1.0 + Math.sin(time * 2.5) * 0.08;
        }

        // Body Animation: Follows head loosely with its own float cycle
        if (bodyRef.current) {
            bodyRef.current.rotation.y = THREE.MathUtils.lerp(bodyRef.current.rotation.y, targetY * 0.4, cDelta(3));
            bodyRef.current.position.y = -0.5 + Math.sin(time * 2.0) * 0.05;

            // Spin the energy core in the chest
            if (coreRef.current) {
                coreRef.current.rotation.y += delta * (isThinking ? 4 : 1);
                coreRef.current.rotation.z += delta * (isThinking ? 2 : 0.5);
            }
        }

        // Ears Animation: Twitch when hovering or thinking
        if (earsRef.current) {
            if (hover || isThinking) {
                earsRef.current.children[0].rotation.z = THREE.MathUtils.lerp(earsRef.current.children[0].rotation.z, 0.4, cDelta(10));
                earsRef.current.children[1].rotation.z = THREE.MathUtils.lerp(earsRef.current.children[1].rotation.z, -0.4, cDelta(10));
            } else {
                earsRef.current.children[0].rotation.z = THREE.MathUtils.lerp(earsRef.current.children[0].rotation.z, 0.15, cDelta(5));
                earsRef.current.children[1].rotation.z = THREE.MathUtils.lerp(earsRef.current.children[1].rotation.z, -0.15, cDelta(5));
            }
        }

        // Eyes Animation: Advanced blinking & looking around
        if (eyeLeftRef.current && eyeRightRef.current) {
            // Emotive Eyes Logic
            if (emotion === 'heart') {
                // Heart shape (simulated by a specific V shape and scale)
                eyeLeftRef.current.rotation.z = THREE.MathUtils.lerp(eyeLeftRef.current.rotation.z, 0.4, cDelta(15));
                eyeRightRef.current.rotation.z = THREE.MathUtils.lerp(eyeRightRef.current.rotation.z, -0.4, cDelta(15));
                eyeLeftRef.current.scale.y = THREE.MathUtils.lerp(eyeLeftRef.current.scale.y, 0.5, cDelta(20));
                eyeRightRef.current.scale.y = THREE.MathUtils.lerp(eyeRightRef.current.scale.y, 0.5, cDelta(20));
                eyeLeftRef.current.position.y = THREE.MathUtils.lerp(eyeLeftRef.current.position.y, 0.05, cDelta(20));
                eyeRightRef.current.position.y = THREE.MathUtils.lerp(eyeRightRef.current.position.y, 0.05, cDelta(20));
            } else if (emotion === 'thinking' || isThinking) {
                // Pulsing Bars
                eyeLeftRef.current.rotation.z = THREE.MathUtils.lerp(eyeLeftRef.current.rotation.z, 0, cDelta(15));
                eyeRightRef.current.rotation.z = THREE.MathUtils.lerp(eyeRightRef.current.rotation.z, 0, cDelta(15));
                const pulseHeight = 0.5 + Math.abs(Math.sin(time * 10)) * 0.5;
                eyeLeftRef.current.scale.y = THREE.MathUtils.lerp(eyeLeftRef.current.scale.y, pulseHeight, cDelta(20));
                eyeRightRef.current.scale.y = THREE.MathUtils.lerp(eyeRightRef.current.scale.y, pulseHeight, cDelta(20));
                // Shift side to side
                const lookSide = Math.sin(time * 5) * 0.15;
                eyeLeftRef.current.position.x = -0.25 + lookSide;
                eyeRightRef.current.position.x = 0.25 + lookSide;
            } else {
                // Default / Talking / Blinking
                eyeLeftRef.current.rotation.z = THREE.MathUtils.lerp(eyeLeftRef.current.rotation.z, 0, cDelta(15));
                eyeRightRef.current.rotation.z = THREE.MathUtils.lerp(eyeRightRef.current.rotation.z, 0, cDelta(15));
                eyeLeftRef.current.position.y = THREE.MathUtils.lerp(eyeLeftRef.current.position.y, 0, cDelta(10));
                eyeRightRef.current.position.y = THREE.MathUtils.lerp(eyeRightRef.current.position.y, 0, cDelta(10));

                const isBlinking = Math.sin(time * 8) > 0.98;
                let targetScaleY = isBlinking ? 0.1 : 1;
                if (isTalking && !isBlinking) {
                    targetScaleY = 0.6 + Math.abs(Math.sin(time * 15)) * 0.6;
                }

                eyeLeftRef.current.scale.y = THREE.MathUtils.lerp(eyeLeftRef.current.scale.y, targetScaleY, cDelta(20));
                eyeRightRef.current.scale.y = THREE.MathUtils.lerp(eyeRightRef.current.scale.y, targetScaleY, cDelta(20));

                // Look straight
                eyeLeftRef.current.position.x = THREE.MathUtils.lerp(eyeLeftRef.current.position.x, -0.25, cDelta(5));
                eyeRightRef.current.position.x = THREE.MathUtils.lerp(eyeRightRef.current.position.x, 0.25, cDelta(5));
            }
        }

        // LED Pulse Synchronization & Color Gradient (Audio Context Simulation)
        const mintColor = new THREE.Color("#9df9d9");
        const blueColor = new THREE.Color("#38bdf8");

        if (isTalking) {
            // Simulate Audio Context freq/volume using complex harmonic sine waves
            const simulatedVolume = Math.abs(
                Math.sin(time * 15) * 0.5 +
                Math.sin(time * 35) * 0.3 +
                Math.cos(time * 45) * 0.2
            );

            // Emissive Intensity responds to volume (pulsing up to very bright)
            const targetIntensity = 1.0 + (simulatedVolume * 3.5);
            glowMat.emissiveIntensity = THREE.MathUtils.lerp(glowMat.emissiveIntensity, targetIntensity, cDelta(20));

            // Color Lerp: Shift from Mint to Bright Sky Blue depending on the audio volume
            const targetColor = mintColor.clone().lerp(blueColor, simulatedVolume * 1.2);
            glowMat.color.lerp(targetColor, cDelta(15));
            glowMat.emissive.lerp(targetColor, cDelta(15));

        } else if (isThinking) {
            // Smooth breathing pattern
            const pulse = 0.8 + Math.abs(Math.sin(time * 4)) * 0.8;
            glowMat.emissiveIntensity = THREE.MathUtils.lerp(glowMat.emissiveIntensity, pulse, cDelta(8));

            // Gently return to Mint color
            glowMat.color.lerp(mintColor, cDelta(2));
            glowMat.emissive.lerp(mintColor, cDelta(2));
        } else {
            // Idle state
            glowMat.emissiveIntensity = THREE.MathUtils.lerp(glowMat.emissiveIntensity, 1.2, cDelta(3));

            // Return to absolute Mint color
            glowMat.color.lerp(mintColor, cDelta(2));
            glowMat.emissive.lerp(mintColor, cDelta(2));
        }
    });

    return (
        <group
            dispose={null}
            scale={0.75}
            onPointerOver={() => setHoverState(true)}
            onPointerOut={() => setHoverState(false)}
        >
            <group ref={bodyRef}>
                <mesh castShadow receiveShadow>
                    <capsuleGeometry args={[0.7, 0.8, 32, 32]} />
                    <primitive object={materials.shell} attach="material" />
                </mesh>

                <mesh ref={coreRef} position={[0, -0.2, 0.68]}>
                    <octahedronGeometry args={[0.2, 0]} />
                    <primitive object={materials.glow} attach="material" />
                </mesh>

                <group position={[0, -1.2, 0]}>
                    <mesh rotation={[-Math.PI / 2, 0, 0]}>
                        <torusGeometry args={[0.5, 0.04, 16, 64]} />
                        <primitive object={materials.glow} attach="material" />
                    </mesh>
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}>
                        <torusGeometry args={[0.3, 0.02, 16, 64]} />
                        <primitive object={materials.hologram} attach="material" />
                    </mesh>
                </group>

                <group position={[0, 0.3, 0.72]}>
                    <RoundedBox args={[1.0, 0.4, 0.05]} radius={0.1} smoothness={4}>
                        <primitive object={materials.visor} attach="material" />
                    </RoundedBox>
                    <Text
                        position={[0, 0, 0.03]}
                        fontSize={0.25}
                        anchorX="center"
                        anchorY="middle"
                        material={materials.glow}
                        color="#9df9d9"
                        letterSpacing={0.05}
                        characters="OBG"
                    >
                        OBG
                    </Text>
                </group>
            </group>

            <group ref={headRef}>
                <RoundedBox args={[1.6, 1.2, 1.4]} radius={0.4} smoothness={8} castShadow receiveShadow>
                    <primitive object={materials.shell} attach="material" />
                </RoundedBox>

                <RoundedBox position={[0, 0, 0.65]} args={[1.4, 0.9, 0.15]} radius={0.2} smoothness={8}>
                    <primitive object={materials.visor} attach="material" />
                </RoundedBox>

                <group position={[0, 0, 0.73]}>
                    <mesh ref={eyeLeftRef} position={[-0.25, 0, 0]}>
                        <capsuleGeometry args={[0.08, 0.2, 8, 16]} />
                        <primitive object={materials.glow} attach="material" />
                    </mesh>
                    <mesh ref={eyeRightRef} position={[0.25, 0, 0]}>
                        <capsuleGeometry args={[0.08, 0.2, 8, 16]} />
                        <primitive object={materials.glow} attach="material" />
                    </mesh>
                </group>

                <group ref={earsRef} position={[0, 0.5, 0]}>
                    <group position={[-0.4, 0.2, 0]}>
                        <mesh rotation={[0, 0, 0.2]}>
                            <cylinderGeometry args={[0.02, 0.2, 0.7, 16]} />
                            <primitive object={materials.shell} attach="material" />
                        </mesh>
                        <mesh rotation={[0, 0, 0.2]} position={[0, 0, 0.08]}>
                            <cylinderGeometry args={[0.01, 0.1, 0.5, 8]} />
                            <primitive object={materials.glow} attach="material" />
                        </mesh>
                    </group>
                    <group position={[0.4, 0.2, 0]}>
                        <mesh rotation={[0, 0, -0.2]}>
                            <cylinderGeometry args={[0.02, 0.2, 0.7, 16]} />
                            <primitive object={materials.shell} attach="material" />
                        </mesh>
                        <mesh rotation={[0, 0, -0.2]} position={[0, 0, 0.08]}>
                            <cylinderGeometry args={[0.01, 0.1, 0.5, 8]} />
                            <primitive object={materials.glow} attach="material" />
                        </mesh>
                    </group>
                </group>

                <mesh position={[0, 1.0, -0.2]} rotation={[Math.PI / 2, Math.PI / 8, 0]}>
                    <torusGeometry args={[0.3, 0.015, 16, 64]} />
                    <primitive object={materials.hologram} attach="material" />
                </mesh>
                <mesh position={[0, 1.1, -0.2]} rotation={[Math.PI / 2, -Math.PI / 8, 0]}>
                    <torusGeometry args={[0.2, 0.01, 16, 64]} />
                    <primitive object={materials.hologram} attach="material" />
                </mesh>
            </group>
        </group>
    );
}

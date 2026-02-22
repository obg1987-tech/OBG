import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Ring } from '@react-three/drei';

export function SummoningCircle({ isThinking, isSpeaking }) {
    const innerRingRef = useRef();
    const outerRingRef = useRef();

    useFrame((state, delta) => {
        // Rotation speeds base
        let baseSpeedInner = 0.5;
        let baseSpeedOuter = -0.3;

        if (isThinking) {
            baseSpeedInner = 3.0; // Fast loading spin
            baseSpeedOuter = -2.0;
        } else if (isSpeaking) {
            // Pulse effect on speed
            const pulse = Math.abs(Math.sin(state.clock.elapsedTime * 8));
            baseSpeedInner = 1.0 + pulse * 2.0;
            baseSpeedOuter = -1.0 - pulse;
        }

        if (innerRingRef.current) innerRingRef.current.rotation.z += delta * baseSpeedInner;
        if (outerRingRef.current) outerRingRef.current.rotation.z += delta * baseSpeedOuter;
    });

    return (
        <group position={[0, -0.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <Ring ref={outerRingRef} args={[2.5, 2.6, 64]} position={[0, 0, 0.01]}>
                <meshBasicMaterial attach="material" color="#38bdf8" transparent opacity={isSpeaking ? 0.8 : 0.2} wireframe={true} />
            </Ring>

            <Ring ref={innerRingRef} args={[1.8, 2.0, 32]} position={[0, 0, 0.02]}>
                <meshBasicMaterial
                    attach="material"
                    color="#9df9d9"
                    transparent
                    opacity={isThinking ? 0.8 : (isSpeaking ? 0.6 : 0.3)}
                />
            </Ring>

            <mesh position={[0, 0, 0]}>
                <circleGeometry args={[2.8, 32]} />
                <meshBasicMaterial attach="material" color="#9df9d9" transparent opacity={0.05} />
            </mesh>
        </group>
    );
}

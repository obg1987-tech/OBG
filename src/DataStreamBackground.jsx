import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function DataStreamBackground({ isSpeaking }) {
    const particlesRef = useRef();

    const particleCount = 1000;

    const [[positions, speeds]] = useState(() => {
        const pos = new Float32Array(particleCount * 3);
        const spd = new Float32Array(particleCount);
        for (let i = 0; i < particleCount; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 40; // x
            pos[i * 3 + 1] = (Math.random() - 0.5) * 40; // y
            pos[i * 3 + 2] = (Math.random() - 0.5) * 40 - 10; // z (start back)
            spd[i] = Math.random() * 0.2 + 0.05;
        }
        return [pos, spd];
    });

    useFrame((state, delta) => {
        if (!particlesRef.current || !particlesRef.current.geometry || !particlesRef.current.geometry.attributes.position) return;

        // Base speed + fast forward when speaking
        const speedMultiplier = isSpeaking ? 5.0 : 1.0;

        const positionsArray = particlesRef.current.geometry.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
            // Move forward towards the camera (Z axis)
            positionsArray[i * 3 + 2] += speeds[i] * speedMultiplier * delta * 50;

            // Loop particles back
            if (positionsArray[i * 3 + 2] > 10) {
                positionsArray[i * 3 + 2] = -30;
                positionsArray[i * 3 + 0] = (Math.random() - 0.5) * 40;
                positionsArray[i * 3 + 1] = (Math.random() - 0.5) * 40;
            }
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true;
    });

    return (
        <points ref={particlesRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={positions.length / 3}
                    array={positions}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                color="#9df9d9"
                size={0.1}
                transparent
                opacity={0.6}
                blending={THREE.AdditiveBlending}
            />
        </points>
    );
}

'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Full-viewport animated light-golden background:
 * a flowing shader gradient (cream -> pale gold -> gold) plus drifting gold dust.
 * Sits behind the app (fixed, pointer-events: none) and pauses when the tab is hidden.
 */
export default function GoldenBackdrop() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'low-power' });
    } catch {
      return; // WebGL unavailable: the CSS gradient on <body> remains as fallback.
    }

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const isSmall = window.innerWidth < 768;
    const dpr = Math.min(window.devicePixelRatio || 1, isSmall ? 1 : 1.5);
    renderer.setPixelRatio(dpr);
    host.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = 'width:100%;height:100%;display:block';

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uMouse: { value: new THREE.Vector2(0.7, 0.8) },
    };

    // ---- flowing gradient
    const bg = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        uniforms,
        depthTest: false,
        vertexShader: /* glsl */ `
          void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
        `,
        fragmentShader: /* glsl */ `
          precision highp float;
          uniform float uTime;
          uniform vec2 uRes;
          uniform vec2 uMouse;

          void main() {
            vec2 uv = gl_FragCoord.xy / uRes;
            vec2 p = uv * vec2(uRes.x / uRes.y, 1.0) * 1.8;
            float t = uTime * 0.06;

            float w = sin(p.x * 2.1 + t * 3.0) * 0.5
                    + sin(p.y * 3.0 - t * 2.2) * 0.5
                    + sin((p.x + p.y) * 1.6 + t * 4.0) * 0.5
                    + sin(length(p - vec2(1.4, 0.7)) * 3.2 - t * 5.0) * 0.4;
            w = w * 0.42 + 0.5;

            vec3 cream = vec3(1.000, 0.985, 0.930);
            vec3 pale  = vec3(1.000, 0.929, 0.690);
            vec3 gold  = vec3(0.985, 0.800, 0.320);

            vec3 col = mix(cream, pale, smoothstep(0.20, 0.75, w));
            col = mix(col, gold, smoothstep(0.62, 1.0, w) * 0.42 * (0.45 + 0.55 * uv.y));

            // slow diagonal sheen
            float band = 1.0 - abs(sin((uv.x * 0.9 - uv.y * 0.7) * 3.14159 + t * 6.0));
            col += smoothstep(0.55, 1.0, band) * 0.045;

            // soft glow following the pointer
            float d = distance(uv, uMouse);
            col += vec3(1.0, 0.86, 0.42) * 0.16 * exp(-d * d * 9.0);

            gl_FragColor = vec4(col, 1.0);
          }
        `,
      }),
    );
    bg.frustumCulled = false;
    scene.add(bg);

    // ---- gold dust
    const COUNT = isSmall ? 70 : 140;
    const pos = new Float32Array(COUNT * 3);
    const seed = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = Math.random() * 2 - 1;
      pos[i * 3 + 1] = Math.random();
      pos[i * 3 + 2] = 0;
      seed[i * 3] = Math.random();
      seed[i * 3 + 1] = 0.4 + Math.random() * 1.0;
      seed[i * 3 + 2] = 4 + Math.random() * 14;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    dustGeo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 3));
    const dustMat = new THREE.ShaderMaterial({
      uniforms: { uTime: uniforms.uTime, uDpr: { value: dpr } },
      transparent: true,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        attribute vec3 aSeed;
        uniform float uTime;
        uniform float uDpr;
        varying float vTw;
        void main() {
          float y = fract(position.y + uTime * 0.012 * aSeed.y);
          float x = position.x + sin(uTime * 0.25 * aSeed.y + aSeed.x * 6.28) * 0.04;
          vTw = 0.5 + 0.5 * sin(uTime * (0.8 + aSeed.y) + aSeed.x * 20.0);
          gl_Position = vec4(x, y * 2.0 - 1.0, 0.0, 1.0);
          gl_PointSize = aSeed.z * uDpr;
        }
      `,
      fragmentShader: /* glsl */ `
        precision mediump float;
        varying float vTw;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d);
          gl_FragColor = vec4(vec3(1.0, 0.78, 0.28), a * (0.25 + 0.45 * vTw));
        }
      `,
    });
    const dust = new THREE.Points(dustGeo, dustMat);
    dust.frustumCulled = false;
    scene.add(dust);

    const resize = () => {
      const w = host.clientWidth || window.innerWidth;
      const h = host.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      uniforms.uRes.value.set(w * dpr, h * dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    const target = new THREE.Vector2(0.7, 0.8);
    const onMove = (e: PointerEvent) => {
      target.set(e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight);
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    const clock = new THREE.Clock();
    let running = true;
    const frame = () => {
      if (!reduceMotion) uniforms.uTime.value += Math.min(clock.getDelta(), 0.05);
      uniforms.uMouse.value.lerp(target, 0.04);
      renderer.render(scene, camera);
    };
    renderer.setAnimationLoop(() => {
      if (running) frame();
    });
    if (reduceMotion) frame();

    const onVis = () => {
      running = !document.hidden;
      if (running) clock.getDelta();
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      renderer.setAnimationLoop(null);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pointermove', onMove);
      ro.disconnect();
      bg.geometry.dispose();
      (bg.material as THREE.Material).dispose();
      dustGeo.dispose();
      dustMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={hostRef} aria-hidden className="fixed inset-0 -z-10 pointer-events-none" />;
}

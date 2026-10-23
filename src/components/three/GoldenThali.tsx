'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * A slowly turning, golden metal thali with katoris (bowls), rotis, rising steam and gold dust.
 * Reacts to the pointer. Transparent background so it floats over the page gradient.
 */
export default function GoldenThali({ className = '' }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'default' });
    } catch {
      return;
    }
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = 'width:100%;height:100%;display:block';

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    scene.environmentIntensity = 0.85;

    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 6.4, 9.8);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xfff1c9, 0.3));
    const key = new THREE.DirectionalLight(0xfff0c2, 1.5);
    key.position.set(4, 7, 5);
    scene.add(key);
    const rimLight = new THREE.PointLight(0xffd36b, 14, 18);
    rimLight.position.set(3.5, 2.5, -3.5);
    scene.add(rimLight);
    const warm = new THREE.PointLight(0xffc24d, 14, 14);
    warm.position.set(-3, 3, 2);
    scene.add(warm);

    const disposables: Array<{ dispose: () => void }> = [pmrem, envTex];
    const track = <T extends { dispose: () => void }>(o: T): T => {
      disposables.push(o);
      return o;
    };

    const gold = track(new THREE.MeshStandardMaterial({ color: 0xd69a14, metalness: 1, roughness: 0.28 }));
    const goldLight = track(new THREE.MeshStandardMaterial({ color: 0xecb92f, metalness: 1, roughness: 0.22 }));
    const food = (hex: number, rough = 0.65) =>
      track(new THREE.MeshStandardMaterial({ color: hex, metalness: 0, roughness: rough }));

    const thali = new THREE.Group();
    scene.add(thali);

    // plate: dished base + rim
    const plate = new THREE.Mesh(track(new THREE.CylinderGeometry(3.05, 2.75, 0.16, 96)), gold);
    plate.position.y = -0.08;
    thali.add(plate);
    const inner = new THREE.Mesh(track(new THREE.CylinderGeometry(2.62, 2.62, 0.04, 96)), goldLight);
    inner.position.y = 0.02;
    thali.add(inner);
    const rim = new THREE.Mesh(track(new THREE.TorusGeometry(3.0, 0.11, 24, 120)), goldLight);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.0;
    thali.add(rim);
    const rim2 = new THREE.Mesh(track(new THREE.TorusGeometry(2.62, 0.04, 16, 120)), gold);
    rim2.rotation.x = Math.PI / 2;
    rim2.position.y = 0.05;
    thali.add(rim2);

    // katori profile (lathe)
    const profile: THREE.Vector2[] = [];
    for (let i = 0; i <= 14; i++) {
      const a = (i / 14) * (Math.PI / 2);
      profile.push(new THREE.Vector2(Math.sin(a) * 0.62, 0.34 - Math.cos(a) * 0.34));
    }
    profile.push(new THREE.Vector2(0.64, 0.36));
    const katoriGeo = track(new THREE.LatheGeometry(profile, 40));
    const katoriMat = track(
      new THREE.MeshStandardMaterial({ color: 0xe8b32a, metalness: 1, roughness: 0.25, side: THREE.DoubleSide }),
    );

    const contents: Array<[number, number]> = [
      [0xf2b705, 0.7], // dal
      [0xc2410c, 0.55], // sabzi
      [0xe8a24a, 0.6], // paneer curry
      [0xfff7e6, 0.8], // rice
      [0xfff0c9, 0.35], // kheer
    ];
    const steamHeads: THREE.Vector3[] = [];
    contents.forEach(([hex, rough], i) => {
      const a = (i / contents.length) * Math.PI * 2 + Math.PI / 5;
      const x = Math.cos(a) * 1.62;
      const z = Math.sin(a) * 1.62;
      const bowl = new THREE.Mesh(katoriGeo, katoriMat);
      bowl.position.set(x, 0.1, z);
      thali.add(bowl);
      const fill = new THREE.Mesh(track(new THREE.SphereGeometry(0.56, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2)), food(hex, rough));
      fill.scale.y = 0.3;
      fill.position.set(x, 0.3, z);
      thali.add(fill);
      steamHeads.push(new THREE.Vector3(x, 0.55, z));
    });

    // rotis in the middle
    const rotiMat = food(0xdcab62, 0.9);
    const rotiGeo = track(new THREE.CylinderGeometry(0.82, 0.82, 0.07, 48));
    [[-0.1, 0.0, 0.0], [0.12, 0.07, 0.08]].forEach(([x, y, z], i) => {
      const r = new THREE.Mesh(rotiGeo, rotiMat);
      r.position.set(x, 0.1 + y, z);
      r.rotation.y = i * 0.7;
      thali.add(r);
    });
    const sweet = new THREE.Mesh(track(new THREE.SphereGeometry(0.2, 24, 16)), food(0xf59e0b, 0.35));
    sweet.position.set(0.1, 0.34, 0.1);
    thali.add(sweet);

    // soft round sprite for steam + dust
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    const sprite = track(new THREE.CanvasTexture(c));

    // steam
    const STEAM = 90;
    const steamPos = new Float32Array(STEAM * 3);
    const steamData = Array.from({ length: STEAM }, (_, i) => ({
      head: i % steamHeads.length,
      life: Math.random(),
      speed: 0.12 + Math.random() * 0.1,
      drift: Math.random() * 6.28,
    }));
    const steamGeo = track(new THREE.BufferGeometry());
    steamGeo.setAttribute('position', new THREE.BufferAttribute(steamPos, 3));
    const steamMat = track(
      new THREE.PointsMaterial({
        map: sprite,
        size: 0.55,
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
        color: 0xfff6dc,
      }),
    );
    const steam = new THREE.Points(steamGeo, steamMat);
    thali.add(steam);

    // floating gold dust around the plate
    const DUST = 110;
    const dustPos = new Float32Array(DUST * 3);
    const dustData = Array.from({ length: DUST }, () => ({
      r: 3.2 + Math.random() * 3.2,
      a: Math.random() * Math.PI * 2,
      y: Math.random() * 5 - 1,
      s: 0.05 + Math.random() * 0.12,
    }));
    const dustGeo = track(new THREE.BufferGeometry());
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = track(
      new THREE.PointsMaterial({
        map: sprite,
        size: 0.16,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        color: 0xffc83d,
        blending: THREE.AdditiveBlending,
      }),
    );
    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);

    const resize = () => {
      const w = host.clientWidth || 400;
      const h = host.clientHeight || 400;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e: PointerEvent) => {
      mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    const clock = new THREE.Clock();
    let running = true;
    let visible = true;
    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting), { threshold: 0 });
    io.observe(host);
    const onVis = () => {
      running = !document.hidden;
      if (running) clock.getDelta();
    };
    document.addEventListener('visibilitychange', onVis);

    const tmp = new THREE.Vector3();
    let time = 0;
    const frame = () => {
      const dt = Math.min(clock.getDelta(), 0.05);
      time += reduceMotion ? 0 : dt;
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;

      thali.rotation.y = time * 0.25 + mouse.x * 0.35;
      thali.rotation.x = mouse.y * 0.08 + Math.sin(time * 0.6) * 0.025;
      thali.position.y = Math.sin(time * 0.9) * 0.1;
      warm.position.x = -3 + Math.sin(time * 0.7) * 1.2;

      for (let i = 0; i < STEAM; i++) {
        const d = steamData[i];
        d.life += dt * d.speed * (reduceMotion ? 0 : 1);
        if (d.life > 1) d.life -= 1;
        const h = steamHeads[d.head];
        tmp.set(
          h.x + Math.sin(time * 0.8 + d.drift) * 0.12 * d.life,
          h.y + d.life * 1.7,
          h.z + Math.cos(time * 0.7 + d.drift) * 0.12 * d.life,
        );
        steamPos[i * 3] = tmp.x;
        steamPos[i * 3 + 1] = tmp.y;
        steamPos[i * 3 + 2] = tmp.z;
      }
      steamGeo.attributes.position.needsUpdate = true;

      for (let i = 0; i < DUST; i++) {
        const d = dustData[i];
        const a = d.a + time * d.s;
        dustPos[i * 3] = Math.cos(a) * d.r;
        dustPos[i * 3 + 1] = ((d.y + time * 0.18 * d.s * 6) % 5) - 1 + Math.sin(time + i) * 0.05;
        dustPos[i * 3 + 2] = Math.sin(a) * d.r;
      }
      dustGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };
    renderer.setAnimationLoop(() => {
      if (running && visible) frame();
    });
    if (reduceMotion) frame();

    return () => {
      renderer.setAnimationLoop(null);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pointermove', onMove);
      ro.disconnect();
      io.disconnect();
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={hostRef} aria-hidden className={`relative w-full h-full ${className}`} />;
}

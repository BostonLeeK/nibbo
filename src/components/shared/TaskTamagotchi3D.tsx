"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

interface TaskTamagotchi3DProps {
  doneToday: number;
  doneWeek: number;
  myOpen: number;
  doneTotal: number;
}

const DAY_TARGET = 3;
const WEEK_TARGET = 12;
const SPRITE_MODEL_URL = "/models/water-sprite.glb";

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function resolveMood(doneToday: number, doneWeek: number) {
  if (doneToday >= 4 || doneWeek >= 16) {
    return {
      title: "Супер форма",
      subtitle: "Потужна енергія і максимальний вайб",
      face: "happy" as const,
      body: "#7c3aed",
      glow: "#a78bfa",
      ear: "#ec4899",
      bloom: "from-violet-500/20 via-indigo-400/15 to-rose-400/20",
      speed: 1.8,
      distort: 0.25,
      emoji: "🚀",
      canvasFrom: "#ede9fe",
      canvasTo: "#ddd6fe",
      modelScale: 1.95,
      modelYOffset: -0.06,
      bobAmp: 0.07,
    };
  }
  if (doneToday >= 2 || doneWeek >= 8) {
    return {
      title: "Гарний ритм",
      subtitle: "Він стає сильнішим з кожною закритою задачею",
      face: "smile" as const,
      body: "#0ea5e9",
      glow: "#38bdf8",
      ear: "#22c55e",
      bloom: "from-sky-400/20 via-cyan-300/15 to-sage-400/20",
      speed: 1.35,
      distort: 0.19,
      emoji: "✨",
      canvasFrom: "#ecfeff",
      canvasTo: "#cffafe",
      modelScale: 1.86,
      modelYOffset: -0.03,
      bobAmp: 0.062,
    };
  }
  if (doneToday >= 1 || doneWeek >= 4) {
    return {
      title: "Стабільно",
      subtitle: "Ще трохи задач сьогодні для апгрейду",
      face: "neutral" as const,
      body: "#fb923c",
      glow: "#fda4af",
      ear: "#f43f5e",
      bloom: "from-orange-400/20 via-rose-300/15 to-pink-300/20",
      speed: 1.1,
      distort: 0.14,
      emoji: "🌱",
      canvasFrom: "#fff7ed",
      canvasTo: "#ffe4e6",
      modelScale: 1.8,
      modelYOffset: 0.02,
      bobAmp: 0.054,
    };
  }
  return {
    title: "Хоче руху",
    subtitle: "Закрий хоча б одну задачу і він оживе",
    face: "sleepy" as const,
    body: "#94a3b8",
    glow: "#cbd5e1",
    ear: "#64748b",
    bloom: "from-slate-300/25 via-zinc-200/15 to-rose-200/20",
    speed: 0.85,
    distort: 0.08,
    emoji: "😴",
    canvasFrom: "#f8fafc",
    canvasTo: "#e2e8f0",
    modelScale: 1.72,
    modelYOffset: 0.06,
    bobAmp: 0.046,
  };
}

function pickClipName(face: "happy" | "smile" | "neutral" | "sleepy", names: string[]) {
  const lower = names.map((name) => name.toLowerCase());
  const groups = {
    sleepy: ["sleep", "idle", "sad", "tired", "rest"],
    neutral: ["idle", "breathe", "stand", "default"],
    smile: ["walk", "run", "happy", "wave", "dance", "jump"],
    happy: ["dance", "jump", "celebrate", "attack", "run", "happy"],
  } as const;
  const tries = groups[face];
  for (const token of tries) {
    const idx = lower.findIndex((name) => name.includes(token));
    if (idx >= 0) return names[idx];
  }
  return names[0] ?? null;
}

export default function TaskTamagotchi3D({ doneToday, doneWeek, myOpen, doneTotal }: TaskTamagotchi3DProps) {
  const mood = resolveMood(doneToday, doneWeek);
  const dayProgress = clamp((doneToday / DAY_TARGET) * 100);
  const weekProgress = clamp((doneWeek / WEEK_TARGET) * 100);
  const activityLevel = clamp((doneToday * 7 + doneWeek * 2) / 60, 0, 1);
  const intensity = useMemo(
    () => clamp((doneWeek + doneToday * 1.5 + Math.max(0, doneTotal - myOpen) * 0.25) / 30, 0, 1),
    [doneToday, doneWeek, doneTotal, myOpen]
  );

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0.2, 4.8);
    camera.lookAt(0, 0.1, 0);

    const ambient = new THREE.AmbientLight(new THREE.Color("#fff7ed"), 0.72);
    const key = new THREE.DirectionalLight(new THREE.Color("#ffffff"), 1.4);
    key.position.set(2.4, 3.2, 3.2);
    const fill = new THREE.DirectionalLight(new THREE.Color(mood.glow), 0.9);
    fill.position.set(-2.4, 1.2, 1.8);
    const rim = new THREE.PointLight(new THREE.Color("#ffffff"), 0.65);
    rim.position.set(0, -1.5, -2.8);
    scene.add(ambient, key, fill, rim);

    let modelRoot: THREE.Group | null = null;
    let mixer: THREE.AnimationMixer | null = null;
    let modelAction: THREE.AnimationAction | null = null;
    let modelBaseY = -0.58;

    const sparklesCount = 64;
    const sparklePositions = new Float32Array(sparklesCount * 3);
    for (let i = 0; i < sparklesCount; i += 1) {
      const r = 1.8 + Math.random() * 1.2;
      const a = Math.random() * Math.PI * 2;
      const h = -0.7 + Math.random() * 2;
      sparklePositions[i * 3] = Math.cos(a) * r;
      sparklePositions[i * 3 + 1] = h;
      sparklePositions[i * 3 + 2] = Math.sin(a) * r;
    }
    const sparklesGeometry = new THREE.BufferGeometry();
    sparklesGeometry.setAttribute("position", new THREE.BufferAttribute(sparklePositions, 3));
    const sparklesMaterial = new THREE.PointsMaterial({
      size: 0.055 + activityLevel * 0.07,
      color: new THREE.Color(mood.glow),
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const sparkles = new THREE.Points(sparklesGeometry, sparklesMaterial);
    scene.add(sparkles);

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(2.3, 64),
      new THREE.MeshBasicMaterial({ color: new THREE.Color("#d4d4d8"), transparent: true, opacity: 0.28 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.22;
    scene.add(ground);

    const floorGlow = new THREE.Mesh(
      new THREE.RingGeometry(1.45, 2.15, 64),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(mood.glow), transparent: true, opacity: 0.15 })
    );
    floorGlow.rotation.x = -Math.PI / 2;
    floorGlow.position.y = -1.2;
    scene.add(floorGlow);

    const container = canvas.parentElement;
    if (!container) return;
    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    resize();
    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(container);

    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
      SPRITE_MODEL_URL,
      (gltf) => {
        const root = gltf.scene;
        const box = new THREE.Box3().setFromObject(root);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);
        const maxAxis = Math.max(size.x, size.y, size.z) || 1;
        const scale = mood.modelScale / maxAxis;
        root.scale.setScalar(scale);
        const scaledBox = new THREE.Box3().setFromObject(root);
        const scaledCenter = new THREE.Vector3();
        scaledBox.getCenter(scaledCenter);
        root.position.x = -scaledCenter.x;
        root.position.z = -scaledCenter.z;
        modelBaseY = -scaledBox.min.y - 1.02 + mood.modelYOffset;
        root.position.y = modelBaseY;
        root.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.castShadow = false;
            obj.receiveShadow = false;
          }
        });
        modelRoot = root;
        scene.add(root);
        if (gltf.animations?.length) {
          mixer = new THREE.AnimationMixer(root);
          const names = gltf.animations.map((clip) => clip.name);
          const clipName = pickClipName(mood.face, names);
          const clip = gltf.animations.find((item) => item.name === clipName) ?? gltf.animations[0];
          modelAction = mixer.clipAction(clip);
          modelAction.reset();
          modelAction.fadeIn(0.35);
          modelAction.play();
        }
      },
      undefined,
      () => {}
    );

    let frameId = 0;
    const start = performance.now();
    let lastTime = start;
    const animate = () => {
      const now = performance.now();
      const t = (now - start) / 1000;
      const delta = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const s = mood.speed;
      sparkles.rotation.y = t * 0.25;
      if (modelRoot) {
        modelRoot.rotation.y = Math.sin(t * 0.3 * s) * 0.2;
        modelRoot.position.y = modelBaseY + Math.sin(t * 1.2 * s) * mood.bobAmp;
      }
      if (mixer) mixer.update(delta);

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      if (modelAction) {
        modelAction.stop();
        modelAction = null;
      }
      if (mixer) {
        mixer.stopAllAction();
        mixer = null;
      }
      if (modelRoot) {
        scene.remove(modelRoot);
        modelRoot.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry.dispose();
            const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
            for (const material of materials) material.dispose();
          }
        });
        modelRoot = null;
      }
      renderer.dispose();
      sparklesGeometry.dispose();
      sparklesMaterial.dispose();
      ground.geometry.dispose();
      (ground.material as THREE.Material).dispose();
      floorGlow.geometry.dispose();
      (floorGlow.material as THREE.Material).dispose();
    };
  }, [
    activityLevel,
    mood.bobAmp,
    mood.glow,
    mood.modelScale,
    mood.modelYOffset,
    mood.speed,
    mood.face,
  ]);

  return (
    <div className={`bg-white/75 rounded-3xl border border-warm-100 shadow-cozy p-5 relative overflow-hidden`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${mood.bloom} pointer-events-none`} />
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="relative z-10">
          <h3 className="font-semibold text-warm-800 text-sm">Task Tamagotchi 3D</h3>
          <p className="text-xs text-warm-500 mt-1">{mood.subtitle}</p>
        </div>
        <div className="text-xl relative z-10">{mood.emoji}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center relative z-10">
        <div
          className="relative h-60 rounded-3xl border border-warm-100 overflow-hidden"
          style={{ background: `linear-gradient(180deg, ${mood.canvasFrom}, ${mood.canvasTo})` }}
        >
          <canvas ref={canvasRef} className="w-full h-full block" />
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-warm-100 p-3 bg-warm-50/60">
            <p className="text-xs text-warm-500 mb-1">Стан</p>
            <p className="text-sm font-semibold text-warm-800">{mood.title}</p>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-warm-600">День</span>
              <span className="text-warm-500">{doneToday}/{DAY_TARGET}</span>
            </div>
            <div className="h-2.5 rounded-full bg-warm-100 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${dayProgress}%` }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-peach-400 to-rose-400"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-warm-600">Тиждень</span>
              <span className="text-warm-500">{doneWeek}/{WEEK_TARGET}</span>
            </div>
            <div className="h-2.5 rounded-full bg-warm-100 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${weekProgress}%` }}
                transition={{ duration: 1.1, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-sage-400 to-sky-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-warm-100 bg-white/70 p-2.5">
              <p className="text-[11px] text-warm-500">Активні мої</p>
              <p className="text-sm font-semibold text-warm-800">{myOpen}</p>
            </div>
            <div className="rounded-xl border border-warm-100 bg-white/70 p-2.5">
              <p className="text-[11px] text-warm-500">Завершено всього</p>
              <p className="text-sm font-semibold text-warm-800">{doneTotal}</p>
            </div>
          </div>

          <p className="text-xs text-warm-500">
            Виконання задач змінює настрій і енергію персонажа.
          </p>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${intensity * 100}%` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="h-1.5 rounded-full bg-gradient-to-r from-rose-400 via-lavender-400 to-sky-400"
          />
        </div>
      </div>
    </div>
  );
}

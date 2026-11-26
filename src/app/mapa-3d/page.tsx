"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  ArrowLeft,
  Box,
  Calendar,
  ClipboardList,
  Eye,
  EyeOff,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
} from "lucide-react";

type RawRow = Record<string, unknown>;

type ElementStatus =
  | "CONCLUIDO"
  | "EM_ANDAMENTO"
  | "ATRASADO"
  | "NAO_INICIADO"
  | "EXISTENTE";

interface Elemento3DRaw {
  id_elemento: string;
  nome_elemento: string;
  tipo_elemento: string;
  x: number;
  y: number;
  z: number;
  largura: number;
  comprimento: number;
  altura: number;
  vinculo_tipo: string;
  vinculo_ids: string[];
  ordem_de_implantacao: number | null;
}

interface ComputedElement extends Elemento3DRaw {
  status: ElementStatus;
  progress: number; // 0..100
  detailText: string;
  vinculoLabels: string[];
}

interface ApiPayload {
  elementos: RawRow[];
  atividades: RawRow[];
  avancos: RawRow[];
  backlog: RawRow[];
  transicoes: RawRow[];
  epicos: RawRow[];
  releases: RawRow[];
  riscos: RawRow[];
  evm: RawRow[];
  sources: Record<string, string | null>;
}

const STATUS_META: Record<
  ElementStatus,
  { label: string; color: string; bg: string; ink: string; opacity: number }
> = {
  CONCLUIDO: {
    label: "Concluído",
    color: "#10b981",
    bg: "#dcfce7",
    ink: "#065f46",
    opacity: 0.96,
  },
  EM_ANDAMENTO: {
    label: "Em andamento",
    color: "#f59e0b",
    bg: "#fef3c7",
    ink: "#92400e",
    opacity: 0.94,
  },
  ATRASADO: {
    label: "Atrasado / Crítico",
    color: "#ef4444",
    bg: "#fee2e2",
    ink: "#991b1b",
    opacity: 0.95,
  },
  NAO_INICIADO: {
    label: "Não iniciado",
    color: "#94a3b8",
    bg: "#f1f5f9",
    ink: "#475569",
    opacity: 0.48,
  },
  EXISTENTE: {
    label: "Base / Existente",
    color: "#475569",
    bg: "#e2e8f0",
    ink: "#1e293b",
    opacity: 0.72,
  },
};

function pickStr(row: RawRow, keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (v !== null && v !== undefined && String(v).trim() !== "") {
      return String(v).trim();
    }
  }
  return "";
}

function pickNum(row: RawRow, keys: string[]): number | null {
  for (const k of keys) {
    const v = row[k];
    if (v !== null && v !== undefined && String(v).trim() !== "") {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

function toDateStr(val: unknown): string {
  if (!val) return "";
  const s = String(val).trim();
  const match = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : "";
}

function fmtDateBR(iso: string): string {
  if (!iso || iso.length < 10) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

function parseElementos(rows: RawRow[]): Elemento3DRaw[] {
  return rows
    .map((r) => {
      const rawIds = pickStr(r, ["vinculo_ids", "vinculo_id"]);
      const ids = rawIds
        ? rawIds
            .split(/[;,]/)
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      return {
        id_elemento: pickStr(r, ["id_elemento", "id"]) || "EL?",
        nome_elemento: pickStr(r, ["nome_elemento", "nome"]) || "Elemento 3D",
        tipo_elemento: (pickStr(r, ["tipo_elemento", "tipo"]) || "MODULO_DIGITAL").toUpperCase(),
        x: pickNum(r, ["x"]) ?? 0,
        y: pickNum(r, ["y"]) ?? 0,
        z: pickNum(r, ["z"]) ?? 0,
        largura: pickNum(r, ["largura"]) ?? 2,
        comprimento: pickNum(r, ["comprimento"]) ?? 2,
        altura: pickNum(r, ["altura"]) ?? 1,
        vinculo_tipo: (pickStr(r, ["vinculo_tipo"]) || "NENHUM").toUpperCase(),
        vinculo_ids: ids,
        ordem_de_implantacao: pickNum(r, ["ordem_de_implantacao", "ordem"]),
      };
    })
    .sort((a, b) => a.id_elemento.localeCompare(b.id_elemento, "pt-BR", { numeric: true }));
}

function createLabelSprite(text: string): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 160;
  canvas.height = 56;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "rgba(8, 22, 40, 0.86)";
    ctx.beginPath();
    ctx.roundRect(8, 6, 144, 44, 14);
    ctx.fill();
    ctx.strokeStyle = "rgba(201, 162, 39, 0.75)";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 80, 29);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const mat = new THREE.SpriteMaterial({ map: texture, depthTest: false, transparent: true });
  const sprite = new THREE.Sprite(mat);
  sprite.renderOrder = 10;
  return sprite;
}

type CameraPreset = "iso" | "top" | "front";

interface ThreeSceneProps {
  elements: ComputedElement[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  showLabels: boolean;
  cameraPreset: { mode: CameraPreset; nonce: number };
}

function ThreeScene({
  elements,
  selectedId,
  onSelect,
  showLabels,
  cameraPreset,
}: ThreeSceneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneDataRef = useRef<{
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    center: THREE.Vector3;
    radius: number;
    entries: Map<
      string,
      {
        materials: THREE.MeshStandardMaterial[];
        edgeMat: THREE.LineBasicMaterial;
        label: THREE.Sprite;
        isArea: boolean;
      }
    >;
  } | null>(null);

  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // Inicializa cena Three.js uma vez que os elementos chegam
  const geometrySignature = useMemo(
    () => elements.map((e) => `${e.id_elemento}:${e.x}:${e.y}:${e.z}`).join("|"),
    [elements]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container || elements.length === 0) return;

    container.innerHTML = "";

    const width = container.clientWidth || 720;
    const height = container.clientHeight || 520;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#f1f5f9");

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2 - 0.03;

    // Iluminação de estúdio executivo
    const hemi = new THREE.HemisphereLight(0xffffff, 0xcbd5e1, 1.05);
    hemi.position.set(0, 50, 0);
    scene.add(hemi);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(35, 65, 40);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 0.35);
    fillLight.position.set(-30, 25, -35);
    scene.add(fillLight);

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    const clickableMeshes: THREE.Object3D[] = [];
    const entries = new Map<
      string,
      {
        materials: THREE.MeshStandardMaterial[];
        edgeMat: THREE.LineBasicMaterial;
        label: THREE.Sprite;
        isArea: boolean;
      }
    >();

    // Constrói os 28 elementos respeitando coordenadas (CAD X,Y,Z -> Three X,Z_up,Y)
    for (const el of elements) {
      const isArea = el.tipo_elemento === "AREA";
      const w = Math.max(el.largura, 0.4);
      const d = Math.max(el.comprimento, 0.4);
      const h = isArea ? Math.max(el.altura, 0.12) : Math.max(el.altura, 0.35);

      const cx = el.x + w / 2;
      const cy = isArea ? el.z + h / 2 - 0.06 : el.z + h / 2;
      const cz = el.y + d / 2;

      const elGroup = new THREE.Group();
      elGroup.position.set(cx, cy, cz);

      const meta = STATUS_META[el.status];
      const mainMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(meta.color),
        roughness: isArea ? 0.85 : 0.42,
        metalness: el.tipo_elemento === "HARDWARE" || el.tipo_elemento === "MODULO_DIGITAL" ? 0.25 : 0.08,
        transparent: true,
        opacity: isArea ? 0.35 : meta.opacity,
      });

      const accentMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color("#081628"),
        roughness: 0.35,
        metalness: 0.3,
        transparent: true,
        opacity: 0.9,
      });

      const edgeMat = new THREE.LineBasicMaterial({
        color: new THREE.Color("#0f172a"),
        transparent: true,
        opacity: 0.4,
      });

      const materials: THREE.MeshStandardMaterial[] = [mainMat];

      if (el.tipo_elemento === "UNIDADE_DE_IMPLANTACAO") {
        // Base + teto inclinado para identificar unidades escolares/implantação
        const baseH = h * 0.68;
        const roofH = h * 0.32;
        const baseGeo = new THREE.BoxGeometry(w, baseH, d);
        const baseMesh = new THREE.Mesh(baseGeo, mainMat);
        baseMesh.position.y = -h / 2 + baseH / 2;
        baseMesh.castShadow = true;
        baseMesh.receiveShadow = true;
        baseMesh.userData.elementId = el.id_elemento;
        elGroup.add(baseMesh);
        clickableMeshes.push(baseMesh);

        const edges = new THREE.LineSegments(new THREE.EdgesGeometry(baseGeo), edgeMat);
        edges.position.copy(baseMesh.position);
        elGroup.add(edges);

        const roofGeo = new THREE.ConeGeometry(Math.min(w, d) * 0.68, roofH, 4);
        const roofMesh = new THREE.Mesh(roofGeo, mainMat);
        roofMesh.rotation.y = Math.PI / 4;
        roofMesh.position.y = -h / 2 + baseH + roofH / 2;
        roofMesh.castShadow = true;
        roofMesh.userData.elementId = el.id_elemento;
        elGroup.add(roofMesh);
        clickableMeshes.push(roofMesh);
      } else if (el.tipo_elemento === "UTILIDADE") {
        const cylGeo = new THREE.CylinderGeometry(
          Math.min(w, d) * 0.45,
          Math.min(w, d) * 0.48,
          h,
          20
        );
        const cylMesh = new THREE.Mesh(cylGeo, mainMat);
        cylMesh.castShadow = true;
        cylMesh.receiveShadow = true;
        cylMesh.userData.elementId = el.id_elemento;
        elGroup.add(cylMesh);
        clickableMeshes.push(cylMesh);

        const edges = new THREE.LineSegments(new THREE.EdgesGeometry(cylGeo), edgeMat);
        elGroup.add(edges);
      } else if (el.tipo_elemento === "MODULO_DIGITAL" || el.tipo_elemento === "HARDWARE") {
        const bodyGeo = new THREE.BoxGeometry(w, h * 0.86, d);
        const bodyMesh = new THREE.Mesh(bodyGeo, mainMat);
        bodyMesh.position.y = -h * 0.07;
        bodyMesh.castShadow = true;
        bodyMesh.receiveShadow = true;
        bodyMesh.userData.elementId = el.id_elemento;
        elGroup.add(bodyMesh);
        clickableMeshes.push(bodyMesh);

        const edges = new THREE.LineSegments(new THREE.EdgesGeometry(bodyGeo), edgeMat);
        edges.position.copy(bodyMesh.position);
        elGroup.add(edges);

        const capGeo = new THREE.BoxGeometry(w * 0.92, h * 0.12, d * 0.92);
        const capMesh = new THREE.Mesh(capGeo, accentMat);
        capMesh.position.y = h / 2 - h * 0.06;
        capMesh.userData.elementId = el.id_elemento;
        elGroup.add(capMesh);
        clickableMeshes.push(capMesh);
      } else {
        const boxGeo = new THREE.BoxGeometry(w, h, d);
        const boxMesh = new THREE.Mesh(boxGeo, mainMat);
        boxMesh.castShadow = !isArea;
        boxMesh.receiveShadow = true;
        boxMesh.userData.elementId = el.id_elemento;
        elGroup.add(boxMesh);
        clickableMeshes.push(boxMesh);

        const edges = new THREE.LineSegments(new THREE.EdgesGeometry(boxGeo), edgeMat);
        elGroup.add(edges);
      }

      const label = createLabelSprite(el.id_elemento);
      label.position.set(0, h / 2 + Math.max(0.7, h * 0.25), 0);
      label.visible = showLabels;
      elGroup.add(label);

      rootGroup.add(elGroup);
      entries.set(el.id_elemento, { materials, edgeMat, label, isArea });
    }

    // Calcula enquadramento automático para qualquer escala do modelo
    const box = new THREE.Box3().setFromObject(rootGroup);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z, 8);
    const radius = maxDim * 1.15;

    // Ajusta tamanho dos rótulos de acordo com a escala da cena
    const labelScale = Math.max(1.2, maxDim * 0.08);
    entries.forEach((entry) => {
      entry.label.scale.set(labelScale * 1.4, labelScale * 0.5, 1);
    });

    // Grade de chão
    const gridSize = Math.ceil(maxDim * 2.2);
    const grid = new THREE.GridHelper(gridSize, 24, 0x94a3b8, 0xcbd5e1);
    grid.position.set(center.x, Math.min(box.min.y - 0.05, -0.05), center.z);
    scene.add(grid);

    // Câmera inicial isométrica
    camera.position.set(center.x + radius, center.y + radius * 0.78, center.z + radius);
    controls.target.copy(center);
    controls.update();

    sceneDataRef.current = { camera, controls, center, radius, entries };

    // Seleção por clique (ignorando arraste de órbita)
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downX = 0;
    let downY = 0;

    const handlePointerDown = (ev: PointerEvent) => {
      downX = ev.clientX;
      downY = ev.clientY;
    };

    const handlePointerUp = (ev: PointerEvent) => {
      const dist = Math.hypot(ev.clientX - downX, ev.clientY - downY);
      if (dist > 6) return;

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(clickableMeshes, false);
      if (hits.length > 0) {
        const hitId = hits[0].object.userData.elementId as string | undefined;
        if (hitId) {
          onSelectRef.current(hitId);
          return;
        }
      }
      onSelectRef.current(null);
    };

    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    renderer.domElement.addEventListener("pointerup", handlePointerUp);

    // Redimensionamento responsivo
    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    });
    resizeObserver.observe(container);

    let animId = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      controls.dispose();
      renderer.dispose();
      sceneDataRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geometrySignature]);

  // Atualiza cores, seleção e rótulos instantaneamente quando o slider de data muda
  useEffect(() => {
    const data = sceneDataRef.current;
    if (!data) return;

    for (const el of elements) {
      const entry = data.entries.get(el.id_elemento);
      if (!entry) continue;

      const meta = STATUS_META[el.status];
      const isSelected = el.id_elemento === selectedId;

      for (const mat of entry.materials) {
        mat.color.set(meta.color);
        mat.opacity = isSelected ? 1 : entry.isArea ? 0.35 : meta.opacity;
        mat.emissive.set(isSelected ? "#c9a227" : "#000000");
        mat.emissiveIntensity = isSelected ? 0.35 : 0;
        mat.needsUpdate = true;
      }

      entry.edgeMat.color.set(isSelected ? "#c9a227" : "#0f172a");
      entry.edgeMat.opacity = isSelected ? 1 : 0.42;
      entry.edgeMat.needsUpdate = true;
      entry.label.visible = showLabels || isSelected;
    }
  }, [elements, selectedId, showLabels]);

  // Presets de câmera (Isométrica, Topo, Frente)
  useEffect(() => {
    const data = sceneDataRef.current;
    if (!data || cameraPreset.nonce === 0) return;

    const { camera, controls, center, radius } = data;
    if (cameraPreset.mode === "top") {
      camera.position.set(center.x, center.y + radius * 1.55, center.z + 0.01);
    } else if (cameraPreset.mode === "front") {
      camera.position.set(center.x, center.y + radius * 0.45, center.z + radius * 1.35);
    } else {
      camera.position.set(center.x + radius, center.y + radius * 0.78, center.z + radius);
    }
    controls.target.copy(center);
    controls.update();
  }, [cameraPreset]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        minHeight: "480px",
        cursor: "grab",
        borderRadius: "14px",
        overflow: "hidden",
      }}
    />
  );
}

const cardStyle: React.CSSProperties = {
  background: "var(--card, #ffffff)",
  border: "1px solid var(--border, #e2e8f0)",
  borderRadius: "16px",
  boxShadow: "var(--shadow-subtle, 0 1px 3px rgba(15, 23, 42, 0.06))",
};

export default function Mapa3DPage() {
  const [payload, setPayload] = useState<ApiPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [cameraPreset, setCameraPreset] = useState<{ mode: CameraPreset; nonce: number }>({
    mode: "iso",
    nonce: 0,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mapa-3d", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha ao carregar o Mapa 3D.");
      setPayload(json as ApiPayload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao buscar dados 3D.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Linha do tempo real construída a partir das datas do Supabase
  const timelineDates = useMemo(() => {
    if (!payload) return [];
    const set = new Set<string>();

    for (const r of payload.avancos) {
      const d = toDateStr(
        r.semana_ate ?? r.data ?? r.data_corte ?? r.data_referencia ?? r.data_medicao
      );
      if (d) set.add(d);
    }
    for (const r of payload.transicoes) {
      const d = toDateStr(r.data ?? r.data_transicao);
      if (d) set.add(d);
    }
    for (const r of payload.atividades) {
      const d1 = toDateStr(
        r.inicio_planejado ?? r.inicio_previsto ?? r.data_inicio_prevista ?? r.inicio_real
      );
      const d2 = toDateStr(
        r.termino_planejado ?? r.termino_previsto ?? r.data_termino_prevista ?? r.termino_real
      );
      if (d1) set.add(d1);
      if (d2) set.add(d2);
    }
    for (const r of payload.evm) {
      const d = toDateStr(r.data_corte);
      if (d) set.add(d);
    }

    const sorted = Array.from(set).sort();
    return sorted.length > 0 ? sorted : ["2026-11-13"];
  }, [payload]);

  const cutoffDate = useMemo(() => {
    if (!payload) return "";
    const proj = payload.evm.find(
      (r) => String(r.frente ?? "").toUpperCase() === "PROJETO"
    );
    const d = toDateStr(proj?.data_corte);
    if (d) return d;
    return timelineDates[timelineDates.length - 1] ?? "";
  }, [payload, timelineDates]);

  const [dateIdx, setDateIdx] = useState<number>(0);

  useEffect(() => {
    if (timelineDates.length === 0) return;
    if (cutoffDate) {
      const idx = timelineDates.findIndex((d) => d >= cutoffDate);
      setDateIdx(idx >= 0 ? idx : timelineDates.length - 1);
    } else {
      setDateIdx(timelineDates.length - 1);
    }
  }, [timelineDates, cutoffDate]);

  useEffect(() => {
    if (!playing || timelineDates.length <= 1) return;
    const timer = setInterval(() => {
      setDateIdx((prev) => {
        if (prev >= timelineDates.length - 1) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 750);
    return () => clearInterval(timer);
  }, [playing, timelineDates.length]);

  const selectedDate = timelineDates[dateIdx] ?? cutoffDate ?? "2026-11-13";

  // Calcula status e avanço de cada um dos 28 elementos na data do slider
  const computedElements: ComputedElement[] = useMemo(() => {
    if (!payload) return [];
    const baseElements = parseElementos(payload.elementos);

    // Índice de atividades
    const ativMap = new Map<string, RawRow>();
    for (const a of payload.atividades) {
      const id = pickStr(a, ["id_atividade", "id"]);
      if (id) ativMap.set(id.toUpperCase(), a);
    }

    // Índice de épicos e releases para nomes legíveis
    const epicoNameMap = new Map<string, string>();
    for (const e of payload.epicos) {
      const id = pickStr(e, ["id_epico", "id"]);
      const nome = pickStr(e, ["nome_epico", "nome", "titulo"]);
      if (id) epicoNameMap.set(id.toUpperCase(), nome || id);
    }
    const releaseNameMap = new Map<string, string>();
    for (const rel of payload.releases) {
      const id = pickStr(rel, ["id_release", "id"]);
      const nome = pickStr(rel, ["nome_release", "nome", "titulo"]);
      if (id) releaseNameMap.set(id.toUpperCase(), nome || id);
    }

    // Último avanço por atividade até selectedDate
    const latestAvancoByAtiv = new Map<
      string,
      { date: string; pct: number; situacao: string }
    >();
    for (const av of payload.avancos) {
      const id = pickStr(av, ["id_atividade"]).toUpperCase();
      const d = toDateStr(
        av.semana_ate ?? av.data ?? av.data_corte ?? av.data_referencia ?? av.data_medicao
      );
      if (!id || !d || d > selectedDate) continue;

      const pct =
        pickNum(av, [
          "avanco_acumulado_pct",
          "percentual_concluido",
          "avanco_pct",
          "avanco",
          "percentual",
        ]) ?? 0;
      const situacao = pickStr(av, ["situacao", "status"]).toUpperCase();
      const prev = latestAvancoByAtiv.get(id);
      if (!prev || d >= prev.date) {
        latestAvancoByAtiv.set(id, { date: d, pct, situacao });
      }
    }

    // Atividades impactadas por risco de atraso até selectedDate
    const delayedAtivs = new Set<string>();
    for (const rk of payload.riscos) {
      const d = toDateStr(rk.data ?? rk.data_ocorrencia);
      const id = pickStr(rk, ["id_atividade"]).toUpperCase();
      const prazoDu = pickNum(rk, ["impacto_prazo_real_du", "impacto_prazo_du"]) ?? 0;
      if (id && d && d <= selectedDate && prazoDu > 0) {
        delayedAtivs.add(id);
      }
    }

    // Status de cada item do backlog até selectedDate
    const latestTransitionByItem = new Map<string, { date: string; status: string }>();
    for (const tr of payload.transicoes) {
      const idItem = pickStr(tr, ["id_item"]).toUpperCase();
      const d = toDateStr(tr.data ?? tr.data_transicao);
      const dest = pickStr(tr, ["status_destino", "status"]).toUpperCase();
      if (!idItem || !d || d > selectedDate) continue;
      const prev = latestTransitionByItem.get(idItem);
      if (!prev || d >= prev.date) {
        latestTransitionByItem.set(idItem, { date: d, status: dest });
      }
    }

    const totalUnidadesPorVinculo = new Map<string, number>();
    for (const el of baseElements) {
      if (el.tipo_elemento === "UNIDADE_DE_IMPLANTACAO") {
        const key = `${el.vinculo_tipo}:${el.vinculo_ids.join(";")}`;
        totalUnidadesPorVinculo.set(key, (totalUnidadesPorVinculo.get(key) ?? 0) + 1);
      }
    }

    return baseElements.map((el) => {
      if (
        el.vinculo_tipo === "NENHUM" ||
        el.vinculo_ids.length === 0 ||
        el.tipo_elemento === "EQUIPAMENTO_EXISTENTE"
      ) {
        return {
          ...el,
          status: "EXISTENTE" as ElementStatus,
          progress: 100,
          detailText:
            el.tipo_elemento === "AREA"
              ? "Área base / setor de referência da cena."
              : "Estrutura existente sem vínculo de entrega.",
          vinculoLabels: [],
        };
      }

      let rawProgress = 0;
      let hasStarted = false;
      let isDelayed = false;
      let detailText = "";
      const vinculoLabels: string[] = [];

      if (el.vinculo_tipo === "ATIVIDADE") {
        let sumPct = 0;
        let count = 0;

        for (const rawId of el.vinculo_ids) {
          const id = rawId.toUpperCase();
          const ativ = ativMap.get(id);
          const nomeAtiv = ativ
            ? pickStr(ativ, ["nome_atividade", "nome", "descricao"])
            : "";
          vinculoLabels.push(nomeAtiv ? `${id} — ${nomeAtiv}` : id);

          const av = latestAvancoByAtiv.get(id);
          let pct = av?.pct ?? 0;

          if (!av && ativ) {
            const termReal = toDateStr(ativ.termino_real);
            const iniReal = toDateStr(ativ.inicio_real);
            if (termReal && termReal <= selectedDate) pct = 100;
            else if (iniReal && iniReal <= selectedDate) {
              pct = pickNum(ativ, ["avanco_pct", "percentual_concluido"]) ?? 30;
            }
          }

          if (pct > 0) hasStarted = true;
          sumPct += pct;
          count += 1;

          const termPlan = ativ
            ? toDateStr(
                ativ.termino_planejado ??
                  ativ.termino_previsto ??
                  ativ.data_termino_prevista
              )
            : "";
          if (
            pct < 100 &&
            (av?.situacao.includes("ATRAS") ||
              delayedAtivs.has(id) ||
              (termPlan !== "" && termPlan < selectedDate))
          ) {
            isDelayed = true;
          }
        }

        rawProgress = count > 0 ? Math.round(sumPct / count) : 0;
        detailText = `Média de avanço de ${count} atividade(s) vinculada(s) até ${fmtDateBR(selectedDate)}.`;
      } else if (el.vinculo_tipo === "EPICO" || el.vinculo_tipo === "RELEASE") {
        const wanted = new Set(el.vinculo_ids.map((s) => s.toUpperCase()));
        for (const id of wanted) {
          const label =
            el.vinculo_tipo === "EPICO"
              ? epicoNameMap.get(id) ?? id
              : releaseNameMap.get(id) ?? id;
          vinculoLabels.push(label === id ? id : `${id} — ${label}`);
        }

        const matchedItems = payload.backlog.filter((item) => {
          const key =
            el.vinculo_tipo === "EPICO"
              ? pickStr(item, ["id_epico", "epico"]).toUpperCase()
              : pickStr(item, ["id_release", "release"]).toUpperCase();
          return wanted.has(key);
        });

        let totalWeight = 0;
        let doneWeight = 0;
        let doneCount = 0;

        for (const item of matchedItems) {
          const idItem = pickStr(item, ["id_item", "id"]).toUpperCase();
          const pts = pickNum(item, ["pontos", "story_points", "estimativa_pontos"]) ?? 1;
          totalWeight += pts;

          const tr = latestTransitionByItem.get(idItem);
          const dataConc = toDateStr(item.data_conclusao);
          let st = tr?.status ?? "";

          if (!st) {
            if (dataConc && dataConc <= selectedDate) {
              st = "CONCLUIDO";
            } else if (cutoffDate && selectedDate >= cutoffDate) {
              st = pickStr(item, ["status", "situacao"]).toUpperCase();
            } else {
              st = "A_FAZER";
            }
          }

          if (st === "CONCLUIDO" || st === "CONCLUÍDO" || st === "DONE") {
            doneWeight += pts;
            doneCount += 1;
            hasStarted = true;
          } else if (
            st === "EM_ANDAMENTO" ||
            st === "EM_REVISAO" ||
            st === "EM_TESTE" ||
            st === "BLOQUEADO"
          ) {
            hasStarted = true;
          }
        }

        rawProgress = totalWeight > 0 ? Math.round((doneWeight / totalWeight) * 100) : 0;
        detailText = `${doneCount} de ${matchedItems.length} itens concluídos no backlog (${rawProgress}% dos pontos) até ${fmtDateBR(selectedDate)}.`;
      }

      // Regra específica do Dicionário para UNIDADE_DE_IMPLANTACAO: pronta quando avanço >= n / N
      let status: ElementStatus;
      let displayProgress = rawProgress;

      if (el.tipo_elemento === "UNIDADE_DE_IMPLANTACAO" && el.ordem_de_implantacao) {
        const key = `${el.vinculo_tipo}:${el.vinculo_ids.join(";")}`;
        const N = totalUnidadesPorVinculo.get(key) ?? 1;
        const n = el.ordem_de_implantacao;
        const frac = rawProgress / 100;
        const threshold = n / N;
        const prevThreshold = (n - 1) / N;

        if (frac >= threshold) {
          status = "CONCLUIDO";
          displayProgress = 100;
        } else if (frac > prevThreshold || (n === 1 && hasStarted)) {
          status = isDelayed ? "ATRASADO" : "EM_ANDAMENTO";
          displayProgress = Math.min(
            99,
            Math.max(10, Math.round(((frac - prevThreshold) / (1 / N)) * 100))
          );
        } else {
          status = isDelayed && hasStarted ? "ATRASADO" : "NAO_INICIADO";
          displayProgress = 0;
        }
        detailText = `Unidade ${n} de ${N} (conclui com vínculo ≥ ${Math.round(threshold * 100)}%; vínculo atual em ${rawProgress}%).`;
      } else {
        if (rawProgress >= 100) {
          status = "CONCLUIDO";
        } else if (isDelayed) {
          status = "ATRASADO";
        } else if (rawProgress > 0 || hasStarted) {
          status = "EM_ANDAMENTO";
        } else {
          status = "NAO_INICIADO";
        }
      }

      return {
        ...el,
        status,
        progress: displayProgress,
        detailText,
        vinculoLabels,
      };
    });
  }, [payload, selectedDate, cutoffDate]);

  const selectedElement = useMemo(
    () => computedElements.find((e) => e.id_elemento === selectedId) ?? null,
    [computedElements, selectedId]
  );

  const summary = useMemo(() => {
    const counts: Record<ElementStatus, number> = {
      CONCLUIDO: 0,
      EM_ANDAMENTO: 0,
      ATRASADO: 0,
      NAO_INICIADO: 0,
      EXISTENTE: 0,
    };
    let progSum = 0;
    let progCount = 0;
    for (const el of computedElements) {
      counts[el.status] += 1;
      if (el.status !== "EXISTENTE") {
        progSum += el.progress;
        progCount += 1;
      }
    }
    return {
      total: computedElements.length,
      counts,
      avgProgress: progCount > 0 ? Math.round(progSum / progCount) : 0,
    };
  }, [computedElements]);

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--canvas, #f8fafc)",
        color: "var(--ink, #0f172a)",
        fontFamily: "inherit",
      }}
    >
      {/* Cabeçalho padrão Lume Educação */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          backdropFilter: "blur(16px)",
          background: "var(--glass, rgba(255, 255, 255, 0.9))",
          borderBottom: "1px solid var(--border, #e2e8f0)",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "12px 20px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              className="font-display"
              style={{
                width: 34,
                height: 34,
                borderRadius: "10px",
                background: "#081628",
                border: "1px solid rgba(201, 162, 39, 0.55)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                fontWeight: 700,
                fontSize: "15px",
                flexShrink: 0,
              }}
            >
              L
            </div>
            <div>
              <div
                className="font-display"
                style={{ fontWeight: 700, fontSize: "15.5px", lineHeight: 1.2 }}
              >
                Lume Educação — Mapa 3D
              </div>
              <div style={{ fontSize: "12px", color: "var(--muted, #64748b)" }}>
                Visualização Espacial Interativa (R12 · Three.js + Supabase)
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
            <Link href="/" className="lume-btn-ghost" style={{ textDecoration: "none" }}>
              <ArrowLeft size={15} />
              <span>Voltar para a IA</span>
            </Link>
            <Link
              href="/lancamentos"
              className="lume-btn-ghost"
              style={{ textDecoration: "none" }}
            >
              <ClipboardList size={15} />
              <span>Lançamentos</span>
            </Link>
            <button
              type="button"
              onClick={() => void loadData()}
              className="lume-btn-ghost"
              title="Recarregar dados do Supabase"
            >
              <RefreshCw size={15} />
              <span>Atualizar</span>
            </button>
          </div>
        </div>
      </header>

      <main
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "20px 20px 48px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {/* Resumo KPI */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "10px",
          }}
        >
          <div style={{ ...cardStyle, padding: "12px 14px", borderLeft: "4px solid #081628" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted, #64748b)" }}>
              ELEMENTOS 3D
            </div>
            <div style={{ marginTop: "4px", fontSize: "20px", fontWeight: 700 }}>
              {summary.total}
            </div>
          </div>

          <div style={{ ...cardStyle, padding: "12px 14px", borderLeft: "4px solid #c9a227" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted, #64748b)" }}>
              AVANÇO NA DATA
            </div>
            <div style={{ marginTop: "4px", fontSize: "20px", fontWeight: 700 }}>
              {summary.avgProgress}%
            </div>
          </div>

          <div style={{ ...cardStyle, padding: "12px 14px", borderLeft: "4px solid #10b981" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#065f46" }}>
              CONCLUÍDOS
            </div>
            <div style={{ marginTop: "4px", fontSize: "20px", fontWeight: 700, color: "#065f46" }}>
              {summary.counts.CONCLUIDO}
            </div>
          </div>

          <div style={{ ...cardStyle, padding: "12px 14px", borderLeft: "4px solid #f59e0b" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#92400e" }}>
              EM ANDAMENTO
            </div>
            <div style={{ marginTop: "4px", fontSize: "20px", fontWeight: 700, color: "#92400e" }}>
              {summary.counts.EM_ANDAMENTO}
            </div>
          </div>

          <div style={{ ...cardStyle, padding: "12px 14px", borderLeft: "4px solid #ef4444" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#991b1b" }}>
              ATRASADOS
            </div>
            <div style={{ marginTop: "4px", fontSize: "20px", fontWeight: 700, color: "#991b1b" }}>
              {summary.counts.ATRASADO}
            </div>
          </div>
        </section>

        {error && (
          <div
            style={{
              padding: "14px 16px",
              borderRadius: "12px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              fontSize: "13.5px",
            }}
          >
            {error}
          </div>
        )}

        {/* Slider de data (linha do tempo) */}
        <section style={{ ...cardStyle, padding: "14px 18px" }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              marginBottom: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Calendar size={16} color="#081628" />
              <span style={{ fontSize: "13.5px", fontWeight: 700 }}>
                Linha do Tempo do Projeto:
              </span>
              <span
                style={{
                  padding: "3px 10px",
                  borderRadius: "999px",
                  background: "#081628",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 700,
                }}
              >
                {fmtDateBR(selectedDate)}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => {
                  if (dateIdx >= timelineDates.length - 1) setDateIdx(0);
                  setPlaying((p) => !p);
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  borderRadius: "9px",
                  border: "1px solid #081628",
                  background: playing ? "#b91c1c" : "#081628",
                  color: "#ffffff",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {playing ? <Pause size={14} /> : <Play size={14} />}
                <span>{playing ? "Pausar" : "Simular evolução"}</span>
              </button>

              {cutoffDate && (
                <button
                  type="button"
                  onClick={() => {
                    setPlaying(false);
                    const idx = timelineDates.findIndex((d) => d >= cutoffDate);
                    setDateIdx(idx >= 0 ? idx : timelineDates.length - 1);
                  }}
                  className="lume-btn-ghost"
                  style={{ fontSize: "12.5px", padding: "6px 10px" }}
                >
                  Data de corte ({fmtDateBR(cutoffDate)})
                </button>
              )}
            </div>
          </div>

          <input
            type="range"
            min={0}
            max={Math.max(0, timelineDates.length - 1)}
            value={Math.min(dateIdx, Math.max(0, timelineDates.length - 1))}
            onChange={(e) => {
              setPlaying(false);
              setDateIdx(Number(e.target.value));
            }}
            aria-label="Selecionar data no mapa 3D"
            style={{ width: "100%", accentColor: "#081628", cursor: "pointer" }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "11.5px",
              color: "var(--muted, #64748b)",
              marginTop: "4px",
            }}
          >
            <span>Início: {fmtDateBR(timelineDates[0] ?? "")}</span>
            <span>Arraste para ver a evolução dos 28 elementos</span>
            <span>Fim: {fmtDateBR(timelineDates[timelineDates.length - 1] ?? "")}</span>
          </div>
        </section>

        {/* Grade principal: Cena 3D + Inspetor lateral */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 330px",
            gap: "16px",
            alignItems: "start",
          }}
        >
          {/* Container 3D */}
          <div style={{ ...cardStyle, padding: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
                padding: "0 4px",
              }}
            >
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                {(Object.keys(STATUS_META) as ElementStatus[]).map((st) => (
                  <span
                    key={st}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      fontSize: "11.5px",
                      color: "var(--muted, #475569)",
                      fontWeight: 600,
                    }}
                  >
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "3px",
                        background: STATUS_META[st].color,
                        display: "inline-block",
                      }}
                    />
                    {STATUS_META[st].label}
                  </span>
                ))}
              </div>

              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => setCameraPreset((p) => ({ mode: "iso", nonce: p.nonce + 1 }))}
                  className="lume-btn-ghost"
                  style={{ fontSize: "12px", padding: "5px 9px" }}
                >
                  <RotateCcw size={13} />
                  <span>Isométrica</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCameraPreset((p) => ({ mode: "top", nonce: p.nonce + 1 }))}
                  className="lume-btn-ghost"
                  style={{ fontSize: "12px", padding: "5px 9px" }}
                >
                  Topo
                </button>
                <button
                  type="button"
                  onClick={() => setCameraPreset((p) => ({ mode: "front", nonce: p.nonce + 1 }))}
                  className="lume-btn-ghost"
                  style={{ fontSize: "12px", padding: "5px 9px" }}
                >
                  Frontal
                </button>
                <button
                  type="button"
                  onClick={() => setShowLabels((v) => !v)}
                  className="lume-btn-ghost"
                  style={{ fontSize: "12px", padding: "5px 9px" }}
                >
                  {showLabels ? <EyeOff size={13} /> : <Eye size={13} />}
                  <span>Códigos</span>
                </button>
              </div>
            </div>

            <div style={{ height: "520px", position: "relative" }}>
              {loading ? (
                <div
                  style={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--muted, #64748b)",
                    fontSize: "14px",
                  }}
                >
                  Carregando modelo 3D do Supabase...
                </div>
              ) : computedElements.length === 0 ? (
                <div
                  style={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--muted, #64748b)",
                    fontSize: "14px",
                  }}
                >
                  Nenhum elemento encontrado em elementos_3d.
                </div>
              ) : (
                <ThreeScene
                  elements={computedElements}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  showLabels={showLabels}
                  cameraPreset={cameraPreset}
                />
              )}
            </div>

            <div style={{ fontSize: "11.5px", color: "var(--muted, #64748b)", padding: "0 4px" }}>
              Arraste com o botão esquerdo para girar · Role o mouse para zoom · Botão direito para mover · Clique em qualquer bloco para ver detalhes.
            </div>
          </div>

          {/* Painel lateral: Inspetor + Lista dos 28 elementos */}
          <aside style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ ...cardStyle, padding: "16px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "var(--muted, #64748b)",
                  marginBottom: "10px",
                }}
              >
                <Box size={14} />
                <span>Elemento Selecionado</span>
              </div>

              {selectedElement ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#081628" }}>
                      {selectedElement.id_elemento} · {selectedElement.tipo_elemento}
                    </div>
                    <div style={{ fontSize: "16px", fontWeight: 700, marginTop: "2px" }}>
                      {selectedElement.nome_elemento}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: "999px",
                        fontSize: "12px",
                        fontWeight: 700,
                        background: STATUS_META[selectedElement.status].bg,
                        color: STATUS_META[selectedElement.status].ink,
                      }}
                    >
                      {STATUS_META[selectedElement.status].label}
                    </span>
                    <strong style={{ fontSize: "15px" }}>{selectedElement.progress}%</strong>
                  </div>

                  <div
                    style={{
                      width: "100%",
                      height: "8px",
                      borderRadius: "999px",
                      background: "#e2e8f0",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${selectedElement.progress}%`,
                        height: "100%",
                        background: STATUS_META[selectedElement.status].color,
                        transition: "width 0.25s ease",
                      }}
                    />
                  </div>

                  <p style={{ margin: 0, fontSize: "12.5px", color: "var(--muted, #475569)", lineHeight: 1.45 }}>
                    {selectedElement.detailText}
                  </p>

                  <div
                    style={{
                      padding: "10px",
                      borderRadius: "10px",
                      background: "var(--canvas, #f8fafc)",
                      fontSize: "12px",
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "6px",
                    }}
                  >
                    <div>
                      <strong>Posição (x,y,z):</strong>
                      <div>
                        {selectedElement.x}m, {selectedElement.y}m, {selectedElement.z}m
                      </div>
                    </div>
                    <div>
                      <strong>Dimensões:</strong>
                      <div>
                        {selectedElement.largura} × {selectedElement.comprimento} ×{" "}
                        {selectedElement.altura}m
                      </div>
                    </div>
                  </div>

                  {selectedElement.vinculoLabels.length > 0 && (
                    <div style={{ fontSize: "12px" }}>
                      <strong>Vínculo ({selectedElement.vinculo_tipo}):</strong>
                      <ul style={{ margin: "4px 0 0", paddingLeft: "16px", color: "var(--muted, #475569)" }}>
                        {selectedElement.vinculoLabels.map((lbl) => (
                          <li key={lbl}>{lbl}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: "13px", color: "var(--muted, #64748b)", lineHeight: 1.5 }}>
                  Clique em qualquer um dos 28 elementos na cena 3D (ou na lista abaixo) para ver posição, dimensões, status e vínculos do projeto.
                </p>
              )}
            </div>

            <div style={{ ...cardStyle, overflow: "hidden" }}>
              <div
                style={{
                  padding: "12px 14px",
                  borderBottom: "1px solid var(--border, #e2e8f0)",
                  fontSize: "13px",
                  fontWeight: 700,
                }}
              >
                Lista dos Elementos ({computedElements.length})
              </div>
              <div
                style={{
                  maxHeight: "340px",
                  overflowY: "auto",
                  padding: "6px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                {computedElements.map((el) => {
                  const active = el.id_elemento === selectedId;
                  const meta = STATUS_META[el.status];
                  return (
                    <button
                      key={el.id_elemento}
                      type="button"
                      onClick={() => setSelectedId(el.id_elemento)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "8px 10px",
                        borderRadius: "10px",
                        border: active ? "1px solid #081628" : "1px solid transparent",
                        background: active ? "rgba(8, 22, 40, 0.06)" : "transparent",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "8px",
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: "12.5px",
                            fontWeight: 700,
                            color: "var(--ink, #0f172a)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {el.id_elemento} · {el.nome_elemento}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--muted, #64748b)" }}>
                          {el.tipo_elemento}
                        </div>
                      </div>
                      <span
                        style={{
                          flexShrink: 0,
                          padding: "2px 7px",
                          borderRadius: "999px",
                          fontSize: "11px",
                          fontWeight: 700,
                          background: meta.bg,
                          color: meta.ink,
                        }}
                      >
                        {el.status === "EXISTENTE" ? "Base" : `${el.progress}%`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

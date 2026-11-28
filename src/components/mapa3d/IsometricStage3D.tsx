'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  ISLANDS,
  STATUS_META,
  type BlockStatus,
  type IslandId,
  type ResolvedMap3DBlock,
} from '../../data/mapa3dData';

export interface IsometricStage3DHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
}

export type Map3DViewLevel = 'macro' | 'atomic';

export type SelectedAtomTarget =
  | { type: 'core'; id: string }
  | { type: 'subtask'; id: string }
  | { type: 'risk'; id: string };

interface IsometricStage3DProps {
  blocks: ResolvedMap3DBlock[];
  matchedIds: Set<string>;
  selectedBlockId: string;
  viewLevel: Map3DViewLevel;
  selectedAtom: SelectedAtomTarget;
  toggledSubtasks: Record<string, boolean>;
  onSelectBlock: (blockId: string) => void;
  onEnterAtomic: (blockId: string) => void;
  onSelectAtom: (target: SelectedAtomTarget) => void;
  onToggleSubtask: (subtaskId: string, defaultDone: boolean) => void;
  onJumpToDependency: (blockId: string) => void;
  showLabels?: boolean;
  theme: 'dark' | 'light';
}

interface PrismVisual {
  id: string;
  group: THREE.Group;
  bodyMesh: THREE.Mesh;
  topMesh: THREE.Mesh;
  bodyMat: THREE.MeshStandardMaterial;
  topMat: THREE.MeshStandardMaterial;
  currentHeight: number;
  targetHeight: number;
  worldX: number;
  worldZ: number;
}

interface PlatformVisual {
  id: IslandId;
  topMat: THREE.MeshStandardMaterial;
  sideMat: THREE.MeshStandardMaterial;
  edgeMat: THREE.LineBasicMaterial;
}

interface AtomicLabelAnchor {
  key: string;
  worldX: number;
  worldY: number;
  worldZ: number;
}

interface AtomicHoverInfo {
  title: string;
  subtitle: string;
  dotColor: string;
  hint: string;
  worldX: number;
  worldY: number;
  worldZ: number;
}

function detectSoftwareWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl2') ||
      canvas.getContext('webgl')) as WebGLRenderingContext | null;
    if (!gl) return true;
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const rendererStr = dbg
      ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '')
      : '';
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(
      rendererStr
    );
  } catch {
    return true;
  }
}

function computePrismHeight(progress: number, status: BlockStatus): number {
  const normalized = Math.max(0.15, Math.min(1, progress / 100));
  const base = 0.58 + normalized * 1.38;
  if (status === 'critico') return Math.max(base, 1.52);
  if (status === 'atencao') return Math.max(base, 1.28);
  return base;
}

const DEFAULT_CAMERA_POS = new THREE.Vector3(17.5, 13.8, 17.5);
const DEFAULT_TARGET = new THREE.Vector3(0, 0.25, 0);
const DEFAULT_ZOOM = 1.04;
const ATOMIC_CAMERA_POS = new THREE.Vector3(13.5, 11.4, 13.5);
const ATOMIC_TARGET = new THREE.Vector3(0, 0.35, 0);
const ATOMIC_ZOOM = 1.22;
const PLATFORM_TOP_Y = 0.24;

function disposeObjectTree(root: THREE.Object3D) {
  root.traverse((obj) => {
    if (
      obj instanceof THREE.Mesh ||
      obj instanceof THREE.Line ||
      obj instanceof THREE.LineSegments
    ) {
      obj.geometry?.dispose();
      const mat = obj.material;
      if (Array.isArray(mat)) {
        mat.forEach((m) => m.dispose());
      } else if (mat) {
        mat.dispose();
      }
    }
  });
}

export const IsometricStage3D = forwardRef<
  IsometricStage3DHandle,
  IsometricStage3DProps
>(function IsometricStage3D(
  {
    blocks,
    matchedIds,
    selectedBlockId,
    viewLevel,
    selectedAtom,
    toggledSubtasks,
    onSelectBlock,
    onEnterAtomic,
    onSelectAtom,
    onToggleSubtask,
    onJumpToDependency,
    showLabels = false,
    theme,
  },
  ref
) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const islandBadgeRefs = useRef<Record<IslandId, HTMLDivElement | null>>({
    plataforma: null,
    conteudo: null,
    operacao: null,
    infraestrutura: null,
  });
  const calloutRef = useRef<HTMLDivElement | null>(null);
  const hoverTooltipRef = useRef<HTMLDivElement | null>(null);
  const microLabelRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const atomicLabelRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [hoveredMacroBlock, setHoveredMacroBlock] =
    useState<ResolvedMap3DBlock | null>(null);
  const [hoveredAtomicInfo, setHoveredAtomicInfo] =
    useState<AtomicHoverInfo | null>(null);
  const [contextLost, setContextLost] = useState(false);

  // Synced refs for imperative Three.js scene
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;
  const matchedIdsRef = useRef(matchedIds);
  matchedIdsRef.current = matchedIds;
  const selectedIdRef = useRef(selectedBlockId);
  selectedIdRef.current = selectedBlockId;
  const viewLevelRef = useRef(viewLevel);
  viewLevelRef.current = viewLevel;
  const selectedAtomRef = useRef(selectedAtom);
  selectedAtomRef.current = selectedAtom;
  const toggledSubtasksRef = useRef(toggledSubtasks);
  toggledSubtasksRef.current = toggledSubtasks;
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const showLabelsRef = useRef(showLabels);
  showLabelsRef.current = showLabels;
  const onSelectRef = useRef(onSelectBlock);
  onSelectRef.current = onSelectBlock;
  const onEnterAtomicRef = useRef(onEnterAtomic);
  onEnterAtomicRef.current = onEnterAtomic;
  const onSelectAtomRef = useRef(onSelectAtom);
  onSelectAtomRef.current = onSelectAtom;
  const onToggleSubtaskRef = useRef(onToggleSubtask);
  onToggleSubtaskRef.current = onToggleSubtask;
  const onJumpToDepRef = useRef(onJumpToDependency);
  onJumpToDepRef.current = onJumpToDependency;

  const atomicAnchorsRef = useRef<AtomicLabelAnchor[]>([]);
  const hoveredAtomicRef = useRef<AtomicHoverInfo | null>(null);

  const controlsApiRef = useRef<{
    zoomIn: () => void;
    zoomOut: () => void;
    resetView: () => void;
    syncData: () => void;
    syncTheme: () => void;
    syncLevel: () => void;
    syncOverlays: () => void;
  } | null>(null);

  useImperativeHandle(ref, () => ({
    zoomIn: () => controlsApiRef.current?.zoomIn(),
    zoomOut: () => controlsApiRef.current?.zoomOut(),
    resetView: () => controlsApiRef.current?.resetView(),
  }));

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    const width = Math.max(container.clientWidth, 320);
    const height = Math.max(container.clientHeight, 320);

    // 1. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2)
    );
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 2. Scene & Studio Environment
    const scene = new THREE.Scene();
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    // 3. Orthographic Isometric Camera
    const frustumHalfHeight = 7.4;
    const aspect = width / height;
    const camera = new THREE.OrthographicCamera(
      -frustumHalfHeight * aspect,
      frustumHalfHeight * aspect,
      frustumHalfHeight,
      -frustumHalfHeight,
      0.1,
      120
    );
    camera.position.copy(DEFAULT_CAMERA_POS);
    camera.zoom = DEFAULT_ZOOM;
    camera.lookAt(DEFAULT_TARGET);
    camera.updateProjectionMatrix();

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(DEFAULT_TARGET);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.08;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.enableRotate = true;
    controls.minZoom = 0.65;
    controls.maxZoom = 2.25;
    controls.minPolarAngle = Math.PI / 5.2;
    controls.maxPolarAngle = Math.PI / 2.5;
    controls.panSpeed = 0.85;
    controls.rotateSpeed = 0.55;
    controls.zoomSpeed = 0.9;
    controls.update();

    // 5. Studio 3-Point Lighting
    const hemiLight = new THREE.HemisphereLight(0xf1f5ff, 0x0b1324, 0.88);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff9f0, 1.85);
    keyLight.position.set(8, 22, 16);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.near = 2;
      keyLight.shadow.camera.far = 55;
      const d = 12;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      keyLight.shadow.bias = -0.0005;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x9b82ff, 0.6);
    rimLight.position.set(-16, 10, -14);
    scene.add(rimLight);

    // 6. Subtle Floor Grid Lines (shared across both levels)
    const gridPoints: number[] = [];
    const gridExtent = 13;
    const gridStep = 1.3;
    for (let i = -gridExtent; i <= gridExtent; i += gridStep) {
      gridPoints.push(i, -0.06, -gridExtent, i, -0.06, gridExtent);
      gridPoints.push(-gridExtent, -0.06, i, gridExtent, -0.06, i);
    }
    const gridGeom = new THREE.BufferGeometry();
    gridGeom.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(gridPoints, 3)
    );
    const gridMat = new THREE.LineBasicMaterial({
      color: 0x263455,
      transparent: true,
      opacity: 0.22,
    });
    const gridLines = new THREE.LineSegments(gridGeom, gridMat);
    scene.add(gridLines);

    // =========================================================================
    // LEVEL 1: MACRO SCENE GROUP (4 Islands + 28 Prisms + Arcs)
    // =========================================================================
    const macroGroup = new THREE.Group();
    scene.add(macroGroup);

    const platformVisuals: PlatformVisual[] = [];
    const sharedDeckGeom = new THREE.BoxGeometry(3.92, 0.22, 3.92);
    const sharedTopPlateGeom = new THREE.BoxGeometry(3.78, 0.04, 3.78);
    const sharedEdgeGeom = new THREE.EdgesGeometry(sharedDeckGeom);
    const sharedBaseFootGeom = new THREE.BoxGeometry(4.06, 0.06, 4.06);

    for (const island of ISLANDS) {
      const group = new THREE.Group();
      group.position.set(island.center[0], 0, island.center[1]);

      const sideMat = new THREE.MeshStandardMaterial({
        color: 0x10192f,
        roughness: 0.65,
        metalness: 0.15,
      });
      const topMat = new THREE.MeshStandardMaterial({
        color: 0x15223e,
        roughness: 0.55,
        metalness: 0.1,
      });
      const edgeMat = new THREE.LineBasicMaterial({
        color: 0x3b4d78,
        transparent: true,
        opacity: 0.58,
      });

      const footMesh = new THREE.Mesh(sharedBaseFootGeom, sideMat);
      footMesh.position.y = 0.03;
      group.add(footMesh);

      const deckMesh = new THREE.Mesh(sharedDeckGeom, sideMat);
      deckMesh.position.y = 0.12;
      deckMesh.receiveShadow = !isSoftwareGl;
      group.add(deckMesh);

      const topPlate = new THREE.Mesh(sharedTopPlateGeom, topMat);
      topPlate.position.y = 0.23;
      topPlate.receiveShadow = !isSoftwareGl;
      group.add(topPlate);

      const borderLines = new THREE.LineSegments(sharedEdgeGeom, edgeMat);
      borderLines.position.y = 0.12;
      group.add(borderLines);

      macroGroup.add(group);
      platformVisuals.push({ id: island.id, topMat, sideMat, edgeMat });
    }

    // Macro selection ring & hover ring
    const selectionGroup = new THREE.Group();
    const innerRingGeom = new THREE.RingGeometry(0.41, 0.5, 40);
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.92,
    });
    const innerRing = new THREE.Mesh(innerRingGeom, innerRingMat);
    innerRing.rotation.x = -Math.PI / 2;
    selectionGroup.add(innerRing);

    const outerCirclePoints: THREE.Vector3[] = [];
    const ringSegs = 48;
    for (let i = 0; i <= ringSegs; i++) {
      const a = (i / ringSegs) * Math.PI * 2;
      outerCirclePoints.push(
        new THREE.Vector3(Math.cos(a) * 0.62, 0.01, Math.sin(a) * 0.62)
      );
    }
    const outerRingGeom = new THREE.BufferGeometry().setFromPoints(
      outerCirclePoints
    );
    const outerRingMat = new THREE.LineDashedMaterial({
      color: 0xfcd34d,
      dashSize: 0.12,
      gapSize: 0.08,
      transparent: true,
      opacity: 0.85,
    });
    const outerRingLine = new THREE.Line(outerRingGeom, outerRingMat);
    outerRingLine.computeLineDistances();
    selectionGroup.add(outerRingLine);
    selectionGroup.position.y = PLATFORM_TOP_Y + 0.025;
    macroGroup.add(selectionGroup);

    const hoverRingGeom = new THREE.RingGeometry(0.39, 0.45, 32);
    const hoverRingMat = new THREE.MeshBasicMaterial({
      color: 0x7c5cfc,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.72,
    });
    const hoverRing = new THREE.Mesh(hoverRingGeom, hoverRingMat);
    hoverRing.rotation.x = -Math.PI / 2;
    hoverRing.position.y = PLATFORM_TOP_Y + 0.02;
    hoverRing.visible = false;
    macroGroup.add(hoverRing);

    // 28 Operational Prisms
    const sharedBodyGeom = new THREE.BoxGeometry(0.54, 1, 0.54);
    const sharedTopGeom = new THREE.BoxGeometry(0.55, 0.045, 0.55);
    const prismMap = new Map<string, PrismVisual>();
    const macroPickables: THREE.Object3D[] = [];

    for (const block of blocksRef.current) {
      const group = new THREE.Group();
      group.position.set(block.worldX, PLATFORM_TOP_Y, block.worldZ);

      const initialHeight = computePrismHeight(block.progress, block.status);
      const statusColors = STATUS_META[block.status];
      const isDark = themeRef.current === 'dark';

      const bodyMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(
          isDark ? statusColors.darkHex : statusColors.lightHex
        ),
        roughness: 0.34,
        metalness: 0.08,
        transparent: true,
        opacity: 1,
      });

      const topMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(
          isDark ? statusColors.topDarkHex : statusColors.topLightHex
        ),
        roughness: 0.25,
        metalness: 0.06,
        transparent: true,
        opacity: 1,
      });

      const bodyMesh = new THREE.Mesh(sharedBodyGeom, bodyMat);
      bodyMesh.scale.y = initialHeight;
      bodyMesh.position.y = initialHeight / 2;
      bodyMesh.castShadow = !isSoftwareGl;
      bodyMesh.receiveShadow = !isSoftwareGl;
      bodyMesh.userData.blockId = block.id;

      const topMesh = new THREE.Mesh(sharedTopGeom, topMat);
      topMesh.position.y = initialHeight + 0.022;
      topMesh.userData.blockId = block.id;

      group.add(bodyMesh);
      group.add(topMesh);
      macroGroup.add(group);

      macroPickables.push(bodyMesh, topMesh);

      prismMap.set(block.id, {
        id: block.id,
        group,
        bodyMesh,
        topMesh,
        bodyMat,
        topMat,
        currentHeight: initialHeight,
        targetHeight: initialHeight,
        worldX: block.worldX,
        worldZ: block.worldZ,
      });
    }

    const arcsGroup = new THREE.Group();
    macroGroup.add(arcsGroup);

    const disposeMacroArcs = () => {
      while (arcsGroup.children.length > 0) {
        const child = arcsGroup.children[0];
        arcsGroup.remove(child);
        disposeObjectTree(child);
      }
    };

    const rebuildMacroArcs = () => {
      disposeMacroArcs();
      const currentBlocks = blocksRef.current;
      const byId = new Map(currentBlocks.map((b) => [b.id, b]));
      const selected = byId.get(selectedIdRef.current);
      if (!selected) return;

      const isDark = themeRef.current === 'dark';
      const selectedPrism = prismMap.get(selected.id);
      const startY =
        PLATFORM_TOP_Y + (selectedPrism ? selectedPrism.targetHeight * 0.72 : 1.1);

      selected.dependencies.forEach((depId, idx) => {
        const target = byId.get(depId);
        if (!target) return;
        const targetPrism = prismMap.get(target.id);
        const endY =
          PLATFORM_TOP_Y + (targetPrism ? targetPrism.targetHeight * 0.7 : 0.9);

        const p0 = new THREE.Vector3(selected.worldX, startY, selected.worldZ);
        const p2 = new THREE.Vector3(target.worldX, endY, target.worldZ);
        const mid = p0.clone().add(p2).multiplyScalar(0.5);
        const dist = p0.distanceTo(p2);
        mid.y = Math.max(startY, endY) + Math.min(2.15, 0.75 + dist * 0.19);

        const curve = new THREE.QuadraticBezierCurve3(p0, mid, p2);
        const geom = new THREE.BufferGeometry().setFromPoints(curve.getPoints(36));

        const colorHex =
          idx === 0
            ? isDark
              ? 0xf59e0b
              : 0xd97706
            : isDark
              ? 0x8b74f2
              : 0x6747e6;

        const mat = new THREE.LineDashedMaterial({
          color: colorHex,
          dashSize: 0.22,
          gapSize: 0.15,
          transparent: true,
          opacity: idx === 0 ? 0.92 : 0.78,
        });

        const line = new THREE.Line(geom, mat);
        line.computeLineDistances();
        arcsGroup.add(line);
      });

      const inbound = currentBlocks.filter(
        (b) => b.id !== selected.id && b.dependencies.includes(selected.id)
      );
      inbound.slice(0, 2).forEach((src) => {
        const srcPrism = prismMap.get(src.id);
        const sY =
          PLATFORM_TOP_Y + (srcPrism ? srcPrism.targetHeight * 0.62 : 0.9);
        const p0 = new THREE.Vector3(src.worldX, sY, src.worldZ);
        const p2 = new THREE.Vector3(
          selected.worldX,
          startY * 0.85,
          selected.worldZ
        );
        const mid = p0.clone().add(p2).multiplyScalar(0.5);
        mid.y = Math.max(sY, startY) + 0.95;

        const curve = new THREE.QuadraticBezierCurve3(p0, mid, p2);
        const geom = new THREE.BufferGeometry().setFromPoints(curve.getPoints(30));
        const mat = new THREE.LineDashedMaterial({
          color: isDark ? 0x7c5cfc : 0x6747e6,
          dashSize: 0.18,
          gapSize: 0.16,
          transparent: true,
          opacity: 0.52,
        });
        const line = new THREE.Line(geom, mat);
        line.computeLineDistances();
        arcsGroup.add(line);
      });
    };

    // =========================================================================
    // LEVEL 2: ATOMIC DISSECTION GROUP (Core + Subtasks + Dependencies + Risks)
    // =========================================================================
    const atomicGroup = new THREE.Group();
    atomicGroup.visible = viewLevelRef.current === 'atomic';
    scene.add(atomicGroup);
    let atomicPickables: THREE.Object3D[] = [];
    let atomicScaleAnim = 1;

    const clearAtomicScene = () => {
      while (atomicGroup.children.length > 0) {
        const child = atomicGroup.children[0];
        atomicGroup.remove(child);
        disposeObjectTree(child);
      }
      atomicPickables = [];
      atomicAnchorsRef.current = [];
    };

    const rebuildAtomicScene = () => {
      clearAtomicScene();
      const currentBlocks = blocksRef.current;
      const byId = new Map(currentBlocks.map((b) => [b.id, b]));
      const block = byId.get(selectedIdRef.current) ?? currentBlocks[0];
      if (!block) return;

      const isDark = themeRef.current === 'dark';
      const toggles = toggledSubtasksRef.current;
      const selAtom = selectedAtomRef.current;
      const statusColors = STATUS_META[block.status];

      const deckSideHex = isDark ? 0x0e1830 : 0xdbe3f0;
      const deckTopHex = isDark ? 0x14213e : 0xf4f6fb;
      const deckEdgeHex = isDark ? 0x455a8c : 0x94a3b8;

      // 1. Dedicated Central Stepped Octagonal/Isometric Platform
      const baseFoot = new THREE.Mesh(
        new THREE.CylinderGeometry(3.45, 3.65, 0.12, 8),
        new THREE.MeshStandardMaterial({
          color: deckSideHex,
          roughness: 0.65,
          metalness: 0.15,
        })
      );
      baseFoot.position.y = 0.06;
      baseFoot.rotation.y = Math.PI / 8;
      atomicGroup.add(baseFoot);

      const mainDeckGeom = new THREE.CylinderGeometry(3.25, 3.35, 0.16, 8);
      const mainDeck = new THREE.Mesh(
        mainDeckGeom,
        new THREE.MeshStandardMaterial({
          color: deckTopHex,
          roughness: 0.5,
          metalness: 0.12,
        })
      );
      mainDeck.position.y = 0.18;
      mainDeck.rotation.y = Math.PI / 8;
      mainDeck.receiveShadow = !isSoftwareGl;
      atomicGroup.add(mainDeck);

      const deckEdges = new THREE.LineSegments(
        new THREE.EdgesGeometry(mainDeckGeom),
        new THREE.LineBasicMaterial({
          color: deckEdgeHex,
          transparent: true,
          opacity: 0.65,
        })
      );
      deckEdges.position.y = 0.18;
      deckEdges.rotation.y = Math.PI / 8;
      atomicGroup.add(deckEdges);

      // Orbital ring around core
      const orbitalPts: THREE.Vector3[] = [];
      for (let i = 0; i <= 64; i++) {
        const a = (i / 64) * Math.PI * 2;
        orbitalPts.push(
          new THREE.Vector3(Math.cos(a) * 2.15, 0.28, Math.sin(a) * 2.15)
        );
      }
      const orbitalRing = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(orbitalPts),
        new THREE.LineDashedMaterial({
          color: isDark ? 0x5c6f9c : 0x94a3b8,
          dashSize: 0.18,
          gapSize: 0.14,
          transparent: true,
          opacity: 0.65,
        })
      );
      orbitalRing.computeLineDistances();
      atomicGroup.add(orbitalRing);

      // 2. Center Nucleus Composite Structure (Parent Block)
      const coreHeight = 0.85 + (block.progress / 100) * 1.45;
      const coreColor = new THREE.Color(
        isDark ? statusColors.darkHex : statusColors.lightHex
      );
      const coreTopColor = new THREE.Color(
        isDark ? statusColors.topDarkHex : statusColors.topLightHex
      );
      const isCoreSelected = selAtom.type === 'core';

      const coreGroup = new THREE.Group();
      coreGroup.position.set(0, 0.26, 0);

      const corePedestal = new THREE.Mesh(
        new THREE.BoxGeometry(1.18, 0.1, 1.18),
        new THREE.MeshStandardMaterial({
          color: isDark ? 0x1d2b4d : 0xcbd5e1,
          roughness: 0.55,
          metalness: 0.2,
        })
      );
      corePedestal.position.y = 0.05;
      coreGroup.add(corePedestal);

      const coreBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.92, coreHeight, 0.92),
        new THREE.MeshStandardMaterial({
          color: coreColor,
          roughness: 0.3,
          metalness: 0.12,
          emissive: coreColor,
          emissiveIntensity: isCoreSelected ? (isDark ? 0.24 : 0.12) : 0.08,
        })
      );
      coreBody.position.y = 0.1 + coreHeight / 2;
      coreBody.castShadow = !isSoftwareGl;
      coreBody.receiveShadow = !isSoftwareGl;
      coreBody.userData.atomTarget = {
        kind: 'core',
        id: block.id,
        title: `${block.name} · ${block.progress}%`,
        subtitle: `${block.islandLabel} · ${STATUS_META[block.status].label}`,
        dotColor: isDark ? statusColors.darkHex : statusColors.lightHex,
        hint: 'Núcleo do bloco · clique para inspecionar',
        worldX: 0,
        worldY: 0.36 + coreHeight + 0.3,
        worldZ: 0,
      };
      coreGroup.add(coreBody);

      const coreCap = new THREE.Mesh(
        new THREE.BoxGeometry(0.96, 0.07, 0.96),
        new THREE.MeshStandardMaterial({
          color: coreTopColor,
          roughness: 0.2,
          metalness: 0.15,
          emissive: coreTopColor,
          emissiveIntensity: 0.2,
        })
      );
      coreCap.position.y = 0.1 + coreHeight + 0.035;
      coreCap.userData.atomTarget = coreBody.userData.atomTarget;
      coreGroup.add(coreCap);

      // Core selection halo ring
      const coreRing = new THREE.Mesh(
        new THREE.RingGeometry(0.76, 0.86, 40),
        new THREE.MeshBasicMaterial({
          color: coreColor,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: isCoreSelected ? 0.9 : 0.45,
        })
      );
      coreRing.rotation.x = -Math.PI / 2;
      coreRing.position.y = 0.02;
      coreGroup.add(coreRing);

      atomicGroup.add(coreGroup);
      atomicPickables.push(coreBody, coreCap);

      atomicAnchorsRef.current.push({
        key: 'core',
        worldX: 0,
        worldY: 0.36 + coreHeight + 0.42,
        worldZ: 0,
      });

      // 3. Subtask / Deliverable 3D Nodes around the Core
      const subtasks = block.subtasks;
      const subRadius = 2.15;
      subtasks.forEach((st, idx) => {
        const angle = (idx / Math.max(1, subtasks.length)) * Math.PI * 2 - Math.PI / 4;
        const sx = Math.cos(angle) * subRadius;
        const sz = Math.sin(angle) * subRadius;
        const isDone = toggles[st.id] ?? st.done;
        const isSelected = selAtom.type === 'subtask' && selAtom.id === st.id;

        const stColorHex = isDone
          ? isDark
            ? '#10B981'
            : '#059669'
          : isDark
            ? '#7C5CFC'
            : '#6747E6';
        const stTopHex = isDone
          ? isDark
            ? '#34D399'
            : '#10B981'
          : isDark
            ? '#9F86FF'
            : '#7C5CFC';
        const stHeight = isDone ? 1.18 : 0.68;

        const stGroup = new THREE.Group();
        stGroup.position.set(sx, 0.26, sz);

        const stBase = new THREE.Mesh(
          new THREE.BoxGeometry(0.68, 0.07, 0.68),
          new THREE.MeshStandardMaterial({
            color: isDark ? 0x1e2c4f : 0xcbd5e1,
            roughness: 0.55,
            metalness: 0.15,
          })
        );
        stBase.position.y = 0.035;
        stGroup.add(stBase);

        const stMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(stColorHex),
          roughness: 0.32,
          metalness: 0.08,
          emissive: new THREE.Color(stColorHex),
          emissiveIntensity: isSelected ? 0.32 : isDone ? 0.12 : 0.06,
        });

        const stBody = new THREE.Mesh(
          new THREE.BoxGeometry(0.52, stHeight, 0.52),
          stMat
        );
        stBody.position.y = 0.07 + stHeight / 2;
        stBody.castShadow = !isSoftwareGl;
        stBody.receiveShadow = !isSoftwareGl;

        const atomMeta = {
          kind: 'subtask' as const,
          id: st.id,
          defaultDone: st.done,
          title: st.title,
          subtitle: isDone ? 'Concluído' : 'Em andamento',
          dotColor: stColorHex,
          hint: isDone
            ? 'Clique p/ marcar Em andamento'
            : 'Clique p/ marcar Concluído',
          worldX: sx,
          worldY: 0.33 + stHeight + 0.26,
          worldZ: sz,
        };

        stBody.userData.atomTarget = atomMeta;
        stGroup.add(stBody);

        const stCap = new THREE.Mesh(
          new THREE.BoxGeometry(0.54, 0.05, 0.54),
          new THREE.MeshStandardMaterial({
            color: new THREE.Color(stTopHex),
            roughness: 0.22,
            metalness: 0.1,
          })
        );
        stCap.position.y = 0.07 + stHeight + 0.025;
        stCap.userData.atomTarget = atomMeta;
        stGroup.add(stCap);

        if (isSelected) {
          const ring = new THREE.Mesh(
            new THREE.RingGeometry(0.42, 0.5, 32),
            new THREE.MeshBasicMaterial({
              color: new THREE.Color(stTopHex),
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.9,
            })
          );
          ring.rotation.x = -Math.PI / 2;
          ring.position.y = 0.02;
          stGroup.add(ring);
        }

        // Radial connector line from subtask base to core
        const spokeGeom = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(sx * 0.32, 0.29, sz * 0.32),
          new THREE.Vector3(sx * 0.84, 0.29, sz * 0.84),
        ]);
        const spoke = new THREE.Line(
          spokeGeom,
          new THREE.LineBasicMaterial({
            color: new THREE.Color(stColorHex),
            transparent: true,
            opacity: 0.65,
          })
        );
        atomicGroup.add(spoke);

        atomicGroup.add(stGroup);
        atomicPickables.push(stBody, stCap);

        atomicAnchorsRef.current.push({
          key: `subtask:${st.id}`,
          worldX: sx,
          worldY: 0.33 + stHeight + 0.28,
          worldZ: sz,
        });
      });

      // 4. External Dependency Nodes (clickable to jump to dependent block's atomic view)
      const depBlocks = block.dependencies
        .map((id) => byId.get(id))
        .filter((b): b is ResolvedMap3DBlock => Boolean(b));

      depBlocks.forEach((dep, idx) => {
        const spread = depBlocks.length === 1 ? 0 : (idx - (depBlocks.length - 1) / 2) * 0.58;
        const angle = -Math.PI * 0.72 + spread;
        const dist = 4.65;
        const dx = Math.cos(angle) * dist;
        const dz = Math.sin(angle) * dist;

        const depStatusColors = STATUS_META[dep.status];
        const depHex = isDark ? depStatusColors.darkHex : depStatusColors.lightHex;
        const depTopHex = isDark
          ? depStatusColors.topDarkHex
          : depStatusColors.topLightHex;
        const depHeight = 0.56 + (dep.progress / 100) * 0.68;

        const depGroup = new THREE.Group();
        depGroup.position.set(dx, 0, dz);

        // Mini satellite pad
        const pad = new THREE.Mesh(
          new THREE.CylinderGeometry(0.72, 0.78, 0.16, 6),
          new THREE.MeshStandardMaterial({
            color: deckSideHex,
            roughness: 0.6,
            metalness: 0.15,
          })
        );
        pad.position.y = 0.08;
        depGroup.add(pad);

        const depMeta = {
          kind: 'dependency' as const,
          id: dep.id,
          title: `${dep.name} · ${dep.progress}%`,
          subtitle: `Dependência · ${dep.islandLabel}`,
          dotColor: depHex,
          hint: 'Clique p/ abrir visão atômica deste bloco',
          worldX: dx,
          worldY: 0.18 + depHeight + 0.28,
          worldZ: dz,
        };

        const depBody = new THREE.Mesh(
          new THREE.BoxGeometry(0.56, depHeight, 0.56),
          new THREE.MeshStandardMaterial({
            color: new THREE.Color(depHex),
            roughness: 0.34,
            metalness: 0.1,
          })
        );
        depBody.position.y = 0.16 + depHeight / 2;
        depBody.castShadow = !isSoftwareGl;
        depBody.userData.atomTarget = depMeta;
        depGroup.add(depBody);

        const depCap = new THREE.Mesh(
          new THREE.BoxGeometry(0.58, 0.045, 0.58),
          new THREE.MeshStandardMaterial({
            color: new THREE.Color(depTopHex),
            roughness: 0.24,
            metalness: 0.1,
          })
        );
        depCap.position.y = 0.16 + depHeight + 0.022;
        depCap.userData.atomTarget = depMeta;
        depGroup.add(depCap);

        atomicGroup.add(depGroup);
        atomicPickables.push(depBody, depCap);

        // Curved dashed arc connecting external dependency to core
        const p0 = new THREE.Vector3(0, 0.36 + coreHeight * 0.72, 0);
        const p2 = new THREE.Vector3(dx, 0.16 + depHeight * 0.75, dz);
        const mid = p0.clone().add(p2).multiplyScalar(0.5);
        mid.y = Math.max(p0.y, p2.y) + 1.15;
        const curve = new THREE.QuadraticBezierCurve3(p0, mid, p2);
        const arc = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(curve.getPoints(32)),
          new THREE.LineDashedMaterial({
            color: idx === 0 ? 0xf59e0b : 0x8b74f2,
            dashSize: 0.2,
            gapSize: 0.14,
            transparent: true,
            opacity: 0.88,
          })
        );
        arc.computeLineDistances();
        atomicGroup.add(arc);

        atomicAnchorsRef.current.push({
          key: `dep:${dep.id}`,
          worldX: dx,
          worldY: 0.18 + depHeight + 0.28,
          worldZ: dz,
        });
      });

      // 5. Associated Risk Beacons on Outer Right Arc
      block.risks.forEach((risk, idx) => {
        const spread =
          block.risks.length === 1
            ? 0
            : (idx - (block.risks.length - 1) / 2) * 0.55;
        const angle = Math.PI * 0.24 + spread;
        const dist = 4.25;
        const rx = Math.cos(angle) * dist;
        const rz = Math.sin(angle) * dist;
        const isSelected = selAtom.type === 'risk' && selAtom.id === risk.id;

        const riskHex =
          risk.severity === 'alto'
            ? '#F43F5E'
            : risk.severity === 'medio'
              ? '#F59E0B'
              : '#10B981';

        const rGroup = new THREE.Group();
        rGroup.position.set(rx, 0, rz);

        const plinth = new THREE.Mesh(
          new THREE.CylinderGeometry(0.46, 0.54, 0.14, 6),
          new THREE.MeshStandardMaterial({
            color: deckSideHex,
            roughness: 0.6,
            metalness: 0.18,
          })
        );
        plinth.position.y = 0.07;
        rGroup.add(plinth);

        const riskMeta = {
          kind: 'risk' as const,
          id: risk.id,
          title: risk.title,
          subtitle: `Risco ${risk.severity === 'alto' ? 'Alto' : risk.severity === 'medio' ? 'Médio' : 'Baixo'}`,
          dotColor: riskHex,
          hint: 'Clique p/ inspecionar mitigação',
          worldX: rx,
          worldY: 1.05,
          worldZ: rz,
        };

        const beacon = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.36, 0),
          new THREE.MeshStandardMaterial({
            color: new THREE.Color(riskHex),
            roughness: 0.25,
            metalness: 0.18,
            emissive: new THREE.Color(riskHex),
            emissiveIntensity: isSelected ? 0.42 : 0.18,
          })
        );
        beacon.position.y = 0.62;
        beacon.castShadow = !isSoftwareGl;
        beacon.userData.atomTarget = riskMeta;
        rGroup.add(beacon);

        if (isSelected) {
          const ring = new THREE.Mesh(
            new THREE.RingGeometry(0.5, 0.58, 32),
            new THREE.MeshBasicMaterial({
              color: new THREE.Color(riskHex),
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.9,
            })
          );
          ring.rotation.x = -Math.PI / 2;
          ring.position.y = 0.15;
          rGroup.add(ring);
        }

        atomicGroup.add(rGroup);
        atomicPickables.push(beacon);

        // Dashed warning link to core
        const p0 = new THREE.Vector3(0, 0.36 + coreHeight * 0.55, 0);
        const p2 = new THREE.Vector3(rx, 0.62, rz);
        const mid = p0.clone().add(p2).multiplyScalar(0.5);
        mid.y = Math.max(p0.y, p2.y) + 0.72;
        const curve = new THREE.QuadraticBezierCurve3(p0, mid, p2);
        const arc = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(curve.getPoints(26)),
          new THREE.LineDashedMaterial({
            color: new THREE.Color(riskHex),
            dashSize: 0.16,
            gapSize: 0.14,
            transparent: true,
            opacity: 0.7,
          })
        );
        arc.computeLineDistances();
        atomicGroup.add(arc);

        atomicAnchorsRef.current.push({
          key: `risk:${risk.id}`,
          worldX: rx,
          worldY: 1.08,
          worldZ: rz,
        });
      });
    };

    // Scratch vectors for zero-GC projections
    const projVec = new THREE.Vector3();
    const scratchColor = new THREE.Color();
    const scratchTopColor = new THREE.Color();

    let animTargetZoom: number | null = null;
    let animCamPosTarget: THREE.Vector3 | null = null;
    let animControlsTarget: THREE.Vector3 | null = null;
    let hoveredMacroId: string | null = null;

    const projectWorldToDom = (
      x: number,
      y: number,
      z: number,
      viewportW: number,
      viewportH: number
    ) => {
      projVec.set(x, y, z).project(camera);
      const sx = (projVec.x * 0.5 + 0.5) * viewportW;
      const sy = (-projVec.y * 0.5 + 0.5) * viewportH;
      return { sx, sy, visible: projVec.z < 1 && projVec.z > -1 };
    };

    const updateDomOverlays = () => {
      const vw = container.clientWidth;
      const vh = container.clientHeight;
      if (vw <= 0 || vh <= 0) return;

      const isAtomic = viewLevelRef.current === 'atomic';

      if (!isAtomic) {
        // Macro mode overlays
        for (const island of ISLANDS) {
          const el = islandBadgeRefs.current[island.id];
          if (!el) continue;
          const pos = projectWorldToDom(
            island.labelAnchor[0],
            island.labelAnchor[1],
            island.labelAnchor[2],
            vw,
            vh
          );
          el.style.transform = `translate3d(${pos.sx.toFixed(1)}px, ${pos.sy.toFixed(1)}px, 0) translate(-50%, -50%)`;
          el.style.opacity = pos.visible ? '1' : '0';
        }

        if (showLabelsRef.current) {
          for (const [blockId, el] of Object.entries(microLabelRefs.current)) {
            if (!el) continue;
            const pv = prismMap.get(blockId);
            if (
              !pv ||
              blockId === selectedIdRef.current ||
              blockId === hoveredMacroId
            ) {
              el.style.opacity = '0';
              continue;
            }
            const pos = projectWorldToDom(
              pv.worldX,
              PLATFORM_TOP_Y + pv.currentHeight + 0.24,
              pv.worldZ,
              vw,
              vh
            );
            const cx = Math.max(76, Math.min(vw - 76, pos.sx));
            const cy = Math.max(54, Math.min(vh - 96, pos.sy));
            el.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0) translate(-50%, -100%)`;
            el.style.opacity = pos.visible ? '0.94' : '0';
          }
        }

        const calloutEl = calloutRef.current;
        const selectedPrism = prismMap.get(selectedIdRef.current);
        if (calloutEl && selectedPrism) {
          const pos = projectWorldToDom(
            selectedPrism.worldX,
            PLATFORM_TOP_Y + selectedPrism.currentHeight + 0.42,
            selectedPrism.worldZ,
            vw,
            vh
          );
          const clampedX = Math.max(120, Math.min(vw - 120, pos.sx));
          const clampedY = Math.max(66, Math.min(vh - 96, pos.sy));
          calloutEl.style.transform = `translate3d(${clampedX.toFixed(1)}px, ${clampedY.toFixed(1)}px, 0) translate(-50%, -100%)`;
          const showCallout =
            pos.visible && hoveredMacroId !== selectedIdRef.current;
          calloutEl.style.opacity = showCallout ? '1' : '0';
        }

        const hoverEl = hoverTooltipRef.current;
        if (hoverEl && hoveredMacroId) {
          const hp = prismMap.get(hoveredMacroId);
          if (hp) {
            const pos = projectWorldToDom(
              hp.worldX,
              PLATFORM_TOP_Y + hp.currentHeight + 0.36,
              hp.worldZ,
              vw,
              vh
            );
            const clampedX = Math.max(115, Math.min(vw - 115, pos.sx));
            const clampedY = Math.max(72, Math.min(vh - 92, pos.sy));
            hoverEl.style.transform = `translate3d(${clampedX.toFixed(1)}px, ${clampedY.toFixed(1)}px, 0) translate(-50%, -100%)`;
            hoverEl.style.opacity = pos.visible ? '1' : '0';
          }
        }
      } else {
        // Atomic mode overlays
        for (const anchor of atomicAnchorsRef.current) {
          const el = atomicLabelRefs.current[anchor.key];
          if (!el) continue;
          const pos = projectWorldToDom(
            anchor.worldX,
            anchor.worldY,
            anchor.worldZ,
            vw,
            vh
          );
          const cx = Math.max(88, Math.min(vw - 88, pos.sx));
          const cy = Math.max(80, Math.min(vh - 40, pos.sy));
          el.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0) translate(-50%, -100%)`;
          el.style.opacity = pos.visible ? '1' : '0';
        }

        const hoverEl = hoverTooltipRef.current;
        const hInfo = hoveredAtomicRef.current;
        if (hoverEl && hInfo) {
          const pos = projectWorldToDom(
            hInfo.worldX,
            hInfo.worldY + 0.38,
            hInfo.worldZ,
            vw,
            vh
          );
          const cx = Math.max(120, Math.min(vw - 120, pos.sx));
          const cy = Math.max(86, Math.min(vh - 50, pos.sy));
          hoverEl.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0) translate(-50%, -100%)`;
          hoverEl.style.opacity = pos.visible ? '1' : '0';
        }
      }
    };

    const applyThemeColors = () => {
      const isDark = themeRef.current === 'dark';

      hemiLight.color.setHex(isDark ? 0xeef2ff : 0xffffff);
      hemiLight.groundColor.setHex(isDark ? 0x0b1324 : 0xdbe3f5);
      hemiLight.intensity = isDark ? 0.92 : 1.15;

      keyLight.intensity = isDark ? 1.85 : 1.55;
      rimLight.intensity = isDark ? 0.65 : 0.35;

      gridMat.color.setHex(isDark ? 0x26355a : 0x94a3b8);
      gridMat.opacity = isDark ? 0.24 : 0.22;

      for (const pv of platformVisuals) {
        pv.sideMat.color.setHex(isDark ? 0x0e1830 : 0xdbe3f0);
        pv.topMat.color.setHex(isDark ? 0x14213e : 0xf4f6fb);
        pv.edgeMat.color.setHex(isDark ? 0x3b4d78 : 0x94a3b8);
        pv.edgeMat.opacity = isDark ? 0.6 : 0.55;
      }

      hoverRingMat.color.setHex(isDark ? 0x7c5cfc : 0x6747e6);
    };

    const applyMacroStates = () => {
      const isDark = themeRef.current === 'dark';
      const currentBlocks = blocksRef.current;
      const matched = matchedIdsRef.current;
      const selId = selectedIdRef.current;

      for (const b of currentBlocks) {
        const pv = prismMap.get(b.id);
        if (!pv) continue;

        const isMatched = matched.has(b.id);
        const isSelected = b.id === selId;
        const meta = STATUS_META[b.status];

        pv.targetHeight = computePrismHeight(b.progress, b.status);
        scratchColor.set(isDark ? meta.darkHex : meta.lightHex);
        scratchTopColor.set(isDark ? meta.topDarkHex : meta.topLightHex);

        pv.bodyMat.color.copy(scratchColor);
        pv.topMat.color.copy(scratchTopColor);

        const targetOpacity = isSelected ? 1 : isMatched ? 0.98 : 0.16;
        pv.bodyMat.opacity = targetOpacity;
        pv.topMat.opacity = targetOpacity;
        pv.bodyMat.depthWrite = targetOpacity > 0.5;
        pv.topMat.depthWrite = targetOpacity > 0.5;

        if (isSelected) {
          pv.bodyMat.emissive.copy(scratchColor);
          pv.bodyMat.emissiveIntensity = isDark ? 0.22 : 0.1;
          pv.topMat.emissive.copy(scratchTopColor);
          pv.topMat.emissiveIntensity = isDark ? 0.28 : 0.12;

          selectionGroup.position.set(
            b.worldX,
            PLATFORM_TOP_Y + 0.025,
            b.worldZ
          );
          innerRingMat.color.set(isDark ? meta.darkHex : meta.lightHex);
          outerRingMat.color.set(isDark ? meta.topDarkHex : meta.topLightHex);
        } else {
          pv.bodyMat.emissive.setHex(0x000000);
          pv.bodyMat.emissiveIntensity = 0;
          pv.topMat.emissive.setHex(0x000000);
          pv.topMat.emissiveIntensity = 0;
        }
      }

      rebuildMacroArcs();
    };

    // On-demand render scheduler with smooth transitions
    let rafId = 0;
    let disposed = false;

    const tick = () => {
      rafId = 0;
      if (disposed) return;

      let needsMoreFrames = false;
      const alpha = isSoftwareGl ? 1 : 0.17;

      // 1. Macro prism height damping
      if (viewLevelRef.current === 'macro') {
        prismMap.forEach((pv) => {
          const diff = pv.targetHeight - pv.currentHeight;
          if (Math.abs(diff) > 0.004) {
            pv.currentHeight += diff * alpha;
            pv.bodyMesh.scale.y = pv.currentHeight;
            pv.bodyMesh.position.y = pv.currentHeight / 2;
            pv.topMesh.position.y = pv.currentHeight + 0.022;
            needsMoreFrames = true;
          } else if (pv.currentHeight !== pv.targetHeight) {
            pv.currentHeight = pv.targetHeight;
            pv.bodyMesh.scale.y = pv.currentHeight;
            pv.bodyMesh.position.y = pv.currentHeight / 2;
            pv.topMesh.position.y = pv.currentHeight + 0.022;
          }
        });
      }

      // 2. Atomic pop-in scale damping
      if (viewLevelRef.current === 'atomic' && atomicScaleAnim < 0.998) {
        atomicScaleAnim += (1 - atomicScaleAnim) * alpha;
        atomicGroup.scale.setScalar(atomicScaleAnim);
        needsMoreFrames = true;
      } else if (atomicScaleAnim !== 1) {
        atomicScaleAnim = 1;
        atomicGroup.scale.setScalar(1);
      }

      // 3. Camera zoom / position / target smooth transitions
      if (animTargetZoom !== null) {
        const zDiff = animTargetZoom - camera.zoom;
        if (Math.abs(zDiff) > 0.004) {
          camera.zoom += zDiff * alpha;
          camera.updateProjectionMatrix();
          needsMoreFrames = true;
        } else {
          camera.zoom = animTargetZoom;
          camera.updateProjectionMatrix();
          animTargetZoom = null;
        }
      }

      if (animCamPosTarget !== null) {
        camera.position.lerp(animCamPosTarget, alpha);
        if (camera.position.distanceTo(animCamPosTarget) > 0.03) {
          needsMoreFrames = true;
        } else {
          camera.position.copy(animCamPosTarget);
          animCamPosTarget = null;
        }
      }

      if (animControlsTarget !== null) {
        controls.target.lerp(animControlsTarget, alpha);
        if (controls.target.distanceTo(animControlsTarget) > 0.02) {
          needsMoreFrames = true;
        } else {
          controls.target.copy(animControlsTarget);
          animControlsTarget = null;
        }
      }

      const controlsChanged = controls.update();
      if (controlsChanged) {
        needsMoreFrames = true;
      }

      renderer.render(scene, camera);
      updateDomOverlays();

      if (needsMoreFrames) {
        scheduleRender();
      }
    };

    const scheduleRender = () => {
      if (disposed || rafId !== 0) return;
      rafId = window.requestAnimationFrame(tick);
    };

    controls.addEventListener('change', scheduleRender);
    controls.addEventListener('start', () => {
      animCamPosTarget = null;
      animControlsTarget = null;
      animTargetZoom = null;
    });

    // Pointer raycasting for both Macro & Atomic modes
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    let pointerDownPos: { x: number; y: number } | null = null;
    let lastHoverCheck = 0;

    const getNdcFromEvent = (ev: PointerEvent | MouseEvent): boolean => {
      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return false;
      pointerNdc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      return true;
    };

    const pickMacroBlock = (ev: PointerEvent | MouseEvent): string | null => {
      if (!getNdcFromEvent(ev)) return null;
      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects(macroPickables, false);
      if (hits.length === 0) return null;
      return (hits[0].object.userData.blockId as string) ?? null;
    };

    const pickAtomicNode = (ev: PointerEvent | MouseEvent) => {
      if (!getNdcFromEvent(ev)) return null;
      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects(atomicPickables, false);
      if (hits.length === 0) return null;
      return hits[0].object.userData.atomTarget ?? null;
    };

    const handlePointerDown = (ev: PointerEvent) => {
      pointerDownPos = { x: ev.clientX, y: ev.clientY };
    };

    const handlePointerUp = (ev: PointerEvent) => {
      if (!pointerDownPos) return;
      const dx = ev.clientX - pointerDownPos.x;
      const dy = ev.clientY - pointerDownPos.y;
      pointerDownPos = null;
      if (Math.hypot(dx, dy) > 6) return;

      if (viewLevelRef.current === 'macro') {
        const hitId = pickMacroBlock(ev);
        if (hitId) {
          const pv = prismMap.get(hitId);
          if (pv) {
            animControlsTarget = new THREE.Vector3(
              pv.worldX * 0.24,
              0.25,
              pv.worldZ * 0.24
            );
            scheduleRender();
          }
          onSelectRef.current(hitId);
        }
      } else {
        const atom = pickAtomicNode(ev);
        if (!atom) return;
        if (atom.kind === 'core') {
          onSelectAtomRef.current({ type: 'core', id: atom.id });
        } else if (atom.kind === 'subtask') {
          onSelectAtomRef.current({ type: 'subtask', id: atom.id });
          onToggleSubtaskRef.current(atom.id, Boolean(atom.defaultDone));
        } else if (atom.kind === 'dependency') {
          onJumpToDepRef.current(atom.id);
        } else if (atom.kind === 'risk') {
          onSelectAtomRef.current({ type: 'risk', id: atom.id });
        }
      }
    };

    const handleDoubleClick = (ev: MouseEvent) => {
      if (viewLevelRef.current !== 'macro') return;
      const hitId = pickMacroBlock(ev);
      if (hitId) {
        onEnterAtomicRef.current(hitId);
      }
    };

    const handlePointerMove = (ev: PointerEvent) => {
      const now = performance.now();
      if (now - lastHoverCheck < 28) return;
      lastHoverCheck = now;

      if (viewLevelRef.current === 'macro') {
        const hitId = pickMacroBlock(ev);
        if (hitId !== hoveredMacroId) {
          hoveredMacroId = hitId;
          renderer.domElement.style.cursor = hitId ? 'pointer' : 'grab';
          if (hitId) {
            const pv = prismMap.get(hitId);
            if (pv && hitId !== selectedIdRef.current) {
              hoverRing.position.set(pv.worldX, PLATFORM_TOP_Y + 0.02, pv.worldZ);
              hoverRing.visible = true;
            } else {
              hoverRing.visible = false;
            }
            const found =
              blocksRef.current.find((b) => b.id === hitId) ?? null;
            setHoveredMacroBlock(found);
          } else {
            hoverRing.visible = false;
            setHoveredMacroBlock(null);
          }
          scheduleRender();
        }
      } else {
        const atom = pickAtomicNode(ev);
        renderer.domElement.style.cursor = atom ? 'pointer' : 'grab';
        if (atom) {
          const info: AtomicHoverInfo = {
            title: atom.title,
            subtitle: atom.subtitle,
            dotColor: atom.dotColor,
            hint: atom.hint,
            worldX: atom.worldX,
            worldY: atom.worldY,
            worldZ: atom.worldZ,
          };
          if (hoveredAtomicRef.current?.title !== info.title) {
            hoveredAtomicRef.current = info;
            setHoveredAtomicInfo(info);
            scheduleRender();
          }
        } else if (hoveredAtomicRef.current !== null) {
          hoveredAtomicRef.current = null;
          setHoveredAtomicInfo(null);
          scheduleRender();
        }
      }
    };

    const handlePointerLeave = () => {
      hoveredMacroId = null;
      hoverRing.visible = false;
      setHoveredMacroBlock(null);
      if (hoveredAtomicRef.current !== null) {
        hoveredAtomicRef.current = null;
        setHoveredAtomicInfo(null);
      }
      renderer.domElement.style.cursor = 'grab';
      scheduleRender();
    };

    renderer.domElement.style.cursor = 'grab';
    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointerup', handlePointerUp);
    renderer.domElement.addEventListener('dblclick', handleDoubleClick);
    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('pointerleave', handlePointerLeave);

    const handleContextLost = (ev: Event) => {
      ev.preventDefault();
      setContextLost(true);
    };
    const handleContextRestored = () => {
      setContextLost(false);
      scheduleRender();
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener(
      'webglcontextrestored',
      handleContextRestored
    );

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const w = Math.max(Math.floor(entry.contentRect.width), 280);
      const h = Math.max(Math.floor(entry.contentRect.height), 280);
      const nextAspect = w / h;
      camera.left = -frustumHalfHeight * nextAspect;
      camera.right = frustumHalfHeight * nextAspect;
      camera.top = frustumHalfHeight;
      camera.bottom = -frustumHalfHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      scheduleRender();
    });
    resizeObserver.observe(container);

    // Imperative API
    controlsApiRef.current = {
      zoomIn: () => {
        const baseZoom = animTargetZoom ?? camera.zoom;
        animTargetZoom = Math.min(2.25, Number((baseZoom * 1.18).toFixed(3)));
        scheduleRender();
      },
      zoomOut: () => {
        const baseZoom = animTargetZoom ?? camera.zoom;
        animTargetZoom = Math.max(0.65, Number((baseZoom / 1.18).toFixed(3)));
        scheduleRender();
      },
      resetView: () => {
        if (viewLevelRef.current === 'atomic') {
          animCamPosTarget = ATOMIC_CAMERA_POS.clone();
          animControlsTarget = ATOMIC_TARGET.clone();
          animTargetZoom = ATOMIC_ZOOM;
        } else {
          animCamPosTarget = DEFAULT_CAMERA_POS.clone();
          animControlsTarget = DEFAULT_TARGET.clone();
          animTargetZoom = DEFAULT_ZOOM;
        }
        scheduleRender();
      },
      syncData: () => {
        applyMacroStates();
        if (viewLevelRef.current === 'atomic') {
          rebuildAtomicScene();
        }
        scheduleRender();
      },
      syncTheme: () => {
        applyThemeColors();
        applyMacroStates();
        if (viewLevelRef.current === 'atomic') {
          rebuildAtomicScene();
        }
        scheduleRender();
      },
      syncLevel: () => {
        const isAtomic = viewLevelRef.current === 'atomic';
        macroGroup.visible = !isAtomic;
        atomicGroup.visible = isAtomic;
        hoveredMacroId = null;
        hoverRing.visible = false;
        setHoveredMacroBlock(null);
        hoveredAtomicRef.current = null;
        setHoveredAtomicInfo(null);

        if (isAtomic) {
          rebuildAtomicScene();
          atomicScaleAnim = isSoftwareGl ? 1 : 0.84;
          atomicGroup.scale.setScalar(atomicScaleAnim);
          animCamPosTarget = ATOMIC_CAMERA_POS.clone();
          animControlsTarget = ATOMIC_TARGET.clone();
          animTargetZoom = ATOMIC_ZOOM;
        } else {
          clearAtomicScene();
          applyMacroStates();
          animCamPosTarget = DEFAULT_CAMERA_POS.clone();
          animControlsTarget = DEFAULT_TARGET.clone();
          animTargetZoom = DEFAULT_ZOOM;
        }
        scheduleRender();
      },
      syncOverlays: () => {
        scheduleRender();
      },
    };

    // Initial render
    applyThemeColors();
    applyMacroStates();
    if (viewLevelRef.current === 'atomic') {
      macroGroup.visible = false;
      atomicGroup.visible = true;
      rebuildAtomicScene();
    }
    scheduleRender();

    return () => {
      disposed = true;
      controlsApiRef.current = null;
      if (rafId !== 0) window.cancelAnimationFrame(rafId);

      resizeObserver.disconnect();
      controls.removeEventListener('change', scheduleRender);
      controls.dispose();

      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointerup', handlePointerUp);
      renderer.domElement.removeEventListener('dblclick', handleDoubleClick);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('pointerleave', handlePointerLeave);
      renderer.domElement.removeEventListener(
        'webglcontextlost',
        handleContextLost
      );
      renderer.domElement.removeEventListener(
        'webglcontextrestored',
        handleContextRestored
      );

      clearAtomicScene();
      disposeMacroArcs();
      gridGeom.dispose();
      gridMat.dispose();
      sharedDeckGeom.dispose();
      sharedTopPlateGeom.dispose();
      sharedEdgeGeom.dispose();
      sharedBaseFootGeom.dispose();
      platformVisuals.forEach((pv) => {
        pv.sideMat.dispose();
        pv.topMat.dispose();
        pv.edgeMat.dispose();
      });
      innerRingGeom.dispose();
      innerRingMat.dispose();
      outerRingGeom.dispose();
      outerRingMat.dispose();
      hoverRingGeom.dispose();
      hoverRingMat.dispose();
      sharedBodyGeom.dispose();
      sharedTopGeom.dispose();
      prismMap.forEach((pv) => {
        pv.bodyMat.dispose();
        pv.topMat.dispose();
      });

      envTarget.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Sync data & selection updates into Three.js
  useEffect(() => {
    controlsApiRef.current?.syncData();
  }, [blocks, matchedIds, selectedBlockId, selectedAtom, toggledSubtasks]);

  // Sync level transitions (macro <-> atomic)
  useEffect(() => {
    controlsApiRef.current?.syncLevel();
  }, [viewLevel, selectedBlockId]);

  // Sync theme updates
  useEffect(() => {
    controlsApiRef.current?.syncTheme();
  }, [theme]);

  // Sync overlay changes
  useEffect(() => {
    controlsApiRef.current?.syncOverlays();
  }, [showLabels, hoveredMacroBlock, hoveredAtomicInfo]);

  const selectedBlock =
    blocks.find((b) => b.id === selectedBlockId) ?? blocks[0];
  const blocksById = new Map(blocks.map((b) => [b.id, b]));
  const dependencyBlocks = selectedBlock.dependencies
    .map((id) => blocksById.get(id))
    .filter((b): b is ResolvedMap3DBlock => Boolean(b));

  const selectedDotColor =
    theme === 'dark'
      ? STATUS_META[selectedBlock.status].darkHex
      : STATUS_META[selectedBlock.status].lightHex;

  const hoverMacroDotColor = hoveredMacroBlock
    ? theme === 'dark'
      ? STATUS_META[hoveredMacroBlock.status].darkHex
      : STATUS_META[hoveredMacroBlock.status].lightHex
    : '#7C5CFC';

  const labeledMacroBlocks =
    viewLevel === 'macro' && showLabels
      ? blocks.filter(
          (b) =>
            matchedIds.has(b.id) &&
            (b.status === 'critico' ||
              b.status === 'atencao' ||
              b.id === 'player-offline' ||
              b.id === 'simulado-tri' ||
              b.id === 'cache-local')
        )
      : [];

  return (
    <div className="relative h-full w-full select-none overflow-hidden">
      {/* Dedicated isolated WebGL mount node */}
      <div ref={mountRef} className="h-full w-full" />

      {/* Projected Overlays (no backdrop-filter over WebGL) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* LEVEL 1: MACRO OVERLAYS */}
        {viewLevel === 'macro' && (
          <>
            {ISLANDS.map((island) => (
              <div
                key={island.id}
                ref={(el) => {
                  islandBadgeRefs.current[island.id] = el;
                }}
                className="absolute top-0 left-0 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1 font-mono text-[10px] font-semibold tracking-[0.08em] text-[var(--text-secondary)] uppercase shadow-xs will-change-transform"
                style={{ opacity: 0 }}
              >
                {island.label} (7)
              </div>
            ))}

            {showLabels &&
              labeledMacroBlocks.map((b) => {
                const dot =
                  theme === 'dark'
                    ? STATUS_META[b.status].darkHex
                    : STATUS_META[b.status].lightHex;
                return (
                  <div
                    key={b.id}
                    ref={(el) => {
                      microLabelRefs.current[b.id] = el;
                    }}
                    className="absolute top-0 left-0 flex items-center gap-1 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-primary)] shadow-xs will-change-transform"
                    style={{ opacity: 0 }}
                  >
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: dot }}
                    />
                    <span className="whitespace-nowrap">{b.name}</span>
                    <span className="font-mono text-[9px] text-[var(--text-muted)] tabular-nums">
                      {b.progress}%
                    </span>
                  </div>
                );
              })}

            {/* Selected Block Callout */}
            <div
              ref={calloutRef}
              className="absolute top-0 left-0 flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3.5 py-1.5 shadow-[var(--shadow-popover)] will-change-transform"
              style={{
                opacity: 0,
                borderColor: `${selectedDotColor}66`,
              }}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: selectedDotColor }}
              />
              <span className="whitespace-nowrap text-xs font-semibold text-[var(--text-primary)]">
                {selectedBlock.name}
              </span>
              <span className="font-mono text-xs font-semibold text-[var(--text-secondary)] tabular-nums">
                · {selectedBlock.progress}%
              </span>
            </div>

            {/* Hover Tooltip for all 28 macro prisms */}
            {hoveredMacroBlock && (
              <div
                ref={hoverTooltipRef}
                className="absolute top-0 left-0 z-20 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 py-2 shadow-[var(--shadow-popover)] will-change-transform"
                style={{
                  opacity: 0,
                  borderColor: `${hoverMacroDotColor}66`,
                }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: hoverMacroDotColor }}
                  />
                  <span className="whitespace-nowrap text-xs font-semibold text-[var(--text-primary)]">
                    {hoveredMacroBlock.name}
                  </span>
                  <span className="font-mono text-xs font-bold text-[var(--text-primary)] tabular-nums">
                    {hoveredMacroBlock.progress}%
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-3 font-mono text-[10px] text-[var(--text-muted)]">
                  <span className="uppercase">
                    {hoveredMacroBlock.islandLabel}
                  </span>
                  <span
                    style={{ color: hoverMacroDotColor }}
                    className="font-semibold"
                  >
                    {STATUS_META[hoveredMacroBlock.status].label} · Duplo clique
                    p/ explorar
                  </span>
                </div>
              </div>
            )}
          </>
        )}

        {/* LEVEL 2: ATOMIC DISSECTION OVERLAYS */}
        {viewLevel === 'atomic' && (
          <>
            {/* Center Core Badge */}
            <div
              ref={(el) => {
                atomicLabelRefs.current['core'] = el;
              }}
              className="absolute top-0 left-0 flex items-center gap-2 rounded-full border bg-[var(--bg-surface)] px-3.5 py-1.5 shadow-[var(--shadow-popover)] will-change-transform"
              style={{
                opacity: 0,
                borderColor: `${selectedDotColor}88`,
              }}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: selectedDotColor }}
              />
              <span className="whitespace-nowrap text-xs font-bold text-[var(--text-primary)]">
                {selectedBlock.name}
              </span>
              <span className="font-mono text-xs font-bold text-[var(--brand-primary)] tabular-nums">
                · {selectedBlock.progress}%
              </span>
            </div>

            {/* Subtask Node Micro-Labels */}
            {selectedBlock.subtasks.map((st, idx) => {
              const isDone = toggledSubtasks[st.id] ?? st.done;
              const isSel =
                selectedAtom.type === 'subtask' && selectedAtom.id === st.id;
              const dot = isDone
                ? theme === 'dark'
                  ? '#10B981'
                  : '#059669'
                : theme === 'dark'
                  ? '#7C5CFC'
                  : '#6747E6';
              const shortLabel =
                st.title.length > 26 ? `${st.title.slice(0, 24)}…` : st.title;
              return (
                <div
                  key={st.id}
                  ref={(el) => {
                    atomicLabelRefs.current[`subtask:${st.id}`] = el;
                  }}
                  className="absolute top-0 left-0 flex items-center gap-1.5 rounded-lg border bg-[var(--bg-surface)] px-2 py-1 text-[10px] font-medium text-[var(--text-primary)] shadow-xs will-change-transform"
                  style={{
                    opacity: 0,
                    borderColor: isSel ? dot : 'var(--border-subtle)',
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: dot }}
                  />
                  <span className="font-mono text-[9px] text-[var(--text-muted)]">
                    S{idx + 1}
                  </span>
                  <span className="whitespace-nowrap">{shortLabel}</span>
                </div>
              );
            })}

            {/* Dependency Node Labels */}
            {dependencyBlocks.map((dep) => {
              const dot =
                theme === 'dark'
                  ? STATUS_META[dep.status].darkHex
                  : STATUS_META[dep.status].lightHex;
              return (
                <div
                  key={dep.id}
                  ref={(el) => {
                    atomicLabelRefs.current[`dep:${dep.id}`] = el;
                  }}
                  className="absolute top-0 left-0 flex items-center gap-1.5 rounded-full border border-[var(--border-brand)]/55 bg-[var(--bg-surface)] px-2.5 py-1 text-[10px] font-semibold text-[var(--text-primary)] shadow-xs will-change-transform"
                  style={{ opacity: 0 }}
                >
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: dot }}
                  />
                  <span className="whitespace-nowrap">↗ {dep.name}</span>
                  <span className="font-mono text-[9px] text-[var(--text-muted)] tabular-nums">
                    {dep.progress}%
                  </span>
                </div>
              );
            })}

            {/* Risk Marker Labels */}
            {selectedBlock.risks.map((risk, idx) => {
              const rColor =
                risk.severity === 'alto'
                  ? '#F43F5E'
                  : risk.severity === 'medio'
                    ? '#F59E0B'
                    : '#10B981';
              return (
                <div
                  key={risk.id}
                  ref={(el) => {
                    atomicLabelRefs.current[`risk:${risk.id}`] = el;
                  }}
                  className="absolute top-0 left-0 flex items-center gap-1.5 rounded-md border bg-[var(--bg-surface)] px-2 py-0.5 font-mono text-[10px] font-semibold text-[var(--text-primary)] shadow-xs will-change-transform"
                  style={{
                    opacity: 0,
                    borderColor: `${rColor}70`,
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: rColor }}
                  />
                  <span className="whitespace-nowrap">Risco #{idx + 1}</span>
                </div>
              );
            })}

            {/* Atomic Hover Tooltip */}
            {hoveredAtomicInfo && (
              <div
                ref={hoverTooltipRef}
                className="absolute top-0 left-0 z-20 max-w-[260px] rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 py-2 shadow-[var(--shadow-popover)] will-change-transform"
                style={{
                  opacity: 0,
                  borderColor: `${hoveredAtomicInfo.dotColor}77`,
                }}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: hoveredAtomicInfo.dotColor }}
                  />
                  <span className="truncate text-xs font-semibold text-[var(--text-primary)]">
                    {hoveredAtomicInfo.title}
                  </span>
                </div>
                <p className="mt-0.5 font-mono text-[10px] text-[var(--text-muted)]">
                  {hoveredAtomicInfo.subtitle}
                </p>
                <p
                  className="mt-1 font-mono text-[10px] font-semibold"
                  style={{ color: hoveredAtomicInfo.dotColor }}
                >
                  {hoveredAtomicInfo.hint}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* WebGL context loss graceful message */}
      {contextLost && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-surface)]/95 p-6 text-center">
          <div className="max-w-sm rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              Restaurando visualização 3D
            </p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              O contexto gráfico foi pausado pelo navegador. Clique em Resetar
              vista se a cena não retornar automaticamente.
            </p>
          </div>
        </div>
      )}
    </div>
  );
});

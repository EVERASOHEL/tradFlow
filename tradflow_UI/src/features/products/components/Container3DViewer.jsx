import { useRef, useEffect, useState, useMemo } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

/**
 * Procedural texture generator for corrugated Corten steel container walls.
 */
function createCorrugatedWallTexture(is40ft, containerType = "20GP") {
  const canvas = document.createElement("canvas");
  canvas.width = is40ft ? 2048 : 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  // Base maritime industrial blue
  ctx.fillStyle = "#0369a1";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Vertical corrugated ribs (alternating light / dark bands)
  const ribWidth = 24;
  for (let x = 0; x < canvas.width; x += ribWidth * 2) {
    // Rib shadow
    const grad = ctx.createLinearGradient(x, 0, x + ribWidth * 2, 0);
    grad.addColorStop(0, "rgba(0, 0, 0, 0.35)");
    grad.addColorStop(0.3, "rgba(255, 255, 255, 0.18)");
    grad.addColorStop(0.7, "rgba(0, 0, 0, 0.15)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0.4)");
    ctx.fillStyle = grad;
    ctx.fillRect(x, 0, ribWidth * 2, canvas.height);
  }

  // Steel rivets / horizontal weld lines
  ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
  ctx.fillRect(0, 40, canvas.width, 3);
  ctx.fillRect(0, canvas.height - 40, canvas.width, 3);

  // Container Stencil Decal & Markings
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 32px 'Courier New', Courier, monospace";
  ctx.textAlign = "left";
  ctx.fillText(`TRADEFLOW LOGISTICS • ${containerType}`, 80, 80);

  ctx.font = "bold 20px 'Courier New', Courier, monospace";
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  ctx.fillText("ISO 6346 / CSC SAFETY APPROVED", 80, 115);
  ctx.fillText(is40ft ? "MAX GROSS: 30,480 KG | 67.7 CBM" : "MAX GROSS: 30,480 KG | 33.2 CBM", 80, 145);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Procedural texture generator for container marine plywood floor.
 */
function createPlywoodFloorTexture(is40ft) {
  const canvas = document.createElement("canvas");
  canvas.width = is40ft ? 1024 : 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  // Deep wood base
  ctx.fillStyle = "#9a744e";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Wood grain noise
  ctx.fillStyle = "rgba(60, 30, 10, 0.08)";
  for (let i = 0; i < canvas.height; i += 3) {
    ctx.fillRect(0, i, canvas.width, 1.5);
  }

  // Plank seams (lengthwise boards)
  const plankHeight = 64;
  ctx.strokeStyle = "rgba(40, 20, 5, 0.4)";
  ctx.lineWidth = 3;
  for (let y = 0; y < canvas.height; y += plankHeight) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();

    // Fastener / screw dots
    ctx.fillStyle = "rgba(30, 20, 10, 0.6)";
    for (let x = 40; x < canvas.width; x += 80) {
      ctx.beginPath();
      ctx.arc(x, y + 4, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(is40ft ? 4 : 2, 2);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Procedural texture generator for cardboard freight cartons inside the container.
 */
function createCargoStackTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  // Kraft Cardboard
  ctx.fillStyle = "#d4a373";
  ctx.fillRect(0, 0, 512, 512);

  // Carton grid outline
  ctx.strokeStyle = "#bc8a5f";
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, 512, 512);

  // Carton tape stripe
  ctx.fillStyle = "#b07d4b";
  ctx.fillRect(216, 0, 80, 512);

  // Shipping Label Badge
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(40, 60, 200, 140);
  ctx.strokeStyle = "#a27b5c";
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 60, 200, 140);

  ctx.fillStyle = "#1e3a8a";
  ctx.font = "bold 16px sans-serif";
  ctx.fillText("TRADEFLOW CARGO", 50, 85);

  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 12px monospace";
  ctx.fillText("CONSOLIDATED GOODS", 50, 110);
  ctx.fillText("FRAGILE • HANDLE WITH CARE", 50, 130);

  // Barcode
  ctx.fillStyle = "#000000";
  for (let x = 50; x < 230; x += 6) {
    const barW = Math.random() > 0.4 ? 3 : 1.5;
    ctx.fillRect(x, 145, barW, 40);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export default function Container3DViewer({
  totalCbm = 20.4289,
  totalWeightKg = 267.76,
  totalBoxes = 12.3,
  totalPieces = 390,
  defaultContainer = "20FT",
  viewerHeight = "380px",
  onClose,
}) {
  const mountRef = useRef(null);
  const [containerType, setContainerType] = useState(defaultContainer || "20FT");
  const [isXray, setIsXray] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);

  // 1. Container Specs Constants
  const specs = useMemo(() => {
    if (containerType === "40FT") {
      return {
        name: "40 ft Standard Container (40GP)",
        typeTag: "40GP",
        length: 12.03, // internal meters
        width: 2.35,
        height: 2.39,
        maxCbm: 67.7,
        usableCbm: 58.0,
        maxPayloadKg: 28750,
        tareKg: 3750,
      };
    }
    // Default: 20FT
    return {
      name: "20 ft Standard Container (20GP)",
      typeTag: "20GP",
      length: 5.90, // internal meters
      width: 2.35,
      height: 2.39,
      maxCbm: 33.2,
      usableCbm: 29.0,
      maxPayloadKg: 28200,
      tareKg: 2300,
    };
  }, [containerType]);

  // 2. Metrics & Space Calculations
  const safeCbm = Math.max(0, Number(totalCbm) || 0);
  const safeWeight = Math.max(0, Number(totalWeightKg) || 0);

  const cbmPercent = Math.min(100, (safeCbm / specs.usableCbm) * 100);
  const remainingCbm = Math.max(0, specs.usableCbm - safeCbm);
  const weightPercent = Math.min(100, (safeWeight / specs.maxPayloadKg) * 100);
  const remainingWeight = Math.max(0, specs.maxPayloadKg - safeWeight);

  // 3. Three.js Scene Setup & Re-render on containerType / isXray / autoRotate change
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 380;

    // A. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0f172a"); // Deep space navy

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    // Position camera near rear open doors looking slightly down & into container
    const is40ft = containerType === "40FT";
    camera.position.set(specs.length * 0.85, specs.height * 1.6, specs.width * 2.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.target.set(0, specs.height * 0.4, 0);
    controls.minDistance = 3;
    controls.maxDistance = is40ft ? 35 : 22;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.0;

    // B. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.2);
    sunLight.position.set(specs.length, 12, specs.width * 2);
    sunLight.castShadow = true;
    scene.add(sunLight);

    const rearLight = new THREE.DirectionalLight(0x93c5fd, 1.0);
    rearLight.position.set(-specs.length, 6, -specs.width * 2);
    scene.add(rearLight);

    // Interior Container Spot / Point Light
    const interiorLight = new THREE.PointLight(0xffedd5, 1.6, specs.length * 1.5);
    interiorLight.position.set(0, specs.height * 0.9, 0);
    scene.add(interiorLight);

    // C. Ground Grid & Shadows
    const gridHelper = new THREE.GridHelper(is40ft ? 24 : 14, is40ft ? 24 : 14, 0x334155, 0x1e293b);
    gridHelper.position.y = -0.05;
    scene.add(gridHelper);

    // D. Container Dimensions (Centered around origin)
    const cL = specs.length;
    const cW = specs.width;
    const cH = specs.height;

    // Container Group
    const containerGroup = new THREE.Group();
    scene.add(containerGroup);

    // Textures
    const wallTexture = createCorrugatedWallTexture(is40ft, specs.typeTag);
    const floorTexture = createPlywoodFloorTexture(is40ft);
    const cargoTexture = createCargoStackTexture();

    // Materials
    const steelMaterial = new THREE.MeshStandardMaterial({
      color: "#0369a1",
      map: wallTexture,
      roughness: 0.45,
      metalness: 0.35,
      transparent: isXray,
      opacity: isXray ? 0.3 : 1.0,
      side: THREE.DoubleSide,
    });

    const frameSteelMaterial = new THREE.MeshStandardMaterial({
      color: "#1e293b",
      roughness: 0.3,
      metalness: 0.6,
    });

    const floorMaterial = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.8,
      metalness: 0.05,
    });

    // 1. Wood Floor Deck
    const floorGeo = new THREE.BoxGeometry(cL, 0.06, cW);
    const floorMesh = new THREE.Mesh(floorGeo, floorMaterial);
    floorMesh.position.set(0, 0.03, 0);
    floorMesh.receiveShadow = true;
    containerGroup.add(floorMesh);

    // 2. Container Roof
    const roofGeo = new THREE.PlaneGeometry(cL, cW);
    const roofMesh = new THREE.Mesh(roofGeo, steelMaterial);
    roofMesh.rotation.x = Math.PI / 2;
    roofMesh.position.set(0, cH, 0);
    containerGroup.add(roofMesh);

    // 3. Left Wall (Z = -cW / 2)
    const sideGeo = new THREE.PlaneGeometry(cL, cH);
    const leftWall = new THREE.Mesh(sideGeo, steelMaterial);
    leftWall.position.set(0, cH / 2, -cW / 2);
    containerGroup.add(leftWall);

    // 4. Right Wall (Z = cW / 2)
    const rightWall = new THREE.Mesh(sideGeo, steelMaterial);
    rightWall.rotation.y = Math.PI;
    rightWall.position.set(0, cH / 2, cW / 2);
    containerGroup.add(rightWall);

    // 5. Front Wall (X = -cL / 2)
    const endGeo = new THREE.PlaneGeometry(cW, cH);
    const frontWall = new THREE.Mesh(endGeo, steelMaterial);
    frontWall.rotation.y = Math.PI / 2;
    frontWall.position.set(-cL / 2, cH / 2, 0);
    containerGroup.add(frontWall);

    // 6. Rear Open Doors (X = cL / 2) - Swung open 110 degrees
    const doorGeo = new THREE.BoxGeometry(0.05, cH, cW / 2);
    const leftDoor = new THREE.Mesh(doorGeo, frameSteelMaterial);
    leftDoor.position.set(cL / 2 + 0.3, cH / 2, -cW / 2 - 0.3);
    leftDoor.rotation.y = -Math.PI / 3;
    containerGroup.add(leftDoor);

    const rightDoor = new THREE.Mesh(doorGeo, frameSteelMaterial);
    rightDoor.position.set(cL / 2 + 0.3, cH / 2, cW / 2 + 0.3);
    rightDoor.rotation.y = Math.PI / 3;
    containerGroup.add(rightDoor);

    // 7. Structural Frame Corner Posts & Rails
    const postGeo = new THREE.BoxGeometry(0.14, cH + 0.1, 0.14);
    const postPositions = [
      [-cL / 2, (cH + 0.1) / 2, -cW / 2],
      [-cL / 2, (cH + 0.1) / 2, cW / 2],
      [cL / 2, (cH + 0.1) / 2, -cW / 2],
      [cL / 2, (cH + 0.1) / 2, cW / 2],
    ];
    postPositions.forEach(([px, py, pz]) => {
      const post = new THREE.Mesh(postGeo, frameSteelMaterial);
      post.position.set(px, py, pz);
      containerGroup.add(post);
    });

    // Outer Bounding Frame Wireframe
    const boxFrameGeo = new THREE.BoxGeometry(cL, cH, cW);
    const edgesGeo = new THREE.EdgesGeometry(boxFrameGeo);
    const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 });
    const wireframe = new THREE.LineSegments(edgesGeo, edgesMaterial);
    wireframe.position.set(0, cH / 2, 0);
    containerGroup.add(wireframe);

    // E. Consolidated Cargo Geometry
    if (safeCbm > 0) {
      // Calculate filled volume proportion
      const fillRatio = Math.min(1.0, safeCbm / specs.usableCbm);
      const cargoLength = Math.max(0.4, fillRatio * cL);
      const cargoWidth = cW * 0.94;
      const cargoHeight = Math.min(cH * 0.92, cH * Math.max(0.4, fillRatio > 0.6 ? 0.92 : fillRatio * 1.3));

      const cargoGeo = new THREE.BoxGeometry(cargoLength, cargoHeight, cargoWidth);
      const cargoMat = new THREE.MeshStandardMaterial({
        map: cargoTexture,
        roughness: 0.7,
        metalness: 0.1,
      });

      const cargoMesh = new THREE.Mesh(cargoGeo, cargoMat);
      // Position against the front wall of the container
      const cargoX = -cL / 2 + cargoLength / 2;
      const cargoY = 0.06 + cargoHeight / 2;
      cargoMesh.position.set(cargoX, cargoY, 0);
      cargoMesh.castShadow = true;
      cargoMesh.receiveShadow = true;
      containerGroup.add(cargoMesh);

      // Cargo Outline (Emerald Green)
      const cargoEdges = new THREE.EdgesGeometry(cargoGeo);
      const cargoEdgeMat = new THREE.LineBasicMaterial({ color: 0x10b981, linewidth: 2.5 });
      const cargoWire = new THREE.LineSegments(cargoEdges, cargoEdgeMat);
      cargoWire.position.copy(cargoMesh.position);
      containerGroup.add(cargoWire);

      // Empty Space Remaining Wireframe (Sky Blue Dashed)
      if (fillRatio < 0.98) {
        const remainingLength = cL - cargoLength;
        const emptyGeo = new THREE.BoxGeometry(remainingLength, cH * 0.95, cW * 0.96);
        const emptyEdges = new THREE.EdgesGeometry(emptyGeo);
        const emptyWire = new THREE.LineSegments(
          emptyEdges,
          new THREE.LineDashedMaterial({ color: 0x64748b, dashSize: 0.3, gapSize: 0.2 })
        );
        emptyWire.computeLineDistances();
        emptyWire.position.set(cL / 2 - remainingLength / 2, 0.06 + (cH * 0.95) / 2, 0);
        containerGroup.add(emptyWire);
      }
    }

    // Animation Loop
    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize Observer
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      wallTexture.dispose();
      floorTexture.dispose();
      cargoTexture.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [containerType, specs, safeCbm, safeWeight, isXray, autoRotate]);

  return (
    <div
      style={{
        background: "#0f172a",
        borderRadius: "10px",
        border: "1.5px solid #1e293b",
        padding: "12px 14px",
        marginBottom: "14px",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
        color: "#ffffff",
      }}
    >
      {/* Top Header: Title, Container Selector & Action Controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
          paddingBottom: "10px",
          borderBottom: "1px solid #334155",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "20px" }}>🚢</span>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <strong style={{ fontSize: "13px", color: "#f8fafc" }}>
                3D Shipping Container Space Utilization View
              </strong>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  background: "#0284c7",
                  color: "#ffffff",
                  padding: "1px 6px",
                  borderRadius: "4px",
                }}
              >
                {specs.typeTag}
              </span>
            </div>
            <span style={{ fontSize: "11px", color: "#94a3b8" }}>
              Interactive 3D stowage simulation inside ocean freight container
            </span>
          </div>
        </div>

        {/* 20FT vs 40FT Container Selection Tabs */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#1e293b", padding: "3px", borderRadius: "8px" }}>
          <button
            type="button"
            onClick={() => setContainerType("20FT")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 12px",
              fontSize: "11.5px",
              fontWeight: 700,
              borderRadius: "6px",
              border: "none",
              background: containerType === "20FT" ? "#0284c7" : "transparent",
              color: containerType === "20FT" ? "#ffffff" : "#94a3b8",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <span>🚢</span>
            <span>20 ft Container (33.2 m³)</span>
          </button>
          <button
            type="button"
            onClick={() => setContainerType("40FT")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 12px",
              fontSize: "11.5px",
              fontWeight: 700,
              borderRadius: "6px",
              border: "none",
              background: containerType === "40FT" ? "#0284c7" : "transparent",
              color: containerType === "40FT" ? "#ffffff" : "#94a3b8",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <span>🚢</span>
            <span>40 ft Container (67.7 m³)</span>
          </button>
        </div>

        {/* Control Buttons & Close */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            type="button"
            onClick={() => setIsXray(!isXray)}
            style={{
              background: isXray ? "#2563eb" : "#1e293b",
              border: "1px solid #334155",
              color: "#f8fafc",
              padding: "4px 8px",
              fontSize: "11px",
              fontWeight: 600,
              borderRadius: "5px",
              cursor: "pointer",
            }}
            title="Toggle semi-transparent container walls to inspect inside"
          >
            {isXray ? "👁️ Solid Walls" : "👀 X-Ray Walls"}
          </button>
          <button
            type="button"
            onClick={() => setAutoRotate(!autoRotate)}
            style={{
              background: autoRotate ? "#2563eb" : "#1e293b",
              border: "1px solid #334155",
              color: "#f8fafc",
              padding: "4px 8px",
              fontSize: "11px",
              fontWeight: 600,
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            {autoRotate ? "⏸️ Pause" : "🔄 360° Rotate"}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                fontSize: "18px",
                cursor: "pointer",
                padding: "2px 6px",
                lineHeight: 1,
              }}
              title="Close 3D viewer"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Real-time Space Utilization Dashboard Bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "10px",
          padding: "10px 0",
          borderBottom: "1px solid #1e293b",
        }}
      >
        {/* CBM Space Utilization Meter */}
        <div style={{ background: "#1e293b", padding: "8px 12px", borderRadius: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
            <span style={{ color: "#94a3b8" }}>CBM Volume Space Taken:</span>
            <strong style={{ color: cbmPercent > 90 ? "#ef4444" : "#38bdf8", fontFamily: "monospace" }}>
              {cbmPercent.toFixed(1)}% ({safeCbm.toFixed(3)} m³)
            </strong>
          </div>
          {/* Progress Bar */}
          <div style={{ height: "6px", background: "#334155", borderRadius: "3px", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${Math.min(100, cbmPercent)}%`,
                background: cbmPercent > 90 ? "#ef4444" : cbmPercent > 70 ? "#f59e0b" : "#10b981",
                transition: "width 0.3s ease",
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#64748b", marginTop: "4px" }}>
            <span>Capacity: {specs.usableCbm} m³ usable</span>
            <span style={{ color: "#10b981" }}>{remainingCbm.toFixed(2)} m³ Remaining Free</span>
          </div>
        </div>

        {/* Cargo Weight Utilization Meter */}
        <div style={{ background: "#1e293b", padding: "8px 12px", borderRadius: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
            <span style={{ color: "#94a3b8" }}>Weight Capacity:</span>
            <strong style={{ color: "#f59e0b", fontFamily: "monospace" }}>
              {weightPercent.toFixed(1)}% ({safeWeight.toFixed(1)} kg)
            </strong>
          </div>
          {/* Progress Bar */}
          <div style={{ height: "6px", background: "#334155", borderRadius: "3px", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${Math.min(100, weightPercent)}%`,
                background: "#f59e0b",
                transition: "width 0.3s ease",
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#64748b", marginTop: "4px" }}>
            <span>Max Payload: {specs.maxPayloadKg.toLocaleString()} kg</span>
            <span style={{ color: "#38bdf8" }}>{remainingWeight.toLocaleString()} kg Free</span>
          </div>
        </div>

        {/* Consolidated Goods Summary */}
        <div style={{ background: "#1e293b", padding: "8px 12px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "space-around" }}>
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: "10px", color: "#94a3b8", display: "block" }}>Total Cartons</span>
            <strong style={{ fontSize: "14px", color: "#38bdf8", fontFamily: "monospace" }}>{Number(totalBoxes).toFixed(1)} Boxes</strong>
          </div>
          <div style={{ width: "1px", height: "24px", background: "#334155" }} />
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: "10px", color: "#94a3b8", display: "block" }}>Purchased Units</span>
            <strong style={{ fontSize: "14px", color: "#10b981", fontFamily: "monospace" }}>{totalPieces} Pieces</strong>
          </div>
        </div>
      </div>

      {/* 3D Canvas Mount */}
      <div
        ref={mountRef}
        style={{
          width: "100%",
          height: viewerHeight,
          position: "relative",
          borderRadius: "8px",
          overflow: "hidden",
          marginTop: "10px",
          cursor: "grab",
        }}
      />

      {/* Bottom 3D Help / Legend */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
          marginTop: "8px",
          fontSize: "11px",
          color: "#64748b",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: "10px", height: "10px", background: "#10b981", borderRadius: "2px" }} />
            <strong style={{ color: "#cbd5e1" }}>Green Box:</strong> Your Consolidated Cargo
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: "10px", height: "10px", border: "1px dashed #38bdf8", borderRadius: "2px" }} />
            <strong style={{ color: "#cbd5e1" }}>Wireframe:</strong> Empty / Available Container Space
          </span>
        </div>
        <div>
          <span>🖱️ Left-click + Drag to rotate | Scroll to zoom | Right-click to pan</span>
        </div>
      </div>
    </div>
  );
}


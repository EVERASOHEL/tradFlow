import { useRef, useEffect, useState, useMemo } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

/**
 * Creates dynamic canvas textures for cardboard carton sides.
 * Generates realistic Kraft cardboard, packing tape, and shipping labels with zero external assets.
 */
function createCardboardTexture({ type, productCode, productName, piecesPerBox, length, width, height, grossWeight, weightUnit }) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  // Base Kraft cardboard color with subtle texture
  ctx.fillStyle = "#cfa473";
  ctx.fillRect(0, 0, 512, 512);

  // Subtle cardboard fiber noise
  ctx.fillStyle = "rgba(0, 0, 0, 0.03)";
  for (let i = 0; i < 512; i += 4) {
    ctx.fillRect(0, i, 512, 1);
  }

  // Border crease shading
  ctx.strokeStyle = "rgba(100, 60, 20, 0.25)";
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, 506, 506);

  if (type === "top" || type === "bottom") {
    // Center packing tape
    ctx.fillStyle = "#ab7d4d";
    ctx.fillRect(216, 0, 80, 512);

    // Tape edge highlights and seam
    ctx.strokeStyle = "rgba(60, 30, 10, 0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(216, 0); ctx.lineTo(216, 512);
    ctx.moveTo(296, 0); ctx.lineTo(296, 512);
    ctx.moveTo(256, 0); ctx.lineTo(256, 512);
    ctx.stroke();

    // Subtle tape reflection
    ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
    ctx.fillRect(222, 0, 16, 512);
  } else if (type === "front") {
    // Shipping Mark Label Sticker
    ctx.fillStyle = "#faf6ed";
    ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
    ctx.shadowBlur = 8;
    ctx.fillRect(40, 50, 432, 412);
    ctx.shadowBlur = 0;

    ctx.strokeStyle = "#bfa482";
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 50, 432, 412);

    // Label Header
    ctx.fillStyle = "#1e3a8a";
    ctx.fillRect(40, 50, 432, 44);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("TRADEFLOW CARGO LOGISTICS", 256, 80);

    // Destination / Import Mark
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 16px monospace";
    ctx.textAlign = "left";
    ctx.fillText("IMPORT CONSIGNMENT: CN-LCL-EXP", 60, 125);

    // Product Code & Description
    ctx.font = "bold 22px monospace";
    ctx.fillStyle = "#1e40af";
    ctx.fillText(productCode || "PROD-ITEM-EXP", 60, 165);

    ctx.font = "14px -apple-system, sans-serif";
    ctx.fillStyle = "#475569";
    const displayName = (productName || "Factory Electrical Components").slice(0, 32);
    ctx.fillText(displayName, 60, 192);

    // Packaging Specs Divider
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(60, 212);
    ctx.lineTo(452, 212);
    ctx.stroke();

    // Key Shipping Stats
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 16px -apple-system, sans-serif";
    ctx.fillText(`QTY: ${piecesPerBox || 1} PCS / CARTON`, 60, 245);
    ctx.fillText(`G.W.: ${grossWeight || "—"} ${weightUnit || "KG"}`, 60, 275);
    ctx.fillText(`DIM: ${length || 0} × ${width || 0} × ${height || 0} CM`, 60, 305);

    // Barcode Simulation
    ctx.fillStyle = "#0f172a";
    const startX = 60;
    const barY = 335;
    const barH = 50;
    const pattern = [4, 2, 6, 2, 3, 5, 2, 4, 6, 2, 4, 3, 5, 2, 6, 4, 2, 3, 5, 2, 4, 6, 3, 2, 5, 4, 2];
    let currX = startX;
    pattern.forEach((w, idx) => {
      if (idx % 2 === 0) {
        ctx.fillRect(currX, barY, w, barH);
      }
      currX += w + 2;
    });

    ctx.font = "11px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`* (01) 890429 ${productCode ? productCode.slice(-6) : "001"} (30) ${piecesPerBox || 1} *`, 256, 405);

    // International Logistics Icons: This Way Up & Fragile
    ctx.font = "32px sans-serif";
    ctx.fillText("⬆️", 370, 255);
    ctx.fillText("⬆️", 415, 255);
    ctx.fillText("🍷", 390, 305);
    ctx.fillText("☂️", 430, 305);
  } else if (type === "side") {
    // Side Stencils
    ctx.fillStyle = "#5c3d1e";
    ctx.font = "bold 32px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("⬆️  ⬆️", 256, 120);

    ctx.font = "bold 18px monospace";
    ctx.fillText("THIS WAY UP", 256, 155);

    ctx.font = "bold 36px sans-serif";
    ctx.fillText("🍷   ☂️", 256, 230);

    ctx.font = "bold 14px monospace";
    ctx.fillText("HANDLE WITH CARE / KEEP DRY", 256, 265);

    ctx.strokeStyle = "#8c6239";
    ctx.lineWidth = 2;
    ctx.strokeRect(60, 310, 392, 140);

    ctx.textAlign = "left";
    ctx.font = "bold 15px monospace";
    ctx.fillText(`QTY : ${piecesPerBox || 1} PCS`, 80, 345);
    ctx.fillText(`G.W.: ${grossWeight || "—"} ${weightUnit || "KG"}`, 80, 380);
    ctx.fillText(`SIZE: ${length || 0}×${width || 0}×${height || 0} CM`, 80, 415);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Computes an optimal 3D grid layout (nx * ny * nz = piecesPerBox)
 * that best matches the box aspect ratio (L, H, W).
 */
function computePackingGrid(totalPieces, length, height, width) {
  const N = Math.max(1, Math.round(totalPieces || 1));
  if (N === 1) return { nx: 1, ny: 1, nz: 1 };

  const L = Math.max(1, Number(length) || 40);
  const H = Math.max(1, Number(height) || 25);
  const W = Math.max(1, Number(width) || 30);

  let bestGrid = { nx: N, ny: 1, nz: 1 };
  let minDiff = Infinity;

  // Find factors of N or closest factors up to N
  for (let ny = 1; ny <= Math.min(N, 6); ny++) {
    for (let nx = 1; nx <= N; nx++) {
      if ((N % (ny * nx)) === 0) {
        const nz = N / (ny * nx);
        // Piece dimensions with this grid
        const pl = L / nx;
        const ph = H / ny;
        const pw = W / nz;

        // Score based on reasonable piece aspect ratio
        const avg = (pl + ph + pw) / 3;
        const variance = Math.pow(pl - avg, 2) + Math.pow(ph - avg, 2) + Math.pow(pw - avg, 2);

        if (variance < minDiff) {
          minDiff = variance;
          bestGrid = { nx, ny, nz };
        }
      }
    }
  }

  return bestGrid;
}

export default function Packaging3DViewer({
  length = 42,
  width = 32,
  height = 26,
  dimensionUnit = "cm",
  piecesPerBox = 50,
  boxGrossWeight = 18.5,
  weightUnit = "kg",
  productCode = "VEX-CJX2-1210",
  productName = "AC Contactor",
  viewerHeight = "340px",
  showControls = true,
  showMetrics = true,
}) {
  const mountRef = useRef(null);
  const [isXray, setIsXray] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);

  // Parse safe numeric dimensions
  const numL = Math.max(1, Number(length) || 42);
  const numW = Math.max(1, Number(width) || 32);
  const numH = Math.max(1, Number(height) || 26);
  const numPieces = Math.max(1, Number(piecesPerBox) || 1);
  const numWeight = Number(boxGrossWeight) || 0;

  // Real Logistics Calculations
  const cbm = useMemo(() => {
    return (numL * numW * numH) / 1000000;
  }, [numL, numW, numH]);

  const cbmPerPiece = useMemo(() => {
    return numPieces > 0 ? cbm / numPieces : 0;
  }, [cbm, numPieces]);

  const boxesPerCbm = useMemo(() => {
    return cbm > 0 ? Math.floor(1 / cbm) : 0;
  }, [cbm]);

  const fit20ft = useMemo(() => {
    // Standard 20ft container has ~28-30 usable CBM
    return cbm > 0 ? Math.floor(29 / cbm) : 0;
  }, [cbm]);

  const fit40hq = useMemo(() => {
    // Standard 40ft HQ container has ~65-68 usable CBM
    return cbm > 0 ? Math.floor(66 / cbm) : 0;
  }, [cbm]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 340;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(2.8, 2.3, 3.2);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // 3. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 8;
    controls.minDistance = 1.2;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 2.0;

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xfff5e6, 1.8);
    dirLight1.position.set(4, 6, 4);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 1024;
    dirLight1.shadow.mapSize.height = 1024;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xe0f2fe, 0.8);
    dirLight2.position.set(-4, -2, -4);
    scene.add(dirLight2);

    // Soft Floor Shadow Plane
    const shadowPlaneGeo = new THREE.PlaneGeometry(8, 8);
    const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.15 });
    const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -1.0;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // Subtle Base Grid Guide
    const gridHelper = new THREE.GridHelper(6, 12, 0xcbd5e1, 0xe2e8f0);
    gridHelper.position.y = -1.001;
    scene.add(gridHelper);

    // 5. Normalized Dimensions
    // Max dimension scales to 1.8 units
    const maxDim = Math.max(numL, numW, numH, 1);
    const boxX = (numL / maxDim) * 1.8; // Length
    const boxY = (numH / maxDim) * 1.8; // Height
    const boxZ = (numW / maxDim) * 1.8; // Width

    // Center box on top of the floor
    const boxCenterY = -1.0 + boxY / 2;

    // 6. Textures for the 6 faces
    const texFront = createCardboardTexture({ type: "front", productCode, productName, piecesPerBox: numPieces, length: numL, width: numW, height: numH, grossWeight: numWeight, weightUnit });
    const texSide = createCardboardTexture({ type: "side", productCode, productName, piecesPerBox: numPieces, length: numL, width: numW, height: numH, grossWeight: numWeight, weightUnit });
    const texTop = createCardboardTexture({ type: "top", productCode, productName, piecesPerBox: numPieces, length: numL, width: numW, height: numH, grossWeight: numWeight, weightUnit });
    const texBottom = createCardboardTexture({ type: "bottom", productCode, productName, piecesPerBox: numPieces, length: numL, width: numW, height: numH, grossWeight: numWeight, weightUnit });

    // Materials order in BoxGeometry: [+X, -X, +Y, -Y, +Z, -Z] (Right, Left, Top, Bottom, Front, Back)
    const materials = [
      new THREE.MeshStandardMaterial({ map: texSide, roughness: 0.85, metalness: 0.05, transparent: isXray, opacity: isXray ? 0.32 : 1.0 }),
      new THREE.MeshStandardMaterial({ map: texSide, roughness: 0.85, metalness: 0.05, transparent: isXray, opacity: isXray ? 0.32 : 1.0 }),
      new THREE.MeshStandardMaterial({ map: texTop, roughness: 0.85, metalness: 0.05, transparent: isXray, opacity: isXray ? 0.25 : 1.0 }),
      new THREE.MeshStandardMaterial({ map: texBottom, roughness: 0.85, metalness: 0.05, transparent: isXray, opacity: isXray ? 0.32 : 1.0 }),
      new THREE.MeshStandardMaterial({ map: texFront, roughness: 0.85, metalness: 0.05, transparent: isXray, opacity: isXray ? 0.32 : 1.0 }),
      new THREE.MeshStandardMaterial({ map: texFront, roughness: 0.85, metalness: 0.05, transparent: isXray, opacity: isXray ? 0.32 : 1.0 }),
    ];

    const boxGeo = new THREE.BoxGeometry(boxX, boxY, boxZ);
    const boxMesh = new THREE.Mesh(boxGeo, materials);
    boxMesh.position.set(0, boxCenterY, 0);
    boxMesh.castShadow = !isXray;
    boxMesh.receiveShadow = true;
    scene.add(boxMesh);

    // Box Edge Wireframe
    const edgesGeo = new THREE.EdgesGeometry(boxGeo);
    const edgesMat = new THREE.LineBasicMaterial({
      color: isXray ? 0x2563eb : 0x854d0e,
      linewidth: 2,
    });
    const edgesMesh = new THREE.LineSegments(edgesGeo, edgesMat);
    boxMesh.add(edgesMesh);

    // 7. Internal Packed Items Visualization (X-Ray Mode)
    const itemsGroup = new THREE.Group();
    if (isXray && numPieces > 0) {
      const { nx, ny, nz } = computePackingGrid(numPieces, numL, numH, numW);
      const gap = 0.012;

      const pieceW = (boxX - (nx + 1) * gap) / nx;
      const pieceH = (boxY - (ny + 1) * gap) / ny;
      const pieceD = (boxZ - (nz + 1) * gap) / nz;

      const pieceGeo = new THREE.BoxGeometry(pieceW, pieceH, pieceD);
      const pieceMat = new THREE.MeshStandardMaterial({
        color: 0x2563eb,
        roughness: 0.3,
        metalness: 0.4,
        emissive: 0x1e3a8a,
        emissiveIntensity: 0.15,
      });

      const pieceEdgesGeo = new THREE.EdgesGeometry(pieceGeo);
      const pieceEdgesMat = new THREE.LineBasicMaterial({ color: 0x93c5fd });

      let count = 0;
      for (let iy = 0; iy < ny; iy++) {
        for (let iz = 0; iz < nz; iz++) {
          for (let ix = 0; ix < nx; ix++) {
            if (count >= numPieces) break;

            const px = -boxX / 2 + gap + pieceW / 2 + ix * (pieceW + gap);
            const py = -boxY / 2 + gap + pieceH / 2 + iy * (pieceH + gap);
            const pz = -boxZ / 2 + gap + pieceD / 2 + iz * (pieceD + gap);

            const pMesh = new THREE.Mesh(pieceGeo, pieceMat);
            pMesh.position.set(px, py, pz);

            const pEdges = new THREE.LineSegments(pieceEdgesGeo, pieceEdgesMat);
            pMesh.add(pEdges);

            itemsGroup.add(pMesh);
            count++;
          }
        }
      }
      boxMesh.add(itemsGroup);
    }

    // 8. 3D Dimension Guides (Arrows & Lines)
    const dimGroup = new THREE.Group();
    if (showDimensions) {
      const dimMat = new THREE.LineBasicMaterial({ color: 0x0284c7 });
      const offset = 0.15;

      // Length Dimension (along X at the front bottom)
      const lPoints = [
        new THREE.Vector3(-boxX / 2, boxCenterY - boxY / 2 - offset, boxZ / 2 + offset),
        new THREE.Vector3(boxX / 2, boxCenterY - boxY / 2 - offset, boxZ / 2 + offset),
      ];
      const lGeo = new THREE.BufferGeometry().setFromPoints(lPoints);
      dimGroup.add(new THREE.Line(lGeo, dimMat));

      // Width / Depth Dimension (along Z at the right bottom)
      const wPoints = [
        new THREE.Vector3(boxX / 2 + offset, boxCenterY - boxY / 2 - offset, -boxZ / 2),
        new THREE.Vector3(boxX / 2 + offset, boxCenterY - boxY / 2 - offset, boxZ / 2),
      ];
      const wGeo = new THREE.BufferGeometry().setFromPoints(wPoints);
      dimGroup.add(new THREE.Line(wGeo, dimMat));

      // Height Dimension (along Y at the front right corner)
      const hPoints = [
        new THREE.Vector3(boxX / 2 + offset, boxCenterY - boxY / 2, boxZ / 2 + offset),
        new THREE.Vector3(boxX / 2 + offset, boxCenterY + boxY / 2, boxZ / 2 + offset),
      ];
      const hGeo = new THREE.BufferGeometry().setFromPoints(hPoints);
      dimGroup.add(new THREE.Line(hGeo, dimMat));

      scene.add(dimGroup);
    }

    // Animation Loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      controls.dispose();
      boxGeo.dispose();
      edgesGeo.dispose();
      materials.forEach((m) => {
        if (m.map) m.map.dispose();
        m.dispose();
      });
      edgesMat.dispose();
      shadowPlaneGeo.dispose();
      shadowPlaneMat.dispose();
      gridHelper.dispose();
      renderer.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [numL, numW, numH, numPieces, numWeight, weightUnit, productCode, productName, isXray, autoRotate, showDimensions]);

  const handleResetCamera = () => {
    setAutoRotate(false);
    setIsXray(false);
  };

  return (
    <div className="packaging-3d-wrapper" style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
      {/* 3D Viewport View with Interactive Toolbar */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: viewerHeight,
          background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
          borderRadius: "8px",
          border: "1px solid #cbd5e1",
          overflow: "hidden",
          boxShadow: "inset 0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        {/* Three.js Canvas Container */}
        <div ref={mountRef} style={{ width: "100%", height: "100%" }} />

        {/* Floating 3D Dimension Callout Badges */}
        {showDimensions && (
          <div
            style={{
              position: "absolute",
              top: "10px",
              left: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              pointerEvents: "none",
            }}
          >
            <span style={{ fontSize: "11px", fontWeight: 700, background: "rgba(255,255,255,0.9)", padding: "2px 8px", borderRadius: "4px", border: "1px solid #bfdbfe", color: "#1e40af" }}>
              L (Length): <strong>{numL} {dimensionUnit}</strong>
            </span>
            <span style={{ fontSize: "11px", fontWeight: 700, background: "rgba(255,255,255,0.9)", padding: "2px 8px", borderRadius: "4px", border: "1px solid #bfdbfe", color: "#1e40af" }}>
              W (Width): <strong>{numW} {dimensionUnit}</strong>
            </span>
            <span style={{ fontSize: "11px", fontWeight: 700, background: "rgba(255,255,255,0.9)", padding: "2px 8px", borderRadius: "4px", border: "1px solid #bfdbfe", color: "#1e40af" }}>
              H (Height): <strong>{numH} {dimensionUnit}</strong>
            </span>
          </div>
        )}

        {/* Viewport Control Strip */}
        {showControls && (
          <div
            style={{
              position: "absolute",
              bottom: "10px",
              left: "10px",
              right: "10px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
              pointerEvents: "auto",
            }}
          >
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                type="button"
                className={`pkg-toggle-btn ${!isXray ? "active" : ""}`}
                style={{ height: "26px", borderRadius: "4px", padding: "0 10px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "4px", background: !isXray ? "#2563eb" : "#ffffff", border: "1px solid #cbd5e1" }}
                onClick={() => setIsXray(false)}
                title="View outer sealed carton"
              >
                📦 Sealed Box
              </button>
              <button
                type="button"
                className={`pkg-toggle-btn ${isXray ? "active" : ""}`}
                style={{ height: "26px", borderRadius: "4px", padding: "0 10px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "4px", background: isXray ? "#2563eb" : "#ffffff", border: "1px solid #cbd5e1" }}
                onClick={() => setIsXray(true)}
                title="View interior packed pieces in 3D"
              >
                🔍 X-Ray ({numPieces} Pcs)
              </button>
            </div>

            <div style={{ display: "flex", gap: "6px" }}>
              <button
                type="button"
                style={{
                  height: "26px",
                  padding: "0 8px",
                  fontSize: "11px",
                  borderRadius: "4px",
                  border: "1px solid #cbd5e1",
                  background: autoRotate ? "#eff6ff" : "#ffffff",
                  color: autoRotate ? "#1d4ed8" : "#475569",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
                onClick={() => setAutoRotate(!autoRotate)}
                title="Toggle 360 rotation"
              >
                {autoRotate ? "⏸ Pause Spin" : "🔄 360° Spin"}
              </button>
              <button
                type="button"
                style={{
                  height: "26px",
                  padding: "0 8px",
                  fontSize: "11px",
                  borderRadius: "4px",
                  border: "1px solid #cbd5e1",
                  background: showDimensions ? "#eff6ff" : "#ffffff",
                  color: showDimensions ? "#1d4ed8" : "#475569",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
                onClick={() => setShowDimensions(!showDimensions)}
                title="Toggle Dimension Marks"
              >
                📐 Dimensions
              </button>
            </div>
          </div>
        )}

        <div style={{ position: "absolute", top: "10px", right: "12px", pointerEvents: "none" }}>
          <span style={{ fontSize: "10px", color: "#64748b", background: "rgba(255,255,255,0.8)", padding: "2px 6px", borderRadius: "4px", border: "1px solid #e2e8f0" }}>
            🖱 Drag to Rotate • Scroll to Zoom
          </span>
        </div>
      </div>

      {/* Logistics & Container Fit Analytics Strip */}
      {showMetrics && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: "8px",
            background: "#ffffff",
            padding: "10px 12px",
            borderRadius: "6px",
            border: "1px solid #e2e8f0",
          }}
        >
          <div>
            <span style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", fontWeight: 600, display: "block" }}>
              Carton Volume
            </span>
            <strong style={{ fontSize: "14px", color: "#0284c7", fontFamily: "monospace" }}>
              {cbm.toFixed(4)} CBM
            </strong>
          </div>

          <div>
            <span style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", fontWeight: 600, display: "block" }}>
              Volume / Piece
            </span>
            <strong style={{ fontSize: "14px", color: "#059669", fontFamily: "monospace" }}>
              {cbmPerPiece > 0 ? `${(cbmPerPiece * 1000).toFixed(2)} dm³` : "—"}
            </strong>
          </div>

          <div>
            <span style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", fontWeight: 600, display: "block" }}>
              Boxes / 1 CBM
            </span>
            <strong style={{ fontSize: "14px", color: "#7c3aed", fontFamily: "monospace" }}>
              ~{boxesPerCbm} Boxes
            </strong>
          </div>

          <div>
            <span style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", fontWeight: 600, display: "block" }}>
              20ft Container Fit
            </span>
            <strong style={{ fontSize: "13px", color: "#0f172a" }}>
              ~{fit20ft.toLocaleString()} Cartons
            </strong>
            <small style={{ fontSize: "10px", color: "#64748b", display: "block" }}>
              ({(fit20ft * numPieces).toLocaleString()} pcs)
            </small>
          </div>

          <div>
            <span style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", fontWeight: 600, display: "block" }}>
              40ft HQ Container
            </span>
            <strong style={{ fontSize: "13px", color: "#0f172a" }}>
              ~{fit40hq.toLocaleString()} Cartons
            </strong>
            <small style={{ fontSize: "10px", color: "#64748b", display: "block" }}>
              ({(fit40hq * numPieces).toLocaleString()} pcs)
            </small>
          </div>
        </div>
      )}
    </div>
  );
}


"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

const Spline = dynamic(() => import("@splinetool/react-spline"), {
  ssr: false,
  loading: () => null,
});

interface SplineOrbProps {
  riskTier: "SAFE" | "ELEVATED" | "CRITICAL";
  crashPercentage: number;
  nadirMgDl: number;
}

export default function SplineOrb({
  riskTier,
  crashPercentage,
  nadirMgDl,
}: SplineOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [useSpline, setUseSpline] = useState(false);

  // Dynamic Zed Green Palette
  const zedMint = "#00e599";
  const zedBright = "#00ffaa";
  const amberColor = "#f59e0b";
  const dangerRose = "#f43f5e";

  const currentColor =
    riskTier === "CRITICAL"
      ? dangerRose
      : riskTier === "ELEVATED"
      ? amberColor
      : zedMint;

  // 3D Organic Particle Canvas Simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth * window.devicePixelRatio || 400);
    let height = (canvas.height = canvas.offsetHeight * window.devicePixelRatio || 400);

    // Particle nodes on a 3D sphere surface
    const particleCount = 110;
    const particles: {
      theta: number;
      phi: number;
      radius: number;
      speed: number;
      size: number;
    }[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        theta: Math.random() * Math.PI * 2,
        phi: Math.acos(Math.random() * 2 - 1),
        radius: 125 + Math.random() * 25,
        speed: (Math.random() * 0.004 + 0.002) * (riskTier === "CRITICAL" ? 2.5 : 1),
        size: Math.random() * 2.2 + 1,
      });
    }

    let rotX = 0;
    let rotY = 0;
    let targetRotX = 0;
    let targetRotY = 0;

    const handlePointerMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      targetRotY = x * 0.8;
      targetRotX = -y * 0.8;
      setMousePos({ x: x * 15, y: y * 15 });
    };

    window.addEventListener("mousemove", handlePointerMove);

    let time = 0;

    const render = () => {
      time += 0.015 * (riskTier === "CRITICAL" ? 2.0 : 1.0);
      rotX += (targetRotX - rotX) * 0.05;
      rotY += (targetRotY - rotY) * 0.05;

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const fov = 320;

      // Draw Volumetric Radial Core Glow
      const corePulse = Math.sin(time * 2) * 6;
      const coreGrad = ctx.createRadialGradient(
        cx,
        cy,
        10,
        cx,
        cy,
        80 + corePulse
      );

      if (riskTier === "CRITICAL") {
        coreGrad.addColorStop(0, "rgba(244, 63, 94, 0.45)");
        coreGrad.addColorStop(0.5, "rgba(225, 29, 72, 0.2)");
        coreGrad.addColorStop(1, "rgba(244, 63, 94, 0)");
      } else if (riskTier === "ELEVATED") {
        coreGrad.addColorStop(0, "rgba(245, 158, 11, 0.4)");
        coreGrad.addColorStop(0.5, "rgba(217, 119, 6, 0.15)");
        coreGrad.addColorStop(1, "rgba(245, 158, 11, 0)");
      } else {
        // Zed Green Radiant Glow
        coreGrad.addColorStop(0, "rgba(0, 229, 153, 0.45)");
        coreGrad.addColorStop(0.5, "rgba(0, 255, 170, 0.18)");
        coreGrad.addColorStop(1, "rgba(0, 229, 153, 0)");
      }

      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 90 + corePulse, 0, Math.PI * 2);
      ctx.fill();

      // Project and sort 3D particles
      const projected = particles.map((p) => {
        p.theta += p.speed;
        const breath = Math.sin(time + p.phi * 3) * 5;
        const currentR = p.radius + breath;

        // Spherical coordinates to 3D Cartesian
        let x = currentR * Math.sin(p.phi) * Math.cos(p.theta);
        let y = currentR * Math.sin(p.phi) * Math.sin(p.theta);
        let z = currentR * Math.cos(p.phi);

        // Apply 3D Rotation (Y axis)
        const cosY = Math.cos(rotY + time * 0.2);
        const sinY = Math.sin(rotY + time * 0.2);
        const x1 = x * cosY - z * sinY;
        const z1 = z * cosY + x * sinY;

        // Apply 3D Rotation (X axis)
        const cosX = Math.cos(rotX);
        const sinX = Math.sin(rotX);
        const y2 = y * cosX - z1 * sinX;
        const z2 = z1 * cosX + y * sinX;

        // Perspective projection
        const scale = fov / (fov + z2 + 180);
        const px = cx + x1 * scale;
        const py = cy + y2 * scale;
        const alpha = Math.max(0.12, Math.min(1.0, (z2 + 120) / 240));

        return { px, py, scale, z: z2, alpha, size: p.size * scale };
      });

      // Sort back-to-front
      projected.sort((a, b) => a.z - b.z);

      // Draw inter-particle lattice connections
      ctx.lineWidth = 0.8;
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const p1 = projected[i];
          const p2 = projected[j];
          const dx = p1.px - p2.px;
          const dy = p1.py - p2.py;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 42) {
            const lineAlpha = (1 - dist / 42) * 0.25 * Math.min(p1.alpha, p2.alpha);
            ctx.strokeStyle =
              riskTier === "CRITICAL"
                ? `rgba(244, 63, 94, ${lineAlpha})`
                : riskTier === "ELEVATED"
                ? `rgba(245, 158, 11, ${lineAlpha})`
                : `rgba(0, 229, 153, ${lineAlpha})`;
            ctx.beginPath();
            ctx.moveTo(p1.px, p1.py);
            ctx.lineTo(p2.px, p2.py);
            ctx.stroke();
          }
        }
      }

      // Draw particle nodes
      projected.forEach((p) => {
        ctx.fillStyle =
          riskTier === "CRITICAL"
            ? `rgba(251, 113, 133, ${p.alpha})`
            : riskTier === "ELEVATED"
            ? `rgba(251, 191, 36, ${p.alpha})`
            : `rgba(0, 255, 170, ${p.alpha})`;

        ctx.beginPath();
        ctx.arc(p.px, p.py, Math.max(1, p.size), 0, Math.PI * 2);
        ctx.fill();

        // Extra highlight on frontmost particles
        if (p.z > 40) {
          ctx.shadowColor = currentColor;
          ctx.shadowBlur = 8;
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(p.px, p.py, p.size * 0.7, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // Orbiting Equatorial Ring
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotY * 0.5 + time * 0.1);
      ctx.scale(1, 0.35);
      ctx.beginPath();
      ctx.arc(0, 0, 130, 0, Math.PI * 2);
      ctx.strokeStyle =
        riskTier === "CRITICAL"
          ? "rgba(244, 63, 94, 0.28)"
          : riskTier === "ELEVATED"
          ? "rgba(245, 158, 11, 0.25)"
          : "rgba(0, 229, 153, 0.35)";
      ctx.setLineDash([4, 6]);
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handlePointerMove);
    };
  }, [riskTier, currentColor]);

  return (
    <div className="spline-container">
      {/* 3D Biological Energy Grid & Particles */}
      <canvas ref={canvasRef} className="bio-canvas-3d" />

      {/* Futuristic HUD Scan Grid Overlay */}
      <div className="hud-corner-brackets top-left" />
      <div className="hud-corner-brackets top-right" />
      <div className="hud-corner-brackets bottom-left" />
      <div className="hud-corner-brackets bottom-right" />

      {/* Center Reticle Coordinate */}
      <div className="hud-reticle-crosshair" />

      {/* Dynamic Telemetry Floating Badge */}
      <div className="orb-status-pill zed-pill">
        <span className={`status-dot ${riskTier.toLowerCase()}`} />
        <span className="status-label">
          {riskTier === "CRITICAL"
            ? "CRITICAL NOCTURNAL HYPO IMMINENT"
            : riskTier === "ELEVATED"
            ? "ELEVATED POST-IOB DRIFT"
            : "METABOLIC EQUILIBRIUM • STABLE"}
        </span>
        <span className="status-pct zed-glow-text">{crashPercentage}%</span>
      </div>

      {/* Bottom Telemetry Vector */}
      <div className="hud-sub-telemetry">
        <span>BIO-AXIS: 38.4°</span>
        <span className="hud-divider">|</span>
        <span>NADIR: {nadirMgDl} mg/dL</span>
        <span className="hud-divider">|</span>
        <span>LATENCY: 14ms</span>
      </div>
    </div>
  );
}

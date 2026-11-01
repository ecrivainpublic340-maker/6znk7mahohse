import React, { useEffect, useRef } from 'react';

interface CloudNode {
  baseXRatio: number;
  baseYRatio: number;
  x: number;
  y: number;
  radius: number;
  colorInner: string;
  colorMid: string;
  colorOuter: string;
  parallaxFactor: number;
  phase: number;
  phaseSpeed: number;
  scaleOscillation: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  maxLife: number;
  life: number;
}

export const InteractiveCloudBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse coordinates with smooth easing (lerp)
    let targetMouseX = width / 2;
    let targetMouseY = height / 2;
    let currentMouseX = width / 2;
    let currentMouseY = height / 2;
    let mouseVelocityX = 0;
    let mouseVelocityY = 0;
    let lastRawMouseX = width / 2;
    let lastRawMouseY = height / 2;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initClouds();
    };

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;

      // Calcul de vitesse pour créer des remous dans les nuages
      mouseVelocityX = e.clientX - lastRawMouseX;
      mouseVelocityY = e.clientY - lastRawMouseY;
      lastRawMouseX = e.clientX;
      lastRawMouseY = e.clientY;

      // Ajouter de petits éclats lumineux sous la souris
      if (Math.abs(mouseVelocityX) + Math.abs(mouseVelocityY) > 4) {
        spawnCursorParticles(e.clientX, e.clientY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        targetMouseX = touch.clientX;
        targetMouseY = touch.clientY;
        spawnCursorParticles(touch.clientX, touch.clientY);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    // Collection des nuages volumétriques vibrants
    let clouds: CloudNode[] = [];
    let particles: Particle[] = [];

    const initClouds = () => {
      const minDim = Math.min(width, height);
      clouds = [
        // Nuage 1 : Grand nuage central bleu royal & cyan vibrant
        {
          baseXRatio: 0.25,
          baseYRatio: 0.35,
          x: width * 0.25,
          y: height * 0.35,
          radius: minDim * 0.48,
          colorInner: 'rgba(37, 99, 235, 0.45)', // Blue-600
          colorMid: 'rgba(6, 182, 212, 0.25)',  // Cyan-500
          colorOuter: 'rgba(14, 165, 233, 0)',
          parallaxFactor: 0.35,
          phase: 0,
          phaseSpeed: 0.008,
          scaleOscillation: 0.12,
        },
        // Nuage 2 : Nuage indigo & violet cosmique en haut à droite
        {
          baseXRatio: 0.75,
          baseYRatio: 0.25,
          x: width * 0.75,
          y: height * 0.25,
          radius: minDim * 0.52,
          colorInner: 'rgba(99, 102, 241, 0.48)', // Indigo-500
          colorMid: 'rgba(147, 51, 234, 0.25)',  // Purple-600
          colorOuter: 'rgba(168, 85, 247, 0)',
          parallaxFactor: 0.45,
          phase: Math.PI * 0.5,
          phaseSpeed: 0.007,
          scaleOscillation: 0.15,
        },
        // Nuage 3 : Nuage émeraude & lagon vif en bas au centre
        {
          baseXRatio: 0.45,
          baseYRatio: 0.75,
          x: width * 0.45,
          y: height * 0.75,
          radius: minDim * 0.45,
          colorInner: 'rgba(16, 185, 129, 0.35)', // Emerald-500
          colorMid: 'rgba(14, 165, 233, 0.20)',  // Sky-500
          colorOuter: 'rgba(16, 185, 129, 0)',
          parallaxFactor: 0.30,
          phase: Math.PI,
          phaseSpeed: 0.009,
          scaleOscillation: 0.1,
        },
        // Nuage 4 : Nuage cyan électrique ultra-vif qui réagit fortement à la souris
        {
          baseXRatio: 0.60,
          baseYRatio: 0.55,
          x: width * 0.60,
          y: height * 0.55,
          radius: minDim * 0.42,
          colorInner: 'rgba(56, 189, 248, 0.50)', // Sky-400 vif
          colorMid: 'rgba(37, 99, 235, 0.25)',   // Blue-600
          colorOuter: 'rgba(30, 64, 175, 0)',
          parallaxFactor: 0.65,
          phase: Math.PI * 1.5,
          phaseSpeed: 0.012,
          scaleOscillation: 0.18,
        },
        // Nuage 5 : Nuage rose-violet aurore en bas à gauche
        {
          baseXRatio: 0.15,
          baseYRatio: 0.85,
          x: width * 0.15,
          y: height * 0.85,
          radius: minDim * 0.38,
          colorInner: 'rgba(168, 85, 247, 0.38)', // Purple-500
          colorMid: 'rgba(59, 130, 246, 0.18)',  // Blue-500
          colorOuter: 'rgba(99, 102, 241, 0)',
          parallaxFactor: 0.40,
          phase: Math.PI * 0.3,
          phaseSpeed: 0.006,
          scaleOscillation: 0.14,
        },
        // Nuage 6 : Grand halo atmosphérique d'ambiance profonde
        {
          baseXRatio: 0.5,
          baseYRatio: 0.4,
          x: width * 0.5,
          y: height * 0.4,
          radius: minDim * 0.65,
          colorInner: 'rgba(30, 58, 138, 0.45)', // Blue-900 profond
          colorMid: 'rgba(15, 23, 42, 0.3)',
          colorOuter: 'rgba(2, 6, 23, 0)',
          parallaxFactor: 0.15,
          phase: Math.PI * 0.8,
          phaseSpeed: 0.004,
          scaleOscillation: 0.08,
        },
      ];

      // Particules de poussière d'étoile / brume flottante
      particles = [];
      const particleCount = 45;
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          size: Math.random() * 2.5 + 1,
          alpha: Math.random() * 0.6 + 0.2,
          color: ['#38bdf8', '#818cf8', '#34d399', '#c084fc', '#ffffff'][Math.floor(Math.random() * 5)],
          maxLife: 200,
          life: Math.random() * 200,
        });
      }
    };

    const spawnCursorParticles = (x: number, y: number) => {
      if (particles.length > 70) return;
      for (let i = 0; i < 2; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 1.5 + 0.5;
        particles.push({
          x: x + (Math.random() - 0.5) * 30,
          y: y + (Math.random() - 0.5) * 30,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 3 + 1.5,
          alpha: 0.85,
          color: Math.random() > 0.5 ? '#38bdf8' : '#a7f3d0',
          maxLife: 80,
          life: 80,
        });
      }
    };

    initClouds();

    // Boucle d'animation fluide
    let time = 0;
    const render = () => {
      time += 0.015;

      // Lissage progressif du curseur de la souris (easing)
      currentMouseX += (targetMouseX - currentMouseX) * 0.06;
      currentMouseY += (targetMouseY - currentMouseY) * 0.06;

      // Décalage relatif par rapport au centre de l'écran (-0.5 à +0.5)
      const normOffsetX = (currentMouseX - width / 2) / (width / 2);
      const normOffsetY = (currentMouseY - height / 2) / (height / 2);

      // Fond dégradé nocturne profond et vibrant
      ctx.clearRect(0, 0, width, height);

      // Rendu avec mode de fusion 'screen' pour des couleurs lumineuses et vivantes
      ctx.globalCompositeOperation = 'screen';

      // 1. Dessiner les nuages volumétriques réactifs
      clouds.forEach((cloud) => {
        cloud.phase += cloud.phaseSpeed;

        // Ondulation harmonique naturelle (flottaison lente)
        const organicWobbleX = Math.cos(cloud.phase + time * 0.5) * 25;
        const organicWobbleY = Math.sin(cloud.phase + time * 0.4) * 25;

        // Déplacement par la souris selon la profondeur de parallaxe
        const mouseShiftX = normOffsetX * 90 * cloud.parallaxFactor;
        const mouseShiftY = normOffsetY * 90 * cloud.parallaxFactor;

        // Répulsion / déformation douce autour du curseur
        const dx = currentMouseX - (width * cloud.baseXRatio + mouseShiftX);
        const dy = currentMouseY - (height * cloud.baseYRatio + mouseShiftY);
        const distToMouse = Math.sqrt(dx * dx + dy * dy);
        let pushX = 0;
        let pushY = 0;
        if (distToMouse < cloud.radius * 1.2 && distToMouse > 0) {
          const pushForce = (1 - distToMouse / (cloud.radius * 1.2)) * 35;
          pushX = -(dx / distToMouse) * pushForce;
          pushY = -(dy / distToMouse) * pushForce;
        }

        const renderX = width * cloud.baseXRatio + mouseShiftX + organicWobbleX + pushX;
        const renderY = height * cloud.baseYRatio + mouseShiftY + organicWobbleY + pushY;

        // Variation dynamique du rayon (respiration du nuage)
        const currentRadius =
          cloud.radius * (1 + Math.sin(cloud.phase * 2) * cloud.scaleOscillation);

        // Gradient radial doux sans couture
        const gradient = ctx.createRadialGradient(
          renderX,
          renderY,
          0,
          renderX,
          renderY,
          Math.max(10, currentRadius)
        );

        gradient.addColorStop(0, cloud.colorInner);
        gradient.addColorStop(0.55, cloud.colorMid);
        gradient.addColorStop(1, cloud.colorOuter);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(renderX, renderY, currentRadius, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2. Halo interactif directement sous la souris (Nuage mobile qui suit le curseur)
      const cursorGlowRadius = Math.min(width, height) * 0.32;
      const cursorGradient = ctx.createRadialGradient(
        currentMouseX,
        currentMouseY,
        0,
        currentMouseX,
        currentMouseY,
        cursorGlowRadius
      );
      cursorGradient.addColorStop(0, 'rgba(56, 189, 248, 0.40)'); // Cyan lumineux
      cursorGradient.addColorStop(0.35, 'rgba(99, 102, 241, 0.22)'); // Indigo
      cursorGradient.addColorStop(0.7, 'rgba(168, 85, 247, 0.08)');  // Violet
      cursorGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = cursorGradient;
      ctx.beginPath();
      ctx.arc(currentMouseX, currentMouseY, cursorGlowRadius, 0, Math.PI * 2);
      ctx.fill();

      // 3. Dessin des particules lumineuses et fumerolles en suspension
      ctx.globalCompositeOperation = 'lighter';
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        // Interaction douce avec le flux de la souris
        const pDx = currentMouseX - p.x;
        const pDy = currentMouseY - p.y;
        const pDist = Math.sqrt(pDx * pDx + pDy * pDy);
        if (pDist < 120 && pDist > 0) {
          p.x -= (pDx / pDist) * 1.5;
          p.y -= (pDy / pDist) * 1.5;
        }

        // Rebond ou réapparition aux bords
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        p.life -= 0.5;
        if (p.life <= 0) {
          // Réinitialiser les particules permanentes
          if (particles.length <= 45) {
            p.life = p.maxLife;
            p.x = Math.random() * width;
            p.y = Math.random() * height;
          } else {
            particles.splice(i, 1);
            continue;
          }
        }

        const currentAlpha = (p.life / p.maxLife) * p.alpha;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, currentAlpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Toile de fond Canvas interactive réagissant à la souris */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block absolute inset-0 transition-opacity duration-700"
      />

      {/* Couche de texture discrète pour un rendu ultra-qualitatif type ciel étoilé / brume */}
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(17,24,39,0)_0%,rgba(15,23,42,0.65)_100%)]"
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40"
      />
    </div>
  );
};

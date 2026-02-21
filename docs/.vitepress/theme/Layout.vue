<script setup>
import DefaultTheme from 'vitepress/theme';
import { useRoute } from 'vitepress';
import { onMounted, watch, nextTick } from 'vue';

import './root.css';
import './mermaid-zoom.css';
import './hero-fullscreen.css';

const { Layout } = DefaultTheme;
const route = useRoute();

const cloneMermaidSvg = (svg) => {
  const clone = svg.cloneNode(true);
  const origId = svg.id;

  if (!origId) {
    return clone;
  }

  const newId = origId + '-zoom';

  clone.id = newId;

  const style = clone.querySelector('style');
  if (style) {
    style.textContent = style.textContent.replaceAll('#' + origId, '#' + newId);
  }

  return clone;
};

const createBtn = (text, title, className) => {
  const btn = document.createElement('button');

  btn.className = className || 'mermaid-zoom-btn';
  btn.textContent = text;
  btn.title = title;

  return btn;
};

const initMermaidZoom = () => {
  nextTick(() => {
    document.querySelectorAll('.mermaid').forEach((el) => {
      if (el.dataset.zoom) {
        return;
      }

      el.dataset.zoom = 'true';

      el.addEventListener('click', () => {
        const svg = el.querySelector('svg');
        if (!svg) {
          return;
        }

        let scale = 1;
        let panX = 0;
        let panY = 0;
        let isDragging = false;
        let startX = 0;
        let startY = 0;
        let startPanX = 0;
        let startPanY = 0;

        // Pinch-to-zoom: track active pointers
        const pointers = new Map();
        let pinchStartDist = 0;
        let pinchStartScale = 1;

        const dialog = document.createElement('dialog');

        dialog.className = 'mermaid-zoom-overlay';

        const content = document.createElement('div');

        content.className = 'mermaid-zoom-content';

        content.appendChild(cloneMermaidSvg(svg));

        const btnClose = createBtn('\u2715', 'Close');
        const btnZoomIn = createBtn('+', 'Zoom in');
        const btnZoomOut = createBtn('\u2212', 'Zoom out');
        const btnReset = createBtn('Reset', 'Reset zoom');

        const zoomGroup = document.createElement('div');

        zoomGroup.className = 'mermaid-zoom-group';

        zoomGroup.append(btnZoomIn, btnZoomOut, btnReset);

        const controls = document.createElement('div');

        controls.className = 'mermaid-zoom-controls';

        controls.append(btnClose, zoomGroup);
        dialog.append(controls, content);

        const applyTransform = () => {
          content.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
        };

        const getPointerDist = () => {
          const pts = [...pointers.values()];
          const dx = pts[0].clientX - pts[1].clientX;
          const dy = pts[0].clientY - pts[1].clientY;

          return Math.hypot(dx, dy);
        };

        const onPointerMove = (e) => {
          pointers.set(e.pointerId, e);

          if (pointers.size === 2) {
            // Pinch-to-zoom
            const dist = getPointerDist();
            scale = Math.min(
              5,
              Math.max(0.25, pinchStartScale * (dist / pinchStartDist)),
            );

            applyTransform();

            return;
          }

          if (!isDragging) {
            return;
          }

          panX = startPanX + (e.clientX - startX);
          panY = startPanY + (e.clientY - startY);

          applyTransform();
        };

        const onPointerUp = (e) => {
          pointers.delete(e.pointerId);

          if (!isDragging) {
            return;
          }

          isDragging = false;

          content.classList.remove('is-dragging');
        };

        const cleanup = () => {
          document.removeEventListener('pointermove', onPointerMove);
          document.removeEventListener('pointerup', onPointerUp);
          document.removeEventListener('pointercancel', onPointerUp);

          dialog.remove();

          document.body.style.overflow = '';
        };

        dialog.addEventListener('close', cleanup);

        btnZoomIn.addEventListener('click', (e) => {
          e.stopPropagation();

          scale = Math.min(5, scale + 0.25);

          applyTransform();
        });

        btnZoomOut.addEventListener('click', (e) => {
          e.stopPropagation();

          scale = Math.max(0.25, scale - 0.25);

          applyTransform();
        });

        btnReset.addEventListener('click', (e) => {
          e.stopPropagation();

          scale = 1;
          panX = 0;
          panY = 0;

          applyTransform();
        });

        btnClose.addEventListener('click', (e) => {
          e.stopPropagation();
          dialog.close();
        });

        content.addEventListener('pointerdown', (e) => {
          if (e.button !== 0) {
            return;
          }

          pointers.set(e.pointerId, e);
          content.setPointerCapture(e.pointerId);

          if (pointers.size === 2) {
            // Start pinch — stop single-finger drag
            isDragging = false;

            content.classList.remove('is-dragging');
            pinchStartDist = getPointerDist();
            pinchStartScale = scale;

            return;
          }

          isDragging = true;
          startX = e.clientX;
          startY = e.clientY;
          startPanX = panX;
          startPanY = panY;

          content.classList.add('is-dragging');
          e.preventDefault();
        });

        dialog.addEventListener(
          'wheel',
          (e) => {
            e.preventDefault();

            const delta = e.deltaY > 0 ? -0.15 : 0.15;
            const newScale = Math.min(5, Math.max(0.25, scale + delta));

            const rect = content.getBoundingClientRect();
            const cx = e.clientX - rect.left - rect.width / 2;
            const cy = e.clientY - rect.top - rect.height / 2;
            const factor = newScale / scale;

            panX -= cx * (factor - 1);
            panY -= cy * (factor - 1);
            scale = newScale;

            applyTransform();
          },
          { passive: false },
        );

        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp);
        document.addEventListener('pointercancel', onPointerUp);

        document.body.appendChild(dialog);
        dialog.showModal();

        document.body.style.overflow = 'hidden';
      });
    });
  });
};

onMounted(initMermaidZoom);
watch(
  () => route.path,
  () => setTimeout(initMermaidZoom, 500),
);
</script>

<template>
  <Layout />
</template>

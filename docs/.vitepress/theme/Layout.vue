<script setup>
import DefaultTheme from 'vitepress/theme';
import { useRoute } from 'vitepress';
import { onMounted, watch, nextTick } from 'vue';

import './root.css';
import './mermaid-zoom.css';
import './hero-fullscreen.css';

const { Layout } = DefaultTheme;
const route = useRoute();

function cloneMermaidSvg(svg) {
  const clone = svg.cloneNode(true);
  const origId = svg.id;

  if (!origId) return clone;

  const newId = origId + '-zoom';
  clone.id = newId;

  const style = clone.querySelector('style');
  if (style) {
    style.textContent = style.textContent.replaceAll('#' + origId, '#' + newId);
  }

  return clone;
}

function createBtn(text, title, className) {
  const btn = document.createElement('button');
  btn.className = className || 'mermaid-zoom-btn';
  btn.textContent = text;
  btn.title = title;
  return btn;
}

function initMermaidZoom() {
  nextTick(() => {
    document.querySelectorAll('.mermaid').forEach((el) => {
      if (el.dataset.zoom) return;
      el.dataset.zoom = 'true';

      el.addEventListener('click', () => {
        const svg = el.querySelector('svg');
        if (!svg) return;

        let scale = 1;
        let panX = 0;
        let panY = 0;
        let isDragging = false;
        let startX = 0;
        let startY = 0;
        let startPanX = 0;
        let startPanY = 0;

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

        function applyTransform() {
          content.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
        }

        function onMouseMove(e) {
          if (!isDragging) return;
          panX = startPanX + (e.clientX - startX);
          panY = startPanY + (e.clientY - startY);
          applyTransform();
        }

        function onMouseUp() {
          if (!isDragging) return;
          isDragging = false;
          content.classList.remove('is-dragging');
        }

        function cleanup() {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
          dialog.remove();
          document.body.style.overflow = '';
        }

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

        content.addEventListener('mousedown', (e) => {
          if (e.button !== 0) return;
          isDragging = true;
          startX = e.clientX;
          startY = e.clientY;
          startPanX = panX;
          startPanY = panY;
          content.classList.add('is-dragging');
          e.preventDefault();
        });

        dialog.addEventListener('click', (e) => {
          if (e.target === dialog) dialog.close();
        });

        dialog.addEventListener('wheel', (e) => {
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
        }, { passive: false });

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        document.body.appendChild(dialog);
        dialog.showModal();
        document.body.style.overflow = 'hidden';
      });
    });
  });
}

onMounted(initMermaidZoom);
watch(
  () => route.path,
  () => setTimeout(initMermaidZoom, 500),
);
</script>

<template>
  <Layout />
</template>

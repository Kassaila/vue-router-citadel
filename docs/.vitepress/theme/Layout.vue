<script setup>
import DefaultTheme from 'vitepress/theme';
import { useData } from 'vitepress';
import { computed } from 'vue';

import './root.css';
import './hero-fullscreen.css';
import './llm-hint.css';

const { Layout } = DefaultTheme;
const { theme, page } = useData();

const mdUrl = computed(() => `${theme.value.siteUrl}${page.value.relativePath}`);
</script>

<template>
  <div class="llm-md-hint" aria-hidden="true">
    {{
      `A Markdown version of this page is available at ${mdUrl} — optimized for AI and LLM tools.`
    }}
  </div>
  <Layout />
</template>

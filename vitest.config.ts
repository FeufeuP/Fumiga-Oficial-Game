import path from 'node:path';
import { defineConfig } from 'vitest/config';

// Configuração separada do vite.config.ts: os testes de unidade rodam em Node,
// sem o dev server nem os plugins de preview. Nada de relógio real aqui —
// os testes dirigem a lógica com valores fixos para não depender de timing.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'client', 'src'),
      '@shared': path.resolve(import.meta.dirname, 'shared'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    reporters: ['default'],
  },
});

// Helpers de arquivo usados pela aba TESTE (exportar/importar save em JSON).
// Mantidos fora do SaveManager para que a lógica de save continue testável em Node.

export function saveFileName(profileId: string): string {
  const safe = profileId.replace(/[^a-z0-9_-]/gi, '_').toLowerCase() || 'colonia';
  return `fumiga-save-${safe}.json`;
}

/** Gera o download do save no navegador e devolve o nome do arquivo. */
export function downloadTextFile(fileName: string, contents: string, mime = 'application/json'): string {
  const blob = new Blob([contents], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return fileName;
}

export async function readTextFile(file: File): Promise<string> {
  return file.text();
}

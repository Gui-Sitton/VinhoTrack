import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export function gerarNomeArquivo(prefixo: string, extensao: string) {
  const hoje = new Date().toISOString().slice(0, 10);
  return `${prefixo}-${hoje}.${extensao}`;
}

export function slugificar(texto: string) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function escaparCSV(valor: unknown): string {
  if (valor === null || valor === undefined) return '';
  const texto = String(valor);
  if (/[",\n]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}

export function downloadCSV(linhas: string[], nomeArquivo: string) {
  const conteudo = linhas.join('\n');
  const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function downloadPDF(elemento: HTMLElement, nomeArquivo: string) {
  const canvas = await html2canvas(elemento, { scale: 2 });
  const imgData = canvas.toDataURL('image/png');

  const pdf = new jsPDF('p', 'mm', 'a4');
  const larguraPdf = pdf.internal.pageSize.getWidth();
  const alturaPdf = (canvas.height * larguraPdf) / canvas.width;

  let posicaoY = 0;
  const alturaPagina = pdf.internal.pageSize.getHeight();

  while (posicaoY < alturaPdf) {
    if (posicaoY > 0) pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, -posicaoY, larguraPdf, alturaPdf);
    posicaoY += alturaPagina;
  }

  pdf.save(nomeArquivo);
}

export async function downloadChartImage(
  ref: React.RefObject<HTMLDivElement>,
  nomeGrafico: string,
) {
  if (!ref.current) return;

  const canvas = await html2canvas(ref.current, { scale: 2 });
  const imgData = canvas.toDataURL('image/png');

  const link = document.createElement('a');
  link.href = imgData;
  link.download = gerarNomeArquivo(`chart-${slugificar(nomeGrafico)}`, 'png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

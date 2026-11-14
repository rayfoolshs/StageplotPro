import { StageProject } from '../types/stage';

/**
 * Exports a clean, standalone SVG element by serializing it into a high-DPI PNG image download.
 */
export async function exportStageSvgToPng(
  svgElement: SVGSVGElement,
  project: StageProject
): Promise<void> {
  const clone = svgElement.cloneNode(true) as SVGSVGElement;

  // Remove interactive selection handles or transient alignment guides if marked with data-no-export
  clone.querySelectorAll('[data-no-export="true"]').forEach((el) => el.remove());

  const viewBox = clone.getAttribute('viewBox')?.split(' ').map(Number) || [0, 0, 1200, 860];
  const vbWidth = viewBox[2] || 1200;
  const vbHeight = viewBox[3] || 860;

  // Add a clean title header & metadata footer into a wrapper SVG
  const headerHeight = 76;
  const footerHeight = 44;
  const totalWidth = vbWidth;
  const totalHeight = vbHeight + headerHeight + footerHeight;

  const isDark = project.stageConfig.stageSurface === 'dark' || project.stageConfig.stageSurface === 'blueprint';
  const bgColor = isDark ? '#0B1120' : '#FFFFFF';
  const textPrimary = isDark ? '#F8FAFC' : '#0F172A';
  const textMuted = isDark ? '#94A3B8' : '#64748B';
  const borderColor = isDark ? '#1E293B' : '#E2E8F0';

  const wrapperSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  wrapperSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  wrapperSvg.setAttribute('width', String(totalWidth * 2));
  wrapperSvg.setAttribute('height', String(totalHeight * 2));
  wrapperSvg.setAttribute('viewBox', `0 0 ${totalWidth} ${totalHeight}`);

  const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bgRect.setAttribute('width', String(totalWidth));
  bgRect.setAttribute('height', String(totalHeight));
  bgRect.setAttribute('fill', bgColor);
  wrapperSvg.appendChild(bgRect);

  // Header text group
  const headerGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const titleEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  titleEl.setAttribute('x', '36');
  titleEl.setAttribute('y', '34');
  titleEl.setAttribute('fill', textPrimary);
  titleEl.setAttribute('font-family', 'Outfit, Plus Jakarta Sans, sans-serif');
  titleEl.setAttribute('font-size', '22');
  titleEl.setAttribute('font-weight', '700');
  titleEl.textContent = project.ensembleOrArtist || project.title;
  headerGroup.appendChild(titleEl);

  const subEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  subEl.setAttribute('x', '36');
  subEl.setAttribute('y', '56');
  subEl.setAttribute('fill', textMuted);
  subEl.setAttribute('font-family', 'Plus Jakarta Sans, sans-serif');
  subEl.setAttribute('font-size', '12');
  subEl.textContent = [project.title, project.eventOrVenue, project.eventDate].filter(Boolean).join(' · ');
  headerGroup.appendChild(subEl);

  const dimEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  dimEl.setAttribute('x', String(totalWidth - 36));
  dimEl.setAttribute('y', '42');
  dimEl.setAttribute('text-anchor', 'end');
  dimEl.setAttribute('fill', textMuted);
  dimEl.setAttribute('font-family', 'JetBrains Mono, monospace');
  dimEl.setAttribute('font-size', '12');
  const unitFactor = project.stageConfig.unit === 'ft' ? 3.28084 : 1;
  const wVal = (project.stageConfig.widthM * unitFactor).toFixed(1).replace(/\.0$/, '');
  const dVal = (project.stageConfig.depthM * unitFactor).toFixed(1).replace(/\.0$/, '');
  dimEl.textContent = `STAGE: ${wVal}${project.stageConfig.unit} × ${dVal}${project.stageConfig.unit} · ${project.inputList.length} CH · ${project.monitorMixes.length} MON`;
  headerGroup.appendChild(dimEl);

  const divider = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  divider.setAttribute('x1', '36');
  divider.setAttribute('y1', String(headerHeight - 6));
  divider.setAttribute('x2', String(totalWidth - 36));
  divider.setAttribute('y2', String(headerHeight - 6));
  divider.setAttribute('stroke', borderColor);
  divider.setAttribute('stroke-width', '1');
  headerGroup.appendChild(divider);
  wrapperSvg.appendChild(headerGroup);

  // Move cloned stage SVG inside a nested <g transform>
  const innerG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  innerG.setAttribute('transform', `translate(0, ${headerHeight})`);
  while (clone.firstChild) {
    innerG.appendChild(clone.firstChild);
  }
  wrapperSvg.appendChild(innerG);

  // Footer contact / notes
  const footerText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  footerText.setAttribute('x', '36');
  footerText.setAttribute('y', String(totalHeight - 16));
  footerText.setAttribute('fill', textMuted);
  footerText.setAttribute('font-family', 'Plus Jakarta Sans, sans-serif');
  footerText.setAttribute('font-size', '11');
  footerText.textContent = [
    project.contactName ? `Contact: ${project.contactName}` : '',
    project.contactEmail,
    'Audience at bottom · Stage Left / Right from performer perspective',
  ]
    .filter(Boolean)
    .join(' · ');
  wrapperSvg.appendChild(footerText);

  const serializer = new XMLSerializer();
  const svgStr = serializer.serializeToString(wrapperSvg);
  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = totalWidth * 2;
      canvas.height = totalHeight * 2;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Canvas context unavailable'));
        return;
      }
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      canvas.toBlob((pngBlob) => {
        if (!pngBlob) {
          reject(new Error('PNG conversion failed'));
          return;
        }
        const pngUrl = URL.createObjectURL(pngBlob);
        const link = document.createElement('a');
        const slug = (project.ensembleOrArtist || project.title || 'stage-plot')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        link.download = `${slug || 'stage-plot'}.png`;
        link.href = pngUrl;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(pngUrl), 1000);
        resolve();
      }, 'image/png');
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

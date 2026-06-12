import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import type { ExportResult } from '@m3kit/core';

/**
 * Browser download adapter for app-produced baseline exports.
 *
 * Core owns export content only; the demo app owns the Blob/object-URL/anchor
 * workflow so consumers can replace it with their own browser or server export
 * adapter. The document is injected to keep tests JSDOM-safe and avoid direct
 * global document access.
 */
@Injectable({ providedIn: 'root' })
export class ExportDownloadService {
  private readonly document = inject(DOCUMENT);

  download(result: ExportResult): void {
    if (result.kind !== 'success') {
      return;
    }

    const blob = new Blob([result.content], { type: result.mediaType });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = this.document.createElement('a');

    try {
      anchor.href = objectUrl;
      anchor.download = result.filename;
      anchor.rel = 'noopener';
      anchor.click();
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }
}

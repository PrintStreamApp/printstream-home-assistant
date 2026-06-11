/* global HTMLElement, customElements, window, document */

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------
const BASE_STYLES = `
  :host {
    display: block;
    min-width: 0;
    max-width: 100%;
  }

  :host, :host * {
    box-sizing: border-box;
  }

  ha-card {
    display: block;
    height: 100%;
    width: 100%;
    max-width: 100%;
    overflow: hidden;
  }

  .card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    width: 100%;
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    color: var(--primary-text-color);
  }

  .hero {
    position: relative;
    width: 100%;
    aspect-ratio: 1 / 1;
    border-radius: 14px;
    overflow: hidden;
    background:
      radial-gradient(circle at top left, rgba(0, 163, 255, 0.22), transparent 40%),
      linear-gradient(160deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02)),
      var(--secondary-background-color);
    border: 1px solid var(--divider-color);
  }
  .hero.hero-wide {
    aspect-ratio: 16 / 10;
  }
  .media-action {
    display: block;
    border: 0;
    padding: 0;
    margin: 0;
    color: inherit;
    background: transparent;
    cursor: pointer;
    text-align: inherit;
    font: inherit;
  }
  .media-action-block {
    width: 100%;
  }
  .media-action-tile {
    width: auto;
    flex-shrink: 0;
  }
  .media-action:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }
  .hero-image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    background: var(--secondary-background-color);
  }
  .hero-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 164px;
    color: var(--secondary-text-color);
    font-size: 0.88rem;
  }
  .hero-overlay {
    position: absolute;
    inset: auto 0 0 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 14px;
    background: linear-gradient(180deg, rgba(8, 10, 13, 0) 0%, rgba(8, 10, 13, 0.78) 52%, rgba(8, 10, 13, 0.92) 100%);
    color: #fff;
  }
  .media-strip {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }
  .media-strip-center {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 8px;
  }
  .media-strip-spacer {
    flex: 1;
    min-width: 0;
  }
  .media-tile,
  .media-visual {
    position: relative;
    flex-shrink: 0;
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid var(--divider-color);
    background: var(--secondary-background-color);
  }
  .media-visual {
    width: 100%;
    aspect-ratio: 1 / 1;
  }
  .media-tile {
    width: 56px;
    height: 56px;
    border-radius: 10px;
  }
  .media-tile-placeholder,
  .media-visual-placeholder,
  .hero-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 6px;
    color: var(--secondary-text-color);
    background:
      radial-gradient(circle at top left, rgba(0, 163, 255, 0.18), transparent 45%),
      linear-gradient(160deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01)),
      var(--secondary-background-color);
  }
  .media-tile-placeholder {
    font-size: 0.62rem;
    line-height: 1.15;
    text-align: center;
    padding: 6px;
  }
  .media-visual-placeholder {
    width: 100%;
    height: 100%;
    padding: 16px;
    font-size: 0.88rem;
  }
  .hero-placeholder {
    width: 100%;
    height: 100%;
    padding: 20px;
    font-size: 0.9rem;
  }
  .placeholder-icon {
    width: 20px;
    height: 20px;
    opacity: 0.85;
  }
  .hero-placeholder .placeholder-icon,
  .media-visual-placeholder .placeholder-icon {
    width: 30px;
    height: 30px;
  }
  .placeholder-caption {
    opacity: 0.88;
  }
  .media-tile-image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    background: var(--secondary-background-color);
  }
  .media-image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    background: var(--secondary-background-color);
  }
  .media-empty {
    min-height: 168px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--secondary-text-color);
    font-size: 0.88rem;
    padding: 16px;
  }
  .media-overlay-chip {
    position: absolute;
    top: 10px;
    left: 10px;
    border-radius: 999px;
    padding: 4px 10px;
    background: rgba(7, 10, 14, 0.7);
    color: #fff;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .strip-top-row,
  .strip-bottom-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-width: 0;
  }
  .strip-bottom-row[data-centered="true"] {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: center;
  }
  .strip-job {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.82rem;
    line-height: 1.35;
  }
  .strip-side-text,
  .strip-center-text {
    min-width: 0;
    color: var(--secondary-text-color);
    font-size: 0.76rem;
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .strip-side-text-right {
    text-align: right;
  }
  .strip-center-text {
    padding: 0 6px;
    text-align: center;
  }
  .readout-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    min-width: 0;
  }
  .readout-chip {
    display: inline-flex;
    align-items: center;
    min-width: 0;
    max-width: 100%;
    padding: 6px 10px;
    border-radius: 999px;
    border: 1px solid var(--divider-color);
    background: var(--secondary-background-color);
    font-size: 0.76rem;
    font-weight: 700;
    line-height: 1.25;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .hero-kicker {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    min-width: 0;
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    opacity: 0.88;
  }
  .hero-job {
    font-size: 1rem;
    font-weight: 700;
    line-height: 1.3;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .hero-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 10px;
    min-width: 0;
    font-size: 0.78rem;
    color: rgba(255,255,255,0.82);
  }
  .hero-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
  }

  /* ---- header ---- */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 10px;
    min-width: 0;
  }
  .title-wrap { min-width: 0; flex: 1; }
  .title-row {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .title {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.35;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .model-chip {
    flex-shrink: 0;
    border-radius: 999px;
    padding: 3px 10px;
    background: rgba(255,255,255,0.08);
    color: var(--primary-text-color);
    font-size: 0.72rem;
    font-weight: 600;
    line-height: 1.2;
    border: 1px solid var(--divider-color);
    white-space: nowrap;
  }

  /* ---- status badge ---- */
  .badge {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    border: 1px solid var(--divider-color);
    border-radius: 999px;
    padding: 3px 10px;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    background: var(--secondary-background-color);
    text-transform: uppercase;
    white-space: nowrap;
  }
  .badge[data-tone="primary"]  { color: var(--primary-color);  border-color: rgba(var(--rgb-primary-color), 0.45); background: rgba(var(--rgb-primary-color), 0.12); }
  .badge[data-tone="success"]  { color: var(--success-color);  border-color: var(--success-color); }
  .badge[data-tone="warning"]  { color: var(--warning-color);  border-color: var(--warning-color); }
  .badge[data-tone="danger"]   { color: var(--error-color);    border-color: var(--error-color); }
  .badge[data-tone="success"],
  .badge[data-tone="warning"],
  .badge[data-tone="danger"] {
    background: color-mix(in srgb, currentColor 10%, var(--secondary-background-color));
  }
  .progress-substage {
    min-width: 0;
    color: var(--secondary-text-color);
    font-size: 0.76rem;
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .hero-overlay .progress-substage {
    color: rgba(255,255,255,0.82);
  }

  /* ---- divider ---- */
  .divider { height: 1px; background: var(--divider-color); }

  /* ---- offline box ---- */
  .offline-box {
    min-height: 80px;
    border-radius: 8px;
    border: 1px dashed var(--divider-color);
    background: var(--secondary-background-color);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px;
    gap: 10px;
    color: var(--secondary-text-color);
    font-size: 0.88rem;
  }

  /* ---- progress bar ---- */
  .progress-wrap { display: flex; flex-direction: column; gap: 4px; }
  .progress-header { display: flex; justify-content: space-between; font-size: 0.82rem; }
  .progress-label { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; color: var(--primary-text-color); }
  .progress-pct { flex-shrink: 0; color: var(--secondary-text-color); }
  .progress-track {
    height: 6px;
    border-radius: 999px;
    background: var(--secondary-background-color);
    overflow: hidden;
  }
  .strip-progress .progress-track {
    height: 8px;
  }
  .hero-overlay .progress-track {
    background: rgba(255,255,255,0.18);
  }
  .progress-fill {
    height: 100%;
    border-radius: 999px;
    background: var(--primary-color);
    transition: width 0.4s ease;
  }

  /* ---- metric tiles ---- */
  .metrics {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    min-width: 0;
  }
  .detail-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    min-width: 0;
  }
  .detail-card {
    padding: 10px 12px;
    border-radius: 12px;
    background: color-mix(in srgb, var(--card-background-color, var(--primary-background-color)) 84%, var(--secondary-background-color) 16%);
    border: 1px solid var(--divider-color);
    min-width: 0;
  }
  .detail-label {
    color: var(--secondary-text-color);
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .detail-value {
    margin-top: 4px;
    font-size: 0.92rem;
    font-weight: 600;
    line-height: 1.35;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    min-width: 0;
  }
  .chip {
    padding: 6px 10px;
    border-radius: 999px;
    background: var(--secondary-background-color);
    border: 1px solid var(--divider-color);
    font-size: 0.76rem;
    font-weight: 600;
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .nozzle-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
    gap: 8px;
  }
  .nozzle-card {
    padding: 10px 12px;
    border-radius: 12px;
    border: 1px solid var(--divider-color);
    background: var(--secondary-background-color);
    min-width: 0;
  }
  .nozzle-title {
    font-size: 0.78rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--secondary-text-color);
  }
  .nozzle-meta {
    margin-top: 6px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    min-width: 0;
  }
  .spool-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    min-width: 0;
  }
  .spool-pill {
    padding: 7px 10px;
    border-radius: 10px;
    background: var(--secondary-background-color);
    border: 1px solid var(--divider-color);
    font-size: 0.76rem;
    font-weight: 600;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .metric {
    padding: 9px 11px;
    border-radius: 12px;
    background: var(--secondary-background-color);
  }
  .metric-label {
    color: var(--secondary-text-color);
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .metric-value {
    margin-top: 3px;
    font-size: 0.95rem;
    font-weight: 600;
    line-height: 1.3;
  }

  /* ---- section title ---- */
  .section-title {
    margin: 0;
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--secondary-text-color);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .stack { display: flex; flex-direction: column; gap: 8px; }

  /* ---- AMS unit ---- */
  .ams {
    padding: 10px;
    border-radius: 10px;
    border: 1px solid var(--divider-color);
    background: color-mix(in srgb, var(--card-background-color, var(--primary-background-color)) 80%, var(--secondary-background-color) 20%);
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }
  .ams-header { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .ams-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    min-width: 0;
    width: 100%;
  }
  .ams-title-link {
    display: inline-flex;
    align-items: center;
    min-width: 0;
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .ams-title-link:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
    border-radius: 8px;
  }
  .ams-meta-inline {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    min-width: 0;
    margin-left: auto;
    flex-shrink: 0;
    color: var(--secondary-text-color);
    font-size: 0.78rem;
    line-height: 1.2;
    white-space: nowrap;
  }
  .ams-header-actions {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-left: 2px;
  }
  .ams-tool-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 0;
    min-height: 0;
    padding: 2px;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: var(--secondary-text-color);
    font: inherit;
    cursor: pointer;
  }
  .ams-tool-button:hover {
    color: var(--primary-text-color);
    background: color-mix(in srgb, var(--secondary-background-color) 80%, transparent 20%);
  }
  .ams-tool-button:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }
  .ams-tool-button[data-busy="true"] {
    color: var(--primary-color);
  }
  .ams-title { font-size: 0.88rem; font-weight: 600; }
  .ams-meta { color: var(--secondary-text-color); font-size: 0.78rem; }

  /* ---- slot tiles (styled like the app) ---- */
  .slot-row {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 5px;
    min-width: 0;
  }
  .slot-shell {
    position: relative;
    min-width: 0;
  }
  .slot-action {
    display: block;
    width: 100%;
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: inherit;
    cursor: pointer;
  }
  .slot-action:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
    border-radius: 10px;
  }
  .slot-tool-button {
    position: absolute;
    top: 4px;
    right: 4px;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 999px;
    background: rgba(7, 10, 14, 0.78);
    color: rgba(255, 255, 255, 0.92);
    font-size: 0.7rem;
    line-height: 1;
    cursor: pointer;
  }
  .slot-tool-button:hover {
    background: rgba(7, 10, 14, 0.92);
  }
  .slot-tool-button:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }
  .slot-rescan-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: inherit;
    background-color: rgba(7, 10, 16, 0.54);
    backdrop-filter: blur(1px);
    z-index: 2;
  }
  .slot-spinner,
  .button-spinner {
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: 999px;
    animation: printstream-spin 0.75s linear infinite;
  }
  .slot-spinner {
    width: 18px;
    height: 18px;
    color: rgba(255, 255, 255, 0.96);
  }
  .slot-tile {
    position: relative;
    border-radius: 6px;
    border: 1px solid var(--divider-color);
    min-height: 58px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    padding: 4px 3px 6px;
    gap: 2px;
  }
  .slot-tile[data-active="true"] {
    border: 2px solid var(--primary-color);
    box-shadow: 0 0 0 1px rgba(122,162,255,0.3), 0 0 14px rgba(122,162,255,0.14);
  }
  .slot-tile-label {
    position: absolute;
    top: 2px;
    left: 4px;
    font-size: 0.65rem;
    font-weight: 700;
    line-height: 1;
    opacity: 0.7;
  }
  .slot-tile-type {
    font-size: 0.7rem;
    font-weight: 700;
    line-height: 1.2;
    text-align: center;
    overflow: hidden;
    max-width: 90%;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .slot-tile-name {
    font-size: 0.63rem;
    line-height: 1.2;
    text-align: center;
    opacity: 0.8;
    overflow: hidden;
    max-width: 90%;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .slot-tile-bar-wrap {
    position: absolute;
    left: 4px;
    right: 4px;
    bottom: 3px;
    height: 6px;
    background: rgba(255,255,255,0.16);
    border: 1px solid rgba(255,255,255,0.22);
    border-radius: 999px;
    overflow: hidden;
  }
  .slot-tile-bar {
    height: 100%;
    border-radius: 999px;
  }
  .slot-empty {
    background: var(--secondary-background-color);
    color: var(--secondary-text-color);
  }

  /* ---- footer actions ---- */
  .footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
  }
  .footer-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .footer-link {
    margin-left: auto;
  }
  .action-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 32px;
    padding: 0 12px;
    border: 1px solid var(--divider-color);
    border-radius: 999px;
    background: var(--secondary-background-color);
    color: var(--primary-text-color);
    font: inherit;
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
  }
  .action-button[data-icon-only="true"] {
    min-width: 32px;
    padding: 0 10px;
  }
  .action-button:hover {
    border-color: var(--primary-color);
  }
  .action-button[data-tone="danger"] {
    color: var(--error-color);
    border-color: rgba(255, 82, 82, 0.4);
  }
  .action-button[data-tone="warning"] {
    color: var(--warning-color);
    border-color: rgba(255, 193, 7, 0.4);
  }
  .action-button[data-tone="neutral"] {
    color: var(--secondary-text-color);
  }
  .action-button:disabled {
    opacity: 0.6;
    cursor: wait;
  }
  .action-button-content {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .action-icon {
    width: 0.95rem;
    height: 0.95rem;
    flex-shrink: 0;
  }
  .link {
    color: var(--primary-color);
    text-decoration: none;
    font-size: 0.82rem;
    font-weight: 600;
    overflow-wrap: anywhere;
  }
  .link:hover { text-decoration: underline; }

  /* ---- error ---- */
  .error-text { color: var(--error-color); font-size: 0.9rem; }

  @media (min-width: 520px) {
    .media-strip {
      grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
      align-items: stretch;
    }
    .metrics {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .detail-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 420px) {
    .slot-row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @keyframes printstream-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .field-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .toggle-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px 12px;
  }
  .toggle-option {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    font-size: 0.9rem;
  }
  .toggle-option input {
    margin: 0;
    flex-shrink: 0;
  }
`

const EDITOR_STYLES = `
  :host { display: block; }
  .editor { display: flex; flex-direction: column; gap: 16px; padding: 16px 0; }
  .field { display: flex; flex-direction: column; gap: 6px; }
  .field-label {
    color: var(--secondary-text-color);
    font-size: 0.78rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .helper {
    color: var(--secondary-text-color);
    font-size: 0.82rem;
    line-height: 1.45;
  }
  select {
    width: 100%;
    min-height: 40px;
    border: 1px solid var(--divider-color);
    border-radius: 10px;
    background: var(--card-background-color, var(--primary-background-color));
    color: var(--primary-text-color);
    padding: 0 12px;
  }
  ha-textfield, ha-formfield, ha-checkbox { display: block; }
  .toggle-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 4px 12px;
  }
  .toggle-grid ha-formfield {
    --mdc-theme-text-primary-on-background: var(--primary-text-color);
  }
`

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function humanize(value) {
  return String(value ?? '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase())
}

function friendlyName(stateObj, fallback) {
  return stateObj?.attributes?.friendly_name || fallback
}

const ENTITY_DEVICE_ID_LOOKUP = new Map()
let entityDeviceLookupPromise = null

function getDeviceIdForEntity(entityId) {
  return entityId ? (ENTITY_DEVICE_ID_LOOKUP.get(entityId) || null) : null
}

async function ensureEntityDeviceLookup(hass) {
  if (typeof hass?.callWS !== 'function') return
  if (ENTITY_DEVICE_ID_LOOKUP.size > 0 || entityDeviceLookupPromise) return entityDeviceLookupPromise

  entityDeviceLookupPromise = hass.callWS({ type: 'config/entity_registry/list_for_display' })
    .then((result) => {
      const entities = Array.isArray(result?.entities) ? result.entities : []
      entities.forEach((entry) => {
        if (entry?.ei && entry?.di) ENTITY_DEVICE_ID_LOOKUP.set(entry.ei, entry.di)
      })
    })
    .catch((err) => {
      console.warn('PrintStream device lookup failed', err)
    })
    .finally(() => {
      entityDeviceLookupPromise = null
    })

  return entityDeviceLookupPromise
}

function fireMoreInfoEvent(node, entityId) {
  if (!node || !entityId) return
  node.dispatchEvent(new CustomEvent('hass-more-info', {
    detail: { entityId },
    bubbles: true,
    composed: true,
  }))
}

function fireDeviceNavigation(node, deviceId) {
  if (!node || !deviceId) return
  const path = `/config/devices/device/${deviceId}`
  try {
    window.history.pushState(null, '', path)
    window.dispatchEvent(new CustomEvent('location-changed', {
      detail: { replace: false },
      bubbles: true,
      composed: true,
    }))
  } catch {
    window.location.assign(path)
  }
}

function fireNotificationEvent(node, message) {
  if (!node || !message) return
  node.dispatchEvent(new CustomEvent('hass-notification', {
    detail: { message },
    bubbles: true,
    composed: true,
  }))
}

function servicePendingKey(service, entityId) {
  return service && entityId ? `${service}:${entityId}` : ''
}

function findPrinterImageEntities(hass, printerId) {
  const result = { cover: null, camera: null }
  if (!hass || !printerId) return result
  const states = hass.states || {}
  for (const entityId of Object.keys(states)) {
    if (!entityId.startsWith('image.')) continue
    const state = states[entityId]
    if (state?.attributes?.printer_id !== printerId) continue
    const kind = state.attributes?.printstream_image_kind
    if (kind === 'cover') result.cover = entityId
    else if (kind === 'camera') result.camera = entityId
  }
  return result
}

function findAmsEntity(hass, amsId) {
  if (!hass || !amsId) return null
  const states = hass.states || {}
  for (const entityId of Object.keys(states)) {
    const state = states[entityId]
    if (state?.attributes?.printstream_kind === 'ams' && state?.attributes?.ams_id === amsId) {
      return entityId
    }
  }
  return null
}

function findAmsSlotEntity(hass, amsId, slotNumber) {
  if (!hass || !amsId || !slotNumber) return null
  const states = hass.states || {}
  for (const entityId of Object.keys(states)) {
    const state = states[entityId]
    if (state?.attributes?.printstream_kind !== 'ams_slot') continue
    if (state?.attributes?.ams_id !== amsId) continue
    if (Number(state?.attributes?.slot) !== Number(slotNumber)) continue
    return entityId
  }
  return null
}

function renderPlaceholderIcon(kind) {
  if (kind === 'camera') {
    return '<svg class="placeholder-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17 10.5V7a2 2 0 0 0-2-2H3A2 2 0 0 0 1 7v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3.5l6 4v-9z"/></svg>'
  }
  return '<svg class="placeholder-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2m0 14H5V5h14zm-4.5-3.5l-2.5 3.01L9.5 13.5L6 18h12zM8.5 8A1.5 1.5 0 1 0 10 9.5A1.5 1.5 0 0 0 8.5 8"/></svg>'
}

function renderActionIcon(kind) {
  switch (kind) {
    case 'pause':
      return '<svg class="action-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5h3v14H8zm5 0h3v14h-3z"/></svg>'
    case 'resume':
    case 'start':
      return '<svg class="action-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>'
    case 'stop':
      return '<svg class="action-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 7h10v10H7z"/></svg>'
    case 'lightbulb':
      return '<svg class="action-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9 21h6v-1H9zm3-19a7 7 0 0 0-4 12.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26A7 7 0 0 0 12 2m2.5 11.6-.5.4V16h-4v-2l-.5-.4A5 5 0 1 1 14.5 13.6"/></svg>'
    default:
      return ''
  }
}

function isRawTrayCode(value) {
  return /^[A-Z]\d{2}-[A-Z]\d+$/i.test(String(value ?? '').trim())
}

function normalizeHexColor(value) {
  if (!value) return null
  const trimmed = String(value).trim().toUpperCase()
  const hex = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed
  if (!/^[0-9A-F]{6}(?:[0-9A-F]{2})?$/.test(hex)) return null
  return `#${hex.slice(0, 6)}`
}

function normalizeTrayCode(value) {
  const trimmed = String(value ?? '').trim().toUpperCase()
  return /^[A-Z]\d{2}-[A-Z]\d+$/.test(trimmed) ? trimmed : null
}

const BAMBU_COLOR_SWATCHES = [
  { name: 'Jade White', hex: '#FFFFFF', material: 'PLA Basic' },
  { name: 'Black', hex: '#000000', material: 'PLA Basic' },
  { name: 'Silver', hex: '#A6A9AA', material: 'PLA Basic' },
  { name: 'Light Gray', hex: '#D1D3D5', material: 'PLA Basic' },
  { name: 'Gray', hex: '#8E9089', material: 'PLA Basic' },
  { name: 'Dark Gray', hex: '#545454', material: 'PLA Basic' },
  { name: 'Red', hex: '#C12E1F', material: 'PLA Basic' },
  { name: 'Maroon Red', hex: '#9D2235', material: 'PLA Basic' },
  { name: 'Magenta', hex: '#EC008C', material: 'PLA Basic' },
  { name: 'Hot Pink', hex: '#F5547C', material: 'PLA Basic' },
  { name: 'Pink', hex: '#F55A74', material: 'PLA Basic' },
  { name: 'Beige', hex: '#F7E6DE', material: 'PLA Basic' },
  { name: 'Yellow', hex: '#F4EE2A', material: 'PLA Basic' },
  { name: 'Sunflower Yellow', hex: '#FEC600', material: 'PLA Basic' },
  { name: 'Gold', hex: '#E4BD68', material: 'PLA Basic' },
  { name: 'Orange', hex: '#FF6A13', material: 'PLA Basic' },
  { name: 'Pumpkin Orange', hex: '#FF9016', material: 'PLA Basic' },
  { name: 'Bright Green', hex: '#BECF00', material: 'PLA Basic' },
  { name: 'Bambu Green', hex: '#00AE42', material: 'PLA Basic' },
  { name: 'Mistletoe Green', hex: '#3F8E43', material: 'PLA Basic' },
  { name: 'Turquoise', hex: '#00B1B7', material: 'PLA Basic' },
  { name: 'Cyan', hex: '#0086D6', material: 'PLA Basic' },
  { name: 'Blue', hex: '#0A2989', material: 'PLA Basic' },
  { name: 'Blue Grey', hex: '#5B6579', material: 'PLA Basic' },
  { name: 'Cobalt Blue', hex: '#0056B8', material: 'PLA Basic' },
  { name: 'Purple', hex: '#5E43B7', material: 'PLA Basic' },
  { name: 'Indigo Purple', hex: '#482960', material: 'PLA Basic' },
  { name: 'Brown', hex: '#9D432C', material: 'PLA Basic' },
  { name: 'Cocoa Brown', hex: '#6F5034', material: 'PLA Basic' },
  { name: 'Bronze', hex: '#847D48', material: 'PLA Basic' },
  { name: 'Ivory White', hex: '#FFFFFF', material: 'PLA Matte' },
  { name: 'Bone White', hex: '#CBC6B8', material: 'PLA Matte' },
  { name: 'Desert Tan', hex: '#E8DBB7', material: 'PLA Matte' },
  { name: 'Latte Brown', hex: '#D3B7A7', material: 'PLA Matte' },
  { name: 'Caramel', hex: '#AE835B', material: 'PLA Matte' },
  { name: 'Terracotta', hex: '#B15533', material: 'PLA Matte' },
  { name: 'Dark Brown', hex: '#7D6556', material: 'PLA Matte' },
  { name: 'Dark Chocolate', hex: '#4D3324', material: 'PLA Matte' },
  { name: 'Lilac Purple', hex: '#AE96D4', material: 'PLA Matte' },
  { name: 'Sakura Pink', hex: '#E8AFCF', material: 'PLA Matte' },
  { name: 'Mandarin Orange', hex: '#F99963', material: 'PLA Matte' },
  { name: 'Lemon Yellow', hex: '#F7D959', material: 'PLA Matte' },
  { name: 'Plum', hex: '#950051', material: 'PLA Matte' },
  { name: 'Scarlet Red', hex: '#DE4343', material: 'PLA Matte' },
  { name: 'Dark Red', hex: '#BB3D43', material: 'PLA Matte' },
  { name: 'Dark Green', hex: '#68724D', material: 'PLA Matte' },
  { name: 'Grass Green', hex: '#61C680', material: 'PLA Matte' },
  { name: 'Apple Green', hex: '#C2E189', material: 'PLA Matte' },
  { name: 'Ice Blue', hex: '#A3D8E1', material: 'PLA Matte' },
  { name: 'Sky Blue', hex: '#56B7E6', material: 'PLA Matte' },
  { name: 'Marine Blue', hex: '#0078BF', material: 'PLA Matte' },
  { name: 'Dark Blue', hex: '#042F56', material: 'PLA Matte' },
  { name: 'Ash Gray', hex: '#9B9EA0', material: 'PLA Matte' },
  { name: 'Nardo Gray', hex: '#757575', material: 'PLA Matte' },
  { name: 'Charcoal', hex: '#000000', material: 'PLA Matte' },
  { name: 'Gold', hex: '#F4A925', material: 'PLA Silk' },
  { name: 'Silver', hex: '#C8C8C8', material: 'PLA Silk' },
  { name: 'Titan Gray', hex: '#5F6367', material: 'PLA Silk' },
  { name: 'Blue', hex: '#008BDA', material: 'PLA Silk' },
  { name: 'Purple', hex: '#8671CB', material: 'PLA Silk' },
  { name: 'Candy Red', hex: '#D02727', material: 'PLA Silk' },
  { name: 'Candy Green', hex: '#018814', material: 'PLA Silk' },
  { name: 'Rose Gold', hex: '#BA9594', material: 'PLA Silk' },
  { name: 'Baby Blue', hex: '#A8C6EE', material: 'PLA Silk' },
  { name: 'Pink', hex: '#F7ADA6', material: 'PLA Silk' },
  { name: 'Mint', hex: '#96DCB9', material: 'PLA Silk' },
  { name: 'Champagne', hex: '#F3CFB2', material: 'PLA Silk' },
  { name: 'White', hex: '#FFFFFF', material: 'PLA Silk' },
  { name: 'Classic Gold Sparkle', hex: '#CEA629', material: 'PLA Sparkle' },
  { name: 'Slate Gray Sparkle', hex: '#8E9089', material: 'PLA Sparkle' },
  { name: 'Crimson Red Sparkle', hex: '#792B36', material: 'PLA Sparkle' },
  { name: 'Royal Purple Sparkle', hex: '#483D8B', material: 'PLA Sparkle' },
  { name: 'Alpine Green Sparkle', hex: '#3F5443', material: 'PLA Sparkle' },
  { name: 'Onyx Black Sparkle', hex: '#2D2B28', material: 'PLA Sparkle' },
  { name: 'Teal', hex: '#009FA1', material: 'PLA Translucent' },
  { name: 'Light Jade', hex: '#96D8AF', material: 'PLA Translucent' },
  { name: 'Blue', hex: '#0047BB', material: 'PLA Translucent' },
  { name: 'Mellow Yellow', hex: '#F5DBAB', material: 'PLA Translucent' },
  { name: 'Purple', hex: '#8344B0', material: 'PLA Translucent' },
  { name: 'Cherry Pink', hex: '#F5B6CD', material: 'PLA Translucent' },
  { name: 'Orange', hex: '#F74E02', material: 'PLA Translucent' },
  { name: 'Ice Blue', hex: '#B8CDE9', material: 'PLA Translucent' },
  { name: 'Red', hex: '#B50011', material: 'PLA Translucent' },
  { name: 'Lavender', hex: '#B8ACD6', material: 'PLA Translucent' },
  { name: 'Glow Green', hex: '#A1FFAC', material: 'PLA Glow' },
  { name: 'Glow Yellow', hex: '#F8FF80', material: 'PLA Glow' },
  { name: 'Glow Pink', hex: '#F17B8F', material: 'PLA Glow' },
  { name: 'Glow Blue', hex: '#7AC0E9', material: 'PLA Glow' },
  { name: 'Glow Orange', hex: '#FF9D5B', material: 'PLA Glow' },
  { name: 'Brown', hex: '#684A43', material: 'PLA Galaxy' },
  { name: 'Green', hex: '#3B665E', material: 'PLA Galaxy' },
  { name: 'Nebulae', hex: '#424379', material: 'PLA Galaxy' },
  { name: 'Purple', hex: '#594177', material: 'PLA Galaxy' },
  { name: 'Iridium Gold Metallic', hex: '#B39B84', material: 'PLA Metal' },
  { name: 'Copper Brown Metallic', hex: '#AA6443', material: 'PLA Metal' },
  { name: 'Oxide Green Metallic', hex: '#1D7C6A', material: 'PLA Metal' },
  { name: 'Cobalt Blue Metallic', hex: '#39699E', material: 'PLA Metal' },
  { name: 'Iron Gray Metallic', hex: '#43403D', material: 'PLA Metal' },
  { name: 'White Marble', hex: '#F7F3F0', material: 'PLA Marble' },
  { name: 'Red Granite', hex: '#AD4E38', material: 'PLA Marble' },
  { name: 'Black Walnut', hex: '#4F3F24', material: 'PLA Wood' },
  { name: 'Rosewood', hex: '#4C241C', material: 'PLA Wood' },
  { name: 'Clay Brown', hex: '#995F11', material: 'PLA Wood' },
  { name: 'Classic Birch', hex: '#918669', material: 'PLA Wood' },
  { name: 'White Oak', hex: '#D6CCA3', material: 'PLA Wood' },
  { name: 'Ochre Yellow', hex: '#C98935', material: 'PLA Wood' },
  { name: 'White', hex: '#FFFFFF', material: 'PLA Tough' },
  { name: 'Gray', hex: '#AFB1AE', material: 'PLA Tough' },
  { name: 'Black', hex: '#000000', material: 'PLA Tough' },
  { name: 'Silver', hex: '#959698', material: 'PLA Tough' },
  { name: 'Yellow', hex: '#F4D53F', material: 'PLA Tough' },
  { name: 'Cyan', hex: '#009BD8', material: 'PLA Tough' },
  { name: 'Orange', hex: '#DC3A27', material: 'PLA Tough' },
  { name: 'Burgundy Red', hex: '#951E23', material: 'PLA-CF' },
  { name: 'Iris Purple', hex: '#69398E', material: 'PLA-CF' },
  { name: 'Matcha Green', hex: '#5C9748', material: 'PLA-CF' },
  { name: 'Jeans Blue', hex: '#6E88BC', material: 'PLA-CF' },
  { name: 'Royal Blue', hex: '#2842AD', material: 'PLA-CF' },
  { name: 'Lava Gray', hex: '#4D5054', material: 'PLA-CF' },
  { name: 'Black', hex: '#000000', material: 'PLA-CF' },
  { name: 'White', hex: '#FFFFFF', material: 'ABS' },
  { name: 'Desert Tan', hex: '#E8DBB7', material: 'ABS' },
  { name: 'Olive', hex: '#789D4A', material: 'ABS' },
  { name: 'Azure', hex: '#489FDF', material: 'ABS' },
  { name: 'Navy Blue', hex: '#0C2340', material: 'ABS' },
  { name: 'Blue', hex: '#0A2CA5', material: 'ABS' },
  { name: 'Tangerine Yellow', hex: '#FFC72C', material: 'ABS' },
  { name: 'Orange', hex: '#FF6A13', material: 'ABS' },
  { name: 'Red', hex: '#D32941', material: 'ABS' },
  { name: 'Purple', hex: '#AF1685', material: 'ABS' },
  { name: 'Silver', hex: '#87909A', material: 'ABS' },
  { name: 'Black', hex: '#000000', material: 'ABS' },
  { name: 'White', hex: '#FFFAF2', material: 'ASA' },
  { name: 'Gray', hex: '#8A949E', material: 'ASA' },
  { name: 'Red', hex: '#E02928', material: 'ASA' },
  { name: 'Green', hex: '#00A6A0', material: 'ASA' },
  { name: 'Blue', hex: '#2140B4', material: 'ASA' },
  { name: 'Black', hex: '#000000', material: 'ASA' },
  { name: 'Yellow', hex: '#FFD00B', material: 'PETG HF' },
  { name: 'Orange', hex: '#F75403', material: 'PETG HF' },
  { name: 'Green', hex: '#00AE42', material: 'PETG HF' },
  { name: 'Red', hex: '#EB3A3A', material: 'PETG HF' },
  { name: 'Blue', hex: '#002E96', material: 'PETG HF' },
  { name: 'Black', hex: '#000000', material: 'PETG HF' },
  { name: 'White', hex: '#FFFFFF', material: 'PETG HF' },
  { name: 'Cream', hex: '#F9DFB9', material: 'PETG HF' },
  { name: 'Lime Green', hex: '#6EE53C', material: 'PETG HF' },
  { name: 'Forest Green', hex: '#39541A', material: 'PETG HF' },
  { name: 'Lake Blue', hex: '#1F79E5', material: 'PETG HF' },
  { name: 'Peanut Brown', hex: '#875718', material: 'PETG HF' },
  { name: 'Gray', hex: '#ADB1B2', material: 'PETG HF' },
  { name: 'Dark Gray', hex: '#515151', material: 'PETG HF' },
  { name: 'Translucent Gray', hex: '#8E8E8E', material: 'PETG Translucent' },
  { name: 'Translucent Light Blue', hex: '#61B0FF', material: 'PETG Translucent' },
  { name: 'Translucent Olive', hex: '#748C45', material: 'PETG Translucent' },
  { name: 'Translucent Brown', hex: '#C9A381', material: 'PETG Translucent' },
  { name: 'Translucent Teal', hex: '#77EDD7', material: 'PETG Translucent' },
  { name: 'Translucent Orange', hex: '#FF911A', material: 'PETG Translucent' },
  { name: 'Translucent Purple', hex: '#D6ABFF', material: 'PETG Translucent' },
  { name: 'Translucent Pink', hex: '#F9C1BD', material: 'PETG Translucent' },
  { name: 'Brick Red', hex: '#9F332A', material: 'PETG-CF' },
  { name: 'Violet Purple', hex: '#583061', material: 'PETG-CF' },
  { name: 'Indigo Blue', hex: '#324585', material: 'PETG-CF' },
  { name: 'Malachite Green', hex: '#16B08E', material: 'PETG-CF' },
  { name: 'Black', hex: '#000000', material: 'PETG-CF' },
  { name: 'Titan Gray', hex: '#565656', material: 'PETG-CF' },
  { name: 'White', hex: '#FFFFFF', material: 'TPU 95A' },
  { name: 'Yellow', hex: '#F3E600', material: 'TPU 95A' },
  { name: 'Blue', hex: '#0072CE', material: 'TPU 95A' },
  { name: 'Red', hex: '#C8102E', material: 'TPU 95A' },
  { name: 'Gray', hex: '#898D8D', material: 'TPU 95A' },
  { name: 'Black', hex: '#101820', material: 'TPU 95A' },
  { name: 'Black', hex: '#000000', material: 'TPU 90A' },
  { name: 'White', hex: '#FFFFFF', material: 'TPU 90A' },
  { name: 'Grape Jelly', hex: '#D6ABFF', material: 'TPU 90A' },
  { name: 'Crystal Blue', hex: '#7EB4E1', material: 'TPU 90A' },
  { name: 'Cocoa Brown', hex: '#5C4738', material: 'TPU 90A' },
  { name: 'Black', hex: '#1A1A1A', material: 'PAHT-CF' },
  { name: 'Natural', hex: '#F5F5DC', material: 'PLA Support' },
  { name: 'Natural', hex: '#F5F5DC', material: 'PVA Support' },
  { name: 'Bambu Green', hex: '#00AE42', material: 'ABS' },
  { name: 'Beige', hex: '#DFD1A7', material: 'ABS' },
  { name: 'Lavender', hex: '#7248BD', material: 'ABS' },
  { name: 'Mint', hex: '#7AE1BF', material: 'ABS' },
  { name: 'Yellow', hex: '#FCE900', material: 'ABS' },
  { name: 'Black', hex: '#000000', material: 'ABS-GF' },
  { name: 'Blue', hex: '#0C3B95', material: 'ABS-GF' },
  { name: 'Gray', hex: '#C6C6C6', material: 'ABS-GF' },
  { name: 'Green', hex: '#61BF36', material: 'ABS-GF' },
  { name: 'Orange', hex: '#F48438', material: 'ABS-GF' },
  { name: 'Red', hex: '#E83100', material: 'ABS-GF' },
  { name: 'White', hex: '#FFFFFF', material: 'ABS-GF' },
  { name: 'Yellow', hex: '#FFE133', material: 'ABS-GF' },
  { name: 'White', hex: '#F5F1DD', material: 'ASA Aero' },
  { name: 'Black', hex: '#000000', material: 'ASA-CF' },
  { name: 'Black', hex: '#000000', material: 'PA6-CF' },
  { name: 'Black', hex: '#000000', material: 'PA6-GF' },
  { name: 'Blue', hex: '#75AED8', material: 'PA6-GF' },
  { name: 'Brown', hex: '#5B492F', material: 'PA6-GF' },
  { name: 'Gray', hex: '#353533', material: 'PA6-GF' },
  { name: 'Lime', hex: '#C5ED48', material: 'PA6-GF' },
  { name: 'Orange', hex: '#FF4800', material: 'PA6-GF' },
  { name: 'White', hex: '#EAEAE4', material: 'PA6-GF' },
  { name: 'Yellow', hex: '#FFCE00', material: 'PA6-GF' },
  { name: 'Black', hex: '#000000', material: 'PC' },
  { name: 'Clear Black', hex: '#686865', material: 'PC' },
  { name: 'Transparent', hex: '#FFFFFF', material: 'PC' },
  { name: 'Black', hex: '#000000', material: 'PC FR' },
  { name: 'Gray', hex: '#A8A8AA', material: 'PC FR' },
  { name: 'White', hex: '#FFFFFF', material: 'PC FR' },
  { name: 'Black', hex: '#000000', material: 'PET-CF' },
  { name: 'Black', hex: '#000000', material: 'PETG Basic' },
  { name: 'Dark Beige', hex: '#DBC8B6', material: 'PETG Basic' },
  { name: 'Dark Brown', hex: '#4F2C1D', material: 'PETG Basic' },
  { name: 'Gray', hex: '#7F7E83', material: 'PETG Basic' },
  { name: 'Green', hex: '#009639', material: 'PETG Basic' },
  { name: 'Misty Blue', hex: '#688197', material: 'PETG Basic' },
  { name: 'Navy Blue', hex: '#0086D6', material: 'PETG Basic' },
  { name: 'Orange', hex: '#FF671F', material: 'PETG Basic' },
  { name: 'Pine Green', hex: '#034638', material: 'PETG Basic' },
  { name: 'Red', hex: '#D6001C', material: 'PETG Basic' },
  { name: 'Reflex Blue', hex: '#001489', material: 'PETG Basic' },
  { name: 'White', hex: '#FFFFFF', material: 'PETG Basic' },
  { name: 'Yellow', hex: '#FCE300', material: 'PETG Basic' },
  { name: 'Red', hex: '#BC0900', material: 'PETG HF' },
  { name: 'Clear', hex: '#FFFFFF', material: 'PETG Translucent' },
  { name: 'Black', hex: '#000000', material: 'PLA Aero' },
  { name: 'Gray', hex: '#CDCECA', material: 'PLA Aero' },
  { name: 'White', hex: '#FFFFFF', material: 'PLA Aero' },
  { name: 'Green', hex: '#164B35', material: 'PLA Basic' },
  { name: 'UV Color Changing - White to Coral', hex: '#FFFFFF', material: 'PLA Dynamic' },
  { name: 'Black', hex: '#000000', material: 'PLA Lite' },
  { name: 'Blue', hex: '#004EA8', material: 'PLA Lite' },
  { name: 'Cocoa Brown', hex: '#745335', material: 'PLA Lite' },
  { name: 'Cyan', hex: '#4DAFDA', material: 'PLA Lite' },
  { name: 'Dark Gray', hex: '#8C8B8C', material: 'PLA Lite' },
  { name: 'Gray', hex: '#999D9D', material: 'PLA Lite' },
  { name: 'Green', hex: '#00BB31', material: 'PLA Lite' },
  { name: 'Matte Beige', hex: '#ECC3B2', material: 'PLA Lite' },
  { name: 'Orange', hex: '#FF671F', material: 'PLA Lite' },
  { name: 'Red', hex: '#C6001A', material: 'PLA Lite' },
  { name: 'Sunflower Yellow', hex: '#FFB549', material: 'PLA Lite' },
  { name: 'White', hex: '#FFFFFF', material: 'PLA Lite' },
  { name: 'Yellow', hex: '#EFE255', material: 'PLA Lite' },
  { name: 'Blue', hex: '#147BD1', material: 'PLA Silk' },
  { name: 'Copper', hex: '#5E4B3C', material: 'PLA Silk' },
  { name: 'Gold', hex: '#E5B03D', material: 'PLA Silk' },
  { name: 'Green', hex: '#4CE4A0', material: 'PLA Silk' },
  { name: 'Pink', hex: '#EEB1C1', material: 'PLA Silk' },
  { name: 'Purple', hex: '#854CE4', material: 'PLA Silk' },
  { name: 'Silver', hex: '#EAECEB', material: 'PLA Silk' },
  { name: 'Baby Blue', hex: '#A8C6EE', material: 'PLA Silk+' },
  { name: 'Blue', hex: '#008BDA', material: 'PLA Silk+' },
  { name: 'Candy Green', hex: '#018814', material: 'PLA Silk+' },
  { name: 'Candy Red', hex: '#D02727', material: 'PLA Silk+' },
  { name: 'Champagne', hex: '#F3CFB2', material: 'PLA Silk+' },
  { name: 'Gold', hex: '#F4A925', material: 'PLA Silk+' },
  { name: 'Mint', hex: '#96DCB9', material: 'PLA Silk+' },
  { name: 'Pink', hex: '#F7ADA6', material: 'PLA Silk+' },
  { name: 'Purple', hex: '#8671CB', material: 'PLA Silk+' },
  { name: 'Rose Gold', hex: '#BA9594', material: 'PLA Silk+' },
  { name: 'Silver', hex: '#C8C8C8', material: 'PLA Silk+' },
  { name: 'Titan Gray', hex: '#5F6367', material: 'PLA Silk+' },
  { name: 'White', hex: '#FFFFFF', material: 'PLA Silk+' },
  { name: 'Black', hex: '#25282A', material: 'PLA Tough' },
  { name: 'Gray', hex: '#515A6C', material: 'PLA Tough' },
  { name: 'Lavender Blue', hex: '#6667AB', material: 'PLA Tough' },
  { name: 'Light Blue', hex: '#0085AD', material: 'PLA Tough' },
  { name: 'Orange', hex: '#FF7F41', material: 'PLA Tough' },
  { name: 'Pine Green', hex: '#00482B', material: 'PLA Tough' },
  { name: 'Silver', hex: '#898D8D', material: 'PLA Tough' },
  { name: 'Vermilion Red', hex: '#DD3C22', material: 'PLA Tough' },
  { name: 'White', hex: '#F9F7F4', material: 'PLA Tough' },
  { name: 'Yellow', hex: '#FEDB00', material: 'PLA Tough' },
  { name: 'Black', hex: '#000000', material: 'PLA Tough+' },
  { name: 'Cyan', hex: '#009BD8', material: 'PLA Tough+' },
  { name: 'Gray', hex: '#AFB1AE', material: 'PLA Tough+' },
  { name: 'Orange', hex: '#DC3A27', material: 'PLA Tough+' },
  { name: 'Silver', hex: '#959698', material: 'PLA Tough+' },
  { name: 'White', hex: '#FFFFFF', material: 'PLA Tough+' },
  { name: 'Yellow', hex: '#F4D53F', material: 'PLA Tough+' },
  { name: 'Black', hex: '#000000', material: 'PPA-CF' },
  { name: 'Black', hex: '#000000', material: 'PPS-CF' },
  { name: 'Clear', hex: '#F0F1A8', material: 'PVA' },
  { name: 'White', hex: '#FFFFFF', material: 'Support for ABS' },
  { name: 'Green', hex: '#C0DF16', material: 'Support for PA/PET' },
  { name: 'Black', hex: '#000000', material: 'Support for PLA' },
  { name: 'White', hex: '#FFFFFF', material: 'Support for PLA' },
  { name: 'Nature', hex: '#000000', material: 'Support for PLA/PETG' },
  { name: 'Black', hex: '#000000', material: 'TPU 85A' },
  { name: 'Flesh', hex: '#F3CFB2', material: 'TPU 85A' },
  { name: 'Light Cyan', hex: '#C3E2D6', material: 'TPU 85A' },
  { name: 'Lime Green', hex: '#CDEA80', material: 'TPU 85A' },
  { name: 'Neon Orange', hex: '#F68B1B', material: 'TPU 85A' },
  { name: 'Quicksilver', hex: '#9EA2A2', material: 'TPU 90A' },
  { name: 'Black', hex: '#000000', material: 'TPU 95A' },
  { name: 'Black', hex: '#101820', material: 'TPU 95A HF' },
  { name: 'Blue', hex: '#0072CE', material: 'TPU 95A HF' },
  { name: 'Gray', hex: '#898D8D', material: 'TPU 95A HF' },
  { name: 'Red', hex: '#C8102E', material: 'TPU 95A HF' },
  { name: 'White', hex: '#FFFFFF', material: 'TPU 95A HF' },
  { name: 'Yellow', hex: '#F3E600', material: 'TPU 95A HF' },
  { name: 'Black', hex: '#000000', material: 'TPU for AMS' },
  { name: 'Blue', hex: '#5898DD', material: 'TPU for AMS' },
  { name: 'Gray', hex: '#939393', material: 'TPU for AMS' },
  { name: 'Neon Green', hex: '#90FF1A', material: 'TPU for AMS' },
  { name: 'Red', hex: '#ED0000', material: 'TPU for AMS' },
  { name: 'White', hex: '#FFFFFF', material: 'TPU for AMS' },
  { name: 'Yellow', hex: '#F9EF41', material: 'TPU for AMS' },
]

const BAMBU_ENCODED_MULTI_COLORS = [
  { trayInfoIdx: 'GFA00', material: 'PLA Basic', name: 'Arctic Whisper', colors: ['#FFFFFF', '#9CDBD9'], trayCodeAliases: ['A00-G0'] },
  { trayInfoIdx: 'GFA00', material: 'PLA Basic', name: 'Solar Breeze', colors: ['#E94B3C', '#FFFFFF'], trayCodeAliases: ['A00-G1'] },
  { trayInfoIdx: 'GFA00', material: 'PLA Basic', name: 'Ocean to Meadow', colors: ['#307FE2', '#54FF9B'], trayCodeAliases: ['A00-G2'] },
  { trayInfoIdx: 'GFA00', material: 'PLA Basic', name: 'Pink Citrus', colors: ['#F78F77', '#E4505A'], trayCodeAliases: ['A00-G3'] },
  { trayInfoIdx: 'GFA00', material: 'PLA Basic', name: 'Mint Lime', colors: ['#4EC939', '#B6FF43'], trayCodeAliases: ['A00-G4'] },
  { trayInfoIdx: 'GFA00', material: 'PLA Basic', name: 'Blueberry Bubblegum', colors: ['#6FCAEF', '#8573DD'], trayCodeAliases: ['A00-G5'] },
  { trayInfoIdx: 'GFA00', material: 'PLA Basic', name: 'Dusk Glare', colors: ['#CE4406', '#ED9558'], trayCodeAliases: ['A00-G6'] },
  { trayInfoIdx: 'GFA00', material: 'PLA Basic', name: 'Cotton Candy Cloud', colors: ['#8EC9E9', '#E7C1D5'], trayCodeAliases: ['A00-G7'] },
  { trayInfoIdx: 'GFA05', material: 'PLA Silk', name: 'Gilded Rose', colors: ['#FF9425', '#C16784'] },
  { trayInfoIdx: 'GFA05', material: 'PLA Silk', name: 'Midnight Blaze', colors: ['#0047BB', '#7D1B49'] },
  { trayInfoIdx: 'GFA05', material: 'PLA Silk', name: 'Neon City', colors: ['#BB22A3', '#0047BB'], trayCodeAliases: ['A05-T3'] },
  { trayInfoIdx: 'GFA05', material: 'PLA Silk', name: 'Blue Hawaii', colors: ['#70C884', '#418FDE'] },
  { trayInfoIdx: 'GFA05', material: 'PLA Silk', name: 'Velvet Eclipse (Black-Red)', colors: ['#000000', '#A34342'] },
  { trayInfoIdx: 'GFA05', material: 'PLA Silk', name: 'South Beach', colors: ['#00918B', '#F772A4'], trayCodeAliases: ['A05-M1'] },
  { trayInfoIdx: 'GFA05', material: 'PLA Silk', name: 'Aurora Purple', colors: ['#7F3696', '#006EC9'] },
  { trayInfoIdx: 'GFA05', material: 'PLA Silk', name: 'Dawn Radiance', colors: ['#EC984C', '#6CD4BC', '#A66EB9', '#D87694'] },
  { trayInfoIdx: 'GFA05', material: 'PLA Silk', name: 'Mystic Magenta', colors: ['#720062', '#3A913F'] },
  { trayInfoIdx: 'GFA05', material: 'PLA Silk', name: 'Phantom Blue', colors: ['#000000', '#00629B'] },
  { trayInfoIdx: 'GFU03', material: 'TPU 90A', name: 'Frozen', colors: ['#FFFFFF', '#40B6E4'] },
  { trayInfoIdx: 'GFU03', material: 'TPU 90A', name: 'Blaze', colors: ['#D21B3C', '#F1AAA8'] },
]

const BAMBU_MULTI_COLOR_LOOKUP = new Map(
  BAMBU_ENCODED_MULTI_COLORS.map((entry) => [
    `${entry.trayInfoIdx}|${entry.colors.join('|')}`,
    entry,
  ])
)

const BAMBU_MULTI_COLOR_ALIAS_LOOKUP = new Map(
  BAMBU_ENCODED_MULTI_COLORS.flatMap((entry) =>
    (entry.trayCodeAliases ?? []).map((alias) => [`${entry.trayInfoIdx}|${alias.toUpperCase()}`, entry])
  )
)

const GENERIC_FILAMENT_LABELS = new Set([
  'ABS',
  'ABS-GF',
  'ASA',
  'ASA AERO',
  'ASA-CF',
  'PA',
  'PA6-CF',
  'PA6-GF',
  'PAHT-CF',
  'PC',
  'PC FR',
  'PC-FR',
  'PET-CF',
  'PETG',
  'PETG BASIC',
  'PETG HF',
  'PETG TRANSLUCENT',
  'PETG-CF',
  'PLA',
  'PLA AERO',
  'PLA DYNAMIC',
  'PLA GALAXY',
  'PLA GLOW',
  'PLA LITE',
  'PLA MARBLE',
  'PLA MATTE',
  'PLA METAL',
  'PLA SILK',
  'PLA SILK+',
  'PLA SPARKLE',
  'PLA TOUGH',
  'PLA TOUGH+',
  'PLA WOOD',
  'PLA-CF',
  'PPA-CF',
  'PPS-CF',
  'PVA',
  'TPU',
  'TPU 85A',
  'TPU 90A',
  'TPU 95A',
  'TPU 95A HF',
  'TPU FOR AMS',
])

function bambuMaterialFromPresetName(name) {
  const upper = String(name ?? '').toUpperCase()
  if (upper.includes('SUPPORT FOR PLA/PETG')) return 'Support for PLA/PETG'
  if (upper.includes('SUPPORT FOR PA/PET')) return 'Support for PA/PET'
  if (upper.includes('SUPPORT FOR ABS')) return 'Support for ABS'
  if (upper.includes('SUPPORT FOR PLA')) return 'Support for PLA'
  if (upper.includes('PLA-CF') || upper.includes('PLA CF')) return 'PLA-CF'
  if (upper.includes('PETG-CF') || upper.includes('PETG CF')) return 'PETG-CF'
  if (upper.includes('PET-CF') || upper.includes('PET CF')) return 'PET-CF'
  if (upper.includes('ASA AERO')) return 'ASA Aero'
  if (upper.includes('ASA-CF') || upper.includes('ASA CF')) return 'ASA-CF'
  if (upper.includes('ABS-GF') || upper.includes('ABS GF')) return 'ABS-GF'
  if (upper.includes('PA6-GF') || upper.includes('PA6 GF')) return 'PA6-GF'
  if (upper.includes('PA6-CF') || upper.includes('PA6 CF')) return 'PA6-CF'
  if (upper.includes('PPA-CF') || upper.includes('PPA CF')) return 'PPA-CF'
  if (upper.includes('PPS-CF') || upper.includes('PPS CF')) return 'PPS-CF'
  if (upper.includes('PC FR') || upper.includes('PC-FR')) return 'PC FR'
  if (upper.includes('PC')) return 'PC'
  if (upper.includes('PETG TRANSLUCENT')) return 'PETG Translucent'
  if (upper.includes('PETG BASIC')) return 'PETG Basic'
  if (upper.includes('PETG HF')) return 'PETG HF'
  if (upper.includes('PLA TRANSLUCENT')) return 'PLA Translucent'
  if (upper.includes('PLA SILK+')) return 'PLA Silk+'
  if (upper.includes('PLA TOUGH+')) return 'PLA Tough+'
  if (upper.includes('PLA MATTE')) return 'PLA Matte'
  if (upper.includes('PLA METAL')) return 'PLA Metal'
  if (upper.includes('PLA SILK')) return 'PLA Silk'
  if (upper.includes('PLA SPARKLE')) return 'PLA Sparkle'
  if (upper.includes('PLA MARBLE')) return 'PLA Marble'
  if (upper.includes('PLA GLOW')) return 'PLA Glow'
  if (upper.includes('PLA GALAXY')) return 'PLA Galaxy'
  if (upper.includes('PLA WOOD')) return 'PLA Wood'
  if (upper.includes('PLA AERO')) return 'PLA Aero'
  if (upper.includes('PLA DYNAMIC')) return 'PLA Dynamic'
  if (upper.includes('PLA LITE')) return 'PLA Lite'
  if (upper.includes('PLA TOUGH')) return 'PLA Tough'
  if (upper.includes('PLA BASIC') || upper.includes('PLA HIGH SPEED') || upper === 'GENERIC PLA' || upper.includes('GENERIC PLA')) return 'PLA Basic'
  if (upper.includes('TPU FOR AMS')) return 'TPU for AMS'
  if (upper.includes('TPU 95') && upper.includes('HF')) return 'TPU 95A HF'
  if (upper.includes('TPU 90')) return 'TPU 90A'
  if (upper.includes('TPU 85')) return 'TPU 85A'
  if (upper.includes('TPU')) return 'TPU 95A'
  if (upper.includes('PETG')) return 'PETG HF'
  if (upper.includes('ABS')) return 'ABS'
  if (upper.includes('ASA')) return 'ASA'
  if (upper.includes('PAHT-CF') || upper.includes('PAHT CF')) return 'PAHT-CF'
  if (upper.includes('PA') && (upper.includes('CF') || upper.includes('GF') || upper.includes('PAHT') || upper.includes('PA6'))) return 'PAHT-CF'
  if (upper.includes('PVA')) return 'PVA'
  if (upper.includes('SUPPORT')) return 'PLA Support'
  return null
}

function bambuMaterialFromType(type) {
  const upper = String(type ?? '').toUpperCase()
  if (upper === 'PLA-S') return 'Support for PLA'
  if (upper === 'PLA-CF') return 'PLA-CF'
  if (upper === 'PETG-CF') return 'PETG-CF'
  if (upper === 'PET-CF') return 'PET-CF'
  if (upper === 'PETG BASIC') return 'PETG Basic'
  if (upper === 'PETG' || upper === 'PCTG' || upper === 'PETG-ESD') return 'PETG HF'
  if (upper === 'PETG TRANSLUCENT') return 'PETG Translucent'
  if (upper === 'PLA') return 'PLA Basic'
  if (upper === 'PLA AERO') return 'PLA Aero'
  if (upper === 'PLA DYNAMIC') return 'PLA Dynamic'
  if (upper === 'PLA LITE') return 'PLA Lite'
  if (upper === 'PLA SILK+') return 'PLA Silk+'
  if (upper === 'PLA TOUGH+') return 'PLA Tough+'
  if (upper === 'PLA TOUGH') return 'PLA Tough'
  if (upper === 'ABS-GF') return 'ABS-GF'
  if (upper === 'ABS') return 'ABS'
  if (upper === 'ASA AERO') return 'ASA Aero'
  if (upper === 'ASA-CF') return 'ASA-CF'
  if (upper === 'ASA') return 'ASA'
  if (upper === 'PC FR' || upper === 'PC-FR') return 'PC FR'
  if (upper === 'PC') return 'PC'
  if (upper === 'PVA') return 'PVA'
  if (upper === 'TPU 85A') return 'TPU 85A'
  if (upper === 'TPU 90A') return 'TPU 90A'
  if (upper === 'TPU 95A') return 'TPU 95A'
  if (upper === 'TPU 95A HF') return 'TPU 95A HF'
  if (upper === 'TPU') return 'TPU 95A'
  if (upper === 'TPU FOR AMS') return 'TPU for AMS'
  if (upper === 'SUPPORT FOR ABS') return 'Support for ABS'
  if (upper === 'SUPPORT FOR PA/PET') return 'Support for PA/PET'
  if (upper === 'SUPPORT FOR PLA') return 'Support for PLA'
  if (upper === 'SUPPORT FOR PLA/PETG') return 'Support for PLA/PETG'
  if (upper === 'PAHT-CF') return 'PAHT-CF'
  if (upper === 'PA6-CF') return 'PA6-CF'
  if (upper === 'PA6-GF') return 'PA6-GF'
  if (upper === 'PPA-CF') return 'PPA-CF'
  if (upper === 'PPS-CF') return 'PPS-CF'
  if (upper.startsWith('PA')) return 'PAHT-CF'
  return null
}

function bambuSwatchForHex(hex, material = null) {
  const normalized = normalizeHexColor(hex)
  if (!normalized) return null
  if (material) {
    const materialMatch = BAMBU_COLOR_SWATCHES.find((swatch) => swatch.material === material && swatch.hex === normalized)
    if (materialMatch) return materialMatch
  }
  return BAMBU_COLOR_SWATCHES.find((swatch) => swatch.hex === normalized) ?? null
}

function findBambuEncodedMultiColor(trayInfoIdx, colors) {
  const normalizedTrayInfoIdx = String(trayInfoIdx ?? '').trim().toUpperCase()
  if (!normalizedTrayInfoIdx) return null
  const palette = (colors ?? []).map((entry) => normalizeHexColor(entry)).filter(Boolean)
  if (palette.length < 2) return null
  return BAMBU_MULTI_COLOR_LOOKUP.get(`${normalizedTrayInfoIdx}|${palette.join('|')}`) ?? null
}

function findBambuEncodedMultiColorAlias(trayInfoIdx, trayName) {
  const normalizedTrayInfoIdx = String(trayInfoIdx ?? '').trim().toUpperCase()
  const normalizedTrayName = String(trayName ?? '').trim().toUpperCase()
  if (!normalizedTrayInfoIdx || !normalizedTrayName) return null
  return BAMBU_MULTI_COLOR_ALIAS_LOOKUP.get(`${normalizedTrayInfoIdx}|${normalizedTrayName}`) ?? null
}

function resolveBambuMaterial(filamentType) {
  const value = String(filamentType ?? '').trim()
  if (!value) return null
  return bambuMaterialFromPresetName(value) ?? bambuMaterialFromType(value)
}

function normalizePalette(colors, fallbackColor) {
  const normalized = (colors ?? []).map((entry) => normalizeHexColor(entry)).filter(Boolean)
  const unique = normalized.filter((entry, index) => normalized.indexOf(entry) === index)
  if (unique.length > 0) return unique
  const fallback = normalizeHexColor(fallbackColor)
  return fallback ? [fallback] : []
}

function resolveMaterialFallbackName(material, filamentType) {
  if (!material) return null
  const normalizedType = String(filamentType ?? '').trim().toUpperCase()
  if (normalizedType === 'PLA-S' && material === 'Support for PLA') return material
  if (normalizedType === 'SUPPORT' && material.includes('Support')) return material
  return null
}

function shouldSuppressRepeatedTrayLabel(trayName, filamentType) {
  if (trayName.localeCompare(filamentType, undefined, { sensitivity: 'accent' }) !== 0) return false
  return GENERIC_FILAMENT_LABELS.has(filamentType.trim().toUpperCase())
}

function resolveExactFilamentDisplay(input) {
  const material = resolveBambuMaterial(input?.filamentType)
  const palette = normalizePalette(input?.colors, input?.color)
  const primaryColor = normalizeHexColor(input?.color) || palette[0] || null
  const trayCode = normalizeTrayCode(input?.trayName)
  const trayInfoIdx = String(input?.trayInfoIdx ?? '').trim().toUpperCase()

  if (trayInfoIdx && palette.length > 1) {
    const encoded = findBambuEncodedMultiColor(trayInfoIdx, palette)
      ?? (trayCode ? findBambuEncodedMultiColorAlias(trayInfoIdx, trayCode) : null)
    if (encoded) {
      return { name: encoded.name, material, colors: encoded.colors, rawTrayCode: trayCode }
    }
  }

  const swatch = bambuSwatchForHex(primaryColor, material)
  if (swatch) {
    return {
      name: swatch.name,
      material,
      colors: palette.length > 0 ? palette : [swatch.hex],
      rawTrayCode: trayCode,
    }
  }

  const trayName = String(input?.trayName ?? '').trim()
  const filamentType = String(input?.filamentType ?? '').trim()
  if (!trayName) return { name: null, material, colors: palette, rawTrayCode: null }
  if (filamentType && shouldSuppressRepeatedTrayLabel(trayName, filamentType)) {
    return { name: null, material, colors: palette, rawTrayCode: null }
  }
  if (trayCode) {
    return {
      name: resolveMaterialFallbackName(material, filamentType),
      material,
      colors: palette,
      rawTrayCode: trayCode,
    }
  }
  return { name: trayName, material, colors: palette, rawTrayCode: trayCode }
}

function resolveFilamentDisplayName(item) {
  const resolved = resolveExactFilamentDisplay({
    color: item?.colorHex || item?.color,
    colors: item?.colors,
    trayName: item?.trayName ?? item?.tray_name,
    trayInfoIdx: item?.trayInfoIdx ?? item?.tray_info_idx,
    filamentType: item?.filamentType ?? item?.filament_type,
  })
  if (resolved.name) return resolved.name

  if (typeof item?.displayName === 'string' && item.displayName.trim() && !isRawTrayCode(item.displayName)) {
    return item.displayName.trim()
  }
  if (typeof item?.colorName === 'string' && item.colorName.trim()) return item.colorName.trim()
  return null
}

function resolveFilamentSubline(item) {
  const displayName = resolveFilamentDisplayName(item)
  const filamentType = typeof item?.filamentType === 'string' && item.filamentType.trim() && item.filamentType !== '0'
    ? item.filamentType.trim()
    : null
  return { filamentType, displayName }
}

function displayMediaUrl(media) {
  if (!media) return null
  if (media.failed) return null
  return media.displaySrc || null
}

function progressFillColor(state) {
  switch (state) {
    case 'paused':
      return '#ffbf52'
    case 'failed':
      return '#ff6b6b'
    case 'finished':
      return '#63d58b'
    case 'printing':
    case 'preparing':
    case 'heating':
    default:
      return '#5aa7ff'
  }
}

function mediaUrlWithVersion(url, version) {
  if (!url) return null
  if (!version) return url
  const joiner = url.includes('?') ? '&' : '?'
  return `${url}${joiner}t=${encodeURIComponent(version)}`
}

function wrapMediaAction(content, entityId, label, options = {}) {
  const className = ['media-action', options.className].filter(Boolean).join(' ')
  const mediaKindAttr = options.mediaKind ? ` data-media-kind="${escapeHtml(options.mediaKind)}"` : ''
  if (!entityId) return content
  return `
    <button class="${escapeHtml(className)}" type="button" data-more-info-entity="${escapeHtml(entityId)}"${mediaKindAttr} aria-label="Open ${escapeHtml(label)} entity">
      ${content}
    </button>`
}

const DEFAULT_PRINTER_CARD_CONTENT_SETTINGS = {
  nozzleTemperatures: true,
  bedTemperature: true,
  chamberTemperature: true,
  printSpeed: true,
  printStatus: true,
  doorState: false,
  ductState: false,
  modelThumbnail: true,
  cameraThumbnail: true,
  amsCards: true,
  externalSpools: false,
  rescanIcons: true,
  footerControls: true,
}

const PRINTER_CONTENT_OPTIONS = [
  ['nozzleTemperatures', 'Nozzle temps'],
  ['bedTemperature', 'Bed temp'],
  ['chamberTemperature', 'Chamber temp'],
  ['printSpeed', 'Print speed'],
  ['printStatus', 'Print status'],
  ['doorState', 'Door state'],
  ['ductState', 'Duct state'],
  ['modelThumbnail', 'Model thumbnail'],
  ['cameraThumbnail', 'Camera thumbnail'],
  ['amsCards', 'AMS cards'],
  ['externalSpools', 'External spools'],
  ['rescanIcons', 'Rescan icons'],
  ['footerControls', 'Footer actions'],
]

const AMS_CONTENT_OPTIONS = [
  ['rescanIcons', 'Rescan icons'],
]

const CAMERA_MODELS = new Set(['X1C', 'X1E', 'X2D', 'P1S', 'P2S', 'P1P', 'A1', 'A1mini', 'A2L', 'H2D', 'H2DPRO', 'H2C', 'H2S'])
const DOOR_SENSOR_MODELS = new Set(['X1C', 'X1E', 'X2D', 'P2S', 'H2D', 'H2DPRO', 'H2C', 'H2S'])
const AIRDUCT_MODELS = new Set(['X2D', 'P2S', 'H2D', 'H2DPRO', 'H2C', 'H2S'])
const CHAMBER_TEMPERATURE_MODELS = new Set(['X1E', 'H2D', 'H2DPRO', 'H2C', 'H2S'])
const BAMBU_STUDIO_SUB_STAGE_LABELS = {
  1: 'Auto bed leveling',
  2: 'Heatbed preheating',
  3: 'Vibration compensation',
  4: 'Changing filament',
  5: 'M400 pause',
  6: 'Paused (filament ran out)',
  7: 'Heating nozzle',
  8: 'Calibrating dynamic flow',
  9: 'Scanning bed surface',
  10: 'Inspecting first layer',
  11: 'Identifying build plate type',
  12: 'Calibrating Micro Lidar',
  13: 'Homing toolhead',
  14: 'Cleaning nozzle tip',
  15: 'Checking extruder temperature',
  16: 'Paused by the user',
  17: 'Pause (front cover fall off)',
  18: 'Calibrating the micro lidar',
  19: 'Calibrating flow ratio',
  20: 'Pause (nozzle temperature malfunction)',
  21: 'Pause (heatbed temperature malfunction)',
  22: 'Filament unloading',
  23: 'Pause (step loss)',
  24: 'Filament loading',
  25: 'Motor noise cancellation',
  26: 'Pause (AMS offline)',
  27: 'Pause (low speed of the heatbreak fan)',
  28: 'Pause (chamber temperature control problem)',
  29: 'Cooling chamber',
  30: 'Pause (Gcode inserted by user)',
  31: 'Motor noise showoff',
  32: 'Pause (nozzle clumping)',
  33: 'Pause (cutter error)',
  34: 'Pause (first layer error)',
  35: 'Pause (nozzle clog)',
  36: 'Measuring motion percision',
  37: 'Enhancing motion percision',
  38: 'Measure motion accuracy',
  39: 'Nozzle offset calibration',
  40: 'high temperature auto bed levelling',
  41: 'Auto Check: Quick Release Lever',
  42: 'Auto Check: Door and Upper Cover',
  43: 'Laser Calibration',
  44: 'Auto Check: Platform',
  45: 'Confirming BirdsEye Camera location',
  46: 'Calibrating BirdsEye Camera',
  47: 'Auto bed leveling -phase 1',
  48: 'Auto bed leveling -phase 2',
  49: 'Heating chamber',
  50: 'Adjusting heatbed temperature',
  51: 'Printing calibration lines',
  52: 'Auto Check: Material',
  53: 'Live View Camera Calibration',
  54: 'Waiting for heatbed to reach target temperature',
  55: 'Auto Check: Material Position',
  56: 'Cutting Module Offset Calibration',
  57: 'Measuring Surface',
  58: 'Thermal Preconditioning for first layer optimization',
  59: 'Homing Blade Holder',
  60: 'Calibrating Camera Offset',
  61: 'Calibrating Blade Holder Position',
  62: 'Hotend Pick and Place Test',
  63: 'Waiting for the Chamber temperature to equalize',
  64: 'Preparing Hotend',
  65: 'Calibrating the detection position of nozzle clumping',
  66: 'Purifying the chamber air',
  67: 'Measuring Rotary Attachment',
  68: 'The toolhead moves above the purge chute',
  69: 'Cooling down the nozzle',
  70: 'The toolhead moves to the center of the heatbed',
  71: 'Active Arc Fitting',
  72: 'Hotend Type Detection',
  73: 'Build plate alignment detection',
  74: 'Heatbed surface foreign object detection',
  75: 'Heatbed underside foreign object detection',
  76: 'Pre-extrusion before printing',
  77: 'Preparing AMS',
}
// const PREPARATION_STAGE_LABEL_PATTERN = /\b(auto bed leveling|bed levelling|calibrat(?:e|ing|ion)|preheat(?:ing)?|heat(?:ing)?(?: nozzle| chamber| bed| heatbed)?|scann(?:ing)?|inspect(?:ing)?|identif(?:y|ying)|hom(?:e|ing)|clean(?:ing)?|check(?:ing)?|wait(?:ing)?|prepar(?:e|ing)|measur(?:e|ing)|cool(?:ing)? chamber|chang(?:e|ing) filament|filament (?:load|unload)(?:ing)?|motor noise|thermal preconditioning|pre extrusion|pre-extrusion|foreign object detection|build plate alignment|nozzle offset|purifying the chamber air|preparing ams)\b/i
const LAYER_SUB_STAGE_PATTERN = /^layer\s+\d+\s*\/\s*\d+$/i

function normalizePrinterModel(model) {
  return String(model ?? '').trim().toUpperCase()
}

function printerSupportsCamera(attrs) {
  if (typeof attrs?.supports_camera === 'boolean') return attrs.supports_camera
  if (attrs?.camera_supported != null) return Boolean(attrs.camera_supported)
  return CAMERA_MODELS.has(normalizePrinterModel(attrs?.printer_model))
}

function printerSupportsDoorSensor(attrs) {
  if (typeof attrs?.supports_door_sensor === 'boolean') return attrs.supports_door_sensor
  if (typeof attrs?.door_open === 'boolean') return true
  return DOOR_SENSOR_MODELS.has(normalizePrinterModel(attrs?.printer_model))
}

function printerSupportsAirductMode(attrs) {
  if (typeof attrs?.supports_airduct_mode === 'boolean') return attrs.supports_airduct_mode
  if (typeof attrs?.duct_mode === 'string' && attrs.duct_mode.trim()) return true
  if (Array.isArray(attrs?.duct_available_modes) && attrs.duct_available_modes.length > 0) return true
  return AIRDUCT_MODELS.has(normalizePrinterModel(attrs?.printer_model))
}

function printerSupportsChamberTemperature(attrs) {
  if (typeof attrs?.supports_chamber_temperature === 'boolean') return attrs.supports_chamber_temperature
  if (typeof attrs?.chamber_temp === 'number') return true
  return CHAMBER_TEMPERATURE_MODELS.has(normalizePrinterModel(attrs?.printer_model))
}

function shouldShowPrinterContentOption(key, attrs) {
  switch (key) {
    case 'doorState':
      return printerSupportsDoorSensor(attrs)
    case 'ductState':
      return printerSupportsAirductMode(attrs)
    case 'cameraThumbnail':
      return printerSupportsCamera(attrs)
    case 'chamberTemperature':
      return printerSupportsChamberTemperature(attrs)
    default:
      return true
  }
}

function normalizePrinterCardContentSettings(config) {
  const source = config?.content && typeof config.content === 'object' ? config.content : config
  const next = { ...DEFAULT_PRINTER_CARD_CONTENT_SETTINGS }
  for (const key of Object.keys(DEFAULT_PRINTER_CARD_CONTENT_SETTINGS)) {
    if (typeof source?.[key] === 'boolean') next[key] = source[key]
  }
  return next
}

function updatePrinterCardContentSettings(config, key, value) {
  return {
    ...config,
    content: {
      ...normalizePrinterCardContentSettings(config),
      [key]: value,
    },
  }
}

function normalizeStageComparison(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/[^a-z0-9() ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function formatStageText(raw) {
  const normalized = String(raw || '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!normalized) return ''

  return normalized.replace(/\b\w+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
}

function formatSecondaryStageLabel(state, attrs) {
  const raw = typeof attrs?.sub_stage === 'string' ? attrs.sub_stage.trim() : ''
  if (!raw || LAYER_SUB_STAGE_PATTERN.test(raw)) return null

  const numericCode = /^-?\d+$/.test(raw) ? Number(raw) : null
  const label = numericCode != null
    ? (BAMBU_STUDIO_SUB_STAGE_LABELS[numericCode] || '')
    : formatStageText(raw)

  if (!label) return null
  if (numericCode === 0 || numericCode === -1 || numericCode === 255) return null
  if (normalizeStageComparison(label) === normalizeStageComparison(state)) return null

  return label
}

// Mirror of the shared plate/job-name helpers (packages/shared/src/print-plate.ts
// and apps/web/src/lib/printerJobName.ts) so card titles present the same friendly
// label as the app: a raw dispatch subtask like "Model - plate_4" becomes
// "Model - Plate 4".
function parsePlatePositiveInteger(value) {
  const parsed = Number.parseInt(value == null ? '' : value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function platePathBasename(value) {
  const normalized = String(value).replace(/\\/g, '/').replace(/\/+$/, '')
  const slashIndex = normalized.lastIndexOf('/')
  return slashIndex >= 0 ? normalized.slice(slashIndex + 1) : normalized
}

function stripObservedPrintExtension(value) {
  return platePathBasename(String(value).trim().replace(/^file:\/\//i, ''))
    .replace(/\.(gcode(?:\.3mf)?|3mf)$/i, '')
}

function parseExplicitObservedPrintPlateIndex(value) {
  if (typeof value !== 'string' || value.trim().length === 0) return null
  const metadataMatch = value.match(/(?:^|\/)Metadata\/plate_(\d+)\.gcode$/i)
  if (metadataMatch) return parsePlatePositiveInteger(metadataMatch[1])
  const explicitPlateMatch = stripObservedPrintExtension(value).match(/(?:^|[ _-])plate[_ -]?(\d+)(?:$|[ _.-])/i)
  if (explicitPlateMatch) return parsePlatePositiveInteger(explicitPlateMatch[1])
  return null
}

function parseDelimitedObservedPlateIndex(value) {
  if (typeof value !== 'string' || value.trim().length === 0) return null
  const segments = stripObservedPrintExtension(value)
    .split(' - ')
    .map((segment) => segment.trim())
    .filter(Boolean)
  if (segments.length < 3) return null
  const numericSegments = segments
    .map((segment, index) => ({ segment, index }))
    .filter(({ segment, index }) => index > 0 && index < segments.length - 1 && /^\d+$/.test(segment))
  if (numericSegments.length !== 1) return null
  return parsePlatePositiveInteger(numericSegments[0] && numericSegments[0].segment)
}

function inferObservedPrintPlateIndexFromGcode(gcodeFile) {
  const explicitFilePlate = parseExplicitObservedPrintPlateIndex(gcodeFile)
  if (explicitFilePlate != null) return explicitFilePlate
  return parseDelimitedObservedPlateIndex(gcodeFile)
}

function normalizeFallbackPlateLabel(value) {
  const match = String(value).match(/^plate[_ -]?(\d+)$/i)
  if (!match) return value
  const plate = parsePlatePositiveInteger(match[1])
  return plate != null ? `Plate ${plate}` : value
}

function formatPrinterJobDisplayName(jobName, gcodeFile) {
  const normalizedJobName = typeof jobName === 'string' ? jobName.trim() : ''
  if (!normalizedJobName) return ''
  const splitIndex = normalizedJobName.lastIndexOf(' - ')
  if (splitIndex <= 0) return normalizedJobName
  const title = normalizedJobName.slice(0, splitIndex).trim()
  const rawPlateLabel = normalizedJobName.slice(splitIndex + 3).trim()
  if (!title || !rawPlateLabel) return normalizedJobName
  const inferredPlate = inferObservedPrintPlateIndexFromGcode(gcodeFile)
  const normalizedPlateLabel = normalizeFallbackPlateLabel(rawPlateLabel)
  if (normalizedPlateLabel === rawPlateLabel && inferredPlate == null) return normalizedJobName
  return `${title} - ${normalizedPlateLabel}`
}

function jobNameFor(attrs) {
  return formatPrinterJobDisplayName(attrs && attrs.job_name, attrs && attrs.gcode_file)
}

function lastJobNameFor(attrs) {
  return formatPrinterJobDisplayName(attrs && attrs.last_job_name, attrs && attrs.gcode_file)
}

function statusTone(state, attrs) {
  if (attrs?.online === false || state === 'offline') return 'neutral'
  switch (state) {
    case 'paused':
      return 'warning'
    case 'failed':
      return 'danger'
    case 'printing':
      return 'success'
    case 'preparing':
    case 'heating':
      return 'primary'
    case 'ready':
    case 'finished':
    case 'idle':
    case 'unknown':
    default:
      return 'neutral'
  }
}

function statusLabel(state, attrs) {
  if (!state) return 'Offline'
  if (state === 'offline') return 'Offline'
  if ((state === 'preparing' || state === 'heating') && attrs?.job_name === 'Calibration') {
    return attrs?.online === false ? 'Offline · Calibrating' : 'Calibrating'
  }
  const stage = state === 'finished' ? 'Idle' : humanize(state || 'unknown')
  return attrs?.online === false ? `Offline · ${stage}` : stage
}

function renderStatusChips(state, attrs) {
  const stageLabel = statusLabel(state, attrs)
  return `<div class="badge" data-tone="${statusTone(state, attrs)}">${escapeHtml(stageLabel)}</div>`
}

function fmtPct(value) {
  return typeof value === 'number' ? `${Math.round(value)}%` : null
}

function fmtTemp(value) {
  return typeof value === 'number' ? `${Math.round(value)}\u00b0C` : null
}

function fmtMinutes(value) {
  if (typeof value !== 'number') return null
  const minutes = Math.round(value)
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function fmtBoolean(value, truthy = 'On', falsy = 'Off') {
  return typeof value === 'boolean' ? (value ? truthy : falsy) : null
}

function fmtSpeed(value) {
  if (typeof value !== 'number') return null
  const map = { 1: 'Silent', 2: 'Standard', 3: 'Sport', 4: 'Ludicrous' }
  return map[value] || `Level ${value}`
}

// Mirror of the web app's time helpers (apps/web/src/lib/time.ts) so ETA labels
// on the cards match the in-app formatting (leading `~`, locale-aware clock).
const HA_TIME_FORMATTER = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' })
const HA_MONTH_DAY_TIME_FORMATTER = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
const HA_MONTH_DAY_YEAR_TIME_FORMATTER = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

function isSameDay(left, right) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate()
}

function isNextDay(left, right) {
  const nextDay = new Date(right)
  nextDay.setHours(0, 0, 0, 0)
  nextDay.setDate(nextDay.getDate() + 1)
  return left.getFullYear() === nextDay.getFullYear()
    && left.getMonth() === nextDay.getMonth()
    && left.getDate() === nextDay.getDate()
}

function formatDateTime(date, referenceDate) {
  if (isSameDay(date, referenceDate)) return HA_TIME_FORMATTER.format(date)
  if (date.getFullYear() === referenceDate.getFullYear()) return HA_MONTH_DAY_TIME_FORMATTER.format(date)
  return HA_MONTH_DAY_YEAR_TIME_FORMATTER.format(date)
}

function fmtEta(value) {
  if (typeof value !== 'number') return null
  const referenceDate = new Date()
  const completion = new Date(referenceDate.getTime() + value * 60 * 1000)
  const shouldUseClockOnly = isSameDay(completion, referenceDate)
    || (isNextDay(completion, referenceDate) && referenceDate.getHours() >= 12 && completion.getHours() < 12)
  return `~${shouldUseClockOnly ? HA_TIME_FORMATTER.format(completion) : formatDateTime(completion, referenceDate)}`
}

function renderMetric(label, value) {
  if (value == null || value === '') return ''
  return `
    <div class="metric">
      <div class="metric-label">${escapeHtml(label)}</div>
      <div class="metric-value">${escapeHtml(value)}</div>
    </div>`
}

/** Render a slot tile matching the app's AmsUnitRow style. */
function renderSlotTile(slot, unitLetter, options = {}) {
  const slotNum = Number(slot?.slot ?? 0) + 1
  const label = `${unitLetter}${slotNum}`
  const filamentType = slot?.filamentType || null
  const isRescanning = Boolean(slot?.isReading) || Boolean(slot?.pendingRescan)
  const showRescanIcons = options.showRescanIcons !== false
  const isActive = Boolean(slot?.active)
  const colors = Array.isArray(slot?.colors) ? slot.colors : (slot?.color ? [slot.color] : [])
  const hasFilament = Boolean((filamentType && filamentType !== '0') || colors.length > 0)
  const hasScannedSpool = slot?.trayUuid != null
  const remain = hasScannedSpool && hasFilament && typeof slot?.remainPercent === 'number'
    ? Math.max(0, Math.min(100, slot.remainPercent))
    : null

  const bg = hasFilament && colors[0]
    ? (colors.length > 1
      ? `linear-gradient(135deg, ${colors.map((c, i) => `${escapeHtml(c)} ${Math.round(i / (colors.length - 1) * 100)}%`).join(', ')})`
      : escapeHtml(colors[0]))
    : ''

  const barColor = remain == null ? '' : remain <= 15
    ? 'var(--error-color)' : remain <= 35
    ? 'var(--warning-color)' : 'var(--success-color)'

  let textColor = 'var(--primary-text-color)'
  if (hasFilament && colors[0]) {
    const hex = colors[0].replace('#', '')
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16) / 255
      const g = parseInt(hex.slice(2, 4), 16) / 255
      const b = parseInt(hex.slice(4, 6), 16) / 255
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
      textColor = lum > 0.45 ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.95)'
    }
  }

  const resolved = resolveFilamentSubline(slot)
  const hasColorName = Boolean(resolved.displayName)
  const displayType = resolved.filamentType || ''
  const displayName = hasColorName ? resolved.displayName : ''

  const tileContent = `
    <div class="slot-tile${hasFilament ? '' : ' slot-empty'}"
         data-active="${isActive ? 'true' : 'false'}"
         style="${bg ? `background:${bg};` : ''}color:${textColor}">
      ${isRescanning ? '<div class="slot-rescan-overlay"><span class="slot-spinner" aria-hidden="true"></span></div>' : ''}
      <span class="slot-tile-label">${escapeHtml(label)}</span>
      ${displayType ? `<span class="slot-tile-type">${escapeHtml(displayType)}</span>` : ''}
      ${displayName ? `<span class="slot-tile-name">${escapeHtml(displayName)}</span>` : ''}
      ${remain != null ? `
        <div class="slot-tile-bar-wrap">
          <div class="slot-tile-bar" style="width:${remain}%;background:${barColor}"></div>
        </div>` : ''}
    </div>`

  if (!slot?.entityId || !showRescanIcons) return tileContent

  const rescanAction = `
    <button
      class="slot-tool-button"
      type="button"
      data-service-domain="printstream"
      data-service="rescan_ams_slot"
      data-pending-key="${escapeHtml(servicePendingKey('rescan_ams_slot', slot.entityId))}"
      data-service-data="${escapeHtml(JSON.stringify({ entity_id: slot.entityId }))}"
      ${isRescanning ? 'disabled' : ''}
      aria-label="Rescan ${escapeHtml(label)} filament"
      title="Rescan filament"
    >↻</button>`

  return `
    <div class="slot-shell">
      <button class="slot-action" type="button" data-more-info-entity="${escapeHtml(slot.entityId)}" aria-label="Open ${escapeHtml(label)} slot entity">
        ${tileContent}
      </button>
      ${rescanAction}
    </div>`
}

function renderAmsUnit(unit) {
  const unitLetter = String.fromCharCode(65 + (Number(unit?.unitId ?? 0)))
  const humidity = unit?.humidityPercent != null
    ? `${Math.round(unit.humidityPercent)}% RH`
    : unit?.humidityLevel != null ? `Lv ${unit.humidityLevel}/5` : null
  const temp = unit?.temperature != null ? `${unit.temperature.toFixed(0)}\u00b0` : null
  const dryLabel = unit?.dryingActive
    ? (unit?.dryTimeRemainingMinutes ? `Drying \u2022 ${fmtMinutes(unit.dryTimeRemainingMinutes)} left` : 'Drying')
    : null
  const slots = Array.isArray(unit?.slots) ? unit.slots : []
  const refreshPending = Boolean(unit?.refreshPending)

  const titleMarkup = unit?.entityId
    ? `<button class="ams-title-link ams-title" type="button" data-more-info-entity="${escapeHtml(unit.entityId)}" aria-label="Open AMS ${escapeHtml(unitLetter)} entity">AMS ${escapeHtml(unitLetter)}</button>`
    : `<span class="ams-title">AMS ${escapeHtml(unitLetter)}</span>`

  const refreshAction = unit?.entityId
    ? `<button
        class="ams-tool-button"
        type="button"
        data-service-domain="printstream"
        data-service="refresh_ams"
        data-pending-key="${escapeHtml(servicePendingKey('refresh_ams', unit.entityId))}"
        data-service-data="${escapeHtml(JSON.stringify({ entity_id: unit.entityId }))}"
        data-busy="${refreshPending ? 'true' : 'false'}"
        ${refreshPending ? 'disabled' : ''}
        aria-label="Refresh AMS ${escapeHtml(unitLetter)}"
        title="Refresh AMS ${escapeHtml(unitLetter)}"
      >${refreshPending ? '<span class="button-spinner" aria-hidden="true"></span>' : '↻'}</button>`
    : ''

  const content = `
    <div class="ams">
      <div class="ams-header">
        <div class="ams-title-row">
          ${titleMarkup}
          <div class="ams-meta-inline">
            ${temp ? `<span>${escapeHtml(temp)}</span>` : ''}
            ${humidity ? `<span>${escapeHtml(humidity)}</span>` : ''}
            ${dryLabel ? `<span>${escapeHtml(unit?.dryTimeRemainingMinutes ? `${fmtMinutes(unit.dryTimeRemainingMinutes)} left` : 'Drying')}</span>` : ''}
            ${dryLabel ? `<span class="badge" data-tone="warning">Drying</span>` : ''}
            ${refreshAction ? `<span class="ams-header-actions">${refreshAction}</span>` : ''}
          </div>
        </div>
      </div>
      ${slots.length > 0
        ? `<div class="slot-row">${slots.map((s) => renderSlotTile(s, unitLetter, { showRescanIcons: unit?.showRescanIcons !== false })).join('')}</div>`
        : '<div class="ams-meta">No slots reported.</div>'}
    </div>`
  return content
}

function renderHeroMedia(attrs, state, contentSettings = DEFAULT_PRINTER_CARD_CONTENT_SETTINGS, imageEntities = {}, mediaState = {}, options = {}) {
  if (!contentSettings.cameraThumbnail && !contentSettings.modelThumbnail) return ''
  const cameraUrl = contentSettings.cameraThumbnail ? displayMediaUrl(mediaState.camera) : null
  const coverUrl = contentSettings.modelThumbnail ? displayMediaUrl(mediaState.cover) : null
  const mediaUrl = cameraUrl || coverUrl

  const sourceLabel = cameraUrl ? 'Camera' : 'Cover'
  const sourceEntityId = cameraUrl ? imageEntities.camera : imageEntities.cover
  const title = jobNameFor(attrs) || lastJobNameFor(attrs) || `${statusLabel(state, attrs)} printer`
  const showStatus = contentSettings.printStatus !== false
  const progress = typeof attrs.progress_percent === 'number' ? attrs.progress_percent : null
  const secondaryStageLabel = formatSecondaryStageLabel(state, attrs)
  const layerText = attrs.current_layer != null && attrs.total_layers != null
    ? `${attrs.current_layer} / ${attrs.total_layers}`
    : ''
  const etaText = attrs.remaining_minutes != null ? fmtEta(attrs.remaining_minutes) : ''
  const heroClasses = ['hero']
  if (options.wideCamera && sourceLabel === 'Camera') heroClasses.push('hero-wide')

  const heroBody = mediaUrl
    ? `<img class="hero-image" src="${escapeHtml(mediaUrl)}" alt="${escapeHtml(title)}">`
    : `<div class="hero-placeholder">${renderPlaceholderIcon(cameraUrl ? 'camera' : 'cover')}<div class="placeholder-caption">No ${escapeHtml(sourceLabel.toLowerCase())} available</div></div>`

  const heroContent = `
    <div class="${heroClasses.join(' ')}">
      ${heroBody}
      <div class="hero-overlay">
        ${showStatus && progress == null ? `<div class="hero-job">${escapeHtml(title)}</div>` : ''}
        ${showStatus && progress != null
          ? `<div class="hero-progress-group">
              <div class="strip-top-row">
                <div class="strip-job">${escapeHtml(title)}</div>
                <div class="strip-side-text">${Math.round(progress)}%</div>
              </div>
              ${renderInlineProgressBar(progress, state)}
              ${secondaryStageLabel
                ? `<div class="progress-substage">${escapeHtml(secondaryStageLabel)}</div>`
                : `<div class="strip-bottom-row" data-centered="${layerText ? 'true' : 'false'}">
                    <div class="strip-side-text">${escapeHtml(attrs.remaining_minutes != null ? `${fmtMinutes(attrs.remaining_minutes)} left` : statusLabel(state, attrs))}</div>
                    ${layerText ? `<div class="strip-center-text">${escapeHtml(layerText)}</div>` : ''}
                    <div class="strip-side-text strip-side-text-right">${escapeHtml(etaText)}</div>
                  </div>`}
            </div>`
          : ''}
      </div>
    </div>`
  return wrapMediaAction(heroContent, sourceEntityId, sourceLabel, {
    className: 'media-action-block',
    mediaKind: 'hero',
  })
}

function getMediaSource(attrs, mediaState = {}, preferCamera = false) {
  const coverUrl = displayMediaUrl(mediaState.cover)
  const cameraUrl = displayMediaUrl(mediaState.camera)
  if (preferCamera && cameraUrl) return { url: cameraUrl, label: 'Camera' }
  if (coverUrl) return { url: coverUrl, label: 'Cover' }
  if (cameraUrl) return { url: cameraUrl, label: 'Camera' }
  return null
}

function renderMediaVisual(attrs, preferCamera = false, imageEntities = {}, mediaState = {}) {
  const media = getMediaSource(attrs, mediaState, preferCamera)
  if (!media) {
    return `<div class="media-visual media-visual-placeholder">${renderPlaceholderIcon('cover')}<div class="placeholder-caption">No cover or camera available</div></div>`
  }
  const entityId = media.label === 'Camera' ? imageEntities.camera : imageEntities.cover
  const content = `
    <div class="media-visual">
      <img class="media-image" src="${escapeHtml(media.url)}" alt="${escapeHtml(media.label)}">
      <div class="media-overlay-chip">${escapeHtml(media.label)}</div>
    </div>`
  return wrapMediaAction(content, entityId, media.label, {
    className: 'media-action-block',
    mediaKind: 'visual',
  })
}

function renderMediaTile(attrs, kind, imageEntities = {}, mediaState = {}) {
  const url = kind === 'cover'
    ? displayMediaUrl(mediaState.cover)
    : displayMediaUrl(mediaState.camera)
  const label = kind === 'cover' ? 'Cover' : 'Camera'
  const entityId = kind === 'cover' ? imageEntities.cover : imageEntities.camera
  if (!url) {
    const content = `
      <div class="media-tile media-tile-placeholder" aria-label="${escapeHtml(label)} unavailable">
        ${renderPlaceholderIcon(kind)}
        <div class="placeholder-caption">${escapeHtml(label)}</div>
      </div>`
    return wrapMediaAction(content, entityId, label, {
      className: 'media-action-tile',
      mediaKind: kind,
    })
  }
  const content = `
    <div class="media-tile" aria-label="${escapeHtml(label)}">
      <img class="media-tile-image" src="${escapeHtml(url)}" alt="${escapeHtml(label)}">
    </div>`
  return wrapMediaAction(content, entityId, label, {
    className: 'media-action-tile',
    mediaKind: kind,
  })
}

function renderInlineProgressBar(progressPercent, state) {
  const hasProgress = progressPercent != null
  const pct = hasProgress ? Math.max(0, Math.min(100, progressPercent)) : 0
  const color = progressFillColor(state)
  return `
    <div class="progress-wrap strip-progress">
      <div class="progress-track">
        <div class="progress-fill" style="width:${pct}%;background:${color};opacity:${hasProgress ? '1' : '0'}"></div>
      </div>
    </div>`
}

function renderAppMediaStrip(attrs, state, contentSettings, imageEntities = {}, mediaState = {}) {
  const showCover = Boolean(contentSettings.modelThumbnail)
  const showCamera = Boolean(contentSettings.cameraThumbnail)
  const showCenter = contentSettings.printStatus !== false

  if (!showCover && !showCamera && !showCenter) return ''

  if (!showCenter) {
    return `
      <div class="media-strip">
        ${showCover ? renderMediaTile(attrs, 'cover', imageEntities, mediaState) : ''}
        ${showCover && showCamera ? '<div class="media-strip-spacer"></div>' : ''}
        ${showCamera ? renderMediaTile(attrs, 'camera', imageEntities, mediaState) : ''}
      </div>`
  }

  const jobTitle = jobNameFor(attrs) || lastJobNameFor(attrs) || 'No active job'
  const progress = typeof attrs.progress_percent === 'number' ? attrs.progress_percent : null
  const secondaryStageLabel = formatSecondaryStageLabel(state, attrs)
  const layerText = attrs.current_layer != null && attrs.total_layers != null
    ? `${attrs.current_layer} / ${attrs.total_layers}`
    : ''
  const etaText = attrs.remaining_minutes != null ? fmtEta(attrs.remaining_minutes) : ''

  return `
    <div class="media-strip">
      ${showCover ? renderMediaTile(attrs, 'cover', imageEntities, mediaState) : ''}
      <div class="media-strip-center">
        <div class="strip-top-row">
          <div class="strip-job">${escapeHtml(jobTitle)}</div>
          ${progress != null ? `<div class="strip-side-text">${Math.round(progress)}%</div>` : ''}
        </div>
        ${renderInlineProgressBar(progress, state)}
        ${secondaryStageLabel
          ? `<div class="progress-substage">${escapeHtml(secondaryStageLabel)}</div>`
          : `<div class="strip-bottom-row" data-centered="${layerText ? 'true' : 'false'}">
              <div class="strip-side-text">${escapeHtml((attrs.remaining_minutes != null ? `${fmtMinutes(attrs.remaining_minutes)} left` : '') || statusLabel(state, attrs))}</div>
              ${layerText ? `<div class="strip-center-text">${escapeHtml(layerText)}</div>` : ''}
              <div class="strip-side-text strip-side-text-right">${escapeHtml(etaText)}</div>
            </div>`}
      </div>
      ${showCamera ? renderMediaTile(attrs, 'camera', imageEntities, mediaState) : ''}
    </div>`
}

function renderPrinterReadoutChips(attrs, contentSettings) {
  const chips = [
    contentSettings.nozzleTemperatures ? renderReadoutChip('Nozzle', fmtTemp(attrs.nozzle_temp)) : '',
    contentSettings.bedTemperature ? renderReadoutChip('Bed', fmtTemp(attrs.bed_temp)) : '',
    contentSettings.chamberTemperature ? renderReadoutChip('Chamber', fmtTemp(attrs.chamber_temp)) : '',
    contentSettings.printSpeed ? renderReadoutChip('Speed', fmtSpeed(attrs.speed_level)) : '',
    contentSettings.doorState ? renderReadoutChip('Door', fmtBoolean(attrs.door_open, 'Open', 'Closed')) : '',
    contentSettings.ductState ? renderReadoutChip('Duct', attrs.duct_mode ? humanize(attrs.duct_mode) : null) : '',
  ].filter(Boolean)

  return chips.length ? `<div class="readout-row">${chips.join('')}</div>` : ''
}

function renderReadoutChip(label, value) {
  if (!value) return ''
  return `<div class="readout-chip">${escapeHtml(`${label} ${value}`)}</div>`
}

function renderExternalSpools(attrs) {
  const spools = Array.isArray(attrs.external_spools) ? attrs.external_spools : []
  if (!spools.length) return ''

  return `
    <div class="spool-row">
      ${spools.map((spool, index) => {
        const resolved = resolveFilamentSubline({
          displayName: spool.displayName,
          colorName: spool.colorName,
          trayName: spool.tray_name,
          filamentType: spool.filament_type,
          color: spool.colorHex || spool.color,
        })
        const label = resolved.displayName || resolved.filamentType || `External Spool ${index + 1}`
        const remain = fmtPct(spool.remain_percent)
        return `<div class="spool-pill">${escapeHtml(remain ? `${label} • ${remain}` : label)}</div>`
      }).join('')}
    </div>`
}

function renderPrinterSections(amsUnits, externalSpoolsMarkup, showAmsHeading) {
  return `
    ${externalSpoolsMarkup ? `
      <div class="stack">
        ${showAmsHeading ? '<p class="section-title">External Spools</p>' : ''}
        ${externalSpoolsMarkup}
      </div>` : ''}
    ${amsUnits.length > 0 ? `
      <div class="stack">
        ${showAmsHeading ? '<p class="section-title">AMS Units</p>' : ''}
        ${amsUnits.map(renderAmsUnit).join('')}
      </div>` : ''}`
}

function printerCanPause(state, attrs) {
  if (attrs?.online === false) return false
  return ['printing', 'preparing', 'heating'].includes(String(state || '').toLowerCase())
}

function printerCanResume(state, attrs) {
  if (attrs?.online === false) return false
  return String(state || '').toLowerCase() === 'paused'
}

function printerCanStop(state, attrs) {
  if (attrs?.online === false) return false
  return ['printing', 'paused', 'preparing', 'heating'].includes(String(state || '').toLowerCase())
}

function printerHasChamberLight(attrs) {
  return attrs?.light_capabilities?.chamber === true
}

function printerChamberLightIsOn(attrs) {
  return attrs?.light_modes?.chamber === 'on'
}

function renderServiceActionButton(label, domain, service, data, options = {}) {
  const pendingKey = options.pendingKey || servicePendingKey(service, data?.entity_id)
  const busy = Boolean(options.busy)
  const iconMarkup = !busy && options.icon ? renderActionIcon(options.icon) : ''
  const textMarkup = options.iconOnly ? '' : escapeHtml(label)
  return `
    <button
      class="action-button"
      type="button"
      data-tone="${escapeHtml(options.tone || 'neutral')}"
      data-icon-only="${options.iconOnly ? 'true' : 'false'}"
      data-service-domain="${escapeHtml(domain)}"
      data-service="${escapeHtml(service)}"
      data-pending-key="${escapeHtml(pendingKey)}"
      data-service-data="${escapeHtml(JSON.stringify(data))}"
      ${options.confirm ? `data-confirm-message="${escapeHtml(options.confirm)}"` : ''}
      data-busy="${busy ? 'true' : 'false'}"
      ${busy ? 'disabled' : ''}
      title="${escapeHtml(options.title || options.ariaLabel || label)}"
      aria-label="${escapeHtml(options.ariaLabel || label)}"
    ><span class="action-button-content">${busy ? '<span class="button-spinner" aria-hidden="true"></span>' : `${iconMarkup}${textMarkup}`}</span></button>`
}

function renderPrinterFooter(stateObj, attrs, contentSettings) {
  if (!contentSettings.footerControls) return ''

  const actions = []
  const entityId = stateObj?.entity_id
  if (entityId) {
    const clearHmsPending = contentSettings._pendingServiceKeys?.has(servicePendingKey('clear_hms_errors', entityId))
    if (printerCanPause(stateObj.state, attrs)) {
      actions.push(renderServiceActionButton('Pause', 'printstream', 'pause_print', { entity_id: entityId }, {
        tone: 'warning',
        icon: 'pause',
      }))
    }
    if (printerCanResume(stateObj.state, attrs)) {
      actions.push(renderServiceActionButton('Resume', 'printstream', 'resume_print', { entity_id: entityId }, {
        icon: 'resume',
      }))
    }
    if (printerCanStop(stateObj.state, attrs)) {
      actions.push(renderServiceActionButton('Stop', 'printstream', 'stop_print', { entity_id: entityId }, {
        tone: 'danger',
        icon: 'stop',
        confirm: 'Stop the current print?',
      }))
    }
    if (printerHasChamberLight(attrs)) {
      const chamberLightOn = printerChamberLightIsOn(attrs)
      actions.push(renderServiceActionButton(chamberLightOn ? 'Chamber light off' : 'Chamber light on', 'printstream', 'set_chamber_light', {
        entity_id: entityId,
        on: !chamberLightOn,
      }, {
        tone: chamberLightOn ? 'warning' : 'neutral',
        icon: 'lightbulb',
        iconOnly: true,
        title: chamberLightOn ? 'Turn chamber light off' : 'Turn chamber light on',
        ariaLabel: chamberLightOn ? 'Turn chamber light off' : 'Turn chamber light on',
      }))
    }
    if ((Array.isArray(attrs?.hms_errors) && attrs.hms_errors.length > 0) || Number(attrs?.hms_error_count || 0) > 0) {
      actions.push(renderServiceActionButton('Clear HMS', 'printstream', 'clear_hms_errors', { entity_id: entityId }, {
        busy: clearHmsPending,
      }))
    }
  }

  const linkMarkup = attrs?.detail_url
    ? `<a class="link footer-link" href="${escapeHtml(attrs.detail_url)}" target="_blank" rel="noreferrer">Open in PrintStream</a>`
    : ''

  if (!actions.length && !linkMarkup) return ''

  return `
    <div class="footer">
      ${actions.length ? `<div class="footer-actions">${actions.join('')}</div>` : '<div></div>'}
      ${linkMarkup}
    </div>`
}

function renderOfflineBox() {
  return `<div class="offline-box">\uD83D\uDDA8 Printer offline \u2014 live status unavailable.</div>`
}

// ---------------------------------------------------------------------------
// Main render functions
// ---------------------------------------------------------------------------
function renderPrinterCard(stateObj, config, includeAms) {
  const attrs = stateObj.attributes || {}
  const contentSettings = normalizePrinterCardContentSettings(config)
  const isOffline = attrs?.online === false || stateObj.state === 'offline'
  const imageEntities = findPrinterImageEntities(config._hass, attrs.printer_id)
  const mediaState = config._mediaState || {}
  const title = config.title || attrs.printer_name || friendlyName(stateObj, stateObj.entity_id)
  const model = attrs.printer_model || ''
  const amsUnits = Array.isArray(attrs.ams_units)
    ? attrs.ams_units.map((unit) => ({
        ...unit,
        entityId: findAmsEntity(config._hass, unit?.id || unit?.amsId),
        refreshPending: config._pendingServiceKeys?.has(servicePendingKey('refresh_ams', findAmsEntity(config._hass, unit?.id || unit?.amsId))),
        showRescanIcons: contentSettings.rescanIcons,
        slots: Array.isArray(unit?.slots)
          ? unit.slots.map((slot) => ({
              ...slot,
              entityId: findAmsSlotEntity(config._hass, unit?.id || unit?.amsId, Number(slot?.slot ?? 0) + 1),
              pendingRescan: config._pendingServiceKeys?.has(servicePendingKey('rescan_ams_slot', findAmsSlotEntity(config._hass, unit?.id || unit?.amsId, Number(slot?.slot ?? 0) + 1))),
            }))
          : [],
      }))
    : []
  const externalSpools = includeAms && !isOffline && contentSettings.externalSpools ? renderExternalSpools(attrs) : ''
  const showStorageHeadings = Boolean(externalSpools) && amsUnits.length > 0
  const mediaStrip = !isOffline ? renderAppMediaStrip(attrs, stateObj.state, contentSettings, imageEntities, mediaState) : ''
  const readouts = !isOffline ? renderPrinterReadoutChips(attrs, contentSettings) : ''

  return `
    <ha-card>
      <div class="card">
        <style>${BASE_STYLES}</style>
        <div class="header">
          <div class="title-wrap">
            <div class="title-row">
              <button
                class="ams-title-link title"
                type="button"
                data-device-entity="${escapeHtml(stateObj.entity_id)}"
                data-device-id="${escapeHtml(getDeviceIdForEntity(stateObj.entity_id) || '')}"
                aria-label="Open ${escapeHtml(attrs.printer_name || title)} device"
              >${escapeHtml(title)}</button>
              ${model ? `<div class="model-chip">${escapeHtml(model)}</div>` : ''}
            </div>
          </div>
          ${renderStatusChips(stateObj.state, attrs)}
        </div>

        <div class="divider"></div>

        ${isOffline ? renderOfflineBox() : ''}

        ${mediaStrip || (!isOffline && contentSettings.printStatus ? `<div class="readout-row"><div class="readout-chip">${escapeHtml(jobNameFor(attrs) || lastJobNameFor(attrs) || 'No active job')}</div></div>` : '')}

        ${readouts}

        ${includeAms && contentSettings.amsCards && !isOffline && (amsUnits.length > 0 || externalSpools) ? renderPrinterSections(amsUnits, externalSpools, showStorageHeadings) : externalSpools}

        ${renderPrinterFooter(stateObj, attrs, { ...contentSettings, _pendingServiceKeys: config._pendingServiceKeys })}
      </div>
    </ha-card>`
}

function renderPrinterMediaCard(stateObj, config) {
  const attrs = stateObj.attributes || {}
  const contentSettings = normalizePrinterCardContentSettings(config)
  const isOffline = attrs?.online === false || stateObj.state === 'offline'
  const imageEntities = findPrinterImageEntities(config._hass, attrs.printer_id)
  const mediaState = config._mediaState || {}
  const title = config.title || attrs.printer_name || friendlyName(stateObj, stateObj.entity_id)
  const model = attrs.printer_model || ''
  const amsUnits = Array.isArray(attrs.ams_units)
    ? attrs.ams_units.map((unit) => ({
        ...unit,
        entityId: findAmsEntity(config._hass, unit?.id || unit?.amsId),
        refreshPending: config._pendingServiceKeys?.has(servicePendingKey('refresh_ams', findAmsEntity(config._hass, unit?.id || unit?.amsId))),
        showRescanIcons: contentSettings.rescanIcons,
        slots: Array.isArray(unit?.slots)
          ? unit.slots.map((slot) => ({
              ...slot,
              entityId: findAmsSlotEntity(config._hass, unit?.id || unit?.amsId, Number(slot?.slot ?? 0) + 1),
              pendingRescan: config._pendingServiceKeys?.has(servicePendingKey('rescan_ams_slot', findAmsSlotEntity(config._hass, unit?.id || unit?.amsId, Number(slot?.slot ?? 0) + 1))),
            }))
          : [],
      }))
    : []
  const externalSpools = !isOffline && contentSettings.externalSpools ? renderExternalSpools(attrs) : ''
  const showStorageHeadings = Boolean(externalSpools) && amsUnits.length > 0
  const hero = !isOffline ? renderHeroMedia(attrs, stateObj.state, contentSettings, imageEntities, mediaState, { wideCamera: true }) : ''
  const readouts = !isOffline ? renderPrinterReadoutChips(attrs, contentSettings) : ''

  return `
    <ha-card>
      <div class="card">
        <style>${BASE_STYLES}</style>
        <div class="header">
          <div class="title-wrap">
            <div class="title-row">
              <button
                class="ams-title-link title"
                type="button"
                data-device-entity="${escapeHtml(stateObj.entity_id)}"
                data-device-id="${escapeHtml(getDeviceIdForEntity(stateObj.entity_id) || '')}"
                aria-label="Open ${escapeHtml(attrs.printer_name || title)} device"
              >${escapeHtml(title)}</button>
              ${model ? `<div class="model-chip">${escapeHtml(model)}</div>` : ''}
            </div>
          </div>
          ${renderStatusChips(stateObj.state, attrs)}
        </div>

        <div class="divider"></div>

        ${isOffline ? renderOfflineBox() : ''}

        ${hero || (!isOffline && (contentSettings.modelThumbnail || contentSettings.cameraThumbnail)
          ? renderMediaVisual(attrs, contentSettings.cameraThumbnail && !contentSettings.modelThumbnail, imageEntities, mediaState)
          : '')}

        ${readouts}

        ${contentSettings.amsCards && !isOffline && (amsUnits.length > 0 || externalSpools) ? renderPrinterSections(amsUnits, externalSpools, showStorageHeadings) : externalSpools}

        ${renderPrinterFooter(stateObj, attrs, { ...contentSettings, _pendingServiceKeys: config._pendingServiceKeys })}
      </div>
    </ha-card>`
}

function renderAmsCard(stateObj, config) {
  const attrs = stateObj.attributes || {}
  const contentSettings = normalizePrinterCardContentSettings(config)
  const unitId = Number(attrs.unit_id ?? 0)
  const unitLetter = String.fromCharCode(65 + unitId)
  const title = config.title || attrs.name || friendlyName(stateObj, stateObj.entity_id) || `AMS ${unitLetter}`
  const temp = attrs.temperature != null ? `${Number(attrs.temperature).toFixed(0)}\u00b0` : null
  const humidity = attrs.humidity_percent != null
    ? `${Math.round(attrs.humidity_percent)}% RH`
    : attrs.humidity_level != null ? `Lv ${attrs.humidity_level}/5` : null
  const showDrying = Boolean(attrs.support_drying && attrs.drying_active)

  const metrics = [
    renderMetric('Dry time left', showDrying ? (fmtMinutes(attrs.dry_time_remaining_minutes) || 'Drying') : null),
  ].join('')

  const amsId = attrs.ams_id || attrs.id || null
  const slots = Array.isArray(attrs.slots)
    ? attrs.slots.map((slot) => ({
        ...slot,
        entityId: findAmsSlotEntity(config._hass, amsId, Number(slot?.slot ?? 0) + 1),
        pendingRescan: config._pendingServiceKeys?.has(servicePendingKey('rescan_ams_slot', findAmsSlotEntity(config._hass, amsId, Number(slot?.slot ?? 0) + 1))),
      }))
    : []
  const refreshPending = config._pendingServiceKeys?.has(servicePendingKey('refresh_ams', stateObj.entity_id))
  const refreshAction = `
    <button
      class="ams-tool-button"
      type="button"
      data-service-domain="printstream"
      data-service="refresh_ams"
      data-pending-key="${escapeHtml(servicePendingKey('refresh_ams', stateObj.entity_id))}"
      data-service-data="${escapeHtml(JSON.stringify({ entity_id: stateObj.entity_id }))}"
      data-busy="${refreshPending ? 'true' : 'false'}"
      ${refreshPending ? 'disabled' : ''}
      aria-label="Refresh AMS ${escapeHtml(unitLetter)}"
      title="Refresh AMS ${escapeHtml(unitLetter)}"
    >${refreshPending ? '<span class="button-spinner" aria-hidden="true"></span>' : '↻'}</button>`

  return `
    <ha-card>
      <div class="card">
        <style>${BASE_STYLES}</style>
        <div class="header">
          <div class="title-wrap">
            <div class="title">${escapeHtml(title)}</div>
          </div>
          <div class="ams-meta-inline">
            ${temp ? `<span>${escapeHtml(temp)}</span>` : ''}
            ${humidity ? `<span>${escapeHtml(humidity)}</span>` : ''}
            ${showDrying ? '<span class="badge" data-tone="warning">Drying</span>' : ''}
            <span class="ams-header-actions">${refreshAction}</span>
          </div>
        </div>

        <div class="divider"></div>

        ${metrics ? `<div class="metrics">${metrics}</div>` : ''}

        ${slots.length > 0
          ? `<div class="slot-row">${slots.map((s) => renderSlotTile(s, unitLetter, { showRescanIcons: contentSettings.rescanIcons })).join('')}</div>`
          : '<div class="ams-meta">No slots reported.</div>'}

        ${attrs.detail_url ? `
          <div class="footer">
            <div></div>
            <a class="link footer-link" href="${escapeHtml(attrs.detail_url)}" target="_blank" rel="noreferrer">Open printer in PrintStream</a>
          </div>` : ''}
      </div>
    </ha-card>`
}

// ---------------------------------------------------------------------------
// Visual editor
// ---------------------------------------------------------------------------
class PrintStreamCardEditorBase extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this._config = {}
    this._hass = null
    this._kindFilter = 'printer'
    this._printerFilter = ''
  }

  set hass(hass) {
    this._hass = hass
    this._syncEntityOptions()
  }

  /** Called by HA's Lovelace editor when this element is placed in the config panel. */
  setConfig(config) {
    this._config = config || {}
    this._ensureDOM()
    this._syncValues()
  }

  connectedCallback() {
    this._ensureDOM()
    this._syncValues()
  }

  _ensureDOM() {
    if (this._domReady) return
    this._domReady = true

    this.shadowRoot.innerHTML = `
      <style>${EDITOR_STYLES}</style>
      <div class="editor">
        ${this._kindFilter === 'ams' ? `
          <label class="field">
            <span class="field-label">Associated Printer</span>
            <select id="printer-filter"></select>
          </label>` : ''}
        <label class="field">
          <span class="field-label">${this._kindFilter === 'printer' ? 'Printer' : 'AMS Unit'}</span>
          <select id="entity-select"></select>
        </label>
        <div class="helper">${this._kindFilter === 'printer'
          ? 'Choose the printer status entity that backs this card.'
          : 'Choose the AMS unit entity that backs this card.'}</div>
        <ha-textfield id="title-field" label="Title (optional)" placeholder="Leave blank to use printer name"></ha-textfield>
        ${this._kindFilter === 'printer' ? `
          <div class="field-group">
            <span class="field-label">Card Content</span>
            <div class="toggle-grid">
              ${PRINTER_CONTENT_OPTIONS.map(([key, label]) => `
                <ha-formfield label="${escapeHtml(label)}" data-content-option="${escapeHtml(key)}">
                  <ha-checkbox data-content-key="${escapeHtml(key)}"></ha-checkbox>
                </ha-formfield>`).join('')}
            </div>
            <div class="helper">Match the same content switches used by the app's printer views.</div>
          </div>` : ''}
        ${this._kindFilter === 'ams' ? `
          <div class="field-group">
            <span class="field-label">AMS Content</span>
            <div class="toggle-grid">
              ${AMS_CONTENT_OPTIONS.map(([key, label]) => `
                <ha-formfield label="${escapeHtml(label)}" data-content-option="${escapeHtml(key)}">
                  <ha-checkbox data-content-key="${escapeHtml(key)}"></ha-checkbox>
                </ha-formfield>`).join('')}
            </div>
            <div class="helper">Hide slot rescan actions when you want a cleaner read-only AMS card.</div>
          </div>` : ''}
      </div>`

    const entitySelect = this.shadowRoot.getElementById('entity-select')
    entitySelect.addEventListener('change', (e) => {
      const nextEntityId = e.target.value
      this._syncContentOptionVisibility(nextEntityId)
      this._dispatchConfig({ ...this._config, entity: nextEntityId })
    })

    const printerFilter = this.shadowRoot.getElementById('printer-filter')
    if (printerFilter) {
      printerFilter.addEventListener('change', (e) => {
        this._printerFilter = e.target.value || ''
        this._syncEntityOptions(true)
      })
    }

    this.shadowRoot.getElementById('title-field').addEventListener('change', (e) => {
      const val = e.target.value.trim()
      const next = { ...this._config }
      if (val) next.title = val
      else delete next.title
      this._dispatchConfig(next)
    })

    this.shadowRoot.querySelectorAll('[data-content-key]').forEach((input) => {
      input.addEventListener('change', (e) => {
        const target = e.target
        const key = target.dataset.contentKey
        if (!key) return
        this._dispatchConfig(updatePrinterCardContentSettings(this._config, key, Boolean(target.checked)))
      })
    })

    this._syncEntityOptions()
    this._syncValues()
  }

  _getEntityOptions() {
    const states = this._hass?.states ?? {}
    return Object.keys(states)
      .map((entityId) => {
        const state = states[entityId]
        if (state?.attributes?.printstream_kind !== this._kindFilter) return null
        const label = this._kindFilter === 'printer'
          ? (state.attributes?.printer_name || state.attributes?.friendly_name || entityId)
          : (state.attributes?.name || state.attributes?.friendly_name || entityId)
        const printerLabel = state.attributes?.printer_name || label
        return {
          entityId,
          label,
          printerLabel,
          printerId: state.attributes?.printer_id || state.attributes?.printer_id || state.attributes?.printer_id || null,
        }
      })
      .filter(Boolean)
      .sort((left, right) => left.label.localeCompare(right.label))
  }

  _getPrinterFilterOptions(options) {
    const printers = new Map()
    for (const option of options) {
      if (!option.printerId) continue
      const printerName = option.printerLabel || option.label.split(' • ')[0]
      printers.set(option.printerId, printerName)
    }
    return [...printers.entries()].sort((left, right) => left[1].localeCompare(right[1]))
  }

  _syncEntityOptions(dispatchFallback = false) {
    const entitySelect = this.shadowRoot?.getElementById?.('entity-select')
    if (!entitySelect) return
    const options = this._getEntityOptions()
    const printerFilter = this.shadowRoot?.getElementById?.('printer-filter')

    if (printerFilter) {
      const printerOptions = this._getPrinterFilterOptions(options)
      const selectedEntity = this._hass?.states?.[this._config?.entity]
      const inferredPrinterId = selectedEntity?.attributes?.printer_id || ''
      if (!this._printerFilter && inferredPrinterId) this._printerFilter = inferredPrinterId
      printerFilter.innerHTML = [
        '<option value="">All printers</option>',
        ...printerOptions.map(([printerId, label]) => `<option value="${escapeHtml(printerId)}">${escapeHtml(label)}</option>`)
      ].join('')
      printerFilter.value = this._printerFilter || ''
    }

    const filtered = this._printerFilter
      ? options.filter((option) => option.printerId === this._printerFilter)
      : options

    entitySelect.innerHTML = filtered.map((option) => (
      `<option value="${escapeHtml(option.entityId)}">${escapeHtml(option.label)}</option>`
    )).join('')

    if (!filtered.length) {
      entitySelect.innerHTML = '<option value="">No matching entities</option>'
      entitySelect.value = ''
      return
    }

    const current = filtered.some((option) => option.entityId === this._config?.entity)
      ? this._config.entity
      : filtered[0].entityId
    entitySelect.value = current

    this._syncContentOptionVisibility(current)

    if (dispatchFallback && current && current !== this._config?.entity) {
      this._dispatchConfig({ ...this._config, entity: current })
    }
  }

  _syncContentOptionVisibility(entityId = this._config?.entity) {
    const stateObj = entityId ? this._hass?.states?.[entityId] : null
    const attrs = stateObj?.attributes || {}
    this.shadowRoot?.querySelectorAll?.('[data-content-option]')?.forEach?.((field) => {
      const key = field.dataset.contentOption
      if (!key) return
      const visible = shouldShowPrinterContentOption(key, attrs)
      field.hidden = !visible
      field.style.display = visible ? '' : 'none'
    })
  }

  _syncValues() {
    this._syncEntityOptions()
    const titleField = this.shadowRoot?.getElementById?.('title-field')
    if (titleField) titleField.value = this._config?.title || ''
    const contentSettings = normalizePrinterCardContentSettings(this._config)
    this.shadowRoot?.querySelectorAll?.('[data-content-key]')?.forEach?.((input) => {
      const key = input.dataset.contentKey
      if (!key) return
      input.checked = Boolean(contentSettings[key])
    })
  }

  _dispatchConfig(config) {
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config },
      bubbles: true,
      composed: true,
    }))
  }
}

class PrintStreamPrinterCardEditor extends PrintStreamCardEditorBase {
  constructor() { super(); this._kindFilter = 'printer' }
}
class PrintStreamAmsCardEditor extends PrintStreamCardEditorBase {
  constructor() { super(); this._kindFilter = 'ams' }
}

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------
class PrintStreamCardBase extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this._config = null
    this._hass = null
    this._mediaState = {
      cover: { requestedSrc: null, displaySrc: null, loadingSrc: null, failed: false, refreshedAt: 0 },
      camera: { requestedSrc: null, displaySrc: null, loadingSrc: null, failed: false, refreshedAt: 0 },
    }
    this._pendingServiceKeys = new Set()
  }

  setConfig(config) {
    if (!config || typeof config.entity !== 'string' || !config.entity.trim()) {
      throw new Error('You need to define an entity')
    }
    this._config = config
    this._syncMediaState(this._getStateObject())
    this._render()
  }

  set hass(hass) {
    this._hass = hass
    this._syncMediaState(this._getStateObject())
    this._ensureEntityDeviceLookup()
    this._render()
  }

  getCardSize() { return 4 }
  getGridOptions() { return { rows: 5, columns: 4, min_columns: 2, min_rows: 4 } }

  _getStateObject() {
    if (!this._config || !this._hass) return null
    return this._hass.states[this._config.entity] || null
  }

  _renderError(message) {
    this.shadowRoot.innerHTML = `
      <ha-card>
        <div class="card">
          <style>${BASE_STYLES}</style>
          <div class="error-text">${escapeHtml(message)}</div>
        </div>
      </ha-card>`
  }

  _setShadowMarkup(markup) {
    const template = document.createElement('template')
    template.innerHTML = markup.trim()
    this._preserveMediaTileNodes(template)
    this.shadowRoot.replaceChildren(template.content)
  }

  _preserveMediaTileNodes(template) {
    const currentTiles = new Map(
      [...this.shadowRoot.querySelectorAll('.media-action-tile[data-media-kind]')].map((node) => [node.getAttribute('data-media-kind'), node])
    )

    template.content.querySelectorAll('.media-action-tile[data-media-kind]').forEach((incoming) => {
      const kind = incoming.getAttribute('data-media-kind')
      if (!kind) return
      const current = currentTiles.get(kind)
      if (!current) return

      this._syncPreservedMediaTile(current, incoming)
      incoming.replaceWith(current)
    })
  }

  _syncPreservedMediaTile(current, incoming) {
    const nextEntityId = incoming.getAttribute('data-more-info-entity')
    if (nextEntityId) current.setAttribute('data-more-info-entity', nextEntityId)
    else current.removeAttribute('data-more-info-entity')

    const nextAriaLabel = incoming.getAttribute('aria-label')
    if (nextAriaLabel) current.setAttribute('aria-label', nextAriaLabel)
    else current.removeAttribute('aria-label')

    current.className = incoming.className

    const currentImage = current.querySelector('img')
    const nextImage = incoming.querySelector('img')
    if (currentImage && nextImage) {
      const nextSrc = nextImage.getAttribute('src') || ''
      if (currentImage.getAttribute('src') !== nextSrc) currentImage.setAttribute('src', nextSrc)
      const nextAlt = nextImage.getAttribute('alt') || ''
      if (currentImage.getAttribute('alt') !== nextAlt) currentImage.setAttribute('alt', nextAlt)
      return
    }

    current.innerHTML = incoming.innerHTML
  }

  _syncMediaState(stateObj) {
    const attrs = stateObj?.attributes || {}
    const imageEntities = findPrinterImageEntities(this._hass, attrs.printer_id)
    const coverEntity = imageEntities.cover ? this._hass?.states?.[imageEntities.cover] : null
    const cameraEntity = imageEntities.camera ? this._hass?.states?.[imageEntities.camera] : null
    const coverEntityPicture = coverEntity?.attributes?.entity_picture || null
    const cameraEntityPicture = cameraEntity?.attributes?.entity_picture || null
    const now = Date.now()
    const desiredMedia = {
      cover: coverEntityPicture || attrs.cover_image_url || null,
      camera: cameraEntityPicture || attrs.camera_snapshot_url || null,
    }

    Object.entries(desiredMedia).forEach(([kind, desiredSrc]) => {
      const media = this._mediaState[kind]
      if (!media) return
      if (!desiredSrc) {
        media.requestedSrc = null
        media.displaySrc = null
        media.loadingSrc = null
        media.failed = false
        media.refreshedAt = 0
        return
      }

      const shouldThrottle = kind === 'camera' && desiredSrc === media.requestedSrc && !cameraEntityPicture
      if (shouldThrottle && now - media.refreshedAt < 10000) return
      if (!shouldThrottle && (media.requestedSrc === desiredSrc || media.loadingSrc === desiredSrc)) return

      const requestSrc = shouldThrottle ? mediaUrlWithVersion(desiredSrc, String(Math.floor(now / 10000))) : desiredSrc
      media.requestedSrc = desiredSrc
      media.loadingSrc = requestSrc
      const ImageCtor = globalThis.Image
      if (typeof ImageCtor !== 'function') return
      const img = new ImageCtor()
      img.onload = () => {
        if (media.loadingSrc !== requestSrc) return
        media.displaySrc = img.currentSrc || img.src
        media.loadingSrc = null
        media.failed = false
        media.refreshedAt = now
        if (this._config && this._hass) this._render()
      }
      img.onerror = () => {
        if (media.loadingSrc !== requestSrc) return
        media.loadingSrc = null
        if (!media.displaySrc) media.failed = true
        media.refreshedAt = now
        if (this._config && this._hass) this._render()
      }
      img.src = requestSrc
    })
  }

  _ensureEntityDeviceLookup() {
    const entityId = this._config?.entity
    if (!entityId || getDeviceIdForEntity(entityId) || !this._hass) return
    ensureEntityDeviceLookup(this._hass).then(() => {
      if (this.isConnected && this._config && this._hass) this._render()
    })
  }

  _bindMoreInfoTargets() {
    this.shadowRoot?.querySelectorAll?.('[data-more-info-entity]')?.forEach?.((node) => {
      if (node.dataset.moreInfoBound === 'true') return
      node.dataset.moreInfoBound = 'true'
      const entityId = node.getAttribute('data-more-info-entity')
      if (!entityId) return
      node.addEventListener('click', (event) => {
        event.preventDefault()
        event.stopPropagation()
        fireMoreInfoEvent(this, entityId)
      })
    })
  }

  _bindDeviceTargets() {
    this.shadowRoot?.querySelectorAll?.('[data-device-entity]')?.forEach?.((node) => {
      if (node.dataset.deviceBound === 'true') return
      node.dataset.deviceBound = 'true'
      node.addEventListener('click', (event) => {
        event.preventDefault()
        event.stopPropagation()
        const entityId = node.getAttribute('data-device-entity')
        const deviceId = node.getAttribute('data-device-id') || getDeviceIdForEntity(entityId)
        if (deviceId) {
          fireDeviceNavigation(this, deviceId)
          return
        }
        if (entityId) fireMoreInfoEvent(this, entityId)
      })
    })
  }

  _bindServiceTargets() {
    this.shadowRoot?.querySelectorAll?.('[data-service][data-service-domain]')?.forEach?.((node) => {
      if (node.dataset.serviceBound === 'true') return
      node.dataset.serviceBound = 'true'
      node.addEventListener('click', async (event) => {
        event.preventDefault()
        event.stopPropagation()
        const domain = node.getAttribute('data-service-domain')
        const service = node.getAttribute('data-service')
        const rawData = node.getAttribute('data-service-data')
        const pendingKey = node.getAttribute('data-pending-key') || ''
        const confirmMessage = node.getAttribute('data-confirm-message')
        if (!domain || !service || !this._hass) return
        if (confirmMessage && window.confirm && !window.confirm(confirmMessage)) return
        let data = {}
        if (rawData) {
          try {
            data = JSON.parse(rawData)
          } catch (err) {
            console.error('Failed to parse PrintStream service payload', err)
            fireNotificationEvent(this, 'Could not run PrintStream action: invalid service payload.')
            return
          }
        }
        const wasDisabled = node.disabled
        if (pendingKey) {
          this._pendingServiceKeys.add(pendingKey)
          this._render()
        }
        node.disabled = true
        try {
          await this._hass.callService(domain, service, data)
        } catch (err) {
          console.error('PrintStream action failed', err)
          fireNotificationEvent(this, err?.message || 'PrintStream action failed.')
        } finally {
          node.disabled = wasDisabled
          if (pendingKey) {
            this._pendingServiceKeys.delete(pendingKey)
            this._render()
          }
        }
      })
    })
  }
}

class PrintStreamPrinterCard extends PrintStreamCardBase {
  static getStubConfig(hass) {
    const entity = Object.keys(hass?.states ?? {}).find(
      (id) => hass.states[id]?.attributes?.printstream_kind === 'printer'
    )
    return { entity: entity || '' }
  }

  static getConfigElement() {
    return document.createElement('printstream-printer-card-editor')
  }

  getCardSize() { return 6 }
  getGridOptions() { return { columns: 'full' } }

  _render() {
    if (!this._config || !this._hass) return
    const stateObj = this._getStateObject()
    if (!stateObj) { this._renderError(`Entity not found: ${this._config.entity}`); return }
    if (stateObj.attributes?.printstream_kind !== 'printer') {
      this._renderError('Requires a PrintStream printer Status entity.')
      return
    }
    this._setShadowMarkup(renderPrinterCard(stateObj, { ...this._config, _hass: this._hass, _mediaState: this._mediaState, _pendingServiceKeys: this._pendingServiceKeys }, true))
    this._bindDeviceTargets()
    this._bindMoreInfoTargets()
    this._bindServiceTargets()
  }
}

class PrintStreamAmsCard extends PrintStreamCardBase {
  static getStubConfig(hass) {
    const entity = Object.keys(hass?.states ?? {}).find(
      (id) => hass.states[id]?.attributes?.printstream_kind === 'ams'
    )
    return { entity: entity || '' }
  }

  static getConfigElement() {
    return document.createElement('printstream-ams-card-editor')
  }

  getCardSize() { return 6 }
  getGridOptions() { return { columns: 'full' } }

  _render() {
    if (!this._config || !this._hass) return
    const stateObj = this._getStateObject()
    if (!stateObj) { this._renderError(`Entity not found: ${this._config.entity}`); return }
    if (stateObj.attributes?.printstream_kind !== 'ams') {
      this._renderError('Requires a PrintStream AMS Status entity.')
      return
    }
    this._setShadowMarkup(renderAmsCard(stateObj, { ...this._config, _hass: this._hass, _pendingServiceKeys: this._pendingServiceKeys }))
    this._bindDeviceTargets()
    this._bindMoreInfoTargets()
    this._bindServiceTargets()
  }
}

class PrintStreamPrinterMediaCard extends PrintStreamCardBase {
  static getStubConfig(hass) {
    const entity = Object.keys(hass?.states ?? {}).find(
      (id) => hass.states[id]?.attributes?.printstream_kind === 'printer'
    )
    return { entity: entity || '' }
  }

  static getConfigElement() {
    return document.createElement('printstream-printer-card-editor')
  }

  getCardSize() { return 7 }
  getGridOptions() { return { columns: 'full' } }

  _render() {
    if (!this._config || !this._hass) return
    const stateObj = this._getStateObject()
    if (!stateObj) { this._renderError(`Entity not found: ${this._config.entity}`); return }
    if (stateObj.attributes?.printstream_kind !== 'printer') {
      this._renderError('Requires a PrintStream printer Status entity.')
      return
    }
    this._setShadowMarkup(renderPrinterMediaCard(stateObj, { ...this._config, _hass: this._hass, _mediaState: this._mediaState, _pendingServiceKeys: this._pendingServiceKeys }))
    this._bindDeviceTargets()
    this._bindMoreInfoTargets()
    this._bindServiceTargets()
  }
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------
if (!customElements.get('printstream-printer-card-editor')) {
  customElements.define('printstream-printer-card-editor', PrintStreamPrinterCardEditor)
}
if (!customElements.get('printstream-ams-card-editor')) {
  customElements.define('printstream-ams-card-editor', PrintStreamAmsCardEditor)
}
if (!customElements.get('printstream-printer-card')) {
  customElements.define('printstream-printer-card', PrintStreamPrinterCard)
}
if (!customElements.get('printstream-ams-card')) {
  customElements.define('printstream-ams-card', PrintStreamAmsCard)
}
if (!customElements.get('printstream-printer-media-card')) {
  customElements.define('printstream-printer-media-card', PrintStreamPrinterMediaCard)
}

window.customCards = window.customCards || []
window.customCards.push(
  {
    type: 'printstream-printer-card',
    name: 'PrintStream Printer',
    description: 'Printer card with app-style status, optional thumbnails, and optional AMS units controlled from the card settings.',
    preview: true,
    documentationURL: 'https://github.com/RyanEwen/printstream',
  },
  {
    type: 'printstream-ams-card',
    name: 'PrintStream AMS',
    description: 'AMS unit with per-slot color tiles, humidity, temperature, and drying state.',
    preview: true,
    documentationURL: 'https://github.com/RyanEwen/printstream',
  },
  {
    type: 'printstream-printer-media-card',
    name: 'PrintStream Printer Media',
    description: 'Alternative camera-first printer card with overlay information and optional AMS units.',
    preview: true,
    documentationURL: 'https://github.com/RyanEwen/printstream',
  },
)

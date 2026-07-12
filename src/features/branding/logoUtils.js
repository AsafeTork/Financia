import { OFFICIAL_LOGO_COLORS, CHECK_NORM } from './defaults.js';

/**
 * Builds the SVG path for the check mark.
 * @param {number} w - Width
 * @param {number} h - Height
 * @returns {string} SVG path data
 */
export function buildCheckPath(w, h) {
  const pts = CHECK_NORM.map(p => `${(p.x * w).toFixed(1)} ${(p.y * h).toFixed(1)}`);
  return `M ${pts[0]} L ${pts[1]} L ${pts[2]} L ${pts[3]} L ${pts[4]} C ${pts[5]} ${pts[6]} ${pts[7]} Z`;
}

/**
 * Generates the logo SVG markup.
 * @param {Object} colors - Color overrides
 * @returns {string} SVG markup
 */
export function generateLogoSvg(colors) {
  const c = colors || OFFICIAL_LOGO_COLORS;
  return '<svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">'
    + '<rect width="400" height="400" fill="transparent"/>'
    + `<g transform="translate(34,200)"><rect width="71" height="125" rx="10" fill="${c.blue || OFFICIAL_LOGO_COLORS.blue}"/></g>`
    + `<g transform="translate(134,129)"><rect width="71" height="196" rx="10" fill="${c.green || OFFICIAL_LOGO_COLORS.green}"/></g>`
    + `<g transform="translate(234,75)"><rect width="72" height="250" rx="10" fill="${c.teal || OFFICIAL_LOGO_COLORS.teal}"/></g>`
    + `<g transform="translate(169,126)"><path d="${buildCheckPath(197, 148)}" fill="${c.check || OFFICIAL_LOGO_COLORS.check}"/></g>`
    + '</svg>';
}

/**
 * Converts SVG markup to a data URL.
 * @param {string} svgMarkup - SVG markup
 * @returns {string} Data URL
 */
export function logoSvgToDataUrl(svgMarkup) {
  return 'data:image/svg+xml,' + encodeURIComponent(svgMarkup);
}
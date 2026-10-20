/**
 * Teilt TypeScript mit, dass CSS-Dateien fuer das Aussehen importiert werden.
 * Next.js verarbeitet die Styles; aus dem CSS wird kein JavaScript-Wert gelesen.
 */

declare module "*.css" {}

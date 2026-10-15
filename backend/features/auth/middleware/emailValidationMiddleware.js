// Compatibility shim for older imports
// Some deployed environments still import this legacy path.
// Forward to the new, consolidated middleware implementation.
export { default } from './emailValidationMiddleware2.js';
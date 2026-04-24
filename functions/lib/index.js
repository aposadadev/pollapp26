/**
 * Firebase Functions — Entry point
 * Inicializa firebase-admin y exporta todas las functions.
 */
import * as admin from 'firebase-admin'
// Inicializar el SDK de Admin (usa Application Default Credentials en Cloud Functions)
if (!admin.apps.length) {
  admin.initializeApp()
}
// ── Triggers ──────────────────────────────────────────────────────────────────
export { onMatchClosed } from './triggers/onMatchClosed.js'
// ── Callables ─────────────────────────────────────────────────────────────────
export { activateBoard } from './callables/activateBoard.js'
export { requestBoard } from './callables/requestBoard.js'
export { createGroup } from './callables/createGroup.js'
// ── Scheduled ─────────────────────────────────────────────────────────────────
// Para agregar nuevas notificaciones programadas: crear el archivo en
// src/scheduled/ y exportarlo aquí.
export { sendMatchReminders } from './scheduled/matchReminders.js'

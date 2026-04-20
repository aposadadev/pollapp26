/**
 * Convierte un error de Firebase (o cualquier error) en un mensaje
 * amigable para mostrar al usuario. Nunca expone códigos internos de Firebase.
 */

const FIREBASE_ERROR_MAP: Record<string, string> = {
  // Auth
  'auth/user-not-found': 'No encontramos una cuenta con ese correo.',
  'auth/wrong-password': 'La contraseña es incorrecta.',
  'auth/invalid-email': 'El correo no es válido.',
  'auth/email-already-in-use': 'Ya existe una cuenta con ese correo.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde.',
  'auth/network-request-failed': 'Sin conexión. Revisa tu internet.',
  'auth/popup-closed-by-user': 'Inicio de sesión cancelado.',
  'auth/requires-recent-login': 'Necesitas volver a iniciar sesión.',
  'auth/invalid-credential': 'Credenciales incorrectas. Verifica tu correo y contraseña.',
  // Firestore
  'permission-denied': 'No tienes permiso para realizar esta acción.',
  'unavailable': 'Servicio no disponible. Intenta más tarde.',
  'not-found': 'No encontramos lo que buscas.',
  'already-exists': 'Este elemento ya existe.',
  'resource-exhausted': 'Demasiadas solicitudes. Intenta más tarde.',
  'deadline-exceeded': 'La solicitud tardó demasiado. Intenta más tarde.',
  'unauthenticated': 'Necesitas iniciar sesión para continuar.',
  'cancelled': 'La operación fue cancelada.',
  'internal': 'Error interno. Intenta más tarde.',
}

const NETWORK_MESSAGES = ['network', 'failed to fetch', 'fetch', 'timeout', 'net::err']

export function parseFirebaseError(err: unknown, fallback = 'Ocurrió un error. Intenta de nuevo.'): string {
  if (!err) return fallback

  const error = err as { code?: string; message?: string }

  // Firebase error code (e.g. "auth/wrong-password" or "permission-denied")
  if (error.code) {
    const mapped = FIREBASE_ERROR_MAP[error.code]
    if (mapped) return mapped
  }

  // Check the message for network hints
  const msg = (error.message ?? '').toLowerCase()
  if (NETWORK_MESSAGES.some(k => msg.includes(k))) {
    return 'Sin conexión. Revisa tu internet e intenta de nuevo.'
  }

  // Don't expose internal Firebase messages to the user
  if (msg.includes('firestore') || msg.includes('firebase') || msg.includes('[') ) {
    return fallback
  }

  return fallback
}

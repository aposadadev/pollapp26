import { readFileSync } from 'fs'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

// Cargar variables de entorno desde .env
function loadEnv() {
  try {
    const env = readFileSync('.env', 'utf-8')
    env.split('\n').forEach((line) => {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length && !key.startsWith('#')) {
        process.env[key.trim()] = valueParts.join('=').trim()
      }
    })
  } catch {
    // env file not found — ignore
  }
}
loadEnv()

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')

if (!projectId || !clientEmail || !privateKey) {
  console.error('❌ ERROR: Faltan credenciales de Firebase Admin en .env (FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY)')
  process.exit(1)
}

// Inicializar Admin SDK
const app = getApps().length
  ? getApps()[0]!
  : initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey
      })
    })

const adminAuth = getAuth(app)
const adminDb = getFirestore(app)

const EMAIL = process.argv[2]

async function main() {
  if (!EMAIL) {
    console.error('❌ ERROR: Debes especificar el correo del usuario.')
    console.log('👉 Uso: npx tsx scripts/fix-admin.ts <correo@ejemplo.com>')
    process.exit(1)
  }
  console.log(`🔍 Buscando usuario con email: ${EMAIL}...`)
  try {
    const userRecord = await adminAuth.getUserByEmail(EMAIL)
    const uid = userRecord.uid
    console.log(`✅ Usuario encontrado en Auth. UID: ${uid}`)

    console.log('🔑 Asignando Custom Claim de Admin ({ admin: true })...')
    await adminAuth.setCustomUserClaims(uid, { admin: true })
    console.log('✅ Custom Claims actualizadas.')

    console.log('📝 Actualizando documento en Firestore users/' + uid + '...')
    const userRef = adminDb.collection('users').doc(uid)
    await userRef.set({
      id: uid,
      email: EMAIL,
      displayName: userRecord.displayName || 'Andrés Posada',
      isAdmin: true,
      updatedAt: new Date()
    }, { merge: true })
    console.log('✅ Documento Firestore actualizado con isAdmin: true.')

    console.log('\n🎉 ¡Proceso completado con éxito!')
    console.log('👉 NOTA IMPORTANTE: Para aplicar los cambios, debes CERRAR SESIÓN en la app y volver a INICIAR SESIÓN para forzar la generación de un nuevo token con tus privilegios de Administrador.')
    process.exit(0)
  } catch (err: unknown) {
    console.error('❌ Error al procesar:', (err as Error).message)
    process.exit(1)
  }
}

main()

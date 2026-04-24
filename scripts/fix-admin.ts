import { readFileSync } from 'fs'

import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'

function loadEnv() {
  try {
    const env = readFileSync('.env', 'utf-8')
    env.split('\n').forEach((line) => {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length && !key.startsWith('#')) process.env[key.trim()] = valueParts.join('=').trim()
    })
  } catch {
    // env file not found — ignore
  }
}
loadEnv()

const app = initializeApp({
  apiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID
})

const db = getFirestore(app)
const auth = getAuth(app)

const EMAIL = 'andres.posada0919@gmail.com'
const PASSWORD = process.argv[2]

async function main() {
  if (!PASSWORD) {
    console.error('❌ Usa: npx tsx scripts/fix-admin.ts <password>')
    process.exit(1)
  }

  console.log(`🔑 Iniciando sesión como ${EMAIL}...`)
  const cred = await signInWithEmailAndPassword(auth, EMAIL, PASSWORD)
  const uid = cred.user.uid
  console.log(`✅ UID: ${uid}`)

  console.log('📝 Recreando documento en Firestore...')
  await setDoc(doc(db, 'users', uid), {
    id: uid,
    email: EMAIL,
    displayName: 'Andrés Posada',
    createdAt: serverTimestamp()
  })
  console.log('✅ Documento users/' + uid + ' creado correctamente.')
  console.log('🎉 Ya puedes hacer login en la app.')
  process.exit(0)
}

main().catch((err) => {
  console.error('❌', err.message)
  process.exit(1)
})

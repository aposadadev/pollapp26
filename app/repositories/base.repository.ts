/**
 * BaseRepository
 * Classe base con helpers de Firestore. Todos los repositories la extienden.
 * No contiene lógica de negocio — solo operaciones CRUD genéricas.
 *
 * IMPORTANTE: db se resuelve de forma lazy en cada operación mediante useNuxtApp()
 * para garantizar que el plugin de Firebase ya esté inicializado.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  type Firestore,
  type CollectionReference,
  type DocumentReference,
  type QueryConstraint,
  type DocumentData
} from 'firebase/firestore'

function getDb(): Firestore {
  return useNuxtApp().$firestore as Firestore
}

export class BaseRepository<T extends { id: string }> {
  protected collectionName: string

  constructor(collectionName: string) {
    this.collectionName = collectionName
  }

  protected get ref(): CollectionReference<DocumentData> {
    return collection(getDb(), this.collectionName)
  }

  protected docRef(id: string): DocumentReference<DocumentData> {
    return doc(getDb(), this.collectionName, id)
  }

  async findById(id: string): Promise<T | null> {
    const snap = await getDoc(this.docRef(id))
    if (!snap.exists()) return null
    return this.mapDoc(snap.id, snap.data())
  }

  async findAll(constraints: QueryConstraint[] = []): Promise<T[]> {
    const r = this.ref
    const q = constraints.length ? query(r, ...constraints) : r
    const snap = await getDocs(q)
    return snap.docs.map(d => this.mapDoc(d.id, d.data()))
  }

  async findWhere(field: string, op: Parameters<typeof where>[1], value: unknown): Promise<T[]> {
    return this.findAll([where(field, op, value)])
  }

  async create(data: Omit<T, 'id' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(this.ref, {
      ...data,
      createdAt: serverTimestamp()
    })
    return docRef.id
  }

  async createWithId(id: string, data: Omit<T, 'id' | 'createdAt'>): Promise<void> {
    await setDoc(doc(getDb(), this.collectionName, id), {
      ...data,
      createdAt: serverTimestamp()
    })
  }

  async update(id: string, data: Partial<Omit<T, 'id'>>): Promise<void> {
    await updateDoc(this.docRef(id), { ...data })
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(this.docRef(id))
  }

  /** Convierte un documento Firestore al tipo T. Sobreescribir en subclases si es necesario. */
  protected mapDoc(id: string, data: DocumentData): T {
    return {
      ...data,
      id,
      createdAt: data['createdAt']?.toDate?.() ?? new Date()
    } as unknown as T
  }

  // Helpers re-exportados para usar en subclases
  protected where = where
  protected orderBy = orderBy
  protected limit = limit
  protected serverTimestamp = serverTimestamp
}

/**
 * BoardService — Lógica de negocio de tablas (boards)
 * Orquesta la creación, activación y consulta de boards.
 */
import { boardRepository } from '~/repositories/board.repository'
import { predictionRepository } from '~/repositories/prediction.repository'
import { matchRepository } from '~/repositories/match.repository'
import type { Board } from '~/types'

export class BoardError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'BoardError'
  }
}

export class BoardService {
  /** Solicitar una tabla en un grupo (queda pendiente hasta que admin la active).
   *
   * La creación va a través del endpoint `/api/board/request` (Nuxt server API)
   * para que el contador de número sea gestionado exclusivamente server-side vía
   * Admin SDK, evitando la race condition y garantizando que _counters no sea
   * writeable por clientes.
   */
  async requestBoard(userId: string, groupId: string, tournamentId: string): Promise<Board> {
    // Obtener el ID Token del usuario actual para autenticar la petición
    const { $firebaseAuth } = useNuxtApp() as unknown as {
      $firebaseAuth: import('firebase/auth').Auth
    }
    const currentUser = $firebaseAuth.currentUser
    if (!currentUser) {
      throw new BoardError('No hay usuario autenticado.', 'auth/no-user')
    }
    const idToken = await currentUser.getIdToken()

    const result = await $fetch<{ success: boolean, boardId: string, number: number }>(
      '/api/board/request',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
        body: { groupId, tournamentId }
      }
    )

    const { boardId, number } = result

    // Obtener el board recién creado desde Firestore
    const board = await boardRepository.findById(boardId)
    if (!board) {
      throw new BoardError('Tabla creada pero no encontrada al releer.', 'board/not-found-after-create')
    }

    return { ...board, number }
  }

  /** Activar una tabla pendiente y crear todas las predicciones vacías */
  async activateBoard(boardId: string, _tournamentId?: string): Promise<void> {
    const board = await boardRepository.findById(boardId)
    if (!board) throw new BoardError('Tabla no encontrada.', 'board/not-found')
    if (board.isActive) throw new BoardError('La tabla ya está activa.', 'board/already-active')

    // Usar siempre el tournamentId del propio board — ignorar parámetro externo
    const matches = await matchRepository.findByTournament(board.tournamentId)
    if (!matches.length) throw new BoardError('No hay partidos cargados para este torneo.', 'board/no-matches')

    // Crear predicciones vacías en batch
    await predictionRepository.batchCreate(boardId, matches.map(m => m.id))

    // Activar la tabla
    await boardRepository.activate(boardId)
  }

  async findById(boardId: string): Promise<Board | null> {
    return boardRepository.findById(boardId)
  }

  async findByUser(userId: string): Promise<Board[]> {
    return boardRepository.findByUser(userId)
  }

  async findPendingByGroup(groupId: string): Promise<Board[]> {
    return boardRepository.findPendingByGroup(groupId)
  }

  async findActiveByGroup(groupId: string): Promise<Board[]> {
    return boardRepository.findActiveByGroup(groupId)
  }

  /** Valida que un board pertenece al usuario */
  async validateOwnership(boardId: string, userId: string): Promise<Board> {
    const board = await boardRepository.findById(boardId)
    if (!board) throw new BoardError('Tabla no encontrada.', 'board/not-found')
    if (board.userId !== userId) throw new BoardError('No tienes permiso para acceder a esta tabla.', 'board/forbidden')
    if (!board.isActive) throw new BoardError('Esta tabla no está activa.', 'board/not-active')
    return board
  }
}

export const boardService = new BoardService()

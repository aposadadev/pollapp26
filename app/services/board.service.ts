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
   * La creación va a través del callable `requestBoard` (Cloud Function) para que
   * el contador de número sea gestionado exclusivamente server-side vía Admin SDK,
   * evitando la race condition y garantizando que _counters no sea writeable por clientes.
   */
  async requestBoard(userId: string, groupId: string, tournamentId: string): Promise<Board> {
    const { httpsCallable } = await import('firebase/functions')
    const { $firebaseFunctions } = useNuxtApp() as unknown as {
      $firebaseFunctions: import('firebase/functions').Functions
    }

    const callFn = httpsCallable<
      { groupId: string, tournamentId: string },
      { success: boolean, boardId: string, number: number }
    >($firebaseFunctions, 'requestBoard')

    const result = await callFn({ groupId, tournamentId })
    const { boardId, number } = result.data

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

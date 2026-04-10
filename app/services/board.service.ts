/**
 * BoardService — Lógica de negocio de tablas (boards)
 * Orquesta la creación, activación y consulta de boards.
 */
import { boardRepository } from '~/repositories/board.repository'
import { predictionRepository } from '~/repositories/prediction.repository'
import { matchRepository } from '~/repositories/match.repository'
import { groupRepository } from '~/repositories/group.repository'
import { userRepository } from '~/repositories/user.repository'
import type { Board } from '~/types'

export class BoardError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'BoardError'
  }
}

export class BoardService {
  /** Solicitar una tabla en un grupo (queda pendiente hasta que admin la active) */
  async requestBoard(userId: string, groupId: string, tournamentId: string): Promise<Board> {
    console.log('BoardService.requestBoard called', { userId, groupId, tournamentId })

    // Validar que no exista ya una tabla para este usuario en este grupo
    const existing = await boardRepository.findByUserAndGroup(userId, groupId)
    console.log('Existing board:', existing)

    if (existing) {
      throw new BoardError(
        'Ya tienes una tabla en este grupo.',
        'board/already-exists'
      )
    }

    // Determinar número correlativo de la tabla
    const boardsInGroup = await boardRepository.findByGroup(groupId)
    console.log('Boards in group:', boardsInGroup.length)
    const number = 1000 + boardsInGroup.length + 1

    const [user, group] = await Promise.all([
      userRepository.findById(userId),
      groupRepository.findById(groupId)
    ])
    console.log('User:', user)
    console.log('Group:', group)

    if (!user) {
      throw new BoardError('Usuario no encontrado', 'user/not-found')
    }

    if (!group) {
      throw new BoardError('Grupo no encontrado', 'group/not-found')
    }

    const id = await boardRepository.create({
      userId,
      userDisplayName: user.displayName ?? '',
      groupId,
      groupName: group.name ?? '',
      tournamentId,
      number,
      isActive: false,
      totalPoints: 0,
      predsThreePoints: 0,
      predsOnePoints: 0,
      currentPos: 0,
      previousPos: 0
    })
    console.log('Board created with id:', id)

    return {
      id,
      userId,
      userDisplayName: user.displayName ?? '',
      groupId,
      groupName: group.name ?? '',
      tournamentId,
      number,
      isActive: false,
      totalPoints: 0,
      predsThreePoints: 0,
      predsOnePoints: 0,
      currentPos: 0,
      previousPos: 0,
      createdAt: new Date()
    }
  }

  /** Activar una tabla pendiente y crear todas las predicciones vacías */
  async activateBoard(boardId: string, tournamentId: string): Promise<void> {
    const board = await boardRepository.findById(boardId)
    if (!board) throw new BoardError('Tabla no encontrada.', 'board/not-found')
    if (board.isActive) throw new BoardError('La tabla ya está activa.', 'board/already-active')

    // Obtener todos los partidos del torneo
    const matches = await matchRepository.findByTournament(tournamentId)
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

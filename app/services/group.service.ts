/**
 * GroupService — Lógica de negocio de grupos
 * Genera códigos únicos y valida las reglas de negocio antes de persistir.
 */
import { nanoid } from 'nanoid'
import { groupRepository } from '~/repositories/group.repository'
import type { Group, GroupWithBoardStatus } from '~/types'
import { boardRepository } from '~/repositories/board.repository'

export class GroupService {
  private generateCode(): string {
    return nanoid(6).toUpperCase()
  }

  async createGroup(name: string, ownerId: string, ownerName: string, tournamentId: string): Promise<Group> {
    // Garantizar código único
    let code = this.generateCode()
    let attempts = 0
    while (attempts < 5) {
      const existing = await groupRepository.findByCode(code)
      if (!existing) break
      code = this.generateCode()
      attempts++
    }

    const id = await groupRepository.create({
      name: name.trim(),
      code,
      ownerId,
      ownerName,
      tournamentId,
      isActive: true
    })

    return {
      id,
      name: name.trim(),
      code,
      ownerId,
      ownerName,
      tournamentId,
      isActive: true,
      createdAt: new Date()
    }
  }

  async findByCode(code: string): Promise<Group | null> {
    return groupRepository.findByCode(code)
  }

  async findByTournament(tournamentId: string): Promise<Group[]> {
    return groupRepository.findByTournament(tournamentId)
  }

  async findAll(): Promise<Group[]> {
    return groupRepository.findAll()
  }

  /** Obtiene los grupos del torneo donde el usuario tiene una tabla (activa o pendiente) */
  async findForUser(tournamentId: string, userId: string): Promise<GroupWithBoardStatus[]> {
    // 1. Obtener las tablas del usuario para este torneo
    const userBoards = await boardRepository.findByUser(userId)
    const tournamentBoards = userBoards.filter(b => b.tournamentId === tournamentId)
    
    if (tournamentBoards.length === 0) return []

    // 2. Obtener los detalles de los grupos correspondientes
    const groups = await Promise.all(
      tournamentBoards.map(b => groupRepository.findById(b.groupId))
    )

    // 3. Mapear y enriquecer los datos
    const result: GroupWithBoardStatus[] = []
    for (let i = 0; i < tournamentBoards.length; i++) {
        const board = tournamentBoards[i]
        const group = groups[i]
        if (group) {
           result.push({
             ...group,
             userBoardId: board.id,
             userBoardIsActive: board.isActive,
             userBoardIsPending: !board.isActive
           })
        }
    }
    
    // Devolvemos ordenado por fecha de creación del grupo (o del board)
    return result
  }
}

export const groupService = new GroupService()

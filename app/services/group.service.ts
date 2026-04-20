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

  /** Obtiene los grupos del torneo enriquecidos con el estado de la tabla del usuario actual */
  async findForUser(tournamentId: string, userId: string): Promise<GroupWithBoardStatus[]> {
    const groups = await groupRepository.findByTournament(tournamentId)

    const boards = await Promise.all(
      groups.map(g => boardRepository.findByUserAndGroup(userId, g.id))
    )

    return groups.map((group, i) => {
      const board = boards[i]
      return {
        ...group,
        userBoardId: board?.id,
        userBoardIsActive: board?.isActive ?? false,
        userBoardIsPending: board ? !board.isActive : false
      }
    })
  }
}

export const groupService = new GroupService()

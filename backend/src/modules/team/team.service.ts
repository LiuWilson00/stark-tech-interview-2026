import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from './entities/team.entity';
import { TeamMember, TeamRole } from './entities/team-member.entity';
import { CreateTeamDto } from './dto/create-team.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { TEAM_ERRORS } from '../../common/errors';

@Injectable()
export class TeamService {
  constructor(
    @InjectRepository(Team)
    private teamRepository: Repository<Team>,
    @InjectRepository(TeamMember)
    private teamMemberRepository: Repository<TeamMember>,
  ) {}

  async findUserTeams(userId: string): Promise<Team[]> {
    const memberships = await this.teamMemberRepository.find({
      where: { userId },
      relations: ['team', 'team.owner'],
    });

    return memberships.map((m) => m.team);
  }

  async findById(id: string): Promise<Team | null> {
    return this.teamRepository.findOne({
      where: { id },
      relations: ['owner', 'members', 'members.user'],
    });
  }

  async create(userId: string, createTeamDto: CreateTeamDto): Promise<Team | null> {
    const team = this.teamRepository.create({
      ...createTeamDto,
      ownerId: userId,
    });

    const savedTeam = await this.teamRepository.save(team);

    // Add creator as owner member
    await this.teamMemberRepository.save({
      teamId: savedTeam.id,
      userId,
      role: TeamRole.OWNER,
    });

    return this.findById(savedTeam.id);
  }

  async update(
    teamId: string,
    userId: string,
    data: Partial<CreateTeamDto>,
  ): Promise<Team | null> {
    const team = await this.findById(teamId);

    if (!team) {
      throw new NotFoundException(TEAM_ERRORS.TEAM_NOT_FOUND);
    }

    const membership = await this.findMembership(teamId, userId);
    if (!membership || !this.canManageTeam(membership.role)) {
      throw new ForbiddenException(TEAM_ERRORS.NOT_TEAM_ADMIN);
    }

    await this.teamRepository.update(teamId, data);
    return this.findById(teamId);
  }

  async getMembers(teamId: string): Promise<TeamMember[]> {
    return this.teamMemberRepository.find({
      where: { teamId },
      relations: ['user'],
    });
  }

  async addMember(
    teamId: string,
    requesterId: string,
    addMemberDto: AddMemberDto,
  ): Promise<TeamMember> {
    const team = await this.findById(teamId);

    if (!team) {
      throw new NotFoundException(TEAM_ERRORS.TEAM_NOT_FOUND);
    }

    const requesterMembership = await this.findMembership(teamId, requesterId);
    if (!requesterMembership || !this.canManageTeam(requesterMembership.role)) {
      throw new ForbiddenException(TEAM_ERRORS.NOT_TEAM_ADMIN);
    }

    const existingMember = await this.findMembership(teamId, addMemberDto.userId);
    if (existingMember) {
      throw new ConflictException(TEAM_ERRORS.ALREADY_TEAM_MEMBER);
    }

    const member = this.teamMemberRepository.create({
      teamId,
      userId: addMemberDto.userId,
      role: addMemberDto.role,
    });

    return this.teamMemberRepository.save(member);
  }

  async removeMember(
    teamId: string,
    requesterId: string,
    userId: string,
  ): Promise<void> {
    const team = await this.findById(teamId);

    if (!team) {
      throw new NotFoundException(TEAM_ERRORS.TEAM_NOT_FOUND);
    }

    if (team.ownerId === userId) {
      throw new ForbiddenException(TEAM_ERRORS.CANNOT_REMOVE_OWNER);
    }

    const requesterMembership = await this.findMembership(teamId, requesterId);
    if (!requesterMembership || !this.canManageTeam(requesterMembership.role)) {
      throw new ForbiddenException(TEAM_ERRORS.NOT_TEAM_ADMIN);
    }

    await this.teamMemberRepository.delete({ teamId, userId });
  }

  async findMembership(
    teamId: string,
    userId: string,
  ): Promise<TeamMember | null> {
    return this.teamMemberRepository.findOne({
      where: { teamId, userId },
    });
  }

  async isTeamMember(teamId: string, userId: string): Promise<boolean> {
    const membership = await this.findMembership(teamId, userId);
    return !!membership;
  }

  private canManageTeam(role: TeamRole): boolean {
    return role === TeamRole.OWNER || role === TeamRole.ADMIN;
  }
}

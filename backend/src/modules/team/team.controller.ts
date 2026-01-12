import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TeamService } from './team.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../user/entities/user.entity';

@ApiTags('Teams')
@ApiBearerAuth()
@Controller('teams')
export class TeamController {
  constructor(private teamService: TeamService) {}

  @Get()
  @ApiOperation({ summary: 'Get user teams' })
  async getTeams(@CurrentUser() user: User) {
    return this.teamService.findUserTeams(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new team' })
  async createTeam(
    @CurrentUser() user: User,
    @Body() createTeamDto: CreateTeamDto,
  ) {
    return this.teamService.create(user.id, createTeamDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get team by ID' })
  async getTeam(@Param('id', ParseUUIDPipe) id: string) {
    return this.teamService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update team' })
  async updateTeam(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() updateTeamDto: Partial<CreateTeamDto>,
  ) {
    return this.teamService.update(id, user.id, updateTeamDto);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get team members' })
  async getMembers(@Param('id', ParseUUIDPipe) id: string) {
    return this.teamService.getMembers(id);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add team member' })
  async addMember(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() addMemberDto: AddMemberDto,
  ) {
    return this.teamService.addMember(id, user.id, addMemberDto);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remove team member' })
  async removeMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() user: User,
  ) {
    await this.teamService.removeMember(id, user.id, userId);
    return { success: true };
  }
}

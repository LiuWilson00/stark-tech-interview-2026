import { IsUUID, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TeamRole } from '../entities/team-member.entity';

export class AddMemberDto {
  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({ enum: TeamRole, default: TeamRole.MEMBER })
  @IsOptional()
  @IsEnum(TeamRole)
  role?: TeamRole = TeamRole.MEMBER;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { Role } from '../../common/constants/role';

export class UpdateRoleDto {
  @ApiProperty({ enum: Role, description: 'Target role', example: Role.MODERATOR })
  @IsEnum(Role)
  role: Role;
}

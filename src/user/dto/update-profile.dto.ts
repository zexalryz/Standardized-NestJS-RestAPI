import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ description: 'New email address', example: 'newemail@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;
}

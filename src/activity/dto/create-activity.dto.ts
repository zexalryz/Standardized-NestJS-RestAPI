import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreateActivityDto {
  @ApiProperty({ description: 'Activity type', example: 'login' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  type: string;

  @ApiProperty({ description: 'Optional detail', example: 'Logged in as admin', required: false })
  @IsString()
  @MaxLength(500)
  detail?: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: 'Username', example: 'john_doe' })
  @IsString()
  @MinLength(1)
  username: string;

  @ApiProperty({ description: 'Password', example: 'Str0ng!Pass' })
  @IsString()
  @MinLength(1)
  password: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DeviceTokenDto {
  @ApiProperty({ example: 'fcm-device-token-string-xyz' })
  @IsString()
  @IsNotEmpty()
  token: string;
}

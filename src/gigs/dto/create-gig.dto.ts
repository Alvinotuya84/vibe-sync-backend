import {
  IsString,
  IsNumber,
  IsArray,
  IsEnum,
  Min,
  MaxLength,
} from 'class-validator';
import { GigStatus } from '../entities/gig.entity';

export class CreateGigDto {
  @IsString()
  @MaxLength(100)
  title: string;

  @IsString()
  @MaxLength(1000)
  description: string;

  @IsNumber()
  @Min(1)
  price: number;

  @IsArray()
  @IsString({ each: true })
  skills: string[];

  @IsEnum(GigStatus)
  status: GigStatus = GigStatus.ACTIVE;
}

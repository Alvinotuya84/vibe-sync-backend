import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  text: string;

  @IsUUID()
  contentId: string;

  @IsUUID()
  @IsOptional()
  parentCommentId?: string;
}

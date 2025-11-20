import { PartialType } from '@nestjs/swagger';
import { CreateCabinetDto } from './create-cabinet.dto';

export class UpdateCabinetDto extends PartialType(CreateCabinetDto) {}

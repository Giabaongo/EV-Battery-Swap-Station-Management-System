import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class ParseDecimalPipe implements PipeTransform {
    constructor() { }

    transform(value: any, metadata: ArgumentMetadata): Decimal | undefined {
        if (value === undefined || value === null || value === '') {
            throw new BadRequestException(`${metadata.data} is required`);
        }
        try {

            return new Decimal(value);
        }
        catch (error) {
            throw new BadRequestException(`${metadata.data} must be a valid decimal number`);
        }
    }
}

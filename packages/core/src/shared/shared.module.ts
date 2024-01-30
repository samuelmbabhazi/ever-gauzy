import { Module } from '@nestjs/common';
import { ValidatorModule } from './validators/validator.module';

@Module({
	imports: [ValidatorModule],
	exports: []
})
export class SharedModule { }

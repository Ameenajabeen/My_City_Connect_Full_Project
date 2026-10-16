import { Module } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { DepartmentAllocationService } from './department-allocation.service';
import { DepartmentsController } from './departments.controller';

@Module({
  controllers: [DepartmentsController],
  providers: [DepartmentsService, DepartmentAllocationService],
  exports: [DepartmentsService, DepartmentAllocationService],
})
export class DepartmentsModule {}

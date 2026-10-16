import { Injectable, Logger } from '@nestjs/common';
import { ComplaintCategory } from '../common/enums';
import { CATEGORY_DEFINITIONS } from '../common/constants/categories.constant';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class DepartmentAllocationService {
  private readonly logger = new Logger(DepartmentAllocationService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Centralized rule-based department resolution.
   * Maps civic issue category to the responsible administrative department.
   */
  async resolveDepartmentForCategory(category: ComplaintCategory): Promise<{
    departmentId: string | null;
    departmentCode: string;
    departmentName: string;
  }> {
    const meta = CATEGORY_DEFINITIONS[category] || CATEGORY_DEFINITIONS[ComplaintCategory.OTHER];

    if (this.prisma.isConnected) {
      // Find matching department in PostgreSQL or seed if not yet present
      let dept = await this.prisma.department.findUnique({
        where: { code: meta.defaultDepartmentCode },
      });

      if (!dept) {
        dept = await this.prisma.department.create({
          data: {
            code: meta.defaultDepartmentCode,
            name: meta.defaultDepartmentName,
            active: true,
          },
        });
      }

      return {
        departmentId: dept.id,
        departmentCode: dept.code,
        departmentName: dept.name,
      };
    }

    return {
      departmentId: 'dept-' + meta.defaultDepartmentCode.toLowerCase(),
      departmentCode: meta.defaultDepartmentCode,
      departmentName: meta.defaultDepartmentName,
    };
  }
}

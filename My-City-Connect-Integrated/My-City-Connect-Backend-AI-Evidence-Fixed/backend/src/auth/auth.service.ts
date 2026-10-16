import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { RegisterWorkerDto } from './dto/register-worker.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '../common/enums';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const role = dto.role || UserRole.CITIZEN;
    if (role !== UserRole.CITIZEN) {
      throw new BadRequestException('Public registration is limited to citizen accounts. Provision officer/worker accounts through an administrator or the demo seed script.');
    }

    return this.createAccount(dto, UserRole.CITIZEN);
  }

  async registerWorker(dto: RegisterWorkerDto) {
    return this.createAccount(dto, UserRole.WORKER);
  }

  private async createAccount(dto: RegisterDto | RegisterWorkerDto, role: UserRole) {
    const normalizedEmail = dto.email.toLowerCase().trim();

    if (!this.prisma.isConnected) {
      throw new BadRequestException('Database is unavailable. Registration requires the common database.');
    }

    if (role === UserRole.WORKER) {
      const department = await this.prisma.department.findFirst({
        where: { id: dto.departmentId, active: true },
        select: { id: true },
      });
      if (!department) throw new BadRequestException('Select a valid active department.');
    }

    const existing = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) throw new ConflictException('An account with this email address already exists');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          name: dto.name,
          phone: dto.phone,
          role,
          preferredLanguage: ('preferredLanguage' in dto && dto.preferredLanguage) || 'en',
        },
      });

      if (role === UserRole.CITIZEN) {
        await tx.citizenProfile.create({ data: { userId: created.id } });
      } else if (role === UserRole.WORKER) {
        const employeeId = ('employeeId' in dto ? dto.employeeId?.trim() : '') || `EMP-${Date.now().toString().slice(-6)}`;
        await tx.worker.create({
          data: {
            userId: created.id,
            employeeId,
            departmentId: dto.departmentId!,
            availability: 'AVAILABLE',
          },
        });
      } else if (role === UserRole.OFFICER) {
        await tx.officer.create({
          data: {
            userId: created.id,
            badgeNumber: ('badgeNumber' in dto ? dto.badgeNumber?.trim() : '') || `BADGE-${Date.now().toString().slice(-6)}`,
            departmentId: dto.departmentId,
          },
        });
      }

      return tx.user.findUnique({
        where: { id: created.id },
        include: {
          citizenProfile: true,
          workerProfile: { include: { department: true } },
          officerProfile: { include: { department: true } },
        },
      });
    });

    if (!user) throw new BadRequestException('Unable to create account');

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.toSafeUser(user),
    };
  }

  async login(dto: LoginDto) {
    if (!this.prisma.isConnected) {
      throw new UnauthorizedException('Common database is unavailable.');
    }

    const identifier = (dto.identifier || dto.email || dto.employeeId || '').trim();
    if (!identifier) throw new UnauthorizedException('Email or employee ID is required');

    const user = dto.employeeId
      ? await this.prisma.user.findFirst({
          where: { workerProfile: { employeeId: identifier.toUpperCase() } },
          include: {
            citizenProfile: true,
            workerProfile: { include: { department: true } },
            officerProfile: { include: { department: true } },
          },
        })
      : await this.prisma.user.findFirst({
          where: { OR: [{ email: identifier.toLowerCase() }, { workerProfile: { employeeId: identifier.toUpperCase() } }] },
          include: {
            citizenProfile: true,
            workerProfile: { include: { department: true } },
            officerProfile: { include: { department: true } },
          },
        });

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      token: tokens.accessToken,
      user: this.toSafeUser(user),
      worker: user.workerProfile ? this.toWorkerProfile(user) : undefined,
      officer: user.officerProfile ? this.toOfficerProfile(user) : undefined,
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      if (this.prisma.isConnected) {
        const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
        if (!user || !user.refreshToken || !(await bcrypt.compare(refreshToken, user.refreshToken))) {
          throw new UnauthorizedException('Refresh token is invalid');
        }
      }

      const tokens = await this.generateTokens(payload.sub, payload.email, payload.role);
      await this.updateRefreshToken(payload.sub, tokens.refreshToken);
      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string) {
    if (this.prisma.isConnected) {
      await this.prisma.user.update({ where: { id: userId }, data: { refreshToken: null } });
    }
    return { loggedOut: true };
  }

  async getMe(userId: string) {
    if (!this.prisma.isConnected) throw new UnauthorizedException('Database unavailable');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        citizenProfile: true,
        workerProfile: { include: { department: true } },
        officerProfile: { include: { department: true } },
      },
    });

    if (!user) throw new UnauthorizedException('User not found');

    return this.toSafeUser(user);
  }

  private toSafeUser(user: any) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      preferredLanguage: user.preferredLanguage,
      avatarUrl: user.avatarUrl,
      citizenProfile: user.citizenProfile || null,
      worker: user.workerProfile ? this.toWorkerProfile(user) : null,
      officer: user.officerProfile ? this.toOfficerProfile(user) : null,
    };
  }

  private toWorkerProfile(user: any) {
    const worker = user.workerProfile;
    return {
      id: worker.id,
      userId: user.id,
      employeeId: worker.employeeId,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      departmentId: worker.departmentId,
      department: worker.department?.name || '',
      assignedZone: worker.department?.code || '',
      role: user.role,
      isAvailable: worker.availability === 'AVAILABLE',
      availability: worker.availability,
      currentLatitude: worker.latitude,
      currentLongitude: worker.longitude,
      preferredLocation: worker.preferredLocation,
      rating: worker.rating,
      completedTasksCount: 0,
      profilePhotoUrl: user.avatarUrl,
    };
  }

  private toOfficerProfile(user: any) {
    const officer = user.officerProfile;
    return {
      id: officer.id,
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      badgeNumber: officer.badgeNumber,
      departmentId: officer.departmentId,
      departmentName: officer.department?.name || '',
      avatarUrl: user.avatarUrl,
    };
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.accessSecret'),
        expiresIn: this.configService.get<string>('jwt.accessExpiration'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>('jwt.refreshExpiration'),
      }),
    ]);
    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    if (!this.prisma.isConnected) return;
    const hashed = await bcrypt.hash(refreshToken, 8);
    await this.prisma.user.update({ where: { id: userId }, data: { refreshToken: hashed } });
  }
}

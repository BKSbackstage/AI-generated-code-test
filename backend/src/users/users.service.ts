import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByResetToken(token: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { passwordResetToken: token } });
  }

  async findByVerificationToken(token: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { emailVerificationToken: token } });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(userData);
    return this.usersRepository.save(user);
  }

  async update(id: string, updateData: Partial<User>): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
    Object.assign(user, updateData);
    return this.usersRepository.save(user);
  }

  async updateProfile(id: string, updateProfileDto: UpdateProfileDto): Promise<User> {
    return this.update(id, updateProfileDto);
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await this.usersRepository.update(id, {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpiry: null,
    });
  }

  async setPasswordResetToken(id: string, token: string, expiry: Date): Promise<void> {
    await this.usersRepository.update(id, {
      passwordResetToken: token,
      passwordResetExpiry: expiry,
    });
  }

  async markEmailVerified(id: string): Promise<void> {
    await this.usersRepository.update(id, {
      isEmailVerified: true,
      emailVerificationToken: null,
    });
  }

  async saveRefreshToken(id: string, refreshToken: string): Promise<void> {
    await this.usersRepository.update(id, { refreshToken });
  }

  async clearRefreshToken(id: string): Promise<void> {
    await this.usersRepository.update(id, { refreshToken: null });
  }

  async findAll(page = 1, limit = 20): Promise<{ data: User[]; total: number }> {
    const [data, total] = await this.usersRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async setRole(id: string, role: UserRole): Promise<User> {
    await this.usersRepository.update(id, { role });
    return this.findById(id);
  }

  async deactivate(id: string): Promise<User> {
    await this.usersRepository.update(id, { isActive: false });
    return this.findById(id);
  }

  async activate(id: string): Promise<User> {
    await this.usersRepository.update(id, { isActive: true });
    return this.findById(id);
  }

  async approvePromoter(id: string): Promise<User> {
    await this.usersRepository.update(id, {
      role: UserRole.PROMOTER,
      isPromoterVerified: true,
    });
    return this.findById(id);
  }

  async getStatistics(): Promise<any> {
    const total = await this.usersRepository.count();
    const users = await this.usersRepository.count({ where: { role: UserRole.USER } });
    const promoters = await this.usersRepository.count({ where: { role: UserRole.PROMOTER } });
    const admins = await this.usersRepository.count({ where: { role: UserRole.SUPER_ADMIN } });
    const active = await this.usersRepository.count({ where: { isActive: true } });
    return { total, users, promoters, admins, active };
  }
}

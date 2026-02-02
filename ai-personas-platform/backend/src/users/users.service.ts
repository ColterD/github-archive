import { Injectable } from '@nestjs/common';
import { Prisma, Users } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(params: { email: string }): Promise<any> {
    const { email } = params;
    try {
      const user = await this.prisma.users.findUnique({
        where: { email },
      });
      if (!user) throw new Error('user not found');
      return user;
    } catch (error) {
      console.log('findOne error :', error.message);
      return null;
    }
  }
  //
  async findOneEmaiL(params: { email: string }): Promise<any> {
    const { email } = params;
    try {
      const user = await this.prisma.users.findUnique({
        where: { email },
      });
      if (!user) throw new Error('user not found');
      return user;
    } catch (error) {
      console.log('findOne error :', error.message);
      return null;
    }
  }
  async findOneById(params: { id: string }): Promise<any> {
    const { id } = params;
    try {
      const user = await this.prisma.users.findUnique({
        where: { id },
      });
      if (!user) throw new Error('user not found');
      return user;
    } catch (error) {
      console.log('findOne error :', error.message);
      return null;
    }
  }

  async findaLL(): Promise<any> {
    return this.prisma.users.findMany({});
  }

  async create(data: Prisma.UsersCreateInput): Promise<Users> {
    try {
      const UserStatus = await this.prisma.users.findUnique({
        where: {
          email: data.email,
        },
      });
      if (!UserStatus) throw new Error();
      return UserStatus;
    } catch (error) {
      return await this.prisma.users.create({
        data,
      });
    }
  }

  async update(params: {
    id: string;
    data: Prisma.UsersUpdateInput;
  }): Promise<Users> {
    const { id, data } = params;

    return await this.prisma.users.update({
      data,
      where: { id },
    });
  }

  async remove(id: string): Promise<Users> {
    return await this.prisma.users.delete({
      where: { id },
    });
  }

  async findOrCreate(profile: any): Promise<void> {
    console.log('profile :', profile);
  }
}

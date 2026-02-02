import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-oauth.guard';
import { Prisma } from '@prisma/client';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createUserDto: any) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.usersService.findaLL();
  }

  @UseGuards(JwtAuthGuard)
  @Get('/getuser')
  findUser(@Req() req: any) {
    return this.usersService.findOneById({ id: req.user.id });
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOneById({ id });
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: Prisma.UsersUpdateInput) {
    const user = await this.usersService.findOneById({ id });
    if (!user) return;
    return await this.usersService.update({ id, data });
  }

  // end of friends actions
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const user = await this.usersService.findOneById({ id });
    if (!user) return;
    return this.usersService.remove(id);
  }
}

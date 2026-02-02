import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';

import { Prisma, Users } from '@prisma/client';
import { AuthService } from './auth.service';
import { GoogleGuard } from './guards/google-oauth.guard';
import { MetaGuard } from './guards/meta-oauth.guard';
// import { AuthGuard } from '@nestjs/passport';
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @HttpCode(HttpStatus.OK)
  @Get('meta/callback')
  @UseGuards(MetaGuard)
  async MetaAuthCallback(@Req() req: any, @Res() res: Response) {
    try {
      const { accessToken } = await this.authService.signInWithGoogle(req.user);
      res.cookie('token', accessToken, {
        expires: new Date(Date.now() + 900000),
        httpOnly: false,
        sameSite: false,
      });
      return res.redirect(`${process.env.AUTH_REDIRECT_URI}`);
    } catch (error) {
      res.status(400).json(error);
    }
  }

  @HttpCode(HttpStatus.OK)
  @Get('google/callback')
  @UseGuards(GoogleGuard)
  async GoogleAuthCallback(@Req() req: any, @Res() res: Response) {
    try {
      const { accessToken } = await this.authService.signInWithGoogle(req.user);
      res.cookie('token', accessToken, {
        path: '/test',
        domain: '.colter.dev',
        expires: new Date(Date.now() + 900000),
        httpOnly: false,
        sameSite: false,
      });
      // printing the cookie
      console.log('cookie', res.cookie);
      return res.redirect(`${process.env.AUTH_REDIRECT_URI}`);
    } catch (error) {
      console.log('GoogleAuthCallback error :', error);
      return res.redirect(`${process.env.AUTH_REDIRECT_URI}`);
    }
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async signIn(@Body() signInDto: Record<string, any>) {
    try {
      const Data = await this.authService.signIn(
        signInDto.email,
        signInDto.password,
      );
      return Data;
    } catch (error) {
      return new NotFoundException();
    }
  }

  @HttpCode(HttpStatus.OK)
  @Post('register')
  async Register(@Body() signInDto: Prisma.UsersCreateInput) {
    try {
      const Data = await this.authService.Register(signInDto);
      return Data;
    } catch (error) {
      return null;
    }
  }

  @Get('verification/email/:id')
  async emailVerification(@Res() res: Response, @Param('id') id: string) {
    const response: Users | null = await this.authService.emailVerification(id);
    if (response) {
      const accessToken = this.authService.generateJwt({
        id: response.id,
      });
      res.cookie('token', accessToken, {
        expires: new Date(Date.now() + 900000),
        httpOnly: false,
        sameSite: false,
      });
      return res.redirect(`${process.env.AUTH_REDIRECT_URI}`);
    }
    return new UnauthorizedException();
  }

  @Post('forgotpassword')
  async forgotPasswordEmail(@Body() body: { email: string }) {
    return this.authService.forgotPasswordEmail(body);
  }

  @Post('forgotpassword/confirmation')
  async forgotPasswordConfirmation(
    @Body() body: { email: string; newPassword: string },
  ) {
    return this.authService.forgotPasswordConfirmation(body);
  }
}

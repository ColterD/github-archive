import { PassportStrategy } from '@nestjs/passport';
// import { Strategy } from 'passport-jwt';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Prisma, Users } from '@prisma/client';
import { Strategy } from 'passport-google-oauth20';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly userService: UsersService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URI,
      scope: ['profile', 'email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
  ): Promise<any> {
    const data = profile._json;
    const Data: Prisma.UsersCreateInput = {
      firstName: data.given_name,
      lastName: data.family_name,
      avatar: data.picture,
      email: data.email,
      is_active: true,
    };
    const User: Users = await this.userService.create(Data);
    return User;
   } catch (error: any) {
    return null
   }
}

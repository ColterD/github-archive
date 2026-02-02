import { PassportStrategy } from '@nestjs/passport';
// import { Strategy } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { Prisma, Users } from '@prisma/client';
import { Strategy } from 'passport-facebook';
import { UsersService } from 'src/users/users.service';
// import { Prisma } from '@prisma/client';

@Injectable()
export class MetaStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(private readonly userService: UsersService) {
    super({
      clientID: process.env.META_CLIENT_ID,
      clientSecret: process.env.META_CLIENT_SECRET,
      callbackURL: process.env.META_CALLBACK_URI,
      scope: ['email'],
      profileFields: ['id', 'displayName', 'photos', 'email', 'gender', 'name'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    cb: any,
  ): Promise<any> {
    const Data: Prisma.UsersCreateInput = {
      firstName: profile._json.first_name,
      lastName: profile._json.last_name,
      avatar: profile._json.picture.data.url,
      email: profile._json.email,
      is_active: true,
    };
    const User: Users = await this.userService.create(Data);
    cb(null, User);
    return User;
  }
}

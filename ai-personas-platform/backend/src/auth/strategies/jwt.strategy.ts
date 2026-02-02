import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ParsedQs } from 'qs';
import { PrismaService } from 'src/prisma/prisma.service';

export type JwtPayload = {
  id: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private prisma: PrismaService) {
    const extractJwtFromCookie = (
      req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
    ) => {
      let token = null;
      if (req && req.cookies) {
        token = req.cookies['token'];
      }
      return token || ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    };
    super({
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
      jwtFromRequest: extractJwtFromCookie,
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.users.findUnique({
      where: { id: payload.id },
    });

    if (!user) throw new UnauthorizedException('Please log in to continue');

    return {
      id: user.id,
    };
  }
}

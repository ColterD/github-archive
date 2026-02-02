import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, Users } from '@prisma/client';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { Request } from 'express';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
    private mailingService: MailerService,
  ) {}

  async signInWithGoogle(user: Prisma.UsersUncheckedCreateInput) {
    try {
      let userExists: Users = await this.userService.findOneEmaiL({
        email: user.email,
      });

      if (!userExists) {
        user.is_active = true;
        userExists = await this.userService.create(user);
        console.log('userExists :', userExists);
      }
      return await this.generateJwt({
        id: userExists.id,
      });
    } catch (error) {
      console.log('signInWithGoogle error :', error);
      return null;
    }
  }

  async generateJwt(payload: any) {
    return {
      accessToken: await this.jwtService.signAsync(payload),
    };
  }

  async signIn(email: string, pass: string): Promise<any> {
    try {
      const user: Users = await this.userService.findOne({ email });
      if (!user) throw new Error('User not font');
      const reee = await this.comparePasswords(pass, user?.password);
      if (reee === false) {
        throw new UnauthorizedException();
      }
      const token = await this.generateJwt({
        id: user.id,
      });
      delete user['password'];
      delete user['is_active'];
      return {
        User: user,
        token: token.accessToken,
      };
    } catch (error) {
      console.log('signIn error :', error);
      return new UnauthorizedException();
    }
  }

  async sendEmail(data: { to: string; subject: string; body: string }) {
    try {
      const messageInfo = await this.mailingService.sendMail({
        to: data.to,
        from: process.env.MAIL_FROM,
        subject: data.subject,
        text: 'wellcome',
        html: data.body,
      });
      if (!messageInfo) throw new Error();
      return true;
    } catch (error) {
      return true;
    }
  }

  async Register(data: Prisma.UsersCreateInput): Promise<any> {
    try {
      const pass = await this.hashPassword(data.password);
      data.password = pass;
      const user: Users = await this.userService.create(data);
      if (!user) throw new Error("can't Create user");
      const token = await this.generateJwt({
        id: user.id,
      });
      delete user['password'];
      delete user['is_active'];
      // "/verification/email/userid&time='23732492'"
      const expiresIn = 3600;
      const confToken = await this.jwtService.signAsync(
        { id: user.id },
        { expiresIn },
      );
      const confirmationLink = `${process.env.CLIENT_URL}/verification/email/${confToken}`;
      await this.sendEmail({
        to: user.email,
        subject: `Creation Confirmation in Ai`,
        body: `<div>
                  <h2>Account Creation Confirmation for ${user.firstName} ${user.lastName}</h2>
                  <p>Dear [User's Name],</p><p>Thank you for creating an account with ${user.firstName} ${user.lastName}! We are excited to have you on board. This email is to confirm that your account has been successfully created. Below are the details of your account:</p>
                  <ul>
                      <li> <strong>Username:</strong> ${user.firstName} ${user.lastName}</li>
                      <li><strong>Email Address:</strong>${user.email}</li>
                      <li><strong>Account Created On:</strong> ${user.created_at}</li>
                      <li><strong>Confirmation link :</strong><a href="${confirmationLink}">Confirm</a></li>
                    </ul>
              </div>`,
      });

      return {
        User: user,
        token: token.accessToken,
      };
    } catch (error) {
      console.log('Register error :', error);
    }
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  async comparePasswords(
    enteredPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    const resp = await bcrypt.compare(enteredPassword, hashedPassword);
    return resp;
  }

  async getLoginUser(request: Request) {
    const User_payload: any = request;
    return User_payload.user;
  }

  async emailVerification(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
      if (!payload) throw new UnauthorizedException();
      const User: Users = await this.userService.findOneById({
        id: payload.id,
      });
      if (!User) throw new ForbiddenException();
      await this.userService.update({
        id: User.id,
        data: {
          is_active: true,
        },
      });
      return User;
    } catch (error) {
      return null;
    }
  }
  async forgotPasswordEmail(body: { email: string }) {
    const User: Users = await this.userService.findOneEmaiL({
      email: body.email,
    });
    if (!User) throw new UnauthorizedException();
    const min = 100000;
    const max = 999999;
    const randomNumber = Math.floor(Math.random() * (max - min + 1) + min);
    await this.sendEmail({
      to: User.email,
      subject: `reset code`,
      body: `<div>
                  <h2>Hi ${User.firstName}</h2>
                  <ul>
                      <li> <strong>Enter this code to complete the reset:</strong> ${randomNumber}</li>
                    </ul>
              </div>`,
    });

    return randomNumber;
  }
  async forgotPasswordConfirmation(body: {
    email: string;
    newPassword: string;
  }) {
    const checkUser: Users = await this.userService.findOneEmaiL({
      email: body.email,
    });
    if (!checkUser) throw new UnauthorizedException();
    const hashedPassword = await this.hashPassword(body.newPassword);
    const updateUser = await this.userService.update({
      id: checkUser.id,
      data: {
        password: hashedPassword,
      },
    });
    if (!updateUser) throw new UnauthorizedException();
    return updateUser;
  }
}

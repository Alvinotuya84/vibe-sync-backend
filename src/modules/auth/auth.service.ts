import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { AuthResponse } from '../../types/api-response.types';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  private generateAuthResponse(user: User): AuthResponse {
    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    };
  }

  async validateUser(
    usernameOrEmail: string,
    password: string,
  ): Promise<User | null> {
    let user = await this.usersService.findByEmail(usernameOrEmail);
    if (!user) {
      user = await this.usersService.findByUsername(usernameOrEmail);
    }

    if (user && (await user.validatePassword(password))) {
      return user;
    }
    return null;
  }

  async register(createUserDto: CreateUserDto): Promise<AuthResponse> {
    const user = await this.usersService.create(createUserDto);
    return this.generateAuthResponse(user);
  }

  async login(
    usernameOrEmail: string,
    password: string,
  ): Promise<AuthResponse> {
    const user = await this.validateUser(usernameOrEmail, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateAuthResponse(user);
  }
}

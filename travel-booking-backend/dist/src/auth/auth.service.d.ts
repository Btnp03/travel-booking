import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private usersService;
    private jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    register(email: string, password: string, phone: string): Promise<{
        id: string;
        email: string;
        phone: string;
        password: string;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
    }>;
    login(email: string, password: string): Promise<{
        access_token: string;
    }>;
}

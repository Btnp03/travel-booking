import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(body: RegisterDto): Promise<{
        id: string;
        email: string;
        phone: string;
        password: string;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
    }>;
    login(body: any): Promise<{
        access_token: string;
    }>;
}

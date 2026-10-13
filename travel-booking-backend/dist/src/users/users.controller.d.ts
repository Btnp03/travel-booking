import { UsersService } from './users.service';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    getUsers(): Promise<{
        id: string;
        email: string;
        phone: string;
        password: string;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
    }[]>;
}

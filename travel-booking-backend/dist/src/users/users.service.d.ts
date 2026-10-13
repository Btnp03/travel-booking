import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findByEmail(email: string): import("@prisma/client").Prisma.Prisma__UserClient<{
        id: string;
        email: string;
        phone: string;
        password: string;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
    } | null, null, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    create(email: string, password: string, phone: string): import("@prisma/client").Prisma.Prisma__UserClient<{
        id: string;
        email: string;
        phone: string;
        password: string;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    findAll(): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        email: string;
        phone: string;
        password: string;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
    }[]>;
}

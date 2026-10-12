import { PrismaService } from '../prisma/prisma.service';
export declare class BookingExpireService {
    private prisma;
    constructor(prisma: PrismaService);
    expireBookings(): Promise<void>;
    private getDatesBetween;
    private startOfDay;
}

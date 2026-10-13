export declare class CreateHotelKeyPointDto {
    label: string;
    detail: string;
    category?: string;
    icon?: string;
    sortOrder?: number;
}
export declare class CreateHotelDto {
    name: string;
    description: string;
    location: string;
    images?: string[];
    keyPoints?: CreateHotelKeyPointDto[];
}

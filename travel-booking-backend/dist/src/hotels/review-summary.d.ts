type RoomWithReviews = {
    reviews?: Array<{
        rating: number;
    }>;
};
type HotelWithReviewRooms = {
    rooms: RoomWithReviews[];
};
export declare const hotelReviewInclude: {
    readonly keyPoints: {
        readonly orderBy: {
            readonly sortOrder: "asc";
        };
    };
    readonly rooms: {
        readonly include: {
            readonly reviews: {
                readonly select: {
                    readonly rating: true;
                };
            };
        };
    };
};
export declare function withHotelReviewSummary<T extends HotelWithReviewRooms>(hotel: T): T & {
    reviewScore: number | null;
    reviewCount: number;
};
export {};

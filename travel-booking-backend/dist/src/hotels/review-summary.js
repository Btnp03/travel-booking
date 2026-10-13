"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hotelReviewInclude = void 0;
exports.withHotelReviewSummary = withHotelReviewSummary;
exports.hotelReviewInclude = {
    keyPoints: {
        orderBy: {
            sortOrder: 'asc',
        },
    },
    rooms: {
        include: {
            reviews: {
                select: {
                    rating: true,
                },
            },
        },
    },
};
function withHotelReviewSummary(hotel) {
    const ratings = hotel.rooms.flatMap((room) => room.reviews?.map((review) => review.rating) ?? []);
    const reviewCount = ratings.length;
    const reviewScore = reviewCount > 0
        ? Math.round((ratings.reduce((total, rating) => total + rating, 0) / reviewCount) *
            10) / 10
        : null;
    return {
        ...hotel,
        reviewScore,
        reviewCount,
    };
}
//# sourceMappingURL=review-summary.js.map
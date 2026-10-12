type RoomWithReviews = {
  reviews?: Array<{
    rating: number;
  }>;
};

type HotelWithReviewRooms = {
  rooms: RoomWithReviews[];
};

export const hotelReviewInclude = {
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
} as const;

export function withHotelReviewSummary<T extends HotelWithReviewRooms>(
  hotel: T,
) {
  const ratings = hotel.rooms.flatMap((room) =>
    room.reviews?.map((review) => review.rating) ?? [],
  );
  const reviewCount = ratings.length;
  const reviewScore =
    reviewCount > 0
      ? Math.round(
          (ratings.reduce((total, rating) => total + rating, 0) / reviewCount) *
            10,
        ) / 10
      : null;

  return {
    ...hotel,
    reviewScore,
    reviewCount,
  };
}

import { withHotelReviewSummary } from './review-summary';

describe('withHotelReviewSummary', () => {
  it('calculates the average rating across all hotel room reviews', () => {
    const hotel = {
      id: 'hotel-1',
      rooms: [
        { id: 'room-1', reviews: [{ rating: 9 }, { rating: 10 }] },
        { id: 'room-2', reviews: [{ rating: 8 }] },
      ],
    };

    expect(withHotelReviewSummary(hotel)).toMatchObject({
      reviewScore: 9,
      reviewCount: 3,
    });
  });

  it('returns an empty review summary when the hotel has no reviews', () => {
    const hotel = {
      id: 'hotel-1',
      rooms: [{ id: 'room-1', reviews: [] }],
    };

    expect(withHotelReviewSummary(hotel)).toMatchObject({
      reviewScore: null,
      reviewCount: 0,
    });
  });
});

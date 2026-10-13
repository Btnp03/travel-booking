CREATE TABLE "HotelKeyPoint" (
  "id" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "detail" TEXT NOT NULL,
  "category" TEXT,
  "icon" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "hotelId" TEXT NOT NULL,

  CONSTRAINT "HotelKeyPoint_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HotelKeyPoint_hotelId_sortOrder_idx" ON "HotelKeyPoint"("hotelId", "sortOrder");

ALTER TABLE "HotelKeyPoint"
ADD CONSTRAINT "HotelKeyPoint_hotelId_fkey"
FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

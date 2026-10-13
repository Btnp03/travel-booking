import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchHotelsDto } from './dto/search-hotels.dto';

@Controller('search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get()
  searchHotels(@Query() dto: SearchHotelsDto) {
    return this.searchService.search(dto);
  }
}

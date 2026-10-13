import { SearchService } from './search.service';
import { SearchHotelsDto } from './dto/search-hotels.dto';
export declare class SearchController {
    private searchService;
    constructor(searchService: SearchService);
    searchHotels(dto: SearchHotelsDto): Promise<{}>;
}

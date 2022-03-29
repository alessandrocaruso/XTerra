import scrapy


class Listing(scrapy.Item):
    url = scrapy.Field()
    title = scrapy.Field()
    description = scrapy.Field()
    cap = scrapy.Field()
    city = scrapy.Field()
    price = scrapy.Field()
    details = scrapy.Field()

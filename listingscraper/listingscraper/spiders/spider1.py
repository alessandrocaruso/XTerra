import scrapy
from ..items import Listing


class QuoteSpider(scrapy.Spider):
    name = 'ginevra-listings'
    rotate_user_agent = True

    def start_requests(self):

        urls = [
            f"http://www.newhome.ch/it/acquisto/cerca/casa-appartamento/area-della-mappa/elenco?propertyType=100&offerType=1&&radius=4&radiusCenterCoordinate=46.20458639990946;6.146537863492313&roomsMin=1&roomsMax=8.5&skipCount={i}" for i in range(0, 640, 20)]

        for url in urls:
            yield scrapy.Request(url=url, callback=self.parse)

    def parse(self, response):
        for url in response.css("div.objects__list a::attr(href)").extract():
            yield scrapy.Request(url='http://www.newhome.ch' + url, callback=self.parse_single_listing)

    def parse_single_listing(self, response):
        item = Listing()
        item['title'] = response.xpath(".//app-property-detail-intro/div/h1/span[1]/text()").extract()[0]
        item['description'] = response.xpath(".//app-property-detail-intro/div/h1/span[2]/text()").extract()[0]
        item['cap'] = response.xpath(".//app-property-detail-intro/div/button/span/span[1]/span[1]/text()").extract()[0]
        item['city'] = response.xpath(".//app-property-detail-intro/div/button/span/span[1]/span[2]/text()").extract()[
            0]
        item['price'] = response.xpath(
            ".//app-property-detail-price-display/div/app-price-not-negotiable/div[2]/span/text()").extract()[0]

        item['details'] = dict(zip(
            response.css("app-property-detail-details").xpath(
                "//*[contains(@class, 'details__title')]/text()").extract(),
            response.css("app-property-detail-details").xpath(
                "//*[contains(@class, 'details__description')]/text()").extract()

        ))

        yield item

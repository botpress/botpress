import scrapy


class BrokenLinksSpider(scrapy.Spider):
    name = 'brokenlink-checker'
    # handle_httpstatus_all = True
    #handle_httpstatus_list = [404, 500]


    def __init__(self, site, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.start_urls = [site]
        self.DOMAIN = site.split('//')[1]


    def parse(self, response):
        if response.status in (404, 500):
            item = {}
            item['url'] = response.url
            item['prev_page'] = response.meta['prev_url']
            item['prev_link_url'] = response.meta['prev_href']
            item['prev_link_text'] = response.meta['prev_link_text']
            item['status'] = response.status

            yield item

        if self.DOMAIN in response.url:
            for link in response.css('a'):
                href = link.xpath('@href').extract()
                text = link.xpath('text()').extract()
                if href: # maybe should show an error if no href
                    yield response.follow(link, self.parse, meta={
                        'prev_link_text': text,
                        'prev_href': href,
                        'prev_url': response.url,
                    })
from random import choice
from scrapy import signals
from scrapy.exceptions import NotConfigured
from scrapy.downloadermiddlewares.retry import RetryMiddleware
from scrapy.utils.response import response_status_message
from time import sleep


class RotateUserAgentMiddleware(object):
    """Rotate user-agent for each request."""

    def __init__(self, user_agents):
        self.enabled = True
        self.user_agents = user_agents

    @classmethod
    def from_crawler(cls, crawler):
        user_agents = crawler.settings.get('USER_AGENT_CHOICES', [])

        if not user_agents:
            raise NotConfigured("USER_AGENT_CHOICES not set or empty")

        o = cls(user_agents)
        crawler.signals.connect(o.spider_opened, signal=signals.spider_opened)

        return o

    def spider_opened(self, spider):
        self.enabled = getattr(spider, 'rotate_user_agent', self.enabled)

    def process_request(self, request, spider):
        if not self.enabled or not self.user_agents:
            return

        request.headers['user-agent'] = choice(self.user_agents)


class SleepRetryMiddleware(RetryMiddleware):
    def __init__(self, settings):
        RetryMiddleware.__init__(self, settings)

    def process_response(self, request, response, spider):
        if response.status in [403]:
            sleep(2)  # few minutes
            reason = response_status_message(response.status)
            return self._retry(request, reason, spider) or response

        return super(SleepRetryMiddleware, self).process_response(request, response, spider)

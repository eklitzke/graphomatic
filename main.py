import os
import time
import logging
import tornado.httpserver
import tornado.ioloop
import tornado.websocket
import tornado.web
import simplejson

class ClassLogger(object):

    def __get__(self, obj, obj_type=None):
        object_class = obj_type or obj.__class__
        return logging.getLogger(object_class.__module__ + '.' + object_class.__name__)

def configure_logging():
    format = logging.Formatter('%(asctime)s :: PID %(process)d :: %(name)s (%(levelname)s) :: %(message)s')
    logger = logging.StreamHandler()
    logger.setFormatter(format)
    logger.setLevel(logging.DEBUG)
    logging.getLogger().addHandler(logger)
    logging.getLogger().setLevel(logging.DEBUG)


class MainHandler(tornado.web.RequestHandler):

    def get(self):
        self.render('main.html', ws_url="ws://iomonad.com:8214")

settings = {
    'debug': True,
    'static_path': os.path.join(os.getcwd(), 'static')
}

application = tornado.web.Application([('/graphomatic', MainHandler)], **settings)

if __name__ == '__main__':
    configure_logging()
    http_server = tornado.httpserver.HTTPServer(application)
    http_server.listen(8888)
    tornado.ioloop.IOLoop.instance().start()

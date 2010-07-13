import os
import random
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
        self.render('main.html')

class WebSocketHandler(tornado.websocket.WebSocketHandler):
    def open(self):
        self.send_cb = tornado.ioloop.PeriodicCallback(self.send_value, 1000)
        self.send_cb.start()

    def send_value(self):
        ts = time.time()
        val = (ts % 60) / 60.0
        val += max(random.random() * 0.2 - 0.1, 0.01)
        try:
            self.write_message(simplejson.dumps({'millis': ts * 1000, 'val': val}))
        except IOError:
            self.send_cb.stop()

settings = {
    'debug': True,
    'static_path': os.path.join(os.getcwd(), 'static')
}

application = tornado.web.Application([
        ('/graphomatic', MainHandler),
        ('/data', WebSocketHandler)], **settings)

if __name__ == '__main__':
    configure_logging()
    http_server = tornado.httpserver.HTTPServer(application)
    http_server.listen(8888)
    tornado.ioloop.IOLoop.instance().start()

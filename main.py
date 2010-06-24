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
        self.render('main.html')

class DataHandler(tornado.websocket.WebSocketHandler):

    log = ClassLogger()

    def open(self):
        self.log.info('opened ws connection')
        self.io_loop = tornado.ioloop.IOLoop.instance()
        self.last_write = 0
        self.receive_message(self.on_message)
        self.write_message('foo')
        self.log.info('done with open handler')

    def on_message(self, msg):
        self.log.info('on_message = %r' % (msg,))
        self.write_message('hi')

    def more_data(self):
        now = time.time()
        val = 1 + math.sin(now)
        self.log.info('sending %s, %s' % (now, val))
        self.write_message(simplejson.dumps({'millis': now * 1000, 'val': val}))
        self.io_loop.add_callback(now + 1.0, self.more_data)

settings = {
    'debug': True,
    'static_path': os.path.join(os.getcwd(), 'static')
}

application = tornado.web.Application([
        ('/', MainHandler),
        ('/websocket', DataHandler)], **settings)

if __name__ == '__main__':
    configure_logging()
    http_server = tornado.httpserver.HTTPServer(application)
    http_server.listen(8888)
    tornado.ioloop.IOLoop.instance().start()

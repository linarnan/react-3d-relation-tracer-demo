import os
import json
from bottle import route, post, get, run, static_file, template, request, response


@route('/')
def index():
    return template('index.html')

# Static Routes


@get("/css/<filepath:re:.*\.css>")
def css(filepath):
    return static_file(filepath, root='dist/css')


@get("/font/<filepath:re:.*\.(eot|otf|svg|ttf|woff|woff2?)>")
def font(filepath):
    return static_file(filepath, root="dist/font")


@get("/img/<filepath:re:.*\.(jpg|png|gif|ico|svg)>")
def img(filepath):
    return static_file(filepath, root="dist/img")


@get("/<filepath:re:.*\.(html)>")
def html(filepath):
    return static_file(filepath, root="static")


@get("/js/<filepath:re:.*\.js>")
def js(filepath):
    return static_file(filepath, root="dist/js")


@get('/data/<filepath:re:.*\.(json)>')
def jsondata(filepath):
    # TODO: escape filepath
    response.content_type = "application/json"
    with open(os.path.join('data', filepath), 'r') as f:
        return f.read()


@get('/api/getDataList')
def getDataList():
    return json.dumps(sorted(os.listdir('./data')))


@post('/upload-json')
def uploadJSON():
    f = request.files.get('qqfile')
    f.save('./data', overwrite=True)
    return '{"status": "ok"}'


print('see http://localhost:3000')
run(host='localhost', port=3000)

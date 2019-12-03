from flask import Flask, render_template, request, jsonify, make_response, json
from flask_cors import CORS, cross_origin
from pusher import pusher
import os
import random

app = Flask(__name__)
cors = CORS(app, resources={r"/api/*": {"origins": "*"}})

pusher = pusher_client = pusher.Pusher(
  app_id='908148',
  key='5a31c047a88a09fa68ca',
  secret='8be3f8993a6b5b0f854a',
  cluster='ap2',
  ssl=True
)
name = ''
email = ''
users=[]
QUESTIONS=[]

basedir = os.path.abspath(os.path.dirname(__file__)) 
data_file = os.path.join(basedir, 'static/js/data.js')

with open(data_file) as json_file:
  data = json.load(json_file)
  for question in data["questions"]:
    QUESTIONS.append(question)

@app.route('/')
def index():
  return render_template('index.html');

@app.route('/play',methods=['GET'])
def play():
  global name
  global email
  name = request.args.get('username')
  email = request.args.get('email')

  return render_template('play.html',username=name,questions=QUESTIONS);

"""
@app.route("/api/users")
def get_users():
    return jsonify({'status':'SUCCESS','users':users})
"""
@app.route("/pusher/auth", methods=['POST'])
def pusher_authentication():
  auth = pusher.authenticate(
    channel=request.form['channel_name'],
    socket_id=request.form['socket_id'],
    custom_data={
      u'user_id': name,
      u'user_info': {
        u'role': u'player'
      }
    }
  )
  return json.dumps(auth)

@app.route('/gameover')
def gameover():
  print('Game Over')
  name = request.args.get('username')
  score = request.args.get('score')
  return render_template('gameover.html',username=name,score=score);


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
name = ''

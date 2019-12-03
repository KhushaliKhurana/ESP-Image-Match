
Vue.prototype.questions= window.questions;
var sequence1;

var app = new Vue({
  el: '#app',
  data: {
    username: '',
    players: 0,
    connectedPlayers: [],
    status: '',
    pusher: new Pusher('5a31c047a88a09fa68ca', {
      authEndpoint: '/pusher/auth',
      cluster: 'ap2',
      encrypted: true
    }),
    otherPlayerName: '',
    mychannel: {},
    otherPlayerChannel: {},
    no_opponent: true,
    game_start: false,
    question:'',
    options:[],
    sequence:[],
    score: 0,
    selected:"",
    questionsAnswered: 0,
    hasOpponentAnswered: false,
    game_over: false,
    hasAnswered: false,
    myAnswer:"",
    otherPlayerAnswer:"",
  },

  created () {
    let url = new URL(window.location.href);
    let name = url.searchParams.get("username");

    if (name) {
      this.username = name
      this.subscribe();
      this.listeners();
    } else {
      this.username = this.generateRandomName();
      location.assign("/play?username=" + this.username);
    }
  },
  methods: {
  // We will add methods here
    generateRandomName: function () {
      let text = '';
      let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      for (var i = 0; i < 6; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
      }
      return text;
    },
    subscribe: function () {
      // ----------------------------------------------------
      // Subscribe to the presence and private channels
      // ----------------------------------------------------
      let channel = this.pusher.subscribe('presence-channel');
      this.myChannel = this.pusher.subscribe('private-' + this.username)
      // ----------------------------------------------------
      // Update the number of online members on successful subscription
      // ----------------------------------------------------
      channel.bind('pusher:subscription_succeeded', (player) => {
        console.log('Subscribe event',player);
        this.players = player.count - 1
        player.each((player) => {
          if (player.id != this.username)
            this.connectedPlayers.push(player.id)
        });
        if(this.connectedPlayers) {
          this.no_opponent = false;
        }
      });
      // ----------------------------------------------------
      // Display a notification when a new player comes online
      // ----------------------------------------------------
      channel.bind('pusher:member_added', (player) => {
        console.log('Memeber added',player);
        this.players++;
        this.connectedPlayers.push(player.id)
      });
      // ---------------------------------------------------------------
      // Decrement the connectedPlayers array when a player disconnects
      // ---------------------------------------------------------------
      channel.bind('pusher:member_removed', (player) => {
        console.log('Memeber removed',player);
        this.players--;
        var index = this.connectedPlayers.indexOf(player.id);
        if (index > -1) {
          this.connectedPlayers.splice(index, 1)
        }
        if(this.otherPlayerName == player.id) {
          this.gameOver();
        }
      });
    },
    listeners: function () {
      // ------------------------------------------------------------------------
      // Bind to the event that requests a new game session from the other player
      // ------------------------------------------------------------------------
      this.pusher.bind('client-' + this.username, (message) => {
        alert('Opponent found. Game is starting...');
        this.sequence = this.getRandomQuestions(this.questions,5);
        console.log('Sequence of questions:',this.sequence);
        this.otherPlayerName = message
        this.otherPlayerChannel = this.pusher.subscribe('private-' + this.otherPlayerName)
        this.otherPlayerChannel.bind('pusher:subscription_succeeded', () => {
          this.otherPlayerChannel.trigger('client-game-started', {username: this.username, sequence: this.sequence})
        })
        this.startGame(message);
      });

      // ----------------------------------------------------
      // Bind to the event that starts a new game session
      // ----------------------------------------------------
      this.myChannel.bind('client-game-started', (message) => {
        console.log('Starting game',message);
        this.status = "Game started with " + message.username
        this.sequence = message.sequence
        this.game_start = true;
        //this.$refs.choose.classList.add('invisible');
        //this.$refs.startGame.classList.remove('invisible');
        this.getNewQuestion(this.questionsAnswered);
      });
      // ------------------------------------------------------------------
      // Bind to the event that updates about the opponent's response
      // ------------------------------------------------------------------
      this.myChannel.bind('client-opponent-answer', (message) => {
        console.log("oppponent response",message);
        this.hasOpponentAnswered = true;
        this.otherPlayerAnswer = message;
        if(this.hasAnswered) {
          if(this.myAnswer == this.otherPlayerAnswer) {
            this.score += 1;
          }
          this.getNewQuestion(this.questionsAnswered);
        } 
      });
    },
    randomPlayer: function(obj) {
      var keys = Object.keys(obj)
      return obj[keys[ keys.length * Math.random() << 0]];
    },
    choosePlayer: function (e) {
      var keys = Object.keys(this.connectedPlayers);
      var opponent = this.connectedPlayers[keys[ keys.length * Math.random() << 0]];
      console.log('Opponent',opponent);
      this.otherPlayerName = opponent;
      this.otherPlayerChannel = this.pusher.subscribe('private-' + this.otherPlayerName)
      this.otherPlayerChannel.bind('pusher:subscription_succeeded', () => {
        this.otherPlayerChannel.trigger('client-' + this.otherPlayerName, this.username)
      })
    },
    startGame: function (name) {
      console.log('Starting game');
      this.status = "Game started with " + name
      this.game_start= true;
      this.getNewQuestion(this.questionsAnswered);
      //this.$refs.choose.classList.add('invisible');
      //this.$refs.startGame.classList.remove('invisible');
    },
    gameOver: function() {
      console.log('Game over');
      this.game_over = true;
      window.location.assign(`/gameover?username=${this.username}&score=${this.score}`)
    },
    getRandomQuestions: function(array, count) {
      let length = array.length
      let randomIndexes = []
      let randomItems = []
      let index, item

      count = count | 1

      while (count) {
        index = Math.floor(Math.random() * length)
        if (randomIndexes.indexOf(index) === -1) {
          count--
          randomIndexes.push(index)
        }
      }

      randomIndexes.forEach((index) => {
        item = array.slice(index, index + 1).pop()
        randomItems.push(item)
      })

      if (randomItems.length === 1) {
        return randomItems.pop()
      } else {
        return randomItems
      }
    },
    getNewQuestion: function(i) {
      //let question = this.getRandomQuestions(this.questions, 1)
      this.hasAnswered = false;
      this.hasOpponentAnswered = false;
      this.selected="";
      this.myAnswer="";
      this.otherPlayerAnswer="";
      if(i<5) {
        this.question = this.sequence[i].primary;
        this.options = this.sequence[i].options;
      } else {
        this.gameOver();
      }
    },
    submitAnswer: function() {
      if(this.selected=="") {
        alert('Select one of the options');
      } else {
        this.hasAnswered = true;
        console.log('Trigger opponent')
        this.otherPlayerChannel.trigger('client-opponent-answer',this.selected);
        this.setMyAnswer(this.selected);
      }
    },
    setMyAnswer: function(answer) {
      console.log("my response",answer);
      this.myAnswer = answer;
      this.questionsAnswered += 1;
      if(this.hasOpponentAnswered) {
        if(this.myAnswer == this.otherPlayerAnswer) {
          this.score += 1;
        }
        this.getNewQuestion(this.questionsAnswered);
      } 
    },
    restartGame: function() {

    },
    finishGame: function() {  

    }
  }
});

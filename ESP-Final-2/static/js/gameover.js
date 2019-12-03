var app = new Vue({
  el: '#app',
  methods: {
    playAgain: function () {
      let username = url.searchParams.get("username")
      window.location.replace(`/play?username=${username}`);
    }
  }
})

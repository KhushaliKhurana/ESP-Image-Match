var app = new Vue({
  el: '#app',
  methods: {
    login: function () {
      let username = this.$refs.username.value
      let email = this.$refs.email.value
      window.location.replace(`/play?username=${username}`);
    }
  }
})

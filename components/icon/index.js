Component({
  properties: {
    type: {
      type: String,
      value: 'success'
    },
    size: {
      type: Number,
      value: 24
    },
    color: {
      type: String,
      value: '#000000'
    }
  },
  data: {
    icons: {
      menu: 'M4 6h16M4 12h16m-16 6h16',
      ai: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z',
      clear: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
      send: 'M2.01 21L23 12 2.01 3 2 10l15 2-15 2z'
    }
  },
  methods: {
    onClick() {
      this.triggerEvent('click');
    }
  }
}) 
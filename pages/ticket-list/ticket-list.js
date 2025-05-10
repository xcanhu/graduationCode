// pages/ticket-list/ticket-list.js
const api = require('../../utils/cloudapi');

Page({
  data: {
    tickets: [],
    departure: '',
    destination: '',
    date: '',
    loading: true,
    noData: false
  },

  onLoad(options) {
    const { departure, destination, date } = options;
    
    this.setData({
      departure,
      destination,
      date,
      loading: true
    });

    this.searchTickets(departure, destination, date);
  },

  searchTickets(departure, destination, date) {
    api.searchTickets(departure, destination, date)
      .then(tickets => {
        this.setData({
          tickets,
          loading: false,
          noData: tickets.length === 0
        });
      })
      .catch(error => {
        console.error('查询车票失败', error);
        this.setData({
          loading: false,
          noData: true
        });
        wx.showToast({
          title: '查询失败，请重试',
          icon: 'none'
        });
      });
  },

  selectTicket(e) {
    const ticketId = e.currentTarget.dataset.id;
    const ticket = this.data.tickets.find(item => item.id === ticketId);
    
    if (ticket) {
      wx.navigateTo({
        url: `/pages/ticket-detail/ticket-detail?id=${ticketId}&departure=${this.data.departure}&destination=${this.data.destination}&date=${this.data.date}&time=${ticket.time}&price=${ticket.price}&type=${ticket.type}&seats=${ticket.seats}`
      });
    }
  },

  goBack() {
    wx.navigateBack();
  },

  changeDate(e) {
    const date = e.detail.value;
    this.setData({ date, loading: true });
    this.searchTickets(this.data.departure, this.data.destination, date);
  }
});
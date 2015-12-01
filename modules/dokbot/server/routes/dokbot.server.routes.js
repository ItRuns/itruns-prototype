'use strict';

var dokbot = require('../controllers/dokbot.server.controller');
module.exports = function (app) {
    
  app.route('/api/dokbot/')
    .post(dokbot.bot);
	
app.route('/api/info')
    .post(dokbot.info);
	
app.route('/api/pedigree')
    .post(dokbot.pedigree);	
	
  
};

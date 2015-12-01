'use strict';

// Configure the 'chat' module routes
angular.module('dokbot').config(['$stateProvider','$urlRouterProvider',
  function ($stateProvider,$urlRouterProvider) {
    $stateProvider
      .state('dokbot', {
        url: '/',
        templateUrl: 'modules/dokbot/client/views/dokbot.client.view.html',
       // data: {
         // roles: ['user', 'admin']
       // }
      })
      .state('dokbot.pedigree', {
        url: 'pedigree',
        templateUrl: 'modules/dokbot/client/views/dokbot.client.views.pedigree.html',
       // data: {
         // roles: ['user', 'admin']
       // }
      })
	.state('dokbot.info', {
        url: 'info',
        templateUrl: 'modules/dokbot/client/views/dokbot.client.views.info.html',
       // data: {
         // roles: ['user', 'admin']
       // }
      })
	   .state('dokbot.home', {
        url: 'home',
        templateUrl: 'modules/dokbot/client/views/dokbot.client.views.home.html',
       // data: {
         // roles: ['user', 'admin']
       // }
      })
        .state('dokbot.race', {
        url: 'race',
        templateUrl: 'modules/dokbot/client/views/dokbot.client.views.race.html',
       // data: {
         // roles: ['user', 'admin']
       // }
      });
	  
	 
    $urlRouterProvider.otherwise("/");
  }
]);

'use strict';

// Configuring the Chat module
angular.module('dokbot').run(['Menus',
  function (Menus) {
    // Set top bar menu items
    Menus.addMenuItem('topbar', {
      title: 'Dokbot',
      state: 'dokbot'
    });
  }
]);

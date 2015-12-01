'use strict';

angular.module('dokbot').factory('Dokbot', ['$resource',
    function ($resource) {
        return $resource('api/dokbot/');
    }
])
    .directive('goDiagram', function() {
        return {
            restrict: 'E',
            template: '<div></div>',  // just an empty DIV element
            replace: true,
            scope: { model: '=goModel' },
            link: function(scope, element, attrs) {
                //var $ = go.GraphObject.make;

                var diagram = init([],element);

                // whenever a GoJS transaction has finished modifying the model, update all Angular bindings
                function updateAngular(e) {
                    if (e.isTransactionFinished) scope.$apply();
                }
                // notice when the value of "model" changes: update the Diagram.model
                scope.$watch("model", function(newmodel) {
                   // var oldmodel = diagram.model;
                  //  if (oldmodel !== newmodel) {
                     //   if (oldmodel) oldmodel.removeChangedListener(updateAngular);
                     //   newmodel.addChangedListener(updateAngular);



                    setupDiagram(diagram,newmodel,newmodel[0].key);
                  //  }
                });

                // update the model when the selection changes
               /* diagram.addDiagramListener("ChangedSelection", function(e) {
                    var selnode = diagram.selection.first();
                    diagram.model.selectedNodeData = (selnode instanceof go.Node ? selnode.data : null);
                    scope.$apply();
                });*/
            }
        };
    });

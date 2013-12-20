/** @scratch /panels/5
 * include::panels/map.asciidoc[]
 */

/** @scratch /panels/map/0
 * == Map
 * Status: *Stable*
 *
 * The map panel translates 2 letter country or state codes into shaded regions on a map. Currently
 * available maps are world, usa and europe.
 *
 */
define([
  'angular',
  'app',
  'underscore',
  'jquery',
  'config',
  './lib/jquery.jvectormap.min'
],
function (angular, app, _, $) {
  'use strict';

  var module = angular.module('kibana.panels.map', []);
  app.useModule(module);

  module.controller('map', function($scope, $rootScope, dashboard) {
    $scope.panelMeta = {
      editorTabs : [
      ],
      modals : [
        {
          description: "Inspect",
          icon: "icon-info-sign",
          partial: "app/partials/inspector.html",
          show: $scope.panel.spyable
        }
      ],
      status  : "Stable",
      description : "Displays a map of shaded regions using a field containing a 2 letter country "+
       ", or US state, code. Regions with more hit are shaded darker. Node that this does use the"+
       " Elasticsearch terms facet, so it is important that you set it to the correct field."
    };

    // Set and populate defaults
    var _d = {
      /** @scratch /panels/map/3
       * === Parameters
       *
       * map:: Map to display. world, usa, europe
       */
      map     : "world",
      /** @scratch /panels/map/3
       * colors:: An array of colors to use to shade the map. If 2 colors are specified, shades
       * between them will be used. For example [`#A0E2E2', `#265656']
       */
      colors  : ['#A0E2E2', '#265656'],
      /** @scratch /panels/map/3
       * size:: Max number of regions to shade
       */
      size    : 100,
      /** @scratch /panels/map/3
       * exclude:: exclude this array of regions. For example [`US',`BR',`IN']
       */
      exclude : [],
      /** @scratch /panels/map/3
       * spyable:: Setting spyable to false disables the inspect icon.
       */
      spyable : true,
      /** @scratch /panels/map/5
       * ==== Queries
       * queries object:: This object describes the queries to use on this panel.
       * queries.mode::: Of the queries available, which to use. Options: +all, pinned, unpinned, selected+
       * queries.ids::: In +selected+ mode, which query ids are selected.
       */
      queries     : {
        mode        : 'all',
        ids         : []
      }
    };
    _.defaults($scope.panel,_d);

    $scope.init = function() {
      $scope.$on('refresh',function(){$scope.get_data();});
      $scope.get_data();
    };

    $scope.get_data = function() {
      $scope.panelMeta.loading = true;



      // Populate scope when we have results

        $scope.panelMeta.loading = false;
        $scope.data = {};
        _.each([{term : 'VN', count : 100}, {term : 'CN', count : 1000}], function(v) {
          $scope.data[v.term] = v.count;
        });
        $scope.$emit('render');
    };

    // I really don't like this function, too much dom manip. Break out into directive?
    $scope.populate_modal = function(request) {
      $scope.inspector = angular.toJson(JSON.parse(request.toString()),true);
    };
  });


  module.directive('map', function() {
    return {
      restrict: 'A',
      link: function(scope, elem) {

        elem.html('<center><img src="img/load_big.gif"></center>');

        // Receive render events
        scope.$on('render',function(){
          render_panel();
        });

        // Or if the window is resized
        angular.element(window).bind('resize', function(){
          render_panel();
        });

        function render_panel() {
          elem.text('');
          $('.jvectormap-zoomin,.jvectormap-zoomout,.jvectormap-label').remove();
          require(['./panels/map/lib/map.'+scope.panel.map], function () {
            elem.vectorMap({
              map: scope.panel.map,
              regionStyle: {initial: {fill: '#8c8c8c'}},
              zoomOnScroll: false,
              backgroundColor: null,
              series: {
                regions: [{
                  values: scope.data,
                  scale: scope.panel.colors,
                  normalizeFunction: 'polynomial'
                }]
              },
              onRegionLabelShow: function(event, label, code){
                elem.children('.map-legend').show();
                var count = _.isUndefined(scope.data[code]) ? 0 : scope.data[code];
                elem.children('.map-legend').text(label.text() + ": " + count);
              },
              onRegionOut: function() {
                $('.map-legend').hide();
              },
              onRegionClick: function(event, code) {
                var count = _.isUndefined(scope.data[code]) ? 0 : scope.data[code];
                if (count !== 0) {
                  scope.build_search(scope.panel.field,code);
                }
              }
            });
            elem.prepend('<span class="map-legend"></span>');
            $('.map-legend').hide();
          });
        }
      }
    };
  });
});
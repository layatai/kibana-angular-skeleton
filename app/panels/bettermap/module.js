/** @scratch /panels/5
 * include::panels/bettermap.asciidoc[]
 */

/** @scratch /panels/bettermap/0
 * == Bettermap
 * Status: *Experimental*
 *
 * Bettermap is called bettermap for lack of a better name. Bettermap uses geographic coordinates to
 * create clusters of markers on map and shade them orange, yellow and green depending on the
 * density of the cluster.
 *
 * To drill down, click on a cluster. The map will be zoomed and the cluster broken into smaller cluster.
 * When it no longer makes visual sense to cluster, individual markers will be displayed. Hover over
 * a marker to see the tooltip value/
 *
 * IMPORTANT: bettermap requires an internet connection to download its map panels.
 */
define([
  'angular',
  'app',
  'underscore',
  './leaflet/leaflet-src',
  'require',

  'css!./module.css',
  'css!./leaflet/leaflet.css',
  'css!./leaflet/plugins.css'
],
function (angular, app, _, L, localRequire) {
  'use strict';

  var module = angular.module('kibana.panels.bettermap', []);
  app.useModule(module);

  module.controller('bettermap', function($scope, dashboard) {
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
      status  : "Experimental",
      description : "Displays geo points in clustered groups on a map. The cavaet for this panel is"+
        " that, for better or worse, it does NOT use the terms facet and it <b>does</b> query "+
        "sequentially. This however means that it transfers more data and is generally heavier to"+
        " compute, while showing less actual data. If you have a time filter, it will attempt to"+
        " show to most recent points in your search, up to your defined limit"
    };

    // Set and populate defaults
    var _d = {
      /** @scratch /panels/bettermap/3
       * === Parameters
       *
       * field:: The field that contains the coordinates, in geojson format. GeoJSON is
       * +[longitude,latitude]+ in an array. This is different from most implementations, which use
       * latitude, longitude.
       */
      field   : null,
      /** @scratch /panels/bettermap/5
       * size:: The number of documents to use when drawing the map
       */
      size    : 1000,
      /** @scratch /panels/bettermap/5
       * spyable:: Should the `inspect` icon be shown?
       */
      spyable : true,
      /** @scratch /panels/bettermap/5
       * tooltip:: Which field to use for the tooltip when hovering over a marker
       */
      tooltip : "_id",
      /** @scratch /panels/bettermap/5
       * ==== Queries
       * queries object:: This object describes the queries to use on this panel.
       * queries.mode::: Of the queries available, which to use. Options: +all, pinned, unpinned, selected+
       * queries.ids::: In +selected+ mode, which query ids are selected.
       */
      queries     : {
        mode        : 'all',
        ids         : []
      },
    };

    _.defaults($scope.panel,_d);

    // inorder to use relative paths in require calls, require needs a context to run. Without
    // setting this property the paths would be relative to the app not this context/file.
    $scope.requireContext = localRequire;

    $scope.init = function() {
      $scope.$on('refresh',function(){
        $scope.get_data();
      });
      $scope.get_data();
    };

    $scope.get_data = function(segment,query_id) {
      $scope.require(['./leaflet/plugins'], function () {
        $scope.panel.error =  false;
          $scope.panelMeta.loading = false;
          
            // Keep only what we need for the set
//            $scope.data = $scope.data.slice(0,$scope.panel.size).concat(_.map(results.hits.hits, function(hit) {
//              return {
//                coordinates : new L.LatLng(hit.fields[$scope.panel.field][1],hit.fields[$scope.panel.field][0]),
//                tooltip : hit.fields[$scope.panel.tooltip]
//              };
//            }));
            $scope.data = [{
            	 coordinates : new L.LatLng(51.5, -0.09),
            	 tooltip: "hello"
            }];
            
          $scope.$emit('draw');
    });
    };

    $scope.populate_modal = function(request) {
      $scope.inspector = angular.toJson(JSON.parse(request.toString()),true);
    };

  });

  module.directive('bettermap', function() {
    return {
      restrict: 'A',
      link: function(scope, elem, attrs) {

        elem.html('<center><img src="img/load_big.gif"></center>');

        // Receive render events
        scope.$on('draw',function(){
          render_panel();
        });

        scope.$on('render', function(){
          if(!_.isUndefined(map)) {
            map.invalidateSize();
            map.getPanes();
          }
        });

        var map, layerGroup;

        function render_panel() {
          scope.require(['./leaflet/plugins'], function () {
            scope.panelMeta.loading = false;
            L.Icon.Default.imagePath = 'app/panels/bettermap/leaflet/images';
            if(_.isUndefined(map)) {
              map = L.map(attrs.id, {
                scrollWheelZoom: false,
                center: [40, -86],
                zoom: 10
              });

              // This could be made configurable?
              L.tileLayer('https://ssl_tiles.cloudmade.com/57cbb6ca8cac418dbb1a402586df4528/22677/256/{z}/{x}/{y}.png', {
                maxZoom: 18,
                minZoom: 2
              }).addTo(map);
              layerGroup = new L.MarkerClusterGroup({maxClusterRadius:30});
            } else {
              layerGroup.clearLayers();
            }

            var markerList = [];

            _.each(scope.data, function(p) {
              if(!_.isUndefined(p.tooltip) && p.tooltip !== '') {
                markerList.push(L.marker(p.coordinates).bindLabel(p.tooltip));
              } else {
                markerList.push(L.marker(p.coordinates));
              }
            });

            layerGroup.addLayers(markerList);

            layerGroup.addTo(map);

            map.fitBounds(_.pluck(scope.data,'coordinates'));
          });
        }
      }
    };
  });

});

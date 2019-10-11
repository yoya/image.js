/**
 * Stereo Matching module using Web Workers
 */
(function() {
  var Stereo;        // top-level namespace
  var _root = this;  // reference to 'window' or 'global'

  if(typeof exports !== 'undefined') {
    Stereo = exports;  // for CommonJS
  } else {
    Stereo = _root.Stereo = {};
  }

  var version = {
    release: '0.1.0',
    date: '2011-01'
  };
  Stereo.toString = function() {
    return "version " + version.release + ", released " + version.date;
  };

  // core operations
  var ctx = null,
      left = new Image(),
      right = new Image(),
      data = [null, null],
      state = {},
      worker = new Worker('lib/js/stereo-core.js');
  var core = {
    /* load stereo pair images */
    _load : function(leftSource, rightSource) {
      ctx = document.createElement('canvas').getContext('2d');
      left.src = leftSource;
      right.src = rightSource;
      // load complete handler
      left.addEventListener('load', function() {
        ctx.canvas.width = left.width;
        ctx.canvas.height = left.height;
        ctx.drawImage(left, 0, 0);
        data[0] = ctx.getImageData(0, 0, left.width, left.height);
      }, false);
      right.addEventListener('load', function() {
        ctx.canvas.width = right.width;
        ctx.canvas.height = right.height;
        ctx.drawImage(right, 0, 0);
        data[1] = ctx.getImageData(0, 0, right.width, right.height);
      }, false);
      // load error handler
      left.addEventListener('error', function() {
        alert('can\'t load left image');
      }, false);
      right.addEventListener('error', function() {
        alert('can\'t load right image');
      }, false);
    },
    /* draw disparity map on the canvas */
    _draw : function(data, context) {
      var img = context.getImageData(0, 0, data.width, data.height),
          pixels = img.data,
          disparity = data.disparity,
          len = disparity.length;
      for(var i=0; i<len; i++) {
        pixels[i] = disparity[i];
      }
      context.putImageData(img, 0, 0);
    },
    /* find stereo correspondence using worker */
    _find : function(preset, wSize, nDisparities) {
      core._validate();
      core._createState(preset);
      if(wSize) state.SADWindowSize = wSize;
      if(nDisparities) state.numberOfDisparities = nDisparities;
      var message = {'pair':data, 'state':state};
      worker.postMessage(message);
      return worker;
    },
    /* triangulation */
    _triangulate : function() {
      // TODO
    },
    /* create the structure for block matching algorithm */
    _createState : function(preset) {
      switch(preset.toUpperCase()) {
      case 'BASIC':
      case 'FISH_EYE':
      case 'NARROW':
        // not using currently
      default:
        state.minDisparity = 0;
        state.numberOfDisparities = 10;
        state.SADWindowSize = 5;
        state.textureThreshold = 1500;
        break;
      }
    },
    /* validate stereo pair images */
    _validate : function() {
      if(!left.complete || !right.complete) {
        throw new Error('load images incomplete');
      }
      if(left.width != right.width &&
         left.height != right.height) {
        throw new Error('invalid images, required stereo pair');
      }
    },
    /* cache disparity map data */
    _fetchData : function(key) {
      return JSON.parse(window.localStorage[key]);
    },
    _storeData : function(key, value) {
      window.localStorage[key] = JSON.stringify(value);
    }
  };
  // aliases (public APIs)
  var apis = ['load', 'find', 'draw', 'fetchData', 'storeData'];
  for(var i=0; i<apis.length; i++) {
    Stereo[apis[i]] = core['_' + apis[i]];
  }
}).call(this);
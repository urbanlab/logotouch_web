///////////////////////////////

// Name of the scenario file (inside scenarios/ folder, without ".json")

var SCENARIO = 'default';

///////////////////////////////


var thresholdSwipeX = 120;    // Tense
var thresholdSwipeY = 60;     // Person
var thresholdPinchScaleUnder1 = .3;  // Zoom
var thresholdPinchScaleOver1 = .9;  // Zoom

var WORDS;
var STICKERS;

/*
 *  How updates are handled between STICKERS and data()?
 *
 *  STICKERS[index].prop = val  Change value
 *  attr('data-prop',val)       Fetch CSS selector (eg. .Sticker[data-prop="val"])
 */

$(function() {
  
/*
 *  Load scenario JSON
 */
  
  $.getJSON( "scenarios/"+SCENARIO+".json", function (scenario) {
    WORDS = scenario.words;
    STICKERS = scenario.stickers;
    
    for(var index in STICKERS) {       
      var DOM_Sticker = $('<div/>')
        .addClass('Sticker Type__'+STICKERS[index].type)
        .prop('id','Sticker'+index)
        .attr('data-index',index)        
        .attr('data-tense',STICKERS[index].tense)
        .attr('data-person',STICKERS[index].person)
        .attr('data-zoom',STICKERS[index].zoom);
        
      var DOM_StickerTuile = $('<div/>').addClass('Sticker__tuile').appendTo(DOM_Sticker);
      var DOM_StickerInner = $('<div/>').addClass('Sticker__inner').appendTo(DOM_Sticker);
      
      DOM_Sticker.appendTo($('#StickersContainer'));
      
      initStickerEvents(index);
    }
  });
  
  
  function initStickerEvents(index) {
      
    var sticker = document.getElementById('Sticker'+index);
    var $sticker = $(sticker);
    var $inner = $sticker.find('.Sticker__inner');
    var $tuile = $sticker.find('.Sticker__tuile');
    
    var isPressed = false;
    var triggeredRotate = false;
    var pinchTempScale = 1;
    
    $sticker.draggable({
      containment: $('#StickersContainer'),
      
      drag: function(event,ui){
        if (isPressed) return false;
      }
      
    });
    
    $sticker.css({
      'left':Math.random()*(window.innerWidth-$sticker.width()*2),
      'top':Math.random()*(window.innerHeight-$sticker.width()*2)  
    });
    
    // Init vars:
    
    var word = '';
    
    changeState();
    
    // Set gestures:
  
    var mc = new Hammer.Manager(sticker);
    
    mc.add( new Hammer.Tap({ event: 'doubletap', taps: 2 }) );
    mc.add( new Hammer.Tap({ event: 'singletap' }) );
    mc.add( new Hammer.Pinch({ event: 'pinch', pointers: 2, threshold: 0 }) );
    mc.add( new Hammer.Pan({ event: 'drag', pointers: 1 }) );
    mc.add( new Hammer.Pan({ event: 'swipex', pointers: 1, direction: 6, threshold: 4 }) );
    mc.add( new Hammer.Pan({ event: 'swipey', pointers: 1, direction: 24, threshold: 4 }) );
    mc.add( new Hammer.Press({ event: 'press', pointers: 1, time: 200, threshold: 99999999999999999999999 }) );
    
    mc.get('doubletap').recognizeWith('singletap');
    mc.get('singletap').requireFailure('doubletap');
    mc.get('pinch').set({ enable: true });
    
    mc.on('press', function(ev) {
      isPressed = true;
      $sticker.addClass('isPressed');
    });
    
    mc.on('pressup panup pancancel pinchend touchend release mouseup', function(ev) {
      releasePress();
    });
    
    mc.on('swipex', function(ev) {      
      if (isPressed) {        
        var oldStepX = $sticker.data('oldStepX');
        var stepX = parseInt(ev.distance/thresholdSwipeX);
        
        $sticker.data('oldStepX', stepX);
        $sticker.data('distance',ev.distance);
        
        // We change the value when the gesture fetches thresholdSwipeX's step
        
        if (stepX != oldStepX) {
          if (ev.direction == Hammer.DIRECTION_LEFT) {
            STICKERS[index].tense--;
          }
          if (ev.direction == Hammer.DIRECTION_RIGHT) {
            STICKERS[index].tense++;
          }
        }
            
        STICKERS[index].tense = Math.min(Math.max(parseInt(STICKERS[index].tense), 0), WORDS[STICKERS[index].word].tenses.length-1);
              
        console.log('Change: Tense');
        
        changeState(index);
        
        if (ev.isFinal) {
          releasePress();
        }
      }
    });  
    mc.on('swipey', function(ev) {     
      if (isPressed) {
        var oldStepY = $sticker.data('oldStepY');
        var stepY = parseInt(ev.distance/thresholdSwipeY);
        
        $sticker.data('oldStepY', stepY);
        $sticker.data('distance',ev.distance);
        
        
        // We change the value when the gesture fetches thresholdSwipeY's step
        
        if (stepY != oldStepY) {
          if (ev.direction == Hammer.DIRECTION_UP) {
            STICKERS[index].person--;
          }
          if (ev.direction == Hammer.DIRECTION_DOWN) {
            STICKERS[index].person++;
          }
        }
        
        STICKERS[index].person = Math.min(Math.max(parseInt(STICKERS[index].person), 0), WORDS[STICKERS[index].word].tenses[STICKERS[index].tense].length-1);
        
        console.log('Change: Person');
        
        changeState(index);  
        
        if (ev.isFinal) {
          releasePress();
        }
      }    
    });  
    
    /*
     
      Handle zoom :
      - Handle Stickers size
      - Set a greater step for …Under1
      
     */
    
    mc.on('pinchstart', function(ev) {
      $sticker.data('oldPinchScale',1);      
    });
    
    mc.on('pinch', function(ev) {
      var oldPinchScale = $sticker.data('oldPinchScale');
      
      if (ev.scale >= 1) {
        var pinchScale = parseInt(ev.scale/thresholdPinchScaleOver1);
      } else {
        var pinchScale = parseInt(ev.scale/thresholdPinchScaleUnder1);
      }
      
      
      $sticker.data('oldPinchScale', pinchScale);
      
      
      if (!ev.isFirst) {
      
        // We change the value when the gesture fetches thresholdPinchScale's step
        
        if (pinchScale != oldPinchScale) {
          if (pinchScale > oldPinchScale) {
          console.log("zoomout");
            if (WORDS[STICKERS[index].word].zoomout.length > 0) {
              STICKERS[index].word = WORDS[STICKERS[index].word].zoomout[parseInt(Math.random()*WORDS[STICKERS[index].word].zoomout.length)];
            }
          }
          if (pinchScale < oldPinchScale) {
          console.log("zoomin");
            if (WORDS[STICKERS[index].word].zoomin.length > 0) {
              STICKERS[index].word = WORDS[STICKERS[index].word].zoomin[parseInt(Math.random()*WORDS[STICKERS[index].word].zoomin.length)];
            }
          }
        }
      
      }
      
      
    //  scaleTemp = Math.min(Math.max(scaleTemp, 0), STICKERS[index].zooms.length-1);
      
    //  STICKERS[index].zoom = scaleTemp;
      
      console.log('Change: zoom');
      
      changeState(index);
      
      if (!triggeredRotate && (ev.rotation > 160 && ev.rotation < 200) || (ev.rotation < -160 && ev.rotation > -200)) {
        triggeredRotate = true;
        
        console.log('Set antonym');
      }
    });
    
    /*
    mc.on('pinch', function(ev) {
      
      var scaleTemp = $sticker.data('scaleTemp');
      var scalePinch = (ev.scale/thresholdPinchScale);
      var scaleGot;
      
      if (scalePinch >= 1) {
        scaleGot = parseInt(Math.floor(ev.scale-1));
      }
      
      if (scalePinch < 1 && scalePinch >= .8) {
        scaleGot = -1;
      }
      
      if (scalePinch < .8 && scalePinch >= .6) {
        scaleGot = -2;
      }
      
      if (scalePinch < .6) {
        scaleGot = -3;
      }
      scaleTemp = scaleTemp+scaleGot;
      scaleTemp = Math.min(Math.max(scaleTemp, 0), STICKERS[index].zooms.length-1);
      
      STICKERS[index].zoom = scaleTemp;
      
    //  console.log('Change: zoom');
      
      changeState(index);
      
    //  console.log(ev.rotation);
      
      if (!triggeredRotate && (ev.rotation > 160 && ev.rotation < 200) || (ev.rotation < -160 && ev.rotation > -200)) {
        triggeredRotate = true;
        
        console.log('Set antonym');
      }
    });
    */
    
    function releasePress() {
      isPressed = false;
      triggeredRotate = false;
      $sticker.removeClass('isPressed');
    }
    
    function changeState() {    
      $sticker.attr('data-zoom', STICKERS[index].zoom);
      $sticker.attr('data-person', STICKERS[index].person);
      $sticker.attr('data-tense', STICKERS[index].tense);
      
      word = WORDS[STICKERS[index].word].tenses[STICKERS[index].tense][STICKERS[index].person];
      $inner.text(word);
    }
  }
});

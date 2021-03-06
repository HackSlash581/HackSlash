define(['phaser', 'LAMDAQuest'], function(Phaser, LAMDAQuest) {
  var game = LAMDAQuest.getLQ().game;

  var scriptable = {
    scriptableProperties: [],

    ifScript: null,

    intervalScript: null,

    intervalDelta: null,

    intervalEvent: null,

    displayName: null,

    intervalTimer: new Phaser.Timer(game, false),

    callScripts: function() {
      if(this.ifScript) {
        this.ifScript();
      }
      if(this.intervalScript) {
        if(intervalDeltaHasEllapsed) {
          this.intervalScript();
        }
      }
    },

    intervalDeltaHasEllapsed: function() {
      
    },

    addIntervalScript: function(script, delta) {
      this.intervalDelta = delta;
      this.intervalScript = script;
      this.intervalEvent = this.intervalTimer.add(delta, script, this);
    },

    removeIntervalScript: function() {
      this.intervalDelta = null;
      this.intervalScript = null;
      this.intervalTimer.remove(this.intervalEvent);
      this.intervalEvent = null;
    }
  };

  return scriptable;
});
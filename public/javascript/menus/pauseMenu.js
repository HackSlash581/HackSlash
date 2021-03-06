define([
  'phaser', 
  'LAMDAQuest',
  'scripting/script'
], function(Phaser, LAMDAQuest, Script) {
  var LQ = LAMDAQuest.getLQ();
  var pause = (function() {
    // private variables
    var darkRectangle;
    var wasdActive = true;
    var spaceActive = true;
    var numbersActive = true;

    // private methods
    function darkenScreen(game) {
      darkRectangle = game.add.graphics(0, 0);
      darkRectangle.lineStyle(1, 0x000000, 0.3);
      darkRectangle.beginFill(0x000000, 0.3);
      darkRectangle.drawRect(game.world.x, game.world.y, game.world.width, game.world.height);
      darkRectangle.endFill();
    }

    function testPausedInput(scriptedEntity) {
      var game = LQ.game;
      
      $('#scriptingModal').on('show.bs.modal', function(event) {
        $('#scriptingModal .modal-title').text('Scripting Pane for ' + scriptedEntity.displayName);
        $('#syntaxAlert').hide();
        game.paused = true;
        LQ.modalUp = true;
      });
      $('#scriptingModal').on('hidden.bs.modal', function(event) {
        game.paused = false;
        LQ.modalUp = false;
        $('#scriptingModal').find("input").val('').end()
      });
      
      $("#scriptingModal").modal().find("#objectProperties").html(createHtmlForProperties(scriptedEntity));

      $('#submitScript').click({objectRef: scriptedEntity}, submitScript);

      function submitScript(event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        var hackscript = new Script($('#script-text').val(), event.data.objectRef);
        $.ajax({
          type: 'POST',
          url: '/scripting/' + hackscript.hackscriptText,

          success: function(data, xhr) {
            var compiledHackScript = data;
            
            switch(hackscript.scriptType) {
              case 'assignment':
                var assignmentFunction = eval(compiledHackScript);
                assignmentFunction.call(hackscript.callingObject);
                break;
              case 'every':
                //TODO
                break;
              case 'if':
                //TODO
                break;
              default:
            }

            $('#syntaxAlert').hide();
            $('#scriptingModal').find("input").val('').end().modal('toggle');
          },

          error: function(jqXHR) {
            $('#syntaxAlert').html(jqXHR.responseText);
            $('#syntaxAlert').show();
          }
        });
      }
    }

    function createHtmlForProperties(objectRef) {
      var html = "<ul class='list-group'>",
          prop;
      for(var i = 0, len = objectRef.scriptableProperties.length; i < len; ++i) {
        prop = objectRef.scriptableProperties[i];
        if(prop in objectRef) {
          html += "<li class='list-group-item'>" + prop +
                  ":<span class='badge'>" + objectRef[prop] + 
                  "</span></li>";
        }
      }
      html += "</ul>";
      return html;
    } 

    function clearInput() {
      LQ.wasd.up.isDown = false;
      LQ.wasd.down.isDown = false;
      LQ.wasd.right.isDown = false;
      LQ.wasd.left.isDown = false;
    }
   
    function freezePlayer() {
      LQ.player.animations.stop();
      LQ.player.body.velocity.x = 0;
      LQ.player.body.velocity.y = 0;
    }
    
    //Called when the player is moused over in the pause menu.
    //It would be cool to float a little text box with the entity's 
    //name to make it more obvious that this entity is scriptable.
    function showName(player) {
      console.log(player.displayName);
    }

    function toggleWASDCapture() {
      if(wasdActive) {
        LQ.game.input.keyboard.removeKeyCapture(Phaser.Keyboard.W);
        LQ.game.input.keyboard.removeKeyCapture(Phaser.Keyboard.S);
        LQ.game.input.keyboard.removeKeyCapture(Phaser.Keyboard.A);
        LQ.game.input.keyboard.removeKeyCapture(Phaser.Keyboard.D);
        wasdActive = false;
      } else {
        LQ.game.input.keyboard.addKeyCapture(Phaser.Keyboard.W);
        LQ.game.input.keyboard.addKeyCapture(Phaser.Keyboard.S);
        LQ.game.input.keyboard.addKeyCapture(Phaser.Keyboard.A);
        LQ.game.input.keyboard.addKeyCapture(Phaser.Keyboard.D);
        wasdActive = true;
      }
    }

    function toggleNumbersCapture() {
      if(numbersActive) {
        LQ.game.input.keyboard.removeKeyCapture(Phaser.Keyboard.ONE);
        LQ.game.input.keyboard.removeKeyCapture(Phaser.Keyboard.TWO);
        LQ.game.input.keyboard.removeKeyCapture(Phaser.Keyboard.R);
        numbersActive = false;
      } else {
        LQ.game.input.keyboard.addKeyCapture(Phaser.Keyboard.ONE);
        LQ.game.input.keyboard.addKeyCapture(Phaser.Keyboard.TWO);
        LQ.game.input.keyboard.removeKeyCapture(Phaser.Keyboard.R);
        numbersActive = true;
      }
    }

    function toggleSpaceCapture() {
      if(spaceActive) {
        LQ.game.input.keyboard.removeKeyCapture(Phaser.Keyboard.SPACEBAR);
        spaceActive = false;
      } else {
        LQ.game.input.keyboard.addKeyCapture(Phaser.Keyboard.SPACEBAR);
        spaceActive = true;
      }
    }

    return {
      // public methods
      pauseGame: function(event) {
        var player = LQ.player;
       

        if(!LQ.globals.paused && !LQ.modalUp) {
          LQ.globals.paused = true;
          clearInput();
          darkenScreen(this.game);
          
          // Pause everything else we eventually add (projectiles, etc.)

          /********Need to do this for each scriptable entity*********/
          freezePlayer();
          player.bringToTop();
          player.alpha = 0;
          player.pauseTween = LQ.game.add.tween(player).to({alpha: 1}, 1000, Phaser.Easing.Linear.None, true, 0, 1000, true);
          player.inputEnabled = true;
          toggleWASDCapture();
          toggleSpaceCapture();
          toggleNumbersCapture();
          LQ.game.input.keyboard.removeKeyCapture(Phaser.Keyboard.C);
          player.events.onInputDown.add(testPausedInput, LQ);
          player.events.onInputOver.add(showName, LQ);
          /***********************************************************/
        } else if(!LQ.modalUp) {
          LQ.globals.paused = false;
          darkRectangle.destroy();
          //Stop the tweens for each entity
          player.pauseTween.stop();
          player.inputEnabled = false;
          player.events.onInputDown.remove(testPausedInput, LQ);
          player.alpha = 1;
          toggleWASDCapture();
          toggleSpaceCapture();
          toggleNumbersCapture();
          LQ.game.input.keyboard.addKeyCapture(Phaser.Keyboard.C);
        }
      }
    };
  }());

  return pause;
});

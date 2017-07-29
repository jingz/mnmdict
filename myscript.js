// var m; // global store meanings
// function get_more_result () {
//   console.log("get more result")
//   chrome.extension.sendRequest({'action':'get_more_result'},function  (data) {
//     console.log(data)
//   });
// }

// pin_up : pin the balloon on above the word
// m is message
// after_posted is function callback called after pined
function pin_up (m, after_posted) {
    var balloon = $("#bt_dummy");
    // setup balloon
    balloon.bt(m, {
        trigger: 'none',
        width: 250,
        positions: ['top'],
        // style
        padding: 10,
        margin: 0,
        spikeLength: 10,
        spikeGirth: 20,
        cornerRadius: 10,
        fill: 'rgba(255, 255, 0, .9)',
        strokeWidth: 1,
        strokeStyle: '#000',
        cssStyles: {
            color: '#000',
            zIndex: 9999,
            fontSize: "16px",
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";',
            textAlign: "left"
        },
        postShow: function(box){
          // disable link
          $(box).find("a").css({color: "black"}).click(function() { return false; });
          // callback
          if(after_posted) after_posted(box);
        }
      });

      balloon.btOn();
}

function pin_searching () {
    pin_up("<i>Searching...</i>");
}

// PinManager Class : Handle the group of meaning 
var PinManager = function(meanings, soundlist) {
    var self = this;
    this.meanings = meanings.map(w => {
        if (w.exact) {
            return w.desc
        } else {
            return `<span style='background-color: rgba(255, 255, 0, 0.5)'>${w.word}</span><br/>${w.desc}`
        }
    })
    this.soundlistTpl = '<div style="font-size: 0.7em; margin-bottom: 2px;">';
    for(var i in soundlist){
        var s = soundlist[i];
        if(typeof s.type == "string")
            this.soundlistTpl += "<a class='soundcheck' href='"+s.src+"'>"+s.type.toUpperCase()+" ▸ </a>"
    }
    this.soundlistTpl += '</div>';
    this.index = 0;
    this.n_words = meanings.length;

    // get more link method
    this.get_more_link = function  () {
        var remain = this.n_words - this.index - 1;
        return "<span style='diplay:block; float:right;'><a id='more_meaning' href='#'><b style='color: blue;'>&rarr; ("+remain+")</b></a></span>";
    }

    // show message
    this.show = function(m) {
        pin_up(m, function(box){
            // init event show more meanings
            $(box).find("#more_meaning").click(self.show_more);

            // init trigger for playing voice
            $(box).find(".soundcheck").click(function () {
                var href = $(this).attr("href");
                $("#sound_dummy").attr("src", href);
                return false;
            });
        });
    }

    // @click show_more event
    this.show_more = function() {
        var c = "<div>" +
                self.soundlistTpl + 
                self.meanings[++self.index] + 
                ( self.index < self.n_words-1 ? self.get_more_link() : '' ) +
                "</div>";
        self.show(c);
        return false;
    }

    // init content in balloon
    var c = "<div>" +
            this.soundlistTpl + 
            this.meanings[this.index] + 
            ( this.index < this.n_words-1 ? this.get_more_link() : '' ) +
            "</div>";
    this.show(c);
}

// Main --------------------------------------------------------------
// init UI
var dummyUI = '<div id="bt_dummy" style="position: absolute; text-align: left;"></div>';
$("body").append($(dummyUI));

// UI for play voice
var dummySound = '<iframe src="" id="sound_dummy" style="display:none;"></iframe>';
$("body").append($(dummySound));

// double click on text
$(document).dblclick(function (e) {
    // get seleted word from content
    var sNode = window.getSelection();
    var word = $.trim(sNode.toString());
    // avoid empty text
    if(word == "" ) return false;
    var orig = e.originalEvent;
    $("#bt_dummy").css({
      top: orig.pageY - 15,
      left: orig.pageX
    });

    // call API
    longdo_lookup(word, function(meanings, soundlist){ 
        // sending message to the popup
        chrome.runtime.sendMessage(
            null,
            { word: word, meanings: meanings, soundlist: soundlist },
            function(res) {
                console.log("loging history ok", res);
            }
        );

        new PinManager(meanings, soundlist)
    }, pin_searching);
});

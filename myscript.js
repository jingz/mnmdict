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
    var balloon = window.jqBtDummyContainer
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
            position: 'absolute',
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
          if(typeof after_posted === 'function') after_posted(box);
        }
      });

      balloon.btOn();
}

// PinManager Class : Handle the group of meaning 
var PinManager = function(meanings, soundlist) {
    var self = this;
    // mo meaning or no exactly matched word
    if (meanings.length === 0 || (meanings.filter(w => w.exact).length === 0)) {
        // not found notification
        pin_up(`<div style='text-align: center;'>
            <font color='red'>Sorry, not found literal meanings.</br>
            Please search by dict icon on your toolbar for feasible meanings
            </font>
            </div>`)
        return false;
    }

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
    this.get_more_link = function () {
        var remain = this.n_words - this.index - 1;
        return "<span style='diplay:block; float:right;'><a id='more_meaning' href='#'><b style='color: blue;'>&rarr; ("+remain+")</b></a></span>";
    }

    // show message
    this.show = function(m) {
        pin_up(m, function(box){
            // init event show more meanings
            $(box).find("#more_meaning").mouseup(self.show_more);

            // init trigger for playing voice
            $(box).find(".soundcheck").mouseup(function () {
                var href = $(this).attr("href");
                $("#sound_dummy").attr("src", href);
                return false;
            });
        });
    }

    // @click show_more event
    this.show_more = function () {
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

function extract_word_context (select_node) {
    // expend context level 1
    // seek first fullstop and halt seeking
    var front_part = select_node.focusNode.data.slice(0, select_node.focusOffset).split('.')
    var back_part = select_node.focusNode.data.slice(select_node.focusOffset).split('.')
    return `${front_part[front_part.length - 1].trim()} ${back_part[0].trim()}.` // context
}

// Main --------------------------------------------------------------
    // init UI
    $("body").append($( `<div id="bt_dummy"
                              style="position: absolute; text-align: left;"></div>`));
    // cached
    window.jqBtDummyContainer = $('#bt_dummy')

    // UI for play voice
    var dummySound = '<iframe src="" id="sound_dummy" style="display:none;"></iframe>';
    $("body").append($(dummySound));

    // mouseup for trigger searching
    // work with dbclick and manully text selection
    document.ondblclick = function (e) {
        // get seleted word from content
        let sNode = window.getSelection()
        let word = (sNode.toString() || '').trim()

        // avoid empty text and more than 2 words
        if (word === "" ) return false;
        if (word.split(/\s+/g).length > 2) return false;

        window.jqBtDummyContainer.css({
          top: e.pageY - 15,
          left: e.pageX
        });

        let context = extract_word_context(sNode)
        let from_site = sNode.focusNode.baseURI

        // call API
        longdo_lookup(word,
            function (meanings, soundlist, w, phonetic) { 
                // sending message to the popup
                chrome.runtime.sendMessage(null,
                    { word, meanings, soundlist, context, from_site, phonetic },
                    function(res) { console.log("loging history ok", res) });
                new PinManager(meanings, soundlist)
            }, 
            function () {
                // use timeout to queue this task after mouse click
                // to avoid closing the ballon before show a mesasge
                setTimeout(function () {
                    pin_up(`<i>Searching ...</i>`) 
                }, 0)
            });
    }

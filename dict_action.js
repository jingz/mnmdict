var api = "http://dict.longdo.com/mobile.php?search="
var cambrigde_api = "http://dictionary.cambridge.org/search/british/?utm_source=widget_searchbox_source&utm_medium=widget_searchbox&utm_campaign=widget_tracking";
var no_meaning_template = "<b id='no_mean'>Not found !</b>"

// custom selector
$.expr[':'].text_match = function  (obj, index, meta, stack) {
    var text = $(obj).text();
    // argument of selector
    var regexp = meta[meta.length-1];
    var r = new RegExp("^"+regexp+"$", "i");
    return r.test(text);
}

function log_word_history_from_background(req, sender, sendResponse) {
    window.log_word_history(req.word, req.meanings, req.soundlist);
    sendResponse({ result: "ok"});
}

// loggin word
function log_word_history(word, meanings, soundlist) {
    // gether first 3 meanings
    if(!/[A-Za-z]+/g.test(word)){
        console.info("not logging this word");
    }
    candidate_meanings = [];
    var i, m;
    for(i = 0; i < meanings.length && i < 3; i++){
        m = meanings[i]; 
        // expect meaning format like this
        // possible meaning format
        // [N] การทดสอบ, See also: การตรวจสอบ, Syn. trial, tryout
        if(/^\[/.test(m)) candidate_meanings.push($.trim(m.split(",")[0]));
        // (ไลคฺ'ลิฮูด) n. ความเป็นไปได้,ความน่าจะเป็นไปได้, <b>Syn.</b> possibility
        if(/^\(/.test(m)) candidate_meanings.push($.trim(m.split(")")[1]));
    }

    if(candidate_meanings.length == 0) return false;
    // voice
    var sound_uk, sound_us;
    if(soundlist.length > 0){
        var sound;
        for(i = 0; i < soundlist.length; i++ ){
            sound = soundlist[i];
            if(sound.type == "uk"){
                sound_uk = sound.src; 
            } 
            if(sound.type == "us"){
                sound_us = sound.src; 
            } 
        }
    }

    var w = new Wordlist({
        word: word.toLowerCase(),
        meaning: candidate_meanings,
        created_at: new Date()
    }, function() {
        this.save();
    });
}

function longdo_lookup(word, cb, bf, last_char, do_log) {
    var callee = arguments.callee;
    do_log = do_log || false;

    $.ajax({
        url: api + word,
        beforeSend: bf || function(){},
        error: function  () {
            cb({},"error");
        },
        success: function  (raw_html) {
            var tb = $("<div>"+raw_html+"</div>").find("tr:has(a:text_match('"+word+"'))")
            var meanings = [];
            var soundlist = []; // { type: 'uk', src: '...' }
            tb.each(function  () {
                // assume TR having img tag is sound button img
                var el = $(this).find("img");
                if(el.length > 0 ){
                    // finding a contain voice in href
                    var v = $(this).find("a[href*='voice']");
                    if(v.length > 0){
                        var link = v.attr("href");
                        var matches = /voice=(.*)&/i.exec(link);
                        // checking duplication type
                        for(var i in soundlist){
                            var s = soundlist[i]; 
                            // voice duplicated
                            if(s.type == matches[1]) return;
                        }
                        // add to list
                        soundlist.push({
                            type: matches[1],
                            src: link
                        });
                    }
                    // extract sound 
                    return;
                }
                var m = $(this).find("td:eq(1)").html()
                    // should contain 'See also' or 'Syn'
                    if(/see also|syn|ant|example/i.test(m)) 
                        meanings.push(m)
            });

            if(meanings.length == 0){
                // query again without filter
                tb.each(function  () {
                    // skip if has any image tag
                    var el = $(this).find("img");
                    if(el.length > 0 ) return;
                    var m = $(this).find("td:eq(1)").html();
                    meanings.push(m);
                });
            }

            // check result and wisely search more
            if(meanings.length > 0) {
                // log history
                if(do_log) log_word_history(word, meanings, soundlist);
                // return to callback
                cb(meanings, soundlist, word);
            } else {
                // if not found do
                // check if last char is 's' try to search without it
                // check if last chat is 'ed' do seach again
                if(last_char && last_char == 'd' && /e$/.test(word)){
                    word = word.substring(0, word.length-1);
                    longdo_lookup(word, cb, null, 'e');
                } else if(/s$/i.test(word)){
                    word = word.substring(0,word.length-1);
                    longdo_lookup(word, cb, null, 's')
                } else if(/ed$/i.test(word)){
                    word = word.substring(0,word.length-1);
                    longdo_lookup(word, cb, null, 'd')
                } else{
                    cb(["not found"], word);
                }

            }
            // send array of meaning to callback
            // cb(meanings ,word)
        }
    });
}

chrome.runtime.onMessage.addListener(function(r, sender, sendResponse) {
    window.log_word_history_from_background(r, sender, sendResponse);
});

// adding listener for external message
try {
    chrome.runtime.onMessageExternal.addListener(
        function(req, res, sendResponse) {
            // sending array of
            // { 
            //   meaning:
            //   word:
            // }
            var data = [];
            Wordlist.all(function(rs) {
                for(var i = 0; i < rs.length; i++){
                    data.push({ meaning: rs[i].meaning, word: rs[i].word});
                }
                sendResponse({ result: data });
            });

            // in order to able to send response
            // after this listener timeout
            return true;
        }
    );
} catch(err) {
    // do nothing
}

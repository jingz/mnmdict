if(window.location.protocol == "chrome-extension:") {
    var api = "http://dict.longdo.com/mobile.php?search=";
} else {
    var api = window.location.protocol + "//dict.longdo.com/mobile.php?search=";
}

var cambrigde_api = "http://dictionary.cambridge.org/search/british/?utm_source=widget_searchbox_source&utm_medium=widget_searchbox&utm_campaign=widget_tracking";
var no_meaning_template = "<b id='no_mean'>Not found !</b>"

// custom selector
$.expr[':'].text_match = function (obj, index, meta, stack) {
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
    // gether first 3 exactly matched meanings
    candidate_meanings = meanings.filter(m => m.exact)
    // candidate_meanings.splice(0, 3)
    if(candidate_meanings.length === 0) return false;

    let log_meanings = candidate_meanings.map(c => $(`<div>${c.desc}</div>`).text().trim() )
    console.log(log_meanings)
    // save looked up word into history
    var w = new Wordlist({
        word: word.toLowerCase(),
        meaning: log_meanings,
        created_at: new Date()
    }, function() {
        this.save();
    });

    // voice
    /*
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
    */
}

function transform_longdo_result (raw_html, word) {
    var results = []
    $("<div>" + raw_html + "</div>").find('table').each(function () {
        // get title
        let title = this.previousSibling.innerText.trim();
        let data = []
        $(this).find('tr').each(function () {
          let firstCol = $(this).find('td:eq(0)') // usually be the word
          let secondCol = $(this).find('td:eq(1)') // usually be description
           data.push({
              word: (firstCol.html() || '').trim(),
              desc: (secondCol.html() || '').trim(),
              exact: firstCol.text().trim().toUpperCase() === word.toUpperCase()
           })
        })

        results.push({ title, data })
    })

    // filter sources for enlish
    // 1. NECTEC Lexitron Dictionary EN-TH
    // 2. NECTEC Lexitron-2 Dictionary (TH-EN)
    filter_sources = ['NECTEC Lexitron Dictionary EN-TH', 'NECTEC Lexitron-2 Dictionary (TH-EN)']
    let secondary_sources = ['Hope Dictionary', 'Nontri Dictionary', 'Longdo Unapproved EN-TH']

    if (is_english(word)) {
        result = results.find(r => r.title === 'NECTEC Lexitron Dictionary EN-TH')
        if (!result) {
            // try searching in secondary sources

            secondary_results = results.filter(r => secondary_sources.includes(r.title))
            if (secondary_results.length > 0) {
                result = { data: [] }
                secondary_results.forEach(r => {
                  result.data = result.data.concat(r.data)
                })
            }
        }
    } else {
        result = results.find(r => r.title === 'NECTEC Lexitron-2 Dictionary (TH-EN)')
        if (result) {
            // clean up desc for thai
            result.data = result.data.map(r => {
                r.desc = r.desc.replace(/,?\s?<b>Example:.*/g, '')
                return r
            })
            // merge with eng
            let en_dict = results.find(r => r.title === 'NECTEC Lexitron Dictionary EN-TH')
            if (en_dict)
            result.data = result.data.concat(en_dict.data.map(r => {
                // swtich word and meaning for th-en
                return {
                    word: $("<div>" + r.desc + "</div>").text().split(',')[0],
                    desc: r.word,
                    exact: r.exact
                }
            }) || [])
        } 
    }

    if (result) {
        // clean up desc for NECTEC
        result.data = result.data.map(r => {
            r.desc = r.desc.replace(/<b>see also:<\/b>/ig, '')
            r.desc = r.desc.replace(/<b>syn.<\/b>/ig, '<br/><b>Syn.</b>')
            r.desc = r.desc.replace(/<b>ant.<\/b>/ig, '<br/><b>Ant.</b>')
            return r
        })
    }

    // { title: ..., data: ...}
    return result || { data: [] }
}

function is_english (word) {
    return word.split('').every(w => w.charCodeAt() <= 122) // 'z'
}

function longdo_lookup(word, cb, bf, last_char, do_log) {
    do_log = do_log || false;

    $.ajax({
        url: api + word,
        beforeSend: bf || function(){},
        error: function  () {
            cb({},"error");
        },
        success: function  (raw_html) {
            // tranform result
            var tresult = transform_longdo_result(raw_html, word)
            // var tb = $("<div>"+raw_html+"</div>").find("tr:has(a:text_match('"+word+"'))")
            var meanings = [];
            var soundlist = []; // { type: 'uk', src: '...' }
            /*
            tb.each(function () {
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
                    // determine that this row is meaning row
                    // should contain 'See also' or 'Syn'
                    if(/see also|syn|ant|example/i.test(m)) 
                        meanings.push(m)
            }); */

            /*
            if(meanings.length == 0){
                // query again without filter
                tb.each(function () {
                    // skip if has any image tag
                    var el = $(this).find("img");
                    if(el.length > 0 ) return;
                    var m = $(this).find("td:eq(1)").html();
                    meanings.push(m);
                });
            }
            */

            // check result and wisely search more
            if(tresult.data.length > 0) {
                // log history
                if(do_log) log_word_history(word, tresult.data, soundlist);
                // return to callback renderer or ballon
                cb(tresult.data, soundlist, word);
            } else {
                // if not found do
                // check if last char is 's' try to search without it
                // check if last chat is 'ed' do seach again
                if(last_char && last_char == 'd' && /e$/.test(word)){
                    word = word.substring(0, word.length-1);
                    longdo_lookup(word, cb, null, 'e');
                } else if(/s$/i.test(word)){
                    word = word.substring(0, word.length-1);
                    longdo_lookup(word, cb, null, 's')
                } else if(/ed$/i.test(word)){
                    word = word.substring(0, word.length-1);
                    longdo_lookup(word, cb, null, 'd')
                } else{
                    cb([], [], word);
                }
            }
        }
    });
}

chrome.runtime.onMessage.addListener(function(r, sender, sendResponse) {
    window.log_word_history_from_background(r, sender, sendResponse);
});

// adding listener from ballon message
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
} catch(err) { void(0); }

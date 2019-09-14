if(window.location.protocol == "chrome-extension:") {
    var api = "http://dict.longdo.com/mobile.php?search=";
} else if (window.location.protocol === 'moz-extension:') {
    var api = "http://dict.longdo.com/mobile.php?search=";
} else {
    var api = window.location.protocol + "//dict.longdo.com/mobile.php?search=";
}

var cambrigde_api = "http://dictionary.cambridge.org/search/british/?utm_source=widget_searchbox_source&utm_medium=widget_searchbox&utm_campaign=widget_tracking";
var longman_host = 'https://www.ldoceonline.com'
var longman_api = 'https://www.ldoceonline.com/dictionary/'
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
    window.log_word_history(req.word, req.meanings, req.soundlist, req.context, req.from_site, req.phonetic);
    sendResponse({ result: "ok"});
}

// loggin word
function log_word_history(word, meanings, soundlist, context, from_site, phonetic) {
    candidate_meanings = meanings.filter(m => m.exact)
    if(candidate_meanings.length === 0) return false;

    let log_meanings = candidate_meanings.map(c => $(`<div>${c.desc}</div>`).text().trim() )

    let sound_us = soundlist.find(s => s.type == 'us') || ''
    if (sound_us) sound_us = sound_us.src

    let sound_uk = soundlist.find(s => s.type == 'uk') || ''
    if (sound_uk) sound_uk = sound_uk.src

    // save looked up word into history
    var w = new Wordlist({
        word: word.toLowerCase(),
        meaning: log_meanings,
        context,
        from_site,
        phonetic,
        sound_us,
        sound_uk,
        is_english: is_english(word),
        created_at: new Date()
    }, function() {
        this.save();
    });
}

function transform_longdo_result (raw_html, word) {
    var results = []
    $("<div>" + raw_html + "</div>").find('table').each(function () {
        // get dictionary source title
        let title = this.previousSibling.innerText.trim();
        let data = []
        $(this).find('tr').each(function () {
          let firstCol = $(this).find('td:eq(0)') // assume to be the word
          let secondCol = $(this).find('td:eq(1)') // assume to be description
           data.push({
              word: (firstCol.html() || '').trim(),
              desc: (secondCol.html() || '').trim(),
              exact: firstCol.text().trim().toUpperCase() === word.toUpperCase()
           })
        })

        results.push({ title, data })
    })

    // filter sources for english
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
            r.desc = r.desc.replace(/<a\shref.*mp3.*border="0"><\/a>/ig, '')
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

    // search for phonetic and voice
    let longmanSuccessToken = false
    let phonetic = ''
    let ameSrc = ''
    let breSrc = ''
    if (is_english(word)) {
        chrome.runtime.sendMessage(null, {
          type: 'lookup',
          ajaxOptions: {
            url: longman_api + word,
            contentType: 'text/html',
            crossDomain: true,
            withCredentials: true,
          }
        }, function (res) {
              longmanSuccessToken = true
              let raw = $('<div>' + res + '</div>')
              let content = raw.find('.entry_content')
              let hypen = raw.find('.HYPHENATION')
              let proncodes = raw.find('.PronCodes:last')
              let ameVoice = raw.find('span.amefile') // american
              let breVoice = raw.find('span.brefile') // bretish

              if (proncodes.length > 0) {
                  phonetic = proncodes.text()
              }

              if (ameVoice) {
                  ameSrc = ameVoice.attr('data-src-mp3')
              }

              if (breVoice) {
                  breSrc = breVoice.attr('data-src-mp3')
              }
        });
    } else {
        longmanSuccessToken = true
    }

    // call before send action
    if (bf) bf();

    chrome.runtime.sendMessage(null, {
      type: 'lookup',
      ajaxOptions: {
        url: api + word,
        crossDomain: true,
        withCredentials: true,
        contentType: 'text/html'
      }
    }, function (raw_html) {
        // transform result
        var tresult = transform_longdo_result(raw_html, word)
        // var tb = $("<div>"+raw_html+"</div>").find("tr:has(a:text_match('"+word+"'))")

        // check result and wisely search more
        if(tresult.data.length > 0) {
            // log history with context and from site is null
            // return to callback renderer or balloon
            let jointTask = setInterval(() => {
                if (longmanSuccessToken) {
                    let soundlist = []; // { type: 'uk', src: '...' }
                    if (ameSrc) soundlist.push({ type: 'us', src: ameSrc })
                    if (breSrc) soundlist.push({ type: 'uk', src: breSrc })

                    if(do_log) log_word_history(word, tresult.data, soundlist, null, null, phonetic);
                    cb(tresult.data, soundlist, word, phonetic);
                    clearInterval(jointTask)
                }
            }, 50)
        } else {
            // if not found do guessing
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
                cb([], [], word, phonetic);
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

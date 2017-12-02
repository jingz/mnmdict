// render function for searching results in popup
function smart_renderer (wordlist, soundlist=[], word_filter, phonetic) {
    if (wordlist.length > 0) {
        let meanings = wordlist.map(w => {
            if (w.exact) {
                return `<li style='background-color: rgba(255, 255, 0, 0.5)'>${w.desc}</li>`
            } else {
                return `<li style='background-color: rgba(230, 230, 230, 0.5)'><span style='background-color: rgba(255, 255, 0, 0.5)'>${w.word}</span><br/>${w.desc}</li>`
            }
        })
        $("#content").html("<ul class='meaning-list'>" + meanings.join('<hr/>') + "</ul>");
    }
    else $("#content").html(no_meaning_template);

    soundlist.forEach(s => {
        $('#play_' + s.type).show()
        $('#sound_' + s.type).attr('src', s.src)  // us , uk
    })

    $('#phoncodes').html(phonetic)
    // init event for newly-appended a elements
    init_link_action();
}

function init_link_action() {
    $("#content").find("a").each(function() {
        var href = $(this).attr("href");
        // filter sound link
        $(this).click(function() {
          var w = $(this).text();
          $("#param").val(w);
          longdo_lookup(w, smart_renderer, render_waiting);
        });
    });
}

// beforeSend
function render_waiting () {
    $("#content").html("Searching ...");
    // $("#soundlist").html("");
    $('#play_us').hide()
    $('#play_uk').hide()
    $("#phoncodes").html("");
}

// document loaded
$(document).ready(function  () {
    // add handler for input
    window.init_db();

    // Autocomplete callback
    function processJSONSuggest(sresult, cnt) {
        // sresult = [{ "w": ... , "d": .... , "s": ... , "id": ... }]
        let data = [];
        for(i = 0; i < sresult.length; i++){
            if (sresult[i].w) {
                data.push("<li class='possible-items'><a href='#'>" + sresult[i].d + '</a></li>');
            }
        }
        $("#content").html("<ol class='possible-list'>" + data.join("") + "</ol>");
        init_link_action();
    }

    // autocomplete
    $("#param").keyup(function  (e) {
        // reset to normal color
        $(this).css({color:"#333"})
        // if user press enter then do seach
        var word = $(this).val();
        if(e.keyCode == 13){
          longdo_lookup(word.trim(), smart_renderer, render_waiting, null, true);
        } else if(word.length >= 3){
            // source : http://search.longdo.com/BWTSearch/HeadSearch?json=1&ds=head&num=20&count=7&key=rigor
            $.ajax({
                url: "http://search.longdo.com/BWTSearch/HeadSearch?json=1&ds=head&num=20&count=7&key=" + word,
                success: function(res) {
                    // it will call processJSONSuggest
                    eval(res);
                }
            });
        }
    });

    // set focus to input
    $("#param").focus();

    // init play pronounce
    $('.play_voice').hide()
    $('.play_voice').click(function () {
        // audio tag
        var audio = $(this).next()[0]
        audio.load()
        audio.play()
    })
});

// SYNC wordlist
/*
var lastSyncId = +window.localStorage.getItem(window.ENV.SYNC_ID_KEY)
if (typeof lastSyncId !== 'number') {
    // init  last_sync_id variable
    window.localStorage.setItem(ENV.SYNC_ID_KEY, 0)
    lastSyncId = 0
}

Wordlist.find_by_sql('select * from wordlist where id > ?;', [lastSyncId] , rec => {
    if (rec[0]) {
        $.ajax({
            url: 'http://128.199.210.186/wordlog/create',
            data: JSON.stringify({ logs: rec.map(r => {
                return {
                    context: r.context,
                    meaning: r.meaning,
                    word: r.word,
                    site_url: r.from_site,
                    sound_uk: r.sound_uk,
                    sound_us: r.sound_us,
                    is_english: r.is_english,
                    phonetic: r.phonetic,
                    searched_at: new Date(r.created_at)
                }
            })}),
            contentType: 'application/json',
            type: 'POST',
            error (eres) {
                console.error(eres)
            },
            success (res) {
                let lastRec = rec.slice(-1)[0]
                window.localStorage.setItem(ENV.SYNC_ID_KEY, lastRec.id)
            }
        })
    } else {
        console.log('nothing to sync', rec)
    }
})
*/

// google analytics
// var _gaq = _gaq || [];
// _gaq.push(['_setAccount', 'UA-103581133-1']);
// _gaq.push(['_trackPageview']);

// (function() {
//   var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
//   ga.src = 'https://ssl.google-analytics.com/ga.js';
//   var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
// })();

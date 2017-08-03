// render function for searching results in popup
function smart_renderer (wordlist, soundlist, word_filter) {
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
    $("#soundlist").html("");
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
            // console.log(sresult[i])
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
});

// google analytics
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-103581133-1']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

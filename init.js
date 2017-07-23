// Longdo dictionary API

// render
// passing as callback to longdo_lookup funciton
function renderer(meanings, soundlist, word_filter) {
    // hardcode to filter output from longdo html return format
    // extract only value that match the word filter from the result
    // render to content
    if(meanings.length > 0) $("#content").html(meanings.join('<hr/>'));
    else $("#content").html(no_meaning_template);
    // inform that the returned meanings result from the nearest word
    var old_val = $("#param").val();
    if(old_val != word_filter) $("#param").val(word_filter);//.css({color:"red"})
            
    // init event for newly-appended a elements
    init_link_action();

    for(var i in soundlist){
        var s = soundlist[i];
        var el = $("<a class='soundcheck' href='"+s.src+"'>"+s.type.toUpperCase()+" ▸ </a>").appendTo($("#soundlist"));
    }

    $(".soundcheck").each(function  () {
        $(this).click(function  () {
            var href = $(this).attr("href");
            $("#soundframe").attr("src", href);
            return false;
        });
    });

}

function init_link_action() {
    $("#content").find("a").each(function() {
        var href = $(this).attr("href");
        // filter sound link
        $(this).click(function() {
          var w = $(this).text();
          $("#param").val(w);
          longdo_lookup(w, renderer, render_waiting);
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
            console.log(sresult[i])
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
          longdo_lookup($.trim(word), renderer, render_waiting, null, true);
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


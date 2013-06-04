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
    if(old_val != word_filter) $("#param").val(word_filter).css({color:"red"})
            
    // init event for newly-appended a elements

    $("#content").find("a").each(function() {
        var href = $(this).attr("href");
        // filter sound link
        $(this).click(function() {
          var w = $(this).text();
          $("#param").val(w);
          longdo_lookup(w, renderer, render_waiting);
        });
    });

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

// beforeSend
function render_waiting () {
    $("#content").html("Searching ...");
    $("#soundlist").html("");
}

// document loaded
$(document).ready(function  () {
    // add handler for input
    $("#param").keydown(function  (e) {
        // reset to normal color
        $(this).css({color:"#333"})
        // if user press enter then do seach
        if(e.keyCode == 13){
          var word = $(this).val();
          longdo_lookup($.trim(word), renderer, render_waiting);
          // $(this).blur();
        }
    });
    //
    // set focus to input
    $("#param").focus();
});

// chrome.extension.onRequest.addListener(function  (r,s,c) { });


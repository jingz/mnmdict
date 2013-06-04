
    var api = "http://dict.longdo.com/mobile.php?search="
    var cambrigde_api = "http://dictionary.cambridge.org/search/british/?utm_source=widget_searchbox_source&utm_medium=widget_searchbox&utm_campaign=widget_tracking";
    var no_meaning_template = "<b id='no_mean'>Not found !</b>"
  
    // custom selector
    $.expr[':'].text_match = function  (obj, index, meta, stack) {
      var text = $(obj).text();
      // argument of selector
      var regexp = meta[meta.length-1];
      eval("var r = " + regexp);
      return r.test(text);
    }
    
    function longdo_lookup (word,cb,bf,last_char) {
      var callee = arguments.callee;
      $.ajax({
        url: api + word,
        beforeSend: bf || function(){},
        error: function  () {
          cb({},"error");
        },
        success: function  (raw_html) {
          var tb = $("<div>"+raw_html+"</div>").find("tr:has(a:text_match('/^"+word+"$/i'))")
          var meanings = []
          tb.each(function  () {
            // skip if has any image tag
            var el = $(this).find("img")
            if(el.length > 0 ) return;
            var m = $(this).find("td:eq(1)").html()
            // should contain 'See also' or 'Syn'
            if(/see also|syn|ant|example/i.test(m)) meanings.push(m)
          });
          
          if(meanings.length == 0){
            // query again without filter
            tb.each(function  () {
              // skip if has any image tag
              var el = $(this).find("img")
              if(el.length > 0 ) return;
              var m = $(this).find("td:eq(1)").html()
              meanings.push(m)
            });
          }
          
          // check result and wisely search more
          if(meanings.length > 0) cb(meanings ,word)
          else {
            // if not found do
            // check if last char is 's' try to search without it
            // check if last chat is 'ed' do seach again
	    if(last_char && last_char == 'd' && /e$/.test(word)){
	      word = word.substring(0,word.length-1)
	      longdo_lookup(word,cb,null,'e') 
	    }
	    else if(/s$/i.test(word)){
              word = word.substring(0,word.length-1);
              longdo_lookup(word,cb,null,'s')
            }
            else if(/ed$/i.test(word)){
              word = word.substring(0,word.length-1);
              longdo_lookup(word,cb,null,'d')
            }
            else{
              cb(["not found"] ,word)
            }
          }
          // send array of meaning to callback
          // cb(meanings ,word)
        }
      });
      
      // $.ajax({
      //   url: cambrigde_api,
      //   type: "POST",
      //   data: {q: "test"},
      //   success: function  (res) {
      //     $("#footer").html(res);
      //     console.log(res);
      //   }
      // });
    }

    // TODO request to cancel ajax    

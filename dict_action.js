
    var api = "http://dict.longdo.com/mobile.php?search="
    var longdo_filter = /see also|syn|ant|example/i
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

    function longdo_lookup (word,cb,bf) {
      var q_word = word
      if(/(es|ed|ly)$/i.test(word)){
        q_word = word.substring(0,word.length-2)
      }
      else if(/s$/i.test(word)){
        q_word = word.substring(0,word.length-1)
      }

      $.ajax({
        url: api + q_word,
        beforeSend: bf || function(){},
        error: function  () {
          cb({},"error");
        },
        success: function  (raw_html) {
          var tb = $("<div>"+raw_html+"</div>").find("tr:has(a:text_match('/^"+word+"$/i'))")
	  // not modify word
	  if(word.length == q_word.length)
	    var suggest_regexp = "/^" + q_word + ".+$/i"
	  else
	    var suggest_regexp = "/^" + q_word + ".{0," + (word.length - q_word.length) + "}$/i"

          var near_tb = $("<div>"+raw_html+"</div>").find("tr:has(a:text_match('" + suggest_regexp + "'))")
          var meanings = []
	  // search for exactly word
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
              if(el.length > 0 ) return; // skip talking button img
              var m = $(this).find("td:eq(1)").html()
              meanings.push(m)
            });
          }

	  // if sill not found
	  // search near meaning
	  if(meanings.length == 0){
	    near_tb.each(function() {
	      var el = $(this).find("img")
	      if(el.length > 0 ) return;
	      var m = $(this).find("td:eq(1)").html();
	      if(longdo_filter.test(m)){
	        // make result for suggestion
	        var near_w = $(this).find("td:eq(0)").html()
		// prepend near word
		var m = near_w + "<br>" + m;
		meanings.push(m)	    
	      }
	    })
	  }
          
          // check result and wisely search more
          if(meanings.length > 0) cb(meanings ,word)
	  else cb(["not found"] ,word)
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

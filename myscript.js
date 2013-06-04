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
  function pin_up (m,after_posted) {
    var balloon = $("#bt_dummy")
    // setup balloon
    balloon.bt(m,{
	    trigger: 'none',
	    width: 200,
	    positions: ['top'],
	    // style
	    padding: 10,
		  margin: 0,
	    spikeLength: 10,
	    spikeGirth: 20,
	    cornerRadius: 20,
	    fill: 'rgba(255, 255, 0, .9)',
	    strokeWidth: 2,
	    strokeStyle: '#000',
	    cssStyles: {
				color: '#000',
				zIndex: 9999,
				fontSize: "14px",
				fontFamily: "Bookman Old Style",
			  textAlign: "left"
			},
	    postShow: function(box){
	      // disable link
	      $(box).find("a")
					.css({color: "black"})
					.click(function  () {
						return false;
					})
	      // callback
	      if(after_posted) after_posted(box);
	    }
	  });
    balloon.btOn();
  }
  
  function pin_searching () {
    pin_up("<i>Searching...</i>")
  }
  
  // PinManager Class : Handle the group of meaning 
  var PinManager = function  (meanings) {
    var self = this;
    this.meanings = meanings;
    this.index = 0;
    this.n_words = meanings.length;
    
    // get more link method
    this.get_more_link = function  () {
      var remain = this.n_words - this.index - 1;
      return "<span style='diplay:block;float:right;'><a id='more_meaning' href='#'><b>&rarr; ("+remain+")</b></a></span>";
    }
    
    // show message
    this.show = function  (m) {
      pin_up(m,function(box){
				$(box).find("#more_meaning").click(self.show_more)
      })
    }
    
    // show_more
    this.show_more = function  () {
      var c = self.meanings[++self.index] + ( self.index < self.n_words-1 ? self.get_more_link() : '' );
      self.show(c)
      return false;
    }
    
    // init
    var c = this.meanings[this.index] + ( this.index < this.n_words-1 ? this.get_more_link() : '' );
    this.show(c)
  }
  
  // Main 
  // init UI
  var dummyUI = '<div id="bt_dummy" style="position:absolute;"></div>';
  $("body").append($(dummyUI))

  // double click on text
  $(document).dblclick(function  (e) {
    // get seleted word from content
    var sNode = window.getSelection();
    var word = $.trim(sNode.toString());
    // avoid empty text
    if(word == "" ) return false;
    $("#bt_dummy").css({
      top: e.pageY - 15,
      left: e.pageX
    });

    // call API
    longdo_lookup(word,
		  function  (meanings) { new PinManager(meanings) },
		  pin_searching
		);
  });

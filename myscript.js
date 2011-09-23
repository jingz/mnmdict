  // var m; // global store meanings
  // function get_more_result () {
  //   console.log("get more result")
  //   chrome.extension.sendRequest({'action':'get_more_result'},function  (data) {
  //     console.log(data)
  //   });
  // }
  
  var PinManager = function  (meanings) {
    var self = this;
    this.meanings = meanings;
    this.index = 0;
    this.n_words = meanings.length;
    this.MORE_LINK = 
    
    this.get_more_link = function  () {
      var remain = this.n_words - this.index - 1;
      return "<span style='diplay:block;float:right;'><a id='more_meaning' href='#'><b>&rarr; ("+remain+")</b></a></span>";
    }
    
    this.show = function  (m) {
      var balloon = $("#bt_dummy")
      // TODO set z-index to 9999
      balloon.bt(m,{
                      trigger: 'none',
                      width: 200,
                      positions: ['top'],
                      // style
                      padding: 10,
                      spikeLength: 10,
                      spikeGirth: 20,
                      cornerRadius: 20,
                      fill: 'rgba(255, 255, 0, .9)',
                      strokeWidth: 2,
                      strokeStyle: '#000',
                      cssStyles: {color: '#000'},
                      postShow: function(box){
                        // disable link
                        $(box).find("a").click(function  () {
                          return false;
                        })
                        
                        $(box).find("#more_meaning").click(self.show_more)
                        return false;
                      }
                    });
      balloon.btOn();
    }
    
    this.show_more = function  () {
      var c = self.meanings[++self.index] + ( self.index < self.n_words-1 ? self.get_more_link() : '' );
      self.show(c)
      return false;
    }
    
    // init
    var c = this.meanings[this.index] + ( this.index < this.n_words-1 ? this.get_more_link() : '' );
    this.show(c)
  }
  
  function pin_up (m) {
    var balloon = $("#bt_dummy")
    // var m = meanings;
    // var word = m[index];
    var more_link = "<span style='diplay:block; margin-left:0.3em;'><a id='more_meaning' href='#'><b>more</b></a></span>";
    
    balloon.bt(m,{
                    trigger: 'none',
                    width: 200,
                    positions: ['top'],
                    // style
                    padding: 10,
                    spikeLength: 10,
                    spikeGirth: 20,
                    cornerRadius: 20,
                    fill: 'rgba(255, 255, 0, .9)',
                    strokeWidth: 2,
                    strokeStyle: '#000',
                    cssStyles: {color: '#000'},
                    postShow: function(box){
                      // disable link
                      $(box).find("a").click(function  () {
                        return false;
                      })
                      
                      // $(box).find("#more_meaning").click(next_meaning)
                    }
                  });
    balloon.btOn();
  }
  
  function pin_searching () {
    pin_up("<i>Searching...</i>")
  }
  
  // Main
  // $(document).ready(function  () {
    var dummyUI = '<div id="bt_dummy" style="font-size:14px;"></div>';
    $("body").append($(dummyUI))
    $("#bt_dummy").css({ position: "absolute"})
    // double click on text
    $(document).dblclick(function  (e) {
      var sNode = window.getSelection();
      var word = $.trim(sNode.toString());
      // avoid empty text
      if(word == "" ) return false;
      $("#bt_dummy").css({
        top: e.pageY - 15,
        left: e.pageX
      });
      var m; // memorize the meanings 
      longdo_lookup(word,function  (meanings) { new PinManager(meanings) },pin_searching);
      // longdo_lookup(word,function  (meanings) {
      //   m = meanings[0]
      //   if(m) new PinManager(meanings)
      //   else {
      //     // if not found do
      //     // check if last char is 's' try to search without it
      //     // check if last chat is 'ed' do seach again
      //     if(/s$/i.test(word)){
      //       word = word.substring(0,word.length-1);
      //       longdo_lookup(word,arguments.callee)
      //     }
      //     else if(/ed$/i.test(word)){
      //       word = word.substring(0,word.length-2);
      //       longdo_lookup(word,arguments.callee)
      //     }
      //     else{
      //       pin_up("not found");
      //     }
      //   }
      // },pin_searching);
      
    });
    
    // TODO hilight on text
    
  // }); // end document ready
